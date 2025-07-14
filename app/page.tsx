"use client";

import ResponsiveNavbar from '@/components/lp-redesign/responsive-navbar';
import HeroSection from "@/components/lp-redesign/hero-section";
import SocialProofSection from "@/components/lp-redesign/social-proof-section";
import HowItWorksSection from "@/components/lp-redesign/how-it-works-section";
import TryItYourselfSection from "@/components/lp-redesign/try-it-yourself-section";
import FeaturesTabs from "@/components/lp-redesign/features-tabs";
import WhySection from "@/components/lp-redesign/why-section";
import HowItWorks from "@/components/lp-redesign/how-it-works";
import BenefitsSection from "@/components/lp-redesign/benefits-section";
import { MainPageFAQs } from "@/components/lp-redesign/main-page-faqs";
import Container from '@/components/lp-components/container';
import Footer from '@/components/lp-components/footer';
import DemoChat from '@/components/lp-components/demo-chat';

export default function HomePage() {
  return (
    <>
      <ResponsiveNavbar />
      <HeroSection />
      {/* Social Proof Section */}
      <SocialProofSection />
      {/* How It Works Section */}
      <HowItWorksSection />
      {/* Try It Yourself Section */}
      <TryItYourselfSection />
      {/* Features Tabs Section */}
      <FeaturesTabs />
      {/* Why Section */}
      <WhySection />
      {/* How It Works Section - Replaced Journey with HowItWorks */}
      <HowItWorks />
      {/* Benefits Section */}
      <BenefitsSection />

      <DemoChat />

      {/* Main Page FAQs */}
      <MainPageFAQs />

      <Footer />
    </>
  );
}