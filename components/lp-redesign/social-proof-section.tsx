import { Card, CardContent } from "@/components/ui/card"
import Container from "@/components/lp-redesign/container"
import Image from "next/image"

export default function SocialProofSection() {
  return (
    <div className="py-20 bg-white">
      <Container>
        <Card className="rounded-[6px] border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-8">
            {/* Title */}
            <h2 className="text-sm font-bold text-gray-500 tracking-wider mb-6 text-center">
              CUSTOMER SUCCESS
            </h2>

            <div className="flex flex-col lg:flex-row gap-6 mb-6">
              {/* Left side - Ben's image */}
              <div className="flex-shrink-0 flex justify-center lg:justify-start">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-[#F4F2F0] p-1">
                  <Image
                    src="/assets/ben-agemate.png"
                    alt="Ben Goodman, Founder at Agemate"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
              </div>

              {/* Right side - Quote */}
              <div className="flex-1">
                <blockquote className="text-lg font-medium leading-relaxed" style={{ color: '#0C0A08' }}>
                "I was intrigued but doubtful until I saw our response data in one place. The issues we half knew about suddenly looked urgent and costly. I pinged our lead PM and we made three major updates that day. The gap between a 7/10 and a 9/10 customer experience is huge, and Franko is how we close it."                </blockquote>
                <cite className="block mt-3 text-sm font-medium text-gray-500 not-italic">
                  Ben Goodman, Founder at agemate.com
                </cite>
              </div>
            </div>

            {/* Results badge */}
            <div className="flex justify-center mb-6">
              <span className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">
                Results After 1 Month
              </span>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#F4F2F0] p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Responses</h3>
                <p className="text-xl font-semibold">
                  <span className="bg-[#E4F222] px-2 py-0.5 rounded">408</span>
                </p>
              </div>
              
              <div className="bg-[#F4F2F0] p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Completion Rate</h3>
                <p className="text-xl font-semibold">
                  <span className="bg-[#E4F222] px-2 py-0.5 rounded">84.9%</span>
                </p>
              </div>
              
              <div className="bg-[#F4F2F0] p-4 rounded-lg border col-span-2 md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500 mb-1">Customer Words Collected</h3>
                <p className="text-xl font-semibold">
                  <span className="bg-[#E4F222] px-2 py-0.5 rounded">32,625</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Container>
    </div>
  )
} 