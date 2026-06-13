const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async function handler(req, res) {
  // CORS Preflight
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { prompt, handshake, mode, jobId } = req.body;

  if (handshake !== 'CONNECTED') {
    return res.status(401).json({ error: 'Unauthorized: Invalid protocol' });
  }

  try {
    // ==========================================
    // ROUTE 3b: VIDEO POLLING (Checking Status)
    // ==========================================
    if (mode === 'check_video') {
        if (!process.env.REPLICATE_API_TOKEN) throw new Error('REPLICATE_API_TOKEN missing');
        
        const response = await fetch(`https://api.replicate.com/v1/predictions/${jobId}`, {
            headers: { 'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}` }
        });
        const prediction = await response.json();
        
        if (prediction.status === 'succeeded') {
            const videoUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
            const markdownResponse = `### Video Render Complete\n\n<video width="100%" controls autoplay loop>\n<source src="${videoUrl}" type="video/mp4">\n</video>\n\n*Task ID: ${jobId}*`;
            return res.status(200).json({ verdict: markdownResponse, status: 'success', mode: 'video_done' });
        } else if (prediction.status === 'failed') {
            return res.status(200).json({ verdict: "Video synthesis failed.", status: 'error', mode: 'video_done' });
        } else {
            return res.status(200).json({ verdict: `Rendering video... [Status: ${prediction.status}]`, status: 'processing', mode: 'video_polling' });
        }
    }

    const trimmedPrompt = prompt ? prompt.trim() : "";

    // ==========================================
    // ROUTE 3a: START VIDEO ENGINE
    // ==========================================
    if (trimmedPrompt.toLowerCase().startsWith('/video ')) {
        const videoQuery = trimmedPrompt.substring(7).trim();
        if (!process.env.REPLICATE_API_TOKEN) {
            return res.status(200).json({ verdict: "### Missing API Key\nAdd `REPLICATE_API_TOKEN` to Vercel.", status: 'success' });
        }

        // Fire request to Zeroscope v2 (Text-to-Video Model)
        const response = await fetch("https://api.replicate.com/v1/predictions", {
            method: "POST",
            headers: {
                "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                version: "9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
                input: { prompt: videoQuery }
            })
        });

        const prediction = await response.json();
        if (prediction.error) throw new Error(prediction.error);

        return res.status(200).json({
            verdict: `### Video Engine Engaged\n\nCommand: "${videoQuery}"\n\nEstablishing neural link. Please wait 1-3 minutes...`,
            status: 'success',
            mode: 'video_polling',
            jobId: prediction.id
        });
    }

    // ==========================================
    // ROUTE 1: THE IMAGE ENGINE
    // ==========================================
    if (trimmedPrompt.toLowerCase().startsWith('/image ')) {
        const imageQuery = trimmedPrompt.substring(7).trim();
        const encodedQuery = encodeURIComponent(imageQuery);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedQuery}?width=1024&height=1024&nologo=true`;
        const markdownResponse = `### Visual Render Complete\n\n![${imageQuery}](${imageUrl})\n\n*Prompt: "${imageQuery}"*`;
        return res.status(200).json({ verdict: markdownResponse, status: 'success', mode: 'council' });
    }

    // ==========================================
    // ROUTE 2: THE TEXT ENGINE (Gemini)
    // ==========================================
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing.');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro-latest' });

    const result = await model.generateContent(prompt);
    return res.status(200).json({ verdict: result.response.text(), status: 'success', mode: 'council' });

  } catch (error) {
    console.error('Transmit Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
