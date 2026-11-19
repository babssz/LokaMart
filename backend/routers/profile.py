import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, require_role
from models import Store, User
from schemas import PasswordChange, ProfileUpdate, StoreOut, StoreUpdate, UserOut
from security import hash_password, verify_password

router = APIRouter(prefix="/profile", tags=["Profil"])
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads" / "profiles"
MAX_PHOTO_SIZE = 2 * 1024 * 1024


def _detect_photo_ext(data: bytes) -> str | None:
    if data.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    return None


def _delete_profile_photo(photo_url: str | None) -> None:
    if photo_url and photo_url.startswith("/uploads/profiles/"):
        (UPLOAD_DIR / Path(photo_url).name).unlink(missing_ok=True)


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


@router.post("/photo", response_model=UserOut)
async def upload_profile_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    data = await file.read(MAX_PHOTO_SIZE + 1)
    if len(data) > MAX_PHOTO_SIZE:
        raise HTTPException(status_code=413, detail="Ukuran foto maksimal 2 MB")

    ext = _detect_photo_ext(data)
    if ext is None:
        raise HTTPException(status_code=400, detail="Format foto harus JPG atau PNG")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / filename).write_bytes(data)

    old_photo = user.photo_url
    user.photo_url = f"/uploads/profiles/{filename}"
    db.commit()
    db.refresh(user)
    _delete_profile_photo(old_photo)
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