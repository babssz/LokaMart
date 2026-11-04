from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, require_role
from models import Store, User
from schemas import PasswordChange, ProfileUpdate, StoreOut, StoreUpdate, UserOut
from security import hash_password, verify_password

router = APIRouter(prefix="/profile", tags=["Profil"])


def _get_own_store(db: Session, user: User) -> Store:
    store = db.scalar(select(Store).where(Store.user_id == user.user_id))
    if store is None:
        raise HTTPException(status_code=404, detail="Toko tidak ditemukan")
    return store


# ---------- Semua role ----------
@router.put("", response_model=UserOut)
def update_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user.name = data.name
    user.phone = data.phone
    user.address = data.address
    db.commit()
    db.refresh(user)
    return user


@router.put("/password", status_code=204)
def change_password(
    data: PasswordChange,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not verify_password(data.old_password, user.password):
        raise HTTPException(status_code=400, detail="Password lama salah")

    user.password = hash_password(data.new_password)
    db.commit()


# ---------- Penjual: profil toko ----------
@router.get("/store", response_model=StoreOut)
def get_my_store(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("penjual")),
):
    return _get_own_store(db, user)


@router.put("/store", response_model=StoreOut)
def update_my_store(
    data: StoreUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("penjual")),
):
    store = _get_own_store(db, user)
    store.store_name = data.store_name
    store.description = data.description
    store.address = data.address
    db.commit()
    db.refresh(store)
    return store