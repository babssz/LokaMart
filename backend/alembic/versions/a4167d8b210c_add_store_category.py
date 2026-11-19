"""Add category to stores.

Revision ID: a4167d8b210c
Revises: d72c84ee30f1
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a4167d8b210c"
down_revision: Union[str, Sequence[str], None] = "d72c84ee30f1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("stores", sa.Column("category_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_stores_category_id_categories",
        "stores",
        "categories",
        ["category_id"],
        ["category_id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_stores_category_id_categories", "stores", type_="foreignkey")
    op.drop_column("stores", "category_id")
