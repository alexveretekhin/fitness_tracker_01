"""guest

Гостевой вход (ADR 0016): флаг is_guest у пользователя. Все прежние пользователи не гости.

Revision ID: 0d9216028e31
Revises: 20155ba6bd0c
Create Date: 2026-11-13 08:31:19.288181

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0d9216028e31"
down_revision: str | Sequence[str] | None = "20155ba6bd0c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.add_column(sa.Column("is_guest", sa.Boolean(), server_default="0", nullable=False))


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.drop_column("is_guest")
