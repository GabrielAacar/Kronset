import re
import unicodedata
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.meta_repo import execute, fetch_all, fetch_one, j
from app.schemas import DashboardCreate, DashboardOut, DashboardUpdate


dashboards_router = APIRouter()


def _serialize_dashboard(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "description": row.get("description", ""),
        "dataset_id": str(row["dataset_id"]),
        "header": row.get("header") or {},
        "layout": row.get("layout") or {},
        "is_published": bool(row.get("is_published", False)),
        "slug": row.get("slug") or "",
        "created_at": str(row["created_at"]),
    }


def _slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value or "")
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-zA-Z0-9\s-]", "", ascii_text).strip().lower()
    slug = re.sub(r"[\s_-]+", "-", slug)
    slug = re.sub(r"-{2,}", "-", slug).strip("-")
    return slug or "dashboard"


def _generate_unique_slug(name: str, exclude_id: str | None = None) -> str:
    base = _slugify(name)
    candidate = base
    index = 2
    while True:
        if exclude_id:
            existing = fetch_one(
                "SELECT id FROM dashboards WHERE slug=%(slug)s AND id <> %(id)s",
                {"slug": candidate, "id": exclude_id},
            )
        else:
            existing = fetch_one("SELECT id FROM dashboards WHERE slug=%(slug)s", {"slug": candidate})
        if not existing:
            return candidate
        candidate = f"{base}-{index}"
        index += 1


@dashboards_router.get("", response_model=list[DashboardOut])
def list_dashboards():
    rows = fetch_all("SELECT * FROM dashboards ORDER BY created_at DESC")
    return [_serialize_dashboard(row) for row in rows]


@dashboards_router.get("/slug/{slug}", response_model=DashboardOut)
def view_dashboard(slug: str):
    row = fetch_one(
        "SELECT * FROM dashboards WHERE slug=%(slug)s AND is_published=TRUE",
        {"slug": slug},
    )
    if not row:
        raise HTTPException(status_code=404, detail="dashboard not found")
    return _serialize_dashboard(row)


@dashboards_router.get("/{id}", response_model=DashboardOut)
def get_dashboard(id: str):
    row = fetch_one("SELECT * FROM dashboards WHERE id=%(id)s", {"id": id})
    if not row:
        raise HTTPException(status_code=404, detail="dashboard not found")
    return _serialize_dashboard(row)


@dashboards_router.post("", response_model=DashboardOut)
def create_dashboard(payload: DashboardCreate):
    dataset = fetch_one("SELECT id FROM datasets WHERE id=%(id)s", {"id": str(payload.dataset_id)})
    if not dataset:
        raise HTTPException(status_code=400, detail="dataset_id invalid")

    dashboard_id = str(uuid4())
    slug = _generate_unique_slug(payload.name)
    execute(
        """
        INSERT INTO dashboards (id, name, description, dataset_id, header, layout, is_published, slug)
        VALUES (%(id)s, %(name)s, %(description)s, %(dataset_id)s, %(header)s, %(layout)s, FALSE, %(slug)s)
        """,
        {
            "id": dashboard_id,
            "name": payload.name,
            "description": payload.description,
            "dataset_id": str(payload.dataset_id),
            "header": j(payload.header),
            "layout": j(payload.layout),
            "slug": slug,
        },
    )
    row = fetch_one("SELECT * FROM dashboards WHERE id=%(id)s", {"id": dashboard_id})
    if not row:
        raise HTTPException(status_code=500, detail="failed to create dashboard")
    return _serialize_dashboard(row)


@dashboards_router.put("/{id}", response_model=DashboardOut)
def update_dashboard(id: str, payload: DashboardUpdate):
    current = fetch_one("SELECT * FROM dashboards WHERE id=%(id)s", {"id": id})
    if not current:
        raise HTTPException(status_code=404, detail="dashboard not found")

    name = payload.name if payload.name is not None else current["name"]
    description = payload.description if payload.description is not None else current.get("description", "")
    dataset_id = str(current["dataset_id"])
    if payload.name is not None:
        slug = _generate_unique_slug(payload.name, exclude_id=id)
    else:
        slug = current.get("slug") or _generate_unique_slug(name, exclude_id=id)
    header = payload.header if payload.header is not None else (current.get("header") or {})
    layout = payload.layout if payload.layout is not None else (current.get("layout") or {})
    is_published = payload.is_published if payload.is_published is not None else bool(current.get("is_published", False))

    execute(
        """
        UPDATE dashboards
        SET name=%(name)s,
            description=%(description)s,
            dataset_id=%(dataset_id)s,
            header=%(header)s,
            layout=%(layout)s,
            is_published=%(is_published)s,
            slug=%(slug)s
        WHERE id=%(id)s
        """,
        {
            "id": id,
            "name": name,
            "description": description,
            "dataset_id": dataset_id,
            "header": j(header),
            "layout": j(layout),
            "is_published": is_published,
            "slug": slug,
        },
    )
    row = fetch_one("SELECT * FROM dashboards WHERE id=%(id)s", {"id": id})
    if not row:
        raise HTTPException(status_code=500, detail="failed to update dashboard")
    return _serialize_dashboard(row)


@dashboards_router.delete("/{id}")
def delete_dashboard(id: str):
    current = fetch_one("SELECT id FROM dashboards WHERE id=%(id)s", {"id": id})
    if not current:
        raise HTTPException(status_code=404, detail="dashboard not found")
    execute("DELETE FROM dashboards WHERE id=%(id)s", {"id": id})
    return {"ok": True}


@dashboards_router.post("/{id}/publish")
def publish_dashboard(id: str):
    current = fetch_one("SELECT id FROM dashboards WHERE id=%(id)s", {"id": id})
    if not current:
        raise HTTPException(status_code=404, detail="dashboard not found")
    execute("UPDATE dashboards SET is_published=TRUE WHERE id=%(id)s", {"id": id})
    return {"ok": True}


@dashboards_router.post("/{id}/unpublish")
def unpublish_dashboard(id: str):
    current = fetch_one("SELECT id FROM dashboards WHERE id=%(id)s", {"id": id})
    if not current:
        raise HTTPException(status_code=404, detail="dashboard not found")
    execute("UPDATE dashboards SET is_published=FALSE WHERE id=%(id)s", {"id": id})
    return {"ok": True}
