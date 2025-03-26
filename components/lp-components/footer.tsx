import Link from "next/link"

export default function Footer() {
  return (
    <footer className="w-full bg-black text-white grid-background03-dark py-24 min-h-[80vh] flex flex-col justify-between">
      <div className="container mx-auto px-4 flex-1 flex flex-col">
        <div className="max-w-4xl mx-auto text-center my-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal leading-tight sm:leading-loose mb-12">
            Start turning conversations into proprietary customer intelligence.
          </h2>
          
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/sign-up" className="inline-flex items-center justify-center px-8 py-3 rounded-md bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium hover:opacity-90 transition-opacity">
              Get started for free
            </Link>
            
            <div className="flex items-center text-sm text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              No credit card required
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-800 mt-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-300 pb-4">
            <div className="flex items-center gap-1 mb-4 sm:mb-0">
              <span>©{new Date().getFullYear()}</span>
              <span>-</span>
              <Link href="https://franko.ai" className="hover:underline">
                Service provided by Franko.ai
              </Link>
            </div>
            
            <nav className="flex items-center gap-6 mb-4 sm:mb-0">
              <Link href="/pricing" className="hover:underline">
                Pricing
              </Link>
              <Link href="/faqs" className="hover:underline">
                FAQs
              </Link>
            </nav>
            
            <nav className="flex items-center gap-4">
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:underline">
                T&Cs
              </Link>
              <a href="mailto:fletcher@franko.ai" className="hover:underline">
                Contact
              </a>
            </nav>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .shimmer-bg {
          animation: shimmer 8s infinite linear;
          background-size: 1000px 100%;
        }
      `}</style>
    </footer>
  )
}

