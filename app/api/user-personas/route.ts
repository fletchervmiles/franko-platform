import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server"; // Assuming Clerk for auth, replace if different
import { db } from "@/db/db";
import { getUserPersonas } from "@/db/queries/user-personas-queries";
import { createUserPersona } from "@/db/actions/user-personas-actions";
import { chatResponsesTable, userPersonasTable } from "@/db/schema";
import { eq, and, count, sql } from "drizzle-orm";
import type { Persona } from "@/contexts/persona-context"; // Import frontend type

// Configure Vercel serverless function timeout (Pro plan allows longer timeouts)
export const maxDuration = 120; // 2 minutes
export const dynamic = 'force-dynamic';

// GET - Fetch all personas for the user with calculated fields
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch base persona definitions
    const personaDefinitions = await getUserPersonas(userId);

    // 2. Fetch interview counts for each persona for this user
    const counts = await db
      .select({
        personaName: chatResponsesTable.persona,
        interviewCount: count(chatResponsesTable.id),
        // Add calculation for veryDisappointedPercentage here (e.g., using countif or filter)
        // Example (needs adjustment based on pmf_category values):
        // veryDisappointedCount: count(sql`CASE WHEN ${chatResponsesTable.pmf_category} = 'Very Disappointed' THEN 1 ELSE NULL END`)
      })
      .from(chatResponsesTable)
      .where(and(
         eq(chatResponsesTable.userId, userId),
         sql`${chatResponsesTable.persona} != 'UNCLASSIFIED'` // Exclude unclassified
      ))
      .groupBy(chatResponsesTable.persona);

    const countsMap = new Map<string, { interviewCount: number; /* veryDisappointedCount: number; */ }>();
    counts.forEach(row => {
      countsMap.set(row.personaName, { 
          interviewCount: row.interviewCount, 
          /* veryDisappointedCount: row.veryDisappointedCount */ 
      });
    });

    // 3. Map definitions to the frontend Persona type, adding calculated fields
    const personas: Persona[] = personaDefinitions.map(p => {
      const stats = countsMap.get(p.personaName) || { interviewCount: 0, /* veryDisappointedCount: 0 */ };
      const interviewCount = stats.interviewCount;
      // const veryDisappointedCount = stats.veryDisappointedCount;
      // const veryDisappointedPercentage = interviewCount > 0 ? Math.round((veryDisappointedCount / interviewCount) * 100) : 0;
      const veryDisappointedPercentage = 0; // Placeholder - IMPLEMENT CALCULATION
      const confidenceLevel = null; // Placeholder - IMPLEMENT CALCULATION/LOGIC
      const isActive = true; // Assuming fetched personas are active
      const isCustomized = p.createdAt?.getTime() !== p.updatedAt?.getTime(); // Basic customization check

      return {
        id: p.id,
        label: p.personaName,
        description: p.personaDescription || "", // Ensure description is not null
        interviewCount,
        veryDisappointedPercentage, // Replace placeholder
        confidenceLevel, // Replace placeholder
        isActive,
        isCustomized,
      };
    });

    return NextResponse.json(personas);

  } catch (error) {
    console.error("Error fetching user personas:", error);
    return NextResponse.json({ error: "Failed to fetch personas" }, { status: 500 });
  }
}

// POST - Create a new persona
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { label, description } = body;

    if (!label || typeof label !== "string") {
      return NextResponse.json({ error: "Label is required" }, { status: 400 });
    }

    // Basic validation on description if needed
    const desc = description && typeof description === "string" ? description : undefined;

    const newPersonaDef = await createUserPersona(userId, label, desc);

    // Map to frontend type (with initial calculated values)
    const newPersona: Persona = {
        id: newPersonaDef.id,
        label: newPersonaDef.personaName,
        description: newPersonaDef.personaDescription || "",
        interviewCount: 0,
        veryDisappointedPercentage: 0,
        confidenceLevel: null,
        isActive: true,
        isCustomized: false, // Newly created is not customized yet
    };

    return NextResponse.json(newPersona, { status: 201 });

  } catch (error) {
    console.error("Error creating user persona:", error);
    // Handle specific errors like duplicate name or max limit from action
    if (error instanceof Error && (error.message.includes("already exists") || error.message.includes("maximum allowed"))) {
        return NextResponse.json({ error: error.message }, { status: 409 }); // Conflict
    }
    return NextResponse.json({ error: "Failed to create persona" }, { status: 500 });
  }
} 