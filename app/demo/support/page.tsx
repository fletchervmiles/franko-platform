'use client'

import RootLayout from "@/components/custom-ui/demoNav"
import ContactCard from "@/components/custom-ui/contact-card"

export default function DemoSupportPage() {
  return (
    <RootLayout>
      <div className="w-full">
        <ContactCard />
      </div>
    </RootLayout>
  )
}
