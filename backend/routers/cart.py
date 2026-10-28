from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from database import get_db
from dependencies import require_role
from models import Cart, CartItem, Product, User
from schemas import CartItemAdd, CartItemOut, CartItemUpdate, CartOut

router = APIRouter(prefix="/cart", tags=["Keranjang"])


def _get_cart(db: Session, user: User) -> Cart:
    cart = db.scalar(select(Cart).where(Cart.user_id == user.user_id))
    if cart is None:
        cart = Cart(user_id=user.user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart


def _get_own_item(db: Session, cart: Cart, cart_item_id: int) -> CartItem:
    item = db.get(CartItem, cart_item_id)
    if item is None or item.cart_id != cart.cart_id:
        raise HTTPException(status_code=404, detail="Item keranjang tidak ditemukan")
    return item


def _build_cart_out(db: Session, cart: Cart) -> CartOut:
    rows = db.scalars(
        select(CartItem)
        .options(joinedload(CartItem.product).joinedload(Product.store))
        .where(CartItem.cart_id == cart.cart_id)
        .order_by(CartItem.cart_item_id)
    ).all()

    items = []
    total = Decimal("0")
    for ci in rows:
        p = ci.product
        subtotal = p.price * ci.quantity
        total += subtotal
        items.append(
            CartItemOut(
                cart_item_id=ci.cart_item_id,
                product_id=p.product_id,
                product_name=p.product_name,
                store_id=p.store_id,
                store_name=p.store.store_name,
                price=p.price,
                image=p.image,
                stock=p.stock,
                status=p.status,
                quantity=ci.quantity,
                subtotal=subtotal,
            )
        )
    return CartOut(cart_id=cart.cart_id, items=items, total=total)


@router.get("", response_model=CartOut)
def get_cart(
    db: Session = Depends(get_db),
    user: User = Depends(require_role("pembeli")),
):
    return _build_cart_out(db, _get_cart(db, user))


@router.post("/items", response_model=CartOut, status_code=201)
def add_item(
    data: CartItemAdd,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("pembeli")),
):
    product = db.get(Product, data.product_id)
    if product is None or product.status != "aktif":
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")

    cart = _get_cart(db, user)
    item = db.scalar(
        select(CartItem).where(
            CartItem.cart_id == cart.cart_id, CartItem.product_id == data.product_id
        )
    )

    new_quantity = (item.quantity if item else 0) + data.quantity
    if new_quantity > product.stock:
        raise HTTPException(
            status_code=409, detail=f"Stok tidak cukup. Stok tersedia: {product.stock}"
        )

    if item:
        item.quantity = new_quantity
    else:
        db.add(
            CartItem(
                cart_id=cart.cart_id,
                product_id=product.product_id,
                quantity=data.quantity,
            )
        )
    db.commit()
    return _build_cart_out(db, cart)


@router.patch("/items/{cart_item_id}", response_model=CartOut)
def update_item(
    cart_item_id: int,
    data: CartItemUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("pembeli")),
):
    cart = _get_cart(db, user)
    item = _get_own_item(db, cart, cart_item_id)

    product = db.get(Product, item.product_id)
    if product.status != "aktif":
        raise HTTPException(status_code=409, detail="Produk sudah tidak tersedia")
    if data.quantity > product.stock:
        raise HTTPException(
            status_code=409, detail=f"Stok tidak cukup. Stok tersedia: {product.stock}"
        )

    item.quantity = data.quantity
    db.commit()
    return _build_cart_out(db, cart)


@router.delete("/items/{cart_item_id}", response_model=CartOut)
def remove_item(
    cart_item_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("pembeli")),
):
    cart = _get_cart(db, user)
    item = _get_own_item(db, cart, cart_item_id)

    db.delete(item)
    db.commit()
    return _build_cart_out(db, cart)