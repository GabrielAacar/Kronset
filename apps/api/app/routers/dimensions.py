from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query

from app.meta_repo import execute, fetch_all, fetch_one, j
from app.schemas import DimensionCreate, DimensionOut


dimensions_router = APIRouter()


def _serialize_dimension(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "dataset_id": str(row["dataset_id"]),
        "name": row["name"],
        "description": row.get("description", ""),
        "expression": row["expression"],
        "overrides": row.get("overrides") or {},
        "data_type": row.get("data_type", "text"),
        "created_at": str(row["created_at"]),
    }


@dimensions_router.get("", response_model=list[DimensionOut])
def list_dimensions(dataset_id: str | None = Query(default=None)):
    if dataset_id:
        rows = fetch_all(
            "SELECT * FROM dimensions WHERE dataset_id=%(dataset_id)s ORDER BY created_at DESC",
            {"dataset_id": dataset_id},
        )
    else:
        rows = fetch_all("SELECT * FROM dimensions ORDER BY created_at DESC")
    return [_serialize_dimension(row) for row in rows]


@dimensions_router.get("/{id}", response_model=DimensionOut)
def get_dimension(id: str):
    row = fetch_one("SELECT * FROM dimensions WHERE id=%(id)s", {"id": id})
    if not row:
        raise HTTPException(status_code=404, detail="dimension not found")
    return _serialize_dimension(row)


@dimensions_router.post("", response_model=DimensionOut)
def create_dimension(payload: DimensionCreate):
    dataset = fetch_one("SELECT id FROM datasets WHERE id=%(id)s", {"id": str(payload.dataset_id)})
    if not dataset:
        raise HTTPException(status_code=400, detail="dataset_id invalid")

    dim_id = str(uuid4())
    execute(
        """
        INSERT INTO dimensions (id, dataset_id, name, description, expression, overrides, data_type)
        VALUES (%(id)s, %(dataset_id)s, %(name)s, %(description)s, %(expression)s, %(overrides)s, %(data_type)s)
        """,
        {
            "id": dim_id,
            "dataset_id": str(payload.dataset_id),
            "name": payload.name,
            "description": payload.description,
            "expression": payload.expression,
            "overrides": j(payload.overrides),
            "data_type": payload.data_type,
        },
    )
    row = fetch_one("SELECT * FROM dimensions WHERE id=%(id)s", {"id": dim_id})
    if not row:
        raise HTTPException(status_code=500, detail="failed to create dimension")
    return _serialize_dimension(row)


@dimensions_router.put("/{id}", response_model=DimensionOut)
def update_dimension(id: str, payload: DimensionCreate):
    current = fetch_one("SELECT id FROM dimensions WHERE id=%(id)s", {"id": id})
    if not current:
        raise HTTPException(status_code=404, detail="dimension not found")

    dataset = fetch_one("SELECT id FROM datasets WHERE id=%(id)s", {"id": str(payload.dataset_id)})
    if not dataset:
        raise HTTPException(status_code=400, detail="dataset_id invalid")

    execute(
        """
        UPDATE dimensions
        SET dataset_id=%(dataset_id)s,
            name=%(name)s,
            description=%(description)s,
            expression=%(expression)s,
            overrides=%(overrides)s,
            data_type=%(data_type)s
        WHERE id=%(id)s
        """,
        {
            "id": id,
            "dataset_id": str(payload.dataset_id),
            "name": payload.name,
            "description": payload.description,
            "expression": payload.expression,
            "overrides": j(payload.overrides),
            "data_type": payload.data_type,
        },
    )
    row = fetch_one("SELECT * FROM dimensions WHERE id=%(id)s", {"id": id})
    if not row:
        raise HTTPException(status_code=500, detail="failed to update dimension")
    return _serialize_dimension(row)


@dimensions_router.delete("/{id}")
def delete_dimension(id: str):
    current = fetch_one("SELECT id FROM dimensions WHERE id=%(id)s", {"id": id})
    if not current:
        raise HTTPException(status_code=404, detail="dimension not found")
    execute("DELETE FROM dimensions WHERE id=%(id)s", {"id": id})
    return {"ok": True}
