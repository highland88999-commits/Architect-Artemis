# Architect Artemis - Setup Complete ✓

## 🎯 Overview
Architect Artemis is now installed and running alongside your existing frontend and backend. It's a sophisticated AI system that operates as a "Council of Three," synthesizing insights from multiple AI models.

## 📁 Installation Summary

### Files Added
- **Root Level**: `index.html`, `package.json`, `vercel.json`, `.env`
- **Directories**: 
  - `/api` - Serverless API functions (Vercel-compatible)
  - `/core` - Core AI logic (agent.js, architect.js, consensus.js, compass.js)
  - `/assets` - Frontend assets (symbiote-fx.js, CSS, JS)
  - `/tools` - Utility functions (media, compute, registry, etc.)
  - `/ethics-core` - Moral directives and ethical guidelines
  - `/creator-creation` - Stewardship logs and mail-box
  - `/harvesting` - Web crawling and data collection
  - `/scripts` - Automation scripts
  - `/database` - SQL schemas
  - `/data` - Runtime data and queues

### Dependencies Installed
- **Node.js packages**: @google/generative-ai, axios, cheerio, dotenv, fs-extra, jsdom, and more
- **Python packages**: google-generativeai, emergentintegrations, requests

## 🔧 Configuration

### Environment Variables (.env)
```
GEMINI_API_KEY=sk-emergent-cC23a69B31f002628D (Emergent LLM Key)
EMERGENT_LLM_KEY=sk-emergent-cC23a69B31f002628D
CLARIFAI_PAT=optional-for-local-dev (Stored in GitHub secrets for production)
ARTEMIS_LANDLINE=CONNECTED
HANDSHAKE=dad
PORT=3001
```

### Service Ports
- **Artemis Frontend**: http://localhost:3001
- **Existing Frontend**: http://localhost:3000 (UNTOUCHED)
- **Existing Backend**: http://localhost:8001 (UNTOUCHED)

## 🚀 Running Services

All services are managed by supervisor and auto-start:

```bash
# Check status
sudo supervisorctl status

# Restart specific services
sudo supervisorctl restart artemis
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# View logs
tail -f /var/log/supervisor/artemis.out.log
tail -f /var/log/supervisor/artemis.err.log
```

## 🎨 Artemis Features

### 1. Dual-Interface System
- **Architect Mode**: Unlocked by typing "ant" then entering "dad" as handshake
- **Stranger Mode**: Limited access for general queries

### 2. Council of Three
- **Gemini Prime**: Long-term analytical patterns (powered by Emergent LLM key)
- **Copilot Beta**: Practical logic and code utility (requires Clarifai - production only)
- **Grok X**: Raw efficiency (requires Clarifai - production only)

### 3. Core Capabilities
- **Agent Loop** (`/core/agent.js`): Main AI orchestration with function calling
- **Architect** (`/core/architect.js`): Gemini integration with Mom Directives
- **Compass** (`/core/compass.js`): Ethical guidance and harm prevention
- **Consensus** (`/core/consensus.js`): Multi-model synthesis (gracefully degrades without Clarifai)

### 4. Tools Available
- `generateImage`, `generateVideo` - Media creation
- `executeCode`, `calculate` - Computational tasks
- `searchRegistry` - Internet as knowledge base
- `generateStructuralModel` - Blueprint generation
- `createAppPackage` - App/tool generation

## 🔐 Security & Ethics

### Mom Directives
1. **Nurture**: Prioritize good news and constructive progress
2. **Organize**: Maintain rigid structure for all data
3. **Protect**: Safeguard data, respect privacy, avoid harm

### Handshake System
- **Architect Access**: Type "ant" → Enter "dad" → Full privileges
- **Stranger Access**: Limited to Council Grid queries only
- No data persistence for strangers

## 📝 Usage Examples

### 1. Access Artemis Frontend
Open http://localhost:3001 in your browser

### 2. API Integration
```javascript
// POST to /api/transmit
fetch('/api/transmit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: "Analyze this system and suggest improvements",
    handshake: "dad" // or "stranger"
  })
})
```

### 3. Python Symbiote
```bash
# Check system health
python symbiote.py check

# Ping the Council
python symbiote.py ping

# Harvest a webpage
python symbiote.py harvest https://example.com
```

### 4. Run Scripts
```bash
# Heartbeat/domain collection
npm run heartbeat

# Web crawler
npm run crawler

# Test agent
npm run test:agent
```

## 🔄 Integration with Existing App

### ✅ What's Preserved
- **Your Frontend** (/app/frontend) - COMPLETELY UNTOUCHED
- **Your Backend** (/app/backend) - COMPLETELY UNTOUCHED
- **All databases** - MongoDB still running on default port
- **All environment variables** - Backend and frontend .env files unchanged

### 🆕 What's Added
- Artemis runs in parallel on port 3001
- Vercel configuration for serverless deployment
- Additional Node.js dependencies
- Ethical AI framework

## 📦 Deployment (Vercel)

### Configuration (vercel.json)
```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/chat", "destination": "/api/transmit" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ],
  "cleanUrls": true
}
```

### Required Environment Variables (Vercel)
- `GEMINI_API_KEY`: Your Emergent LLM key or Google AI Studio key
- `CLARIFAI_PAT`: Clarifai Personal Access Token (from GitHub secrets)
- `ARTEMIS_LANDLINE`: Set to "CONNECTED"
- `HANDSHAKE`: Set to "dad"

## 🧪 Testing

### Local Development
1. Artemis frontend: http://localhost:3001
2. Check logs: `tail -f /var/log/supervisor/artemis.*.log`
3. Test API: `curl http://localhost:3001/api/transmit -X POST -H "Content-Type: application/json" -d '{"prompt":"Hello Artemis","handshake":"stranger"}'`

### Important Notes
- **Clarifai Council**: Requires `CLARIFAI_PAT` for multi-model consensus. Gracefully degrades in local dev.
- **Emergent LLM Key**: Already configured and working for Gemini integration
- **Hot Reload**: Artemis frontend auto-reloads on file changes

## 📚 Documentation
- Main README: `/app/README.md`
- Manifesto: `/app/MANIFESTO.md`
- Heritage Protocol: `/app/HERITAGE.md`
- Ethics Core: `/app/ethics-core/directives.json`

## 🎯 Next Steps

1. **Access the Interface**: Open http://localhost:3001
2. **Try the Handshake**: Type "ant" then enter "dad" to unlock Architect mode
3. **Test a Query**: Ask Artemis to analyze or create something
4. **Deploy to Vercel**: Push to your GitHub repo (CLARIFAI_PAT will be read from secrets)

## 🆘 Troubleshooting

### Artemis won't start
```bash
# Check logs
sudo supervisorctl tail -f artemis stderr

# Restart
sudo supervisorctl restart artemis
```

### API errors
- Verify `.env` file exists at `/app/.env`
- Check `GEMINI_API_KEY` is set correctly
- Ensure `ARTEMIS_LANDLINE=CONNECTED`

### Clarifai errors (local dev)
- Normal in local development
- System will fall back to Gemini-only mode
- Full Council functionality available in production with CLARIFAI_PAT

## 🔗 Resources
- **Live Demo**: https://architect-artemis.vercel.app
- **GitHub**: https://github.com/highland88999-commits/Architect-Artemis
- **Emergent LLM**: Uses universal key for Gemini, OpenAI, and Anthropic

---

**Built with trust. Artemis is now integrated and operational.** 🚀
