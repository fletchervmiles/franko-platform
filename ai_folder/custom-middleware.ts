// Import the experimental middleware type from the Vercel AI SDK
// This type defines the structure for intercepting and modifying AI model interactions
import { 
  Experimental_LanguageModelV1Middleware, 
  LanguageModelV1,
  LanguageModelV1CallOptions,
  LanguageModelV1StreamPart
} from "ai";
import { logger } from "@/lib/logger";
import { createOpenAI } from '@ai-sdk/openai';

// Configuration for retry mechanism
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  useFallback: true
};

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize OpenAI provider with strict compatibility mode
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  compatibility: 'strict'
});

// Create o3-mini model instance
const o3mini = openai('o3-mini', {
  reasoningEffort: 'low' // Use low effort since this is a fallback
});

// Helper function to implement retry logic
async function withRetry<T>(
  operation: () => Promise<T>,
  params: LanguageModelV1CallOptions,
  currentModel: LanguageModelV1
): Promise<T> {
  let lastError: Error | null = null;

  // Try with original model first
  for (let attempt = 1; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      logger.ai(`Attempt ${attempt}`);
      const result = await operation();
      return result;
    } catch (error) {
      lastError = error as Error;
      logger.error(`Attempt ${attempt} failed:`, error);
      
      // If this wasn't the last attempt, wait before retrying
      if (attempt < RETRY_CONFIG.maxRetries) {
        await delay(RETRY_CONFIG.retryDelay);
        continue;
      }

      // If all retries failed and fallback is enabled, try OpenAI
      if (RETRY_CONFIG.useFallback) {
        logger.ai(`Attempting fallback to OpenAI o3-mini`);
        
        try {
          // Use o3-mini model with the same params
          // For streaming operations, we'll get a stream in the operation result
          const result = await o3mini.doGenerate(params);
          return result as T;
        } catch (fallbackError) {
          logger.error('OpenAI fallback attempt failed:', fallbackError);
          // If fallback fails, throw the original error
          throw lastError;
        }
      }
      
      // If no fallback or fallback failed, throw the last error
      throw lastError;
    }
  }

  // This should never be reached due to the loop above
  throw new Error('Unexpected end of retry loop');
}

// Currently, this is an empty middleware implementation
// It's not doing anything yet, but it's ready to be configured with middleware functions
// Potential uses could include:
// - Logging requests and responses
// - Modifying prompts before they reach the AI model
// - Transforming AI responses before they reach the application
// - Adding caching or rate limiting
// - Implementing security checks or content filtering
export const customMiddleware: Experimental_LanguageModelV1Middleware = {
  wrapGenerate: async ({ doGenerate, params, model }) => {
    return await withRetry(
      () => Promise.resolve(doGenerate()),
      params,
      model
    );
  },

  wrapStream: async ({ doStream, params, model }) => {
    const { stream, ...rest } = await withRetry(
      async () => doStream(),
      params,
      model
    );

    // Create a transform stream to handle the retry logic for streaming
    const transformStream = new TransformStream<
      LanguageModelV1StreamPart,
      LanguageModelV1StreamPart
    >({
      transform(chunk, controller) {
        // Pass through all chunks
        controller.enqueue(chunk);
      }
    });

    return {
      stream: stream.pipeThrough(transformStream),
      ...rest
    };
  }
};
