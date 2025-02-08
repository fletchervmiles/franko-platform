// Import necessary components and utilities
import { Chat } from "@/components/custom/chat";  // Import the Chat component
import { generateUUID } from "@/lib/utils";       // Import UUID generator function

// Define the main page component as an async function
export default async function Page() {
  // Generate a unique identifier for this chat instance
  const id = generateUUID();
  
  // Render the Chat component with:
  // - a unique key for React rendering optimization
  // - the generated ID to identify this chat session
  // - an empty array of initial messages
  return <Chat key={id} id={id} initialMessages={[]} />;
}
