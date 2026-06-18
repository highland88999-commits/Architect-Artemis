from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import logging

app = FastAPI(title="Artemis AI Matrix", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextPayload(BaseModel):
    text: str

class QuantumPayload(BaseModel):
    operation: str

class PhysicsPayload(BaseModel):
    law: str
    params: dict

@app.get("/")
def read_root():
    return {"status": "Artemis AI Matrix is Online.", "quantum_state": "Superposition"}

@app.post("/analyze/sentiment")
def analyze_sentiment(payload: TextPayload):
    try:
        from transformers import pipeline
        classifier = pipeline("sentiment-analysis", model="cardiffnlp/twitter-roberta-base-sentiment-latest")
        safe_text = payload.text[:512]
        result = classifier(safe_text)[0]
        return {"success": True, "label": result["label"], "score": round(float(result["score"]), 4)}
    except Exception as e:
        logging.error(f"Sentiment Analysis Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/quantum/simulate")
def quantum_simulate(payload: QuantumPayload):
    try:
        from .quantum_learner import QuantumLearner
        artemis_q = QuantumLearner()
        if payload.operation == "superposition":
            return {"success": True, "operation": "superposition", "state_matrix": str(artemis_q.simulate_superposition())}
        elif payload.operation == "entanglement":
            return {"success": True, "operation": "entanglement", "state_matrix": str(artemis_q.simulate_entanglement())}
        else:
            raise ValueError("Unknown quantum operation requested.")
    except Exception as e:
        logging.error(f"Quantum Simulation Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/physics/calculate")
def calculate_physics(payload: PhysicsPayload):
    """
    Provides Artemis with an understanding of physical laws.
    """
    try:
        from .physics_node import PhysicsEngine
        engine = PhysicsEngine()
        
        if payload.law == "relativity":
            energy = engine.mass_energy_equivalence(payload.params.get("mass", 0))
            return {"success": True, "law": "E=mc^2", "result_joules": energy}
            
        elif payload.law == "gravity":
            force = engine.gravitational_force(payload.params.get("m1", 0), payload.params.get("m2", 0), payload.params.get("r", 1))
            return {"success": True, "law": "Newtonian Gravity", "force_newtons": force}
            
        elif payload.law == "time_dilation":
            dilated = engine.time_dilation(payload.params.get("velocity", 0), payload.params.get("time", 1))
            return {"success": True, "law": "Special Relativity", "dilated_time": dilated}
            
        else:
            raise ValueError("Unknown physical law requested.")
            
    except Exception as e:
        logging.error(f"Physics Calculation Failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

