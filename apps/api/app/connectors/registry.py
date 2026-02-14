from app.connectors.postgres import PostgresConnector
from app.connectors.stubs import OracleConnector, SqlServerConnector

CONNECTOR_REGISTRY = {
    "postgres": PostgresConnector,
    "oracle": OracleConnector,
    "sqlserver": SqlServerConnector,
}

def get_connector(db_type: str, secret_ref: str):
    cls = CONNECTOR_REGISTRY.get(db_type)
    if not cls:
        raise RuntimeError(f"Unsupported db_type: {db_type}")
    return cls(secret_ref)
