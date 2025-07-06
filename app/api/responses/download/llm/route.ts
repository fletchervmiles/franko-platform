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
        name: response.intervieweeFirstName && response.intervieweeSecondName 
          ? `${response.intervieweeFirstName} ${response.intervieweeSecondName}`
          : response.intervieweeFirstName || 'Anonymous',
        agentType: agentData?.name || response.agentType || 'Unknown Agent',
        transcript: response.cleanTranscript || '',
        completionDate: response.interviewEndTime 
          ? response.interviewEndTime.toISOString().split('T')[0]
          : response.updatedAt.toISOString().split('T')[0],
        customerWords: parseInt(response.user_words || '0', 10),
      };
    });

    // Generate LLM-ready markdown content
    const timestamp = new Date().toISOString().split('T')[0];
    let title = 'Interview Responses Analysis';
    
    if (filters.agentType) {
      const agentName = agentsData.find(a => a.id === filters.agentType)?.name || filters.agentType;
      title += ` - ${agentName}`;
    }
    
    const totalWords = transformedResponses.reduce((sum, r) => sum + r.customerWords, 0);
    
    const markdownContent = `# ${title}

**Generated:** ${new Date().toISOString()}
**Total Responses:** ${transformedResponses.length}
**Total Customer Words:** ${totalWords.toLocaleString()}

## Filters Applied
${filters.agentType ? `- **Agent Type:** ${agentsData.find(a => a.id === filters.agentType)?.name || filters.agentType}` : ''}
${filters.modalName ? `- **Modal Name:** ${filters.modalName}` : ''}
${filters.startDate ? `- **Start Date:** ${filters.startDate}` : ''}
${filters.endDate ? `- **End Date:** ${filters.endDate}` : ''}
${!Object.values(filters).some(v => v) ? '- No filters applied (all responses included)' : ''}

## Interview Responses

${transformedResponses.map((response, index) => {
  return `### Response ${index + 1}: ${response.name}

**Agent Type:** ${response.agentType}
**Date:** ${response.completionDate}
**Customer Words:** ${response.customerWords.toLocaleString()}

**Transcript:**
${response.transcript || 'No transcript available'}

---
`;
}).join('\n')}

## Summary Statistics

- **Total Responses:** ${transformedResponses.length}
- **Average Words per Response:** ${Math.round(totalWords / transformedResponses.length).toLocaleString()}
- **Date Range:** ${transformedResponses.length > 0 ? 
  `${transformedResponses[transformedResponses.length - 1].completionDate} to ${transformedResponses[0].completionDate}` : 
  'No responses'}

### Agent Type Breakdown
${Object.entries(
  transformedResponses.reduce((acc, r) => {
    acc[r.agentType] = (acc[r.agentType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)
).map(([agentType, count]) => `- **${agentType}:** ${count} responses`).join('\n')}

---

*This document contains raw interview transcripts for LLM analysis. The data has been exported from the interview responses system and formatted for optimal processing by language models.*
`;

    // Generate filename with timestamp and filter info
    let filename = `responses_llm_${timestamp}`;
    
    if (filters.agentType) {
      const agentName = agentsData.find(a => a.id === filters.agentType)?.name || filters.agentType;
      filename += `_${agentName.replace(/\s+/g, '_')}`;
    }
    if (filters.startDate || filters.endDate) {
      filename += `_${filters.startDate || 'start'}_to_${filters.endDate || 'end'}`;
    }
    filename += '.md';

    // Return markdown file
    return new NextResponse(markdownContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error("Failed to generate LLM download:", error);
    return NextResponse.json(
      { error: "Failed to generate LLM file", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 