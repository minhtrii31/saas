import { Injectable } from '@nestjs/common';
import type {
  CvActionableInsights,
  CoverLetterGenerationInput,
  CoverLetterResult,
  CvAnalysisProvider,
  CvAnalysisResult,
  CvScoringCategories,
  JdMatchResult,
} from '../types/cv-analysis-provider';

type SkillDefinition = {
  label: string;
  aliases: string[];
};

@Injectable()
export class MockCvAnalysisProvider implements CvAnalysisProvider {
  readonly providerName = 'mock';
  readonly jdMatcherModelName = 'mock-jd-matcher-v1';
  readonly coverLetterModelName = 'mock-cover-letter-v1';
  private readonly cvAnalyzerModelName = 'mock-cv-analyzer-v1';

  get modelName(): string {
    return this.cvAnalyzerModelName;
  }

  analyzeCv(extractedText: string): Promise<CvAnalysisResult> {
    const normalizedText = extractedText.trim();
    const profile = this.profileText(normalizedText);
    const score = this.scoreCv(profile);

    return Promise.resolve({
      score,
      scoringCategories: this.scoreCategories(profile),
      strengths: this.buildStrengths(profile),
      weaknesses: this.buildWeaknesses(profile),
      actionableInsights: this.buildActionableInsights(profile),
      suggestions: this.buildCvSuggestions(profile),
    });
  }

  matchJobDescription(
    extractedText: string,
    jobDescriptionText: string,
  ): Promise<JdMatchResult> {
    const cvProfile = this.profileText(extractedText);
    const jdProfile = this.profileText(jobDescriptionText);
    const cvSkills = cvProfile.skills;
    const jdSkills = jdProfile.skills;
    const matchedSkills = jdSkills.filter((skill) => cvSkills.includes(skill));
    const missingSkills = jdSkills.filter((skill) => !cvSkills.includes(skill));
    const matchingScore = this.scoreMatch({
      cvProfile,
      jdProfile,
      matchedSkills,
      missingSkills,
    });

    return Promise.resolve({
      matchingScore,
      matchedSkills:
        matchedSkills.length > 0
          ? matchedSkills
          : ['CV text is available for comparison'],
      missingSkills:
        missingSkills.length > 0
          ? missingSkills
          : ['No critical skill gaps detected from the provided mock inputs'],
      suggestions: this.buildMatchSuggestions(matchedSkills, missingSkills),
    });
  }

  generateCoverLetter(
    extractedText: string,
    input: CoverLetterGenerationInput,
  ): Promise<CoverLetterResult> {
    const roleTitle = input.roleTitle || 'the role';
    const companyName = input.companyName || 'your company';
    const tone = input.tone || 'professional';
    const cvSkills = this.findKnownSkills(extractedText);
    const jdSkills = this.findKnownSkills(input.jobDescriptionText);
    const matchedSkills = jdSkills
      .filter((skill) => cvSkills.includes(skill))
      .slice(0, 3);
    const highlights =
      matchedSkills.length > 0
        ? matchedSkills.map((skill) => `${skill} experience`)
        : this.buildFallbackHighlights(extractedText);
    const firstHighlight = highlights[0];
    const secondHighlight = highlights[1] ?? 'relevant delivery experience';
    const missingSkills = jdSkills.filter((skill) => !cvSkills.includes(skill));
    const tailoringSentence =
      missingSkills.length > 0
        ? `I would also use the application process to address your need for ${missingSkills[0]} by connecting it to adjacent work and current learning.`
        : 'The overlap between my background and the role requirements gives me a practical base to contribute quickly.';

    return Promise.resolve({
      coverLetter: [
        `Dear ${companyName} hiring team,`,
        '',
        `I am applying for ${roleTitle} because my recent work shows ${firstHighlight} and ${secondHighlight}.`,
        '',
        `In my CV, the strongest evidence for this role is hands-on delivery with ${highlights.slice(0, 3).join(', ')}. I would bring that same practical focus to ${companyName}.`,
        '',
        tailoringSentence,
        '',
        'I would welcome the opportunity to discuss how my background can support your team.',
        '',
        'Sincerely,',
        'Candidate',
      ].join('\n'),
      tone,
      highlights,
    });
  }

  private profileText(text: string) {
    const words = text.split(/\s+/).filter(Boolean);
    const skills = this.findKnownSkills(text);
    const hasMetrics =
      /\b\d+[%+]?|\b(percent|reduced|increased|improved|saved)\b/i.test(text);
    const hasRoleSignal =
      /\b(engineer|developer|manager|analyst|designer|lead|specialist)\b/i.test(
        text,
      );
    const hasSectionSignal =
      /\b(experience|education|skills|projects|summary|certifications)\b/i.test(
        text,
      );
    const hasSummary = /\b(summary|profile|objective)\b/i.test(text);
    const hasExperience = /\b(experience|employment|work history)\b/i.test(
      text,
    );
    const hasEducation = /\b(education|degree|university|college)\b/i.test(
      text,
    );
    const hasSkillsSection = /\b(skills|technical skills|tooling)\b/i.test(
      text,
    );
    const hasLongLines = text
      .split(/\n+/)
      .some((line) => line.trim().length > 180);
    const hasImpactVerbs =
      /\b(built|led|launched|improved|designed|migrated|owned|delivered|automated|optimized)\b/i.test(
        text,
      );
    const weakVerbMatches = text.match(
      /\b(responsible for|helped|worked on|assisted|participated in|involved in)\b/gi,
    );
    const genericMatches = text.match(
      /\b(hard working|team player|detail-oriented|results-driven|self-starter|fast learner|go-getter)\b/gi,
    );

    return {
      wordCount: words.length,
      skills,
      hasMetrics,
      hasRoleSignal,
      hasSectionSignal,
      hasSummary,
      hasExperience,
      hasEducation,
      hasSkillsSection,
      hasLongLines,
      hasImpactVerbs,
      weakVerbMatches: weakVerbMatches ?? [],
      genericMatches: genericMatches ?? [],
    };
  }

  private scoreCv(profile: ReturnType<MockCvAnalysisProvider['profileText']>) {
    let score = 46;

    score += Math.min(18, Math.floor(profile.wordCount / 12));
    score += Math.min(16, profile.skills.length * 3);
    score += profile.hasMetrics ? 9 : 0;
    score += profile.hasRoleSignal ? 5 : 0;
    score += profile.hasSectionSignal ? 5 : 0;
    score += profile.hasImpactVerbs ? 7 : 0;

    if (profile.wordCount < 12) {
      score -= 8;
    }

    return Math.max(35, Math.min(92, score));
  }

  private scoreCategories(
    profile: ReturnType<MockCvAnalysisProvider['profileText']>,
  ): CvScoringCategories {
    const atsReadiness = this.clampScore(
      50 +
        (profile.hasSectionSignal ? 14 : 0) +
        Math.min(18, profile.skills.length * 3) +
        (profile.hasLongLines ? -8 : 0) +
        (profile.wordCount > 80 ? 8 : 0),
    );
    const readability = this.clampScore(
      54 +
        (profile.hasSectionSignal ? 12 : 0) +
        (profile.hasLongLines ? -14 : 0) +
        (profile.wordCount > 35 ? 12 : -8) +
        (profile.genericMatches.length > 0 ? -5 : 0),
    );
    const impact = this.clampScore(
      42 +
        (profile.hasMetrics ? 24 : 0) +
        (profile.hasImpactVerbs ? 18 : 0) +
        (profile.weakVerbMatches.length > 0 ? -8 : 0),
    );
    const keywordOptimization = this.clampScore(
      44 +
        Math.min(34, profile.skills.length * 7) +
        (profile.hasRoleSignal ? 8 : 0),
    );
    const structure = this.clampScore(
      42 +
        (profile.hasSummary ? 12 : 0) +
        (profile.hasExperience ? 16 : 0) +
        (profile.hasSkillsSection ? 12 : 0) +
        (profile.hasEducation ? 8 : 0) +
        (profile.wordCount < 35 ? -10 : 0),
    );
    const experienceQuality = this.clampScore(
      46 +
        (profile.hasRoleSignal ? 10 : 0) +
        (profile.hasMetrics ? 14 : 0) +
        (profile.hasImpactVerbs ? 14 : 0) +
        Math.min(10, profile.skills.length * 2),
    );

    return {
      atsReadiness,
      readability,
      impact,
      keywordOptimization,
      structure,
      experienceQuality,
    };
  }

  private clampScore(value: number): number {
    return Math.max(25, Math.min(96, Math.round(value)));
  }

  private buildStrengths(
    profile: ReturnType<MockCvAnalysisProvider['profileText']>,
  ): string[] {
    const strengths: string[] = [];

    if (profile.skills.length > 0) {
      strengths.push(
        `Clear technical signal around ${profile.skills.slice(0, 3).join(', ')}`,
      );
    }

    if (profile.hasMetrics) {
      strengths.push(
        'Includes measurable outcomes that make impact easier to judge',
      );
    }

    if (profile.hasImpactVerbs) {
      strengths.push(
        'Uses delivery-oriented language instead of only listing duties',
      );
    }

    if (profile.hasRoleSignal) {
      strengths.push(
        'Role context is visible enough for an initial recruiter scan',
      );
    }

    return strengths.length > 0
      ? strengths.slice(0, 4)
      : ['CV text is present and can be reviewed for basic structure'];
  }

  private buildWeaknesses(
    profile: ReturnType<MockCvAnalysisProvider['profileText']>,
  ): string[] {
    const weaknesses: string[] = [];

    if (profile.wordCount < 35) {
      weaknesses.push(
        'The CV text is too thin to prove scope, seniority, or impact',
      );
    }

    if (!profile.hasMetrics) {
      weaknesses.push(
        'Achievements need measurable outcomes or clearer business value',
      );
    }

    if (!profile.hasSectionSignal) {
      weaknesses.push(
        'Core sections such as summary, experience, skills, or projects are not clearly signposted',
      );
    }

    if (profile.skills.length < 3) {
      weaknesses.push(
        'The skill signal is narrow, so recruiters may miss relevant capabilities',
      );
    }

    return weaknesses.length > 0
      ? weaknesses.slice(0, 4)
      : [
          'The CV would still benefit from tighter targeting for each application',
        ];
  }

  private buildCvSuggestions(
    profile: ReturnType<MockCvAnalysisProvider['profileText']>,
  ): string[] {
    const suggestions = [
      'Put a two-line recruiter summary at the top with the target role, strongest domain, and one proof point',
    ];

    if (!profile.hasMetrics) {
      suggestions.push(
        'Rewrite at least two bullets to include scale, latency, revenue, users, time saved, or quality improvement',
      );
    }

    if (profile.skills.length > 0) {
      suggestions.push(
        `Move ${profile.skills.slice(0, 3).join(', ')} into the top third of the CV and attach each one to recent delivery evidence`,
      );
    } else {
      suggestions.push(
        'Add a compact skills section grouped by tools, domains, and methods a recruiter would search for',
      );
    }

    suggestions.push(
      'Replace responsibility-heavy bullets with achievement statements using action, scope, and outcome',
    );
    suggestions.push(
      'Trim generic claims unless they are backed by a project, metric, team size, or business result',
    );

    return suggestions.slice(0, 5);
  }

  private buildActionableInsights(
    profile: ReturnType<MockCvAnalysisProvider['profileText']>,
  ): CvActionableInsights {
    return {
      missingQuantifiedAchievements:
        this.missingQuantifiedAchievements(profile),
      weakActionVerbs: this.weakActionVerbs(profile),
      missingSections: this.missingSections(profile),
      overlyGenericWording: this.overlyGenericWording(profile),
      formattingConcerns: this.formattingConcerns(profile),
      keywordGaps: this.keywordGaps(profile),
    };
  }

  private missingQuantifiedAchievements(
    profile: ReturnType<MockCvAnalysisProvider['profileText']>,
  ): string[] {
    if (profile.hasMetrics) {
      return [
        'Keep the quantified results close to the bullets where the work happened',
      ];
    }

    return [
      'Add metrics to at least two achievements, such as users served, percent improved, cost saved, or cycle time reduced',
    ];
  }

  private weakActionVerbs(
    profile: ReturnType<MockCvAnalysisProvider['profileText']>,
  ): string[] {
    if (profile.weakVerbMatches.length > 0) {
      return [
        `Replace weak phrases such as ${profile.weakVerbMatches.slice(0, 2).join(' and ')} with owned, built, led, improved, or delivered`,
      ];
    }

    if (profile.hasImpactVerbs) {
      return [
        'Action verbs are mostly delivery-oriented; keep leading bullets with verbs such as built, led, improved, or delivered',
      ];
    }

    return [
      'Start core experience bullets with stronger verbs such as built, led, improved, automated, owned, or delivered',
    ];
  }

  private missingSections(
    profile: ReturnType<MockCvAnalysisProvider['profileText']>,
  ): string[] {
    const missing: string[] = [];

    if (!profile.hasSummary) {
      missing.push('Add a short summary section for target role fit');
    }

    if (!profile.hasExperience) {
      missing.push('Add a clearly labeled experience section');
    }

    if (!profile.hasSkillsSection) {
      missing.push('Add a searchable skills section');
    }

    if (!profile.hasEducation) {
      missing.push('Add education or certifications if they are relevant');
    }

    return missing.length > 0
      ? missing.slice(0, 4)
      : [
          'Core sections are visible; tighten ordering around recent experience',
        ];
  }

  private overlyGenericWording(
    profile: ReturnType<MockCvAnalysisProvider['profileText']>,
  ): string[] {
    if (profile.genericMatches.length > 0) {
      return [
        `Replace generic claims such as ${profile.genericMatches.slice(0, 2).join(' and ')} with evidence from a project or result`,
      ];
    }

    return [
      'Generic wording is limited; keep each claim tied to a role, project, or outcome',
    ];
  }

  private formattingConcerns(
    profile: ReturnType<MockCvAnalysisProvider['profileText']>,
  ): string[] {
    const concerns: string[] = [];

    if (profile.hasLongLines) {
      concerns.push('Break dense paragraphs into shorter bullets for scanning');
    }

    if (!profile.hasSectionSignal) {
      concerns.push(
        'Use clear section headings so ATS and recruiters can parse the CV quickly',
      );
    }

    if (profile.wordCount < 35) {
      concerns.push(
        'The CV is too short to show scope; add role context and selected achievements',
      );
    }

    return concerns.length > 0
      ? concerns
      : [
          'Formatting signals are usable; keep headings plain and bullets concise',
        ];
  }

  private keywordGaps(
    profile: ReturnType<MockCvAnalysisProvider['profileText']>,
  ): string[] {
    if (profile.skills.length >= 4) {
      return [
        'Keyword coverage is broad; align the top skills to the exact target role before applying',
      ];
    }

    if (profile.skills.length > 0) {
      return [
        `Expand keyword coverage beyond ${profile.skills.join(', ')} with tools, domains, and methods from the target role`,
      ];
    }

    return [
      'Add role-specific keywords from the target role, including tools, frameworks, domains, and delivery methods',
    ];
  }

  private scoreMatch(input: {
    cvProfile: ReturnType<MockCvAnalysisProvider['profileText']>;
    jdProfile: ReturnType<MockCvAnalysisProvider['profileText']>;
    matchedSkills: string[];
    missingSkills: string[];
  }): number {
    const { cvProfile, jdProfile, matchedSkills, missingSkills } = input;

    if (jdProfile.skills.length === 0) {
      return cvProfile.wordCount > 80 ? 58 : 48;
    }

    const skillFit = matchedSkills.length / jdProfile.skills.length;
    let score = Math.round(35 + skillFit * 50);

    score += cvProfile.hasMetrics ? 5 : 0;
    score += cvProfile.hasImpactVerbs ? 4 : 0;
    score -= missingSkills.length >= 3 ? 8 : 0;

    return Math.max(20, Math.min(94, score));
  }

  private buildMatchSuggestions(
    matchedSkills: string[],
    missingSkills: string[],
  ): string[] {
    const suggestions: string[] = [];

    if (matchedSkills.length > 0) {
      suggestions.push(
        `Move evidence for ${matchedSkills.slice(0, 3).join(', ')} into the most recent and most relevant CV bullets`,
      );
    }

    if (missingSkills.length > 0) {
      suggestions.push(
        `Address ${missingSkills[0]} directly if you have adjacent experience, or leave it out rather than overstating it`,
      );
      suggestions.push(
        `Add a tailoring note in the summary that connects your background to the JD priority around ${missingSkills.slice(0, 2).join(' and ')}`,
      );
    } else {
      suggestions.push(
        'Use the summary to mirror the role focus while keeping the evidence grounded in the CV',
      );
      suggestions.push(
        'Prioritize the strongest shared skills in the top third of the CV',
      );
    }

    suggestions.push(
      'Add one outcome metric beside the most important matched requirement to make the fit more credible',
    );

    return suggestions.slice(0, 4);
  }

  private buildFallbackHighlights(extractedText: string): string[] {
    const profile = this.profileText(extractedText);

    if (profile.hasImpactVerbs) {
      return [
        'delivery-focused experience',
        'adaptability to role requirements',
      ];
    }

    return ['relevant CV experience', 'interest in the role requirements'];
  }

  private findKnownSkills(text: string): string[] {
    const normalizedText = text.toLowerCase();

    return knownSkills
      .filter((skill) =>
        skill.aliases.some((alias) => normalizedText.includes(alias)),
      )
      .map((skill) => skill.label);
  }
}

const knownSkills: SkillDefinition[] = [
  { label: 'TypeScript', aliases: ['typescript', 'ts '] },
  { label: 'JavaScript', aliases: ['javascript', 'js '] },
  { label: 'NestJS', aliases: ['nestjs', 'nest.js'] },
  { label: 'Next.js', aliases: ['next.js', 'nextjs'] },
  { label: 'React', aliases: ['react'] },
  { label: 'Node.js', aliases: ['node.js', 'nodejs', 'node '] },
  { label: 'PostgreSQL', aliases: ['postgresql', 'postgres'] },
  { label: 'Redis', aliases: ['redis'] },
  { label: 'BullMQ', aliases: ['bullmq'] },
  { label: 'Prisma', aliases: ['prisma'] },
  {
    label: 'API testing',
    aliases: ['api testing', 'supertest', 'integration test', 'contract test'],
  },
  { label: 'Testing', aliases: ['testing', 'jest', 'unit test'] },
  { label: 'Docker', aliases: ['docker', 'container'] },
  { label: 'AWS', aliases: ['aws', 'amazon web services'] },
  {
    label: 'CI/CD',
    aliases: ['ci/cd', 'continuous integration', 'github actions'],
  },
  {
    label: 'System design',
    aliases: ['system design', 'architecture', 'scalability'],
  },
  {
    label: 'Product collaboration',
    aliases: ['product manager', 'stakeholder', 'cross-functional'],
  },
];
