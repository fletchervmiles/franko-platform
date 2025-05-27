"use client";

import ResponsiveNavbar from '@/components/lp-redesign/responsive-navbar';
import HeroSection from "@/components/lp-redesign/hero-section";
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