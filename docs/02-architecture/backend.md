# Backend Architecture

## Framework and runtime

The backend uses NestJS with TypeScript in `apps/api`.

NestJS is used because it provides:

- module-based structure
- dependency injection
- clear controller/service separation
- strong testing support
- scalable backend organization

## Architecture Style

The backend follows a modular monolith style. It is one deployable API split into domain modules.

Implemented modules:

- auth
- cvs
- analysis
- config
- prisma

The current `cvs` module owns CV repository behavior, file upload/extraction, analysis workflow orchestration, JD matching persistence, cover letter persistence, and per-CV analysis history. Do not split these into new modules until there is enough complexity to justify the boundary.

## Module structure

Each module should follow this structure when applicable:

```text
src/modules/<module-name>/
├── <module-name>.module.ts
├── <module-name>.controller.ts
├── <module-name>.service.ts
├── dto/
├── tests/
└── types/
```

## Rules

- Controllers handle HTTP requests only.
- Services contain business logic.
- DTOs validate input.
- Database access should go through Prisma.
- Heavy tasks should use BullMQ queues.
- Do not call AI providers directly from controllers.
- Do not call OpenAI directly from CV services; use the analysis provider abstraction.
- Do not put business logic in Prisma models.
- Write tests before implementing backend features.

## API Style

The API should return consistent responses.

Success:

```json
{
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  },
  "meta": {}
}
```

Implemented API surface:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /cvs`
- `POST /cvs`
- `POST /cvs/upload`
- `GET /cvs/:id`
- `DELETE /cvs/:id`
- `GET /cvs/:id/analyses`
- `POST /cvs/:id/analyze`
- `POST /cvs/:id/match`
- `POST /cvs/:id/cover-letter`

## Persistence

Prisma models currently cover:

- `User`
- `Cv`
- `CvAnalysis`

`CvAnalysis.type` stores `CV_ANALYSIS`, `JD_MATCH`, and `COVER_LETTER` records. Soft deletion is represented with `deletedAt`.

## AI boundary

The `analysis` module exposes provider-facing methods and selects the configured provider:

- `AI_PROVIDER=mock`: deterministic local/test provider.
- `AI_PROVIDER=openai`: OpenAI structured JSON provider.

Provider responses include provider and model metadata so persisted analysis records remain auditable.

## Testing

Backend development follows TDD:

1. Red — write failing test
2. Green — implement minimum code
3. Refactor — improve safely

Use:

- Jest for unit/integration tests
- Supertest for HTTP endpoint tests
- PostgreSQL-backed integration tests for persistence behavior

Integration tests require `DATABASE_URL_TEST`, apply Prisma migrations during Jest global setup, and refuse to run against non-test databases.
