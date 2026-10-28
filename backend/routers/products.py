from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session, joinedload

from database import get_db
from dependencies import require_role
from models import CartItem, Category, OrderItem, Product, Store, User
from schemas import (
    ProductCreate,
    ProductListOut,
    ProductOut,
    ProductStatusUpdate,
    StockUpdate,
)

router = APIRouter(prefix="/products", tags=["Produk"])


def _to_out(product: Product) -> ProductOut:
    out = ProductOut.model_validate(product)
    out.store_name = product.store.store_name
    out.category_name = product.category.category_name
    return out


def _paginate(db: Session, conditions: list, page: int, limit: int) -> ProductListOut:
    total = db.scalar(select(func.count()).select_from(Product).where(*conditions))
    products = db.scalars(
        select(Product)
        .options(joinedload(Product.store), joinedload(Product.category))
        .where(*conditions)
        .order_by(Product.product_id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    return ProductListOut(
        items=[_to_out(p) for p in products], total=total, page=page, limit=limit
    )


def _get_own_store(db: Session, user: User) -> Store:
    store = db.scalar(select(Store).where(Store.user_id == user.user_id))
    if store is None:
        raise HTTPException(status_code=404, detail="Toko tidak ditemukan")
    return store


def _get_own_product(db: Session, product_id: int, store: Store) -> Product:
    product = db.get(Product, product_id)
    # 404 (bukan 403) supaya produk toko lain tidak ketahuan keberadaannya
    if product is None or product.store_id != store.store_id:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    return product


def _ensure_category(db: Session, category_id: int) -> None:
    if db.get(Category, category_id) is None:
        raise HTTPException(status_code=404, detail="Kategori tidak ditemukan")


# ---------- Publik ----------
@router.get("", response_model=ProductListOut)
def list_products(
    q: str | None = None,
    category_id: int | None = None,
    store_id: int | None = None,
    min_price: Decimal | None = Query(None, ge=0),
    max_price: Decimal | None = Query(None, ge=0),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    conditions = [Product.status == "aktif"]
    if q:
        conditions.append(Product.product_name.ilike(f"%{q}%"))
    if category_id is not None:
        conditions.append(Product.category_id == category_id)
    if store_id is not None:
        conditions.append(Product.store_id == store_id)
    if min_price is not None:
        conditions.append(Product.price >= min_price)
    if max_price is not None:
        conditions.append(Product.price <= max_price)
    return _paginate(db, conditions, page, limit)


# ---------- Penjual & admin (HARUS di atas /{product_id}) ----------
@router.get("/mine", response_model=ProductListOut)
def list_my_products(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
    user: User = Depends(require_role("penjual")),
):
    store = _get_own_store(db, user)
    return _paginate(db, [Product.store_id == store.store_id], page, limit)


@router.get("/admin/all", response_model=ProductListOut)
def list_all_products_admin(
    status: Literal["aktif", "disembunyikan"] | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    conditions = [Product.status == status] if status else []
    return _paginate(db, conditions, page, limit)


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.scalar(
        select(Product)
        .options(joinedload(Product.store), joinedload(Product.category))
        .where(Product.product_id == product_id, Product.status == "aktif")
    )
    if product is None:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    return _to_out(product)


# ---------- Penjual ----------
@router.post("", response_model=ProductOut, status_code=201)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("penjual")),
):
    store = _get_own_store(db, user)
    _ensure_category(db, data.category_id)

    product = Product(store_id=store.store_id, **data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return _to_out(product)


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    data: ProductCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("penjual")),
):
    store = _get_own_store(db, user)
    product = _get_own_product(db, product_id, store)
    _ensure_category(db, data.category_id)

    for field, value in data.model_dump().items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return _to_out(product)


@router.patch("/{product_id}/stock", response_model=ProductOut)
def update_stock(
    product_id: int,
    data: StockUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("penjual")),
):
    store = _get_own_store(db, user)
    product = _get_own_product(db, product_id, store)

    product.stock = data.stock
    db.commit()
    db.refresh(product)
    return _to_out(product)


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("penjual")),
):
    store = _get_own_store(db, user)
    product = _get_own_product(db, product_id, store)

    ordered = db.scalar(
        select(OrderItem.order_item_id).where(OrderItem.product_id == product_id).limit(1)
    )
    if ordered:
        raise HTTPException(
            status_code=409,
            detail="Produk sudah pernah dipesan sehingga tidak bisa dihapus. Set stok ke 0 saja.",
        )

    db.execute(delete(CartItem).where(CartItem.product_id == product_id))
    db.delete(product)
    db.commit()


# ---------- Admin (moderasi) ----------
@router.patch("/{product_id}/status", response_model=ProductOut)
def moderate_product(
    product_id: int,
    data: ProductStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")

    product.status = data.status
    db.commit()
    db.refresh(product)
    return _to_out(product)