import Container from "@/components/lp-redesign/container"

export default function HowItWorksSection() {
  const steps = [
    {
      id: "01",
      title: "Create Modals & Select Agents",
      description: "Franko creates agents trained on your data. Toggle agents to build modals—embed or share anywhere."
    },
    {
      id: "02", 
      title: "Customers Click & Chat",
      description: "Customers open modals and have quick, guided feedback conversations. Chats take just 2–3 minutes."
    },
    {
      id: "03",
      title: "Understand Your Users", 
      description: "Feedback summaries arrive in your inbox. Chat with your data anytime to clarify priorities and drive decisions."
    }
  ]

  return (
    <div className="py-20 bg-white">
      <Container>
        <div className="text-center mb-16">
          {/* Subheading */}
          <p className="text-base mb-4" style={{ color: '#0c0a0899' }}>
            Like onboarding an always-on customer research team.
          </p>
          
          {/* Main heading */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium tracking-normal mb-6 leading-tight" style={{ color: '#0c0a08' }}>
            How It Works
          </h2>
          
          {/* Description */}
          <p className="text-lg max-w-3xl mx-auto leading-relaxed" style={{ color: '#0c0a0899' }}>
            Embed Franko, let users share feedback in short guided chats, and get to know your users.
          </p>
        </div>

        {/* Desktop Timeline */}
        <div className="hidden lg:block">
          <div className="relative">
            {/* Step badges */}
            <div className="grid grid-cols-3 gap-8 mb-8">
              {steps.map((step) => (
                <div key={step.id} className="flex justify-center">
                  <div 
                    className={`px-4 py-2 rounded-[5px] text-sm font-medium ${
                      step.id === '03' ? 'bg-[#f4f2f0]' : 'border border-gray-200 bg-white'
                    }`}
                    style={{ color: '#0c0a08' }}
                  >
                    Step {step.id}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Timeline line and circles */}
            <div className="relative mb-8 h-3">
              {/* Timeline line - spans only between circles */}
              <div 
                className="absolute top-1/2 transform -translate-y-1/2 h-0.5 bg-[#f4f2f0]"
                style={{ left: '16.66%', right: '16.66%' }}
              ></div>
              
              {/* Circles positioned absolutely */}
              {/* Circle 1 */}
              <div className="absolute" style={{ left: '16.66%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                <div className="w-3 h-3 rounded-full border-2 border-gray-300 bg-white z-10 relative"></div>
              </div>

              {/* Circle 2 */}
              <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                <div className="w-3 h-3 rounded-full border-2 border-gray-300 bg-white z-10 relative"></div>
              </div>

              {/* Circle 3 */}
              <div className="absolute" style={{ left: '83.33%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                <div className="w-3 h-3 rounded-full border-2 border-gray-300 bg-[#f4f2f0] z-10 relative"></div>
              </div>
            </div>
            
            {/* Cards */}
            <div className="grid grid-cols-3 gap-8">
              {steps.map((step) => (
                <div key={step.id} className={`bg-white border border-gray-200 rounded-lg p-6 ${step.id === '03' ? 'shadow-[0_4px_12px_rgba(0,0,0,0.08)]' : ''}`}>
                  <h3 className="text-md font-semibold mb-3" style={{ color: '#0c0a08' }}>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#0c0a0899' }}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Timeline */}
        <div className="lg:hidden">
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute w-0.5 bg-[#f4f2f0] top-0 bottom-0" style={{ left: '24px' }}></div>
            
            {/* Steps */}
            <div className="space-y-12">
              {steps.map((step, index) => (
                <div key={step.id} className="relative">
                  {/* Step badge aligned with card */}
                  <div className="ml-12 mb-4">
                    <div 
                      className={`px-4 py-2 rounded-[5px] text-sm font-medium inline-block ${
                        step.id === '03' ? 'bg-[#f4f2f0]' : 'border border-gray-200 bg-white'
                      }`}
                      style={{ color: '#0c0a08' }}
                    >
                      Step {step.id}
                    </div>
                  </div>
                  
                  {/* Circle positioned on line */}
                  <div 
                    className="absolute w-3 h-3 rounded-full border-2 z-10"
                    style={{ 
                      left: '24px', 
                      transform: 'translateX(-50%)',
                      top: '60px',
                      backgroundColor: step.id === '03' ? '#f4f2f0' : 'white',
                      borderColor: '#d1d5db'
                    }}
                  ></div>
                  
                  {/* Card */}
                  <div className={`ml-12 bg-white border border-gray-200 rounded-lg p-6 ${step.id === '03' ? 'shadow-[0_4px_12px_rgba(0,0,0,0.08)]' : ''}`}>
                    <h3 className="text-md font-semibold mb-3" style={{ color: '#0c0a08' }}>
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: '#0c0a0899' }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
} 