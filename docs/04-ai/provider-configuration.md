# AI Provider Configuration

The backend selects its CV analysis provider through environment variables.
Local development should use the mock provider by default so the product can be developed without network calls, API keys, provider outages, or usage charges.

The current provider boundary is `CvAnalysisProvider`. It supports:

- CV quality analysis.
- Job description matching.
- Cover letter generation.
- Interview preparation.
- Resume rewrite.
- Rewrite refinement.
- Application follow-up draft generation.

Provider responses include `aiProvider`, `aiModel`, and structured result data before they are persisted as `CvAnalysis` records.

## Environment Variables

### `AI_PROVIDER=mock`

Use the mock provider for local development and automated tests.

Behavior:

- Uses deterministic in-app analysis responses.
- Does not require `OPENAI_API_KEY`.
- Does not call an external AI API.
- Avoids token costs and provider rate limits.

Recommended local development setting:

```env
AI_PROVIDER=mock
```

### `AI_PROVIDER=openai`

Use the OpenAI provider only when validating real AI behavior manually or in a controlled deployed environment. This provider can call OpenAI directly or another OpenAI-compatible chat completions endpoint.

Behavior:

- Sends normalized workflow input to the configured OpenAI-compatible endpoint, such as CV text, job description text, saved job target context, interview focus, cover letter options, rewrite goals, refinement instructions, or application follow-up context.
- Requires `OPENAI_API_KEY`.
- Uses `OPENAI_MODEL` when set.
- Falls back to the backend default model when `OPENAI_MODEL` is not set.
- Uses the default OpenAI API endpoint when `OPENAI_BASE_URL` is not set.
- Requests strict structured JSON and normalizes the returned fields before service code sees the result.
- Returns a clean `AI_PROVIDER_ERROR` response when the provider fails or returns invalid structured output.

OpenAI example:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
```

OpenRouter example:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-or-...
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openai/gpt-4.1-mini
OPENROUTER_SITE_URL=https://nyx.example
OPENROUTER_SITE_NAME=Nyx
```

Other OpenAI-compatible endpoints can use the same provider by setting `OPENAI_BASE_URL` to the endpoint base URL that exposes `/chat/completions`.

### `OPENAI_API_KEY`

Required when `AI_PROVIDER=openai`.

Leave this unset or empty when using `AI_PROVIDER=mock`.
Never commit a real API key to the repository, documentation, test fixtures, screenshots, logs, or shared example files.

### `OPENAI_MODEL`

Optional model name used by the OpenAI provider.

If this value is not provided, the backend uses its configured default model.
Set it explicitly in environments where model choice affects cost, latency, output quality, or release validation.

Example model names:

- `gpt-4.1-mini`
- `gpt-4.1`
- `openai/gpt-4.1-mini` for OpenRouter
- `anthropic/claude-sonnet-4` for OpenRouter, if the endpoint supports OpenAI-compatible structured outputs for the requested workflow

### `OPENAI_BASE_URL`

Optional base URL for OpenAI-compatible endpoints.

When unset, the provider uses the default OpenAI API endpoint. When set, the provider sends chat completion requests to:

```text
<OPENAI_BASE_URL>/chat/completions
```

Example:

```env
OPENAI_BASE_URL=https://openrouter.ai/api/v1
```

### `OPENROUTER_SITE_URL`

Optional OpenRouter attribution URL.

When set, the provider sends it as the `HTTP-Referer` header. It is not required for OpenAI or other compatible endpoints.

### `OPENROUTER_SITE_NAME`

Optional OpenRouter attribution title.

When set, the provider sends it as the `X-OpenRouter-Title` header. It is not required for OpenAI or other compatible endpoints.

### `AI_MAX_CV_CHARS`

Maximum normalized CV text characters sent to AI providers.

The backend preserves full extracted CV text in the database and only truncates the provider input. When unset, this defaults to `8000`.

### `AI_MAX_JD_CHARS`

Maximum normalized job description text characters sent to AI providers.

The backend preserves the submitted or saved job description text in persisted analysis records and only truncates the provider input. When unset, this defaults to `6000`.

## Testing Rules

Automated tests should not use a real AI provider.

Use:

```env
AI_PROVIDER=mock
```

Do not set `AI_PROVIDER=openai` in unit, integration, smoke, or E2E test environments. Tests should be deterministic, fast, and safe to run repeatedly without external API access, billing risk, or provider rate-limit failures.

## Architecture Rules

- Do not call OpenAI directly from controllers.
- Do not call OpenAI directly from CV workflow services.
- Add future providers by implementing `CvAnalysisProvider` and wiring provider selection in the analysis module.
- Use `OpenAiAnalysisProvider` for OpenAI-compatible endpoints when the endpoint supports the current structured JSON request shape.
- Keep provider output structured and normalized before persistence.
- Normalize and cap CV/JD provider input at the analysis service boundary; do not truncate persisted `extractedText` or saved job description history fields.
- Persist provider/model metadata with analysis records for auditability.

Current providers:

- `MockCvAnalysisProvider`
- `OpenAiAnalysisProvider` for OpenAI and OpenAI-compatible endpoints such as OpenRouter

Interview prep accepts CV text plus role context from pasted text or a saved job target, with behavioral, technical, or mixed focus. The backend persists interview prep output as `INTERVIEW_PREP` history records after successful credit deduction.

Application follow-up accepts CV text plus application context: company name, role title, application status, optional applied date, and optional notes. The backend persists follow-up output as `APPLICATION_FOLLOW_UP` history records after successful credit deduction. The saved result includes the application id, draft, and tone.

Rewrite refinement accepts one current rewrite plus the original wording and one supported instruction:

- `stronger`
- `shorter`
- `more-technical`
- `more-leadership`
- `more-ats-friendly`
- `more-results-focused`

The backend persists refinement output as `REWRITE_REFINEMENT` history records.

Future provider candidates remain Gemini or providers that need a different request/response contract from the OpenAI-compatible path.

## Usage Cost Variables

The usage module reads per-action costs from environment variables:

- `USAGE_COST_CV_ANALYSIS`
- `USAGE_COST_JD_MATCH`
- `USAGE_COST_COVER_LETTER`
- `USAGE_COST_RESUME_REWRITE`
- `USAGE_COST_REWRITE_REFINEMENT`
- `USAGE_COST_INTERVIEW_PREP`
- `USAGE_COST_APPLICATION_FOLLOW_UP`

All costs default to `1` credit when unset.

## Cost and Safety Notes

- Real provider calls may incur usage charges.
- CV and job description text is whitespace-normalized and capped before provider calls to control request size.
- Uploaded CVs and job descriptions can contain personal or sensitive information.
- Use real provider calls only when the environment, data handling, and access controls are appropriate.
- Prefer synthetic or redacted data for manual provider testing.
- Keep API keys in local or deployment secrets, not in source control.
- If a real provider fails or returns invalid structured output, the application should handle it as an external provider failure rather than silently fabricating analysis results.
