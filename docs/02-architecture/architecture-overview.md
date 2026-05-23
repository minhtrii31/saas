# Architecture Overview

## Current shape

Nyx is a TypeScript monorepo with a Next.js frontend and a NestJS modular monolith backend.

The current implementation favors small vertical slices:

- Authenticated user account access.
- CV upload, storage metadata, text extraction, listing, detail, and soft deletion.
- Saved job targets and application tracking.
- CV analysis, job description matching, interview preparation, application follow-up, and cover letter generation.
- Saved analysis history through `CvAnalysis` records.

## Applications

Frontend:

- `apps/web`
- Next.js App Router
- React and TypeScript
- Tailwind CSS
- Playwright E2E/smoke tests

Backend:

- `apps/api`
- NestJS and TypeScript
- Prisma and PostgreSQL
- Jest and Supertest
- Central response/error envelopes

AI:

- `CvAnalysisProvider` abstraction
- Mock provider for local development and automated tests
- OpenAI provider for structured JSON CV analysis, JD matching, interview preparation, application follow-up, and cover letter generation

## Planned but not implemented

- Redis
- BullMQ queue workers
- S3-compatible or Cloudinary production file storage
- Multi-provider AI orchestration beyond the current mock/OpenAI selection

These remain architectural targets, but current runtime behavior is synchronous and uses local file storage.

## Backend module boundaries

Implemented modules:

- `auth`: registration, login, JWT guard, current-user endpoint.
- `cvs`: CV metadata, upload, extraction, soft delete, analysis workflows, matching, cover letter persistence.
- `job-targets`: saved role/company/job description context for reuse in job-specific workflows.
- `applications`: application CRUD, status tracking, optional saved target linkage, and follow-up draft generation.
- `analysis`: provider selection and provider-facing service methods.
- `usage`: credit balance checks, per-action credit consumption, and usage ledger records.
- `config`: environment validation and provider configuration.
- `prisma`: database client integration.

Keep future modules domain-oriented. Do not split `matching`, `cover-letter`, or `history` out of `cvs` until their behavior grows enough to justify the boundary.

## Frontend boundaries

- Route pages under `apps/web/app` compose screens and handle route-level concerns.
- Shared interface primitives live under `apps/web/components/ui`.
- Dashboard workflow components and formatting/API helpers live under `apps/web/components/dashboard`.
- Typed API access lives under `apps/web/lib/api`.

See `docs/02-architecture/frontend.md` and `docs/02-architecture/routes.md`.

## Data model

Current Prisma models:

- `User`
- `Cv`
- `CvAnalysis`
- `JobTarget`
- `Application`
- `UsageRecord`

`CvAnalysis.type` distinguishes `CV_ANALYSIS`, `JD_MATCH`, `COVER_LETTER`, `RESUME_REWRITE`, `REWRITE_REFINEMENT`, `INTERVIEW_PREP`, and `APPLICATION_FOLLOW_UP`, allowing one history table for the current AI outputs.
`Application` links a user to an owned CV, an optional `JobTarget`, company and role names, notes, optional applied date, and one of `SAVED`, `APPLIED`, `INTERVIEWING`, `OFFER`, or `REJECTED`.
`User.creditBalance` stores remaining credits. `UsageRecord` stores the user, action, credits used, timestamp, and optional linked `CvAnalysis` so successful AI actions can be audited.

## System principles

- Keep the modular monolith simple until the MVP proves value.
- Keep controllers focused on HTTP.
- Put business behavior in services.
- Put persistence behind Prisma.
- Keep AI provider calls behind the provider abstraction.
- Validate all external input.
- Use queues later for heavy file and AI work.
- Prefer integration tests when database behavior matters.

## Long-term direction

Nyx may later evolve toward:

- Background extraction and AI jobs.
- Production file storage.
- AI memory/profile learning.
- CV builder features.
- Advanced analytics.
- Recruiter or team workflows.
- Additional providers such as Gemini or OpenRouter.
