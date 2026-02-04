// app/api/gemini/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('[Gemini API Route] GEMINI_API_KEY is not set in environment variables');
}

export async function POST(req: NextRequest) {
  // ─── Early exit if key missing ───
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Server configuration error: API key unavailable' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { query, systemPrompt = '', stream = false } = body;

    // ─── Input validation ───
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Valid "query" string is required' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash', // or gemini-1.5-pro / gemini-2.0-flash etc.
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        // Add more if desired
      ],
      systemInstruction: systemPrompt.trim() || undefined,
    });

    if (stream) {
      // ─── Streaming response (recommended for UX) ───
      const streamResult = await model.generateContentStream(query);

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamResult.stream) {
              const text = chunk.text();
              if (text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (err) {
            controller.error(err);
          }
        },
      });

      return new NextResponse(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // ─── Non-streaming (classic) ───
    const result = await model.generateContent(query);

    const text = result.response.text();

    return NextResponse.json({ response: text }, { status: 200 });

  } catch (err: any) {
    console.error('[Gemini API Route] Error:', {
      message: err.message,
      stack: err.stack?.slice(0, 300),
      code: err.code,
      status: err.status,
    });

    const status = err.status || 500;
    let message = 'Internal server error';

    if (err.status === 429) {
      message = 'Rate limit exceeded – please try again in a few moments';
    } else if (err.status === 400 || err.status === 403) {
      message = err.message || 'Invalid request to Gemini API';
    }

    return NextResponse.json({ error: message }, { status });
  }
}

// Optional: Add HEAD/OPTIONS for CORS preflight if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
