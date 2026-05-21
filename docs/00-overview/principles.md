# Principles

## Product Principles

- Help users make better job application decisions.
- Give structured feedback, not vague AI advice.
- Keep the user in control.
- Explain why a suggestion matters.
- Prefer improvement guidance over automatic replacement.

## Engineering Principles

- Build small vertical slices.
- Prefer simple, testable code.
- Backend features should follow TDD.
- Frontend changes should protect critical flows with smoke/E2E tests.
- Avoid adding dependencies without a clear reason.
- Do not optimize for scale before the MVP proves value.

## AI Principles

- AI output must be structured.
- AI should not silently invent user experience or job facts.
- AI suggestions should be actionable.
- AI should explain tradeoffs when possible.
- Store important analysis results for user history.