from __future__ import annotations
from typing import Any
from app.schemas import QueryFilter

def _apply_overrides(obj_overrides: dict[str, Any], dialect: str, key: str, default: str) -> str:
    # overrides exemplo: {"oracle":{"expression":"TRUNC(dt)"}} ou {"oracle":{"base_sql":"..."}}
    if isinstance(obj_overrides, dict):
        d = obj_overrides.get(dialect)
        if isinstance(d, dict) and key in d and isinstance(d[key], str) and d[key].strip():
            return d[key]
    return default

def build_metric_sql(metric_type: str, config: dict[str, Any]) -> str:
    # config em MVP:
    # sum/avg: {"field":"qtd"}
    # count: {"field":"*"} (opcional)
    # count_distinct: {"field":"lpn"}
    # ratio: {"numerator":{"metric_type":"sum","config":{"field":"qtd"}},
    #         "denominator":{"metric_type":"sum","config":{"field":"horas"}}}
    if metric_type == "count":
        field = config.get("field", "*")
        return f"COUNT({field})"
    if metric_type == "count_distinct":
        field = config["field"]
        return f"COUNT(DISTINCT {field})"
    if metric_type == "sum":
        field = config["field"]
        return f"SUM({field})"
    if metric_type == "avg":
        field = config["field"]
        return f"AVG({field})"
    if metric_type == "ratio":
        num = config["numerator"]
        den = config["denominator"]
        num_sql = build_metric_sql(num["metric_type"], num["config"])
        den_sql = build_metric_sql(den["metric_type"], den["config"])
        return f"({num_sql}) / NULLIF(({den_sql}), 0)"
    if metric_type == "min":
        field = config["field"]
        return f"MIN({field})"
    if metric_type == "max":
        field = config["field"]
        return f"MAX({field})"

    raise ValueError(f"Unsupported metric_type: {metric_type}")

def build_where(filters: list[QueryFilter], dim_expr_map: dict[str, str]) -> tuple[str, dict[str, Any]]:
    clauses: list[str] = []
    params: dict[str, Any] = {}
    for i, f in enumerate(filters):
        pname = f"p{i}"
        expr = dim_expr_map.get(f.field, f.field)  # prefer dimensão por nome
        op = f.op

        if op == "eq":
            clauses.append(f"{expr} = %({pname})s")
            params[pname] = f.value
        elif op == "ne":
            clauses.append(f"{expr} <> %({pname})s")
            params[pname] = f.value
        elif op == "gt":
            clauses.append(f"{expr} > %({pname})s")
            params[pname] = f.value
        elif op == "gte":
            clauses.append(f"{expr} >= %({pname})s")
            params[pname] = f.value
        elif op == "lt":
            clauses.append(f"{expr} < %({pname})s")
            params[pname] = f.value
        elif op == "lte":
            clauses.append(f"{expr} <= %({pname})s")
            params[pname] = f.value
        elif op == "like":
            clauses.append(f"{expr} LIKE %({pname})s")
            params[pname] = f.value
        elif op == "in":
            # psycopg aceita tuple/list em ANY? Para MVP usamos IN com array literal via params tuple
            vals = f.value if isinstance(f.value, list) else [f.value]
            clauses.append(f"{expr} = ANY(%({pname})s)")
            params[pname] = vals
        elif op == "between":
            # value: [start, end]
            v = f.value
            if not (isinstance(v, list) and len(v) == 2):
                raise ValueError("between expects value as [start, end]")
            clauses.append(f"{expr} BETWEEN %({pname}a)s AND %({pname}b)s")
            params[f"{pname}a"] = v[0]
            params[f"{pname}b"] = v[1]
        else:
            raise ValueError(f"Unsupported filter op: {op}")

    if not clauses:
        return "", {}
    return "WHERE " + " AND ".join(clauses), params
