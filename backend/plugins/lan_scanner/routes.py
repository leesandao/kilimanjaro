import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, func, desc
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from plugins.lan_scanner.models import Device, ScanRecord, DeviceHistory
from plugins.lan_scanner.schemas import DeviceOut, ScanSummary, ScanRecordOut, HistoryPoint
from plugins.lan_scanner.scanner import detect_subnets
from plugins.lan_scanner.tasks import run_scan

router = APIRouter()


@router.get("/devices", response_model=list[DeviceOut])
async def list_devices(
    status: str | None = Query(None, description="Filter by status: online/offline"),
    session: AsyncSession = Depends(get_session),
):
    stmt = select(Device).order_by(Device.ip_address)
    if status:
        stmt = stmt.where(Device.status == status)
    result = await session.execute(stmt)
    return result.scalars().all()


@router.get("/devices/{ip_address}", response_model=DeviceOut)
async def get_device(ip_address: str, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Device).where(Device.ip_address == ip_address))
    device = result.scalar_one_or_none()
    if not device:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Device not found")
    return device


@router.get("/summary", response_model=ScanSummary)
async def get_summary(session: AsyncSession = Depends(get_session)):
    total = await session.scalar(select(func.count(Device.id)))
    online = await session.scalar(select(func.count(Device.id)).where(Device.status == "online"))
    offline = (total or 0) - (online or 0)

    last_scan = await session.scalar(
        select(ScanRecord.completed_at).order_by(desc(ScanRecord.completed_at)).limit(1)
    )
    subnets = detect_subnets()

    return ScanSummary(
        total_devices=total or 0,
        online_devices=online or 0,
        offline_devices=offline,
        last_scan_at=last_scan,
        subnets=subnets,
    )


@router.get("/history", response_model=list[HistoryPoint])
async def get_history(
    limit: int = Query(50, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(DeviceHistory).order_by(desc(DeviceHistory.timestamp)).limit(limit)
    )
    rows = result.scalars().all()
    return list(reversed(rows))


@router.get("/scans", response_model=list[ScanRecordOut])
async def list_scans(
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
):
    result = await session.execute(
        select(ScanRecord).order_by(desc(ScanRecord.started_at)).limit(limit)
    )
    return result.scalars().all()


@router.post("/scan")
async def trigger_scan():
    """Trigger an immediate manual scan."""
    asyncio.create_task(run_scan())
    return {"message": "Scan started"}


@router.get("/subnets")
async def get_subnets():
    return {"subnets": detect_subnets()}
