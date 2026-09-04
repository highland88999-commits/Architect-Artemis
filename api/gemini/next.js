import { GoogleGenerativeAI } from '@google/generative-ai';

// Rewritten as a standard Vercel serverless Node.js handler[span_7](start_span)[span_7](end_span)
export default async function handler(req, res) {
  // --- CORS Preflight & Headers ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error('[Gemini API] Missing GEMINI_API_KEY');
    return res.status(503).json({ error: 'Server configuration error: API key unavailable' });
  }

  try {
    // Safely parse body for Vercel environments
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { query, systemPrompt = '' } = body;

    // --- Input Validation ---
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({ error: 'Valid "query" string is required' });
    }

    // --- Model Initialization & Configuration ---
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.trim());
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.8-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
      systemInstruction: systemPrompt.trim() ? { parts: [{ text: systemPrompt.trim() }] } : undefined,
    });

    // --- Execution ---
    const result = await model.generateContent(query);
    const text = result.response.text();

    return res.status(200).json({ response: text });

  } catch (err) {
    // --- Robust Error Handling ---
    console.error('[Gemini API Route Error]:', {
      message: err.message,
      status: err.status,
      code: err.code
    });

    const status = err.status || 500;
    let message = 'Internal server error';

    if (status === 429) {
      message = 'Rate limit exceeded – please try again in a few moments';
    } else if (status === 400 || status === 403) {
      message = err.message || 'Invalid request to Gemini API';
    }

    return res.status(status).json({ error: message });
  }
}
