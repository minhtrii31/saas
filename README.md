# Nyx

Nyx is an AI-assisted CV workspace for job seekers. It helps users upload CVs, extract CV text, analyze CV quality, compare a CV with a job description, generate tailored cover letters, and review saved analysis history.

## Current Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Playwright
- Backend: NestJS, TypeScript, Prisma, PostgreSQL, Jest, Supertest
- AI: provider abstraction with mock and OpenAI providers
- CI: GitHub Actions with PostgreSQL 17 and mock AI

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

- API: 22 Jest/Supertest spec files, 98 test cases.
- Web: 3 Playwright spec files, 30 test cases.
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
