# Implementation Plan for Non-Blocking Welcome Description Generation

Based on your requirements, here's a plan for implementing a non-blocking function that generates a welcome description using the conversation plan data:

## 1. Create a New Function

Create a new async function called `generateWelcomeDescription` that:
- Takes minimal inputs (chatId, title, duration, summary)
- Works independently from the main flow
- Uses GeminiFlash model
- Saves results to the welcome_description field

## 2. Function Structure

The function should:
1. Load the welcome_description.md prompt template
2. Replace template variables with the title, duration, and summary
3. Make a request to GeminiFlash
4. Save the result to the database
5. Include error handling that doesn't affect the main flow

## 3. Database Integration

Create a simple database query function to update only the welcome_description field in the chat instance.

## 4. Non-Blocking Implementation

Make the function non-blocking by:
- Using a fire-and-forget pattern
- Handling errors internally without throwing them to the caller
- Logging errors but not disrupting the main flow

## 5. Integration with Existing Flow

Add a call to this function after the conversation plan is generated, but don't await its result in the main flow.

## 6. Code Structure

```
1. Import necessary dependencies
2. Create a database helper function for updating welcome_description
3. Implement the generateWelcomeDescription function
4. Add a non-blocking call to this function after generateConversationPlanFromForm
```

## 7. Error Handling Strategy

- Log errors but don't propagate them to the caller
- Implement retries for transient failures
- Ensure database operations are properly handled

## 8. Testing Approach

- Test the function in isolation
- Verify database updates work correctly
- Confirm the main flow continues even if this function encounters errors

# Relevant Files for Welcome Description Implementation

Based on your codebase structure, here are the relevant files and locations for implementing the welcome description feature:

## 1. Main Implementation File
- **Location**: `ai_folder/create-actions.ts`
- **Purpose**: This is where your new `generateWelcomeDescription` function will be added, alongside the existing `generateConversationPlanFromForm` function.

## 2. Prompt Template
- **Location**: `C:\Users\fletc\Desktop\franko-platform\agent_prompts\welcome_description.md`
- **Purpose**: This file contains the prompt template that will be used for generating the welcome description.

## 3. Database Schema
- **Location**: `db/schema/chat-instances-schema.ts`
- **Purpose**: This file already contains the `welcomeDescription` field in the `chatInstancesTable` schema, which will store the generated welcome description.

## 4. Database Query Function
- **Location**: `db/queries/chat-instances-queries.ts` (likely location based on your imports)
- **Purpose**: You'll need to create or use an existing function to update the welcome description field in the database.

## 5. AI Model Configuration
- **Location**: `ai_folder/index.ts` (likely location based on your imports)
- **Purpose**: This file likely contains the configuration for the GeminiFlash model that you'll need to import.

## 6. Logger
- **Location**: `lib/logger.ts`
- **Purpose**: You're already importing this for logging, and you'll use it to log any errors or debug information.

## Storage Flow:
1. The welcome description will be generated using the GeminiFlash model
2. It will be stored in the `welcomeDescription` field of the `chatInstancesTable` in your database
3. This field is already defined in your schema as `welcomeDescription: text("welcome_description")`

The implementation will follow your existing patterns for AI generation and database updates, but will be designed to run non-blocking alongside your main conversation plan generation flow.

