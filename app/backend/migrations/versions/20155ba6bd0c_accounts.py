"""accounts

Аккаунты (этап 6): у пользователя появляются почта, хеш пароля и дата регистрации.
Старый пользователь по умолчанию остаётся без почты: войти в него нельзя (ADR 0014).

Revision ID: 20155ba6bd0c
Revises: 22ffa2f7a822
Create Date: 2026-11-13 08:09:01.531713

"""

from collections.abc import Sequence

import sqlalchemy as sa
import sqlmodel
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "20155ba6bd0c"
down_revision: str | Sequence[str] | None = "22ffa2f7a822"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.add_column(sa.Column("email", sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        batch_op.add_column(
            sa.Column("password_hash", sqlmodel.sql.sqltypes.AutoString(), nullable=True)
        )
        batch_op.add_column(
            sa.Column("created_at", sqlmodel.sql.sqltypes.UTCDateTime(), nullable=True)
        )
        batch_op.create_index(batch_op.f("ix_user_email"), ["email"], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_user_email"))
        batch_op.drop_column("created_at")
        batch_op.drop_column("password_hash")
        batch_op.drop_column("email")
