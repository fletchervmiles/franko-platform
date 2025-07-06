import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ResponsesPageClient } from "@/components/responses-page-client";
import { NavSidebar } from "@/components/nav-sidebar";
import { agentsData } from "@/lib/agents-data";
import type { AggregatedResponsesApiResponse } from "@/types/responses";

// Server component that handles initial data fetching
export default async function ResponsesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // Check authentication
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  // Parse search parameters for initial filters and pagination
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const agentType = typeof searchParams.agentType === 'string' ? searchParams.agentType : undefined;
  const modalName = typeof searchParams.modalName === 'string' ? searchParams.modalName : undefined;
  const startDate = typeof searchParams.startDate === 'string' ? searchParams.startDate : undefined;
  const endDate = typeof searchParams.endDate === 'string' ? searchParams.endDate : undefined;

  // Parse search parameters to pass to client component
  const initialFilters = {
    agentType,
    modalName,
    startDate,
    endDate,
  };

  const initialPage = page;

  // Prepare agent types for filters
  const agentTypes = agentsData.map(agent => ({
    id: agent.id,
    name: agent.name,
  }));

  return (
    <NavSidebar>
      <div className="w-full p-4 md:p-8 lg:p-12 space-y-8">
        <ResponsesPageClient
          initialFilters={initialFilters}
          initialPage={initialPage}
          userId={userId}
          agentTypes={agentTypes}
        />
      </div>
    </NavSidebar>
  );
}
