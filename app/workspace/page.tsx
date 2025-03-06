import dynamic from "next/dynamic"
import { Suspense } from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { LoadingScreen } from "@/components/loading-screen"

// Dynamically import the NavSidebar component
const NavSidebar = dynamic(
  () => import("@/components/nav-sidebar").then(mod => ({ default: mod.NavSidebar })),
  {
    loading: () => <LoadingScreen message="Loading navigation..." />,
    ssr: true
  }
)

// Dynamically import the WorkspaceList component
const WorkspaceList = dynamic(
  () => import("@/components/workspace-list").then(mod => ({ default: mod.WorkspaceList })),
  {
    loading: () => (
      <div className="w-full p-4 md:p-8 lg:p-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading workspace data...</p>
        </div>
      </div>
    ),
    ssr: false
  }
)

export default async function WorkspacePage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <Suspense fallback={<LoadingScreen message="Loading workspace..." />}>
      <NavSidebar>
        <div className="h-full">
          <Suspense 
            fallback={
              <div className="w-full p-4 md:p-8 lg:p-12 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading workspace data...</p>
                </div>
              </div>
            }
          >
            <WorkspaceList />
          </Suspense>
        </div>
      </NavSidebar>
    </Suspense>
  )
}