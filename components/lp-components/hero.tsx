import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-white hero-section">
      <div className="absolute inset-0">
        <div className="absolute inset-0 grid-background03"></div>
      </div>
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-black sm:leading-tight">
            AI-powered phone interviews that reveal why customers churn and how to win them back.
          </h1>
          <p className="mt-3 sm:mt-6 text-sm sm:text-base md:text-lg leading-6 sm:leading-7 text-gray-600 max-w-3xl mx-auto">
            Share your interview link with customers—they submit their number, chat with our AI for ≈5 minutes, and their audio, transcript, and analysis appear in your dashboard.
          </p>
          <div className="mt-8 sm:mt-10 flex items-center justify-center">
            <Link
              href="/sign-up"
              className="rounded-full bg-black px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-all duration-200 ease-in-out inline-flex items-center"
            >
              Turn Churn into Growth
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200" />
    </div>
  )
}

