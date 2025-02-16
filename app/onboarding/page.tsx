import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { NavSidebar } from "@/components/nav-sidebar"
import Image from "next/image"

export default function OnboardingPage() {
  return (
    <NavSidebar>
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <div className="mb-6">
          <Image
            src="/favicon/favicon.svg"
            alt="Franko logo"
            width={64}
            height={64}
          />
        </div>
        <h1 className="text-2xl font-semibold mb-3">Create Conversation</h1>
        <p className="text-sm text-gray-600 mb-6 max-w-md">
          Quick chat to set context and learning objectives for your customer conversations. This plan guides the
          Conversation Agent.
        </p>
        <Button size="sm" className="bg-black text-white hover:bg-gray-800">
          <Plus className="mr-1 h-3 w-3" />
          Create Conversation
        </Button>
      </div>
    </NavSidebar>
  )
}

