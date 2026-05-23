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
- `/dashboard/analyze`: select CV and run CV quality analysis.
- `/dashboard/match`: select CV and compare against pasted job description.
- `/dashboard/cover-letter`: select CV and generate cover letter from job description.
- `/dashboard/history`: saved analysis, match, and cover letter history across CVs.
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

AI workflows:

- `POST /cvs/:id/analyze`
- `POST /cvs/:id/match`
- `POST /cvs/:id/cover-letter`

## Current route conventions

- Protected frontend routes validate the stored access token through `GET /auth/me`.
- Dashboard task routes select an existing CV before calling AI workflow endpoints.
- Matching and cover letter routes accept pasted job description text.
- Backend CV route params use UUID validation.
- Soft-deleted CVs are hidden and treated as not found for owner workflows.
