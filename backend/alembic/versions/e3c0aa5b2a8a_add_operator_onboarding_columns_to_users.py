"""add operator onboarding columns to users

The User ORM model (app/models/user.py) already carries business_name,
gstin, trade_license_number, service_category, approval_status, and
approval_notes for the Service Provider onboarding/approval workflow
(RFP 7.2.1-1/7/III, see app/api/v1/admin.py's operator-applications
endpoints) -- but nothing had ever migrated the live `users` table
forward to match, since this project only used Base.metadata.create_all
before Alembic was introduced. Every query that loads a User (including
login) was failing with UndefinedColumnError: column users.business_name
does not exist.

Revision ID: e3c0aa5b2a8a
Revises: ff47f2e160d1
Create Date: 2026-09-17 15:25:14.838003

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3c0aa5b2a8a'
down_revision: Union[str, Sequence[str], None] = 'ff47f2e160d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('business_name', sa.String(length=150), nullable=True))
    op.add_column('users', sa.Column('gstin', sa.String(length=20), nullable=True))
    op.add_column('users', sa.Column('trade_license_number', sa.String(length=50), nullable=True))
    op.add_column('users', sa.Column('service_category', sa.String(length=30), nullable=True))
    op.add_column('users', sa.Column('approval_status', sa.String(length=20), nullable=True))
    op.add_column('users', sa.Column('approval_notes', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'approval_notes')
    op.drop_column('users', 'approval_status')
    op.drop_column('users', 'service_category')
    op.drop_column('users', 'trade_license_number')
    op.drop_column('users', 'gstin')
    op.drop_column('users', 'business_name')
