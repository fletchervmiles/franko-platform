import { tavily } from "@tavily/core";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    const tvly = tavily({ apiKey: process.env.TAVILY_KEY });
    
    const response = await tvly.extract([url]);
    
    if (response.results && response.results.length > 0) {
      return Response.json({ 
        success: true, 
        content: response.results[0].rawContent
      });
    } else {
      return Response.json({ 
        success: false, 
        error: "Unfortunately this URL is incompatible with our search engine. Please enter your details manually or ask ChatGPT to generate a description for you. Apologies for the inconvenience."
      });
    }

  } catch (error) {
    console.error('Tavily API Error:', error);
    return Response.json({ 
      success: false, 
      error: "Unfortunately this URL is incompatible with our search engine. Please enter your details manually or ask ChatGPT to generate a description for you. Apologies for the inconvenience."
    });
  }
} 