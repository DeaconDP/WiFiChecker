from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

import aiosqlite

from app.config import settings


def _utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


class Database:
    def __init__(self, path: str | None = None):
        self.path = path or settings.database_path
        self._schema_ready = False

    @asynccontextmanager
    async def _session(self):
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        db = await aiosqlite.connect(self.path)
        db.row_factory = aiosqlite.Row
        try:
            if not self._schema_ready:
                await self._init_schema(db)
                self._schema_ready = True
            yield db
        finally:
            await db.close()

    async def _init_schema(self, db: aiosqlite.Connection) -> None:
        await db.executescript(
            """
            CREATE TABLE IF NOT EXISTS devices (
                id TEXT PRIMARY KEY,
                mac TEXT,
                ip TEXT,
                hostname TEXT,
                vendor TEXT,
                bytes_sent INTEGER DEFAULT 0,
                bytes_recv INTEGER DEFAULT 0,
                connection_count INTEGER DEFAULT 0,
                is_local_agent INTEGER DEFAULT 0,
                last_seen TEXT,
                greed_score REAL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS traffic_samples (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_type TEXT,
                entity_id TEXT,
                bytes_sent INTEGER,
                bytes_recv INTEGER,
                recorded_at TEXT
            );

            CREATE TABLE IF NOT EXISTS alerts (
                id TEXT PRIMARY KEY,
                severity TEXT,
                category TEXT,
                title TEXT,
                message TEXT,
                explanation TEXT,
                device_id TEXT,
                process_name TEXT,
                created_at TEXT,
                acknowledged INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS connections (
                id TEXT PRIMARY KEY,
                device_id TEXT,
                process_name TEXT,
                local_addr TEXT,
                remote_addr TEXT,
                remote_port INTEGER,
                protocol TEXT,
                bytes_sent INTEGER DEFAULT 0,
                bytes_recv INTEGER DEFAULT 0,
                first_seen TEXT,
                last_seen TEXT,
                is_new INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS meta (
                key TEXT PRIMARY KEY,
                value TEXT
            );
            """
        )
        await db.commit()

    async def set_meta(self, key: str, value: str) -> None:
        async with self._session() as db:
            await db.execute(
                "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)",
                (key, value),
            )
            await db.commit()

    async def get_meta(self, key: str) -> str | None:
        async with self._session() as db:
            async with db.execute(
                "SELECT value FROM meta WHERE key = ?", (key,)
            ) as cursor:
                row = await cursor.fetchone()
                return row["value"] if row else None

    async def upsert_device(self, device: dict) -> None:
        async with self._session() as db:
            await db.execute(
                """
                INSERT INTO devices (
                    id, mac, ip, hostname, vendor, bytes_sent, bytes_recv,
                    connection_count, is_local_agent, last_seen, greed_score
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    ip=excluded.ip,
                    hostname=excluded.hostname,
                    bytes_sent=excluded.bytes_sent,
                    bytes_recv=excluded.bytes_recv,
                    connection_count=excluded.connection_count,
                    last_seen=excluded.last_seen,
                    greed_score=excluded.greed_score
                """,
                (
                    device["id"],
                    device["mac"],
                    device["ip"],
                    device["hostname"],
                    device["vendor"],
                    device["bytes_sent"],
                    device["bytes_recv"],
                    device["connection_count"],
                    int(device.get("is_local_agent", False)),
                    device["last_seen"],
                    device.get("greed_score", 0),
                ),
            )
            await db.commit()

    async def list_devices(self) -> list[dict]:
        async with self._session() as db:
            async with db.execute(
                "SELECT * FROM devices ORDER BY greed_score DESC"
            ) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

    async def insert_traffic_sample(
        self, entity_type: str, entity_id: str, sent: int, recv: int
    ) -> None:
        async with self._session() as db:
            await db.execute(
                """
                INSERT INTO traffic_samples
                (entity_type, entity_id, bytes_sent, bytes_recv, recorded_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (entity_type, entity_id, sent, recv, _utcnow()),
            )
            await db.commit()

    async def get_traffic_history(
        self, entity_type: str, entity_id: str, limit: int = 100
    ) -> list[dict]:
        async with self._session() as db:
            async with db.execute(
                """
                SELECT * FROM traffic_samples
                WHERE entity_type = ? AND entity_id = ?
                ORDER BY recorded_at DESC LIMIT ?
                """,
                (entity_type, entity_id, limit),
            ) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

    async def insert_alert(self, alert: dict) -> None:
        async with self._session() as db:
            await db.execute(
                """
                INSERT OR IGNORE INTO alerts
                (id, severity, category, title, message, explanation,
                 device_id, process_name, created_at, acknowledged)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    alert["id"],
                    alert["severity"],
                    alert["category"],
                    alert["title"],
                    alert["message"],
                    alert["explanation"],
                    alert.get("device_id"),
                    alert.get("process_name"),
                    alert["created_at"],
                    int(alert.get("acknowledged", False)),
                ),
            )
            await db.commit()

    async def list_alerts(self, limit: int = 50) -> list[dict]:
        async with self._session() as db:
            async with db.execute(
                """
                SELECT * FROM alerts
                ORDER BY created_at DESC LIMIT ?
                """,
                (limit,),
            ) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

    async def acknowledge_alert(self, alert_id: str) -> None:
        async with self._session() as db:
            await db.execute(
                "UPDATE alerts SET acknowledged = 1 WHERE id = ?", (alert_id,)
            )
            await db.commit()

    async def upsert_connection(self, conn: dict) -> None:
        async with self._session() as db:
            await db.execute(
                """
                INSERT INTO connections (
                    id, device_id, process_name, local_addr, remote_addr,
                    remote_port, protocol, bytes_sent, bytes_recv,
                    first_seen, last_seen, is_new
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    bytes_sent=excluded.bytes_sent,
                    bytes_recv=excluded.bytes_recv,
                    last_seen=excluded.last_seen,
                    is_new=excluded.is_new
                """,
                (
                    conn["id"],
                    conn.get("device_id"),
                    conn.get("process_name"),
                    conn["local_addr"],
                    conn["remote_addr"],
                    conn["remote_port"],
                    conn["protocol"],
                    conn.get("bytes_sent", 0),
                    conn.get("bytes_recv", 0),
                    conn["first_seen"],
                    conn["last_seen"],
                    int(conn.get("is_new", False)),
                ),
            )
            await db.commit()

    async def list_connections(self, limit: int = 100) -> list[dict]:
        async with self._session() as db:
            async with db.execute(
                "SELECT * FROM connections ORDER BY last_seen DESC LIMIT ?",
                (limit,),
            ) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

    async def export_roadmap(self) -> str:
        path = Path(__file__).resolve().parents[2] / "docs" / "TODO.md"
        if path.exists():
            return path.read_text()
        return "# Roadmap\n\nNo roadmap file found."
