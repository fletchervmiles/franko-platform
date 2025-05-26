"use client";

import ResponsiveNavbar from '@/components/lp-redesign/responsive-narbar';
import HeroSection from "@/components/lp-redesign/hero-section";
import FeaturesTabs from "@/components/lp-redesign/features-tabs";
import WhySection from "@/components/lp-redesign/why-section";
import HowItWorks from "@/components/lp-redesign/how-it-works";
import Container from '@/components/lp-components/container';
import Footer from '@/components/lp-components/footer';
import Timeline from '@/components/lp-components/timeline';
import DemoChat from '@/components/lp-components/demo-chat';

export default function HomePage() {
  return (
    <>
      <ResponsiveNavbar />
      <HeroSection />
      {/* Features Tabs Section */}
      <FeaturesTabs />
      {/* Why Section */}
      <WhySection />
      {/* How It Works Section - Replaced Journey with HowItWorks */}
      <HowItWorks />

      <Container>
        <section className="py-24 md:py-32">
          <div className="w-full max-w-7xl mx-auto px-4">
            <div className="flex justify-center mb-12 md:mb-16">
              <span className="inline-flex items-center rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black border border-gray-200 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 mr-2 flex-shrink-0"></span>
                How It Works
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-center mb-6 max-w-5xl mx-auto">
              Create, Deploy, and Discover
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 text-center mb-16 max-w-3xl mx-auto">
              An always-on feedback engine that meets customers where they are—zero friction, zero scheduling—capturing unfiltered customer feedback while you build.
            </p>
          </div>
        </section>
      </Container>

      <section className="py-24 md:py-32 bg-black text-white grid-background03-dark">
        <div className="w-full max-w-7xl mx-auto px-4">
          <div className="text-center mb-16 md:mb-24">
            <span className="inline-flex items-center rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white border border-gray-700 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 mr-2 flex-shrink-0"></span>
              Example Implementation
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-center mt-6 max-w-5xl mx-auto text-white">
            Build Your Own Continuous Customer Feedback Engine.
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 text-center mt-6 max-w-3xl mx-auto">
            Automate short, targeted conversations at critical points in your customer journey—each conversation instance accessed by your customers via simple, shareable links.
            </p>
          </div>
          <Timeline />
        </div>
      </section>

      <DemoChat />

      <Footer />
    </>
  );
}