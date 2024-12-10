"use client";

import Nav from '@/components/lp-components/nav';
import Hero from '@/components/lp-components/hero';
import Container from '@/components/lp-components/container';
import HowItWorks from '@/components/lp-components/how-it-works';
import Demo from '@/components/lp-components/demo';
import Pricing from '@/components/lp-components/pricing';
import { FAQSection } from '@/components/lp-components/faq-section';
import Footer from '@/components/lp-components/footer';
import Benefits from '@/components/lp-components/benefits'
import VideoSection from '@/components/lp-components/video-section';

export default function HomePage() {
  return (
    <>
      <Nav />
      <Hero />
      <Container>
        <section className="py-24">
          <VideoSection />
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