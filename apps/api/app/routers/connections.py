from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.meta_repo import execute, fetch_all, fetch_one, j
from app.schemas import ConnectionCreate, ConnectionCredentials, ConnectionOut


connections_router = APIRouter()


def _make_secret_ref(name: str) -> str:
    return f"KRONSET_CONN_{name.upper().replace(' ', '_').replace('-', '_')}"


def _serialize_connection(row: dict) -> dict:
    config = row.get("config") or {}
    credentials = {
        "host": config.get("host", ""),
        "port": config.get("port", 5432),
        "username": config.get("username", ""),
        "password": config.get("password", ""),
        "database": config.get("database", ""),
    }
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "db_type": row["db_type"],
        "credentials": credentials,
        "is_enabled": row["is_enabled"],
        "created_at": str(row["created_at"]),
    }


@connections_router.get("", response_model=list[ConnectionOut])
def list_connections():
    rows = fetch_all("SELECT * FROM connections ORDER BY created_at DESC")
    return [_serialize_connection(r) for r in rows]


@connections_router.get("/{id}", response_model=ConnectionOut)
def get_connection(id: str):
    row = fetch_one("SELECT * FROM connections WHERE id=%(id)s", {"id": id})
    if not row:
        raise HTTPException(status_code=404, detail="connection not found")
    return _serialize_connection(row)


@connections_router.post("", response_model=ConnectionOut)
def create_connection(payload: ConnectionCreate):
    cid = str(uuid4())
    execute(
        """
        INSERT INTO connections (id, name, db_type, config, secret_ref, is_enabled)
        VALUES (%(id)s, %(name)s, %(db_type)s, %(config)s, %(secret_ref)s, %(is_enabled)s)
        """,
        {
            "id": cid,
            "name": payload.name,
            "db_type": payload.db_type,
            "config": j(payload.credentials.model_dump()),
            "secret_ref": _make_secret_ref(payload.name),
            "is_enabled": payload.is_enabled,
        },
    )
    row = fetch_one("SELECT * FROM connections WHERE id=%(id)s", {"id": cid})
    if not row:
        raise HTTPException(status_code=500, detail="failed to create connection")
    return _serialize_connection(row)


@connections_router.put("/{id}", response_model=ConnectionOut)
def update_connection(id: str, payload: ConnectionCreate):
    current = fetch_one("SELECT * FROM connections WHERE id=%(id)s", {"id": id})
    if not current:
        raise HTTPException(status_code=404, detail="connection not found")

    execute(
        """
        UPDATE connections
        SET name=%(name)s,
            db_type=%(db_type)s,
            config=%(config)s,
            secret_ref=%(secret_ref)s,
            is_enabled=%(is_enabled)s
        WHERE id=%(id)s
        """,
        {
            "id": id,
            "name": payload.name,
            "db_type": payload.db_type,
            "config": j(payload.credentials.model_dump()),
            "secret_ref": _make_secret_ref(payload.name),
            "is_enabled": payload.is_enabled,
        },
    )

    row = fetch_one("SELECT * FROM connections WHERE id=%(id)s", {"id": id})
    if not row:
        raise HTTPException(status_code=500, detail="failed to update connection")
    return _serialize_connection(row)


@connections_router.delete("/{id}")
def delete_connection(id: str):
    current = fetch_one("SELECT id FROM connections WHERE id=%(id)s", {"id": id})
    if not current:
        raise HTTPException(status_code=404, detail="connection not found")
    execute("DELETE FROM connections WHERE id=%(id)s", {"id": id})
    return {"ok": True}


@connections_router.post("/{id}/test")
def test_connection(id: str):
    row = fetch_one("SELECT * FROM connections WHERE id = %(id)s", {"id": id})
    if not row:
        raise HTTPException(status_code=404, detail="Connection not found")

    config = row.get("config") or {}
    db_type = row["db_type"]
    host = config.get("host")
    port = config.get("port", 5432)
    username = config.get("username")
    password = config.get("password")
    database = config.get("database")

    dsn_map = {
        "postgres": f"postgresql://{username}:{password}@{host}:{port}/{database}",
        "mysql": f"mysql://{username}:{password}@{host}:{port}/{database}",
        "oracle": f"oracle+cx_oracle://{username}:{password}@{host}:{port}/{database}",
        "sqlserver": f"mssql+pyodbc://{username}:{password}@{host}:{port}/{database}",
    }

    dsn = dsn_map.get(db_type)
    if not dsn:
        return {"success": False, "error": f"Unsupported db_type: {db_type}"}
    if db_type != "postgres":
        return {"success": False, "error": f"{db_type} test is not implemented yet"}

    try:
        import psycopg
        from psycopg.rows import dict_row

        with psycopg.connect(dsn, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
        return {"success": True}
    except Exception as exc:  # noqa: BLE001 - endpoint must return error payload
        return {"success": False, "error": str(exc)}
