# Testing Strategy

## Goal

Testing is used to keep the project safe while developing with AI assistance.

Tests should verify important behavior, not implementation details.

## Current snapshot

Current source counts:

- API: 22 Jest/Supertest spec files, 98 `it(...)` test cases.
- Web: 3 Playwright spec files, 30 `test(...)` test cases.

Main verification commands:

- `npm run check:api`: API tests, lint, build.
- `npm run check:web`: Playwright tests, lint, build.
- `npm run check`: API and web checks.

## Backend Testing

Backend development follows TDD.

### Test Types

Unit tests:

- Services
- Business rules
- Validation logic

Integration tests:

- API endpoints
- Database behavior
- Auth flow

### Tools

- Jest
- Supertest
- Prisma test database
- PostgreSQL

### TDD Cycle

1. Red — write a failing test
2. Green — implement the minimum code
3. Refactor — improve code while keeping tests green

### Rules

- Write backend tests before implementation.
- Test success and error cases.
- Keep tests focused and readable.
- Do not mock everything if integration behavior matters.
- Use `AI_PROVIDER=mock` for automated tests.
- Never run persistence tests against a development or production database.

### PostgreSQL integration tests

PostgreSQL integration tests use `DATABASE_URL_TEST`.

The test setup:

- Applies Prisma migrations during Jest global setup when `DATABASE_URL_TEST` is present.
- Requires `DATABASE_URL` to equal `DATABASE_URL_TEST`.
- Refuses database names that do not look like test databases.
- Resets `cv_analyses`, `cvs`, and `users` between integration cases.

CI provides PostgreSQL 17 and sets:

```env
AI_PROVIDER=mock
DATABASE_URL_TEST=postgresql://cvai:cvai@localhost:5432/cv_ai_test?schema=public
```

---

## Frontend Testing

Frontend uses smoke and E2E tests.

### Smoke Tests

Smoke tests verify that critical flows do not break.

Examples:

- Home page renders
- Login page renders
- Register page renders
- Dashboard requires authentication
- Dashboard loads after login
- CV upload page renders
- JD matching page renders

### E2E Tests

E2E tests verify important user flows.

Examples:

- User can register/login
- User can upload CV
- User can start CV analysis
- User can compare CV with JD

### Tools

- Playwright

### Rules

- Do not test every visual detail.
- Test important user behavior.
- Prefer stable selectors.
- Avoid fragile tests based only on text position or CSS.
- Mock API responses for frontend-only workflow tests unless the test is explicitly full-stack.

## CI workflow

GitHub Actions runs on push and pull request.

The CI job:

- Starts PostgreSQL 17 as a service.
- Installs Node.js 20.19.x and npm dependencies.
- Generates the Prisma client.
- Installs Playwright Chromium.
- Runs `npm run check:api`.
- Runs `npm run check:web`.
- Removes generated upload, coverage, Next, and Playwright artifacts at the end.

CI must keep using the mock AI provider. Real provider calls belong in controlled manual validation, not automated tests.
