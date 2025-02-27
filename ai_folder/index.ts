// Import the experimental wrapper function that allows applying middleware to language models
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";
import { LanguageModelV1 } from "ai";

// Import our custom middleware implementation that can modify model behavior
import { customMiddleware } from "./custom-middleware";

// Create a function to initialize models with dynamic imports
async function createModels() {
  // Dynamically import the Google AI model provider
  const { google } = await import("@ai-sdk/google");
  // Dynamically import the OpenAI model provider
  const { createOpenAI } = await import("@ai-sdk/openai");


// gemini-2.0-flash
// gemini-2.0-pro-exp-02-05

  // Create a wrapped version of the Gemini Pro model with our custom middleware
  const geminiProModel = wrapLanguageModel({
    model: google("gemini-2.0-pro-exp-02-05"),
    middleware: customMiddleware,
  });

  // Similarly wrap the Gemini Flash model with the same middleware
  const geminiFlashModel = wrapLanguageModel({
    model: google("gemini-2.0-flash"),
    middleware: customMiddleware,
  });

  // Create OpenAI client
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    compatibility: 'strict'
  });

  // Create a wrapped version of the OpenAI o3-mini model with our custom middleware
  const o3MiniModel = wrapLanguageModel({
    model: openai("o3-mini", {
      reasoningEffort: 'medium'  // Configure with low reasoning effort for faster responses
    }) as unknown as LanguageModelV1,
    middleware: customMiddleware,
  });

  // Create a wrapped version of the OpenAI o3-mini model with low reasoning effort
  const o3MiniLowModel = wrapLanguageModel({
    model: openai("o3-mini", {
      reasoningEffort: 'low'  // Configure with low reasoning effort for faster responses
    }) as unknown as LanguageModelV1,
    middleware: customMiddleware,
  });

  return { geminiProModel, geminiFlashModel, o3MiniModel, o3MiniLowModel };
}

// Export the models
export const { geminiProModel, geminiFlashModel, o3MiniModel, o3MiniLowModel } = await createModels();
