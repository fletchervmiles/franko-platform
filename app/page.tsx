"use client";

import Nav from '@/components/lp-components/nav';
import Hero from '@/components/lp-components/hero';
import Why from '@/components/lp-components/why';
import Container from '@/components/lp-components/container';
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
      <Footer />
    </>
  );
}