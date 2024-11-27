'use client'

import RootLayout from "@/components/custom-ui/nav"
import ContactCard from "@/components/custom-ui/contact-card"

export default function SupportPage() {
  return (
    <RootLayout>
      <div className="w-full">
        <ContactCard />
      </div>
    </RootLayout>
  )
}
