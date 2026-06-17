from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

# Initialize FastAPI
app = FastAPI(title="Artemis AI Matrix", version="1.0.0")

# Allow Vercel to talk to Render securely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change "*" to your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the expected JSON payload format
class TextPayload(BaseModel):
    text: str

class QuantumPayload(BaseModel):
    operation: str

@app.get("/")
def read_root():
    return {"status": "Artemis AI Matrix is Online.", "quantum_state": "Superposition"}

@app.post("/analyze/sentiment")
def analyze_sentiment(payload: TextPayload):
    """
    Endpoint for Vercel to trigger the ml_node.py logic.
    """
    try:
        from transformers import pipeline
        # Load the model (FastAPI keeps this in memory for fast subsequent requests)
        classifier = pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment-latest")
        
        # Truncate to 512 tokens to prevent crashes
        safe_text = payload.text[:512]
        result = classifier(safe_text)[0]
        
        return {
            "success": True,
            "label": result["label"],
            "score": round(float(result["score"]), 4)
        }
    except Exception as e:
        logging.error(f"Sentiment Analysis Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quantum/simulate")
def quantum_simulate(payload: QuantumPayload):
    """
    Endpoint for Vercel to trigger the QuantumLearner logic.
    """
    try:
        # We import here so it doesn't crash the server if QuTiP fails to load
        from .quantum_learner import QuantumLearner
        
        artemis_q = QuantumLearner()
        
        if payload.operation == "superposition":
            state = artemis_q.simulate_superposition()
            return {"success": True, "operation": "superposition", "state_matrix": str(state)}
            
        elif payload.operation == "entanglement":
            state = artemis_q.simulate_entanglement()
            return {"success": True, "operation": "entanglement", "state_matrix": str(state)}
            
        else:
            raise ValueError("Unknown quantum operation requested.")
            
    except Exception as e:
        logging.error(f"Quantum Simulation Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

