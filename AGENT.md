# AGENT.md

Guidance for AI coding agents working in this repository.
Human-facing docs live in `README.md`; project status lives in `docs/PROGRESS.md`.

## Project

Geo Entity Manager: a web app to display and manage geo-located entities
(vehicles, IoT devices, facilities, ...) on a map. This is a take-home test.

Functional requirements:
- Show entities on a map.
- Add, update, and delete entities.
- View entity detail on the map.
- Validate input in BOTH backend and frontend.

## Commands (run these, don't guess)

The development machine is **Windows**; the shell is usually PowerShell 5.1.
Do NOT chain commands with `&&` and do not use bash-only syntax (`export`, `rm -rf`, `cp`).
Run each command from the directory shown.

```powershell
# Backend (run in backend/)
go run ./cmd/api          # dev server on :8080
gofmt -l .                # must print nothing
go vet ./...
go test ./...             # add -race only if CGO/gcc is available

# Frontend (run in frontend/)
npm run dev               # dev server on :5173
npx tsc --noEmit
npm run lint
npm test                  # single run (vitest run), never watch mode
npm run build

# Everything (run in repo root)
.\scripts\check.ps1                   # backend + frontend
.\scripts\check.ps1 -Only backend     # or: -Only frontend
```

## Tech stack

Backend: Go (latest stable), Gin, go-playground/validator/v10, gin-contrib/cors,
google/uuid, `database/sql` + `modernc.org/sqlite` (pure Go: no CGO, no gcc needed
on Windows), stdlib `testing` + `net/http/httptest`.

Frontend: Vite, React, TypeScript (`strict: true`), MapLibre GL JS (`maplibre-gl`),
TanStack Query, Zod, react-hook-form + @hookform/resolvers, Tailwind CSS,
Vitest + React Testing Library.

Map: MapLibre GL JS with OpenStreetMap raster tiles (no API key needed).

## Layout

```
backend/
  cmd/api/            # main.go: wiring only, no business logic
  internal/config/    # env parsing
  internal/domain/    # Entity struct, enums, domain errors
  internal/repository/# EntityRepository interface + SQLite impl
  internal/service/   # business logic, depends on repository interface
  internal/handler/   # Gin handlers, request/response DTOs, error envelope
  internal/validation/# validator setup + field-error mapping
  migrations/         # embedded .sql files applied on startup
frontend/
  src/api/            # fetch client + TanStack Query hooks
  src/components/     # map/, entity/, ui/
  src/schemas/        # Zod schemas (mirror backend validation)
  src/types/          # TS types inferred from Zod
scripts/              # check.ps1
docs/                 # PROGRESS.md, DECISIONS.md, AI_WORKFLOW.md, API.md
```

## Data contract (keep identical in Go struct, Zod schema, TS type, docs/API.md)

| Field       | Type    | Rules                                             |
|-------------|---------|---------------------------------------------------|
| id          | string  | UUID, server-generated                            |
| name        | string  | required, trimmed, 1-100 chars                    |
| type        | enum    | `vehicle` \| `iot_device` \| `facility` \| `other`|
| status      | enum    | `active` \| `inactive` \| `maintenance`           |
| description | string  | optional, max 500 chars                           |
| latitude    | number  | required, -90..90                                 |
| longitude   | number  | required, -180..180                               |
| created_at  | string  | RFC3339, server-generated                         |
| updated_at  | string  | RFC3339, server-generated                         |

API (base path `/api/v1`):

```
GET    /health
GET    /api/v1/entities
POST   /api/v1/entities
GET    /api/v1/entities/:id
PUT    /api/v1/entities/:id
DELETE /api/v1/entities/:id
```

Status codes: 200 / 201 / 204, 400 malformed JSON or bad id, 404 not found,
422 validation failed, 500 unexpected.

Response envelopes:

```json
{ "data": { "id": "..." } }
```

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [{ "field": "latitude", "message": "must be between -90 and 90" }]
  }
}
```

## Code examples (follow these conventions)

Go handlers never leak raw `err.Error()`; they map errors to the envelope:

```go
func (h *EntityHandler) Get(c *gin.Context) {
	e, err := h.svc.Get(c.Request.Context(), c.Param("id"))
	if err != nil {
		respondError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": e})
}
```

Zod schema is the single source of truth for frontend types:

```ts
export const entityInputSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: z.enum(["vehicle", "iot_device", "facility", "other"]),
  status: z.enum(["active", "inactive", "maintenance"]),
  description: z.string().max(500).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type EntityInput = z.infer<typeof entityInputSchema>;
```

Naming: Go = idiomatic (`EntityRepository`, `NewEntityService`); JSON = `snake_case`;
TS = `camelCase` for variables, `PascalCase` for components/types. Map the JSON
`snake_case` to TS `camelCase` in ONE place (the API client).

## Boundaries

### ✅ Always
- Read this file and `docs/PROGRESS.md` before starting a task; state a short plan first.
- Work in small vertical slices (one feature end to end).
- Run `.\scripts\check.ps1` after code changes; read failing output and fix until green.
- Keep the data contract identical across Go, Zod, TS, and `docs/API.md`.
- Add tests for validation rules and for each handler's happy path + error path.
- Update `docs/PROGRESS.md` when a feature changes state.
- Use `filepath.Join` in Go for paths; never hard-code `\` or `/` separators.
- Write commands that work in PowerShell 5.1 (and note macOS/Linux equivalents in README).

### ⚠️ Ask first
- Changing the DB schema after the first migration.
- Adding a new external dependency (Go module or npm package).
- Changing the API contract or the error envelope.
- Deleting or renaming existing files/directories.

### 🚫 Never
- Commit or print secrets; never commit `.env` (only `.env.example`).
- Delete, skip, or weaken a failing test to make the suite pass.
- Render map entities with HTML/DOM markers; use a GeoJSON source + layers.
- Edit `node_modules/`, `vendor/`, or generated files by hand.
- Run `git commit` / `git push` unless asked; suggest a Conventional Commit message instead.
- Implement features beyond the requirements without asking.

## Workflow rules

1. Plan -> implement -> `.\scripts\check.ps1` -> fix -> repeat until green.
2. If a requirement is ambiguous, ask instead of guessing.
3. After each slice, append a short entry to the log in `docs/AI_WORKFLOW.md`
   (what the agent did, what the human reviewed or changed).
4. Prefer boring, readable code over clever code; the author must be able to
   explain every file in it.

## Environment

Backend `.env` (see `backend/.env.example`): `PORT`, `DB_PATH`, `CORS_ALLOWED_ORIGINS`.
Frontend `.env` (see `frontend/.env.example`): `VITE_API_BASE_URL`
(default `http://localhost:8080/api/v1`).

Line endings are LF everywhere (enforced by `.gitattributes` / `.editorconfig`).
