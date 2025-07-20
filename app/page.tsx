"use client";

import ResponsiveNavbar from '@/components/lp-redesign/responsive-navbar';
import HeroSection from "@/components/lp-redesign/hero-section";
import SocialProofSection from "@/components/lp-redesign/social-proof-section";
import HowItWorksSection from "@/components/lp-redesign/how-it-works-section";
import TryItYourselfSection from "@/components/lp-redesign/try-it-yourself-section";
import BenefitsSection from "@/components/lp-redesign/benefits-section";
import { MainPageFAQs } from "@/components/lp-redesign/main-page-faqs";
import Footer from '@/components/lp-components/footer';
import LandingPricing from "@/components/lp-redesign/landing-pricing";

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
      {/* Benefits Section */}
      <BenefitsSection />

      <LandingPricing />

      {/* Main Page FAQs */}
      <MainPageFAQs />

      <Footer />
    </>
  );
}