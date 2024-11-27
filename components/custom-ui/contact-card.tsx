import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, MessageCircle, Phone } from 'lucide-react'

export default function ContactCard() {
  return (
    <Card className="w-full bg-white shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Customer Support</CardTitle>
        <p className="text-sm text-muted-foreground">
          Please reach out via these channels and I will respond as soon as possible.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Mail className="w-4 h-4 text-indigo-600" />
            <span className="text-sm text-muted-foreground">fletcher@franko.ai</span>
          </div>
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-4 h-4 text-indigo-600" />
            <span className="text-sm text-muted-foreground">WhatsApp: +61 417 161 792</span>
          </div>
          <div className="flex items-center space-x-3">
            <Phone className="w-4 h-4 text-indigo-600" />
            <span className="text-sm text-muted-foreground">iMessage: +61 417 161 792</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


