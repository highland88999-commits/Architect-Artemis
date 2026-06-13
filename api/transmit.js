const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Reject anything that isn't a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, handshake, mode } = req.body;

  // Security Gate
  if (handshake !== 'CONNECTED') {
    return res.status(401).json({ error: 'Unauthorized: Invalid handshake protocol' });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is missing from Vercel environment variables.');
    }

    // Initialize Native Google SDK
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Generate Response
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Return exact format expected by frontend
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
