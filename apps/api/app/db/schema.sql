CREATE TABLE IF NOT EXISTS connections (
  id           UUID PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  db_type      TEXT NOT NULL,          -- postgres | oracle | sqlserver | ...
  config       JSONB NOT NULL DEFAULT '{}'::jsonb,  -- não sensível
  secret_ref   TEXT NOT NULL,          -- env var name, ex: KRONSET_CONN_ORACLE_LOZ
  is_enabled   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS datasets (
  id            UUID PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES connections(id) ON DELETE RESTRICT,
  name          TEXT NOT NULL UNIQUE,
  description   TEXT DEFAULT '',
  base_sql      TEXT NOT NULL,
  overrides     JSONB NOT NULL DEFAULT '{}'::jsonb, -- {"oracle":{"base_sql":"..."}} opcional
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dimensions (
  id            UUID PRIMARY KEY,
  dataset_id    UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT DEFAULT '',
  expression    TEXT NOT NULL,
  overrides     JSONB NOT NULL DEFAULT '{}'::jsonb, -- {"oracle":{"expression":"TRUNC(dt)"}} opcional
  data_type     TEXT NOT NULL DEFAULT 'text',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(dataset_id, name)
);

CREATE TABLE IF NOT EXISTS metrics (
  id            UUID PRIMARY KEY,
  dataset_id    UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT DEFAULT '',
  metric_type   TEXT NOT NULL,       -- sum | count | count_distinct | avg | ratio
  config        JSONB NOT NULL,       -- {"field":"qtd"} ou {"numerator":{...},"denominator":{...}}
  format        TEXT DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(dataset_id, name)
);

CREATE TABLE IF NOT EXISTS dashboards (
  id           UUID PRIMARY KEY,
  name         TEXT NOT NULL UNIQUE,
  description  TEXT DEFAULT '',
  dataset_id   UUID NOT NULL REFERENCES datasets(id) ON DELETE RESTRICT,
  header       JSONB NOT NULL DEFAULT '{}'::jsonb,
  layout       JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  slug         TEXT UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS widgets (
  id           UUID PRIMARY KEY,
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  title        TEXT DEFAULT '',
  query        JSONB NOT NULL DEFAULT '{}'::jsonb,
  style        JSONB NOT NULL DEFAULT '{}'::jsonb,
  layout       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
