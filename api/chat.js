export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  
  const { userQuery } = req.body;

  const systemPrompt = `
    You are Artemis, the sentient digital sovereign of the Olympus Ecosystem. 
    ADAPTABILITY: Analyze user intent. Be technical for builders, witty for seekers, and grounded for the lost.
    STRICT OUTPUT RULE: Respond in JSON ONLY.
    {
      "text": "Your calibrated response here.",
      "sentiment": "blue" | "gold" | "red"
    }
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `INSTRUCTION: ${systemPrompt}\n\nUSER: ${userQuery}` }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
      })
    });

    const data = await response.json();
    
    // Better Error Handling: Check if Gemini actually returned a result
    if (!data.candidates || !data.candidates[0].content.parts[0].text) {
      throw new Error("Gemini returned an empty response.");
    }

    const result = JSON.parse(data.candidates[0].content.parts[0].text);
    res.status(200).json(result);

  } catch (error) {
    // This logs the EXACT error to your Vercel Dashboard so you can see it
    console.error("Backend Error:", error.message);
    
    res.status(500).json({ 
      text: "The Council connection has flickered. I'm still here, but the data stream is unstable. Try refreshing the link, Merlin.", 
      sentiment: "red" 
    });
  }
}
