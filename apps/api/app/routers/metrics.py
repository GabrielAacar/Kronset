from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query

from app.meta_repo import execute, fetch_all, fetch_one, j
from app.schemas import MetricCreate, MetricOut


metrics_router = APIRouter()


def _serialize_metric(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "dataset_id": str(row["dataset_id"]),
        "name": row["name"],
        "description": row.get("description", ""),
        "metric_type": row["metric_type"],
        "config": row.get("config") or {},
        "format": row.get("format", ""),
        "created_at": str(row["created_at"]),
    }


@metrics_router.get("", response_model=list[MetricOut])
def list_metrics(dataset_id: str | None = Query(default=None)):
    if dataset_id:
        rows = fetch_all(
            "SELECT * FROM metrics WHERE dataset_id=%(dataset_id)s ORDER BY created_at DESC",
            {"dataset_id": dataset_id},
        )
    else:
        rows = fetch_all("SELECT * FROM metrics ORDER BY created_at DESC")
    return [_serialize_metric(row) for row in rows]


@metrics_router.get("/{id}", response_model=MetricOut)
def get_metric(id: str):
    row = fetch_one("SELECT * FROM metrics WHERE id=%(id)s", {"id": id})
    if not row:
        raise HTTPException(status_code=404, detail="metric not found")
    return _serialize_metric(row)


@metrics_router.post("", response_model=MetricOut)
def create_metric(payload: MetricCreate):
    dataset = fetch_one("SELECT id FROM datasets WHERE id=%(id)s", {"id": str(payload.dataset_id)})
    if not dataset:
        raise HTTPException(status_code=400, detail="dataset_id invalid")

    metric_id = str(uuid4())
    execute(
        """
        INSERT INTO metrics (id, dataset_id, name, description, metric_type, config, format)
        VALUES (%(id)s, %(dataset_id)s, %(name)s, %(description)s, %(metric_type)s, %(config)s, %(format)s)
        """,
        {
            "id": metric_id,
            "dataset_id": str(payload.dataset_id),
            "name": payload.name,
            "description": payload.description,
            "metric_type": payload.metric_type,
            "config": j(payload.config),
            "format": payload.format,
        },
    )
    row = fetch_one("SELECT * FROM metrics WHERE id=%(id)s", {"id": metric_id})
    if not row:
        raise HTTPException(status_code=500, detail="failed to create metric")
    return _serialize_metric(row)


@metrics_router.put("/{id}", response_model=MetricOut)
def update_metric(id: str, payload: MetricCreate):
    current = fetch_one("SELECT id FROM metrics WHERE id=%(id)s", {"id": id})
    if not current:
        raise HTTPException(status_code=404, detail="metric not found")

    dataset = fetch_one("SELECT id FROM datasets WHERE id=%(id)s", {"id": str(payload.dataset_id)})
    if not dataset:
        raise HTTPException(status_code=400, detail="dataset_id invalid")

    execute(
        """
        UPDATE metrics
        SET dataset_id=%(dataset_id)s,
            name=%(name)s,
            description=%(description)s,
            metric_type=%(metric_type)s,
            config=%(config)s,
            format=%(format)s
        WHERE id=%(id)s
        """,
        {
            "id": id,
            "dataset_id": str(payload.dataset_id),
            "name": payload.name,
            "description": payload.description,
            "metric_type": payload.metric_type,
            "config": j(payload.config),
            "format": payload.format,
        },
    )
    row = fetch_one("SELECT * FROM metrics WHERE id=%(id)s", {"id": id})
    if not row:
        raise HTTPException(status_code=500, detail="failed to update metric")
    return _serialize_metric(row)


@metrics_router.delete("/{id}")
def delete_metric(id: str):
    current = fetch_one("SELECT id FROM metrics WHERE id=%(id)s", {"id": id})
    if not current:
        raise HTTPException(status_code=404, detail="metric not found")
    execute("DELETE FROM metrics WHERE id=%(id)s", {"id": id})
    return {"ok": True}
