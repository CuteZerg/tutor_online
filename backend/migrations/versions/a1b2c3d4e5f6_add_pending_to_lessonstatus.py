"""add PENDING to lessonstatus

Revision ID: a1b2c3d4e5f6
Revises: 520a09e405d8
Create Date: 2026-05-21 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '520a09e405d8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Disable transactions for this operation because ALTER TYPE cannot be executed in a transaction block
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE lessonstatus ADD VALUE IF NOT EXISTS 'PENDING'")

def downgrade() -> None:
    # Postgres doesn't easily support dropping an enum value, so we do nothing here.
    pass
