from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_role
from models import Category, Product, User
from schemas import CategoryCreate, CategoryOut

router = APIRouter(prefix="/categories", tags=["Kategori"])


def _name_taken(db: Session, name: str, exclude_id: int | None = None) -> bool:
    query = select(Category.category_id).where(
        func.lower(Category.category_name) == name.lower()
    )
    if exclude_id is not None:
        query = query.where(Category.category_id != exclude_id)
    return db.scalar(query) is not None


@router.get("", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.scalars(select(Category).order_by(Category.category_name)).all()


@router.post("", response_model=CategoryOut, status_code=201)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    if _name_taken(db, data.category_name):
        raise HTTPException(status_code=409, detail="Nama kategori sudah ada")

    category = Category(category_name=data.category_name, description=data.description)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    data: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan")
    if _name_taken(db, data.category_name, exclude_id=category_id):
        raise HTTPException(status_code=409, detail="Nama kategori sudah ada")

    category.category_name = data.category_name
    category.description = data.description
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan")

    has_products = db.scalar(
        select(Product.product_id).where(Product.category_id == category_id).limit(1)
    )
    if has_products:
        raise HTTPException(
            status_code=409, detail="Kategori masih dipakai produk, tidak bisa dihapus"
        )

    db.delete(category)
    db.commit()