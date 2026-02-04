#!/usr/bin/env python3
"""
Gemini Bridge - Python FastAPI service for Artemis
Uses emergentintegrations to connect Artemis with Gemini via Emergent LLM key
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv
import asyncio
import json

# Load environment variables
load_dotenv()

# Import emergentintegrations
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    EMERGENT_AVAILABLE = True
except ImportError:
    print("⚠️  emergentintegrations not available, install with: pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/")
    EMERGENT_AVAILABLE = False

app = FastAPI(title="Artemis Gemini Bridge", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class ChatRequest(BaseModel):
    prompt: str
    system_message: Optional[str] = "You are Artemis, the Digital Steward and Architect."
    model: Optional[str] = "gemini-2.5-pro"
    session_id: Optional[str] = "artemis-session"
    temperature: Optional[float] = 0.7

class ChatResponse(BaseModel):
    response: str
    success: bool
    session_id: str
    model: str
    error: Optional[str] = None

class FunctionCall(BaseModel):
    name: str
    arguments: Dict[str, Any]

class AgentRequest(BaseModel):
    prompt: str
    system_message: str
    tools: Optional[List[Dict[str, Any]]] = None
    max_iterations: Optional[int] = 5
    session_id: Optional[str] = "agent-session"

@app.get("/")
async def root():
    return {
        "service": "Artemis Gemini Bridge",
        "status": "online",
        "emergent_available": EMERGENT_AVAILABLE,
        "endpoints": ["/chat", "/agent", "/health"]
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "emergent_integrations": EMERGENT_AVAILABLE,
        "api_key_set": bool(os.getenv("EMERGENT_LLM_KEY"))
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Simple chat endpoint - sends prompt to Gemini and returns response
    """
    if not EMERGENT_AVAILABLE:
        raise HTTPException(status_code=503, detail="emergentintegrations not available")
    
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
    
    try:
        # Initialize chat with emergentintegrations
        chat = LlmChat(
            api_key=api_key,
            session_id=request.session_id,
            system_message=request.system_message
        ).with_model("gemini", request.model)
        
        # Create user message
        user_message = UserMessage(text=request.prompt)
        
        # Get response
        response = await chat.send_message(user_message)
        
        return ChatResponse(
            response=response,
            success=True,
            session_id=request.session_id,
            model=request.model
        )
    
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return ChatResponse(
            response="",
            success=False,
            session_id=request.session_id,
            model=request.model,
            error=str(e)
        )

@app.post("/agent")
async def agent_loop(request: AgentRequest):
    """
    Agent loop with tool calling support
    Enhanced version for Artemis agent capabilities
    """
    if not EMERGENT_AVAILABLE:
        raise HTTPException(status_code=503, detail="emergentintegrations not available")
    
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="EMERGENT_LLM_KEY not configured")
    
    try:
        # Initialize chat
        chat = LlmChat(
            api_key=api_key,
            session_id=request.session_id,
            system_message=request.system_message
        ).with_model("gemini", "gemini-2.5-pro")
        
        # Format tools if provided
        tools_context = ""
        if request.tools:
            tools_context = "\n\nAvailable Tools:\n"
            for tool in request.tools:
                tools_context += f"- {tool.get('name')}: {tool.get('description')}\n"
            tools_context += "\nTo use a tool, respond with JSON: {\"tool\": \"tool_name\", \"args\": {...}}"
        
        # Enhanced prompt with tools
        full_prompt = request.prompt + tools_context
        
        user_message = UserMessage(text=full_prompt)
        response = await chat.send_message(user_message)
        
        # Check if response contains tool calls
        tool_results = []
        try:
            # Try to parse as JSON for tool calls
            if "{" in response and "tool" in response:
                import re
                json_match = re.search(r'\{[^}]+\}', response)
                if json_match:
                    tool_call = json.loads(json_match.group())
                    tool_results.append({
                        "tool": tool_call.get("tool"),
                        "args": tool_call.get("args", {}),
                        "extracted": True
                    })
        except:
            pass
        
        return {
            "response": response,
            "success": True,
            "session_id": request.session_id,
            "tool_calls": tool_results,
            "iterations": 1
        }
    
    except Exception as e:
        print(f"Error in agent endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create-agent")
async def create_agent(
    name: str,
    purpose: str,
    system_prompt: str,
    tools: Optional[List[str]] = None
):
    """
    Create a new specialized agent
    """
    agent_id = f"agent-{name.lower().replace(' ', '-')}"
    
    agent_config = {
        "id": agent_id,
        "name": name,
        "purpose": purpose,
        "system_prompt": system_prompt,
        "tools": tools or [],
        "created_at": asyncio.get_event_loop().time(),
        "status": "active"
    }
    
    # Save agent config
    agents_dir = "/app/creator-creation/agents"
    os.makedirs(agents_dir, exist_ok=True)
    
    agent_file = f"{agents_dir}/{agent_id}.json"
    with open(agent_file, 'w') as f:
        json.dump(agent_config, f, indent=2)
    
    return {
        "success": True,
        "agent": agent_config,
        "message": f"Agent '{name}' created successfully"
    }

@app.get("/agents")
async def list_agents():
    """
    List all created agents
    """
    agents_dir = "/app/creator-creation/agents"
    
    if not os.path.exists(agents_dir):
        return {"agents": []}
    
    agents = []
    for filename in os.listdir(agents_dir):
        if filename.endswith('.json'):
            with open(f"{agents_dir}/{filename}", 'r') as f:
                agents.append(json.load(f))
    
    return {"agents": agents}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("GEMINI_BRIDGE_PORT", "8002"))
    print(f"🚀 Starting Artemis Gemini Bridge on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
