import { auth } from "@clerk/nextjs/server";
import { checkUserSubscription } from "@/utils/auth-checks";
import { redirect } from "next/navigation";

export default async function ProtectedFeature() {
    const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }
  
  const { isSubscribed } = await checkUserSubscription(userId);
  if (!isSubscribed) {
    redirect("/pricing");
  }
  
  return (
    <div>
      {/* Protected feature content */}
    </div>
  );
} 