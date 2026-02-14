from typing import Any

class OracleConnector:
    db_type = "oracle"
    def __init__(self, secret_ref: str):
        raise RuntimeError("Oracle connector not installed yet. Add as optional dependency and implement.")

class SqlServerConnector:
    db_type = "sqlserver"
    def __init__(self, secret_ref: str):
        raise RuntimeError("SQL Server connector not installed yet. Add as optional dependency and implement.")
