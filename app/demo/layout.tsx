import { Metadata } from "next"
import DemoModeButton from "@/components/custom-ui/demo-mode-button"

export const metadata: Metadata = {
  title: 'Franko Demo',
  description: 'Experience Franko in demo mode',
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative z-0">
      {children}
      <DemoModeButton />
    </div>
  )
} 