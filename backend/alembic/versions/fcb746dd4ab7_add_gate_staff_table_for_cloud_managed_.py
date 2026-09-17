"""add gate_staff table for cloud-managed LPU staff accounts

See app/models/gate_staff.py -- COUNTER/GATEKEEPER login accounts,
authored here and pulled down by each LPU via GET /sync/staff into its
own local StaffUser table.

Revision ID: fcb746dd4ab7
Revises: e3c0aa5b2a8a
Create Date: 2026-09-17 15:43:55.525237

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'fcb746dd4ab7'
down_revision: Union[str, Sequence[str], None] = 'e3c0aa5b2a8a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'gate_staff',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('site_id', sa.String(length=50), sa.ForeignKey('gates.site_id'), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('password_hash', sa.String(length=200), nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=False),
        sa.Column('role', sa.String(length=20), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true')),
        sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.UniqueConstraint('site_id', 'username', name='uq_gate_staff_username'),
    )
    op.create_index('ix_gate_staff_site_id', 'gate_staff', ['site_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_gate_staff_site_id', table_name='gate_staff')
    op.drop_table('gate_staff')
