import dynamic from "next/dynamic"
import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { LoadingScreen } from "@/components/loading-screen"
import { SettingsProvider } from "@/lib/settings-context"

// Dynamically import the NavSidebar component
const NavSidebar = dynamic(
  () => import("@/components/nav-sidebar").then(mod => ({ default: mod.NavSidebar })),
  {
    loading: () => <LoadingScreen message="Loading navigation..." />,
    ssr: true
  }
)

// Dynamically import the ModalManager component
const ModalManager = dynamic(
  () => import("@/components/multi-agent/modal-manager"),
  {
    loading: () => (
      <div className="w-full p-4 md:p-8 lg:p-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E4F222] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat modals...</p>
        </div>
      </div>
    ),
    ssr: false
  }
)

export default async function CreateModalPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <Suspense fallback={<LoadingScreen message="Loading chat modals..." />}>
      <NavSidebar>
        <SettingsProvider>
          <div className="h-full">
            <Suspense 
              fallback={
                <div className="w-full p-4 md:p-8 lg:p-12 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E4F222] mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading chat modals...</p>
                  </div>
                </div>
              }
            >
              <ModalManager />
            </Suspense>
          </div>
        </SettingsProvider>
      </NavSidebar>
    </Suspense>
  )
}