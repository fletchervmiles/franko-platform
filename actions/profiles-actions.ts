"use server";

import { createProfile, deleteProfile, getAllProfiles, getProfileByUserId, updateProfile } from "@/db/queries/profiles-queries";
import { InsertProfile } from "@/db/schema/profiles-schema";
import { ActionState } from "@/types";
import console from "console";
import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { processOrganisationFromEmail } from "@/utils/email-utils";
import { invalidatePromptCache } from "@/app/(chat)/api/chat/route";

export async function createProfileAction(data: InsertProfile): Promise<ActionState> {
  try {
    const newProfile = await createProfile(data);
    invalidatePromptCache(data.userId);
    revalidatePath("/profile");
    return { status: "success", message: "Profile created successfully", data: newProfile };
  } catch (error) {
    return { status: "error", message: "Failed to create profile" };
  }
}

export async function getProfileByUserIdAction(userId: string): Promise<ActionState> {
  try {
    const profile = await getProfileByUserId(userId);
    return { status: "success", message: "Profile retrieved successfully", data: profile };
  } catch (error) {
    return { status: "error", message: "Failed to get profile" };
  }
}

export async function getAllProfilesAction(): Promise<ActionState> {
  try {
    const profiles = await getAllProfiles();
    return { status: "success", message: "Profiles retrieved successfully", data: profiles };
  } catch (error) {
    return { status: "error", message: "Failed to get profiles" };
  }
}

export async function updateProfileAction(userId: string, data: Partial<InsertProfile>): Promise<ActionState> {
  try {
    const updatedProfile = await updateProfile(userId, data);
    invalidatePromptCache(userId);
    revalidatePath("/profile");
    return { status: "success", message: "Profile updated successfully", data: updatedProfile };
  } catch (error) {
    return { status: "error", message: "Failed to update profile" };
  }
}

export async function deleteProfileAction(userId: string): Promise<ActionState> {
  try {
    await deleteProfile(userId);
    revalidatePath("/profile");
    return { status: "success", message: "Profile deleted successfully" };
  } catch (error) {
    return { status: "error", message: "Failed to delete profile" };
  }
}

export async function syncClerkProfileAction(): Promise<ActionState> {
  try {
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return { status: "error", message: "No user ID found" };
    }

    const clerk = await clerkClient();
    
    const user = await clerk.users.getUser(userId);
    if (!user) {
      return { status: "error", message: "No user found" };
    }

    const email = user.emailAddresses[0]?.emailAddress;
    
    // Get existing profile
    const existingProfile = await getProfileByUserId(userId);
    
    const profileData: Partial<InsertProfile> = {
      userId: user.id,
      firstName: user.firstName || undefined,
      secondName: user.lastName || undefined,
      email: email || undefined,
      membership: existingProfile?.membership || "free",
      totalResponsesAvailable: existingProfile?.totalResponsesAvailable || 20,
      monthlyResponsesQuota: existingProfile?.monthlyResponsesQuota || 20,
    };

    // Preserve existing organisation data if it exists
    if (existingProfile?.organisationName && existingProfile?.organisationUrl) {
      profileData.organisationName = existingProfile.organisationName;
      profileData.organisationUrl = existingProfile.organisationUrl;
      profileData.organisationDescription = existingProfile.organisationDescription;
      profileData.organisationDescriptionCompleted = existingProfile.organisationDescriptionCompleted;
    } else if (email) {
      // Only use email-derived org data if we don't have existing data
      const orgData = processOrganisationFromEmail(email);
      if (orgData.organisationName && orgData.organisationUrl) {
        profileData.organisationName = orgData.organisationName;
        profileData.organisationUrl = orgData.organisationUrl;
      }
    }

    let result;
    if (!existingProfile) {
      result = await createProfile(profileData as InsertProfile);
    } else {
      result = await updateProfile(user.id, profileData);
    }
    
    // Invalidate cache after sync
    invalidatePromptCache(userId);
    
    return { 
      status: "success", 
      message: existingProfile ? "Profile synced with Clerk" : "Profile created and synced with Clerk", 
      data: result 
    };
  } catch (error) {
    console.error("Error syncing profile:", error);
    return { status: "error", message: "Failed to sync profile" };
  }
}