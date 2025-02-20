// Import the experimental wrapper function that allows applying middleware to language models
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";

// Import our custom middleware implementation that can modify model behavior
import { customMiddleware } from "./custom-middleware";

// Create a function to initialize models with dynamic imports
async function createModels() {
  // Dynamically import the Google AI model provider
  const { google } = await import("@ai-sdk/google");


// gemini-2.0-flash
// gemini-2.0-pro-exp-02-05

  // Create a wrapped version of the Gemini Pro model with our custom middleware
  const geminiProModel = wrapLanguageModel({
    model: google("gemini-2.0-flash"),
    middleware: customMiddleware,
  });

  // Similarly wrap the Gemini Flash model with the same middleware
  const geminiFlashModel = wrapLanguageModel({
    model: google("gemini-2.0-flash"),
    middleware: customMiddleware,
  });

  return { geminiProModel, geminiFlashModel };
}

// Export the models
export const { geminiProModel, geminiFlashModel } = await createModels();
