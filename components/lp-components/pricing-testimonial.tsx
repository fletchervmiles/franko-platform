import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TestimonialProps {
  name: string
  role: string
  company: string
  testimonial: string
  avatarUrl: string
  avatarFallback: string
}

export default function TestimonialCard({
  name = "Ben Goodman",
  role = "Co-Founder and CEO",
  company = "AgeMate",
  testimonial = "Instrumental in improving our retention and understanding churn customer segments.",
  avatarUrl = "/placeholder.svg?height=48&width=48",
  avatarFallback = "BG"
}: TestimonialProps) {
  return (
    <Card className="p-6 w-full max-w-md flex items-start gap-5 relative">
      <Avatar className="h-12 w-12">
        <AvatarImage src={avatarUrl} alt={`${name}'s avatar`} />
        <AvatarFallback>{avatarFallback}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{name}</p>
            <p className="text-sm text-muted-foreground truncate">
              {role} of {company}
            </p>
          </div>
          <div className="h-7 w-7 rounded-full bg-[#9DA8F2] flex-shrink-0" aria-hidden="true" />
        </div>
        <p className="mt-2 text-sm">{testimonial}</p>
      </div>
    </Card>
  )
}

