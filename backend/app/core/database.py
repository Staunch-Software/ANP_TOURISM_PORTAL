from sqlalchemy import inspect, text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base

from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


def _default_sql_literal(column):
    """Best-effort SQL literal for a Column's Python-side default, used so
    an auto-added NOT NULL column can be backfilled instead of failing on
    tables that already have rows."""
    if column.server_default is not None:
        return str(column.server_default.arg)
    if column.default is not None and getattr(column.default, "is_scalar", False):
        val = column.default.arg
        if isinstance(val, bool):
            return "TRUE" if val else "FALSE"
        if isinstance(val, (int, float)):
            return str(val)
        if isinstance(val, str):
            return "'" + val.replace("'", "''") + "'"
    return None


def sync_missing_columns(sync_conn):
    """Every table modification in this project is a raw ALTER TABLE
    (no Alembic) — the recurring failure mode is a teammate's local
    database missing a column/index a newer model expects, because
    Base.metadata.create_all() (see main.py's lifespan) only creates
    tables that don't exist yet; it never alters an existing table.

    This runs the same idempotent ADD COLUMN/CREATE INDEX logic every one
    of those manual migration scripts already used, but automatically, on
    every backend startup, against whatever tables already exist — so
    starting the backend is enough to catch a database up, on any
    machine, without anyone having to know which script to run.
    """
    inspector = inspect(sync_conn)
    for table in Base.metadata.sorted_tables:
        if not inspector.has_table(table.name):
            continue  # brand-new table -- create_all() above already made it in full

        existing_cols = {c["name"] for c in inspector.get_columns(table.name)}
        for column in table.columns:
            if column.name in existing_cols:
                continue

            col_type = column.type.compile(dialect=sync_conn.dialect)
            default_literal = _default_sql_literal(column)
            ddl = f'ALTER TABLE {table.name} ADD COLUMN IF NOT EXISTS {column.name} {col_type}'
            if default_literal is not None:
                ddl += f" DEFAULT {default_literal}"
            if not column.nullable and default_literal is not None:
                ddl += " NOT NULL"
            sync_conn.execute(text(ddl))

            if column.unique:
                sync_conn.execute(text(
                    f'CREATE UNIQUE INDEX IF NOT EXISTS ix_{table.name}_{column.name} '
                    f'ON {table.name} ({column.name})'
                ))
            elif column.index:
                sync_conn.execute(text(
                    f'CREATE INDEX IF NOT EXISTS ix_{table.name}_{column.name} '
                    f'ON {table.name} ({column.name})'
                ))
