import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Nav from "@/components/lp-components/nav";
import Footer from "@/components/lp-components/footer-pricing";
import Pricing from "@/components/lp-components/pricing";

export default async function PricingPage() {

  return (
    <>
      <Nav />
      <main className="container mx-auto px-4 py-16 sm:py-24">
        <Pricing />
      </main>
      <Footer />
    </>
  );
} 