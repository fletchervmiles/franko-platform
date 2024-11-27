import { CircleIcon, ClockIcon, LineChartIcon, CreditCardIcon, UserCheck, Settings } from 'lucide-react'

const benefits = [
  {
    title: 'High-Signal, Objective Data',
    description: 'Receive unique, unbiased customer insights systematically extracted and clearly presented—free from interviewer bias and inconsistencies.',
    icon: CircleIcon
  },
  {
    title: 'Time-Saving with Fast Insights',
    description: 'Act quickly using AI-powered interviews that deliver reliable updates faster than traditional methods, saving you valuable time.',
    icon: ClockIcon
  },
  {
    title: 'Tailored to Your Business',
    description: 'Each AI interview agent is enriched with your business data, providing personalized conversations that focus on your specific products or company needs.',
    icon: Settings
  },
  {
    title: 'Actionable Growth Insights',
    description: 'Obtain interviews structured to extract insights aimed at reducing churn and promoting growth, including in-depth analysis, customer feedback, win-back opportunities, and actionable recommendations.',
    icon: LineChartIcon
  },
  {
    title: 'Effortless for You and Your Customers',
    description: 'Minimal effort required—simply share a unique link with customers. They click, submit their number, and receive an immediate call. No scheduling or logistical hassles.',
    icon: UserCheck
  },
  {
    title: 'Cost-Effective',
    description: 'At just $297 per month, it\'s significantly more affordable than hiring employees or agencies, offering comprehensive insights at a fraction of the cost.',
    icon: CreditCardIcon
  }
]

export default function Benefits() {
  return (
    <div className="py-16 sm:py-24">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black border border-gray-200 shadow-sm">
            Benefits
          </span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
          1000s of words from your customers, talking about your product, each month.
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <div key={index} className="relative group">
              <div className="flex flex-col h-full p-5 bg-white rounded-xl border border-gray-200 transition-shadow hover:shadow-md">
                <div className="mb-3">
                  <Icon className="h-6 w-6 text-[#0070f3]" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">
                  {benefit.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  )
}

