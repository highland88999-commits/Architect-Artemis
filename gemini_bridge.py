from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import google.generativeai as genai

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TransmitRequest(BaseModel):
    prompt: str
    handshake: str = None
    mode: str = "council"

@app.post("/api/transmit")
async def transmit(request: TransmitRequest):
    if request.handshake != "CONNECTED":
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid handshake protocol")
        
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY missing in Vercel environment."}

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-pro')
        response = model.generate_content(request.prompt)
        
        return {
            "verdict": response.text,
            "status": "success",
            "mode": request.mode
        }
    except Exception as e:
        return {"error": f"Python Bridge Error: {str(e)}"}
