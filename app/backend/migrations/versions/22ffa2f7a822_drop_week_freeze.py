"""drop week freeze

Убираем таблицу weekfreeze: серию недель и заморозку решили пока не делать (ADR 0009).

Revision ID: 22ffa2f7a822
Revises: 2ee644e22423
Create Date: 2026-11-04 09:02:20.202190

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "22ffa2f7a822"
down_revision: str | Sequence[str] | None = "2ee644e22423"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("weekfreeze", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_weekfreeze_user_id"))
    op.drop_table("weekfreeze")


def downgrade() -> None:
    """Downgrade schema."""
    op.create_table(
        "weekfreeze",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("week_start", sa.Date(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "week_start"),
    )
    with op.batch_alter_table("weekfreeze", schema=None) as batch_op:
        batch_op.create_index(batch_op.f("ix_weekfreeze_user_id"), ["user_id"], unique=False)
