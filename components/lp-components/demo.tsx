import { PlayCircle } from 'lucide-react'

const researchTopics = [
  'Reason for Cancelation',
  'Unmet Expectations',
  'Key Benefits They Were Seeking',
  'Recommended Improvements',
  'Value Perception',
  'Willingness to Reconsider',
  'Winback Opportunities',
  'Exploratory',
  'Narrative-Driven',
  'Uncover the WHY',
  '5 minute interviews'
]

export default function Demo() {
  return (
    <div className="py-16 sm:py-24">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black border border-gray-200 shadow-sm">
            Demo
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-6">
          You name it,<br />
          we ask your churned customers about it.
        </h2>
        <p className="text-gray-600 max-w-3xl mx-auto text-lg">
          Each interview agent is uniquely configured and will typically explore 3-5 research objectives through concise, exploratory conversations lasting around 5 minutes.
        </p>
      </div>

      <div className="max-w-4xl mx-auto mb-16">
        <div className="flex flex-wrap justify-center gap-3">
          {researchTopics.map((topic, index) => (
            <span
              key={index}
              className="inline-flex items-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white whitespace-nowrap"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="relative w-full aspect-video">
          <iframe 
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            src="https://www.tella.tv/video/cm46t2n30000t03kx7qrq3gl7/embed?b=0&title=0&a=0&loop=0&t=0&muted=0&wt=0"
            style={{ border: 0 }}
            allowFullScreen 
            allowTransparency
          />
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-bold text-gray-900 mb-3">Timestamps</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
            <div className="space-y-2">
              {[
                { time: "0:00", label: "Account Setup" },
                { time: "02:36", label: "Call starts" },
                { time: "03:02", label: "Call Section 01: Cancellation Reasons" },
                { time: "04:20", label: "Call Section 02: Initial Expectations" },
              ].map((timestamp, index) => (
                <div key={index} className="flex items-center text-sm">
                  <span className="font-mono text-gray-500 w-12">{timestamp.time}</span>
                  <span className="text-gray-700">{timestamp.label}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[
                { time: "05:59", label: "Call Section 03: Improvements" },
                { time: "07:57", label: "Call Section 04: Potential Win Back" },
                { time: "08:40", label: "Call Ends" },
                { time: "09:00", label: "Overview of interview Analysis" },
              ].map((timestamp, index) => (
                <div key={index} className="flex items-center text-sm">
                  <span className="font-mono text-gray-500 w-12">{timestamp.time}</span>
                  <span className="text-gray-700">{timestamp.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

