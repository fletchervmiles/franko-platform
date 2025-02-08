import { experimental_wrapLanguageModel } from "ai";

export async function GET() {
  console.log("Testing import:", experimental_wrapLanguageModel);
  return new Response(JSON.stringify({ message: "Test" }), {
    headers: { 'Content-Type': 'application/json' },
  });
} 