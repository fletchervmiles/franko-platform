import { Metadata } from "next"
import PricingUpgrade from "@/components/lp-components/pricing-upgrade"
import { NavSidebar } from "@/components/nav-sidebar"

export const metadata: Metadata = {
  title: "Upgrade Your Plan | Franko",
  description: "Upgrade your Franko plan to access more features and capabilities",
}

export default function UpgradePage() {
  return (
    <NavSidebar>
      <div className="container py-12">
        <PricingUpgrade />
      </div>
    </NavSidebar>
  )
}
