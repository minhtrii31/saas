# Testing Strategy

## Goal

Testing is used to keep the project safe while developing with AI assistance.

Tests should verify important behavior, not implementation details.

---

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

### TDD Cycle

1. Red — write a failing test
2. Green — implement the minimum code
3. Refactor — improve code while keeping tests green

### Rules

- Write backend tests before implementation.
- Test success and error cases.
- Keep tests focused and readable.
- Do not mock everything if integration behavior matters.

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
