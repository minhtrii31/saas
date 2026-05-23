# Current Project Status

Last verified: 2026-05-23

## Product summary

Nyx is an AI-assisted CV workspace for job seekers. The MVP helps users keep CVs organized, analyze CV quality, compare a CV with a target job description, generate a tailored cover letter, prepare for interviews, improve resume bullets, iteratively refine rewrite suggestions, and revisit saved analysis history.

## Current implementation

- Branding: the product is now presented as **Nyx**, with a calm, task-oriented CV workspace direction.
- Frontend: Next.js app under `apps/web` with productized home, auth screens, protected dashboard shell, task-oriented SaaS navigation, and focused workflow routes.
- Backend: NestJS API under `apps/api` with modular `auth`, `cvs`, `analysis`, `usage`, `config`, and `prisma` modules.
- Database: Prisma models and migrations exist for `User`, `Cv`, `CvAnalysis`, and `UsageRecord`; `CvAnalysis.type` supports `CV_ANALYSIS`, `JD_MATCH`, `COVER_LETTER`, `RESUME_REWRITE`, `REWRITE_REFINEMENT`, and `INTERVIEW_PREP`.
- AI: provider abstraction supports deterministic mock output and an OpenAI provider backed by reusable prompt builders, strict JSON schemas, and structured output validation for analysis, matching, cover letters, interview preparation, resume rewrite, and rewrite refinement.
- Usage: AI workflows check available credits before provider calls, deduct credits only after successful AI responses, and persist usage ledger records with the saved analysis where applicable.
- CI: GitHub Actions is configured on push and pull request. It runs API and web checks against PostgreSQL 17 with `AI_PROVIDER=mock`.

## Frontend capabilities

Implemented routes:

- `/`: Nyx product entry page.
- `/register`: account creation.
- `/login`: login and token storage.
- `/dashboard`: protected task overview with workspace metrics and recommended next action.
- `/dashboard/cvs`: CV repository with upload/list behavior.
- `/dashboard/cvs/[id]`: CV metadata and extracted text detail.
- `/dashboard/analyze`: select a CV and run AI CV analysis.
- `/dashboard/match`: compare a selected CV against pasted job description text.
- `/dashboard/cover-letter`: generate cover letter content from CV and job description text.
- `/dashboard/interview-prep`: generate interview questions and practice guidance from a selected CV and either a saved job target or pasted role context.
- `/dashboard/rewrite`: generate before/after resume bullet rewrite suggestions from a selected CV, then refine each suggestion interactively.
- `/dashboard/history`: aggregate saved analysis history across CVs.
- `/dashboard/settings`: placeholder/settings route.

Frontend API access is centralized under `apps/web/lib/api` and dashboard-specific helpers live under `apps/web/components/dashboard`. Protected routes currently rely on a JWT access token in `localStorage`.

Recent frontend AI result work:

- Analysis, match, cover letter, interview prep, rewrite, and history views render structured result panels rather than raw JSON.
- Result UI now emphasizes scores, strengths, weaknesses, missing skills, suggestions, provider/model metadata, generated cover letter text, interview questions, practice guidance, and rewrite rationale.
- Interview prep can reuse a saved job target from previous job-specific workflows instead of requiring the user to paste the same role context again.
- Rewrite result cards include per-suggestion refinement actions for `stronger`, `shorter`, `more-technical`, `more-leadership`, `more-ats-friendly`, and `more-results-focused`. Each card shows its own loading and error state while refinement is in progress.
- Dashboard pages are organized around user tasks: CV repository, analyze, match, cover letter, interview prep, rewrite, history, and settings.

## Backend capabilities

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
- `POST /cvs/:id/interview-prep`
- `POST /cvs/:id/cover-letter`
- `POST /cvs/:id/rewrite`
- `POST /cvs/:id/rewrite/refine`

The API uses centralized response wrapping and exception formatting. Controllers stay HTTP-focused; service classes handle business behavior and Prisma persistence.

## AI architecture status

- Prompt construction lives in `apps/api/src/modules/analysis/prompts/analysis-prompt.builder.ts`.
- Prompt builders produce workflow-specific system/user prompts plus JSON schema metadata for CV analysis, JD matching, cover letter generation, interview preparation, resume rewrite, and rewrite refinement.
- Structured output parsing and normalization lives in `apps/api/src/modules/analysis/utils/structured-output.validator.ts`.
- OpenAI responses are parsed, normalized, score-clamped, and rejected when required structured fields are missing or invalid.
- Provider errors surface as clean `AI_PROVIDER_ERROR` API responses instead of leaking provider internals.
- Mock provider behavior is more product-like and deterministic: it scores CV strength from text signals, extracts likely skills, produces concrete missing-skill guidance, generates interview practice from CV and role context, rewrites weak bullets with goal-specific rationale, refines existing rewrite suggestions by instruction, and returns separate mock model names for analysis, matching, cover letters, interview prep, and resume rewrite/refinement.
- Real OpenAI use remains opt-in with `AI_PROVIDER=openai`; automated tests and CI must continue using `AI_PROVIDER=mock`.

## Testing status

Current test counts:

- API: 169 Jest/Supertest test cases.
- Web: 51 Playwright test cases.

Verification commands:

- `npm run check:api`: Jest, ESLint, Nest build.
- `npm run check:web`: Playwright, ESLint, Next build.
- `npm run check`: runs both checks.

PostgreSQL integration tests use `DATABASE_URL_TEST`, run Prisma migrations in Jest global setup, and refuse to run unless the active database URL is explicitly a test database.

## Local development commands

- Install dependencies: `npm install`
- Start API: `npm run dev:api`
- Start web: `npm run dev:web`
- Start local Postgres: `docker compose up -d postgres`
- Check all: `npm run check`
- Check API only: `npm run check:api`
- Check web only: `npm run check:web`
- API tests only: `npm run test -w apps/api`
- Web E2E only: `npm run test:e2e -w apps/web`

## Environment notes

API variables:

```env
PORT=4000
DATABASE_URL="postgresql://cvai:cvai@localhost:5433/cv_ai_dev?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
WEB_ORIGIN=http://localhost:3000
AI_PROVIDER=mock
OPENAI_API_KEY=
OPENAI_MODEL=
CV_MAX_FILE_SIZE_BYTES=5242880
```

Web variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

CI uses `DATABASE_URL_TEST=postgresql://cvai:cvai@localhost:5432/cv_ai_test?schema=public`.

## Architecture boundaries

- Keep the backend as a modular monolith.
- Keep controllers thin and business logic in services.
- Keep persistence behind Prisma services and test persistence behavior with PostgreSQL integration tests.
- Keep AI calls behind `CvAnalysisProvider`; do not call OpenAI directly from controllers or CV services.
- Keep frontend route pages focused on page composition; shared UI belongs in `components/ui`, dashboard workflows in `components/dashboard`, and typed API calls in `lib/api`.
- Keep automated tests on the mock AI provider.

## UX direction

Nyx should feel like a focused CV workbench, not a generic SaaS landing page. Prioritize task clarity, dense but readable dashboard surfaces, direct next actions, and structured feedback over decorative UI. AI results should stay scannable and actionable: show what is strong, what is weak, what is missing for the target role, and what the user can do next.

## Known limitations

- No refresh-token flow or server-side session persistence; logout is client-side token removal.
- Local file storage is implemented; S3/Cloudinary storage is still future work.
- AI work is synchronous; Redis/BullMQ queues are not wired in.
- Job description upload is not implemented; matching and cover letters use pasted text.
- Interview prep works from an uploaded CV plus pasted role context or a saved job target, and stores results as `INTERVIEW_PREP` history records.
- Resume rewrite currently works from extracted CV text and stores results as `RESUME_REWRITE` history records. Interactive refinements of individual suggestions are stored as `REWRITE_REFINEMENT` records.
- Settings route is present but minimal.
- OpenAI integration uses `fetch` directly and is covered with unit tests, but live provider behavior needs manual validation with real credentials.
- Web E2E tests mock API responses; they do not currently exercise a full browser-to-Nest-to-Postgres flow.

## Recommended next priorities

1. Run `npm run check` after the latest docs/code sync and keep CI green on push/PR.
2. Add manual OpenAI validation notes for rewrite and rewrite refinement using synthetic or redacted CV data.
3. Add a small full-stack E2E path that runs web, API, and PostgreSQL together.
4. Expand history/detail UX for saved analyses, matches, cover letters, resume rewrites, and rewrite refinements.
5. Keep throttling tests stable by isolating tracker state when adding new rate-limited endpoints.
6. Align `.env.example` files with Docker Compose and CI database settings.
7. Add refresh/session strategy and explicit auth lifecycle decisions.
8. Add production file storage and background jobs after synchronous MVP behavior is stable.
