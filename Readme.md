# Kronset

![Python 3.11](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React 18](https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript 5](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)

Plataforma de **Business Intelligence (BI)** para modelagem semântica, construção de dashboards interativos e publicação de dashboards com URL pública.

---

## 📚 Sumário

- [🔎 1. Visão Geral](#-1-visão-geral)
- [🏗️ 2. Arquitetura de Software](#️-2-arquitetura-de-software)
- [🧰 3. Stack Tecnológica](#-3-stack-tecnológica)
- [📂 4. Estrutura de Pastas](#-4-estrutura-de-pastas)
- [🗄️ 5. Modelo de Banco de Dados](#️-5-modelo-de-banco-de-dados)
- [🌐 6. API REST](#-6-api-rest)
- [🚀 7. Como Rodar](#-7-como-rodar)
- [🧩 8. Módulos da Aplicação](#-8-módulos-da-aplicação)
- [🔌 9. Sistema de Conectores](#-9-sistema-de-conectores)
- [🛣️ 10. Roadmap](#️-10-roadmap)
- [📝 Observações Técnicas Importantes](#-observações-técnicas-importantes)

---

## 🔎 1. Visão Geral

O **Kronset** é uma plataforma de Business Intelligence que permite:

- Conectar múltiplos bancos de dados (PostgreSQL, MySQL, Oracle, SQL Server)
- Modelar datasets com SQL semântico
- Definir dimensões e métricas reutilizáveis
- Construir dashboards visuais com gráficos combinados (ECharts)
- Publicar dashboards com URL pública amigável e filtros interativos

O projeto está organizado como **monorepo**, com:

- `apps/api` → Back-end FastAPI
- `apps/web` → Front-end React + TypeScript + Vite
- `infra` → Docker Compose e infraestrutura local

---

## 🏗️ 2. Arquitetura de Software

### Padrão Arquitetural

O projeto segue uma **arquitetura em camadas (Layered Architecture)**, com separação de responsabilidades entre UI, serviços HTTP, API REST, validação e execução de queries.

```text
┌─────────────────────────────────────────────────┐
│                  FRONT-END                      │
│         React + TypeScript + Vite               │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │  Pages   │ │Components│ │    Services    │  │
│  │ (routes) │ │  (UI)    │ │ (Axios/HTTP)   │  │
│  └──────────┘ └──────────┘ └────────────────┘  │
└─────────────────────┬───────────────────────────┘
                      │ HTTP REST (porta 8000)
┌─────────────────────▼───────────────────────────┐
│                  BACK-END                       │
│              FastAPI + Uvicorn                  │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ Routers  │ │ Schemas  │ │  Query Builder │  │
│  │(endpoints│ │(Pydantic)│ │  (SQL dinâmico)│  │
│  └──────────┘ └──────────┘ └────────────────┘  │
│  ┌──────────────────────────────────────────┐   │
│  │            Connectors Layer              │   │
│  │  PostgresConnector | OracleStub | etc.   │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────┘
                      │ psycopg3
┌─────────────────────▼───────────────────────────┐
│              BANCO DE DADOS                     │
│             PostgreSQL 16                       │
│  connections │ datasets │ dimensions │ metrics  │
│         dashboards │ widgets                    │
└─────────────────────────────────────────────────┘
```

### Fluxo de dados

1. Usuário configura uma **Connection** (banco externo)
2. Cria um **Dataset** (query SQL base sobre a connection)
3. Define **Dimensions** (colunas para agrupamento/filtragem) e **Metrics** (agregações)
4. No **Dashboard Builder**, adiciona **Widgets** e configura visualizações (incluindo séries combinadas)
5. Cada widget executa `POST /query` → Query Builder monta SQL dinâmico → Connector executa no banco externo → retorna `rows`
6. Dashboard publicado fica acessível via rota pública `/view/:slug` (SPA) usando `GET /dashboards/slug/{slug}`

### Camada de Conectores

```text
app/connectors/
├── base.py         # Protocol/interface: run_query, quote_ident
├── postgres.py     # Implementação psycopg3 (funcional)
├── stubs.py        # Oracle, SQL Server, MySQL (stubs)
└── registry.py     # Factory: get_connector(db_type, secret_ref)
```

---

## 🧰 3. Stack Tecnológica

### Back-End

| Tecnologia | Versão | Uso |
|---|---|---|
| Python | 3.11 | Linguagem principal |
| FastAPI | 0.115.6 | Framework REST API |
| Uvicorn | 0.32.1 | Servidor ASGI |
| psycopg3 | 3.2.3 | Driver PostgreSQL |
| Pydantic v2 | via FastAPI | Validação de schemas |

### Front-End

| Tecnologia | Versão | Uso |
|---|---|---|
| React | 18.x | Framework UI |
| TypeScript | 5.x | Tipagem estática |
| Vite | 5.x | Build tool e dev server |
| React Router | 6.x | Roteamento SPA |
| Axios | 1.x | HTTP client |
| ECharts + `echarts-for-react` | 6.x / 3.x | Gráficos combinados |
| `react-grid-layout` | 2.x | Grid drag-and-drop |
| CodeMirror 6 | 6.x | Editor SQL com syntax highlight |
| CSS Modules | - | Estilização (sem framework CSS) |

### Infraestrutura

| Tecnologia | Uso |
|---|---|
| Docker + Docker Compose | Containerização completa |
| PostgreSQL 16 Alpine | Banco de metadados da plataforma |

---

## 📂 4. Estrutura de Pastas

Árvore técnica principal do monorepo (resumo estruturado):

```text
kronset/
├── apps/
│   ├── api/                    # Back-end FastAPI
│   │   ├── app/
│   │   │   ├── connectors/     # Drivers de banco externo
│   │   │   ├── db/             # Conexão e helpers do banco de metadados
│   │   │   ├── routers/        # Endpoints REST por entidade
│   │   │   ├── schemas.py      # Pydantic models
│   │   │   ├── query_builder.py
│   │   │   └── main.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── web/                    # Front-end React
│       ├── src/
│       │   ├── components/     # UI por módulo
│       │   ├── contexts/       # ToastContext
│       │   ├── hooks/          # useToast
│       │   ├── layouts/        # MainLayout
│       │   ├── pages/          # Uma página por rota
│       │   ├── routes/         # React Router config
│       │   ├── services/       # Axios — um arquivo por entidade
│       │   └── styles/
│       ├── index.html
│       ├── vite.config.ts
│       ├── package.json
│       └── Dockerfile
├── infra/
│   └── docker-compose.yml      # Compose principal (db/api/web)
├── docs/
├── .env.example
├── .gitignore
└── README.md (pode aparecer como Readme.md no Windows)
```

---

## 🗄️ 5. Modelo de Banco de Dados

### Diagrama de entidades (texto)

```text
connections
  └──< datasets
        ├──< dimensions
        ├──< metrics
        └──< dashboards
              └──< widgets
```

### Tabelas e campos principais

#### `connections`

- `id` (UUID, PK)
- `name` (TEXT, unique)
- `db_type` (TEXT) — `postgres | mysql | oracle | sqlserver`
- `config` (JSONB) — credenciais/config não sensível
- `secret_ref` (TEXT) — referência para segredo/DSN em env var
- `is_enabled` (BOOLEAN)
- `created_at` (TIMESTAMPTZ)

#### `datasets`

- `id` (UUID, PK)
- `connection_id` (UUID, FK → `connections`)
- `name` (TEXT, unique)
- `description` (TEXT)
- `base_sql` (TEXT)
- `overrides` (JSONB)
- `created_at`

#### `dimensions`

- `id` (UUID, PK)
- `dataset_id` (UUID, FK → `datasets`)
- `name` (TEXT, unique por dataset)
- `description` (TEXT)
- `expression` (TEXT)
- `overrides` (JSONB)
- `data_type` (TEXT)
- `created_at`

#### `metrics`

- `id` (UUID, PK)
- `dataset_id` (UUID, FK → `datasets`)
- `name` (TEXT, unique por dataset)
- `description` (TEXT)
- `metric_type` (TEXT) — `sum | count | count_distinct | avg | ratio`
- `config` (JSONB)
- `format` (TEXT)
- `created_at`

#### `dashboards`

- `id` (UUID, PK)
- `name` (TEXT, unique)
- `description` (TEXT)
- `dataset_id` (UUID, FK → `datasets`)
- `header` (JSONB)
- `layout` (JSONB) — template + regiões públicas (header/aside/footer)
- `is_published` (BOOLEAN)
- `slug` (TEXT, unique)
- `created_at`

#### `widgets`

- `id` (UUID, PK)
- `dashboard_id` (UUID, FK → `dashboards`, `ON DELETE CASCADE`)
- `type` (TEXT) — `kpi | line | bar | area | pie | table`
- `title` (TEXT)
- `query` (JSONB)
- `style` (JSONB)
- `layout` (JSONB)
- `created_at`

---

## 🌐 6. API REST

Base local (Docker): `http://localhost:8000`

### Tabela de endpoints (módulos)

#### Health

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Healthcheck da API |

#### Connections

| Método | Rota | Descrição |
|---|---|---|
| GET | `/connections` | Lista conexões |
| GET | `/connections/{id}` | Busca conexão |
| POST | `/connections` | Cria conexão |
| PUT | `/connections/{id}` | Atualiza conexão |
| DELETE | `/connections/{id}` | Remove conexão |
| POST | `/connections/{id}/test` | Testa conectividade |

#### Datasets

| Método | Rota | Descrição |
|---|---|---|
| GET | `/datasets` | Lista datasets |
| GET | `/datasets/{id}` | Busca dataset |
| POST | `/datasets` | Cria dataset |
| PUT | `/datasets/{id}` | Atualiza dataset |
| DELETE | `/datasets/{id}` | Remove dataset (se não houver dependências) |

#### Dimensions

| Método | Rota | Descrição |
|---|---|---|
| GET | `/dimensions` | Lista dimensões (opcional `?dataset_id=`) |
| GET | `/dimensions/{id}` | Busca dimensão |
| POST | `/dimensions` | Cria dimensão |
| PUT | `/dimensions/{id}` | Atualiza dimensão |
| DELETE | `/dimensions/{id}` | Remove dimensão |
| GET | `/datasets/{dataset_id}/dimensions` | Rota legada/compatível (listagem por dataset) |
| GET | `/dimensions/{id}/values` | Valores distintos para filtros públicos *(pendente no backend atual)* |

#### Metrics

| Método | Rota | Descrição |
|---|---|---|
| GET | `/metrics` | Lista métricas (opcional `?dataset_id=`) |
| GET | `/metrics/{id}` | Busca métrica |
| POST | `/metrics` | Cria métrica |
| PUT | `/metrics/{id}` | Atualiza métrica |
| DELETE | `/metrics/{id}` | Remove métrica |
| GET | `/datasets/{dataset_id}/metrics` | Rota legada/compatível (listagem por dataset) |

#### Dashboards

| Método | Rota | Descrição |
|---|---|---|
| GET | `/dashboards` | Lista dashboards |
| GET | `/dashboards/{id}` | Busca dashboard por ID |
| GET | `/dashboards/slug/{slug}` | Busca dashboard publicado por slug |
| POST | `/dashboards` | Cria dashboard (gera slug automaticamente) |
| PUT | `/dashboards/{id}` | Atualiza dashboard |
| DELETE | `/dashboards/{id}` | Remove dashboard |
| POST | `/dashboards/{id}/publish` | Publica dashboard |
| POST | `/dashboards/{id}/unpublish` | Despublica dashboard |

#### Widgets

| Método | Rota | Descrição |
|---|---|---|
| GET | `/widgets?dashboard_id={id}` | Lista widgets de um dashboard |
| GET | `/widgets/{id}` | Busca widget |
| POST | `/widgets` | Cria widget |
| PUT | `/widgets/{id}` | Atualiza widget |
| DELETE | `/widgets/{id}` | Remove widget |

#### Query

| Método | Rota | Descrição |
|---|---|---|
| POST | `/query` | Executa query semântica (suporta payload legado e novo com `series`) |
| POST | `/query_v2` | Query com métricas adhoc |

### Endpoints especiais

- `POST /connections/{id}/test`
- `GET /dashboards/slug/{slug}`
- `POST /dashboards/{id}/publish`
- `POST /dashboards/{id}/unpublish`
- `GET /dimensions/{id}/values` *(previsto / pendente no backend atual)*
- `POST /query`

---

## 🚀 7. Como Rodar

### Pré-requisitos

- Docker Desktop instalado
- Portas `5173`, `8000` e `5432` livres

### Passo a passo

```bash
# 1. Clone o repositório
git clone <repo-url>
cd kronset

# 2. Suba os serviços (compose fica em infra/)
cd infra
docker compose up --build

# 3. Acesse
# Front-end: http://localhost:5173
# API docs:  http://localhost:8000/docs
```

### Comandos úteis

```bash
# Rebuild apenas a API
cd infra
docker compose up api --build --no-deps

# Ver logs
docker compose logs api --tail=50
docker compose logs web --tail=50
docker compose logs db --tail=50

# Acessar o banco
docker compose exec db psql -U kronset -d kronset

# Executar migration manual (ajuste de schema)
docker compose exec db psql -U kronset -d kronset -c "ALTER TABLE ..."
```

---

## 🧩 8. Módulos da Aplicação

### Connections

Gerencia conexões com bancos externos. CRUD completo com teste de conectividade.

### Datasets

Define queries SQL base sobre uma conexão. O front usa CodeMirror para edição SQL.

### Dimensions

Expressões SQL reutilizáveis para agrupamento/filtragem, com suporte a `overrides` por dialeto.

### Metrics

Agregações reutilizáveis: `sum`, `count`, `count_distinct`, `avg`, `ratio`.

### Dashboard Builder

Editor visual com grid de 12 colunas (`react-grid-layout`) para criação de widgets.

- Drag-and-drop e resize
- Configuração de aparência por painel
- Gráficos combinados (séries independentes: barra/linha/área)

### Layout Config

Configuração da página pública com:

- Minimapa interativo (header / aside / content / footer)
- Templates `sidebar-left`, `full-width`, `minimal`
- Painel de propriedades por região
- Preview de header com logo inteligente

### Página Pública

Rota `/view/:slug` sem autenticação.

- Renderização baseada em `layout` salvo no dashboard
- Filtros públicos (select e daterange)
- Reexecução de queries ao alterar filtros

---

## 🔌 9. Sistema de Conectores

```python
# Para adicionar um novo conector:
# 1. Implemente o Protocol em app/connectors/{banco}.py
class MeuConector:
    db_type = "meubanco"
    def run_query(self, sql: str, params: dict) -> list[dict]: ...
    def quote_ident(self, name: str) -> str: ...

# 2. Registre em registry.py
CONNECTOR_REGISTRY = {
    "postgres": PostgresConnector,
    "meubanco": MeuConector,  # adicionar aqui
}
```

### Status atual

| Conector | Status |
|---|---|
| PostgreSQL | ✅ Implementado (psycopg3) |
| MySQL | ⚠️ Stub / teste não implementado |
| Oracle | ⚠️ Stub |
| SQL Server | ⚠️ Stub |

---

## 🛣️ 10. Roadmap

### Próximas features

- [ ] Autenticação JWT e controle de acesso por dashboard
- [ ] Implementação dos conectores MySQL, Oracle e SQL Server
- [ ] Cache de queries para dashboards públicos
- [ ] Agendamento de refresh automático
- [ ] Exportação CSV/Excel de widgets de tabela
- [ ] Tema dark mode

### Dívidas técnicas

- [ ] Migrations versionadas (Alembic)
- [ ] Testes automatizados (pytest + Vitest)
- [ ] Variável `VITE_API_URL` via `.env`
- [ ] Rate limiting na API pública
- [ ] Paginação nos endpoints de listagem

---

## 📝 Observações Técnicas Importantes

- O `docker-compose.yml` principal está em `infra/docker-compose.yml` (não na raiz).
- Há rotas legadas em `apps/api/app/main.py` para compatibilidade (`/datasets/{id}/dimensions` e `/datasets/{id}/metrics`).
- O front público já consome `GET /dimensions/{id}/values`, mas esse endpoint ainda não está implementado no backend atual.
- O `POST /query` já foi adaptado para aceitar a estrutura nova com `series` (gráficos combinados), mantendo fallback para `metrics/dimensions`.
