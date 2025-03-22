'use client'

import Nav from '@/components/lp-components/nav'
import { FAQSection } from '@/components/lp-components/faq-section'
import Footer from '@/components/lp-components/footer'

export default function FAQsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Nav />
      <div className="container mx-auto px-4 py-16 sm:py-24">
        <FAQSection companyName="Franko" />
      </div>
      <Footer />
    </main>
  )
}
