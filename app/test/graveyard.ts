// export async function generateDisplayOptions({ text, context }: { text: string; context?: string }) {
    // This function follows separation of concerns:
    // 1. It generates data only (options)
    // 2. The UI rendering is handled separately by the OptionButtons component
    // 3. This prevents duplication between AI text responses and UI elements
    
//     logger.debug('Generating display options - INPUT:', {
//       text,
//       textLength: text.length,
//       context: context ? `${context.substring(0, 50)}...` : undefined
//     });
    
//     const { object: options } = await generateObject({
//       model: geminiFlashModel,
//       prompt: `Generate display options for: ${text}. ${context ? `\n\nConsider this additional context: ${context}` : ''}
  
//   Text Style Guidelines:
//   - Keep options concise, clear and direct (1-5 words when possible)
//   - Use parallel structure across all options
//   - Make options mutually exclusive when appropriate
//   - Include an "Other" option for open-ended responses when needed
//   - Ensure options cover the full range of likely responses`,
//       schema: z.object({
//         options: z.array(z.string()).describe("Array of short, clickable options to display"),
//         type: z.literal("options").describe("Type of display")
//       }),
//     });
  
//     const result = {
//       options: options.options,
//       type: "options" as const,
//       text: text // Include the text field for display above options
//     };
    
//     logger.debug('Generating display options - OUTPUT:', {
//       options: result.options,
//       optionsCount: result.options.length,
//       text: text,
//       contextProvided: !!context
//     });
    
//     return result;
//   }


// displayOptionsMultipleChoice: {
//     description: `
//   - **Purpose:** Presents the user with contextually relevant, clickable options for selecting one or more choices based on the conversation context.  
//   - **When to Use:** Use it when predefined options would simplify the user's decision-making process, such as for preferences, durations, priorities, or categorical selections. If the question is purely open-ended with no clear categorical options, do not use this tool.
//   - **Context Parameter:** Use the optional context parameter to provide additional information (like key conversation details or workflow goals) that will help generate more relevant and tailored options.
//   - **Important:** Always provide a brief follow-up response after the tool executes—avoid repeating the exact options in your text response.
//     `,
//     parameters: z.object({
//       text: z.string().describe("The question or statement for which to generate selectable options (e.g., 'How long should this conversation last?')"),
//       context: z.string().optional().describe("Additional context about the conversation or user needs to help generate more relevant options")
//     }),
//     execute: async ({ text, context }) => {
//       try {
//         logger.debug('Executing displayOptionsMultipleChoice tool', { text, contextProvided: !!context });
//         const result = await generateDisplayOptions({ text, context });
//         logger.debug('displayOptionsMultipleChoice result:', { 
//           options: result.options,
//           optionsCount: result.options.length,
//           text: result.text
//         });
//         return {
//           type: "options",
//           options: result.options,
//           text: text // Use the original question text, not any generated text
//         };
//       } catch (error) {
//         logger.error('Error in displayOptionsMultipleChoice tool:', error);
//         throw error;
//       }
//     },
//   },