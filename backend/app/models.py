from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class AlertSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class Device(BaseModel):
    id: str
    mac: str
    ip: str
    hostname: str
    vendor: str
    bytes_sent: int = 0
    bytes_recv: int = 0
    rate_sent: float = 0.0
    rate_recv: float = 0.0
    connection_count: int = 0
    is_local_agent: bool = False
    last_seen: datetime
    greed_score: float = 0.0
    metering_source: str = "unmetered"


class ProcessTraffic(BaseModel):
    pid: int
    name: str
    exe: Optional[str] = None
    bytes_sent: int = 0
    bytes_recv: int = 0
    rate_sent: float = 0.0
    rate_recv: float = 0.0
    connection_count: int = 0
    remote_hosts: list[str] = Field(default_factory=list)
    greed_score: float = 0.0


class Connection(BaseModel):
    id: str
    device_id: Optional[str] = None
    process_name: Optional[str] = None
    local_addr: str
    remote_addr: str
    remote_port: int
    protocol: str
    bytes_sent: int = 0
    bytes_recv: int = 0
    first_seen: datetime
    last_seen: datetime
    is_new: bool = False


class Alert(BaseModel):
    id: str
    severity: AlertSeverity
    category: str
    title: str
    message: str
    explanation: str
    device_id: Optional[str] = None
    process_name: Optional[str] = None
    created_at: datetime
    acknowledged: bool = False


class NetworkSummary(BaseModel):
    total_devices: int
    active_devices: int
    total_rate_sent: float
    total_rate_recv: float
    alert_count: int
    critical_alert_count: int
    monitoring_since: Optional[datetime] = None


class FeatureInfo(BaseModel):
    id: str
    symbol: str
    title: str
    summary: str
    how_it_works: str
    limitations: str
    status: str  # active | partial | planned
