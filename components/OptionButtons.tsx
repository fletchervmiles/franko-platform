'use client'; // Marks this as a client-side component

// Import useChat hook from Vercel's AI SDK for managing chat state
import { useChat } from 'ai/react';

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
      <div className="flex flex-col gap-2 w-full max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
          {/* Generate 4 skeleton buttons */}
          {[...Array(4)].map((_, index) => (
            <div 
              key={index}
              className="px-4 py-3 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse h-12"
            />
          ))}
        </div>
      </div>
    );
  }

  // Determine if we have any long options
  const hasLongOptions = options.some(opt => opt.length > 30 || opt.includes('('));

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* List of option buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionClick(option)}
            className={`
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
              ${hasLongOptions ? 'text-left' : 'text-center sm:text-left'}
              flex items-center
            `}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}