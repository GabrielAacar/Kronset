from typing import Any, Protocol

class Connector(Protocol):
    db_type: str

    def run_query(self, sql: str, params: dict[str, Any]) -> list[dict[str, Any]]:
        ...

    def quote_ident(self, name: str) -> str:
        ...
