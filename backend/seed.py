from sqlalchemy import select

from database import SessionLocal
from models import Category, User
from security import hash_password

ADMIN_EMAIL = "admin@lokamart.com"
ADMIN_PASSWORD = "admin123"  # hanya untuk pengembangan lokal

CATEGORIES = [
    ("Batik & Tenun", "Kain batik tulis, batik cap, dan tenun khas Makassar"),
    ("Anyaman Kenjiran", "Kerajinan anyaman bambu, rotan, dan serat alami"),
    ("Kopi Sanggar", "Kopi lokal hasil sanggar dan petani setempat"),
    ("Kuliner Pusaka", "Makanan dan olahan khas dengan resep turun-temurun"),
    ("Keramik & Tanah Liat", "Kriya keramik dan terakota"),
]


def seed():
    db = SessionLocal()
    try:
        if not db.scalar(select(User).where(User.email == ADMIN_EMAIL)):
            db.add(
                User(
                    name="Admin LokaMart",
                    email=ADMIN_EMAIL,
                    password=hash_password(ADMIN_PASSWORD),
                    role="admin",
                )
            )

        for name, description in CATEGORIES:
            if not db.scalar(select(Category).where(Category.category_name == name)):
                db.add(Category(category_name=name, description=description))

        db.commit()
        print("Seed selesai")
    finally:
        db.close()


if __name__ == "__main__":
    seed()