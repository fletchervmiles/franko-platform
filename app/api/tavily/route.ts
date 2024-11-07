import { tavily } from "@tavily/core";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    
    // Initialize Tavily client
    const tvly = tavily({ apiKey: process.env.TAVILY_KEY });
    
    // Execute the extract request
    const response = await tvly.extract([url]);
    
    if (response.results && response.results.length > 0) {
      return Response.json({ 
        success: true, 
        content: response.results[0].rawContent
      });
    } else {
      return Response.json({ 
        success: false, 
        error: "No content extracted" 
      });
    }

  } catch (error) {
    console.error('Tavily API Error:', error);
    return Response.json({ 
      success: false, 
      error: "Failed to extract content" 
    });
  }
} 