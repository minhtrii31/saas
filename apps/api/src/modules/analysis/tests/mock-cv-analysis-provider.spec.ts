import { MockCvAnalysisProvider } from '../providers/mock-cv-analysis.provider';

describe('MockCvAnalysisProvider', () => {
  it('returns structured mock CV analysis from extracted text', async () => {
    const provider = new MockCvAnalysisProvider();

    const result = await provider.analyzeCv(
      [
        'Summary',
        'Senior Backend Engineer',
        'Experience',
        'Built TypeScript and NestJS APIs for payment workflows.',
        'Improved PostgreSQL query latency by 35% and added API testing.',
        'Led migration planning and collaborated with product managers.',
        'Skills: TypeScript, NestJS, PostgreSQL, API testing',
      ].join('\n'),
    );

    expect(result).toEqual({
      score: expect.any(Number),
      scoringCategories: {
        atsReadiness: expect.any(Number),
        readability: expect.any(Number),
        impact: expect.any(Number),
        keywordOptimization: expect.any(Number),
        structure: expect.any(Number),
        experienceQuality: expect.any(Number),
      },
      strengths: expect.arrayContaining([expect.any(String)]),
      weaknesses: expect.arrayContaining([expect.any(String)]),
      actionableInsights: {
        missingQuantifiedAchievements: expect.arrayContaining([
          expect.any(String),
        ]),
        weakActionVerbs: expect.arrayContaining([expect.any(String)]),
        missingSections: expect.arrayContaining([expect.any(String)]),
        overlyGenericWording: expect.arrayContaining([expect.any(String)]),
        formattingConcerns: expect.arrayContaining([expect.any(String)]),
        keywordGaps: expect.arrayContaining([expect.any(String)]),
      },
      suggestions: expect.arrayContaining([expect.any(String)]),
    });
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.strengths.join(' ')).toContain('TypeScript');
    expect(result.scoringCategories.atsReadiness).toBeGreaterThanOrEqual(70);
    expect(result.actionableInsights.keywordGaps.join(' ')).toContain(
      'target role',
    );
    expect(result.suggestions.join(' ')).toContain('top third');
  });

  it('scores thin CV text lower and gives concrete section guidance', async () => {
    const provider = new MockCvAnalysisProvider();

    const result = await provider.analyzeCv('Developer. JavaScript.');

    expect(result.score).toBeLessThan(65);
    expect(result.scoringCategories.structure).toBeLessThan(65);
    expect(result.weaknesses.join(' ')).toContain('too thin');
    expect(result.actionableInsights.missingSections.join(' ')).toContain(
      'summary',
    );
    expect(
      result.actionableInsights.missingQuantifiedAchievements.join(' '),
    ).toContain('metrics');
    expect(result.suggestions.join(' ')).toContain('Replace');
  });

  it('returns structured mock JD match analysis from CV and job description text', async () => {
    const provider = new MockCvAnalysisProvider();

    const result = await provider.matchJobDescription(
      'Backend engineer with TypeScript, NestJS, PostgreSQL, and testing experience.',
      'Backend role requiring TypeScript, NestJS, PostgreSQL, Redis, and API testing.',
    );

    expect(result).toEqual({
      matchingScore: expect.any(Number),
      matchedSkills: expect.arrayContaining(['TypeScript', 'NestJS']),
      missingSkills: expect.arrayContaining(['Redis']),
      suggestions: expect.arrayContaining([expect.any(String)]),
    });
    expect(result.matchingScore).toBeGreaterThanOrEqual(0);
    expect(result.matchingScore).toBeLessThanOrEqual(100);
    expect(result.suggestions.join(' ')).toContain('Redis');
  });

  it('returns structured mock cover letter content from CV and job description text', async () => {
    const provider = new MockCvAnalysisProvider();

    const result = await provider.generateCoverLetter(
      'Backend engineer with TypeScript, NestJS, PostgreSQL, and testing experience.',
      {
        jobDescriptionText:
          'Backend role requiring TypeScript, NestJS, PostgreSQL, Redis, and API testing.',
        companyName: 'Example Corp',
        roleTitle: 'Backend Engineer',
      },
    );

    expect(result).toEqual({
      coverLetter: expect.any(String),
      tone: expect.any(String),
      highlights: expect.arrayContaining([expect.any(String)]),
    });
    expect(result.coverLetter).toContain('Example Corp');
    expect(result.coverLetter).toContain('Backend Engineer');
    expect(result.coverLetter).toContain('TypeScript');
    expect(result.coverLetter).not.toContain('your job description');
  });
});
