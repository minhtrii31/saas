# Route Structure

## Frontend routes

Public:

- `/`: Nyx product entry page.
- `/register`: create account.
- `/login`: log in.

Protected dashboard:

- `/dashboard`: overview, workspace metrics, recent activity, and recommended next action.
- `/dashboard/cvs`: CV repository with upload and list.
- `/dashboard/cvs/[id]`: CV detail with metadata and extracted text.
- `/dashboard/job-targets`: saved target roles and reusable job description context.
- `/dashboard/applications`: application tracker with status lanes, notes, and follow-up draft generation.
- `/dashboard/progress`: resume quality trends, ATS trend, rewrite activity, and improvement deltas.
- `/dashboard/analyze`: select CV and run CV quality analysis.
- `/dashboard/match`: select CV and compare against pasted job description.
- `/dashboard/interview-prep`: select CV, optional saved target or pasted role context, and generate interview preparation.
- `/dashboard/cover-letter`: select CV and generate cover letter from job description.
- `/dashboard/rewrite`: generate resume rewrite suggestions and refine individual suggestions.
- `/dashboard/history`: saved analysis, match, cover letter, interview prep, rewrite, refinement, and application follow-up history across CVs.
- `/dashboard/settings`: placeholder for future user/workspace settings.

## Backend routes

Auth:

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

CVs:

- `GET /cvs`
- `POST /cvs`
- `POST /cvs/upload`
- `GET /cvs/:id`
- `DELETE /cvs/:id`
- `GET /cvs/:id/analyses`
- `GET /cvs/:id/progress`

Job targets:

- `GET /job-targets`
- `POST /job-targets`
- `GET /job-targets/:id`
- `PATCH /job-targets/:id`
- `DELETE /job-targets/:id`

Applications:

- `GET /applications`
- `POST /applications`
- `PATCH /applications/:id`
- `DELETE /applications/:id`
- `POST /applications/:id/follow-up`

AI workflows:

- `POST /cvs/:id/analyze`
- `POST /cvs/:id/match`
- `POST /cvs/:id/interview-prep`
- `POST /cvs/:id/cover-letter`
- `POST /cvs/:id/rewrite`
- `POST /cvs/:id/rewrite/refine`

## Current route conventions

- Protected frontend routes validate the stored access token through `GET /auth/me`.
- Dashboard task routes select an existing CV before calling AI workflow endpoints.
- Matching and cover letter routes accept pasted job description text.
- Interview prep accepts an optional saved target, optional pasted role context, and a behavioral, technical, or mixed focus.
- Applications are linked to an owned CV and can optionally link to an owned saved job target.
- Application statuses are `SAVED`, `APPLIED`, `INTERVIEWING`, `OFFER`, and `REJECTED`.
- Backend CV route params use UUID validation.
- Soft-deleted CVs, job targets, and applications are hidden and treated as not found for owner workflows.
