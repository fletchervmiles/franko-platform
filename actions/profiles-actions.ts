"use server";

import { createProfile, deleteProfile, getAllProfiles, getProfileByUserId, updateProfile } from "@/db/queries/profiles-queries";
import { InsertProfile } from "@/db/schema/profiles-schema";
import { ActionState } from "@/types";
import console from "console";
import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { safeAuth } from "@/lib/utils/safe-auth";
import { processOrganisationFromEmail } from "@/utils/email-utils";
import { sendWelcomeEmail, sendAdminNotification } from "@/app/api/send/route";
import { PLAN_RESPONSES, PLAN_INTERNAL_CHAT_QUERIES, PLAN_CHAT_INSTANCE_GENERATIONS } from "@/lib/stripe";

export async function createProfileAction(data: InsertProfile): Promise<ActionState> {
  try {
    const newProfile = await createProfile(data);
    revalidatePath("/profile");
    
    // Send welcome email if we have the necessary data
    if (data.email && data.firstName) {
      try {
        await sendWelcomeEmail(data.email, data.firstName);
        console.log("Welcome email sent to:", data.email);
        
        // Send admin notification
        await sendAdminNotification(
          data.firstName, 
          data.secondName || undefined, 
          data.email
        );
        console.log("Admin notification sent for new user:", data.email);
      } catch (emailError) {
        console.error("Failed to send emails:", emailError);
        // Don't fail the profile creation if email sending fails
      }
    }
    
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
    console.log("Starting profile sync with Clerk");
    const authResult = await safeAuth();
    const userId = authResult.userId;

    if (!userId) {
      console.log("No user ID found in auth result");
      return { status: "error", message: "No user ID found" };
    }
    console.log(`Auth successful, found userId: ${userId}`);

    const clerk = await clerkClient();
    console.log("Clerk client initialized");
    
    try {
      const user = await clerk.users.getUser(userId);
      if (!user) {
        console.log(`No user found for userId: ${userId}`);
        return { status: "error", message: "No user found" };
      }
      console.log(`Retrieved Clerk user: ${user.id}, first name: ${user.firstName || 'not set'}`);

      const email = user.emailAddresses[0]?.emailAddress;
      console.log(`User email: ${email || 'not available'}`);
      
      // Get existing profile
      console.log(`Checking for existing profile for userId: ${userId}`);
      let existingProfile;
      try {
        existingProfile = await getProfileByUserId(userId);
        console.log(`Profile check result: ${existingProfile ? 'Found existing profile' : 'No profile found'}`);
      } catch (profileError) {
        console.error(`Error retrieving existing profile:`, profileError);
        throw new Error(`Failed to check existing profile: ${profileError instanceof Error ? profileError.message : String(profileError)}`);
      }
      
      const profileData: Partial<InsertProfile> = {
        userId: user.id,
        firstName: user.firstName || undefined,
        secondName: user.lastName || undefined,
        email: email || undefined,
        membership: existingProfile?.membership || "free",
        totalResponsesQuota: existingProfile?.totalResponsesQuota || PLAN_RESPONSES.free,
        totalInternalChatQueriesQuota: existingProfile?.totalInternalChatQueriesQuota || PLAN_INTERNAL_CHAT_QUERIES.free,
        totalChatInstanceGenerationsQuota: existingProfile?.totalChatInstanceGenerationsQuota || PLAN_CHAT_INSTANCE_GENERATIONS.free,
        totalResponsesAvailable: existingProfile?.totalResponsesAvailable || PLAN_RESPONSES.free,
        totalInternalChatQueriesAvailable: existingProfile?.totalInternalChatQueriesAvailable || PLAN_INTERNAL_CHAT_QUERIES.free,
        totalChatInstanceGenerationsAvailable: existingProfile?.totalChatInstanceGenerationsAvailable || PLAN_CHAT_INSTANCE_GENERATIONS.free,
      };
      console.log("Prepared profile data:", JSON.stringify(profileData, null, 2));

      // Preserve existing organisation data if it exists
      if (existingProfile?.organisationName && existingProfile?.organisationUrl) {
        console.log("Preserving existing organisation data");
        profileData.organisationName = existingProfile.organisationName;
        profileData.organisationUrl = existingProfile.organisationUrl;
        profileData.organisationDescription = existingProfile.organisationDescription;
        profileData.organisationDescriptionCompleted = existingProfile.organisationDescriptionCompleted;
      } else if (email) {
        // Only use email-derived org data if we don't have existing data
        console.log(`Processing organisation from email: ${email}`);
        const orgData = processOrganisationFromEmail(email);
        if (orgData.organisationName && orgData.organisationUrl) {
          console.log(`Derived org data: ${orgData.organisationName}, ${orgData.organisationUrl}`);
          profileData.organisationName = orgData.organisationName;
          profileData.organisationUrl = orgData.organisationUrl;
        }
      }

      let result;
      if (!existingProfile) {
        console.log("Creating new profile");
        try {
          result = await createProfile(profileData as InsertProfile);
          console.log("Profile created successfully:", result ? result.id : 'unknown');
        } catch (createError) {
          console.error("Error creating profile:", createError);
          throw new Error(`Failed to create profile: ${createError instanceof Error ? createError.message : String(createError)}`);
        }
        
        // Send welcome email for new profiles
        if (email && profileData.firstName) {
          try {
            console.log(`Sending welcome email to: ${email}`);
            await sendWelcomeEmail(email, profileData.firstName);
            console.log("Welcome email sent successfully");
            
            // Send admin notification
            console.log("Sending admin notification");
            await sendAdminNotification(
              profileData.firstName || "", 
              profileData.secondName || undefined, 
              email
            );
            console.log("Admin notification sent successfully");
          } catch (emailError) {
            console.error("Failed to send emails:", emailError);
            // Don't fail the profile creation if email sending fails
          }
        }
      } else {
        console.log(`Updating existing profile for user: ${user.id}`);
        try {
          result = await updateProfile(user.id, profileData);
          console.log("Profile updated successfully");
        } catch (updateError) {
          console.error("Error updating profile:", updateError);
          throw new Error(`Failed to update profile: ${updateError instanceof Error ? updateError.message : String(updateError)}`);
        }
      }
      
      return { 
        status: "success", 
        message: existingProfile ? "Profile synced with Clerk" : "Profile created and synced with Clerk", 
        data: result 
      };
    } catch (clerkError) {
      console.error("Error in Clerk operations:", clerkError);
      return { status: "error", message: `Clerk error: ${clerkError instanceof Error ? clerkError.message : String(clerkError)}` };
    }
  } catch (error) {
    console.error("Error syncing profile:", error);
    return { status: "error", message: `Failed to sync profile: ${error instanceof Error ? error.message : String(error)}` };
  }
}