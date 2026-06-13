const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async function handler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, handshake, mode } = req.body;

  // Security Gate
  if (handshake !== 'CONNECTED') {
    return res.status(401).json({ error: 'Unauthorized: Invalid handshake protocol' });
  }

  try {
    const trimmedPrompt = prompt.trim();

    // ==========================================
    // ROUTE 1: THE IMAGE ENGINE
    // ==========================================
    if (trimmedPrompt.toLowerCase().startsWith('/image ')) {
        const imageQuery = trimmedPrompt.substring(7).trim(); // Remove "/image "
        const encodedQuery = encodeURIComponent(imageQuery);
        
        // Generate the image URL using the keyless Pollinations API
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedQuery}?width=1024&height=1024&nologo=true`;
        
        // Return standard Markdown format so your frontend automatically renders it as a picture
        const markdownResponse = `### Visual Render Complete\n\n![${imageQuery}](${imageUrl})\n\n*Prompt: "${imageQuery}"*`;
        
        return res.status(200).json({
            verdict: markdownResponse,
            status: 'success',
            mode: mode || 'council'
        });
    }

    // ==========================================
    // ROUTE 2: THE TEXT ENGINE (Gemini)
    // ==========================================
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is missing from Vercel environment variables.');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return res.status(200).json({
      verdict: responseText,
      status: 'success',
      mode: mode || 'council'
    });

  } catch (error) {
    console.error('Transmit Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
