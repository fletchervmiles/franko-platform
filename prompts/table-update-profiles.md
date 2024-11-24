# Update Table Instructions

Follow these instructions to update  a new table in the database.

## Guidelines

- User ids should be like this `userId: text("user_id").notNull()` because we user Clerk

## Step 1: Update the Schema

This is an example of how to update an existing table in the database.

The table to update is - `profiles-schema.ts`.

This file is located in the `db/schema` folder.

Make sure to export the `profiles-schema.ts` file in the `db/schema/index.ts` file. (This should already be done but let's double check)

Make sure to add the table to the `schema` object in the `db/db.ts` file.

Below is an example of the existing table. The following fields should be added:

**Fields to be added**

- monthly_minutes


```typescript
import { pgEnum, pgTable, text, timestamp, boolean, integer, uuid } from "drizzle-orm/pg-core";

export const membershipEnum = pgEnum("membership", ["free", "pro"]);

export const profilesTable = pgTable("profiles", {
  id: uuid("id").defaultRandom().notNull(),
  userId: text("user_id").primaryKey().notNull(),
  email: text("email"),
  companyName: text("company_name"),
  membership: membershipEnum("membership").default("free").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  firstName: text("first_name"),
  secondName: text("second_name"),
  companyUrl: text("company_url"),
  companyDescription: text("company_description"),
  companyDescriptionCompleted: boolean("company_description_completed").default(false),
  minutesTotalUsed: integer("minutes_total_used").default(0),
  minutesUsedThisMonth: integer("minutes_used_this_month").default(0),
  minutesAvailable: integer("minutes_available").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  agentInterviewerName: text("agent_interviewer_name"),
  voiceId: text("voice_id")
});

export type InsertProfile = typeof profilesTable.$inferInsert;
export type SelectProfile = typeof profilesTable.$inferSelect;

```

## Step 2: Update the Queries (as required)

Ensure queries for the table are updated

This existing file is named `profiles-queries.ts`.

This file is located in the `db/queries` folder.

Updated the queries to ensure new fields are available.

```typescript
"use server";

import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { InsertProfile, profilesTable, SelectProfile } from "../schema";

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
    const profile = await db.query.profiles.findFirst({
      where: eq(profilesTable.userId, userId)
    });

    return profile;
  } catch (error) {
    console.error("Error getting profile by user ID:", error);
    throw new Error("Failed to get profile");
  }
};

export const getAllProfiles = async (): Promise<SelectProfile[]> => {
  return db.query.profiles.findMany();
};

export const updateProfile = async (userId: string, data: Partial<InsertProfile>) => {
  try {
    const [updatedProfile] = await db.update(profilesTable).set(data).where(eq(profilesTable.userId, userId)).returning();
    return updatedProfile;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw new Error("Failed to update profile");
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
```

## Step 3: Update the Actions

The actions already exist for the table - these will need to be updated as needed.

This file is named `profiles-actions.ts`. It's located in the `/actions` folder

```typescript
"use server";

import { createProfile, deleteProfile, getAllProfiles, getProfileByUserId, updateProfile } from "@/db/queries/profiles-queries";
import { InsertProfile } from "@/db/schema/profiles-schema";
import { ActionState } from "@/types";
import console from "console";
import { revalidatePath } from "next/cache";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function createProfileAction(data: InsertProfile): Promise<ActionState> {
  try {
    const newProfile = await createProfile(data);
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

    const profileData: Partial<InsertProfile> = {
      firstName: user.firstName || undefined,
      secondName: user.lastName || undefined,
      email: user.emailAddresses[0]?.emailAddress || undefined,
    };

    const updatedProfile = await updateProfile(user.id, profileData);
    
    return { 
      status: "success", 
      message: "Profile synced with Clerk", 
      data: updatedProfile 
    };
  } catch (error) {
    console.error("Error syncing profile:", error);
    return { status: "error", message: "Failed to sync profile" };
  }
}
```

## Step 4: Generate the SQL file and Migrate the DB

```bash
npm run db:generate
npm run db:migrate
```