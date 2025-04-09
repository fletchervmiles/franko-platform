import { NextResponse } from "next/server";

export async function GET(request: Request) {
  console.log("CRON JOB ENDPOINT HIT! Timestamp:", new Date().toISOString());

  // You can optionally add back the auth check here JUST to test if the secret is the issue
  // const authHeader = request.headers.get('authorization');
  // const VERCEL_CRON_SECRET = process.env.CRON_SECRET || '';
  // if (!VERCEL_CRON_SECRET || authHeader !== `Bearer ${VERCEL_CRON_SECRET}`) {
  //   console.error("CRON JOB UNAUTHORIZED!", { hasSecret: !!VERCEL_CRON_SECRET, header: authHeader });
  //   return new NextResponse("Unauthorized", { status: 401 });
  // }
  // console.log("CRON JOB AUTHORIZED!");

  return NextResponse.json({ status: "ok", message: "Cron job endpoint reached successfully." });
}