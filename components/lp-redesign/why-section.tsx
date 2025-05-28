"use client"
import Container from "./container"
import GapsTable from "./gaps-table"
import { useState, useEffect } from "react"

export default function WhySection() {
  const [showTooltip1, setShowTooltip1] = useState(false)
  const [showTooltip2, setShowTooltip2] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  return (
    <div className="py-24 grid-background03">
      <Container>
        <div className="max-w-4xl mx-auto text-center mb-16">
          {/* "Why" bubble - updated for light background */}
          <div className="inline-flex items-center justify-center px-6 py-2 mb-8 bg-white border border-gray-200 shadow-sm">
            <span className="text-black font-medium text-sm flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Why Franko
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-normal mb-6 leading-tight text-black relative">
            Customer-feedback loops drive 2-3 x ARR growth
            <span
              className="inline-block align-super ml-0.5 cursor-help relative"
              onMouseEnter={() => setShowTooltip1(true)}
              onMouseLeave={() => setShowTooltip1(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3 h-3 text-gray-500 inline"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              {showTooltip1 && (
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 p-4 bg-black text-white text-xs leading-relaxed rounded opacity-100 transition-opacity duration-300 pointer-events-none z-10 shadow-lg">
                  Plenty of studies, and startup folklore, show that customer-obsessed teams out-grow their peers. Exact
                  figures are directional rather than surgical, but the clearest SaaS benchmark is ProfitWell's {">"}
                  4,000 company study: teams running continuous interviews post 22–35% faster annual growth, compounding
                  to ~2–3× ARR in three years (or 10-20× over a decade) while 70% still talk to &lt;10 users a month.
                </span>
              )}
            </span>
          </h1>

          {/* Subheading */}
          <h2 className="text-lg md:text-xl text-gray-700 leading-relaxed">
            For most SaaS companies, the loop doesn't exist. 70% of companies
            <span
              className="inline-block align-super ml-0.5 cursor-help relative"
              onMouseEnter={() => setShowTooltip2(true)}
              onMouseLeave={() => setShowTooltip2(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3 h-3 text-gray-500 inline"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
              {showTooltip2 && (
                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 p-4 bg-black text-white text-xs leading-relaxed rounded opacity-100 transition-opacity duration-300 pointer-events-none z-10 shadow-lg">
                  Plenty of studies, and startup folklore, show that customer-obsessed teams out-grow their peers. Exact
                  figures are directional rather than surgical, but the clearest SaaS benchmark is ProfitWell's {">"}
                  4,000 company study: teams running continuous interviews post 22–35% faster annual growth, compounding
                  to ~2–3× ARR in three years (or 10-20× over a decade) while 70% still talk to &lt;10 users a month.
                </span>
              )}
            </span>{" "}
            don't even make it past step 1, talking to users. Six un-met steps follow→Franko automates each one.
          </h2>
        </div>

        {/* Gaps Table */}
        <div className="mt-16">
          <GapsTable isMobile={isMobile} />
        </div>

        {/* Conclusion with two-column layout - more compact and on-brand */}
        <div className="max-w-5xl mx-auto mt-24 mb-12 pt-8">
          <div className="grid md:grid-cols-2 gap-0 overflow-hidden border border-gray-200 rounded-md shadow-md">
            {/* Left column - Without Franko */}
            <div className="p-8 bg-white border-r border-gray-200">
              <h3 className="text-lg font-medium text-gray-600 mb-6">Without Franko</h3>

              {/* Negative points with dash icons */}
              <div className="space-y-4 mb-8">
                {[
                  "Sporadic feedback",
                  "Single insight channel",
                  "No segmentation",
                  "No leading metrics",
                  "Ideas over evidence",
                  "Insights scattered",
                ].map((point, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-5 h-5 flex items-center justify-center mr-3 flex-shrink-0">
                      <svg width="16" height="2" viewBox="0 0 16 2" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="16" height="2" fill="#94A3B8" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column - With Franko */}
            <div className="p-8 bg-gray-50">
              <h3 className="text-lg font-medium text-gray-800 mb-6">With Franko</h3>

              {/* Positive points with check icons */}
              <div className="space-y-4 mb-8">
                {[
                  "Always-on AI interviews",
                  "New high-signal channel",
                  "Auto persona tagging",
                  "Live PMF & sentiment dashboards",
                  "Evidence for roadmap",
                  "Unified, searchable hub",
                ].map((point, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-5 h-5 flex items-center justify-center mr-3 flex-shrink-0 text-blue-500">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M13.3334 4L6.00008 11.3333L2.66675 8"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-800">{point}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <a
                href="https://cal.com/fletcher-miles/franko.ai-demo-call"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center bg-black text-white hover:bg-gray-800 px-6 py-3 text-sm font-medium transition-colors w-full"
              >
                Book a demo »
              </a>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
