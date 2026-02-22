from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query

from app.meta_repo import execute, fetch_all, fetch_one, j
from app.schemas import WidgetCreate, WidgetOut, WidgetUpdate


widgets_router = APIRouter()


def _serialize_widget(row: dict) -> dict:
    return {
        "id": str(row["id"]),
        "dashboard_id": str(row["dashboard_id"]),
        "type": row["type"],
        "title": row.get("title", ""),
        "query": row.get("query") or {},
        "style": row.get("style") or {},
        "layout": row.get("layout") or {},
    }


@widgets_router.get("", response_model=list[WidgetOut])
def list_widgets(dashboard_id: str = Query(...)):
    rows = fetch_all(
        "SELECT * FROM widgets WHERE dashboard_id=%(dashboard_id)s ORDER BY created_at ASC",
        {"dashboard_id": dashboard_id},
    )
    return [_serialize_widget(row) for row in rows]


@widgets_router.get("/{id}", response_model=WidgetOut)
def get_widget(id: str):
    row = fetch_one("SELECT * FROM widgets WHERE id=%(id)s", {"id": id})
    if not row:
        raise HTTPException(status_code=404, detail="widget not found")
    return _serialize_widget(row)


@widgets_router.post("", response_model=WidgetOut)
def create_widget(payload: WidgetCreate):
    dashboard = fetch_one("SELECT id FROM dashboards WHERE id=%(id)s", {"id": str(payload.dashboard_id)})
    if not dashboard:
        raise HTTPException(status_code=400, detail="dashboard_id invalid")

    widget_id = str(uuid4())
    execute(
        """
        INSERT INTO widgets (id, dashboard_id, type, title, query, style, layout)
        VALUES (%(id)s, %(dashboard_id)s, %(type)s, %(title)s, %(query)s, %(style)s, %(layout)s)
        """,
        {
            "id": widget_id,
            "dashboard_id": str(payload.dashboard_id),
            "type": payload.type,
            "title": payload.title,
            "query": j(payload.query),
            "style": j(payload.style),
            "layout": j(payload.layout),
        },
    )
    row = fetch_one("SELECT * FROM widgets WHERE id=%(id)s", {"id": widget_id})
    if not row:
        raise HTTPException(status_code=500, detail="failed to create widget")
    return _serialize_widget(row)


@widgets_router.put("/{id}", response_model=WidgetOut)
def update_widget(id: str, payload: WidgetUpdate):
    current = fetch_one("SELECT * FROM widgets WHERE id=%(id)s", {"id": id})
    if not current:
        raise HTTPException(status_code=404, detail="widget not found")

    title = payload.title if payload.title is not None else current.get("title", "")
    query = payload.query if payload.query is not None else (current.get("query") or {})
    style = payload.style if payload.style is not None else (current.get("style") or {})
    layout = payload.layout if payload.layout is not None else (current.get("layout") or {})

    execute(
        """
        UPDATE widgets
        SET title=%(title)s,
            query=%(query)s,
            style=%(style)s,
            layout=%(layout)s
        WHERE id=%(id)s
        """,
        {
            "id": id,
            "title": title,
            "query": j(query),
            "style": j(style),
            "layout": j(layout),
        },
    )
    row = fetch_one("SELECT * FROM widgets WHERE id=%(id)s", {"id": id})
    if not row:
        raise HTTPException(status_code=500, detail="failed to update widget")
    return _serialize_widget(row)


@widgets_router.delete("/{id}")
def delete_widget(id: str):
    current = fetch_one("SELECT id FROM widgets WHERE id=%(id)s", {"id": id})
    if not current:
        raise HTTPException(status_code=404, detail="widget not found")
    execute("DELETE FROM widgets WHERE id=%(id)s", {"id": id})
    return {"ok": True}
