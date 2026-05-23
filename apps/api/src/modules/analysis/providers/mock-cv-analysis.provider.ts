import { Injectable } from '@nestjs/common';
import type {
  CvActionableInsights,
  CoverLetterGenerationInput,
  CoverLetterResult,
  CvAnalysisProvider,
  CvAnalysisResult,
  CvScoringCategories,
  InterviewPrepInput,
  InterviewPrepResult,
  InterviewPrepQuestion,
  JdMatchResult,
  RewriteRefinementInput,
  RewriteRefinementResult,
  ResumeRewriteInput,
  ResumeRewriteResult,
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
  readonly resumeRewriteModelName = 'mock-resume-rewrite-v1';
  readonly interviewPrepModelName = 'mock-interview-prep-v1';
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

  rewriteResume(
    extractedText: string,
    input: ResumeRewriteInput,
  ): Promise<ResumeRewriteResult> {
    const originalText = input.originalText.trim();
    const cvSkills = this.findKnownSkills(`${extractedText} ${originalText}`);
    const primarySkill = cvSkills[0] ?? 'core work';
    const impactObject = this.pickImpactObject(originalText, primarySkill);
    const rewrittenText = this.buildRewriteText({
      originalText,
      rewriteGoal: input.rewriteGoal,
      primarySkill,
      impactObject,
    });

    return Promise.resolve({
      originalText,
      rewrittenText,
      explanation: this.buildRewriteExplanation(input.rewriteGoal),
      rewriteGoal: input.rewriteGoal,
    });
  }

  refineRewrite(
    extractedText: string,
    input: RewriteRefinementInput,
  ): Promise<RewriteRefinementResult> {
    const primarySkill =
      this.findKnownSkills(
        `${extractedText} ${input.original} ${input.currentRewrite}`,
      )[0] ?? 'core work';
    const improved = this.buildRefinedRewrite(input, primarySkill);

    return Promise.resolve({
      improved,
      reason: this.buildRefinementReason(input.instruction),
    });
  }

  generateInterviewPrep(
    extractedText: string,
    input: InterviewPrepInput,
  ): Promise<InterviewPrepResult> {
    const combinedTargetText = input.jobDescriptionText ?? '';
    const cvSkills = this.findKnownSkills(extractedText);
    const targetSkills = this.findKnownSkills(combinedTargetText);
    const sharedSkills = targetSkills.filter((skill) =>
      cvSkills.includes(skill),
    );
    const missingSkills = targetSkills.filter(
      (skill) => !cvSkills.includes(skill),
    );
    const anchorSkill = sharedSkills[0] ?? cvSkills[0] ?? 'your core work';
    const targetSkill = targetSkills[0] ?? anchorSkill;

    return Promise.resolve({
      focus: input.interviewFocus,
      questions: this.buildInterviewQuestions({
        focus: input.interviewFocus,
        anchorSkill,
        targetSkill,
        missingSkills,
      }),
      weakPointFocusAreas: this.buildInterviewWeakPoints({
        missingSkills,
        cvProfile: this.profileText(extractedText),
      }),
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

  private buildRewriteText(input: {
    originalText: string;
    rewriteGoal: ResumeRewriteInput['rewriteGoal'];
    primarySkill: string;
    impactObject: string;
  }): string {
    const { originalText, rewriteGoal, primarySkill, impactObject } = input;
    const cleanedText = originalText
      .replace(/\s+/g, ' ')
      .replace(/^[-*]\s*/, '');

    if (rewriteGoal === 'concise') {
      return `Delivered ${impactObject} using ${primarySkill}, keeping the focus on scope, action, and outcome.`;
    }

    if (rewriteGoal === 'ats-optimization') {
      return `Delivered ${primarySkill}-focused ${impactObject} with clear resume keywords, role-relevant ownership, and recruiter-readable impact.`;
    }

    if (rewriteGoal === 'quantified-achievements') {
      return `Improved ${impactObject} using ${primarySkill}; add the exact metric for scale, time saved, revenue, quality, or performance gain.`;
    }

    if (rewriteGoal === 'leadership-tone') {
      return `Led ${impactObject} across stakeholders using ${primarySkill}, clarifying priorities and driving delivery toward measurable outcomes.`;
    }

    if (
      /responsible for|helped|worked on|assisted|participated in|involved in/i.test(
        cleanedText,
      )
    ) {
      return `Owned ${impactObject} using ${primarySkill}, turning responsibility-focused work into a clearer achievement with visible impact.`;
    }

    return `Delivered ${impactObject} with ${primarySkill}, making the action, scope, and outcome easier for recruiters to evaluate.`;
  }

  private buildRewriteExplanation(
    rewriteGoal: ResumeRewriteInput['rewriteGoal'],
  ): string {
    const explanations: Record<ResumeRewriteInput['rewriteGoal'], string> = {
      'stronger-impact':
        'Replaces weak duty wording with a stronger action verb and an outcome-focused achievement frame.',
      'ats-optimization':
        'Adds recruiter-searchable wording while keeping the rewrite grounded in the supplied resume text.',
      concise:
        'Compresses the bullet into a shorter action-scope-outcome structure.',
      'quantified-achievements':
        'Creates a measurable achievement frame and prompts for a real metric instead of inventing one.',
      'leadership-tone':
        'Raises the wording toward ownership, stakeholder alignment, and delivery leadership.',
    };

    return explanations[rewriteGoal];
  }

  private buildRefinedRewrite(
    input: RewriteRefinementInput,
    primarySkill: string,
  ): string {
    const currentRewrite = input.currentRewrite
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[.。]\s*$/, '');
    const impactObject = this.pickImpactObject(input.original, primarySkill);

    if (input.instruction === 'shorter') {
      return `Delivered ${impactObject} with ${primarySkill} and clearer outcome focus.`;
    }

    if (input.instruction === 'more-technical') {
      return `${currentRewrite}, emphasizing ${primarySkill}, implementation ownership, and maintainable technical delivery.`;
    }

    if (input.instruction === 'more-leadership') {
      return `Led ${impactObject} across priorities and stakeholders, using ${primarySkill} to drive clearer delivery outcomes.`;
    }

    if (input.instruction === 'more-ats-friendly') {
      return `${currentRewrite}, with searchable ${primarySkill} keywords, ownership language, and recruiter-readable impact.`;
    }

    if (input.instruction === 'more-results-focused') {
      return `${currentRewrite}; connect this bullet to a real result such as time saved, quality improved, users supported, or revenue protected.`;
    }

    return `Owned and delivered ${impactObject} with ${primarySkill}, making scope, action, and impact stronger for recruiter review.`;
  }

  private buildRefinementReason(
    instruction: RewriteRefinementInput['instruction'],
  ): string {
    const reasons: Record<RewriteRefinementInput['instruction'], string> = {
      stronger:
        'Strengthens the verb and makes the achievement easier for a recruiter to evaluate.',
      shorter:
        'Compresses the rewrite while preserving the action, scope, and outcome structure.',
      'more-technical':
        'Adds technical depth without inventing unsupported tools or metrics.',
      'more-leadership':
        'Shifts the wording toward ownership, coordination, and delivery leadership.',
      'more-ats-friendly':
        'Adds searchable resume language while keeping the claim grounded.',
      'more-results-focused':
        'Pushes the bullet toward measurable outcomes without fabricating numbers.',
    };

    return reasons[instruction];
  }

  private buildInterviewQuestions(input: {
    focus: InterviewPrepInput['interviewFocus'];
    anchorSkill: string;
    targetSkill: string;
    missingSkills: string[];
  }): InterviewPrepQuestion[] {
    const behavioral: InterviewPrepQuestion[] = [
      {
        question: `Tell me about a time you improved a system or workflow using ${input.anchorSkill}.`,
        whyItMatters:
          'Interviewers use this to test ownership, judgment, and evidence of impact.',
        suggestedAnswerDirection:
          'Choose one recent example, name the problem, explain your specific actions, and close with the measurable result or learning.',
        starGuidance: {
          situation: 'Briefly describe the team, system, or business context.',
          task: 'Name the goal you were accountable for.',
          action: `Explain the decisions and hands-on work you contributed around ${input.anchorSkill}.`,
          result:
            'Share the outcome, metric, quality improvement, or stakeholder effect.',
        },
      },
      {
        question:
          'Describe a time you handled unclear requirements or competing priorities.',
        whyItMatters:
          'This reveals how you communicate, clarify tradeoffs, and protect delivery quality.',
        suggestedAnswerDirection:
          'Use a project story where you aligned stakeholders, reduced ambiguity, and kept progress visible.',
        starGuidance: {
          situation: 'Set up the ambiguity or conflict.',
          task: 'Clarify what decision or delivery outcome was needed.',
          action:
            'Describe how you gathered context, proposed options, and communicated tradeoffs.',
          result:
            'End with the decision, delivery result, or relationship outcome.',
        },
      },
    ];
    const technical: InterviewPrepQuestion[] = [
      {
        question: `How would you explain your strongest ${input.anchorSkill} project to another engineer?`,
        whyItMatters:
          'This tests whether the CV skill is backed by real implementation depth.',
        suggestedAnswerDirection:
          'Walk through architecture, constraints, key decisions, testing approach, and what you would improve next.',
      },
      {
        question: `What tradeoffs would you consider when using ${input.targetSkill} in this role?`,
        whyItMatters:
          'Role interviews often probe practical decision-making beyond keyword familiarity.',
        suggestedAnswerDirection:
          'Compare reliability, maintainability, team familiarity, cost, performance, and operational risk.',
      },
    ];
    const gapQuestion: InterviewPrepQuestion = {
      question:
        input.missingSkills.length > 0
          ? `The role mentions ${input.missingSkills[0]}. How would you address that gap honestly?`
          : 'What part of your background should the interviewer probe most deeply?',
      whyItMatters:
        'Strong candidates can discuss limits without overstating experience.',
      suggestedAnswerDirection:
        input.missingSkills.length > 0
          ? `Connect adjacent experience to ${input.missingSkills[0]}, then state what you would learn or validate first.`
          : 'Name one area where you want sharper evidence and explain the preparation you have done.',
      starGuidance: {
        situation: 'Name the adjacent experience or current gap.',
        task: 'Explain the role requirement or interview concern.',
        action:
          'Describe preparation, learning, or related work without claiming unsupported experience.',
        result: 'Show how you would reduce risk quickly if hired.',
      },
    };

    if (input.focus === 'behavioral') {
      return [...behavioral, gapQuestion];
    }

    if (input.focus === 'technical') {
      return [...technical, gapQuestion];
    }

    return [behavioral[0], technical[0], technical[1], gapQuestion];
  }

  private buildInterviewWeakPoints(input: {
    missingSkills: string[];
    cvProfile: ReturnType<MockCvAnalysisProvider['profileText']>;
  }): string[] {
    const weakPoints: string[] = [];

    if (input.missingSkills.length > 0) {
      weakPoints.push(
        `Prepare honest bridge answers for ${input.missingSkills.slice(0, 3).join(', ')}`,
      );
    }

    if (!input.cvProfile.hasMetrics) {
      weakPoints.push(
        'Practice adding measurable outcomes to project stories instead of describing only responsibilities',
      );
    }

    if (input.cvProfile.weakVerbMatches.length > 0) {
      weakPoints.push(
        'Convert responsibility-heavy CV language into ownership stories with clear actions',
      );
    }

    weakPoints.push(
      'Prepare one concise opening summary that connects your CV evidence to the target role',
    );

    return weakPoints.slice(0, 4);
  }

  private pickImpactObject(originalText: string, primarySkill: string): string {
    const normalizedText = originalText.toLowerCase();

    if (normalizedText.includes('api')) {
      return 'API delivery';
    }

    if (
      normalizedText.includes('database') ||
      normalizedText.includes('query')
    ) {
      return 'database performance';
    }

    if (
      normalizedText.includes('team') ||
      normalizedText.includes('stakeholder')
    ) {
      return 'cross-functional delivery';
    }

    if (primarySkill !== 'core work') {
      return `${primarySkill} delivery`;
    }

    return 'resume achievement';
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
