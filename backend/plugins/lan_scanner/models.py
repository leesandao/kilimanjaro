from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.sql import func

from core.database import Base


class Device(Base):
    __tablename__ = "devices"

    id = Column(Integer, primary_key=True, autoincrement=True)
    mac_address = Column(String, unique=True, nullable=False, index=True)
    ip_address = Column(String, nullable=False, index=True)
    hostname = Column(String, nullable=True)
    vendor = Column(String, nullable=True)
    status = Column(String, default="online", index=True)
    device_type = Column(String, default="unknown")
    custom_name = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    first_seen = Column(DateTime, nullable=False, server_default=func.now())
    last_seen = Column(DateTime, nullable=False, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class ScanRecord(Base):
    __tablename__ = "scan_records"

    id = Column(Integer, primary_key=True, autoincrement=True)
    subnet = Column(String, nullable=False)
    device_count = Column(Integer, nullable=False, default=0)
    new_devices = Column(Integer, default=0)
    offline_devices = Column(Integer, default=0)
    scan_method = Column(String, default="arp")
    scan_duration_ms = Column(Integer, nullable=True)
    status = Column(String, default="completed")
    error_message = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=False, server_default=func.now())
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())


class DeviceHistory(Base):
    __tablename__ = "device_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    scan_id = Column(Integer, ForeignKey("scan_records.id"))
    timestamp = Column(DateTime, nullable=False, server_default=func.now())
    online_count = Column(Integer, nullable=False, default=0)
    offline_count = Column(Integer, nullable=False, default=0)
    total_count = Column(Integer, nullable=False, default=0)
