// app/api/gemini/route.ts
import { GoogleGenerativeAI } from '@google/generative-ai';
export async function POST(req) {
  const { query, systemPrompt } = await req.json();
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // safe here!
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  try {
    const result = await model.generateContent(systemPrompt + '\n' + query);
    return Response.json({ response: result.response.text() });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
