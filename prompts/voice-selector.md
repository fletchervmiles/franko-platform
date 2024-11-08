# Task Instructions for Updating Voice Selector Component

## Overview
You are tasked with updating the `voice-selector.tsx` component (located in `components/custom-ui/voice-selection.tsx`). This components is being used at `app/account/page.tsx`.

The main objective is to link audio samples, save selected voice data to the database, and ensure the functionality for both saving and editing voice selections is properly integrated. Below are the detailed steps and context to guide you through this task.

## Task Details

### Step 1: Link Audio Files to Play Buttons
1. **Objective**: Ensure that the four provided audio files are linked to the play buttons within the `voice-selector.tsx` component.

2. **Audio Options**:
   - American Female 
        - \audio\american-female-francesca.mp3
        - agent_interviewer_name: francesca
        - voice_id: tnSpp4vdxKPjI9w0GnoV
   - American Male 
        - \audio\american-male-jim.mp3
        - agent_interviewer_name: jim
        - voice_id: UgBBYS2sOqTuMpoF3BR0
   - Australian Male 
        - \audio\australian-male-charlie.mp3
        - agent_interviewer_name: charlie
        - voice_id: IKne3meq5aSn9XLyUdCD
   - British Female 
        - \audio\british-female-amelia.mp3
        - agent_interviewer_name: amelia
        - voice_id: ZF6FPAbjXT4488VcRRnw

3. **Actions**:
   - Integrate the audio file paths with their corresponding play buttons.
   - Ensure that the correct audio file plays when the play button is clicked.


### Step 2: Save Voice Selection to the Profiles Schema
1. **Objective**: Update the application so that when a user selects a voice and clicks the save button, the `agent_interviewer_name` and `voice_id` are stored in the profiles table.
2. **Data to Save**:
   - **agent_interviewer_name** (a string value representing the name of the agent)
   - **voice_id** (a numeric value representing the selected voice ID)

3. **Required Updates**:
   - **Profile Schema**: Modify the schema to include `agent_interviewer_name` and `voice_id` fields.

The profile schema is located in `db/shema/profiles-schema.ts`. 

This is the current code:

```
import { pgEnum, pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const membershipEnum = pgEnum("membership", ["free", "pro"]);

export const profilesTable = pgTable("profiles", {
  userId: text("user_id").primaryKey().notNull(),
  email: text("email"),
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
    .$onUpdate(() => new Date())
});

export type InsertProfile = typeof profilesTable.$inferInsert;
export type SelectProfile = typeof profilesTable.$inferSelect;
```


   - **Profiles Queries**: Ensure queries are updated to handle these new fields.

These are located in `db/queries/profile-queries`

This is the current code:

```
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

   - **Profiles Actions**: Check and update the logic in actions associated with profile management.

Finally, profile actions. These are located `actions/profiles-actions.ts`. 

This is the current code:

```
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


4. **Database Migration**:

Will also need to generate the SQL file and Migrate the DB

Probably the following once the updates have been made.

```bash
npm run db:generate
npm run db:migrate
```

### Step 3: Implement Save and Edit Functionality

1. **Objective**: Ensure that the component correctly saves and updates the selected voice values in the database.

2. **Functionality Details**:
   - When a voice is selected and the save button is clicked, store `agent_interviewer_name` and `voice_id` in the profiles table.
   - If a user edits their voice selection and clicks the save button again, update the existing values in the database.
   - This will need to be reflexed in the `voice-selectior.tsx` component.

3. **Actions**:
   - Link the save action to the database update logic.
   - Ensure that the edit functionality properly modifies the existing records.

