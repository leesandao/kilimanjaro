import logging
import time
from datetime import datetime, timezone

from sqlalchemy import select

from core.database import async_session_factory
from core.websocket_manager import ws_manager
from plugins.lan_scanner.models import Device, ScanRecord, DeviceHistory
from plugins.lan_scanner.scanner import detect_subnets, scan_network

logger = logging.getLogger(__name__)


async def run_scan():
    """Execute a full network scan, update DB, and broadcast results."""
    await ws_manager.broadcast("lan_scanner:scan_started", {})
    start_time = time.time()

    subnets = detect_subnets()
    all_devices = []
    scan_method = "arp"

    for subnet in subnets:
        try:
            devices, method = await scan_network(subnet)
            all_devices.extend(devices)
            if method == "ping":
                scan_method = "ping"
        except Exception as e:
            logger.error("Scan failed for %s: %s", subnet, e)

    duration_ms = int((time.time() - start_time) * 1000)
    now = datetime.now(timezone.utc)
    new_count = 0
    offline_count = 0

    async with async_session_factory() as session:
        # Track which MACs we found in this scan
        found_macs = set()

        for device_data in all_devices:
            mac = device_data.get("mac_address", "unknown")
            if mac == "unknown":
                continue
            found_macs.add(mac)

            result = await session.execute(select(Device).where(Device.mac_address == mac))
            existing = result.scalar_one_or_none()

            if existing:
                existing.ip_address = device_data["ip_address"]
                existing.hostname = device_data.get("hostname") or existing.hostname
                existing.vendor = device_data.get("vendor") or existing.vendor
                existing.status = "online"
                existing.last_seen = now
            else:
                new_device = Device(
                    mac_address=mac,
                    ip_address=device_data["ip_address"],
                    hostname=device_data.get("hostname"),
                    vendor=device_data.get("vendor"),
                    status="online",
                    first_seen=now,
                    last_seen=now,
                )
                session.add(new_device)
                new_count += 1
                await ws_manager.broadcast("lan_scanner:device_new", device_data)

        # Mark devices not seen as offline
        all_result = await session.execute(select(Device).where(Device.status == "online"))
        for device in all_result.scalars():
            if device.mac_address not in found_macs:
                device.status = "offline"
                offline_count += 1
                await ws_manager.broadcast("lan_scanner:device_offline", {
                    "ip_address": device.ip_address,
                    "mac_address": device.mac_address,
                })

        # Create scan record
        scan_record = ScanRecord(
            subnet=",".join(subnets),
            device_count=len(all_devices),
            new_devices=new_count,
            offline_devices=offline_count,
            scan_method=scan_method,
            scan_duration_ms=duration_ms,
            status="completed",
            started_at=now,
            completed_at=datetime.now(timezone.utc),
        )
        session.add(scan_record)
        await session.flush()

        # Record history point
        total_result = await session.execute(select(Device))
        all_devs = total_result.scalars().all()
        online = sum(1 for d in all_devs if d.status == "online")
        offline = sum(1 for d in all_devs if d.status == "offline")

        history = DeviceHistory(
            scan_id=scan_record.id,
            timestamp=now,
            online_count=online,
            offline_count=offline,
            total_count=online + offline,
        )
        session.add(history)
        await session.commit()

    await ws_manager.broadcast("lan_scanner:scan_complete", {
        "total_devices": len(all_devices),
        "new_devices": new_count,
        "offline_devices": offline_count,
        "scan_duration_ms": duration_ms,
        "subnets": subnets,
    })
    logger.info("Scan complete: %d devices found, %d new, %d offline (%dms)",
                len(all_devices), new_count, offline_count, duration_ms)
