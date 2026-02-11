# Kronset

Kronset is an open-source semantic analytics platform: define metrics and dimensions once, explore datasets, and build interactive dashboards.

## Goals (MVP)
- Semantic layer (metrics/dimensions) as first-class objects
- Dataset querying API with safe metric expressions
- Web dashboard builder (grid layout + global filters)

## Monorepo
- `apps/api` — FastAPI backend
- `apps/web` — React + Vite frontend
- `infra` — Docker compose and infra helpers

## Quickstart (Docker)
```bash
cd infra
docker compose up --build
