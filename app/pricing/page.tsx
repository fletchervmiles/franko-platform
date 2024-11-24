import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ClientPricing from "./client-pricing";

export default async function PricingPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-up');
  }

  return <ClientPricing userId={userId} />;
} 