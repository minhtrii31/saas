import type { CoverLetterGenerationInput } from '../types/cv-analysis-provider';

export type JsonObject = Record<string, unknown>;

export type StructuredPrompt = {
  schemaName: string;
  jsonSchema: JsonObject;
  systemPrompt: string;
  userPrompt: string;
};

const baseSystemInstructions = [
  'You are Nyx, an AI career assistant reviewing CVs for job applications.',
  'Give structured, evidence-backed feedback that a candidate can act on.',
  'Do not invent experience, employers, credentials, skills, job facts, or personal details.',
  'If evidence is weak or absent, say what is missing instead of filling gaps.',
  'Avoid repetitive generic advice; each array item must be specific and non-overlapping.',
  'Return only JSON that matches the supplied schema.',
].join(' ');

export function buildCvAnalysisPrompt(extractedText: string): StructuredPrompt {
  return {
    schemaName: 'cv_analysis',
    jsonSchema: cvAnalysisSchema(),
    systemPrompt: [
      baseSystemInstructions,
      'Analyze overall CV quality for recruiter readability, clarity, credibility, impact, role focus, and scanability.',
      'Score realistically: 90+ only for polished CVs with clear scope, achievements, metrics, and strong targeting; 70-89 for solid CVs with fixable gaps; below 70 for thin, vague, or poorly organized CVs.',
      'Return categorized scores for ATS readiness, readability, impact, keyword optimization, structure, and experience quality; each score must reflect observable CV evidence.',
      'Return recruiter-style actionable insights for missing quantified achievements, weak action verbs, missing sections, overly generic wording, formatting concerns, and keyword gaps.',
      'Strengths must cite observable qualities from the CV.',
      'Weaknesses must name concrete missing evidence or presentation problems.',
      'Suggestions must be concrete edits a candidate can make, using a direct recruiter-style tone and avoiding generic AI wording.',
    ].join(' '),
    userPrompt: [`CV text:`, extractedText.trim()].join('\n'),
  };
}

export function buildJdMatchPrompt(
  extractedText: string,
  jobDescriptionText: string,
): StructuredPrompt {
  return {
    schemaName: 'job_description_match',
    jsonSchema: jdMatchSchema(),
    systemPrompt: [
      baseSystemInstructions,
      'Compare the CV against the job description and separate confirmed matches from missing or weakly evidenced requirements.',
      'matchingScore must reflect role fit, not keyword count alone: reward recent, specific, relevant evidence and penalize critical missing requirements.',
      'matchedSkills must include only skills or requirements supported by both texts.',
      'missingSkills must include important JD requirements not clearly supported by the CV.',
      'Suggestions must be useful for tailoring the CV to this JD, naming the relevant requirement when possible.',
    ].join(' '),
    userPrompt: [
      `CV text:\n${extractedText.trim()}`,
      `Job description:\n${jobDescriptionText.trim()}`,
    ].join('\n\n'),
  };
}

export function buildCoverLetterPrompt(
  extractedText: string,
  input: CoverLetterGenerationInput,
): StructuredPrompt {
  return {
    schemaName: 'cover_letter',
    jsonSchema: coverLetterSchema(),
    systemPrompt: [
      baseSystemInstructions,
      'Write a specific, editable cover letter that connects the candidate evidence to the target role.',
      'Keep it concise: 3 to 5 short paragraphs, no bullet list, no fabricated names, no unsupported achievements.',
      'Avoid generic enthusiasm, repeated phrases, and restating the full CV.',
      'Use the requested tone while staying professional.',
      'highlights must summarize the strongest evidence used in the letter.',
    ].join(' '),
    userPrompt: [
      `CV text:\n${extractedText.trim()}`,
      `Job description:\n${input.jobDescriptionText.trim()}`,
      `Company name: ${input.companyName?.trim() || 'Not provided'}`,
      `Role title: ${input.roleTitle?.trim() || 'Not provided'}`,
      `Requested tone: ${input.tone?.trim() || 'professional'}`,
    ].join('\n\n'),
  };
}

function cvAnalysisSchema(): JsonObject {
  return {
    type: 'object',
    additionalProperties: false,
    required: [
      'score',
      'scoringCategories',
      'strengths',
      'weaknesses',
      'actionableInsights',
      'suggestions',
    ],
    properties: {
      score: scoreSchema(),
      scoringCategories: scoringCategoriesSchema(),
      strengths: stringArraySchema(2, 5),
      weaknesses: stringArraySchema(2, 5),
      actionableInsights: actionableInsightsSchema(),
      suggestions: stringArraySchema(4, 7),
    },
  };
}

function jdMatchSchema(): JsonObject {
  return {
    type: 'object',
    additionalProperties: false,
    required: [
      'matchingScore',
      'matchedSkills',
      'missingSkills',
      'suggestions',
    ],
    properties: {
      matchingScore: scoreSchema(),
      matchedSkills: stringArraySchema(1, 8),
      missingSkills: stringArraySchema(1, 8),
      suggestions: stringArraySchema(3, 6),
    },
  };
}

function coverLetterSchema(): JsonObject {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['coverLetter', 'tone', 'highlights'],
    properties: {
      coverLetter: { type: 'string', minLength: 1 },
      tone: { type: 'string', minLength: 1 },
      highlights: stringArraySchema(2, 5),
    },
  };
}

function scoreSchema(): JsonObject {
  return { type: 'number', minimum: 0, maximum: 100 };
}

function scoringCategoriesSchema(): JsonObject {
  return {
    type: 'object',
    additionalProperties: false,
    required: [
      'atsReadiness',
      'readability',
      'impact',
      'keywordOptimization',
      'structure',
      'experienceQuality',
    ],
    properties: {
      atsReadiness: scoreSchema(),
      readability: scoreSchema(),
      impact: scoreSchema(),
      keywordOptimization: scoreSchema(),
      structure: scoreSchema(),
      experienceQuality: scoreSchema(),
    },
  };
}

function actionableInsightsSchema(): JsonObject {
  return {
    type: 'object',
    additionalProperties: false,
    required: [
      'missingQuantifiedAchievements',
      'weakActionVerbs',
      'missingSections',
      'overlyGenericWording',
      'formattingConcerns',
      'keywordGaps',
    ],
    properties: {
      missingQuantifiedAchievements: stringArraySchema(1, 4),
      weakActionVerbs: stringArraySchema(1, 4),
      missingSections: stringArraySchema(1, 4),
      overlyGenericWording: stringArraySchema(1, 4),
      formattingConcerns: stringArraySchema(1, 4),
      keywordGaps: stringArraySchema(1, 4),
    },
  };
}

function stringArraySchema(minItems: number, maxItems: number): JsonObject {
  return {
    type: 'array',
    minItems,
    maxItems,
    items: { type: 'string', minLength: 1 },
  };
}
