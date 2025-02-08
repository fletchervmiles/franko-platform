export const maxDuration = 60; // Configure to maximum 60 seconds
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { content } = await request.json();
    
    // Dynamically import OpenAI
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.chat.completions.create({
      messages: [{ 
        role: 'user', 
        content: `Review this text and create a concise summary (max 200 words) of what this company does, including its main products and services: ${content}`
      }],
      model: 'gpt-4o',
      max_tokens: 300,
    });

    return Response.json({ 
      success: true, 
      description: response.choices[0].message.content 
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    return Response.json({ 
      success: false, 
      error: "Failed to generate description" 
    });
  }
}