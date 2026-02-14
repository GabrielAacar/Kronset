from pydantic import BaseModel, Field
from typing import Any, Literal, Optional, Union
from uuid import UUID


DbType = Literal["postgres", "oracle", "sqlserver"]

class ConnectionCreate(BaseModel):
    name: str
    db_type: DbType
    config: dict[str, Any] = Field(default_factory=dict)
    secret_ref: str
    is_enabled: bool = True

class ConnectionOut(ConnectionCreate):
    id: UUID

class DatasetCreate(BaseModel):
    connection_id: UUID
    name: str
    description: str = ""
    base_sql: str
    overrides: dict[str, Any] = Field(default_factory=dict)

class DatasetOut(DatasetCreate):
    id: UUID

class DimensionCreate(BaseModel):
    dataset_id: UUID
    name: str
    description: str = ""
    expression: str
    overrides: dict[str, Any] = Field(default_factory=dict)
    data_type: str = "text"

class DimensionOut(DimensionCreate):
    id: UUID

MetricType = Literal["sum", "count", "count_distinct", "avg", "ratio"]

class MetricCreate(BaseModel):
    dataset_id: UUID
    name: str
    description: str = ""
    metric_type: MetricType
    config: dict[str, Any]
    format: str = ""

class MetricOut(MetricCreate):
    id: UUID


# ---- Query API ----
FilterOp = Literal["eq", "ne", "gt", "gte", "lt", "lte", "in", "between", "like"]

class QueryFilter(BaseModel):
    field: str                  # dimension name (recomendado) ou expressão simples
    op: FilterOp
    value: Any

class QueryRequest(BaseModel):
    dataset_id: UUID
    metrics: list[str] = Field(default_factory=list)      # nomes de métricas
    dimensions: list[str] = Field(default_factory=list)   # nomes de dimensões
    filters: list[QueryFilter] = Field(default_factory=list)
    limit: int = 500

class QueryResponse(BaseModel):
    sql: str
    rows: list[dict[str, Any]]

class AdhocMetricDef(BaseModel):
    alias: str
    metric_type: MetricType
    config: dict[str, Any]

MetricRef = Union[str, AdhocMetricDef]

class QueryRequestV2(BaseModel):
    dataset_id: UUID
    metrics: list[MetricRef] = Field(default_factory=list)
    dimensions: list[str] = Field(default_factory=list)
    filters: list[QueryFilter] = Field(default_factory=list)
    limit: int = 500
