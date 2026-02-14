from pathlib import Path
from .conn import get_meta_conn

def init_db():
    schema_path = Path(__file__).parent / "schema.sql"
    sql = schema_path.read_text(encoding="utf-8")
    with get_meta_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
        conn.commit()
