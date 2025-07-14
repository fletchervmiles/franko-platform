import Container from "@/components/lp-redesign/container"
import Image from "next/image"
import { Code, Send, Link as LinkIcon } from "lucide-react"

export default function TryItYourselfSection() {
  const demoCards = [
    {
      id: "slack",
      logo: "/assets/slack-logo.png",
      title: "General Feedback",
      line1: "Collect ongoing product feedback. Includes agents for feature requests, key improvements, and benefits.",
      line2: "Use case: Embed as floating bubble or \"Give Feedback\" button.",
      company: "Slack",
      icon: "embed"
    },
    {
      id: "perplexity",
      logo: "/assets/perplexity-logo.png", 
      title: "Unconverted Signups",
      line1: "Discover why signed-up users haven't upgraded. Active agents focused on uncovering activation hurdles.",
      line2: "Send via email link to users who haven't upgraded.",
      company: "Perplexity",
      icon: "send"
    },
    {
      id: "zapier",
      logo: "/assets/zapier-logo.png",
      title: "Understand Your Customers", 
      line1: "Clarify your customers' persona, key needs, and how they found you. Active persona, discovery and goal-oriented agents.",
      line2: "Place in onboarding flow or email (\"Tell us about yourself\").",
      company: "Zapier",
      icon: "link"
    }
  ]

  const handleCardClick = (cardId: string) => {
    // Placeholder for demo launch functionality
    console.log(`Launching demo for: ${cardId}`)
  }

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case "embed":
        return <Code className="w-4 h-4" />
      case "send":
        return <Send className="w-4 h-4" />
      case "link":
        return <LinkIcon className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <div className="py-24 bg-[#1A1919]">
      <Container>
        <div className="text-center mb-10">
          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl font-semibold mb-8 text-white">
            Try It Yourself
          </h1>
          
          {/* Subheading */}
          <p className="text-xl max-w-4xl mx-auto leading-relaxed" style={{ color: '#FFFFFF99' }}>
            Click a card to launch a live demo. Explore example modals configured for different customer touchpoints.
          </p>
        </div>

        {/* Demo Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {demoCards.map((card) => (
            <div key={card.id} className="flex flex-col items-center group">
              {/* Demo Card */}
              <div
                onClick={() => handleCardClick(card.id)}
                className="bg-[#E4E4E4] border transition-all duration-300 border-transparent hover:border-[#E4F222] rounded-xl p-6 md:p-8 cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] w-full flex flex-col relative group-hover:bg-white"
              >
                {/* Top: logo + titles (flex on md) */}
                <div className="flex flex-col md:flex-row md:items-start md:gap-4 mb-4 md:mb-6">
                  {/* Company Logo */}
                  <div className="mx-auto md:mx-0 w-16 h-16 relative flex-shrink-0">
                    <Image
                      src={card.logo}
                      alt={`${card.company} logo`}
                      fill
                      className="object-contain"
                    />
                  </div>
                  {/* Titles */}
                  <div className="text-center md:text-left mt-4 md:mt-0">
                    <p className="uppercase tracking-wide text-[10px] font-semibold" style={{ color: '#0C0A08', opacity: 0.6 }}>
                      Modal configuration
                    </p>
                    <h3 className="text-xl font-semibold" style={{ color: '#0C0A08' }}>
                      {card.title}
                    </h3>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 space-y-4 max-w-xs md:max-w-none mx-auto md:mx-0">
                  <p className="text-sm leading-6" style={{ color: '#0C0A08' }}>
                    {card.line1}
                  </p>
                  <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#F4F2F0]" style={{ color: '#0C0A08', opacity: 0.9 }}>
                    {getIcon(card.icon)}
                    <span className="text-xs">{card.line2}</span>
                  </div>
                </div>

                {/* Subtle background pattern */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent to-black/5 rounded-xl"></div>
              </div>

              {/* CTA below card */}
              <button
                onClick={() => handleCardClick(card.id)}
                className="mt-6 text-white hover:text-[#E4F222] transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
              >
                Explore live demo 
                <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Optional disclaimer */}
        <div className="text-center">
          <p className="text-base" style={{ color: '#FFFFFF99', opacity: 0.8 }}>
            These are sample modal configurations—your agents and modals will be customized to your use cases.
          </p>
        </div>
      </Container>
    </div>
  )
} 