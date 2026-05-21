# Repository Guidelines

## Read First

Before starting any implementation task, read:

- docs/00-overview/vision.md
- docs/00-overview/scope.md
- docs/00-overview/principles.md
- docs/01-product/user-flows.md
- docs/02-architecture/overview.md
- docs/02-architecture/backend.md
- docs/03-engineering/workflow.md
- docs/03-engineering/testing.md

## Project Structure & Module Organization

This repository currently contains product, architecture, and engineering documentation under `docs/`.

- `docs/00-overview/`: vision, scope, and engineering/product principles.
- `docs/01-product/`: users, features, and user flows.
- `docs/02-architecture/`: modular monolith architecture and backend module rules.
- `docs/03-engineering/`: testing strategy and AI-assisted workflow.

Planned implementation should follow the documented stack: Next.js frontend, NestJS backend, PostgreSQL, Redis, BullMQ, and S3-compatible or Cloudinary file storage. Backend modules should use `src/modules/<module-name>/` with controller, service, DTOs, tests, and types where applicable.

## Build, Test, and Development Commands

No application package files are present yet, so there are no runnable build or test commands in this checkout. Once scaffolded, document exact commands here, for example:

- `npm run dev`: start local development services.
- `npm test`: run unit and integration tests.
- `npm run lint`: run linting and formatting checks.
- `npm run test:e2e`: run Playwright end-to-end tests.

Do not add undocumented commands without matching `package.json` scripts.

## Coding Style & Naming Conventions

Use TypeScript for frontend and backend code. Prefer small modules and clear domain names such as `auth`, `users`, `cvs`, `files`, `analysis`, `matching`, `cover-letter`, and `history`.

For NestJS, keep HTTP handling in controllers, business logic in services, validation in DTOs, and database access behind Prisma. Use kebab-case folders and suffixes such as `.module.ts`, `.controller.ts`, `.service.ts`, and `.dto.ts`.

Avoid unnecessary abstractions and new dependencies unless they solve a clear problem.

## Testing Guidelines

Backend work follows TDD: write a failing Jest or Supertest test, implement the smallest change, then refactor with tests green. Cover success and error cases for validation, auth, database behavior, and business rules.

Frontend testing should focus on Playwright smoke and E2E coverage. Protect login, registration, dashboard access, CV upload, CV analysis, and JD matching. Prefer stable selectors over CSS or layout assertions.

## Implementation Workflow

For every task:

1. Understand the requested scope.
2. Read related documentation before coding.
3. Inspect the current architecture and existing files.
4. Propose a short implementation plan.
5. Implement incrementally in small steps.
6. Run relevant tests and validations.
7. Summarize changed files and tradeoffs.

Avoid implementing multiple unrelated features in one task.

## Backend TDD Rules

Backend features must start with tests.

Preferred workflow:

1. Write failing test
2. Implement minimal code
3. Make tests pass
4. Refactor safely

Do not skip tests for business logic, validation, auth, or persistence behavior.

## AI Integration Rules

Do not tightly couple business logic to a single AI provider.

Use a provider abstraction layer so the system can later support:

- OpenAI
- Gemini
- OpenRouter
- other providers

## Commit & Pull Request Guidelines

This checkout has no Git history, so no repository-specific convention can be inferred. Use short, imperative commit messages, for example `Add testing strategy docs` or `Implement auth service tests`.

Pull requests should include a summary, linked issue or task when available, test results, and screenshots for visible UI changes. For larger changes, describe tradeoffs and limitations.

## Agent-Specific Instructions

Before implementation, read this file plus the relevant docs in `docs/`. Work in small vertical slices, avoid building multiple unfinished systems at once, and run tests, linting, and type checks after changes when commands exist.
