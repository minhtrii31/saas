import {
  buildCoverLetterPrompt,
  buildCvAnalysisPrompt,
  buildJdMatchPrompt,
  buildRewriteRefinementPrompt,
  buildResumeRewritePrompt,
} from '../prompts/analysis-prompt.builder';

describe('analysis prompt builders', () => {
  it('builds reusable CV analysis prompt instructions with schema metadata', () => {
    const prompt = buildCvAnalysisPrompt(
      'Senior backend engineer. Built APIs with TypeScript and PostgreSQL.',
    );

    expect(prompt.schemaName).toBe('cv_analysis');
    expect(prompt.systemPrompt).toContain('evidence-backed');
    expect(prompt.systemPrompt).toContain('Do not invent');
    expect(prompt.userPrompt).toContain('CV text:');
    expect(prompt.userPrompt).toContain('Senior backend engineer');
    expect(prompt.jsonSchema).toEqual(
      expect.objectContaining({
        required: [
          'score',
          'scoringCategories',
          'strengths',
          'weaknesses',
          'actionableInsights',
          'suggestions',
        ],
      }),
    );
    expect(
      (prompt.jsonSchema.properties as Record<string, unknown>)
        .scoringCategories,
    ).toEqual(
      expect.objectContaining({
        required: [
          'atsReadiness',
          'readability',
          'impact',
          'keywordOptimization',
          'structure',
          'experienceQuality',
        ],
      }),
    );
    expect(prompt.systemPrompt).toContain('recruiter-style');
    expect(prompt.systemPrompt).toContain('categorized scores');
  });

  it('builds JD matching prompts that ask for useful overlap and gap feedback', () => {
    const prompt = buildJdMatchPrompt(
      'TypeScript NestJS PostgreSQL experience.',
      'Role needs TypeScript, Redis, and API testing.',
    );

    expect(prompt.schemaName).toBe('job_description_match');
    expect(prompt.systemPrompt).toContain('separate confirmed matches');
    expect(prompt.systemPrompt).toContain('penalize critical missing');
    expect(prompt.userPrompt).toContain('CV text:');
    expect(prompt.userPrompt).toContain('Job description:');
  });

  it('builds cover letter prompts with optional targeting details', () => {
    const prompt = buildCoverLetterPrompt('Built backend APIs.', {
      jobDescriptionText: 'Hiring backend engineers.',
      companyName: 'Example Corp',
      roleTitle: 'Backend Engineer',
      tone: 'confident',
    });

    expect(prompt.schemaName).toBe('cover_letter');
    expect(prompt.systemPrompt).toContain('specific, editable cover letter');
    expect(prompt.systemPrompt).toContain('Avoid generic enthusiasm');
    expect(prompt.userPrompt).toContain('Company name: Example Corp');
    expect(prompt.userPrompt).toContain('Role title: Backend Engineer');
    expect(prompt.userPrompt).toContain('Requested tone: confident');
  });

  it('builds resume rewrite prompts with the rewrite goal and strict schema', () => {
    const prompt = buildResumeRewritePrompt(
      'Backend engineer with TypeScript API delivery.',
      {
        originalText: 'Helped with APIs.',
        rewriteGoal: 'ats-optimization',
      },
    );

    expect(prompt.schemaName).toBe('resume_rewrite');
    expect(prompt.systemPrompt).toContain('weak bullet rewrites');
    expect(prompt.systemPrompt).toContain('Do not invent metrics');
    expect(prompt.userPrompt).toContain('Original resume text to rewrite:');
    expect(prompt.userPrompt).toContain('Rewrite goal: ats-optimization');
    expect(prompt.jsonSchema).toEqual(
      expect.objectContaining({
        required: [
          'originalText',
          'rewrittenText',
          'explanation',
          'rewriteGoal',
        ],
      }),
    );
  });

  it('builds rewrite refinement prompts with the instruction and strict schema', () => {
    const prompt = buildRewriteRefinementPrompt(
      'Backend engineer with TypeScript API delivery.',
      {
        original: 'Helped with APIs.',
        currentRewrite: 'Delivered API improvements.',
        instruction: 'more-technical',
      },
    );

    expect(prompt.schemaName).toBe('rewrite_refinement');
    expect(prompt.systemPrompt).toContain('iterative editor');
    expect(prompt.systemPrompt).toContain('Do not invent metrics');
    expect(prompt.userPrompt).toContain('Current rewrite:');
    expect(prompt.userPrompt).toContain(
      'Refinement instruction: more-technical',
    );
    expect(prompt.jsonSchema).toEqual(
      expect.objectContaining({
        required: ['improved', 'reason'],
      }),
    );
  });
});
