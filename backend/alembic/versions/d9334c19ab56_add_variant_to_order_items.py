"""Persist selected product variant on order items."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d9334c19ab56"
down_revision: Union[str, Sequence[str], None] = "a4167d8b210c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("order_items", sa.Column("variant", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("order_items", "variant")
