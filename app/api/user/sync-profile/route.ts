import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getProfileByUserId, createProfile, updateProfile } from "@/db/queries/profiles-queries";
import { processOrganisationFromEmail } from "@/utils/email-utils";
import { sendWelcomeEmail, sendAdminNotification } from "@/lib/email-service";
import { PLAN_RESPONSES, PLAN_INTERNAL_CHAT_QUERIES, PLAN_CHAT_INSTANCE_GENERATIONS } from "@/lib/stripe";
import type { InsertProfile } from "@/db/schema/profiles-schema";

export const dynamic = 'force-dynamic';

// Blocked personal email domains
const BLOCKED_DOMAINS = [
  'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
  'icloud.com', 'aol.com', 'protonmail.com', 'tutanota.com',
  'mail.com', 'yandex.com', 'zoho.com'
];

function isPersonalEmail(email: string): boolean {
  if (!email) return false;
  const domain = email.split('@')[1]?.toLowerCase();
  return BLOCKED_DOMAINS.includes(domain);
}

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log(`🔄 Profile sync starting for user: ${userId}`);

    // Get user from Clerk
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found in Clerk" },
        { status: 404 }
      );
    }

    const email = user.emailAddresses[0]?.emailAddress;
    console.log(`📧 User email: ${email}`);

    // Block personal email domains
    if (email && isPersonalEmail(email)) {
      console.log(`🚫 Personal email domain detected: ${email} - blocking account creation`);
      
      // Delete the Clerk user since we won't create a profile
      try {
        await clerk.users.deleteUser(userId);
        console.log(`🗑️ Deleted Clerk user: ${userId}`);
      } catch (deleteError) {
        console.error(`❌ Failed to delete Clerk user: ${deleteError}`);
      }
      
      return NextResponse.json(
        { 
          error: "Personal email addresses are not allowed. Please sign up with a business email address.",
          shouldRedirect: true,
          redirectUrl: "/sign-up"
        },
        { status: 403 }
      );
    }

    // Check if profile already exists
    let existingProfile;
    try {
      existingProfile = await getProfileByUserId(userId);
      console.log(`👤 Existing profile: ${existingProfile ? 'Found' : 'Not found'}`);
    } catch (error) {
      console.log(`⚠️ Error checking existing profile: ${error}`);
    }

    const profileData: Partial<InsertProfile> = {
      userId: user.id,
      firstName: user.firstName || undefined,
      secondName: user.lastName || undefined,
      // Only sync email if this is not a demo account
      ...(existingProfile?.isDemoAccount ? {} : { email: email || undefined }),
      membership: existingProfile?.membership || "free",
      totalResponsesQuota: existingProfile?.totalResponsesQuota || PLAN_RESPONSES.free,
      totalInternalChatQueriesQuota: existingProfile?.totalInternalChatQueriesQuota || PLAN_INTERNAL_CHAT_QUERIES.free,
      totalChatInstanceGenerationsQuota: existingProfile?.totalChatInstanceGenerationsQuota || PLAN_CHAT_INSTANCE_GENERATIONS.free,
      totalResponsesAvailable: existingProfile?.totalResponsesAvailable || PLAN_RESPONSES.free,
      totalInternalChatQueriesAvailable: existingProfile?.totalInternalChatQueriesAvailable || PLAN_INTERNAL_CHAT_QUERIES.free,
      totalChatInstanceGenerationsAvailable: existingProfile?.totalChatInstanceGenerationsAvailable || PLAN_CHAT_INSTANCE_GENERATIONS.free,
    };

    // Preserve existing organisation data if it exists
    if (existingProfile?.organisationName && existingProfile?.organisationUrl) {
      console.log(`🏢 Preserving existing organisation data`);
      profileData.organisationName = existingProfile.organisationName;
      profileData.organisationUrl = existingProfile.organisationUrl;
      profileData.organisationDescription = existingProfile.organisationDescription;
      profileData.organisationDescriptionCompleted = existingProfile.organisationDescriptionCompleted;
    } else if (email) {
      // Only use email-derived org data if we don't have existing data
      console.log(`🏢 Deriving organisation from email: ${email}`);
      const orgData = processOrganisationFromEmail(email);
      if (orgData.organisationName && orgData.organisationUrl) {
        console.log(`🏢 Derived org data: ${orgData.organisationName}, ${orgData.organisationUrl}`);
        profileData.organisationName = orgData.organisationName;
        profileData.organisationUrl = orgData.organisationUrl;
      }
    }

    let result;
    let isNewUser = false;

    if (!existingProfile) {
      console.log(`➕ Creating new profile`);
      result = await createProfile(profileData as InsertProfile);
      isNewUser = true;
      console.log(`✅ Profile created successfully`);
      
      // Send welcome email for new profiles
      if (email && profileData.firstName) {
        try {
          console.log(`📧 Sending welcome email to: ${email}`);
          await sendWelcomeEmail(email, profileData.firstName);
          
          console.log(`📧 Sending admin notification`);
          await sendAdminNotification(
            profileData.firstName || "", 
            profileData.secondName || undefined, 
            email
          );
          console.log(`✅ Emails sent successfully`);
        } catch (emailError) {
          console.error(`❌ Failed to send emails:`, emailError);
          // Don't fail the profile creation if email sending fails
        }
      }
    } else {
      console.log(`🔄 Updating existing profile`);
      result = await updateProfile(userId, profileData);
      console.log(`✅ Profile updated successfully`);
    }

    return NextResponse.json({
      success: true,
      message: isNewUser ? "Profile created and synced with Clerk" : "Profile synced with Clerk",
      isNewUser,
      profile: result
    });

  } catch (error) {
    console.error(`❌ Error syncing profile:`, error);
    return NextResponse.json(
      { error: "Failed to sync profile" },
      { status: 500 }
    );
  }
} 