import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { updateProfile, getProfile } from "@/db/queries/profiles-queries"; // Assuming getProfile exists
import { logger } from "@/lib/logger";
import { profilesTable } from "@/db/schema/profiles-schema"; // Import for type definition
import { updateOnboardingStep } from "@/db/queries/user-onboarding-status-queries"; // <<<--- ADDED IMPORT

export const dynamic = 'force-dynamic'; // Ensure dynamic execution for file handling

export async function PATCH(request: Request) {
  const requestTimestamp = new Date().toISOString();
  logger.info(`Branding PATCH request received at ${requestTimestamp}`);

  try {
    const formData = await request.formData();
    const userId = formData.get("userId") as string;
    const buttonColor = formData.get("buttonColor") as string | null;
    const titleColor = formData.get("titleColor") as string | null;
    const logoFile = formData.get("logo") as File | null;

    if (!userId) {
      logger.error('Missing userId in branding update request');
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    logger.info('Processing branding update for user:', { userId, hasButtonColor: !!buttonColor, hasTitleColor: !!titleColor, hasLogoFile: !!logoFile });

    const updateData: Partial<typeof profilesTable.$inferInsert> = {};
    let uploadedLogoUrl: string | null = null;

    // 1. Handle Logo Upload (if provided)
    if (logoFile) {
      if (!(logoFile instanceof File)) {
        logger.error('Invalid logo data received, not a file:', { userId });
        return NextResponse.json({ success: false, error: "Invalid logo file provided" }, { status: 400 });
      }

      // Optional: Add file size/type validation here
      // e.g., if (logoFile.size > MAX_SIZE) { ... }
      // e.g., if (!ALLOWED_TYPES.includes(logoFile.type)) { ... }

      const filename = `logos/${userId}-${Date.now()}-${logoFile.name}`;
      logger.info(`Attempting to upload logo to Vercel Blob: ${filename}`, { userId });

      try {
        const blob = await put(filename, logoFile, {
          access: 'public',
          // Vercel Blob SDK reads the token from process.env.BLOB_READ_WRITE_TOKEN
          // Ensure this variable is set in your Vercel project environment variables
        });
        uploadedLogoUrl = blob.url;
        updateData.logoUrl = uploadedLogoUrl;
        logger.info('Logo uploaded successfully:', { userId, url: uploadedLogoUrl });
      } catch (uploadError) {
        logger.error('Vercel Blob upload failed:', { userId, error: uploadError });
        return NextResponse.json({ success: false, error: "Failed to upload logo" }, { status: 500 });
      }
    }

    // 2. Handle Color Updates (if provided)
    if (buttonColor !== null) {
      // Optional: Add hex color validation here
      updateData.buttonColor = buttonColor;
      logger.debug('Adding buttonColor to updateData:', { userId, buttonColor });
    }
    if (titleColor !== null) {
      // Optional: Add hex color validation here
      updateData.titleColor = titleColor;
      logger.debug('Adding titleColor to updateData:', { userId, titleColor });
    }

    // 3. Update Profile if there's data to update
    if (Object.keys(updateData).length === 0) {
      logger.warn('No branding data provided for update:', { userId });
      // If only a logo was sent but failed upload, uploadedLogoUrl is null, updateData is empty.
      // If colors were sent, updateData is not empty.
      // If only logo was sent and succeeded, updateData.logoUrl exists.
      // If nothing was sent, updateData is empty.
      // Decide if this is an error or just nothing to do. Let's return success=true but indicate no changes.
      const currentProfile = await getProfile(userId); // Fetch current data
      return NextResponse.json({
        success: true,
        message: "No new branding information provided to update.",
        profile: currentProfile ? { // Return current values
          logoUrl: currentProfile.logoUrl,
          buttonColor: currentProfile.buttonColor,
          titleColor: currentProfile.titleColor,
        } : null
      });
    }

    logger.info('Updating profile with branding data:', { userId, updateData });
    const updatedProfileResult = await updateProfile(userId, updateData);

    if (!updatedProfileResult || updatedProfileResult.length === 0) {
      // This might happen if the userId doesn't exist, though updateProfile might throw earlier
      logger.error('Profile update seemed to fail (no results returned):', { userId });
      return NextResponse.json({ success: false, error: "Failed to update profile branding" }, { status: 500 });
    }

    const updatedProfile = updatedProfileResult[0];
    logger.info('Branding update successful for user:', { userId });

    // <<<--- ADDED ONBOARDING UPDATE for Step 2 --->>>
    // Update onboarding status regardless of which branding field was updated
    await updateOnboardingStep(userId, 'step2BrandingComplete');
    logger.info(`Updated onboarding step 2 (Branding) for user ${userId}`);
    // <<<--- END ADDED ONBOARDING UPDATE --->>>

    // Return the relevant updated fields
    return NextResponse.json({
      success: true,
      profile: {
        logoUrl: updatedProfile.logoUrl,
        buttonColor: updatedProfile.buttonColor,
        titleColor: updatedProfile.titleColor,
      }
    });

  } catch (error) {
    logger.error('Error processing branding update request:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ success: false, error: "Internal server error processing branding update" }, { status: 500 });
  }
}
