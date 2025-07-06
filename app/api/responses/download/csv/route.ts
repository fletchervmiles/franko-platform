import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAllAggregatedResponses } from "@/db/queries/responses-aggregated-queries";
import { agentsData } from "@/lib/agents-data";
import type { ResponseFilters } from "@/types/responses";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters for filters
    const url = new URL(request.url);
    const filters: ResponseFilters = {
      agentType: url.searchParams.get("agentType") || undefined,
      modalName: url.searchParams.get("modalName") || undefined,
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
    };

    // Fetch all responses matching filters (no pagination for download)
    const responses = await getAllAggregatedResponses({
      userId,
      ...filters,
    });

    if (responses.length === 0) {
      return NextResponse.json(
        { error: "No responses found matching the specified filters" },
        { status: 404 }
      );
    }

    // Transform responses and resolve agent names
    const transformedResponses = responses.map(response => {
      const agentData = agentsData.find(agent => agent.id === response.agentType);
      
      return {
        // Basic info
        name: response.intervieweeFirstName && response.intervieweeSecondName 
          ? `${response.intervieweeFirstName} ${response.intervieweeSecondName}`
          : response.intervieweeFirstName || 'Anonymous',
        email: response.intervieweeEmail || 'No email provided',
        agentType: agentData?.name || response.agentType || 'Unknown Agent',
        modalName: response.modalName || 'No modal',
        
        // Interview details
        completionRate: response.completionStatus 
          ? parseInt(response.completionStatus.replace('%', ''), 10) 
          : 0,
        customerWords: parseInt(response.user_words || '0', 10),
        interviewStartTime: response.interviewStartTime 
          ? response.interviewStartTime.toISOString()
          : '',
        interviewEndTime: response.interviewEndTime 
          ? response.interviewEndTime.toISOString()
          : response.updatedAt.toISOString(),
        completionDate: response.interviewEndTime 
          ? response.interviewEndTime.toISOString().split('T')[0]
          : response.updatedAt.toISOString().split('T')[0],
        
        // Content (escaped for CSV)
        summary: (response.transcript_summary || '').replace(/"/g, '""').replace(/\n/g, ' '),
        transcript: (response.cleanTranscript || '').replace(/"/g, '""').replace(/\n/g, ' '),
        
        // Metadata
        chatInstanceId: response.chatInstanceId,
        responseId: response.id,
        updatedAt: response.updatedAt.toISOString(),
      };
    });

    // Generate CSV content
    const headers = [
      'Name',
      'Email', 
      'Agent Type',
      'Modal Name',
      'Completion Rate (%)',
      'Customer Words',
      'Interview Start Time',
      'Interview End Time',
      'Completion Date',
      'Summary',
      'Transcript',
      'Chat Instance ID',
      'Response ID',
      'Last Updated'
    ];

    const csvRows = [
      headers.join(','),
      ...transformedResponses.map(response => [
        `"${response.name}"`,
        `"${response.email}"`,
        `"${response.agentType}"`,
        `"${response.modalName}"`,
        response.completionRate,
        response.customerWords,
        `"${response.interviewStartTime}"`,
        `"${response.interviewEndTime}"`,
        `"${response.completionDate}"`,
        `"${response.summary}"`,
        `"${response.transcript}"`,
        `"${response.chatInstanceId}"`,
        `"${response.responseId}"`,
        `"${response.updatedAt}"`
      ].join(','))
    ];

    const csvContent = csvRows.join('\n');

    // Generate filename with timestamp and filter info
    const timestamp = new Date().toISOString().split('T')[0];
    let filename = `responses_${timestamp}`;
    
    if (filters.agentType) {
      const agentName = agentsData.find(a => a.id === filters.agentType)?.name || filters.agentType;
      filename += `_${agentName.replace(/\s+/g, '_')}`;
    }
    if (filters.startDate || filters.endDate) {
      filename += `_${filters.startDate || 'start'}_to_${filters.endDate || 'end'}`;
    }
    filename += '.csv';

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error("Failed to generate CSV download:", error);
    return NextResponse.json(
      { error: "Failed to generate CSV file", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 