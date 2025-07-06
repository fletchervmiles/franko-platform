import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ResponsesPageClient } from "@/components/responses-page-client";
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

  // Build query parameters for the API call
  const queryParams = new URLSearchParams();
  queryParams.set('page', page.toString());
  if (agentType) queryParams.set('agentType', agentType);
  if (modalName) queryParams.set('modalName', modalName);
  if (startDate) queryParams.set('startDate', startDate);
  if (endDate) queryParams.set('endDate', endDate);

  // Fetch initial data from our API
  let initialData: AggregatedResponsesApiResponse | undefined;
  
  try {
    // Use the same domain for the API call
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}`
        : 'https://your-domain.com' // Replace with your actual domain
      : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/responses?${queryParams.toString()}`, {
      headers: {
        'Cookie': `__session=${userId}`, // Pass auth context
      },
      cache: 'no-store', // Always fetch fresh data
    });

    if (response.ok) {
      initialData = await response.json();
    } else {
      console.error('Failed to fetch initial responses data:', response.statusText);
    }
  } catch (error) {
    console.error('Error fetching initial responses data:', error);
    // Don't throw - let the client component handle the error state
  }

  // Prepare agent types for filters
  const agentTypes = agentsData.map(agent => ({
    id: agent.id,
    name: agent.name,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Responses</h1>
          <p className="text-gray-600">
            View and manage all interview responses across your conversations.
          </p>
        </div>
        
        <ResponsesPageClient
          initialData={initialData}
          userId={userId}
          agentTypes={agentTypes}
        />
      </div>
    </div>
  );
}
