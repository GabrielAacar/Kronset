from typing import Any, Optional
from psycopg.types.json import Json
from app.db.conn import get_meta_conn

def j(v: Any) -> Any:
    """Wrap python dict/list as JSON for psycopg."""
    return Json(v)

def fetch_one(sql: str, params: Optional[dict[str, Any]] = None):
    with get_meta_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params or {})
            return cur.fetchone()

def fetch_all(sql: str, params: Optional[dict[str, Any]] = None):
    with get_meta_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params or {})
            return cur.fetchall()

def execute(sql: str, params: Optional[dict[str, Any]] = None):
    with get_meta_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params or {})
        conn.commit()
