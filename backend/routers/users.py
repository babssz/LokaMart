from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_role
from models import User
from schemas import UserListOut, UserOut, UserStatusUpdate

router = APIRouter(prefix="/users", tags=["Pengguna"])


@router.get("", response_model=UserListOut)
def list_users(
    q: str | None = None,
    role: Literal["pembeli", "penjual", "admin"] | None = None,
    is_active: bool | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    conditions = []
    if q:
        pattern = f"%{q}%"
        conditions.append(or_(User.name.ilike(pattern), User.email.ilike(pattern)))
    if role:
        conditions.append(User.role == role)
    if is_active is not None:
        conditions.append(User.is_active == is_active)

    total = db.scalar(select(func.count()).select_from(User).where(*conditions))
    users = db.scalars(
        select(User)
        .where(*conditions)
        .order_by(User.user_id)
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    return UserListOut(
        items=[UserOut.model_validate(u) for u in users],
        total=total,
        page=page,
        limit=limit,
    )


@router.patch("/{user_id}/status", response_model=UserOut)
def set_user_status(
    user_id: int,
    data: UserStatusUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")
    if user.user_id == admin.user_id:
        raise HTTPException(status_code=400, detail="Tidak bisa mengubah status akunmu sendiri")
    if user.role == "admin":
        raise HTTPException(status_code=403, detail="Akun admin tidak bisa diubah")

    user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return user