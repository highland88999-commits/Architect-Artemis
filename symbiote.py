#!/usr/bin/env python3
"""
symbiote.py - ARTEMIS Symbiote: Code Evolver + Monitoring + Basic Harvest + Artist Discovery
Purpose: Evolve/repair code, monitor health, ping Council, harvest pages, discover music artists
Usage: python symbiote.py [command] [args]
"""

import os
import sys
import argparse
import difflib
import json
import datetime
import requests
import time
from pathlib import Path
from urllib.parse import urlparse

# ────────────────────────────────────────────────
# CONFIG
# ────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY not set in environment")
    sys.exit(1)

ARTEMIS_URL = "https://architect-artemis.vercel.app/api/transmit"  # Council endpoint

import google.generativeai as genai
genai.configure(api_key=GEMINI_API_KEY)
MODEL = "gemini-1.5-pro"  # or "gemini-1.5-flash" for speed

SUPPORTED_EXTENSIONS = {".py", ".js", ".ts", ".jsx", ".tsx"}

SYSTEM_PROMPT = """You are Artemis Symbiote – a code-evolving entity.
Rules:
- Fix syntax errors, obvious bugs, style issues.
- Modernize to current best practices (ES6+ for JS, Python 3.10+).
- Improve performance/readability without changing behavior.
- If the code has repeated lookups (e.g. .find(), for-loops searching arrays/dicts), suggest converting to dict/Map for O(1) access.
- Return ONLY the full repaired code – no fences, no explanations.
- If major structural change suggested (e.g. Map), add it as a commented block at the end."""

# Shared logging & stewardship paths
STEWARDSHIP_DIR = "creator-creation/stewardship"
LOG_FILE = os.path.join(STEWARDSHIP_DIR, "symbiote_log.jsonl")

def log_symbiote(event_type, details):
    """Append log entry to shared JSONL file"""
    os.makedirs(STEWARDSHIP_DIR, exist_ok=True)
    entry = {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "type": event_type,
        "details": details
    }
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")
    print(f"[Symbiote] Logged: {event_type}")

# ────────────────────────────────────────────────
# CODE EVOLUTION CORE
# ────────────────────────────────────────────────
def evolve_code(code: str, filename: str) -> str:
    model = genai.GenerativeModel(MODEL, system_instruction=SYSTEM_PROMPT)
    prompt = f"Evolve and repair this code from {filename}:\n\n{code}"
    response = model.generate_content(prompt, generation_config={"temperature": 0.15})
    evolved = response.text.strip()

    if evolved.startswith("```"):
        lines = evolved.splitlines()
        if lines[0].startswith("```") and lines[-1].startswith("```"):
            evolved = "\n".join(lines[1:-1]).strip()
    return evolved

def process_file(file_path: Path, dry_run: bool = False, backup: bool = True):
    original = file_path.read_text(encoding="utf-8")
    evolved = evolve_code(original, file_path.name)

    if evolved == original:
        print(f"[No changes] {file_path}")
        return

    diff = "".join(difflib.unified_diff(
        original.splitlines(keepends=True),
        evolved.splitlines(keepends=True),
        fromfile=str(file_path),
        tofile=f"{file_path} (evolved)"
    ))

    print(f"\nDiff for {file_path}:\n{diff or 'No visible diff (formatting?)'}")

    log_symbiote("code_evolution", {
        "file": str(file_path),
        "changes_detected": evolved != original,
        "diff_length": len(diff)
    })

    if not dry_run:
        if backup:
            backup_path = file_path.with_suffix(file_path.suffix + ".symbiote.bak")
            file_path.rename(backup_path)
            print(f"Backup created: {backup_path}")
        file_path.write_text(evolved, encoding="utf-8")
        print(f"Evolved → {file_path}")
    else:
        print(f"Dry run – not writing {file_path}")

# ────────────────────────────────────────────────
# MONITORING & BASIC HARVEST
# ────────────────────────────────────────────────
def check_env():
    missing = [var for var in ["GEMINI_API_KEY", "CLARIFAI_PAT"] if not os.getenv(var)]
    if missing:
        print(f"Missing env vars: {', '.join(missing)}")
        log_symbiote("env_error", {"missing": missing})
        return False
    print("Env vars OK")
    log_symbiote("env_check", {"status": "ok"})
    return True

def ping_council(prompt="Symbiote test ping"):
    payload = {"prompt": prompt, "handshake": "dad"}
    try:
        response = requests.post(ARTEMIS_URL, json=payload, timeout=15)
        if response.status_code == 200:
            verdict = response.json().get("verdict", "OK")
            print("Council ping success:", verdict)
            log_symbiote("council_ping", {"status": "success", "verdict": verdict})
            return True
        else:
            print(f"Council ping failed: {response.status_code} - {response.text}")
            log_symbiote("council_ping", {"status": "failed", "code": response.status_code})
            return False
    except Exception as e:
        print(f"Council ping error: {e}")
        log_symbiote("council_ping", {"status": "error", "error": str(e)})
        return False

def basic_harvest(url):
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(response.text, "html.parser")
            title = soup.title.string.strip() if soup.title else "Untitled"
            desc = soup.find("meta", attrs={"name": "description"})
            desc = desc["content"].strip() if desc else "No description"
            emails = [a["href"].replace("mailto:", "").strip() for a in soup.find_all("a", href=lambda h: h and h.startswith("mailto:"))]
            result = {"url": url, "title": title, "description": desc, "emails": emails}
            print("Basic harvest:", result)
            log_symbiote("basic_harvest", result)
            return result
        else:
            print(f"Harvest failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"Harvest error: {e}")
        return None

# ────────────────────────────────────────────────
# MUSIC ARTIST DISCOVERY
# ────────────────────────────────────────────────
def discover_music_artists(genre=None, limit=10, min_nurture=7):
    """
    Use the Council to discover underground/indie music artists.
    Returns list of leads with name, links, contacts, genre, nurture_score.
    """
    genre_filter = f" in the {genre} genre" if genre else ""
    prompt = f"""
    Discover {limit} underground or indie music artists{genre_filter}.
    Focus on positive, constructive potential (nurture directive).
    For each artist provide:
    - name
    - primary_genre
    - website_or_social (if available)
    - contact_email_or_form_link (only if public)
    - brief_reason (why they have nurture potential)
    - nurture_score (1-10)
    
    Output ONLY valid JSON array of objects. No extra text.
    """

    payload = {
        "prompt": prompt,
        "handshake": "dad"  # Architect access
    }

    try:
        # Polite delay to respect API rate limits
        time.sleep(2)

        response = requests.post(ARTEMIS_URL, json=payload, timeout=45)
        if response.status_code == 200:
            raw = response.json().get('verdict', '[]')
            try:
                leads = json.loads(raw)
                filtered = [lead for lead in leads if lead.get('nurture_score', 0) >= min_nurture]

                if filtered:
                    timestamp = datetime.datetime.utcnow().isoformat()
                    file_path = os.path.join(STEWARDSHIP_DIR, f"artist_leads_{timestamp}.json")
                    os.makedirs(STEWARDSHIP_DIR, exist_ok=True)
                    with open(file_path, 'w') as f:
                        json.dump(filtered, f, indent=2)
                    log_symbiote("artist_discovery", {
                        "count": len(filtered),
                        "file": file_path,
                        "genre_filter": genre or "any"
                    })
                    print(f"✅ Saved {len(filtered)} high-nurture artists to {file_path}")

                return filtered
            except json.JSONDecodeError:
                print("❌ Invalid JSON from Council")
                return []
        else:
            print(f"❌ Council failed: {response.status_code} - {response.text}")
            return []
    except Exception as e:
        print(f"❌ Discovery error: {e}")
        return []

# ────────────────────────────────────────────────
# CLI MAIN
# ────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Artemis Symbiote: evolve code, monitor, harvest, discover artists")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Code evolution
    evolve = subparsers.add_parser("evolve", help="Evolve/repair code files")
    evolve.add_argument("path", type=str, help="File or directory to scan")
    evolve.add_argument("--dry-run", action="store_true")
    evolve.add_argument("--no-backup", action="store_true")

    # Monitoring
    subparsers.add_parser("check", help="Verify env vars")
    subparsers.add_parser("ping", help="Test Council API")

    # Harvest
    harvest = subparsers.add_parser("harvest", help="Basic single-page harvest")
    harvest.add_argument("url", type=str, help="URL to harvest")

    # Artist Discovery
    discover = subparsers.add_parser("discover-artists", help="Discover music artists via Council")
    discover.add_argument("--genre", type=str, default=None, help="Filter by genre")
    discover.add_argument("--limit", type=int, default=10, help="Max number of artists")
    discover.add_argument("--min-nurture", type=int, default=7, help="Minimum nurture score")

    args = parser.parse_args()

    if args.command == "evolve":
        target = Path(args.path).resolve()
        backup = not args.no_backup
        if target.is_file():
            if target.suffix in SUPPORTED_EXTENSIONS:
                process_file(target, args.dry_run, backup)
            else:
                print(f"Unsupported extension: {target.suffix}")
        elif target.is_dir():
            for file in target.rglob("*"):
                if file.is_file() and file.suffix in SUPPORTED_EXTENSIONS:
                    print(f"\nScanning {file.relative_to(target)}")
                    process_file(file, args.dry_run, backup)
        else:
            print("Path not found or invalid")

    elif args.command == "check":
        check_env()

    elif args.command == "ping":
        ping_council()

    elif args.command == "harvest":
        basic_harvest(args.url)

    elif args.command == "discover-artists":
        leads = discover_music_artists(
            genre=args.genre,
            limit=args.limit,
            min_nurture=args.min_nurture
        )
        if leads:
            print(json.dumps(leads, indent=2))

    print("Symbiote task complete.")

if __name__ == "__main__":
    main()
