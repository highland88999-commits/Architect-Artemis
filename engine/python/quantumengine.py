import math


class QuantumEngine:
    """Lightweight quantum simulation helpers for Artemis."""

    def __init__(self):
        self._base_state = [1, 0]

    def simulate_superposition(self):
        return {
            "state": self._base_state,
            "probabilities": [0.5, 0.5],
            "note": "superposition simulated"
        }

    def simulate_entanglement(self):
        return {
            "state": [1, 1],
            "probabilities": [0.5, 0.5],
            "note": "entanglement simulated"
        }
