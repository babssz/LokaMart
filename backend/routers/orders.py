from collections import defaultdict
from decimal import Decimal
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from database import get_db
from dependencies import get_current_user, require_role
from models import Cart, CartItem, Order, OrderItem, Payment, Product, Store, User
from schemas import (
    CheckoutRequest,
    OrderItemOut,
    OrderListOut,
    OrderOut,
    OrderStatusUpdate,
    PaymentOut,
)

router = APIRouter(prefix="/orders", tags=["Pesanan"])

_OPTIONS = (
    joinedload(Order.buyer),
    joinedload(Order.store),
    joinedload(Order.payment),
    selectinload(Order.items).joinedload(OrderItem.product),
)

# status yang boleh dituju dari status sekarang
TRANSITIONS = {
    "dibayar": {"diproses", "dibatalkan"},
    "diproses": {"dikirim", "dibatalkan"},
    "dikirim": {"selesai"},
}


def _to_out(order: Order) -> OrderOut:
    return OrderOut(
        order_id=order.order_id,
        buyer_name=order.buyer.name,
        store_id=order.store_id,
        store_name=order.store.store_name,
        order_date=order.order_date,
        total_amount=order.total_amount,
        status=order.status,
        items=[
            OrderItemOut(
                product_id=i.product_id,
                product_name=i.product.product_name,
                quantity=i.quantity,
                price=i.price,
                subtotal=i.subtotal,
            )
            for i in order.items
        ],
        payment=PaymentOut.model_validate(order.payment) if order.payment else None,
    )


def _paginate(db: Session, conditions: list, page: int, limit: int) -> OrderListOut:
    total = db.scalar(select(func.count()).select_from(Order).where(*conditions))
    orders = db.scalars(
        select(Order)
        .options(*_OPTIONS)
        .where(*conditions)
        .order_by(Order.order_id.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()
    return OrderListOut(
        items=[_to_out(o) for o in orders], total=total, page=page, limit=limit
    )


# ---------- Pembeli: checkout ----------
@router.post("/checkout", response_model=list[OrderOut], status_code=201)
def checkout(
    data: CheckoutRequest,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("pembeli")),
):
    cart = db.scalar(select(Cart).where(Cart.user_id == user.user_id))
    cart_items = (
        db.scalars(select(CartItem).where(CartItem.cart_id == cart.cart_id)).all()
        if cart
        else []
    )
    if not cart_items:
        raise HTTPException(status_code=400, detail="Keranjang masih kosong")

    # kunci baris produk supaya stok tidak diserobot checkout lain di saat bersamaan
    products = {
        p.product_id: p
        for p in db.scalars(
            select(Product)
            .where(Product.product_id.in_([ci.product_id for ci in cart_items]))
            .with_for_update()
        ).all()
    }

    problems = []
    for ci in cart_items:
        p = products.get(ci.product_id)
        if p is None or p.status != "aktif":
            problems.append(f"Produk #{ci.product_id} sudah tidak tersedia")
        elif ci.quantity > p.stock:
            problems.append(f"Stok {p.product_name} tidak cukup (tersedia {p.stock})")
    if problems:
        raise HTTPException(status_code=409, detail="; ".join(problems))

    by_store: dict[int, list[CartItem]] = defaultdict(list)
    for ci in cart_items:
        by_store[products[ci.product_id].store_id].append(ci)

    created_ids = []
    for store_id, items in by_store.items():
        total = sum(
            (products[ci.product_id].price * ci.quantity for ci in items), Decimal("0")
        )
        order = Order(
            user_id=user.user_id, store_id=store_id, total_amount=total, status="dibayar"
        )
        db.add(order)
        db.flush()  # supaya order_id terisi

        for ci in items:
            p = products[ci.product_id]
            db.add(
                OrderItem(
                    order_id=order.order_id,
                    product_id=p.product_id,
                    quantity=ci.quantity,
                    price=p.price,  # harga dibekukan saat checkout
                    subtotal=p.price * ci.quantity,
                )
            )
            p.stock -= ci.quantity

        # pembayaran simulasi: langsung dianggap berhasil
        db.add(
            Payment(
                order_id=order.order_id,
                payment_method=data.payment_method,
                payment_status="berhasil",
                payment_date=func.now(),
            )
        )
        created_ids.append(order.order_id)

    for ci in cart_items:
        db.delete(ci)
    db.commit()

    orders = db.scalars(
        select(Order)
        .options(*_OPTIONS)
        .where(Order.order_id.in_(created_ids))
        .order_by(Order.order_id)
    ).all()
    return [_to_out(o) for o in orders]


# ---------- Daftar pesanan ----------
@router.get("", response_model=OrderListOut)
def list_my_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    user: User = Depends(require_role("pembeli")),
):
    return _paginate(db, [Order.user_id == user.user_id], page, limit)


# /store dan /admin/all HARUS di atas /{order_id}
@router.get("/store", response_model=OrderListOut)
def list_store_orders(
    status: Literal["dibayar", "diproses", "dikirim", "selesai", "dibatalkan"] | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    user: User = Depends(require_role("penjual")),
):
    store = db.scalar(select(Store).where(Store.user_id == user.user_id))
    if store is None:
        raise HTTPException(status_code=404, detail="Toko tidak ditemukan")

    conditions = [Order.store_id == store.store_id]
    if status:
        conditions.append(Order.status == status)
    return _paginate(db, conditions, page, limit)


@router.get("/admin/all", response_model=OrderListOut)
def list_all_orders(
    status: Literal["dibayar", "diproses", "dikirim", "selesai", "dibatalkan"] | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    conditions = [Order.status == status] if status else []
    return _paginate(db, conditions, page, limit)


# ---------- Detail pesanan (semua role, dengan batasan akses) ----------
@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order = db.scalar(select(Order).options(*_OPTIONS).where(Order.order_id == order_id))

    allowed = order is not None and (
        user.role == "admin"
        or (user.role == "pembeli" and order.user_id == user.user_id)
        or (user.role == "penjual" and order.store.user_id == user.user_id)
    )
    if not allowed:
        # 404 (bukan 403) supaya pesanan orang lain tidak ketahuan keberadaannya
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    return _to_out(order)


# ---------- Penjual: ubah status ----------
@router.patch("/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("penjual")),
):
    store = db.scalar(select(Store).where(Store.user_id == user.user_id))
    order = db.scalar(select(Order).options(*_OPTIONS).where(Order.order_id == order_id))
    if order is None or store is None or order.store_id != store.store_id:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")

    if data.status not in TRANSITIONS.get(order.status, set()):
        raise HTTPException(
            status_code=409,
            detail=f"Status tidak bisa diubah dari '{order.status}' ke '{data.status}'",
        )

    if data.status == "dibatalkan":
        for item in order.items:
            item.product.stock += item.quantity  # kembalikan stok
        if order.payment:
            order.payment.payment_status = "dikembalikan"

    order.status = data.status
    db.commit()
    return _to_out(order)