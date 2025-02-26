'use client'; // Marks this as a client-side component

// Import useChat hook from Vercel's AI SDK for managing chat state
import { useChat } from 'ai/react';
import { ChevronRight } from 'lucide-react';

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
}

export function OptionButtons({ options = [], chatId }: OptionButtonsProps) {
  // Initialize chat hook with current chat session
  const { append } = useChat({
    id: chatId,
    body: { id: chatId }
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

  // If options array is empty, show loading skeleton
  if (!options.length) {
    return (
      <div className="grid grid-cols-1 sm:grid-template-columns-autofit gap-3 w-full">
        {[...Array(4)].map((_, index) => (
          <div 
            key={index}
            className="px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse h-12"
          />
        ))}
      </div>
    );
  }

  // Check if we have any long options
  const hasLongOptions = options.some(opt => opt.length > 30 || opt.includes('('));
  
  // Determine the appropriate CSS class for the grid
  const gridClass = hasLongOptions 
    ? "grid grid-cols-1 gap-3 w-full" 
    : "grid grid-cols-1 sm:grid-template-columns-autofit gap-3 w-full";

  return (
    <div className={gridClass} style={!hasLongOptions ? {"--min-column-width": "180px"} as React.CSSProperties : undefined}>
      {options.map((option, index) => {
        // Split option into main text and description (if in parentheses)
        const hasDescription = option.includes('(');
        let mainText = option;
        let description = '';
        
        if (hasDescription) {
          const match = option.match(/(.*?)(\s*\(.*\))/);
          if (match) {
            mainText = match[1].trim();
            description = match[2].trim();
          }
        }
        
        return (
          <button
            key={index}
            onClick={() => handleOptionClick(option)}
            className="
              px-4 py-3 
              text-sm 
              border
              rounded-lg
              bg-white dark:bg-gray-900
              shadow-sm
              hover:bg-gray-50 dark:hover:bg-gray-800
              hover:shadow-md
              hover:border-gray-300 dark:hover:border-gray-600
              transition-all duration-200
              whitespace-normal break-words
              h-auto min-h-[3rem]
              text-left
              flex items-center
            "
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">{mainText}</span>
              {description && (
                <span className="text-xs text-gray-500 mt-1">{description}</span>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </button>
        );
      })}
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