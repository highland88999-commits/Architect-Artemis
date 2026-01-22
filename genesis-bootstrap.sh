#!/bin/bash
# genesis-bootstrap.sh - Enhanced ARTEMIS Bootstrap & Health Check
# Run after your original genesis setup to create additional folders, init files, and verify env

echo "========================================"
echo "ARTEMIS GENESIS BOOSTRAP - Health & Structure Check v1.1"
echo "========================================"
echo "Date: $(date -u)"
echo ""

# 1. Check required environment variables
required_vars=("GEMINI_API_KEY" "CLARIFAI_PAT" "ARTEMIS_LANDLINE")
missing=()

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing+=("$var")
  fi
done

if [ ${#missing[@]} -gt 0 ]; then
  echo "WARNING: Missing required env vars:"
  for m in "${missing[@]}"; do
    echo "  - $m"
  done
  echo "Some features may be limited. Set them in Vercel dashboard or .env."
else
  echo "✅ All required env vars present."
fi

# 2. Create missing directories (expanded from your original)
dirs=(
  "data"
  "data/processed"
  "data/harvested"
  "data/queue"
  "incubator"
  "ethics-core"
  "creator-creation"
  "creator-creation/stewardship"
  "creator-creation/mail-box"
  "morality-conflict"
  "legal-risks"
  "system-files/api"
  "harvesting"
)

for dir in "${dirs[@]}"; do
  if [ ! -d "$dir" ]; then
    mkdir -p "$dir"
    echo "Created directory: $dir"
  else
    echo "Directory exists: $dir"
  fi
done

# 3. Initialize empty JSON files if missing
json_files=(
  "data/queue.json []"
  "data/recycle_bin.json []"
)

for entry in "${json_files[@]}"; do
  file=$(echo "$entry" | awk '{print $1}')
  default=$(echo "$entry" | awk '{$1=""; print $0}' | xargs)
  if [ ! -f "$file" ]; then
    echo "$default" > "$file"
    echo "Initialized: $file"
  else
    echo "Exists: $file"
  fi
done

# 4. Quick self-test: Write genesis log
echo "Self-test: Writing bootstrap log..."
echo "Genesis bootstrap complete at $(date -u)" > creator-creation/stewardship/genesis_bootstrap_log.txt

# 5. Final report
echo ""
echo "========================================"
echo "GENESIS BOOTSTRAP COMPLETE"
echo "All additional folders and files initialized."
echo "Next steps:"
echo "  - Ensure .env or Vercel vars are set"
echo "  - Trigger Neural Heartbeat workflow"
echo "  - Run crawler_engine.js (manual or scheduled)"
echo "  - Test handshake: ant → dad in terminal"
echo "  - Check incubator/ for inventions"
echo "========================================"
exit 0
# At the end of genesis-bootstrap.sh

echo ""
echo "Installing common Python STEM packages locally (for dev/testing)..."
if command -v pip >/dev/null 2>&1; then
  pip install --user numpy scipy sympy
  echo "Installed numpy, scipy, sympy (user level)"
else
  echo "pip not found — skipping local Python package install"
fi
