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
- User can select the CV for analysis, matching, or cover letter generation

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
3. User pastes a job description
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
3. User provides pasted job description text
4. AI generates a tailored cover letter

Expected result:
- User can copy and edit the generated content

---

## Flow 6 — View Analysis History

1. User opens `/dashboard/history`
2. User views previous analyses and comparisons
3. User reviews saved CV analysis, match, and cover letter records

Expected result:
- Users can track improvement over time
