import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-white hero-section min-h-[90vh] flex items-center">
      <div className="absolute inset-0">
        <div className="absolute inset-0 grid-background03"></div>
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-medium tracking-tight text-black sm:leading-tight">
            Stop Surveying,<br />
            Start Conversing.
          </h1>
          <div className="mt-3 sm:mt-6 rounded-2xl bg-gray-50/80 backdrop-blur-sm p-4 sm:p-6 max-w-3xl mx-auto border border-gray-200 shadow-sm">
            <p className="text-sm sm:text-base md:text-lg leading-6 sm:leading-7 text-gray-700">
            Franko lets you replace traditional surveys with AI agents, tailored to your business needs and learning objectives. It's like sending your customers a link to ChatGPT—but fully contextualized to your chosen topic. 
            </p>
          </div>
          <div className="mt-12 sm:mt-16 flex items-center justify-center gap-4 flex-wrap">
            <div className="relative">
              <div className="rounded-lg overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 p-[3px] relative shimmer-bg">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent shimmer-effect"></div>
                <Link
                  href="/sign-up"
                  className="rounded-lg bg-gray-900 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-medium text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-all duration-200 ease-in-out inline-flex items-center relative z-10"
                >
                  Build your agent
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              No credit card required
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200" />
      
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .shimmer-effect {
          animation: shimmer 2s infinite;
        }
        
        .shimmer-bg {
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

