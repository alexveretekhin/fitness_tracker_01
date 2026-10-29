"""one row per set

Подходы переехали из трёх колонок dayexercise (weight, sets, reps) в отдельную
таблицу workoutset: одна строка = один подход. Старые записи «3 × 10 по 60 кг»
превращаются в три одинаковых подхода, поэтому ничего не теряется.

Revision ID: 898a6f7857f1
Revises: af4502b1a073
Create Date: 2026-10-29 12:03:57.029919

"""

from collections.abc import Sequence

import sqlalchemy as sa
import sqlmodel
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "898a6f7857f1"
down_revision: str | Sequence[str] | None = "af4502b1a073"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "workoutset",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("day_exercise_id", sa.Integer(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("weight", sa.Float(), nullable=False),
        sa.Column("reps", sa.Integer(), nullable=False),
        sa.Column("created_at", sqlmodel.sql.sqltypes.UTCDateTime(), nullable=False),
        sa.ForeignKeyConstraint(["day_exercise_id"], ["dayexercise.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    with op.batch_alter_table("workoutset", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_workoutset_day_exercise_id"), ["day_exercise_id"], unique=False
        )

    # Переносим данные: «sets» подходов с одинаковым весом и повторами
    bind = op.get_bind()
    old = bind.execute(
        sa.text(
            "SELECT id, weight, sets, reps, created_at FROM dayexercise WHERE sets > 0 AND reps > 0"
        )
    ).all()
    for entry_id, weight, sets, reps, created_at in old:
        for position in range(sets):
            bind.execute(
                sa.text(
                    "INSERT INTO workoutset (day_exercise_id, position, weight, reps, created_at) "
                    "VALUES (:e, :p, :w, :r, :c)"
                ),
                {"e": entry_id, "p": position, "w": weight or 0, "r": reps, "c": created_at},
            )

    with op.batch_alter_table("dayexercise", schema=None) as batch_op:
        batch_op.drop_column("weight")
        batch_op.drop_column("reps")
        batch_op.drop_column("sets")


def downgrade() -> None:
    """Downgrade schema."""
    with op.batch_alter_table("dayexercise", schema=None) as batch_op:
        batch_op.add_column(sa.Column("sets", sa.INTEGER(), nullable=True))
        batch_op.add_column(sa.Column("reps", sa.INTEGER(), nullable=True))
        batch_op.add_column(sa.Column("weight", sa.FLOAT(), nullable=True))

    # Обратно в одну строку: число подходов, вес и повторы берём из первого подхода
    bind = op.get_bind()
    rows = bind.execute(
        sa.text(
            "SELECT day_exercise_id, COUNT(*), "
            "(SELECT weight FROM workoutset w2 WHERE w2.day_exercise_id = w.day_exercise_id "
            " ORDER BY position LIMIT 1), "
            "(SELECT reps FROM workoutset w2 WHERE w2.day_exercise_id = w.day_exercise_id "
            " ORDER BY position LIMIT 1) "
            "FROM workoutset w GROUP BY day_exercise_id"
        )
    ).all()
    for entry_id, sets, weight, reps in rows:
        bind.execute(
            sa.text("UPDATE dayexercise SET sets = :s, weight = :w, reps = :r WHERE id = :e"),
            {"s": sets, "w": weight, "r": reps, "e": entry_id},
        )

    with op.batch_alter_table("workoutset", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_workoutset_day_exercise_id"))

    op.drop_table("workoutset")
