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
  '10 minute interviews'
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
          Each interview agent is uniquely configured and will typically explore 3-5 research objectives through concise, exploratory conversations lasting around 10 minutes.
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
      </div>
    </div>
  )
}

