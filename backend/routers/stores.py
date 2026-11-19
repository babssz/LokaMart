from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import Category, Store, User
from schemas import StoreRegistration, StoreRegistrationOut, StoreOut, UserOut

router = APIRouter(prefix="/stores", tags=["Toko"])


@router.post("", response_model=StoreRegistrationOut, status_code=201)
def register_store(
    data: StoreRegistration,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role != "pembeli":
        raise HTTPException(status_code=409, detail="Akun ini sudah terdaftar sebagai penjual")

    if db.scalar(select(Store).where(Store.user_id == user.user_id)):
        raise HTTPException(status_code=409, detail="Toko untuk akun ini sudah terdaftar")

    if db.get(Category, data.category_id) is None:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan")

    store = Store(
        user_id=user.user_id,
        category_id=data.category_id,
        store_name=data.store_name.strip(),
        description=data.description.strip(),
        address=data.address.strip(),
    )
    user.role = "penjual"
    db.add(store)
    db.commit()
    db.refresh(store)
    db.refresh(user)

    return StoreRegistrationOut(store=StoreOut.model_validate(store), user=UserOut.model_validate(user))
