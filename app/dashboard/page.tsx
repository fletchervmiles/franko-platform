import { NavSidebar } from "@/components/nav-sidebar"
import { WorkspaceList } from "@/components/workspace-list"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return (
    <NavSidebar>
      <div className="h-full">
        <WorkspaceList />
      </div>
    </NavSidebar>
  )
}
