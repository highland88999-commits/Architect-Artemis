# harvesting/content_analyzer.py
"""
Extracts meaningful content signals from harvested HTML:
- Clean text
- Keywords / topics
- Basic sentiment polarity
- Named entities (people, orgs, locations)
"""

import logging
from typing import Dict, List, Optional, Any

import nltk
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from bs4 import BeautifulSoup

# Optional heavier dependencies (comment out if not installed)
try:
    import spacy
    NLP = spacy.load("en_core_web_sm", disable=["parser", "ner"])  # fast mode
except ImportError:
    NLP = None
    logging.warning("spaCy not available – entity extraction disabled")

nltk.download('vader_lexicon', quiet=True)
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)

logger = logging.getLogger(__name__)

class ContentAnalyzer:
    def __init__(self):
        self.sentiment_analyzer = SentimentIntensityAnalyzer()

    def analyze(self, html: str, url: str) -> Dict[str, Any]:
        """
        Main analysis entry point.
        Returns structured dict with extracted signals.
        """
        try:
            soup = BeautifulSoup(html, "lxml")
            text = self._clean_text(soup)

            result = {
                "url": url,
                "clean_text_length": len(text),
                "keywords": self._extract_keywords(text),
                "sentiment": self._get_sentiment(text),
                "entities": self._extract_entities(text) if NLP else [],
                "has_contact_form": bool(soup.find(attrs={"action": True, "method": "post"})),
                "has_newsletter": "newsletter" in text.lower() or "subscribe" in text.lower(),
            }

            logger.debug("Content analysis complete for %s", url)
            return result

        except Exception as e:
            logger.error("Content analysis failed for %s: %s", url, e, exc_info=True)
            return {"url": url, "error": str(e)}

    def _clean_text(self, soup: BeautifulSoup) -> str:
        """Remove scripts, styles, boilerplate."""
        for tag in soup(["script", "style", "noscript", "header", "footer", "nav"]):
            tag.decompose()

        text = soup.get_text(separator=" ", strip=True)
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        return " ".join(chunk for chunk in chunks if chunk)

    def _extract_keywords(self, text: str, top_n: int = 10) -> List[str]:
        """Simple TF-IDF like keyword extraction (no external model)."""
        from collections import Counter
        from nltk.corpus import stopwords
        from nltk.tokenize import word_tokenize

        stop_words = set(stopwords.words("english"))
        tokens = [
            w.lower() for w in word_tokenize(text)
            if w.isalpha() and w.lower() not in stop_words and len(w) > 2
        ]

        counter = Counter(tokens)
        return [word for word, _ in counter.most_common(top_n)]

    def _get_sentiment(self, text: str) -> Dict[str, float]:
        """VADER sentiment scores."""
        if len(text) < 20:
            return {"compound": 0.0, "pos": 0.0, "neu": 1.0, "neg": 0.0}

        scores = self.sentiment_analyzer.polarity_scores(text)
        return scores

    def _extract_entities(self, text: str) -> List[Dict[str, str]]:
        """Named entity recognition with spaCy (if available)."""
        if not NLP:
            return []

        doc = NLP(text[:1000000])  # safety limit
        return [
            {"text": ent.text, "label": ent.label_, "start": ent.start_char, "end": ent.end_char}
            for ent in doc.ents
        ]


# Quick test / CLI usage
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python content_analyzer.py <html_file_or_url>")
        sys.exit(1)

    analyzer = ContentAnalyzer()

    if sys.argv[1].startswith("http"):
        import requests
        html = requests.get(sys.argv[1], timeout=10).text
    else:
        with open(sys.argv[1], encoding="utf-8") as f:
            html = f.read()

    result = analyzer.analyze(html, sys.argv[1])
    import json
    print(json.dumps(result, indent=2))
