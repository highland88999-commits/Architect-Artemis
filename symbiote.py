import os
import argparse
import difflib
import google.generativeai as genai
from pathlib import Path

# ────────────────────────────────────────────────
# CONFIG – fill these in
# ────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")  # or hardcode for testing
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

def evolve_code(code: str, filename: str) -> str:
    model = genai.GenerativeModel(MODEL, system_instruction=SYSTEM_PROMPT)
    prompt = f"Evolve and repair this code from {filename}:\n\n{code}"
    response = model.generate_content(prompt, generation_config={"temperature": 0.15})
    evolved = response.text.strip()

    # Clean common artifacts
    if evolved.startswith("```"):
        evolved = "\n".join(evolved.splitlines()[1:-1]).strip()
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

    if not dry_run:
        if backup:
            backup_path = file_path.with_suffix(file_path.suffix + ".symbiote.bak")
            file_path.rename(backup_path)
            print(f"Backup created: {backup_path}")
        file_path.write_text(evolved, encoding="utf-8")
        print(f"Evolved → {file_path}")
    else:
        print(f"Dry run – not writing {file_path}")

def main():
    parser = argparse.ArgumentParser(description="Artemis Symbiote: evolve code in directory")
    parser.add_argument("path", type=str, help="File or directory to scan")
    parser.add_argument("--dry-run", action="store_true", help="Show changes without writing")
    parser.add_argument("--no-backup", action="store_true", help="Skip backups")
    args = parser.parse_args()

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

if __name__ == "__main__":
    main()
