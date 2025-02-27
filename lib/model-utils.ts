import { z } from "zod";
import { LanguageModelV1 } from "ai";

/**
 * Determines if a model is from OpenAI based on its name or instance
 */
export function isOpenAIModel(model: LanguageModelV1 | string): boolean {
  const modelName = typeof model === 'string' ? model : (model as any).name || '';
  return modelName.includes('openai') || 
         modelName.includes('o3') || 
         modelName.includes('gpt');
}

/**
 * Creates a parameter schema for optional dummy parameters
 * This is particularly useful for tools that don't need parameters but OpenAI requires them
 */
export function createDummyParameterSchema(model: LanguageModelV1 | string): z.ZodObject<{
  _dummy: z.ZodString;
}> | z.ZodObject<{
  _dummy: z.ZodOptional<z.ZodString>;
}> {
  if (isOpenAIModel(model)) {
    // For OpenAI, we need to make the dummy parameter required in the schema
    return z.object({
      _dummy: z.string().describe("Placeholder parameter")
    });
  } else {
    // For other models like Gemini, we can make it optional
    return z.object({
      _dummy: z.string().optional().describe("Placeholder parameter")
    });
  }
}

/**
 * Helper type for makeFieldsRequired function
 */
type ZodSchemaShape = Record<string, z.ZodTypeAny>;

/**
 * Ensures that a schema is compatible with OpenAI by making specified fields required
 */
export function makeFieldsRequired(
  schema: z.ZodObject<ZodSchemaShape>,
  requiredFields: string[]
): z.ZodObject<ZodSchemaShape> {
  // Create a new schema with the same shape
  const newShape = { ...schema.shape };
  
  // Process each field that should be required
  for (const field of requiredFields) {
    if (field in newShape) {
      const value = newShape[field];
      // If it's a ZodOptional, unwrap it
      if (value instanceof z.ZodOptional) {
        newShape[field] = value.unwrap();
      }
    }
  }
  
  // Create a new schema with the updated shape
  return z.object(newShape);
}

/**
 * Creates a schema that's compatible with both OpenAI and Gemini models
 */
export function createCompatibleSchema<T extends ZodSchemaShape>(
  model: LanguageModelV1 | string,
  schema: z.ZodObject<T>,
  requiredFields: string[] = []
): z.ZodObject<ZodSchemaShape> {
  if (isOpenAIModel(model) && requiredFields.length > 0) {
    return makeFieldsRequired(schema, requiredFields);
  }
  return schema as z.ZodObject<ZodSchemaShape>;
} 