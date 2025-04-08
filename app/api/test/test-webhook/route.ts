import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This route handles POST requests to /api/test/test-webhook
export async function POST(request: NextRequest) {
  console.log("=== Test Webhook Received ===");

  try {
    // 1. Log Headers
    console.log("Headers:");
    request.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    // 2. Read and Log Raw Body (important for signature verification debugging)
    const rawBody = await request.text();
    console.log("\nRaw Body:");
    console.log(rawBody);

    // 3. Attempt to Parse and Log JSON Body
    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
      console.log("\nParsed JSON Body:");
      console.log(JSON.stringify(parsedBody, null, 2)); // Pretty print JSON
    } catch (parseError) {
      console.error("\nError parsing JSON body:", parseError);
      // If parsing fails, log the raw body again just in case
      console.log("Raw Body (on parse error):", rawBody);
    }

    console.log("=== End Test Webhook ===");

    // 4. Send Success Response
    return NextResponse.json({ message: 'Webhook received successfully' }, { status: 200 });

  } catch (error: any) {
    console.error("!!! Error processing test webhook:", error);
    return NextResponse.json({ error: 'Failed to process webhook', details: error.message }, { status: 500 });
  }
}

// Optional: Handle other methods if needed, otherwise they default to 405 Method Not Allowed
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'GET method not allowed for test webhook. Use POST.' }, { status: 405 });
}
