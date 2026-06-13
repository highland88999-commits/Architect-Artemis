#!/usr/bin/env python3
"""
Artemis Bridge - Native Google Generative AI Backend
Replaces legacy emergentintegrations with google-generativeai SDK
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import json
import asyncio
from dotenv import load_dotenv
import google.generativeai as genai

# Load env and configure SDK
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("⚠️ WARNING: GEMINI_API_KEY not found in environment.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

app = FastAPI(title="Artemis Native Bridge", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, change to your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TransmitRequest(BaseModel):
    prompt: str
    handshake: Optional[str] = None
    mode: Optional[str] = "council"
    session_id: Optional[str] = "artemis-session"

class AgentRequest(BaseModel):
    prompt: str
    system_message: str
    tools: Optional[List[Dict[str, Any]]] = None

@app.get("/health")
async def health():
    return {"status": "healthy", "native_bridge": True, "api_key_set": bool(GEMINI_API_KEY)}

@app.post("/api/transmit")
async def transmit(request: TransmitRequest):
    """
    Main endpoint for the Artemis frontend UI.
    """
    if request.handshake != "CONNECTED":
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid handshake protocol")
        
    try:
        # The Council of Three Logic can be expanded here. For now, we use 1.5-pro as the primary node.
        model = genai.GenerativeModel('gemini-1.5-pro')
        response = model.generate_content(request.prompt)
        
        return {
            "verdict": response.text,
            "status": "success",
            "mode": request.mode
        }
    except Exception as e:
        print(f"Transmit Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agent")
async def agent_loop(request: AgentRequest):
    """
    Agentic tool-calling loop using native Google SDK function calling capabilities.
    """
    try:
        model = genai.GenerativeModel(
            'gemini-1.5-pro',
            system_instruction=request.system_message
        )
        # Note: To fully map tools, you will pass native Python functions to the `tools` parameter
        # in the SDK. This basic implementation catches the prompt.
        response = model.generate_content(request.prompt)
        
        return {
            "response": response.text,
            "success": True,
            "tool_calls": [], # Extracted by native SDK if tools are defined
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8002"))
    uvicorn.run(app, host="0.0.0.0", port=port)
