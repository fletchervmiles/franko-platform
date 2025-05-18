import { readFileSync } from 'fs';
import path from 'path';
import { generateText } from 'ai';
import { gemini25FlashPreviewModel } from '@/ai_folder';
import { logger } from '@/lib/logger';

export interface ExtractionResult {
  [key: string]: any; // fully typed later if needed
}

function getExtractionPromptTemplate(): string {
  try {
    return readFileSync(
      path.join(process.cwd(), 'agent_prompts', 'extraction_prompt.md'),
      'utf-8'
    );
  } catch (error) {
    logger.error('[extraction-processor] Failed to read extraction prompt template', error);
    throw new Error('Extraction prompt template missing');
  }
}

/**
 * Runs the high-signal extraction prompt and returns the parsed JSON object.
 */
export async function extractHighSignalData(params: {
  interviewType: string | null;
  pmfCategory: string | null; // very | somewhat | not | null
  cleanTranscript: string;
  conversationPlan: string;
}): Promise<ExtractionResult | null> {
  const { interviewType, pmfCategory, cleanTranscript, conversationPlan } = params;

  if (!cleanTranscript?.trim()) {
    logger.warn('[extraction-processor] Empty transcript – skipping extraction');
    return null;
  }

  const promptTemplate = getExtractionPromptTemplate();
  const systemPrompt = promptTemplate
    .replace('{interviewType}', interviewType || 'unknown')
    .replace('{pmfResponse}', pmfCategory || 'null')
    .replace('{cleaned_transcript}', cleanTranscript)
    .replace('{conversation_plan}', conversationPlan);

  const maxRetries = 2;
  let retry = 0;
  let lastError: any = null;

  while (retry < maxRetries) {
    try {
      logger.ai(`[extraction-processor] Attempt ${retry + 1} with gemini25FlashPreviewModel`);
      const { text } = await generateText({
        model: gemini25FlashPreviewModel,
        system: systemPrompt,
        prompt: '',
        providerOptions: {
          google: { thinkingConfig: { thinkingBudget: 2000 } },
        } as any,
        temperature: 0.3,
        maxTokens: 3500,
      });

      const cleaned = text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsed = JSON.parse(cleaned);
      logger.debug('[extraction-processor] Parsed extraction object keys:', Object.keys(parsed));
      return parsed as ExtractionResult;
    } catch (error) {
      lastError = error;
      logger.warn(`[extraction-processor] Attempt ${retry + 1} failed`, error);
      retry++;
      await new Promise((r) => setTimeout(r, 500 * retry));
    }
  }

  logger.error('[extraction-processor] All extraction attempts failed', { error: lastError });
  return null;
} 