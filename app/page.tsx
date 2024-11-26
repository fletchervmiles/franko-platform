"use client";

import Nav from '@/components/lp-components/nav';
import Hero from '@/components/lp-components/hero';
import Container from '@/components/lp-components/container';
import HowItWorks from '@/components/lp-components/how-it-works';
import Demo from '@/components/lp-components/demo';
import Pricing from '@/components/lp-components/pricing';

export default function HomePage() {
  return (
    <>
      <Nav />
      <Hero />
      <Container>
        {/* How it Works Section */}
        <section id="how-it-works" className="py-24">
          <HowItWorks />
        </section>
      </Container>
      {/* Divider */}
      <div className="border-t border-gray-200" />
      <Container>
        {/* Demo Section */}
        <section id="demo" className="py-24">
          <Demo />
        </section>
      </Container>
      {/* Divider */}
      <div className="border-t border-gray-200" />
      <Container>
        {/* Pricing Section */}
        <section id="pricing" className="py-24">
          <Pricing />
        </section>
      </Container>
    </>
  );
}