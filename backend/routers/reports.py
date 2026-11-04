from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_role
from models import Order, OrderItem, Payment, Product, Store, User
from schemas import (
    DailySales,
    PaymentMethodStat,
    SalesReportOut,
    StoreSales,
    TopProduct,
    TransactionReportOut,
)

router = APIRouter(prefix="/reports", tags=["Laporan"])


def _date_conditions(start_date: date | None, end_date: date | None) -> list:
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=400, detail="start_date tidak boleh setelah end_date"
        )
    conditions = []
    if start_date:
        conditions.append(Order.order_date >= start_date)
    if end_date:
        # inklusif: pesanan sepanjang hari end_date ikut dihitung
        conditions.append(Order.order_date < end_date + timedelta(days=1))
    return conditions


def _orders_by_status(db: Session, conditions: list) -> dict[str, int]:
    rows = db.execute(
        select(Order.status, func.count(Order.order_id))
        .where(*conditions)
        .group_by(Order.status)
    ).all()
    return {status: count for status, count in rows}


def _daily(db: Session, conditions: list) -> list[DailySales]:
    day = func.date(Order.order_date)
    rows = db.execute(
        select(day, func.count(Order.order_id), func.sum(Order.total_amount))
        .where(*conditions)
        .group_by(day)
        .order_by(day)
    ).all()
    return [DailySales(day=r[0], orders=r[1], revenue=r[2]) for r in rows]


def _totals(db: Session, sales: list):
    return db.execute(
        select(
            func.count(Order.order_id),
            func.coalesce(func.sum(Order.total_amount), 0),
        ).where(*sales)
    ).one()


# ---------- Penjual: laporan penjualan ----------
@router.get("/sales", response_model=SalesReportOut)
def sales_report(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("penjual")),
):
    store = db.scalar(select(Store).where(Store.user_id == user.user_id))
    if store is None:
        raise HTTPException(status_code=404, detail="Toko tidak ditemukan")

    scope = [Order.store_id == store.store_id, *_date_conditions(start_date, end_date)]
    sales = [*scope, Order.status != "dibatalkan"]

    total_orders, total_revenue = _totals(db, sales)

    total_items = db.scalar(
        select(func.coalesce(func.sum(OrderItem.quantity), 0))
        .select_from(OrderItem)
        .join(Order, Order.order_id == OrderItem.order_id)
        .where(*sales)
    )

    top_rows = db.execute(
        select(
            Product.product_id,
            Product.product_name,
            func.sum(OrderItem.quantity),
            func.sum(OrderItem.subtotal),
        )
        .select_from(OrderItem)
        .join(Order, Order.order_id == OrderItem.order_id)
        .join(Product, Product.product_id == OrderItem.product_id)
        .where(*sales)
        .group_by(Product.product_id, Product.product_name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
    ).all()

    return SalesReportOut(
        start_date=start_date,
        end_date=end_date,
        total_orders=total_orders,
        total_revenue=total_revenue,
        total_items_sold=total_items,
        orders_by_status=_orders_by_status(db, scope),
        daily=_daily(db, sales),
        top_products=[
            TopProduct(
                product_id=r[0], product_name=r[1], quantity_sold=r[2], revenue=r[3]
            )
            for r in top_rows
        ],
    )


# ---------- Admin: laporan transaksi ----------
@router.get("/transactions", response_model=TransactionReportOut)
def transaction_report(
    start_date: date | None = None,
    end_date: date | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    scope = _date_conditions(start_date, end_date)
    sales = [*scope, Order.status != "dibatalkan"]

    total_orders, total_revenue = _totals(db, sales)

    store_rows = db.execute(
        select(
            Store.store_id,
            Store.store_name,
            func.count(Order.order_id),
            func.sum(Order.total_amount),
        )
        .select_from(Order)
        .join(Store, Store.store_id == Order.store_id)
        .where(*sales)
        .group_by(Store.store_id, Store.store_name)
        .order_by(func.sum(Order.total_amount).desc())
    ).all()

    payment_rows = db.execute(
        select(
            Payment.payment_method,
            func.count(Payment.payment_id),
            func.sum(Order.total_amount),
        )
        .select_from(Payment)
        .join(Order, Order.order_id == Payment.order_id)
        .where(*sales)
        .group_by(Payment.payment_method)
    ).all()

    return TransactionReportOut(
        start_date=start_date,
        end_date=end_date,
        total_orders=total_orders,
        total_revenue=total_revenue,
        orders_by_status=_orders_by_status(db, scope),
        daily=_daily(db, sales),
        by_store=[
            StoreSales(store_id=r[0], store_name=r[1], orders=r[2], revenue=r[3])
            for r in store_rows
        ],
        by_payment_method=[
            PaymentMethodStat(payment_method=r[0], count=r[1], revenue=r[2])
            for r in payment_rows
        ],
    )