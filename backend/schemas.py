from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# =========================================================
# AUTH & USER
# =========================================================
class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    role: Literal["pembeli", "penjual"]
    phone: str | None = None
    address: str | None = None
    store_name: str | None = None  # wajib kalau role = penjual


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    name: str
    email: EmailStr
    role: str
    phone: str | None
    address: str | None
    is_active: bool


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class UserStatusUpdate(BaseModel):
    is_active: bool


class UserListOut(BaseModel):
    items: list[UserOut]
    total: int
    page: int
    limit: int

# =========================================================
# KATEGORI
# =========================================================
class CategoryCreate(BaseModel):
    category_name: str = Field(min_length=1, max_length=100)
    description: str | None = None


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    category_id: int
    category_name: str
    description: str | None

# =========================================================
# PROFIL & TOKO
# =========================================================
class ProfileUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=20)
    address: str | None = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(min_length=6, max_length=72)


class StoreUpdate(BaseModel):
    store_name: str = Field(min_length=1, max_length=100)
    description: str | None = None
    address: str | None = None


class StoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    store_id: int
    store_name: str
    description: str | None
    address: str | None


# =========================================================
# PRODUK
# =========================================================
class ProductCreate(BaseModel):
    category_id: int
    product_name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    price: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    stock: int = Field(ge=0)
    image: str | None = Field(default=None, max_length=255)


class ProductUpdate(BaseModel):
    category_id: int
    product_name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    price: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    image: str | None = Field(default=None, max_length=255)


class StockUpdate(BaseModel):
    stock: int = Field(ge=0)


class ProductStatusUpdate(BaseModel):
    status: Literal["aktif", "disembunyikan"]


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    store_id: int
    category_id: int
    product_name: str
    description: str | None
    price: Decimal
    stock: int
    image: str | None
    status: str
    store_name: str | None = None
    category_name: str | None = None


class ProductListOut(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    limit: int


# =========================================================
# KERANJANG
# =========================================================
class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1)


class CartItemOut(BaseModel):
    cart_item_id: int
    product_id: int
    product_name: str
    store_id: int
    store_name: str
    price: Decimal
    image: str | None
    stock: int
    status: str
    quantity: int
    subtotal: Decimal


class CartOut(BaseModel):
    cart_id: int
    items: list[CartItemOut]
    total: Decimal


# =========================================================
# PESANAN & PEMBAYARAN
# =========================================================
class CheckoutRequest(BaseModel):
    payment_method: Literal["transfer_bank", "e_wallet"]


class OrderStatusUpdate(BaseModel):
    status: Literal["diproses", "dikirim", "selesai", "dibatalkan"]


class OrderItemOut(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    price: Decimal
    subtotal: Decimal


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    payment_method: str
    payment_status: str
    payment_date: datetime | None


class OrderOut(BaseModel):
    order_id: int
    buyer_name: str
    store_id: int
    store_name: str
    order_date: datetime | None
    total_amount: Decimal
    status: str
    items: list[OrderItemOut]
    payment: PaymentOut | None


class OrderListOut(BaseModel):
    items: list[OrderOut]
    total: int
    page: int
    limit: int

# =========================================================
# LAPORAN
# =========================================================
class DailySales(BaseModel):
    day: date
    orders: int
    revenue: Decimal


class TopProduct(BaseModel):
    product_id: int
    product_name: str
    quantity_sold: int
    revenue: Decimal


class SalesReportOut(BaseModel):
    start_date: date | None
    end_date: date | None
    total_orders: int
    total_revenue: Decimal
    total_items_sold: int
    orders_by_status: dict[str, int]
    daily: list[DailySales]
    top_products: list[TopProduct]


class StoreSales(BaseModel):
    store_id: int
    store_name: str
    orders: int
    revenue: Decimal


class PaymentMethodStat(BaseModel):
    payment_method: str
    count: int
    revenue: Decimal


class TransactionReportOut(BaseModel):
    start_date: date | None
    end_date: date | None
    total_orders: int
    total_revenue: Decimal
    orders_by_status: dict[str, int]
    daily: list[DailySales]
    by_store: list[StoreSales]
    by_payment_method: list[PaymentMethodStat]