// Import the experimental wrapper function that allows applying middleware to language models
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";
import { LanguageModelV1 } from "ai";

// Add type declaration for @ai-sdk/openai
declare module '@ai-sdk/openai';

// Import our custom middleware implementation that can modify model behavior
import { customMiddleware } from "./custom-middleware";

// Initialize models as undefined
export let geminiProModel: LanguageModelV1;
export let geminiFlashModel: LanguageModelV1;
export let o3MiniModel: LanguageModelV1;
export let o3MiniLowModel: LanguageModelV1;
export let o1Model: LanguageModelV1;
export let o1HighModel: LanguageModelV1;
export let o1MiniModel: LanguageModelV1;
export let gemini25ProPreviewModel: LanguageModelV1;
export let gemini25ProExperimentalModel: LanguageModelV1;
export let o3Model: LanguageModelV1;
export let gemini25FlashPreviewModel: LanguageModelV1;

// Create a function to initialize models with dynamic imports
export async function initializeModels() {
  if (geminiProModel) return; // Already initialized

  // Dynamically import the Google AI model provider
  const { google } = await import("@ai-sdk/google");
  // Dynamically import the OpenAI model provider
  const { createOpenAI } = await import("@ai-sdk/openai");

  // Create a wrapped version of the Gemini Pro model with our custom middleware
  geminiProModel = wrapLanguageModel({
    model: google("gemini-2.0-pro-exp-02-05"),
    middleware: customMiddleware,
  });

  // Similarly wrap the Gemini Flash model with the same middleware
  geminiFlashModel = wrapLanguageModel({
    model: google("gemini-2.0-flash"),
    middleware: customMiddleware,
  });

  // Add the new Gemini 2.5 Pro Preview model
  gemini25ProPreviewModel = wrapLanguageModel({
    model: google("gemini-2.5-pro-preview-03-25"),
    middleware: customMiddleware,
  });

  // Add the new Gemini 2.5 Pro Experimental model
  gemini25ProExperimentalModel = wrapLanguageModel({
    model: google("gemini-2.5-pro-exp-03-25"),
    middleware: customMiddleware,
  });

  // Add the new Gemini 2.5 Flash Preview model
  gemini25FlashPreviewModel = wrapLanguageModel({
    model: google("gemini-2.5-flash-preview-04-17"),
    middleware: customMiddleware,
  });

  // Create OpenAI client
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    compatibility: 'strict'
  });

  // Create a wrapped version of the OpenAI o3-mini model with our custom middleware
  o3MiniModel = wrapLanguageModel({
    model: openai("o3-mini", {
      reasoningEffort: 'medium'  // Configure with medium reasoning effort for balanced responses
    }) as unknown as LanguageModelV1,
    middleware: customMiddleware,
  });

  // Create a wrapped version of the OpenAI o3-mini model with low reasoning effort
  o3MiniLowModel = wrapLanguageModel({
    model: openai("o3-mini", {
      reasoningEffort: 'low'  // Configure with low reasoning effort for faster responses
    }) as unknown as LanguageModelV1,
    middleware: customMiddleware,
  });

  // Create a wrapped version of the OpenAI o1 model with medium reasoning effort
  o1Model = wrapLanguageModel({
    model: openai("o1", {
      reasoningEffort: 'medium'  // Configure with medium reasoning effort for balanced performance
    }) as unknown as LanguageModelV1,
    middleware: customMiddleware,
  });

  // Create a wrapped version of the OpenAI o1 model with high reasoning effort
  o1HighModel = wrapLanguageModel({
    model: openai("o1", {
      reasoningEffort: 'high'  // Configure with high reasoning effort for complex tasks
    }) as unknown as LanguageModelV1,
    middleware: customMiddleware,
  });

  // Create a wrapped version of the OpenAI o1-mini model
  o1MiniModel = wrapLanguageModel({
    model: openai("o1-mini") as unknown as LanguageModelV1,
    middleware: customMiddleware,
  });

  // Create a wrapped version of the OpenAI o3 model with medium reasoning effort
  o3Model = wrapLanguageModel({
    model: openai("o3", {
      reasoningEffort: 'medium'  // Configure with medium reasoning effort
    }) as unknown as LanguageModelV1,
    middleware: customMiddleware,
  });
}

// Initialize models immediately
initializeModels().catch(console.error);
