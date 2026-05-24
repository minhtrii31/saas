# Current Project Status

Last verified: 2026-05-24

## Product summary

Nyx is an AI-assisted CV workspace for job seekers. The MVP helps users keep CVs organized, save job targets, track applications, analyze CV quality, compare a CV with a target job description, generate a tailored cover letter, prepare for interviews, improve resume bullets, iteratively refine rewrite suggestions, generate application follow-up drafts, and revisit saved analysis history.

## Current implementation

- Branding: the product is now presented as **Nyx**, with a calm, task-oriented CV workspace direction.
- Frontend: Next.js app under `apps/web` with productized home, auth screens, protected dashboard shell, task-oriented SaaS navigation, and focused workflow routes.
- Backend: NestJS API under `apps/api` with modular `auth`, `cvs`, `job-targets`, `applications`, `analysis`, `usage`, `config`, and `prisma` modules.
- File storage: CV uploads support local filesystem storage for development/tests and Cloudinary signed server-side uploads for production.
- Database: Prisma models and migrations exist for `User`, `Cv`, `CvAnalysis`, `JobTarget`, `Application`, and `UsageRecord`; `CvAnalysis.type` supports `CV_ANALYSIS`, `JD_MATCH`, `COVER_LETTER`, `RESUME_REWRITE`, `REWRITE_REFINEMENT`, `INTERVIEW_PREP`, and `APPLICATION_FOLLOW_UP`.
- AI: provider abstraction supports deterministic mock output and an OpenAI provider backed by reusable prompt builders, strict JSON schemas, and structured result handling for analysis, matching, cover letters, interview preparation, resume rewrite, rewrite refinement, and application follow-up drafts.
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
- `/dashboard/job-targets`: save reusable target roles and job description context.
- `/dashboard/applications`: track applications by status, notes, CV, optional job target, and generate follow-up drafts.
- `/dashboard/progress`: view resume quality trends, ATS trend, rewrite activity, and improvement deltas.
- `/dashboard/analyze`: select a CV and run AI CV analysis.
- `/dashboard/match`: compare a selected CV against pasted job description text.
- `/dashboard/cover-letter`: generate cover letter content from CV and job description text.
- `/dashboard/interview-prep`: generate interview questions and practice guidance from a selected CV and either a saved job target or pasted role context.
- `/dashboard/rewrite`: generate before/after resume bullet rewrite suggestions from a selected CV, then refine each suggestion interactively.
- `/dashboard/history`: aggregate saved analysis history across CVs.
- `/dashboard/settings`: placeholder/settings route.

Frontend API access is centralized under `apps/web/lib/api` and dashboard-specific helpers live under `apps/web/components/dashboard`. Protected routes currently rely on a JWT access token in `localStorage`.

Recent frontend AI result work:

- Analysis, match, cover letter, interview prep, rewrite, application follow-up, progress, and history views render structured result panels rather than raw JSON.
- Result UI now emphasizes scores, strengths, weaknesses, missing skills, suggestions, provider/model metadata, generated cover letter text, interview questions, practice guidance, rewrite rationale, follow-up drafts, and trend summaries.
- Interview prep can reuse a saved job target from previous job-specific workflows instead of requiring the user to paste the same role context again.
- Rewrite result cards include per-suggestion refinement actions for `stronger`, `shorter`, `more-technical`, `more-leadership`, `more-ats-friendly`, and `more-results-focused`. Each card shows its own loading and error state while refinement is in progress.
- Dashboard pages are organized around user tasks: CV repository, job targets, applications, progress, analyze, match, cover letter, interview prep, rewrite, history, and settings.

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

The API uses centralized response wrapping and exception formatting. Controllers stay HTTP-focused; service classes handle business behavior and Prisma persistence.

## AI architecture status

- Prompt construction for most CV workflows lives in `apps/api/src/modules/analysis/prompts/analysis-prompt.builder.ts`; application follow-up prompting currently lives in the OpenAI provider method.
- Prompt builders produce workflow-specific system/user prompts plus JSON schema metadata for CV analysis, JD matching, cover letter generation, interview preparation, resume rewrite, and rewrite refinement.
- Structured output parsing and normalization lives in `apps/api/src/modules/analysis/utils/structured-output.validator.ts`.
- OpenAI responses are parsed, normalized, score-clamped, and rejected when required structured fields are missing or invalid.
- Provider errors surface as clean `AI_PROVIDER_ERROR` API responses instead of leaking provider internals.
- Mock provider behavior is more product-like and deterministic: it scores CV strength from text signals, extracts likely skills, produces concrete missing-skill guidance, generates interview practice from CV and role context, rewrites weak bullets with goal-specific rationale, refines existing rewrite suggestions by instruction, drafts application follow-ups from application status/context, and returns separate mock model names for analysis, matching, cover letters, interview prep, resume rewrite/refinement, and application follow-up.
- Real OpenAI use remains opt-in with `AI_PROVIDER=openai`; automated tests and CI must continue using `AI_PROVIDER=mock`.

## Testing status

Current test counts:

- API: 198 Jest/Supertest test cases.
- Web: 52 Playwright test cases.

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
STORAGE_PROVIDER=local
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_CV_FOLDER=nyx/cvs
FREE_STARTER_CREDITS=10
USAGE_COST_CV_ANALYSIS=1
USAGE_COST_JD_MATCH=1
USAGE_COST_COVER_LETTER=1
USAGE_COST_RESUME_REWRITE=1
USAGE_COST_REWRITE_REFINEMENT=1
USAGE_COST_INTERVIEW_PREP=1
USAGE_COST_APPLICATION_FOLLOW_UP=1
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
- Keep automated tests on local CV storage unless a focused test explicitly mocks Cloudinary.

## UX direction

Nyx should feel like a focused CV workbench, not a generic SaaS landing page. Prioritize task clarity, dense but readable dashboard surfaces, direct next actions, and structured feedback over decorative UI. AI results should stay scannable and actionable: show what is strong, what is weak, what is missing for the target role, and what the user can do next.

## Known limitations

- No refresh-token flow or server-side session persistence; logout is client-side token removal.
- Local file storage remains available for development and tests. Production CV storage can use Cloudinary by setting `STORAGE_PROVIDER=cloudinary` with `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, and `CLOUDINARY_CV_FOLDER`.
- AI work is synchronous; Redis/BullMQ queues are not wired in.
- Job description upload is not implemented; matching and cover letters use pasted text or saved job target text.
- Job targets are saved text records, not scraped or uploaded job descriptions.
- Application tracking supports `SAVED`, `APPLIED`, `INTERVIEWING`, `OFFER`, and `REJECTED`; there is no kanban drag/drop, reminders, calendar sync, or external ATS integration.
- Application follow-up drafts are generated on demand and stored as `APPLICATION_FOLLOW_UP` history records.
- Interview prep works from an uploaded CV plus pasted role context or a saved job target, and stores results as `INTERVIEW_PREP` history records.
- Resume rewrite currently works from extracted CV text and stores results as `RESUME_REWRITE` history records. Interactive refinements of individual suggestions are stored as `REWRITE_REFINEMENT` records.
- Settings route is present but minimal.
- OpenAI integration uses `fetch` directly and is covered with unit tests, but live provider behavior needs manual validation with real credentials.
- Web E2E tests mock API responses; they do not currently exercise a full browser-to-Nest-to-Postgres flow.

## Recommended next priorities

1. Run `npm run check` after the latest docs/code sync and keep CI green on push/PR.
2. Add manual OpenAI validation notes for rewrite, rewrite refinement, and application follow-up using synthetic or redacted CV/application data.
3. Add a small full-stack E2E path that runs web, API, and PostgreSQL together.
4. Expand history/detail UX for saved analyses, matches, cover letters, resume rewrites, rewrite refinements, and application follow-ups.
5. Keep throttling tests stable by isolating tracker state when adding new rate-limited endpoints.
6. Align `.env.example` files with Docker Compose and CI database settings.
7. Add refresh/session strategy and explicit auth lifecycle decisions.
8. Add production file storage and background jobs after synchronous MVP behavior is stable.
