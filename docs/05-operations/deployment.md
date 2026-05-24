# Deployment: Vercel + Render

This guide describes the recommended production deployment shape for Nyx:

- Frontend: Vercel, serving `apps/web`.
- API: Render Web Service, serving `apps/api`.
- Database: hosted PostgreSQL.
- File storage: Cloudinary for uploaded CV files.

The frontend and API are separate deployments. The API must know the frontend origin through `WEB_ORIGIN`, and the frontend must know the API base URL through `NEXT_PUBLIC_API_URL`.

## Vercel frontend setup

Create a Vercel project for the Next.js app.

Recommended settings:

- Framework preset: Next.js.
- Root directory: `apps/web`.
- Install command: Vercel default is acceptable for the npm workspace.
- Build command: `npm run build`.
- Output directory: Vercel default for Next.js.

Required production environment variable:

```env
NEXT_PUBLIC_API_URL=https://<render-api-service>.onrender.com
```

Use the full public Render API origin, without a trailing slash. The web app uses this value for browser-side API calls, so it must be reachable from the user's browser.

After the first API deployment is live, update `NEXT_PUBLIC_API_URL` in Vercel if the Render URL changed, then redeploy the Vercel project.

## Render API setup

Create a Render Web Service for the NestJS API.

Recommended settings:

- Runtime: Node.
- Root directory: repository root.
- Build command:

```sh
npm run render:build:api
```

- Start command:

```sh
npm run start:prod -w apps/api
```

Render provides `PORT` automatically. Do not hard-code a production port unless the deployment platform requires it.

The API exposes `GET /health`, which checks database connectivity with Prisma. Configure Render health checks against:

```text
/health
```

## Hosted PostgreSQL setup

Use a hosted PostgreSQL database from Render, Neon, Supabase, Railway, or another managed provider.

Production requirements:

- Use a dedicated production database, not a development or test database.
- Set `DATABASE_URL` in the Render API service to the provider's production connection string.
- Ensure the database permits connections from Render.
- Keep `DATABASE_URL_TEST` unset in production.
- Run Prisma migrations with `prisma migrate deploy`, not `prisma migrate dev`.

The current API uses Prisma models for users, CVs, analysis history, job targets, applications, and usage records. Migrations live under `apps/api/prisma/migrations`.

## Cloudinary production storage

Production CV uploads should use Cloudinary rather than local filesystem storage.

Set these variables in the Render API service:

```env
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
CLOUDINARY_CV_FOLDER=nyx/cvs
```

`CLOUDINARY_CV_FOLDER` can be changed per environment, for example `nyx/production/cvs`, if separate folders make operations easier.

Local storage remains useful for development and tests, but Render instances should be treated as ephemeral. Do not rely on Render local disk for durable CV storage.

## API environment variables

Set these in the Render API service.

Required:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=<long-random-secret>
WEB_ORIGIN=https://<vercel-frontend-domain>
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>
```

AI provider:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=<provider-api-key>
OPENAI_MODEL=gpt-4.1-mini
OPENAI_BASE_URL=
OPENROUTER_SITE_URL=
OPENROUTER_SITE_NAME=
```

For a smoke-only deployment without real AI calls, `AI_PROVIDER=mock` can be used temporarily. Production validation of AI workflows should use a real provider with synthetic or redacted CV data.

Recommended defaults:

```env
AI_MAX_CV_CHARS=8000
AI_MAX_JD_CHARS=6000
CV_MAX_FILE_SIZE_BYTES=5242880
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

Optional Render-provided variable:

```env
PORT=<provided-by-render>
```

Do not commit real secrets to the repository or documentation.

## Frontend environment variables

Set this in the Vercel frontend project:

```env
NEXT_PUBLIC_API_URL=https://<render-api-service>.onrender.com
```

This value is bundled into the browser app. It is not secret.

When using a custom API domain, update this value to the custom domain and redeploy the frontend.

## CORS configuration

The API reads `WEB_ORIGIN` and allows that origin through NestJS CORS configuration.

For production, set:

```env
WEB_ORIGIN=https://<vercel-frontend-domain>
```

Use the exact browser origin:

- Include `https://`.
- Do not include a path.
- Do not include a trailing slash.
- If Vercel production uses a custom domain, use the custom domain rather than a preview URL.

The frontend must point back to the API with:

```env
NEXT_PUBLIC_API_URL=https://<render-api-service>.onrender.com
```

If login or dashboard API calls fail in the browser with CORS errors, first compare `WEB_ORIGIN` in Render with the exact frontend URL shown in the browser address bar.

## Prisma deploy steps

The API deployment must generate the Prisma client and apply existing migrations before the production process starts.

Use this order in Render's build command:

```sh
npm run render:build:api
```

Operational notes:

- `render:build:api` runs install, Prisma generation, API build, and migration deploy in sequence.
- `prisma generate` creates the Prisma client used by the built NestJS app.
- `prisma migrate deploy` applies committed migrations to the hosted PostgreSQL database.
- Do not use `prisma migrate dev` in production.
- Do not use `prisma db push` in production unless making an explicit one-off recovery decision.

## API start command

Use the production start script from the API workspace:

```sh
npm run start:prod -w apps/api
```

The script starts:

```sh
node dist/src/main.js
```

## Smoke test checklist

After deploying both services:

- Open the Render API health endpoint: `https://<render-api-service>.onrender.com/health`.
- Confirm the health response succeeds and returns wrapped API data with `status: "ok"`.
- Open the Vercel frontend.
- Register a new test user.
- Log out and log back in.
- Confirm `/dashboard` loads after authentication.
- Upload a small PDF CV from `/dashboard/cvs`.
- Open the uploaded CV detail page and confirm extracted text is present.
- Run CV analysis from `/dashboard/analyze`.
- Save a job target from `/dashboard/job-targets`.
- Run JD matching from `/dashboard/match` using pasted job description text or the saved job target.
- Generate a cover letter from `/dashboard/cover-letter`.
- Confirm `/dashboard/history` shows saved AI workflow results.
- Confirm uploaded CV files appear in the configured Cloudinary folder.
- Check Render logs for startup, migration, CORS, database, Cloudinary, or AI provider errors.

PDF uploads are recommended for AI workflows until DOC/DOCX extraction exists. The current extraction path is built around PDF text extraction; DOC and DOCX files should not be used for production AI validation unless extraction support has been added and tested.

## Deployment order

Use this sequence for a new environment:

1. Create the hosted PostgreSQL database.
2. Create Cloudinary credentials and choose a CV folder.
3. Create the Render API service with `DATABASE_URL`, Cloudinary variables, `JWT_SECRET`, and temporary `WEB_ORIGIN` if the frontend URL is not known yet.
4. Deploy the API and confirm `/health`.
5. Create the Vercel frontend with `NEXT_PUBLIC_API_URL` pointed at the Render API.
6. Deploy the frontend and note its production URL.
7. Update Render `WEB_ORIGIN` to the exact Vercel production origin.
8. Redeploy Render if needed.
9. Run the smoke test checklist.
