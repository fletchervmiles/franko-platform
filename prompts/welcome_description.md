# Developer Instructions: Implementing Non-Blocking Welcome Description Generation

## Overview

We need to implement a new feature that generates a welcome description for conversations. This description will be saved to the database for later use in the UI.

## Requirements

1. Create a non-blocking function that generates a welcome description using GeminiFlash
2. Extract title, duration, and summary from the conversation plan as input variables
3. Save the result to the `welcomeDescription` field in the chat instance
4. Ensure this process doesn't impact the existing conversation plan generation flow

## Implementation Details

### 1. Create a New Function

Create a new async function called `generateWelcomeDescription` that:
- Takes minimal inputs (chatId, title, duration, summary)
- Works independently from the main flow
- Uses GeminiFlash model via Vercel's AI SDK
- Saves results to the welcome_description field

### 2. Function Structure

The function should:
1. Load the welcome_description.md prompt template
2. Replace template variables with the title, duration, and summary
3. Make a request to GeminiFlash using Vercel's AI SDK `generateText` function
4. Save the result to the database
5. Include error handling that doesn't affect the main flow

### 3. Using Vercel's AI SDK

**Important**: Use the `generateText` function from Vercel's AI SDK rather than `generateObject` with a schema. Since we only need a simple text output to save to a database field (not structured data), this approach is simpler and more efficient:

```typescript
// Example using generateText from Vercel's AI SDK
const welcomeDescription = await generateText({
  model: geminiFlashModel,
  system: promptTemplate,
  prompt: "",
  temperature: 0.7, // Optional: adjust as needed
});

// The result is a simple string that can be saved directly to the database
```

This is preferable to using `generateObject` with a schema since:
- We don't need structured data validation
- The output is just text that will be stored in a database field
- It's more efficient for simple text generation tasks

### 4. Database Integration

Create a simple database query function to update only the welcome_description field in the chat instance.

### 5. Non-Blocking Implementation

Make the function non-blocking by:
- Using a fire-and-forget pattern
- Handling errors internally without throwing them to the caller
- Logging errors but not disrupting the main flow

### 6. Integration with Existing Flow

Add a call to this function after the conversation plan is generated, but don't await its result in the main flow:

```typescript
// Non-blocking welcome description generation
Promise.resolve().then(() => {
  generateWelcomeDescription({
    chatId,
    title: plan.title,
    duration: plan.duration,
    summary: plan.summary
  }).catch(error => {
    logger.error('Failed to generate welcome description:', error);
  });
});
```

### 7. Code Structure

```
1. Import necessary dependencies (including generateText from Vercel's AI SDK)
2. Create a database helper function for updating welcome_description
3. Implement the generateWelcomeDescription function
4. Add a non-blocking call to this function after generateConversationPlanFromForm
```

### 8. Error Handling Strategy

- Log errors but don't propagate them to the caller
- Implement retries for transient failures
- Ensure database operations are properly handled

### 9. Testing Approach

- Test the function in isolation
- Verify database updates work correctly
- Confirm the main flow continues even if this function encounters errors

## Relevant Files

1. **Main Implementation File**: `ai_folder/create-actions.ts`
2. **Prompt Template**: `C:\Users\fletc\Desktop\franko-platform\agent_prompts\welcome_description.md`
3. **Database Schema**: `db/schema/chat-instances-schema.ts`
4. **Database Query Function**: `db/queries/chat-instances-queries.ts`
5. **AI Model Configuration**: `ai_folder/index.ts`
6. **Logger**: `lib/logger.ts`

## Storage Flow

1. The welcome description will be generated using the GeminiFlash model via Vercel's AI SDK
2. It will be stored in the `welcomeDescription` field of the `chatInstancesTable` in your database
3. This field is already defined in your schema as `welcomeDescription: text("welcome_description")`

The implementation will follow your existing patterns for AI generation and database updates, but will be designed to run non-blocking alongside your main conversation plan generation flow.
