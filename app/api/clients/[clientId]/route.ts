import { db } from "@/db/db"
import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { profilesTable } from "@/db/schema"

export async function GET(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const companyName = searchParams.get('company')

    const profile = await db.query.profiles.findFirst({
      where: eq(profilesTable.userId, params.clientId),
    })

    if (!profile) {
      return new NextResponse("Client not found", { status: 404 })
    }

    if (companyName && profile.companyName !== decodeURIComponent(companyName)) {
      return new NextResponse("Invalid company", { status: 400 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error("Error fetching client profile:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 