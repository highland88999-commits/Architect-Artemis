import os

class Linguist:
    def __init__(self):
        # 1. Base dictionary for standard system prompts
        self.lexicon = {
            "en": {
                "init": "System online. Commencing network diagnostics.",
                "complete": "Optimization routines finalized successfully.",
                "vulnerability_found": "Anomalies detected. Generating vulnerability reports.",
                "fallback": "Query processed."
            },
            "es": {
                "init": "Sistema en línea. Iniciando diagnósticos de red.",
                "complete": "Rutinas de optimización finalizadas con éxito.",
                "vulnerability_found": "Anomalías detectadas. Generando informes de vulnerabilidad.",
                "fallback": "Consulta procesada."
            },
            "fr": {
                "init": "Système en ligne. Début des diagnostics réseau.",
                "complete": "Routines d'optimisation finalisées avec succès.",
                "vulnerability_found": "Anomalies détectées. Génération des rapports de vulnérabilité.",
                "fallback": "Requête traitée."
            },
            "de": {
                "init": "System online. Beginne Netzwerkdiagnose.",
                "complete": "Optimierungsroutinen erfolgreich abgeschlossen.",
                "vulnerability_found": "Anomalien entdeckt. Erstelle Schwachstellenberichte.",
                "fallback": "Anfrage bearbeitet."
            }
        }

    def get_static_text(self, key: str, lang: str = "en") -> str:
        """Retrieves a pre-translated system message."""
        lang_dict = self.lexicon.get(lang.lower(), self.lexicon["en"])
        return lang_dict.get(key, lang_dict["fallback"])

    def translate_dynamic(self, text: str, target_lang: str) -> str:
        """
        Connects to a translation service for 'the gift of tongues' 
        to translate dynamic internet traffic on the fly.
        """
        # Placeholder for translation API integration
        # e.g., using deep-translator or third-party LLM APIs
        return f"[Translated to {target_lang}]: {text}"
