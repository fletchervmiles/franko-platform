"use server";

import { db } from "@/db/db";
import { eq, sql } from "drizzle-orm";
import { InsertProfile, profilesTable, SelectProfile } from "../schema";
import { logger } from '@/lib/logger';
import { safeStringify } from '@/utils/db-utils';

export const createProfile = async (data: InsertProfile) => {
  try {
    const [newProfile] = await db.insert(profilesTable).values(data).returning();
    return newProfile;
  } catch (error) {
    console.error("Error creating profile:", error);
    throw new Error("Failed to create profile");
  }
};

export const getProfileByUserId = async (userId: string) => {
  try {
    logger.info(`Attempting to fetch profile for userId: ${userId}`);
    
    // Validate connection before query
    try {
      // Simple check if DB is available
      await db.select({ count: sql`1` });
      logger.info(`DB connection test succeeded`);
    } catch (connError) {
      logger.error(`DB connection test failed:`, {
        error: connError instanceof Error ? connError.message : String(connError),
        stack: connError instanceof Error ? connError.stack : undefined
      });
    }
    
    const profile = await db.query.profiles.findFirst({
      where: eq(profilesTable.userId, userId),
      orderBy: profilesTable.updatedAt
    });

    logger.info(`Profile fetch result:`, { 
      userId, 
      found: !!profile,
      profileId: profile?.id || null
    });

    return profile;
  } catch (error) {
    logger.error(`Error getting profile by user ID: ${userId}`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      userId
    });
    throw new Error("Failed to get profile");
  }
};

export const getAllProfiles = async (): Promise<SelectProfile[]> => {
  return db.query.profiles.findMany();
};

export const updateProfile = async (userId: string, data: Partial<InsertProfile>) => {
  try {
    const updatedProfile = await db
      .update(profilesTable)
      .set(data)
      .where(eq(profilesTable.userId, userId))
      .returning();
    
    if (!updatedProfile || updatedProfile.length === 0) {
      logger.error("No profile was updated for userId:", userId);
      throw new Error("Profile update failed - no rows updated");
    }
    
    logger.info("Profile successfully updated:", {
      userId: updatedProfile[0]?.userId,
      id: updatedProfile[0]?.id?.toString(),
    });
    return updatedProfile;
  } catch (error) {
    logger.error("Error updating profile:", {
      userId,
      data,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
};

export const updateProfileByStripeCustomerId = async (stripeCustomerId: string, data: Partial<InsertProfile>) => {
  try {
    const [updatedProfile] = await db.update(profilesTable).set(data).where(eq(profilesTable.stripeCustomerId, stripeCustomerId)).returning();
    return updatedProfile;
  } catch (error) {
    console.error("Error updating profile by stripe customer ID:", error);
    throw new Error("Failed to update profile");
  }
};

export const deleteProfile = async (userId: string) => {
  try {
    await db.delete(profilesTable).where(eq(profilesTable.userId, userId));
  } catch (error) {
    console.error("Error deleting profile:", error);
    throw new Error("Failed to delete profile");
  }
};

export async function getProfile(userId: string) {
  try {
    const [profile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.userId, userId))
      .limit(1);
    
    return profile || null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}


// this defines the queries for the profiles table
// it defines the functions that can be used to interact with the profiles table
// it uses drizzle's query API to interact with the database

