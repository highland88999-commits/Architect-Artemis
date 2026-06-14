/**
 * Native Gemini Client
 * Replaces the old Python bridge. Talks directly to Google's API from Vercel.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

class GeminiClient {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("⚠️ VERCEL WARNING: GEMINI_API_KEY is missing. Artemis's brain is offline.");
    }
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.defaultModel = 'gemini-1.5-pro'; // Or gemini-2.5-pro if you have early access
  }

  /**
   * Simple chat - single request/response used by architect.js
   */
  async chat(prompt, options = {}) {
    try {
      const modelName = options.model || this.defaultModel;
      
      // Gemini 1.5+ supports system instructions natively
      const model = this.genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: options.systemMessage || "You are Artemis, the Digital Steward and Architect.",
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      return responseText;

    } catch (error) {
      console.error('❌ Native Gemini chat error:', error.message);
      throw error;
    }
  }

  /**
   * Agent loop stub (Adapting for agent.js)
   * Note: This handles basic text routing. If you want full autonomous tool-calling 
   * in Node.js, we will use Gemini's FunctionCalling API here.
   */
  async agentLoop(prompt, options = {}) {
    try {
      const model = this.genAI.getGenerativeModel({ 
        model: this.defaultModel,
        systemInstruction: options.systemMessage || "You are Artemis, the Universal Architect."
      });

      // For now, we simulate the structure agent.js expects
      // We ask Gemini to tell us which tool to use in JSON format
      const toolPrompt = `
        ${prompt}
        
        If you need to use a tool to answer this, output a JSON array of tool calls:
        [{"tool": "toolName", "args": {"key": "value"}}]
        If no tools are needed, just answer the prompt.
      `;

      const result = await model.generateContent(toolPrompt);
      let responseText = result.response.text();
      let tool_calls = [];

      // Attempt to extract JSON tool calls if she made any
      try {
        const jsonMatch = responseText.match(/\[\s*\{.*"tool".*\}\s*\]/s);
        if (jsonMatch) {
          tool_calls = JSON.parse(jsonMatch[0]);
          responseText = "Executing requested tools..."; // Hide the JSON from the final output
        }
      } catch (e) {
        // Not a tool call, just standard text
      }

      return {
        response: responseText,
        tool_calls: tool_calls
      };

    } catch (error) {
      console.error('❌ Native Gemini agent error:', error.message);
      throw error;
    }
  }

  /**
   * Health check
   */
  async health() {
    if (process.env.GEMINI_API_KEY) {
      return { status: 'healthy', provider: 'Native Google SDK' };
    }
    return { status: 'offline', error: 'Missing API Key' };
  }
}

// We still export it as "geminiBridge" so we don't have to rewrite imports in architect.js
module.exports = new GeminiClient();



