# google_index_bridge.py
import json
import requests
import sys
from google.oauth2 import service_account
from google.auth.transport.requests import Request

# Load your service account key (store securely as env var or in .env)
SCOPES = ["https://www.googleapis.com/auth/indexing"]
credentials = service_account.Credentials.from_service_account_file(
    'path/to/your-service-account-key.json', scopes=SCOPES
)
credentials.refresh(Request())

def submit_url_for_indexing(url: str):
    if not url.startswith("https://"):
        return {"error": "URL must be HTTPS"}
    
    token = credentials.token
    endpoint = "https://indexing.googleapis.com/v3/urlNotifications:publish"
    payload = {
        "url": url,
        "type": "URL_UPDATED"  # or "URL_DELETED" if removing
    }
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    response = requests.post(endpoint, json=payload, headers=headers)
    if response.status_code == 200:
        return {"status": "submitted", "response": response.json()}
    else:
        return {"error": response.text, "code": response.status_code}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        result = submit_url_for_indexing(sys.argv[1])
        print(json.dumps(result))
    else:
        print(json.dumps({"error": "Provide URL as argument"}))
