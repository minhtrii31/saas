# AI Provider Configuration

The backend selects its CV analysis provider through environment variables.
Local development should use the mock provider by default so the product can be developed without network calls, API keys, provider outages, or usage charges.

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

Use the OpenAI provider only when validating real AI behavior manually or in a controlled deployed environment.

Behavior:

- Sends CV text and job description text to OpenAI.
- Requires `OPENAI_API_KEY`.
- Uses `OPENAI_MODEL` when set.
- Falls back to the backend default model when `OPENAI_MODEL` is not set.

Example:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
```

### `OPENAI_API_KEY`

Required when `AI_PROVIDER=openai`.

Leave this unset or empty when using `AI_PROVIDER=mock`.
Never commit a real API key to the repository, documentation, test fixtures, screenshots, logs, or shared example files.

### `OPENAI_MODEL`

Optional OpenAI model name used by the OpenAI provider.

If this value is not provided, the backend uses its configured default model.
Set it explicitly in environments where model choice affects cost, latency, output quality, or release validation.

## Testing Rules

Automated tests should not use a real AI provider.

Use:

```env
AI_PROVIDER=mock
```

Do not set `AI_PROVIDER=openai` in unit, integration, smoke, or E2E test environments. Tests should be deterministic, fast, and safe to run repeatedly without external API access, billing risk, or provider rate-limit failures.

## Cost and Safety Notes

- Real provider calls may incur usage charges.
- Uploaded CVs and job descriptions can contain personal or sensitive information.
- Use real provider calls only when the environment, data handling, and access controls are appropriate.
- Prefer synthetic or redacted data for manual provider testing.
- Keep API keys in local or deployment secrets, not in source control.
- If a real provider fails or returns invalid structured output, the application should handle it as an external provider failure rather than silently fabricating analysis results.
