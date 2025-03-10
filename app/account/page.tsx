
import { auth } from "@clerk/nextjs/server"
import { getProfile } from "@/db/queries/profiles-queries"
import { redirect } from "next/navigation"

export default async function AccountPage() {
    const { userId } = await auth()
    
    if (!userId) {
        redirect("/sign-in")
    }

    const profile = await getProfile(userId)
    

}

