# Frontend Architecture

## Current shape

The frontend lives in `apps/web` and uses Next.js App Router with React, TypeScript, Tailwind CSS, and Playwright.

Nyx now uses a task-oriented dashboard rather than a generic dashboard. The primary navigation groups work into:

- Main: overview and CV repository.
- AI Tools: analysis, job matching, and cover letter generation.
- Workspace: history and settings.

## Structure

- `app/`: route files and route-level composition.
- `components/ui/`: shared primitives such as buttons, inputs, sidebar, header, surfaces, metrics, and status messages.
- `components/dashboard/`: dashboard workflow components, task panels, CV selectors, result renderers, formatting helpers, and dashboard API helpers.
- `lib/api/`: typed API client, shared API types, and envelope/error handling.
- `tests/e2e/`: Playwright smoke and workflow tests.

## Route responsibilities

Route pages should stay thin. They may coordinate route state, protected access, and page composition, but reusable workflow behavior should live in `components/dashboard`.

Dashboard pages use `ProtectedPage` for token validation and redirect behavior. Auth state is currently client-side and based on an access token in `localStorage`.

## API boundary

Use `lib/api` for generic request behavior:

- Base URL normalization from `NEXT_PUBLIC_API_URL`.
- JSON serialization.
- API envelope parsing.
- Error normalization through `ApiClientError`.

Use `components/dashboard/api.ts` for dashboard-specific fetch helpers and result type guards.

## UX direction

Nyx should feel like a focused CV workbench:

- Calm, readable, task-first screens.
- Clear next actions.
- Structured result panels for scores, strengths, weaknesses, missing skills, suggestions, and generated text.
- Dense but usable dashboard surfaces.
- Minimal explanatory copy inside the app; users should be able to act directly.

Avoid turning the dashboard into a marketing surface. The first protected screen should help the user decide what to do next.

## Testing boundary

Playwright tests currently mock API responses and cover:

- Home page render.
- Register/login flows and API errors.
- Protected dashboard redirect behavior.
- CV repository states and upload.
- CV detail.
- CV analysis.
- Job matching.
- Cover letter generation.
- History states.

Future full-stack E2E can be added separately and should run web, API, and PostgreSQL together.
