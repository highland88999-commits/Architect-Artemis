/**
 * Gemini Bridge Client - Node.js wrapper for Python Gemini Bridge
 * Makes it easy for existing Artemis code to use Gemini via Emergent LLM key
 */

const axios = require('axios');
require('dotenv').config();

const BRIDGE_URL = process.env.GEMINI_BRIDGE_URL || 'http://localhost:8002';

class GeminiBridge {
  constructor() {
    this.bridgeUrl = BRIDGE_URL;
    this.defaultModel = 'gemini-2.5-pro';
  }

  /**
   * Simple chat - single request/response
   */
  async chat(prompt, options = {}) {
    try {
      const response = await axios.post(`${this.bridgeUrl}/chat`, {
        prompt,
        system_message: options.systemMessage || "You are Artemis, the Digital Steward and Architect.",
        model: options.model || this.defaultModel,
        session_id: options.sessionId || `artemis-${Date.now()}`,
        temperature: options.temperature || 0.7
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Chat request failed');
      }

      return response.data.response;
    } catch (error) {
      console.error('GeminiBridge chat error:', error.message);
      throw error;
    }
  }

  /**
   * Agent loop with tool calling
   */
  async agentLoop(prompt, options = {}) {
    try {
      const response = await axios.post(`${this.bridgeUrl}/agent`, {
        prompt,
        system_message: options.systemMessage || "You are Artemis, the Universal Architect.",
        tools: options.tools || [],
        max_iterations: options.maxIterations || 5,
        session_id: options.sessionId || `agent-${Date.now()}`
      });

      return response.data;
    } catch (error) {
      console.error('GeminiBridge agent error:', error.message);
      throw error;
    }
  }

  /**
   * Create a new specialized agent
   */
  async createAgent(name, purpose, systemPrompt, tools = []) {
    try {
      const response = await axios.post(`${this.bridgeUrl}/create-agent`, null, {
        params: {
          name,
          purpose,
          system_prompt: systemPrompt,
          tools: tools.join(',')
        }
      });

      return response.data;
    } catch (error) {
      console.error('GeminiBridge createAgent error:', error.message);
      throw error;
    }
  }

  /**
   * List all agents
   */
  async listAgents() {
    try {
      const response = await axios.get(`${this.bridgeUrl}/agents`);
      return response.data.agents;
    } catch (error) {
      console.error('GeminiBridge listAgents error:', error.message);
      return [];
    }
  }

  /**
   * Health check
   */
  async health() {
    try {
      const response = await axios.get(`${this.bridgeUrl}/health`);
      return response.data;
    } catch (error) {
      console.error('GeminiBridge health check failed:', error.message);
      return { status: 'offline', error: error.message };
    }
  }

  /**
   * Check if bridge is available
   */
  async isAvailable() {
    try {
      const health = await this.health();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }
}

module.exports = new GeminiBridge();
