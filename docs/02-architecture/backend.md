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
- job-targets
- applications
- analysis
- usage
- config
- prisma

The current `cvs` module owns CV repository behavior, file upload/extraction, analysis workflow orchestration, JD matching persistence, cover letter persistence, resume progress, and per-CV analysis history. `job-targets` owns saved role context. `applications` owns application tracking, status updates, and follow-up generation.

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
- `GET /cvs/:id/progress`
- `POST /cvs/:id/analyze`
- `POST /cvs/:id/match`
- `POST /cvs/:id/interview-prep`
- `POST /cvs/:id/cover-letter`
- `POST /cvs/:id/rewrite`
- `POST /cvs/:id/rewrite/refine`
- `GET /job-targets`
- `POST /job-targets`
- `GET /job-targets/:id`
- `PATCH /job-targets/:id`
- `DELETE /job-targets/:id`
- `GET /applications`
- `POST /applications`
- `PATCH /applications/:id`
- `DELETE /applications/:id`
- `POST /applications/:id/follow-up`

## Abuse protection

The API uses NestJS throttling for endpoints that can be abused through repeated requests.

Current per-tracker limits:

- `POST /auth/login`: 5 requests per minute
- `POST /auth/register`: 5 requests per minute
- `POST /cvs/upload`: 10 requests per minute
- `POST /cvs/:id/analyze`: 10 requests per minute
- `POST /cvs/:id/match`: 10 requests per minute
- `POST /cvs/:id/interview-prep`: 10 requests per minute
- `POST /cvs/:id/cover-letter`: 10 requests per minute
- `POST /applications/:id/follow-up`: 10 requests per minute

Authenticated requests are tracked by user id when available. Public auth requests fall back to the request IP. Throttled requests return the standard API error envelope with `TOO_MANY_REQUESTS`.

## Persistence

Prisma models currently cover:

- `User`
- `Cv`
- `CvAnalysis`
- `JobTarget`
- `Application`
- `UsageRecord`

`CvAnalysis.type` stores `CV_ANALYSIS`, `JD_MATCH`, `COVER_LETTER`, `RESUME_REWRITE`, `REWRITE_REFINEMENT`, `INTERVIEW_PREP`, and `APPLICATION_FOLLOW_UP` records. Soft deletion is represented with `deletedAt`.
`Application.status` supports `SAVED`, `APPLIED`, `INTERVIEWING`, `OFFER`, and `REJECTED`. Each application belongs to a user, references an owned CV, can optionally reference a saved job target, and stores company, role, notes, and optional applied date.
`User.creditBalance` stores the current credit balance. `UsageRecord` stores AI action usage with `userId`, action type, credits used, creation timestamp, and an optional `CvAnalysis` link.

## Usage limits

The `usage` module prepares Nyx for SaaS quotas without billing integration.

- New users receive starter credits from `FREE_STARTER_CREDITS`.
- AI actions are charged with `USAGE_COST_CV_ANALYSIS`, `USAGE_COST_JD_MATCH`, `USAGE_COST_COVER_LETTER`, `USAGE_COST_RESUME_REWRITE`, `USAGE_COST_REWRITE_REFINEMENT`, `USAGE_COST_INTERVIEW_PREP`, and `USAGE_COST_APPLICATION_FOLLOW_UP`.
- AI workflows check credits before provider calls.
- Credits are deducted only after a successful provider response, inside the same transaction that creates `CvAnalysis` history and the corresponding `UsageRecord`.
- Insufficient credits return the standard API error envelope with `INSUFFICIENT_CREDITS`.

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
