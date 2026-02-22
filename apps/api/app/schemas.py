from pydantic import BaseModel, Field
from typing import Any, Literal, Optional, Union
from uuid import UUID


DbType = Literal["postgres", "oracle", "sqlserver", "mysql"]

class ConnectionCredentials(BaseModel):
    host: str
    port: int = 5432
    username: str
    password: str
    database: str

class ConnectionCreate(BaseModel):
    name: str
    db_type: DbType
    credentials: ConnectionCredentials
    is_enabled: bool = True

class ConnectionOut(BaseModel):
    id: str
    name: str
    db_type: DbType
    credentials: ConnectionCredentials
    is_enabled: bool
    created_at: str

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
    series: list[dict[str, Any]] = Field(default_factory=list)
    dimension: str | None = None
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


class DashboardHeader(BaseModel):
    title: str = ""
    logo_url: str = ""
    description: str = ""

class DashboardCreate(BaseModel):
    name: str
    description: str = ""
    dataset_id: UUID
    header: dict[str, Any] = Field(default_factory=dict)
    layout: dict[str, Any] = Field(default_factory=dict)
    slug: str = ""

class DashboardOut(BaseModel):
    id: str
    name: str
    description: str
    dataset_id: str
    header: dict[str, Any]
    layout: dict[str, Any]
    is_published: bool
    slug: str
    created_at: str

class DashboardUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    header: dict[str, Any] | None = None
    layout: dict[str, Any] | None = None
    is_published: bool | None = None

class WidgetCreate(BaseModel):
    dashboard_id: UUID
    type: str
    title: str = ""
    query: dict[str, Any] = Field(default_factory=dict)
    style: dict[str, Any] = Field(default_factory=dict)
    layout: dict[str, Any] = Field(default_factory=dict)

class WidgetOut(BaseModel):
    id: UUID
    dashboard_id: UUID
    type: str
    title: str
    query: dict[str, Any]
    style: dict[str, Any]
    layout: dict[str, Any]

class WidgetUpdate(BaseModel):
    title: str | None = None
    query: dict[str, Any] | None = None
    style: dict[str, Any] | None = None
    layout: dict[str, Any] | None = None
