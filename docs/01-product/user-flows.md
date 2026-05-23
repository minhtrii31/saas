# User Flows

These flows describe the current Nyx MVP routes and capabilities.

## Flow 1 — Register and Login

1. User opens the application
2. User creates an account
3. User logs in
4. User is redirected to `/dashboard`

Expected result:
- User session is created successfully
- Protected pages require authentication

---

## Flow 2 — Upload CV

1. User opens `/dashboard/cvs`
2. User uploads a CV file
3. System validates the file
4. System extracts CV text
5. User sees the CV in the repository and can open `/dashboard/cvs/[id]`

Expected result:
- CV metadata and extracted text are saved
- User can select the CV for analysis, matching, cover letter generation, interview prep, rewrite, or application tracking

---

## Flow 3 — Analyze CV

1. User opens `/dashboard/analyze`
2. User selects an uploaded CV
3. AI analyzes the extracted CV text
4. User receives:
   - CV score
   - strengths
   - weaknesses
   - improvement suggestions

Expected result:
- Analysis is saved to history
- User can revisit the result later

---

## Flow 4 — Compare CV With Job Description

1. User opens `/dashboard/match`
2. User selects an uploaded CV
3. User pastes a job description or selects a saved job target
4. AI compares CV and JD
5. User receives:
   - matching score
   - matching skills
   - missing skills
   - improvement suggestions

Expected result:
- Comparison result is saved
- User understands what should improve

---

## Flow 5 — Generate Cover Letter

1. User opens `/dashboard/cover-letter`
2. User selects a CV
3. User provides pasted job description text or selects a saved job target
4. AI generates a tailored cover letter

Expected result:
- User can copy and edit the generated content

---

## Flow 6 — View Analysis History

1. User opens `/dashboard/history`
2. User views previous analyses and comparisons
3. User reviews saved CV analysis, match, cover letter, interview prep, rewrite, refinement, and application follow-up records

Expected result:
- Users can track improvement over time

---

## Flow 7 — Prepare for Interview

1. User opens `/dashboard/interview-prep`
2. User selects an uploaded CV
3. User optionally selects a saved job target or pastes role context
4. User chooses behavioral, technical, or mixed interview focus
5. AI generates interview questions, answer direction, STAR guidance where useful, and weak-point practice areas

Expected result:
- Interview prep is saved to history
- User can practice role-specific questions grounded in their CV evidence

---

## Flow 8 — Save Job Target

1. User opens `/dashboard/job-targets`
2. User saves a target role with company name and job description text
3. User edits or deletes saved targets as needed

Expected result:
- Target role context can be reused for matching, cover letters, and interview prep

---

## Flow 9 — Track Application and Generate Follow-Up

1. User opens `/dashboard/applications`
2. User creates an application linked to a CV and optionally a saved job target
3. User sets the status to `SAVED`, `APPLIED`, `INTERVIEWING`, `OFFER`, or `REJECTED`
4. User adds applied date and notes where useful
5. User generates an AI follow-up draft from the application card

Expected result:
- Application progress is saved and grouped by status
- Follow-up draft is saved to history as `APPLICATION_FOLLOW_UP`
- Credits are consumed only after successful follow-up generation

---

## Flow 10 — View CV Progress

1. User opens `/dashboard/progress`
2. User selects an uploaded CV
3. User reviews score history, ATS readiness trend, rewrite activity, and improvement deltas

Expected result:
- User can see how CV quality and rewrite activity changed over time
