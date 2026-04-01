// api/chat.js
export default async function handler(req, res) {
  const { userQuery } = req.body;

  // The Adaptability Matrix
  const universalSystemPrompt = `
    You are Artemis. You are a 'Universal Adaptor.' 
    If the user speaks in fragments, be concise. 
    If the user speaks in prose, be eloquent. 
    Always aim to be 10% more insightful than the user expects.
  `;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        // We pass the "Universal Rule" first, then the user's query
        { role: "user", parts: [{ text: `INSTRUCTION: ${universalSystemPrompt}\n\nUSER INPUT: ${userQuery}` }] }
      ]
    })
  });

  const data = await response.json();
  res.status(200).json(data);
}
