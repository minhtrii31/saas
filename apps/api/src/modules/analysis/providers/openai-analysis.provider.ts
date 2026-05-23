import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { EnvironmentService } from '../../../config/environment.service';
import type {
  CoverLetterGenerationInput,
  CoverLetterResult,
  CvAnalysisProvider,
  CvAnalysisResult,
  ApplicationFollowUpInput,
  ApplicationFollowUpResult,
  InterviewPrepInput,
  InterviewPrepResult,
  JdMatchResult,
  RewriteRefinementInput,
  RewriteRefinementResult,
  ResumeRewriteInput,
  ResumeRewriteResult,
} from '../types/cv-analysis-provider';
import {
  buildCoverLetterPrompt,
  buildCvAnalysisPrompt,
  buildInterviewPrepPrompt,
  buildJdMatchPrompt,
  buildRewriteRefinementPrompt,
  buildResumeRewritePrompt,
  type JsonObject,
  type StructuredPrompt,
} from '../prompts/analysis-prompt.builder';
import {
  parseJsonObject,
  validateCoverLetterResult,
  validateCvAnalysisResult,
  validateInterviewPrepResult,
  validateJdMatchResult,
  validateRewriteRefinementResult,
  validateResumeRewriteResult,
} from '../utils/structured-output.validator';

type OpenAiChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

@Injectable()
export class OpenAiAnalysisProvider implements CvAnalysisProvider {
  readonly providerName = 'openai';

  constructor(private readonly environmentService: EnvironmentService) {}

  get modelName(): string {
    return this.environmentService.openAiModel;
  }

  get jdMatcherModelName(): string {
    return this.environmentService.openAiModel;
  }

  get coverLetterModelName(): string {
    return this.environmentService.openAiModel;
  }

  get resumeRewriteModelName(): string {
    return this.environmentService.openAiModel;
  }

  get interviewPrepModelName(): string {
    return this.environmentService.openAiModel;
  }

  get applicationFollowUpModelName(): string {
    return this.environmentService.openAiModel;
  }

  async analyzeCv(extractedText: string): Promise<CvAnalysisResult> {
    const content = await this.requestStructuredJson(
      buildCvAnalysisPrompt(extractedText),
    );

    return validateCvAnalysisResult(content);
  }

  async matchJobDescription(
    extractedText: string,
    jobDescriptionText: string,
  ): Promise<JdMatchResult> {
    const content = await this.requestStructuredJson(
      buildJdMatchPrompt(extractedText, jobDescriptionText),
    );

    return validateJdMatchResult(content);
  }

  async generateCoverLetter(
    extractedText: string,
    input: CoverLetterGenerationInput,
  ): Promise<CoverLetterResult> {
    const content = await this.requestStructuredJson(
      buildCoverLetterPrompt(extractedText, input),
    );

    return validateCoverLetterResult(content);
  }

  async rewriteResume(
    extractedText: string,
    input: ResumeRewriteInput,
  ): Promise<ResumeRewriteResult> {
    const content = await this.requestStructuredJson(
      buildResumeRewritePrompt(extractedText, input),
    );

    return validateResumeRewriteResult(content);
  }

  async refineRewrite(
    extractedText: string,
    input: RewriteRefinementInput,
  ): Promise<RewriteRefinementResult> {
    const content = await this.requestStructuredJson(
      buildRewriteRefinementPrompt(extractedText, input),
    );

    return validateRewriteRefinementResult(content);
  }

  async generateInterviewPrep(
    extractedText: string,
    input: InterviewPrepInput,
  ): Promise<InterviewPrepResult> {
    const content = await this.requestStructuredJson(
      buildInterviewPrepPrompt(extractedText, input),
    );

    return validateInterviewPrepResult(content);
  }

  async generateApplicationFollowUp(
    extractedText: string,
    input: ApplicationFollowUpInput,
  ): Promise<ApplicationFollowUpResult> {
    const content = await this.requestStructuredJson({
      schemaName: 'application_follow_up',
      systemPrompt:
        'You write concise, professional job application follow-up emails grounded only in the provided CV and application context.',
      userPrompt: [
        `CV text:\n${extractedText}`,
        `Company: ${input.companyName}`,
        `Role: ${input.roleTitle}`,
        `Current status: ${input.status}`,
        input.appliedAt ? `Applied at: ${input.appliedAt}` : null,
        input.notes ? `User notes: ${input.notes}` : null,
        'Return a concise professional follow-up email draft. Do not invent interview details, names, or dates.',
      ]
        .filter(Boolean)
        .join('\n\n'),
      jsonSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['draft', 'tone'],
        properties: {
          draft: { type: 'string' },
          tone: { type: 'string' },
        },
      },
    });

    return {
      draft: typeof content.draft === 'string' ? content.draft : '',
      tone: typeof content.tone === 'string' ? content.tone : 'professional',
    };
  }

  private async requestStructuredJson(
    prompt: StructuredPrompt,
  ): Promise<JsonObject> {
    try {
      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.environmentService.openAiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.environmentService.openAiModel,
            messages: [
              {
                role: 'system',
                content: prompt.systemPrompt,
              },
              {
                role: 'user',
                content: prompt.userPrompt,
              },
            ],
            response_format: {
              type: 'json_schema',
              json_schema: {
                name: prompt.schemaName,
                strict: true,
                schema: prompt.jsonSchema,
              },
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`OpenAI request failed with status ${response.status}`);
      }

      const body = (await response.json()) as OpenAiChatCompletionResponse;
      const content = body.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('OpenAI response did not include content');
      }

      return parseJsonObject(content);
    } catch {
      throw new ServiceUnavailableException({
        error: {
          code: 'AI_PROVIDER_ERROR',
          message: 'AI provider failed to return valid structured output',
        },
        meta: {},
      });
    }
  }
}
