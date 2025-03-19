"use client";

import Nav from '@/components/lp-components/nav';
import Hero from '@/components/lp-components/hero';
import Why from '@/components/lp-components/why';
import Container from '@/components/lp-components/container';
import HowItWorks from '@/components/lp-components/how-it-works';
import Demo from '@/components/lp-components/demo';
import Pricing from '@/components/lp-components/pricing';
import { FAQSection } from '@/components/lp-components/faq-section';
import Footer from '@/components/lp-components/footer';
import Benefits from '@/components/lp-components/benefits'
import Journey from '@/components/lp-components/journey';

export default function HomePage() {
  return (
    <>
      <Nav />
      <Hero />
      <Why />
      <Container>
        {/* Journey Section */}
        <section className="py-32 min-h-auto flex items-center">
          <div className="w-full">
            <div className="flex justify-center mb-16">
              <span className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black border border-gray-200 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 mr-2 flex-shrink-0"></span>
                How It Works
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-center mb-16 max-w-5xl mx-auto">Set up your agent, invite customers to chat—see your product through their eyes.</h2>
            <Journey />
          </div>
        </section>
      </Container>
      <div className="border-t border-gray-200" />
      <Container>
        {/* How it Works Section */}
        <section id="how-it-works" className="py-24">
          <HowItWorks />
        </section>
      </Container>
      <div className="border-t border-gray-200" />
      <Container>
        {/* Demo Section */}
        <section id="demo" className="py-24">
          <Demo />
        </section>
      </Container>
      <div className="border-t border-gray-200" />
      <Container>
        {/* Benefits Section */}
        <section className="py-24">
          <Benefits />
        </section>
      </Container>
      <div className="border-t border-gray-200" />
      <Container>
        {/* Pricing Section */}
        <section id="pricing" className="py-24">
          <Pricing />
        </section>
      </Container>
      <div className="border-t border-gray-200" />
      <Container>
        {/* FAQ Section */}
        <section className="py-24">
          <FAQSection companyName="Franko.ai" />
        </section>
      </Container>
      <Footer />
    </>
  );
}