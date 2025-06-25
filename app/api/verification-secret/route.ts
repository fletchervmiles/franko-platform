import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/db';
import { profilesTable } from '@/db/schema/profiles-schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

function generateSecret() {
  return crypto.randomBytes(32).toString('hex');
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // fetch profile
    const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.userId, userId));

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // if missing secret, generate one and save
    let secret = profile.verificationSecret;
    if (!secret) {
      secret = generateSecret();
      await db
        .update(profilesTable)
        .set({ verificationSecret: secret, updatedAt: new Date() })
        .where(eq(profilesTable.userId, userId));
    }

    return NextResponse.json({ verificationSecret: secret });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch secret', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newSecret = generateSecret();
    await db
      .update(profilesTable)
      .set({ verificationSecret: newSecret, updatedAt: new Date() })
      .where(eq(profilesTable.userId, userId));

    return NextResponse.json({ verificationSecret: newSecret });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to regenerate secret', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
} 