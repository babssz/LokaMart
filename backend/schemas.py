from typing import Literal
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from datetime import datetime

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

class ProductCreate(BaseModel):
    category_id: int
    product_name: str = Field(min_length=1, max_length=150)
    description: str | None = None
    price: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    stock: int = Field(ge=0)
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

class CategoryCreate(BaseModel):
    category_name: str = Field(min_length=1, max_length=100)
    description: str | None = None


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    category_id: int
    category_name: str
    description: str | None


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