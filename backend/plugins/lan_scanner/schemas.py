from datetime import datetime

from pydantic import BaseModel


class DeviceOut(BaseModel):
    id: int
    mac_address: str
    ip_address: str
    hostname: str | None
    vendor: str | None
    status: str
    device_type: str
    custom_name: str | None
    first_seen: datetime
    last_seen: datetime

    model_config = {"from_attributes": True}


class ScanSummary(BaseModel):
    total_devices: int
    online_devices: int
    offline_devices: int
    last_scan_at: datetime | None
    subnets: list[str]


class ScanRecordOut(BaseModel):
    id: int
    subnet: str
    device_count: int
    new_devices: int
    offline_devices: int
    scan_method: str
    scan_duration_ms: int | None
    status: str
    started_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class HistoryPoint(BaseModel):
    timestamp: datetime
    online_count: int
    offline_count: int
    total_count: int
