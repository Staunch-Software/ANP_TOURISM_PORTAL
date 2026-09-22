import asyncio
import sys
import os

from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from alembic import context

# Same pattern as Drs-backend/alembic/env.py -- this project's engine is
# asyncpg (async-only), so migrations run through async_engine_from_config
# instead of the sync engine_from_config the default template generates.
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.core.config import settings
from app.core.database import Base
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.ticket import Ticket
from app.models.attraction import Attraction, AttractionSlot
from app.models.ferry import Vessel, FerrySchedule, FerrySeat
from app.models.lpu_heartbeat import LPUHeartbeat
from app.models.gate import Gate, GateService
from app.models.gate_staff import GateStaff
from app.models.group_booking import GroupBooking, GroupBookingItem

config = context.config

# Pull the DB URL from this app's own settings/.env instead of hardcoding
# it a second time in alembic.ini. configparser treats "%" as interpolation
# syntax, so a URL-encoded character in the password (e.g. "%40" for "@")
# has to be escaped as "%%" before going through set_main_option.
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL.replace("%", "%%"))

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
