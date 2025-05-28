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
    <section className="text-gray-900 py-28 md:py-40 overflow-hidden" style={{ backgroundColor: '#f5f8fa' }}>
      <div className="relative max-w-4xl md:max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 flex justify-center items-center">
           <div className="w-2/3 h-2/3 bg-gradient-radial from-indigo-900/15 via-transparent to-transparent blur-3xl pointer-events-none"></div>
        </div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={cardVariants}
          className="relative diagonal-grid-dark rounded-xl shadow-xl pt-12 pb-16 sm:pt-16 sm:pb-20 md:pt-20 md:pb-24 px-6 sm:px-10 md:px-16 text-center border border-gray-700/50 transition-transform duration-300 ease-out hover:-translate-y-1 text-white" 
        >
          <div className="mb-10 sm:mb-12"> 
             <span className="inline-flex items-center bg-black px-4 py-1.5 text-sm font-medium text-white border border-gray-700 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 mr-2 flex-shrink-0"></span>
                Launch Demo Chat
             </span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-6">
            Try an AI Agent Right Now
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Skeptical about AI slop? Start a product-market fit interview about Cursor and see for yourself. Experience how our agents conduct meaningful conversations, not generic responses.
          </p>
          <p 
            className="text-base text-white mb-12 sm:mb-14 font-medium"
            style={{ textShadow: '0 0 8px rgba(255, 255, 255, 0.3)' }}
          >
            No signup required. Just click and chat.
          </p>
          <a
            href="https://franko.ai/chat/external/011869d6-932d-40d1-9edb-db966cf935b7"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-white text-black hover:bg-gray-100 px-8 py-4 text-base font-medium transition-colors border border-gray-300 shadow-sm hover:shadow-md"
          >
            <PlayCircle className="mr-2 h-5 w-5" aria-hidden="true" />
            Launch Cursor Demo Chat »
          </a>
        </motion.div>
      </div>
    </section>
  );
}
