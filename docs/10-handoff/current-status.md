# Current Project Status

Last verified: 2026-05-22

## 1. Product summary

CV AI SaaS is an AI-assisted CV improvement product for job seekers. The MVP helps users create an account, upload CV files, extract CV text, analyze CV quality, compare a CV against a job description, generate a basic tailored cover letter, and review saved analysis history.

## 2. Current implemented features

- Authentication: register, login, authenticated `GET /auth/me`, JWT guard, password hashing, duplicate-email handling, and basic dashboard session handling.
- CV management: create metadata records, upload PDF/DOC/DOCX files, list CVs, fetch one CV, and soft-delete CVs.
- CV analysis: analyze extracted CV text through the analysis provider abstraction and persist `CV_ANALYSIS` records.
- Job description matching: compare a CV with pasted job description text and persist `JD_MATCH` records.
- Cover letter generation: generate a cover letter from CV text and job description text, with optional company and role inputs, and persist `COVER_LETTER` records.
- History: list non-deleted analysis records for a CV, newest first.
- Web UI: login, registration, protected dashboard, CV upload/list page, inline analysis, JD match, cover letter, and history panels.

## 3. Backend status

- NestJS API exists under `apps/api`.
- Prisma schema and migrations exist for `User`, `Cv`, and `CvAnalysis`.
- Implemented modules include `auth`, `cvs`, `analysis`, `config`, and `prisma`.
- API response wrapping and exception formatting are centralized.
- AI provider abstraction is present with mock and OpenAI providers; local/test default should be `AI_PROVIDER=mock`.
- File storage is currently local/in-memory-style service behavior for the app slice; production S3/Cloudinary integration is not complete.
- Redis/BullMQ are documented as planned architecture, but queue processing is not implemented yet.

## 4. Frontend status

- Next.js app exists under `apps/web`.
- Implemented routes: `/`, `/register`, `/login`, `/dashboard`, and `/dashboard/cvs`.
- `/register`, `/login`, `/dashboard`, and `/dashboard/cvs` call the backend API through `lib/api`.
- JWT access token is stored in `localStorage`.
- The home page is still the default create-next-app starter page and is not productized.
- UI is functional but minimal; no shared design system or shadcn/ui setup is currently present.

## 5. Testing status

- Backend uses Jest and Supertest.
- Frontend uses Playwright E2E tests.
- Current verification:
  - `npm run check:api` passes.
  - `npm run check:web` passes.
  - Backend: 20 test suites, 93 tests passing.
  - Frontend E2E: 31 Playwright tests passing.
- In this sandbox, both checks required elevated permission because Supertest/Playwright need to bind local servers.

## 6. Environment variables

Root `.env.example` is currently empty.

API variables from `apps/api/.env.example`:

```env
PORT=4000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cv_ai_dev?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
WEB_ORIGIN=http://localhost:3000
AI_PROVIDER=mock
OPENAI_API_KEY=
OPENAI_MODEL=
```

Web variables from `apps/web/.env.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Additional supported API variable:

- `CV_MAX_FILE_SIZE_BYTES`: optional upload size limit; defaults to 5 MB.

Note: `docker-compose.yml` exposes Postgres on host port `5433` with user/password `cvai`/`cvai`, which does not match the API `.env.example` `DATABASE_URL`.

## 7. Local development commands

- Install dependencies: `npm install`
- Start web: `npm run dev:web`
- Start API: `npm run dev:api`
- Check all: `npm run check`
- Check API only: `npm run check:api`
- Check web only: `npm run check:web`
- API tests only: `npm run test -w apps/api`
- Web E2E only: `npm run test:e2e -w apps/web`
- Start local Postgres: `docker compose up -d postgres`

## 8. Known limitations

- Home page is still the default Next.js starter page.
- No logout endpoint or refresh-token/session persistence beyond `localStorage` access token.
- No production-ready file storage integration yet.
- DOC/DOCX upload is accepted, but reliable text extraction appears focused on PDF support.
- AI work runs synchronously; Redis/BullMQ queues are not wired in.
- No global history page; history is shown per CV in the CV management page.
- No job description file upload on the frontend; matching uses pasted text.
- Root `.env.example` is empty, and API database example does not match Docker Compose.
- Generated app READMEs for `apps/api` and `apps/web` still contain framework starter content.

## 9. Next recommended tasks

1. Replace the starter home page with a product entry page linked to login/register/dashboard.
2. Align environment examples with Docker Compose and document Prisma migration/setup commands.
3. Add production-ready file storage configuration for S3-compatible storage or Cloudinary.
4. Add background jobs for file extraction and AI analysis once synchronous MVP behavior is stable.
5. Improve auth lifecycle with logout semantics, token expiry handling, and refresh/session strategy.
6. Add a dedicated analysis history view and detail pages for saved results.
7. Expand frontend UX around CV deletion, selected CV detail, and job description upload.
8. Replace starter READMEs with project-specific setup docs.

## 10. Important architectural decisions

- Use a modular monolith: one NestJS backend deployable, split by domain modules.
- Keep controllers thin; business logic belongs in services.
- Use Prisma for database access and keep persistence concerns out of controllers.
- Use consistent API envelopes: `{ data, meta }` for success and `{ error, meta }` for errors.
- Keep AI access behind a provider abstraction so OpenAI can be swapped for Gemini, OpenRouter, or another provider later.
- Prefer the mock AI provider for local development and automated tests.
- Follow backend TDD for business logic, validation, auth, and persistence behavior.
- Protect frontend critical flows with Playwright smoke/E2E tests.
- Build small vertical slices instead of multiple unfinished systems at once.
