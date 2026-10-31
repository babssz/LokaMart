from sqlalchemy.orm import relationship
from sqlalchemy import (
    CheckConstraint, Column, DateTime, ForeignKey, Integer,
    Numeric, String, Text, UniqueConstraint, Boolean, func,
)

from database import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('pembeli', 'penjual', 'admin')", name="ck_users_role"),
    )

    user_id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)  # disimpan dalam bentuk hash
    role = Column(String(20), nullable=False)
    phone = Column(String(20))
    address = Column(Text)
    is_active = Column(Boolean, nullable=False, server_default="true")


class Store(Base):
    __tablename__ = "stores"

    store_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), unique=True, nullable=False)
    store_name = Column(String(100), nullable=False)
    description = Column(Text)
    address = Column(Text)


class Category(Base):
    __tablename__ = "categories"

    category_id = Column(Integer, primary_key=True)
    category_name = Column(String(100), nullable=False)
    description = Column(Text)


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("stock >= 0", name="ck_products_stock"),
    )

    product_id = Column(Integer, primary_key=True)
    store_id = Column(Integer, ForeignKey("stores.store_id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.category_id"), nullable=False)
    product_name = Column(String(150), nullable=False)
    description = Column(Text)
    price = Column(Numeric(12, 2), nullable=False)
    stock = Column(Integer, nullable=False)
    image = Column(String(255))
    status = Column(String(20), nullable=False, server_default="aktif")  # aktif / disembunyikan
    store = relationship("Store")
    category = relationship("Category")


class Cart(Base):
    __tablename__ = "carts"

    cart_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), unique=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class CartItem(Base):
    __tablename__ = "cart_items"
    __table_args__ = (
        UniqueConstraint("cart_id", "product_id", name="uq_cart_items_cart_product"),
        CheckConstraint("quantity > 0", name="ck_cart_items_quantity"),
    )
    product = relationship("Product")

    cart_item_id = Column(Integer, primary_key=True)
    cart_id = Column(Integer, ForeignKey("carts.cart_id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.product_id"), nullable=False)
    quantity = Column(Integer, nullable=False)


class Order(Base):
    __tablename__ = "orders"

    order_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    store_id = Column(Integer, ForeignKey("stores.store_id"), nullable=False)
    order_date = Column(DateTime, server_default=func.now())
    total_amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String(30), nullable=False, server_default="menunggu_pembayaran")
    buyer = relationship("User")
    store = relationship("Store")
    items = relationship("OrderItem")
    payment = relationship("Payment", uselist=False)


class OrderItem(Base):
    __tablename__ = "order_items"

    order_item_id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.product_id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(Numeric(12, 2), nullable=False)
    subtotal = Column(Numeric(12, 2), nullable=False)
    product = relationship("Product")


class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"), unique=True, nullable=False)
    payment_method = Column(String(30), nullable=False)
    payment_status = Column(String(30), nullable=False)
    payment_date = Column(DateTime)