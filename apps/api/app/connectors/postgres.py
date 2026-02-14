import os
from typing import Any
import psycopg
from psycopg.rows import dict_row

class PostgresConnector:
    db_type = "postgres"

    def __init__(self, secret_ref: str):
        dsn = os.getenv(secret_ref, "")
        if not dsn:
            raise RuntimeError(f"Missing datasource DSN env var: {secret_ref}")
        self._dsn = dsn

    def quote_ident(self, name: str) -> str:
        # simples e seguro o suficiente para MVP (identifiers vindos do metadata)
        return '"' + name.replace('"', '""') + '"'

    def run_query(self, sql: str, params: dict[str, Any]) -> list[dict[str, Any]]:
        with psycopg.connect(self._dsn, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                return cur.fetchall()
