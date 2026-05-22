import { MockCvAnalysisProvider } from '../providers/mock-cv-analysis.provider';

describe('MockCvAnalysisProvider', () => {
  it('returns structured mock CV analysis from extracted text', async () => {
    const provider = new MockCvAnalysisProvider();

    const result = await provider.analyzeCv(
      'Backend engineer with TypeScript NestJS PostgreSQL testing and API experience.',
    );

    expect(result).toEqual({
      score: expect.any(Number),
      strengths: expect.arrayContaining([expect.any(String)]),
      weaknesses: expect.arrayContaining([expect.any(String)]),
      suggestions: expect.arrayContaining([expect.any(String)]),
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
