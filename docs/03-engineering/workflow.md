# Engineering Workflow

## Philosophy

The project uses AI-assisted engineering, not vibe coding.

AI is used as a collaborative engineering assistant.
Human decisions remain responsible for:

- product direction
- architecture
- priorities
- validation
- final review

---

## Development Style

Development should happen in small vertical slices.

Example:

- authentication
- CV upload
- CV analysis
- JD matching

Avoid building many unfinished systems simultaneously.

---

## Backend Workflow

Backend development follows strict TDD.

Cycle:

1. Write failing test
2. Implement minimum code
3. Make tests pass
4. Refactor safely
5. Run verification

Rules:

- Do not implement backend features before tests.
- Prefer small and focused services.
- Keep business logic testable.
- Avoid large controllers.

---

## Frontend Workflow

Frontend development focuses on:

- user flows
- stability
- smoke/E2E protection

Frontend should prioritize:

- accessibility
- responsive layout
- simple UX
- protected critical flows

---

## AI Collaboration Workflow

Before implementation:

1. Read AGENTS.md
2. Read related docs
3. Analyze current architecture
4. Propose implementation plan
5. Wait for approval if scope is large

During implementation:

- Make incremental changes
- Explain major decisions
- Avoid unnecessary abstractions

After implementation:

- Run tests
- Run lint/typecheck
- Summarize changed files
- Explain tradeoffs or limitations

---

## Anti-Patterns

Avoid:

- giant prompts
- implementing entire systems at once
- unnecessary abstractions
- premature microservices
- skipping tests
- blindly accepting AI-generated code
