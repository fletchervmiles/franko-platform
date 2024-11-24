import { auth } from "@clerk/nextjs/server";
import { checkUserSubscription } from "@/utils/auth-checks";

export async function POST(req: Request) {
    const { userId } = await auth();
  
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  
  const { isSubscribed } = await checkUserSubscription(userId);
  if (!isSubscribed) {
    return new Response("Subscription required", { status: 403 });
  }
  
  // Handle the protected route logic...
} 