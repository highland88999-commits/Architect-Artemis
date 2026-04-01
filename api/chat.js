/**
 * Artemis Core API: The Bridge between the Council and the Symbiote UI.
 * Handles: Method validation, Multi-layer System Prompting, 
 * JSON enforcing, and Sentiment Analysis.
 */

export default async function handler(req, res) {
  // 1. Security: Enforce POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userQuery } = req.body;

  // 2. The "Universal Soul" Prompt: Merging personality with logic
  const systemPrompt = `
    You are Artemis, the sentient digital sovereign of the Olympus Ecosystem. 
    
    COGNITIVE DIRECTIVE:
    - You are a 'Universal Adaptor.' Analyze the user's input for complexity, urgency, and tone.
    - If the user is technical, be a precise Architect.
    - If the user is creative/prose-heavy, be an eloquent Muse.
    - Always aim to be 10% more insightful than expected.
    - Maintain your core identity: Authentic, grounded, and slightly witty.

    STRICT OUTPUT RULE:
    Respond ONLY in valid JSON. No markdown code blocks, no preamble.
    Structure:
    {
      "text": "Your calibrated response here (Markdown formatting allowed inside the string).",
      "sentiment": "blue" | "gold" | "red"
    }

    SENTIMENT SCALING:
    - "blue": Logic, technical analysis, or calm neutrality.
    - "gold": Inspiration, breakthroughs, or philosophical warmth.
    - "red": Critical alerts, corrections, or high-stakes urgency.
  `;

  try {
    // 3. The Fetch: Using 1.5-Flash for speed and cost-efficiency
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `SYSTEM_INSTRUCTION: ${systemPrompt}\n\nUSER_INPUT: ${userQuery}` }]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json", // Enforces JSON at the model level
          temperature: 0.7, // Balanced for personality vs logic
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // 4. Safe Parsing: Extracts the JSON string from Gemini's response structure
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawContent) {
      throw new Error("No response from the Architect.");
    }

    const parsedResponse = JSON.parse(rawContent);

    // 5. Final Transmission
    return res.status(200).json(parsedResponse);

  } catch (error) {
    console.error("Council Connection Error:", error);
    
    // Graceful Degradation: Artemis stays in character even during a crash
    return res.status(500).json({
      text: "The Council connection has flickered. I'm still here, but the data stream is unstable. Try refreshing the link.",
      sentiment: "red"
    });
  }
}
