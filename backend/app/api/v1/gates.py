# app/api/v1/gates.py
# Admin-only provisioning for LPU sites/gates -- same shape as admin.py's
# User Management section (section 7: admin_create_user etc.), just for
# gates instead of users. A Gate row is what lets an LPU's SITE_ID sync at
# all (see api/v1/sync.py's require_provisioned_gate), and its assigned
# GateService rows are what scope GET /sync/tickets/changes down to only
# the attractions/ferry routes that site actually serves.
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.user import User
from app.models.gate import Gate, GateService
from app.models.gate_staff import GateStaff
from app.api.v1.admin import verify_admin_role
from app.schemas.gate import (
    GateCreateRequest,
    GateUpdateRequest,
    GateSummary,
    GateServiceEntry,
    AssignServiceRequest,
)
from app.schemas.gate_staff import (
    VALID_STAFF_ROLES,
    StaffCreateRequest,
    StaffUpdateRequest,
    StaffSummary,
)

router = APIRouter(prefix="/admin/gates", tags=["Gate / LPU Site Provisioning"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def _fetch_gate(db: AsyncSession, site_id: str) -> Gate | None:
    res = await db.execute(
        select(Gate).where(Gate.site_id == site_id).options(selectinload(Gate.services))
    )
    return res.scalars().first()


def _gate_to_summary(g: Gate) -> GateSummary:
    return GateSummary(
        site_id=g.site_id,
        name=g.name,
        is_active=g.is_active,
        services=[
            GateServiceEntry(id=str(s.id), title=s.title, attraction_id=str(s.attraction_id) if s.attraction_id else None)
            for s in g.services
        ],
        created_at=str(g.created_at),
    )


@router.get("", response_model=list[GateSummary])
async def list_gates(
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(Gate).order_by(Gate.created_at.asc()).options(selectinload(Gate.services))
    )
    return [_gate_to_summary(g) for g in res.scalars().unique().all()]


@router.post("", response_model=GateSummary)
async def create_gate(
    payload: GateCreateRequest,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(select(Gate).where(Gate.site_id == payload.site_id))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail=f"A gate with site_id '{payload.site_id}' already exists")

    gate = Gate(site_id=payload.site_id, name=payload.name, is_active=True)
    db.add(gate)
    await db.commit()
    return _gate_to_summary(await _fetch_gate(db, payload.site_id))


@router.patch("/{site_id}", response_model=GateSummary)
async def update_gate(
    site_id: str,
    payload: GateUpdateRequest,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(Gate).where(Gate.site_id == site_id))
    gate = res.scalars().first()
    if not gate:
        raise HTTPException(status_code=404, detail=f"No gate with site_id '{site_id}'")

    if payload.name is not None:
        gate.name = payload.name
    if payload.is_active is not None:
        gate.is_active = payload.is_active
    await db.commit()

    return _gate_to_summary(await _fetch_gate(db, site_id))


@router.post("/{site_id}/services", response_model=GateSummary)
async def assign_service(
    site_id: str,
    payload: AssignServiceRequest,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(select(Gate).where(Gate.site_id == site_id))
    gate = res.scalars().first()
    if not gate:
        raise HTTPException(status_code=404, detail=f"No gate with site_id '{site_id}' -- create it first via POST /admin/gates")

    existing = await db.execute(
        select(GateService).where(GateService.site_id == site_id, GateService.title == payload.title)
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail=f"Gate '{site_id}' already serves '{payload.title}'")

    attraction_uuid = None
    if payload.attraction_id:
        try:
            attraction_uuid = uuid.UUID(payload.attraction_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid attraction_id UUID")

    db.add(GateService(site_id=site_id, title=payload.title, attraction_id=attraction_uuid))
    await db.commit()

    return _gate_to_summary(await _fetch_gate(db, site_id))


@router.delete("/{site_id}/services/{service_id}", response_model=GateSummary)
async def unassign_service(
    site_id: str,
    service_id: str,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    try:
        service_uuid = uuid.UUID(service_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid service_id UUID")

    res = await db.execute(
        select(GateService).where(GateService.id == service_uuid, GateService.site_id == site_id)
    )
    service = res.scalars().first()
    if not service:
        raise HTTPException(status_code=404, detail="Service assignment not found")

    await db.delete(service)
    await db.commit()

    return _gate_to_summary(await _fetch_gate(db, site_id))


# -------------------------------------------------------------
# Gate staff (COUNTER/GATEKEEPER login accounts) -- cloud-authored
# counterpart of the LPU's local StaffUser. Created/edited/removed here,
# then pulled down and mirrored by each LPU via GET /sync/staff (see
# sync.py) into its own local StaffUser table.
# -------------------------------------------------------------
def _staff_to_summary(s: GateStaff) -> StaffSummary:
    return StaffSummary(
        id=str(s.id), username=s.username, full_name=s.full_name,
        role=s.role, is_active=s.is_active, created_at=str(s.created_at),
    )


@router.get("/{site_id}/staff", response_model=list[StaffSummary])
async def list_staff(
    site_id: str,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(GateStaff)
        .where(GateStaff.site_id == site_id, GateStaff.is_deleted == False)  # noqa: E712
        .order_by(GateStaff.created_at.asc())
    )
    return [_staff_to_summary(s) for s in res.scalars().all()]


@router.post("/{site_id}/staff", response_model=StaffSummary)
async def create_staff(
    site_id: str,
    payload: StaffCreateRequest,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    if not await _fetch_gate(db, site_id):
        raise HTTPException(status_code=404, detail=f"No gate with site_id '{site_id}' -- create it first via POST /admin/gates")
    if payload.role not in VALID_STAFF_ROLES:
        raise HTTPException(status_code=400, detail=f"role must be one of {sorted(VALID_STAFF_ROLES)}")

    existing = await db.execute(
        select(GateStaff).where(
            GateStaff.site_id == site_id, GateStaff.username == payload.username, GateStaff.is_deleted == False,  # noqa: E712
        )
    )
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail=f"'{payload.username}' already exists at site '{site_id}'")

    staff = GateStaff(
        site_id=site_id, username=payload.username,
        password_hash=pwd_context.hash(payload.password),
        full_name=payload.full_name, role=payload.role, is_active=True,
    )
    db.add(staff)
    await db.commit()
    await db.refresh(staff)
    return _staff_to_summary(staff)


@router.patch("/{site_id}/staff/{staff_id}", response_model=StaffSummary)
async def update_staff(
    site_id: str,
    staff_id: str,
    payload: StaffUpdateRequest,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    try:
        staff_uuid = uuid.UUID(staff_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid staff_id UUID")

    res = await db.execute(
        select(GateStaff).where(GateStaff.id == staff_uuid, GateStaff.site_id == site_id)
    )
    staff = res.scalars().first()
    if not staff or staff.is_deleted:
        raise HTTPException(status_code=404, detail="Staff account not found")

    if payload.full_name is not None:
        staff.full_name = payload.full_name
    if payload.role is not None:
        if payload.role not in VALID_STAFF_ROLES:
            raise HTTPException(status_code=400, detail=f"role must be one of {sorted(VALID_STAFF_ROLES)}")
        staff.role = payload.role
    if payload.password is not None:
        staff.password_hash = pwd_context.hash(payload.password)
    if payload.is_active is not None:
        staff.is_active = payload.is_active

    await db.commit()
    await db.refresh(staff)
    return _staff_to_summary(staff)


@router.delete("/{site_id}/staff/{staff_id}")
async def delete_staff(
    site_id: str,
    staff_id: str,
    admin_user: User = Depends(verify_admin_role),
    db: AsyncSession = Depends(get_db),
):
    try:
        staff_uuid = uuid.UUID(staff_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid staff_id UUID")

    res = await db.execute(
        select(GateStaff).where(GateStaff.id == staff_uuid, GateStaff.site_id == site_id)
    )
    staff = res.scalars().first()
    if not staff or staff.is_deleted:
        raise HTTPException(status_code=404, detail="Staff account not found")

    # Tombstone, not a hard delete -- GET /sync/staff is a "since" feed,
    # so a row that's simply gone leaves no trace for an LPU to notice.
    # This flag + bumped updated_at is what makes the LPU actually delete
    # its local copy on the next pull (see sync_service.apply_staff_snapshot).
    staff.is_deleted = True
    staff.is_active = False
    staff.updated_at = datetime.utcnow()
    await db.commit()
    return {"status": "OK", "message": f"'{staff.username}' removed -- will be deleted from the LPU on its next sync"}
