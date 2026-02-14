from fastapi import FastAPI, HTTPException
from uuid import uuid4
from app.db.init_db import init_db
from app import meta_repo
from app.schemas import (
    ConnectionCreate, ConnectionOut,
    DatasetCreate, DatasetOut,
    DimensionCreate, DimensionOut,
    MetricCreate, MetricOut,
    QueryRequest, QueryResponse,QueryRequestV2, AdhocMetricDef
)
from app.connectors.registry import get_connector
from app.query_builder import build_metric_sql, build_where, _apply_overrides
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="Kronset API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup():
    init_db()

@app.get("/health")
def health():
    return {"ok": True, "service": "kronset-api", "version": "0.1.0"}


# ---------- Connections ----------
@app.post("/connections", response_model=ConnectionOut)
def create_connection(payload: ConnectionCreate):
    _id = uuid4()
    meta_repo.execute(
        """
        INSERT INTO connections (id, name, db_type, config, secret_ref, is_enabled)
        VALUES (%(id)s, %(name)s, %(db_type)s, %(config)s, %(secret_ref)s, %(is_enabled)s)
        """,
        {
        "id": str(_id),
        "name": payload.name,
        "db_type": payload.db_type,
        "config": meta_repo.j(payload.config),
        "secret_ref": payload.secret_ref,
        "is_enabled": payload.is_enabled
        }
    )
    row = meta_repo.fetch_one("SELECT * FROM connections WHERE id=%(id)s", {"id": str(_id)})
    return row

@app.get("/connections", response_model=list[ConnectionOut])
def list_connections():
    return meta_repo.fetch_all("SELECT * FROM connections ORDER BY created_at DESC")

@app.get("/connections/{connection_id}", response_model=ConnectionOut)
def get_connection(connection_id: str):
    row = meta_repo.fetch_one("SELECT * FROM connections WHERE id=%(id)s", {"id": connection_id})
    if not row:
        raise HTTPException(404, "connection not found")
    return row


# ---------- Datasets ----------
@app.post("/datasets", response_model=DatasetOut)
def create_dataset(payload: DatasetCreate):
    # validate connection exists
    c = meta_repo.fetch_one("SELECT * FROM connections WHERE id=%(id)s", {"id": str(payload.connection_id)})
    if not c:
        raise HTTPException(400, "connection_id invalid")

    _id = uuid4()
    meta_repo.execute(
        """
        INSERT INTO datasets (id, connection_id, name, description, base_sql, overrides)
        VALUES (%(id)s, %(connection_id)s, %(name)s, %(description)s, %(base_sql)s, %(overrides)s)
        """,
        {
        "id": str(_id),
        "connection_id": str(payload.connection_id),
        "name": payload.name,
        "description": payload.description,
        "base_sql": payload.base_sql,
        "overrides": meta_repo.j(payload.overrides),
        }
    )
    return meta_repo.fetch_one("SELECT * FROM datasets WHERE id=%(id)s", {"id": str(_id)})

@app.get("/datasets", response_model=list[DatasetOut])
def list_datasets():
    return meta_repo.fetch_all("SELECT * FROM datasets ORDER BY created_at DESC")

@app.get("/datasets/{dataset_id}", response_model=DatasetOut)
def get_dataset(dataset_id: str):
    row = meta_repo.fetch_one("SELECT * FROM datasets WHERE id=%(id)s", {"id": dataset_id})
    if not row:
        raise HTTPException(404, "dataset not found")
    return row


# ---------- Dimensions ----------
@app.post("/dimensions", response_model=DimensionOut)
def create_dimension(payload: DimensionCreate):
    ds = meta_repo.fetch_one("SELECT * FROM datasets WHERE id=%(id)s", {"id": str(payload.dataset_id)})
    if not ds:
        raise HTTPException(400, "dataset_id invalid")

    _id = uuid4()
    meta_repo.execute(
        """
        INSERT INTO dimensions (id, dataset_id, name, description, expression, overrides, data_type)
        VALUES (%(id)s, %(dataset_id)s, %(name)s, %(description)s, %(expression)s, %(overrides)s, %(data_type)s)
        """,
        {
        "id": str(_id),
        "dataset_id": str(payload.dataset_id),
        "name": payload.name,
        "description": payload.description,
        "expression": payload.expression,
        "overrides": meta_repo.j(payload.overrides),
        "data_type": payload.data_type,
        }
    )
    return meta_repo.fetch_one("SELECT * FROM dimensions WHERE id=%(id)s", {"id": str(_id)})

@app.get("/datasets/{dataset_id}/dimensions", response_model=list[DimensionOut])
def list_dimensions(dataset_id: str):
    return meta_repo.fetch_all(
        "SELECT * FROM dimensions WHERE dataset_id=%(id)s ORDER BY created_at DESC",
        {"id": dataset_id}
    )


# ---------- Metrics ----------
@app.post("/metrics", response_model=MetricOut)
def create_metric(payload: MetricCreate):
    ds = meta_repo.fetch_one("SELECT * FROM datasets WHERE id=%(id)s", {"id": str(payload.dataset_id)})
    if not ds:
        raise HTTPException(400, "dataset_id invalid")

    _id = uuid4()
    meta_repo.execute(
        """
        INSERT INTO metrics (id, dataset_id, name, description, metric_type, config, format)
        VALUES (%(id)s, %(dataset_id)s, %(name)s, %(description)s, %(metric_type)s, %(config)s, %(format)s)
        """,
        {
        "id": str(_id),
        "dataset_id": str(payload.dataset_id),
        "name": payload.name,
        "description": payload.description,
        "metric_type": payload.metric_type,
        "config": meta_repo.j(payload.config),
        "format": payload.format,
        }
    )

    return meta_repo.fetch_one("SELECT * FROM metrics WHERE id=%(id)s", {"id": str(_id)})

@app.get("/datasets/{dataset_id}/metrics", response_model=list[MetricOut])
def list_metrics(dataset_id: str):
    return meta_repo.fetch_all(
        "SELECT * FROM metrics WHERE dataset_id=%(id)s ORDER BY created_at DESC",
        {"id": dataset_id}
    )


# ---------- Query ----------
@app.post("/query", response_model=QueryResponse)
def run_query(payload: QueryRequest):
    ds = meta_repo.fetch_one("SELECT * FROM datasets WHERE id=%(id)s", {"id": str(payload.dataset_id)})
    if not ds:
        raise HTTPException(404, "dataset not found")

    conn = meta_repo.fetch_one("SELECT * FROM connections WHERE id=%(id)s", {"id": str(ds["connection_id"])})
    if not conn:
        raise HTTPException(500, "dataset connection missing")
    if not conn["is_enabled"]:
        raise HTTPException(403, "connection disabled")

    dialect = conn["db_type"]
    base_sql = _apply_overrides(ds.get("overrides") or {}, dialect, "base_sql", ds["base_sql"])

    # load dims/metrics for dataset
    dims = meta_repo.fetch_all("SELECT * FROM dimensions WHERE dataset_id=%(id)s", {"id": str(ds["id"])})
    mets = meta_repo.fetch_all("SELECT * FROM metrics WHERE dataset_id=%(id)s", {"id": str(ds["id"])})

    dim_by_name = {d["name"]: d for d in dims}
    met_by_name = {m["name"]: m for m in mets}

    # resolve dimension expressions
    dim_expr_map: dict[str, str] = {}
    select_dims: list[str] = []
    group_by: list[str] = []
    for dname in payload.dimensions:
        d = dim_by_name.get(dname)
        if not d:
            raise HTTPException(400, f"dimension not found: {dname}")
        expr = _apply_overrides(d.get("overrides") or {}, dialect, "expression", d["expression"])
        dim_expr_map[dname] = expr
        alias = dname
        select_dims.append(f"{expr} AS \"{alias}\"")
        group_by.append(expr)

    # resolve metric SQL
    select_mets: list[str] = []
    for mname in payload.metrics:
        m = met_by_name.get(mname)
        if not m:
            raise HTTPException(400, f"metric not found: {mname}")
        mexpr = build_metric_sql(m["metric_type"], m["config"])
        select_mets.append(f"{mexpr} AS \"{mname}\"")

    if not select_dims and not select_mets:
        raise HTTPException(400, "provide at least one metric or dimension")

    where_sql, params = build_where(payload.filters, dim_expr_map)

    select_list = ", ".join(select_dims + select_mets) if (select_dims or select_mets) else "*"
    sql = f"""
    WITH base AS (
      {base_sql}
    )
    SELECT {select_list}
    FROM base
    {where_sql}
    """

    if group_by and select_mets:
        sql += " GROUP BY " + ", ".join(group_by)

    # limit by dialect (MVP: postgres only; others will error at connector init)
    lim = max(1, min(payload.limit, 5000))
    if dialect == "postgres":
        sql += f" LIMIT {lim}"

    connector = get_connector(dialect, conn["secret_ref"])
    rows = connector.run_query(sql, params)

    return {"sql": sql.strip(), "rows": rows}

@app.post("/query_v2", response_model=QueryResponse)
def run_query_v2(payload: QueryRequestV2):
    ds = meta_repo.fetch_one("SELECT * FROM datasets WHERE id=%(id)s", {"id": str(payload.dataset_id)})
    if not ds:
        raise HTTPException(404, "dataset not found")

    conn = meta_repo.fetch_one("SELECT * FROM connections WHERE id=%(id)s", {"id": str(ds["connection_id"])})
    if not conn:
        raise HTTPException(500, "dataset connection missing")
    if not conn["is_enabled"]:
        raise HTTPException(403, "connection disabled")

    dialect = conn["db_type"]
    base_sql = _apply_overrides(ds.get("overrides") or {}, dialect, "base_sql", ds["base_sql"])

    dims = meta_repo.fetch_all("SELECT * FROM dimensions WHERE dataset_id=%(id)s", {"id": str(ds["id"])})
    mets = meta_repo.fetch_all("SELECT * FROM metrics WHERE dataset_id=%(id)s", {"id": str(ds["id"])})

    dim_by_name = {d["name"]: d for d in dims}
    met_by_name = {m["name"]: m for m in mets}

    dim_expr_map: dict[str, str] = {}
    select_dims: list[str] = []
    group_by: list[str] = []

    for dname in payload.dimensions:
        d = dim_by_name.get(dname)
        if not d:
            raise HTTPException(400, f"dimension not found: {dname}")
        expr = _apply_overrides(d.get("overrides") or {}, dialect, "expression", d["expression"])
        dim_expr_map[dname] = expr
        select_dims.append(f"{expr} AS \"{dname}\"")
        group_by.append(expr)

    select_mets: list[str] = []

    for mref in payload.metrics:
        if isinstance(mref, str):
            m = met_by_name.get(mref)
            if not m:
                raise HTTPException(400, f"metric not found: {mref}")
            mexpr = build_metric_sql(m["metric_type"], m["config"])
            select_mets.append(f"{mexpr} AS \"{mref}\"")
        else:
            # adhoc metric
            mexpr = build_metric_sql(mref.metric_type, mref.config)
            select_mets.append(f"{mexpr} AS \"{mref.alias}\"")

    if not select_dims and not select_mets:
        raise HTTPException(400, "provide at least one metric or dimension")

    where_sql, params = build_where(payload.filters, dim_expr_map)

    select_list = ", ".join(select_dims + select_mets)
    sql = f"""
    WITH base AS (
      {base_sql}
    )
    SELECT {select_list}
    FROM base
    {where_sql}
    """

    if group_by and select_mets:
        sql += " GROUP BY " + ", ".join(group_by)

    lim = max(1, min(payload.limit, 5000))
    if dialect == "postgres":
        sql += f" LIMIT {lim}"

    connector = get_connector(dialect, conn["secret_ref"])
    rows = connector.run_query(sql, params)
    return {"sql": sql.strip(), "rows": rows}
