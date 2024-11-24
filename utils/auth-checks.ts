import { getProfileByUserId } from "@/db/queries/profiles-queries";
import type { SelectProfile } from "@/db/schema/profiles-schema";

export async function checkUserSubscription(userId: string): Promise<{
  isSubscribed: boolean;
  profile: SelectProfile | null;
}> {
  const profile = await getProfileByUserId(userId);
  
  const isSubscribed = profile?.membership === "pro" || profile?.membership === "starter";
  
  return {
    isSubscribed,
    profile: profile || null
  };
} 