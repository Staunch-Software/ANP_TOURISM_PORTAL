"""gate provisioning: scope LPU sync to assigned services

Adds the `gates` / `gate_services` tables -- see app/models/gate.py and
app/api/v1/gates.py for the admin CRUD, and app/api/v1/sync.py's
require_provisioned_gate + get_ticket_changes for how these are enforced.

This is schema-only. Provisioning an actual Gate row for each real LPU
site (and assigning its services) is an admin/operational step, done
through POST /admin/gates and POST /admin/gates/{site_id}/services after
this migration runs -- not baked into the migration itself, since which
sites exist and what they serve is environment-specific data, not schema.

IMPORTANT for anyone applying this to an existing deployment: once this
migration is live, GET /sync/tickets/changes requires `site_id` and 403s
for any site_id without an active Gate row. Every LPU site currently in
production needs a Gate provisioned (with its services assigned) BEFORE
or immediately after this migration lands, or its sync will start
returning 403/empty until that's done.

Revision ID: ff47f2e160d1
Revises: 0dcab20b0dd7
Create Date: 2026-09-17 15:23:49.698590

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'ff47f2e160d1'
down_revision: Union[str, Sequence[str], None] = '0dcab20b0dd7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'gates',
        sa.Column('site_id', sa.String(length=50), primary_key=True),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
    )

    op.create_table(
        'gate_services',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('site_id', sa.String(length=50), sa.ForeignKey('gates.site_id'), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('attraction_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('attractions.id'), nullable=True),
        sa.UniqueConstraint('site_id', 'title', name='uq_gate_service_title'),
    )
    op.create_index('ix_gate_services_site_id', 'gate_services', ['site_id'])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index('ix_gate_services_site_id', table_name='gate_services')
    op.drop_table('gate_services')
    op.drop_table('gates')
