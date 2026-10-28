from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import Cart, Store, User
from schemas import LoginRequest, RegisterRequest, TokenOut, UserOut
from security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    if data.role == "penjual" and not data.store_name:
        raise HTTPException(status_code=422, detail="Nama toko wajib diisi untuk penjual")

    email = data.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status_code=409, detail="Email sudah terdaftar")

    user = User(
        name=data.name,
        email=email,
        password=hash_password(data.password),
        role=data.role,
        phone=data.phone,
        address=data.address,
    )
    db.add(user)
    db.flush()  # supaya user_id sudah terisi

    if data.role == "penjual":
        db.add(Store(user_id=user.user_id, store_name=data.store_name, address=data.address))
    else:
        db.add(Cart(user_id=user.user_id))

    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=TokenOut)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email.lower()))
    if user is None or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Email atau password salah")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Akun kamu dinonaktifkan")

    token = create_access_token(user.user_id, user.role)
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user