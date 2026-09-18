"""lpu sync support: ticket versioning, multi-attraction bookings, lpu heartbeats

This is the first Alembic revision in this repo -- prior to this, the
schema was managed only by Base.metadata.create_all (app/main.py's
lifespan), which creates missing tables but never alters existing ones.
That's why this revision is additive-only against whatever tables you
already have: it doesn't recreate orders/order_items/tickets/users/etc,
it only adds what the LPU fleet sync layer (app/api/v1/sync.py) needs on
top of them.

What this adds and why:
  - tickets.updated_at:  pull watermark for GET /sync/tickets/changes
                          ("what changed since X").
  - tickets.issued_by:   "CLOUD" (web/app checkout) vs "COUNTER" (offline
                          LPU counter sale, see POST /sync/counter-tickets).
  - tickets.site_id:     which LPU site issued/checked in this ticket.
  - tickets.booking_ref + tickets.item_index: group multiple Ticket rows
                          (one per attraction) under a single signed QR
                          for a multi-attraction booking (RFP p.28,
                          "Unified QR code... across multiple attractions")
                          -- see app/api/v1/payments.py. Backfilled so
                          every existing ticket becomes a single-item
                          booking of itself (booking_ref = ticket_ref).
  - tickets.version:     monotonic per-leg counter for conflict-free
                          merging on the LPU side (clock-drift-immune,
                          unlike a timestamp compare) -- see
                          app/api/v1/sync.py's push_checkin and
                          LPU_backend's app/services/sync_service.py.
  - order_items.position: stable per-item ordering within a booking (UUID
                          PKs don't preserve insertion order), so
                          tickets.item_index matches the order attractions
                          actually appear in the signed QR payload.
  - lpu_heartbeats table: one row per LPU site, upserted on every
                          POST /sync/heartbeat -- feeds an Authority
                          dashboard's real-time LPU uptime view (SLA 8.4).

Revision ID: 0dcab20b0dd7
Revises:
Create Date: 2026-09-17 14:32:49.771104

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0dcab20b0dd7'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('tickets', sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')))
    op.add_column('tickets', sa.Column('issued_by', sa.String(length=20), server_default='CLOUD'))
    op.add_column('tickets', sa.Column('site_id', sa.String(length=50), nullable=True))
    op.add_column('tickets', sa.Column('booking_ref', sa.String(length=50), nullable=True))
    op.add_column('tickets', sa.Column('item_index', sa.Integer(), nullable=True))
    op.add_column('tickets', sa.Column('version', sa.Integer(), nullable=False, server_default='1'))

    # Backfill: every ticket that existed before this migration becomes a
    # single-item booking of itself.
    op.execute("UPDATE tickets SET booking_ref = ticket_ref, item_index = 0 WHERE booking_ref IS NULL")

    op.create_index('ix_tickets_booking_ref', 'tickets', ['booking_ref'])

    op.add_column('order_items', sa.Column('position', sa.Integer(), server_default='0'))

    op.create_table(
        'lpu_heartbeats',
        sa.Column('site_id', sa.String(length=50), primary_key=True),
        sa.Column('last_heartbeat_at', sa.DateTime(), nullable=False),
        sa.Column('local_ticket_count', sa.Integer(), nullable=True),
        sa.Column('pending_sync_items', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()')),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('lpu_heartbeats')
    op.drop_column('order_items', 'position')
    op.drop_index('ix_tickets_booking_ref', table_name='tickets')
    op.drop_column('tickets', 'version')
    op.drop_column('tickets', 'item_index')
    op.drop_column('tickets', 'booking_ref')
    op.drop_column('tickets', 'site_id')
    op.drop_column('tickets', 'issued_by')
    op.drop_column('tickets', 'updated_at')
