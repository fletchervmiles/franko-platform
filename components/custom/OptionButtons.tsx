'use client'; // Marks this as a client-side component

// Import useChat hook from Vercel's AI SDK for managing chat state
import { useChat } from 'ai/react';

/*
 * Key Interactions:
 * 
 * 1. AI Actions (ai/actions.ts):
 * - While generateDisplayOptions exists in actions.ts, it's not imported here
 * - Instead, it's called by the displayOptions tool in route.ts
 * - The results are passed to this component via the Message component
 * 
 * 2. Message Component (components/custom/message.tsx):
 * - Renders this component when tool result type is "displayOptions"
 * - Passes the generated options and text from the tool result
 * 
 * 3. Chat Route (app/(chat)/api/chat/route.ts):
 * - Processes the selected option as a new user message
 * - Continues the conversation based on the selection
 */

// Define expected props for the component
interface OptionButtonsProps {
  options: string[];    // Array of clickable options to display
  chatId: string;       // Current chat session ID
  text?: string;        // Optional text to display above options
}

export function OptionButtons({ options = [], chatId, text }: OptionButtonsProps) {
  // Initialize chat hook with current chat session
  // maxSteps: 5 allows for follow-up interactions after selection
  const { append } = useChat({
    id: chatId,
    body: { id: chatId },
    maxSteps: 5
  });

  // Handler for when user clicks an option
  const handleOptionClick = async (option: string) => {
    console.log('Option selected:', { option, chatId });
    // Append user's selection to chat as a new message
    await append({
      role: 'user',
      content: `I would like to ${option.toLowerCase()}`,
      id: chatId
    });
  };

  // Determine layout based on options characteristics
  const isCompactLayout = options.length > 5 || options.every(opt => opt.length <= 3);
  const hasLongOptions = options.some(opt => opt.length > 50);

  return (
    <div className="flex flex-col gap-2 w-full max-w-2xl">
      {/* Optional descriptive text above options */}
      {text && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {text}
        </p>
      )}
      {/* List of option buttons */}
      <div className={`
        grid gap-2
        ${isCompactLayout 
          ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' 
          : 'grid-cols-1'
        }
        ${hasLongOptions ? 'max-w-full' : 'max-w-lg'}
      `}>
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionClick(option)}
            className={`
              px-4 py-2 
              text-sm 
              text-left 
              border rounded 
              hover:bg-gray-100 dark:hover:bg-gray-800
              transition-colors
              ${hasLongOptions 
                ? 'whitespace-normal break-words min-h-[4rem]' 
                : 'truncate'
              }
              ${isCompactLayout 
                ? 'text-center justify-center items-center' 
                : 'text-left'
              }
            `}
            title={option.length > 50 ? option : undefined}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

/*
 * Data Flow:
 * 1. AI generates options using generateDisplayOptions in actions.ts
 * 2. Tool result is passed to Message component
 * 3. Message component renders OptionButtons with the options
 * 4. User clicks an option
 * 5. Selection is added to chat as new message
 * 6. AI processes the selection and continues conversation
 * 
 * Note: This component is purely presentational and interaction-focused.
 * The actual generation of options happens in the backend via the
 * displayOptions tool in route.ts using generateDisplayOptions from actions.ts
 */