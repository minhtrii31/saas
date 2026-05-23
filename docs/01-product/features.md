# Features

## Current MVP Features

### Authentication

Users can register, log in, log out through client-side token removal, and access protected pages.

### CV Management

Users can upload CV files, store metadata and extracted text, view uploaded CVs, open CV detail, soft-delete CVs, and select a CV for analysis, matching, cover letters, interview prep, or resume rewrite.

### CV Analysis

Users can analyze a CV and receive:

- CV score
- Strengths
- Weaknesses
- Improvement suggestions

### Resume Rewrite

Users can improve resume bullets from an uploaded CV at `/dashboard/rewrite`, then refine individual suggestions without rerunning the whole workflow.

The result includes:

- Original wording
- Rewritten alternatives
- Rewrite rationale
- Selected rewrite goal

Users can refine each suggestion with one of these instructions:

- stronger
- shorter
- more-technical
- more-leadership
- more-ats-friendly
- more-results-focused

### Job Description Matching

Users can paste a job description and compare it with a selected CV.

The result includes:

- Matching score
- Matched skills
- Missing skills
- Improvement suggestions

### Cover Letter Generation

Users can generate a basic tailored cover letter from a selected CV and job description.

### Interview Preparation

Users can prepare for interviews from a selected CV at `/dashboard/interview-prep`.

The workflow can use:

- Pasted role context
- A saved job target reused from prior job-specific work

The result includes:

- Interview questions
- Answer direction
- STAR guidance where useful
- Weak-point practice areas

Interview preparation results are stored as `INTERVIEW_PREP` analysis records and consume credits after successful generation.

### History

Users can view previous CV analyses, JD comparisons, interview prep results, resume rewrites, rewrite refinements, and generated cover letters in dashboard history. Interview prep records are stored as `INTERVIEW_PREP`; resume rewrite records are stored as `RESUME_REWRITE`; per-suggestion refinements are stored as `REWRITE_REFINEMENT`.

## Future Features

- Job description file upload
- Production S3/Cloudinary file storage
- Background AI/file-processing jobs
- Refresh-token or server-side session strategy
- CV builder
- Resume templates
- Job tracking board
- Payment/subscription
- Recruiter mode
- AI chat assistant
- Advanced analytics
