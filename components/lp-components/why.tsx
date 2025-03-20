'use client'

export default function Why() {
  return (
    <div className="bg-black text-white py-24 pb-40 grid-background03-dark min-h-[80vh] flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex justify-center mb-16">
            <span className="inline-flex items-center rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white border border-gray-700 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 mr-2 flex-shrink-0"></span>
              <span className="hidden sm:inline">The real AI advantage: owned customer intelligence.</span>
              <span className="sm:hidden">The real AI advantage.</span>
            </span>
          </div>
          
          <div className="space-y-16 max-w-5xl mx-auto">
            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal leading-tight sm:leading-loose">
              <p>
                AI is general knowledge—but insights about how customers perceive your product and why they 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600 font-medium"> choose you</span>, exist uniquely within your customers' minds.
              </p>
            </div>
            
            <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal leading-tight sm:leading-loose">
              <p>
                Gathering 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600 font-medium"> 1000s </span> 
                of your customer words into a proprietary intelligence source is the
                <span className="relative inline-block mx-2">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600 font-medium">real AI advantage</span>
                  <span className="absolute -bottom-1 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full opacity-70 shimmer-bg"></span>
                </span>.
              </p>
            </div>
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
    </div>
  )
}
