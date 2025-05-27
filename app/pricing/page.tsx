'use client'

import { redirect } from "next/navigation";
import ResponsiveNavbar from "@/components/lp-redesign/responsive-navbar";
import Footer from "@/components/lp-components/footer-pricing";
import Pricing from "@/components/lp-components/pricing";

export default function PricingPage() {

  return (
    <>
      <ResponsiveNavbar />
      <main className="container mx-auto px-4 py-16 sm:py-24">
        <Pricing />
      </main>
      <Footer />
    </>
  );
} 