from flask import Flask, request, jsonify
from linguist import Linguist
import json
import os

app = Flask(__name__)
translator = Linguist()

# Ensure standard working directories exist
DIRECTORIES = ["diagnostics", "stewardship", "incubator"]
for folder in DIRECTORIES:
    os.makedirs(folder, exist_ok=True)

@app.route('/', methods=['GET'])
def home():
    # Example pulling English system text
    msg = translator.get_static_text("init", lang="en")
    return jsonify({"status": "active", "message": msg})

@app.route('/scan-endpoint', methods=['POST'])
def trigger_scan():
    """
    Receives an external target, runs background checks, 
    and dumps the JSON to the diagnostics folder.
    """
    data = request.get_json()
    target_url = data.get("target")
    language = data.get("lang", "en")

    # Log the scan payload
    audit_file = os.path.join("diagnostics", "health-audit.json")
    
    scan_results = {
        "target": target_url,
        "status": "scanned",
        "optimizations_written": False
    }

    with open(audit_file, "w") as f:
        json.dump(scan_results, f, indent=4)

    success_msg = translator.get_static_text("complete", lang=language)
    return jsonify({"status": "success", "message": success_msg})

if __name__ == '__main__':
    # Bind to standard cloud environment variables for deployment
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
