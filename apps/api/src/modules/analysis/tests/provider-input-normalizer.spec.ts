import {
  normalizeAndTruncateProviderText,
  normalizeCvProviderText,
  normalizeJdProviderText,
  normalizeProviderText,
} from '../utils/provider-input-normalizer';

describe('provider input normalizer', () => {
  it('removes excessive whitespace and trims the result', () => {
    expect(normalizeProviderText('  Senior\n\nEngineer\t with   APIs  ')).toBe(
      'Senior Engineer with APIs',
    );
  });

  it('truncates after normalization', () => {
    expect(
      normalizeAndTruncateProviderText('  TypeScript\n\nNestJS   Redis  ', 17),
    ).toBe('TypeScript NestJS');
  });

  it('caps CV and JD text with separate limits', () => {
    expect(normalizeCvProviderText('A B C D', { maxCvChars: 5 })).toBe('A B C');
    expect(normalizeJdProviderText('A B C D', { maxJdChars: 3 })).toBe('A B');
  });
});
