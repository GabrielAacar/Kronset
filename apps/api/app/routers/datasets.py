from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.meta_repo import execute, fetch_all, fetch_one, j
from app.schemas import DatasetCreate, DatasetOut


datasets_router = APIRouter()


def _serialize_dataset(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "connection_id": str(row["connection_id"]),
        "name": row["name"],
        "description": row.get("description", ""),
        "base_sql": row["base_sql"],
        "overrides": row.get("overrides") or {},
        "created_at": str(row["created_at"]),
    }


@datasets_router.get("", response_model=list[DatasetOut])
def list_datasets():
    rows = fetch_all("SELECT * FROM datasets ORDER BY created_at DESC")
    return [_serialize_dataset(r) for r in rows]


@datasets_router.get("/{id}", response_model=DatasetOut)
def get_dataset(id: str):
    row = fetch_one("SELECT * FROM datasets WHERE id=%(id)s", {"id": id})
    if not row:
        raise HTTPException(status_code=404, detail="dataset not found")
    return _serialize_dataset(row)


@datasets_router.post("", response_model=DatasetOut)
def create_dataset(payload: DatasetCreate):
    connection = fetch_one("SELECT id FROM connections WHERE id=%(id)s", {"id": str(payload.connection_id)})
    if not connection:
        raise HTTPException(status_code=400, detail="connection_id invalid")

    did = str(uuid4())
    execute(
        """
        INSERT INTO datasets (id, connection_id, name, description, base_sql, overrides)
        VALUES (%(id)s, %(connection_id)s, %(name)s, %(description)s, %(base_sql)s, %(overrides)s)
        """,
        {
            "id": did,
            "connection_id": str(payload.connection_id),
            "name": payload.name,
            "description": payload.description,
            "base_sql": payload.base_sql,
            "overrides": j(payload.overrides),
        },
    )
    row = fetch_one("SELECT * FROM datasets WHERE id=%(id)s", {"id": did})
    if not row:
        raise HTTPException(status_code=500, detail="failed to create dataset")
    return _serialize_dataset(row)


@datasets_router.put("/{id}", response_model=DatasetOut)
def update_dataset(id: str, payload: DatasetCreate):
    current = fetch_one("SELECT id FROM datasets WHERE id=%(id)s", {"id": id})
    if not current:
        raise HTTPException(status_code=404, detail="dataset not found")

    connection = fetch_one("SELECT id FROM connections WHERE id=%(id)s", {"id": str(payload.connection_id)})
    if not connection:
        raise HTTPException(status_code=400, detail="connection_id invalid")

    execute(
        """
        UPDATE datasets
        SET connection_id=%(connection_id)s,
            name=%(name)s,
            description=%(description)s,
            base_sql=%(base_sql)s,
            overrides=%(overrides)s
        WHERE id=%(id)s
        """,
        {
            "id": id,
            "connection_id": str(payload.connection_id),
            "name": payload.name,
            "description": payload.description,
            "base_sql": payload.base_sql,
            "overrides": j(payload.overrides),
        },
    )
    row = fetch_one("SELECT * FROM datasets WHERE id=%(id)s", {"id": id})
    if not row:
        raise HTTPException(status_code=500, detail="failed to update dataset")
    return _serialize_dataset(row)


@datasets_router.delete("/{id}")
def delete_dataset(id: str):
    row = fetch_one("SELECT id FROM datasets WHERE id=%(id)s", {"id": id})
    if not row:
        raise HTTPException(status_code=404, detail="dataset not found")

    dimensions_count = fetch_one(
        "SELECT COUNT(*) AS total FROM dimensions WHERE dataset_id=%(id)s",
        {"id": id},
    )
    metrics_count = fetch_one(
        "SELECT COUNT(*) AS total FROM metrics WHERE dataset_id=%(id)s",
        {"id": id},
    )
    has_dependencies = (dimensions_count and dimensions_count["total"] > 0) or (
        metrics_count and metrics_count["total"] > 0
    )
    if has_dependencies:
        raise HTTPException(
            status_code=400,
            detail="dataset has linked dimensions or metrics",
        )

    execute("DELETE FROM datasets WHERE id=%(id)s", {"id": id})
    return {"ok": True}
