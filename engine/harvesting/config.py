# harvesting/config.py
import os
from dotenv import load_dotenv

load_dotenv()

def get_config():
    return {
        'db': {
            'dbname': os.getenv('DB_NAME'),
            'user': os.getenv('DB_USER'),
            'password': os.getenv('DB_PASSWORD'),
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': os.getenv('DB_PORT', '5432'),
        },
        'max_depth': int(os.getenv('HARVEST_MAX_DEPTH', 3)),
        'polite_delay': float(os.getenv('HARVEST_DELAY_MS', 1.2)),
        'user_agent': os.getenv('HARVEST_USER_AGENT', 'Artemis-Harvester/1.0'),
        'blocked_domains': ['facebook.com', 'twitter.com', 'instagram.com'],  # example
    }
