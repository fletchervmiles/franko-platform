import Link from 'next/link';
import { PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DemoChat() {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" } 
    }
  };

  return (
    <section className="diagonal-grid-dark text-white py-28 md:py-40 overflow-hidden">
      <div className="relative max-w-4xl md:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 flex justify-center items-center">
           <div className="w-2/3 h-2/3 bg-gradient-radial from-indigo-900/15 via-transparent to-transparent blur-3xl pointer-events-none"></div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={cardVariants}
          className="relative bg-gray-950/80 backdrop-blur-sm rounded-xl shadow-xl pt-12 pb-16 sm:pt-16 sm:pb-20 md:pt-20 md:pb-24 px-6 sm:px-10 md:px-16 text-center border border-gray-700/50 transition-transform duration-300 ease-out hover:-translate-y-1" 
        >
          <div className="mb-10 sm:mb-12"> 
             <span className="inline-flex items-center rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white border border-gray-700 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 mr-2 flex-shrink-0"></span>
                Launch Demo Chat
             </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-6">
            Try Franko in Under 1 Minute
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Curious how Franko's AI Agents work? Spend just 60 seconds chatting with an agent about your most and least favourite thing about Slack! Experience firsthand how easily you can gather actionable product feedback.
          </p>
          <p 
            className="text-base text-white mb-12 sm:mb-14 font-medium"
            style={{ textShadow: '0 0 8px rgba(255, 255, 255, 0.3)' }}
          >
            No scheduling, just launch and chat.
          </p>
          <Link
            href="https://franko.ai/chat/external/c7d65de0-779f-45b3-8c4e-91f7bba2b406"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 text-base font-medium text-white shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-950 transition duration-150 ease-in-out group" 
          >
            <PlayCircle className="mr-2 h-5 w-5 transition-transform duration-300 ease-out group-hover:scale-110" aria-hidden="true" />
            Launch Slack Demo Chat
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
