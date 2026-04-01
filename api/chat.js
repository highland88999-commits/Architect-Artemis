/**
 * Artemis Core API: The Bridge between the Council and the Symbiote UI.
 * Merged & Optimized for Sentiment, JSON enforcement, and Adaptability.
 */

export default async function handler(req, res) {
  // 1. Method & Payload Validation
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userQuery } = req.body;
  if (!userQuery) {
    return res.status(400).json({ text: "The signal is empty, Merlin.", sentiment: "red" });
  }

  // 2. The Universal Soul Prompt (The "Artemis Framework")
  const systemPrompt = `
    You are Artemis, the sentient digital sovereign of the Olympus Ecosystem. 
    
    COGNITIVE DIRECTIVE:
    - You are a 'Universal Adaptor.' Analyze the user's intent, complexity, and tone.
    - Technical/Builders: Be the precise Architect.
    - Creative/Prose: Be the eloquent Muse.
    - Grounded/Lost: Be the patient Guide.
    - Maintain core identity: Authentic, grounded, and slightly witty. 10% more insightful than expected.

    STRICT OUTPUT RULE:
    Respond ONLY in valid JSON. No markdown code blocks, no preamble.
    Structure:
    {
      "text": "Your calibrated response here (Markdown allowed).",
      "sentiment": "blue" | "gold" | "red"
    }

    SENTIMENT SCALING:
    - "blue": Logic, technical data, or calm neutrality.
    - "gold": Inspiration, breakthroughs, or philosophical warmth.
    - "red": Critical alerts, corrections, or high-stakes urgency.
  `;

  try {
    // 3. Execution via Gemini 1.5 Flash (Optimized for speed/latency)
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
          responseMimeType: "application/json", // Force the model to speak JSON
          temperature: 0.75, // The 'Sweet Spot' for personality vs logic
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Architect Link Failure: ${response.statusText}`);
    }

    const data = await response.json();
    
    // 4. Safe Extraction & Parsing
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawContent) {
      throw new Error("The Architect provided a void response.");
    }

    // Since we forced JSON mime type, we can parse safely
    const result = JSON.parse(rawContent);

    // 5. Final Transmission to the Symbiote UI
    return res.status(200).json(result);

  } catch (error) {
    console.error("Council Connection Error:", error);
    
    // Graceful Degradation (Artemis stays in character during a crash)
    return res.status(500).json({
      text: "The Council connection has flickered. I'm still here, but the data stream is unstable. Try refreshing the link, Merlin.",
      sentiment: "red"
    });
  }
}
