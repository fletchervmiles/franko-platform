import { motion } from "framer-motion";
import Link from "next/link";

import { LogoGoogle, MessageIcon, VercelIcon } from "./icons";

// Overview component - Displays the main introduction/welcome section of the application
export const Overview = () => {
  return (
    // Animated container using framer-motion
    // The motion.div allows for smooth animations when the component mounts/unmounts
    <motion.div
      key="overview"
      className="max-w-[500px] mt-20 mx-4 md:mx-0" // Responsive margins and max-width
      // Animation properties for component entry
      initial={{ opacity: 0, scale: 0.98 }}     // Initial state (slightly scaled down and invisible)
      animate={{ opacity: 1, scale: 1 }}        // Animated state (full size and visible)
      exit={{ opacity: 0, scale: 0.98 }}        // Exit state (fade out and scale down)
      transition={{ delay: 0.5 }}               // Add a slight delay to the animation
    >
      {/* Main content container with styling for dark/light mode */}
      <div className="border-none bg-muted/50 rounded-2xl p-6 flex flex-col gap-4 text-zinc-500 text-sm dark:text-zinc-400 dark:border-zinc-700">
        {/* Logo section showing Vercel + Message icons */}
        <p className="flex flex-row justify-center gap-4 items-center text-zinc-900 dark:text-zinc-50">
          <VercelIcon />
          <span>+</span>
          <MessageIcon />
        </p>

        {/* Main description of the application */}
        <p>
          This is an open source Chatbot template powered by the Google Gemini
          model built with Next.js and the AI SDK by Vercel. It uses the{" "}
          {/* Highlighting important technical terms with styled code blocks */}
          <code className="rounded-sm bg-muted-foreground/15 px-1.5 py-0.5">
            streamText
          </code>{" "}
          function in the server and the{" "}
          <code className="rounded-sm bg-muted-foreground/15 px-1.5 py-0.5">
            useChat
          </code>{" "}
          hook on the client to create a seamless chat experience.
        </p>

        {/* Documentation link section */}
        <p>
          {" "}
          You can learn more about the AI SDK by visiting the{" "}
          {/* External link to documentation with appropriate styling */}
          <Link
            className="text-blue-500 dark:text-blue-400"
            href="https://sdk.vercel.ai/docs"
            target="_blank"
          >
            Docs
          </Link>
          .
        </p>
      </div>
    </motion.div>
  );
};
