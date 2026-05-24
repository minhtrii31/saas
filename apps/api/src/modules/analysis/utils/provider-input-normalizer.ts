export type ProviderInputLimits = {
  maxCvChars: number;
  maxJdChars: number;
};

export const DEFAULT_PROVIDER_INPUT_LIMITS: ProviderInputLimits = {
  maxCvChars: 8000,
  maxJdChars: 6000,
};

export function normalizeProviderText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeAndTruncateProviderText(
  value: string,
  maxChars: number,
): string {
  return normalizeProviderText(value).slice(0, maxChars).trim();
}

export function normalizeCvProviderText(
  value: string,
  limits: Pick<ProviderInputLimits, 'maxCvChars'>,
): string {
  return normalizeAndTruncateProviderText(value, limits.maxCvChars);
}

export function normalizeJdProviderText(
  value: string,
  limits: Pick<ProviderInputLimits, 'maxJdChars'>,
): string {
  return normalizeAndTruncateProviderText(value, limits.maxJdChars);
}
