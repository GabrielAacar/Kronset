# Contributing to Kronset

## Branching
- `main`: stable
- `dev`: integration
- Create branches from `dev`:
  - `feature/<name>`
  - `fix/<name>`
  - `docs/<name>`

## Development
- `infra/docker-compose.yml` is the recommended dev environment.
- Run locally:
  - API: `uvicorn app.main:app --reload`
  - Web: `npm run dev`

## Pull Requests
- Open PRs targeting `dev`
- Include screenshots for UI changes
- Keep PRs small and focused

## Code style
- Python: keep it readable, type hints when possible
- TS/React: prefer small components and clear props
