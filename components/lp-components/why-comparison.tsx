'use client';

// Simple SVG Icons (can be replaced with an icon library like react-icons if preferred)
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const CrossIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const cardData = [
  {
    title: 'Traditional Surveys',
    points: [
      'Fixed-question, shallow, inflexible',
      'Survey fatigue; declining customer engagement',
      'Structured data; but limited depth',
      'Low cost; limited actionable value',
      'Scalable but only with single response questioning',
    ],
    highlight: false,
  },
  {
    title: 'Human-led Interviews',
    points: [
      'Conversational but potential interviewer confirmation bias',
      'Low convenience for customer; scheduling, time intensive',
      'Varied, unstructured data; difficult to scale analysis',
      'High cost per interview',
      'No scalability without linear interviewer cost/effort increases',
    ],
    highlight: false,
  },
  {
    title: 'Franko Agents',
    points: [
      'Conversational, objective, trained on proven research techniques',
      'Instantly available; short, customer-friendly guided conversations',
      'Semi-structured, AI-ready data, scalable analysis',
      'Survey-level pricing with significantly higher ROI',
      'Scalable without incremental overhead or customer friction',
    ],
    highlight: true,
  },
];

export default function WhyComparison() {
  return (
    <div className="bg-black text-white py-24 pb-32 grid-background03-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="inline-flex items-center rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white border border-gray-700 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 mr-2 flex-shrink-0"></span>
            Why Franko
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-center mb-6 max-w-4xl mx-auto">
          No feedback loop? You're in    trouble.
        </h2>
        <p className="text-lg sm:text-xl font-light text-white text-center mb-16 max-w-3xl mx-auto">
          Growth is harder than ever. Acquisition costs, churn, customer expectations, # of competitors—all way up! Understanding your customer is your moat but traditional methods aren't cutting it.
        </p>

        <p 
          className="text-center text-lg font-semibold text-white mb-12" 
          style={{ textShadow: '0 0 8px rgba(255, 255, 255, 0.3)' }}
        >
          Franko is your competitive advantage.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {cardData.map((card, index) => (
            <div
              key={index}
              className={`rounded-xl p-8 h-full flex flex-col transition duration-200 ease-in-out hover:scale-[1.01] hover:-translate-y-1 ${
                card.highlight
                  ? 'bg-gradient-to-br from-blue-600/30 to-indigo-700/30 border border-blue-500/50 shadow-lg'
                  : 'bg-gray-900/50 border border-gray-700/50 hover:bg-gray-800/70'
              }`}
            >
              <h3 className={`text-xl font-semibold mb-6 ${card.highlight ? 'text-white' : 'text-gray-200'}`}>
                {card.title}
              </h3>
              <ul className="space-y-4 flex-grow">
                {card.points.map((point, pIndex) => (
                  <li key={pIndex} className="flex items-start min-h-[3.5rem]">
                    <span className="mr-3 mt-0.5 flex-shrink-0">
                       {card.highlight ? <CheckIcon /> : <CrossIcon />}
                    </span>
                    <span className={`${card.highlight ? 'text-gray-200' : 'text-gray-400'} text-sm`}>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
