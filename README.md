# Nyx

Nyx is an AI-assisted CV workspace for job seekers. It helps users analyze CV quality, match a CV against a job description, generate tailored cover letters, prepare for interviews, improve and refine resume bullets, and review saved analysis history.

## Current Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Playwright
- Backend: NestJS, TypeScript, Prisma, PostgreSQL, Jest, Supertest
- AI: provider abstraction with deterministic mock and OpenAI providers, reusable prompt builders, JSON schemas, and structured output validation for analysis, matching, cover letters, interview prep, resume rewrite, and rewrite refinement
- Usage: credit checks and usage ledger records for successful AI workflows
- CI: GitHub Actions on push/PR with PostgreSQL 17 and mock AI

Redis, BullMQ, and S3/Cloudinary-compatible storage remain planned architecture items; they are not wired into the current runtime.

## Workspace Layout

- `apps/web`: Next.js frontend.
- `apps/api`: NestJS API and Prisma schema/migrations.
- `docs`: product, architecture, engineering, AI, and handoff documentation.
- `.github/workflows/ci.yml`: monorepo CI workflow.

## Main Routes

- `/`: product entry page.
- `/register`, `/login`: authentication.
- `/dashboard`: protected task overview.
- `/dashboard/cvs`: CV repository.
- `/dashboard/cvs/[id]`: CV detail.
- `/dashboard/analyze`: CV analysis.
- `/dashboard/match`: job description matching.
- `/dashboard/cover-letter`: cover letter generation.
- `/dashboard/interview-prep`: interview questions and practice guidance using a CV plus pasted role context or a saved job target.
- `/dashboard/rewrite`: resume bullet rewrite suggestions with interactive refinement.
- `/dashboard/history`: saved analysis history.
- `/dashboard/settings`: settings placeholder.

## Commands

```bash
npm install
npm run dev:api
npm run dev:web
npm run check
npm run check:api
npm run check:web
```

For local PostgreSQL:

```bash
docker compose up -d postgres
```

## Testing Snapshot

- API: 169 Jest/Supertest test cases.
- Web: 51 Playwright test cases.
- CI runs API tests/lint/build and web Playwright/lint/build with `AI_PROVIDER=mock`.
- PostgreSQL integration tests require `DATABASE_URL_TEST` and refuse to run against a non-test database.

## Documentation

Start with:

- [Current status](docs/10-handoff/current-status.md)
- [Architecture overview](docs/02-architecture/architecture-overview.md)
- [Frontend architecture](docs/02-architecture/frontend.md)
- [Backend architecture](docs/02-architecture/backend.md)
- [Route structure](docs/02-architecture/routes.md)
- [Testing strategy](docs/03-engineering/testing.md)
- [AI provider configuration](docs/04-ai/provider-configuration.md)
