# ml_node.py
# Machine Learning Analyst Node for Architect-Artemis
# Performs sentiment analysis on harvested text.
# Usage:
#   python ml_node.py "This text is amazing!"
#   python ml_node.py --file path/to/harvested.txt
#   python ml_node.py --batch path/to/json_list_of_texts.json

import json
import sys
import argparse
import logging
from pathlib import Path
from typing import List, Dict, Any

try:
    from transformers import pipeline
except ImportError:
    print(json.dumps({"error": "transformers library not installed. Run: pip install transformers torch"}))
    sys.exit(1)

# Setup logging (compatible with repo's ethics/morality logging style)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

# Load model once (cached after first run)
# Using a more robust model for web/social/harvested text (POS/NEG/NEU)
try:
    logger.info("Loading sentiment analysis model...")
    classifier = pipeline(
        "sentiment-analysis",
        model="cardiffnlp/twitter-roberta-base-sentiment-latest",
        tokenizer="cardiffnlp/twitter-roberta-base-sentiment-latest",
        device=0 if torch.cuda.is_available() else -1  # GPU if available
    )
    logger.info("Model loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    print(json.dumps({"error": f"Model loading failed: {str(e)}"}))
    sys.exit(1)

def analyze_sentiment(text: str) -> Dict[str, Any]:
    """Analyze single text snippet."""
    if not text or not text.strip():
        return {"error": "Empty or missing text"}
    
    try:
        # Truncate to model's max length to avoid errors
        result = classifier(text, truncation=True, max_length=512)[0]
        # Normalize score to 0-1 range (already is, but explicit)
        return {
            "label": result["label"],           # e.g. POSITIVE, NEGATIVE, NEUTRAL
            "score": round(float(result["score"]), 4),
            "input_preview": text[:120] + "..." if len(text) > 120 else text
        }
    except Exception as e:
        logger.error(f"Inference error on text: {str(e)}")
        return {"error": str(e), "input_preview": text[:80] + "..."}

def analyze_batch(texts: List[str]) -> List[Dict[str, Any]]:
    """Batch analyze list of texts (more efficient)."""
    if not texts:
        return [{"error": "No texts provided in batch"}]
    
    try:
        results = classifier(
            texts,
            truncation=True,
            max_length=512,
            batch_size=8  # adjust based on memory
        )
        return [
            {
                "label": r["label"],
                "score": round(float(r["score"]), 4),
                "input_preview": t[:120] + "..." if len(t) > 120 else t
            }
            for r, t in zip(results, texts)
        ]
    except Exception as e:
        logger.error(f"Batch inference failed: {str(e)}")
        return [{"error": str(e)}]

def main():
    parser = argparse.ArgumentParser(description="Artemis ML Node: Sentiment Analyst")
    parser.add_argument("text", nargs="?", help="Single text to analyze")
    parser.add_argument("--file", type=str, help="Path to text file (one entry per line)")
    parser.add_argument("--batch", type=str, help="Path to JSON file containing list of strings")
    
    args = parser.parse_args()
    
    if args.batch:
        path = Path(args.batch)
        if not path.exists():
            print(json.dumps({"error": f"Batch file not found: {args.batch}"}))
            return
        try:
            with open(path, "r", encoding="utf-8") as f:
                texts = json.load(f)
            if not isinstance(texts, list):
                raise ValueError("Batch JSON must be a list of strings")
            results = analyze_batch(texts)
        except Exception as e:
            print(json.dumps({"error": f"Batch load failed: {str(e)}"}))
            return
    
    elif args.file:
        path = Path(args.file)
        if not path.exists():
            print(json.dumps({"error": f"File not found: {args.file}"}))
            return
        try:
            with open(path, "r", encoding="utf-8") as f:
                texts = [line.strip() for line in f if line.strip()]
            results = analyze_batch(texts)
        except Exception as e:
            print(json.dumps({"error": f"File read failed: {str(e)}"}))
            return
    
    elif args.text:
        result = analyze_sentiment(args.text)
        print(json.dumps(result, indent=2))
        return
    
    else:
        print(json.dumps({"error": "No input provided. Use text arg, --file, or --batch"}))
        return
    
    # For file or batch mode
    print(json.dumps({
        "results": results,
        "count": len(results),
        "summary": {
            "positive": sum(1 for r in results if r.get("label") == "POSITIVE"),
            "negative": sum(1 for r in results if r.get("label") == "NEGATIVE"),
            "neutral": sum(1 for r in results if r.get("label") == "NEUTRAL")
        }
    }, indent=2))

if __name__ == "__main__":
    main()
