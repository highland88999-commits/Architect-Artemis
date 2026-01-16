# harvesting/workload_manager.py

import psycopg2
from psycopg2.extras import RealDictCursor

class ArtemisWorkload:
    def __init__(self, db_config):
        self.conn = psycopg2.connect(**db_config)

    def add_to_harvest(self, url, origin="harvester"):
        """Adds a new URL to the master map if it doesn't exist."""
        query = """
        INSERT INTO web_map (url, source_origin) 
        VALUES (%s, %s) 
        ON CONFLICT (url) DO NOTHING;
        """
        with self.conn.cursor() as cur:
            cur.execute(query, (url, origin))
            self.conn.commit()

    def get_next_job(self):
        """Artemis calls this to get the highest priority URL to scan."""
        query = """
        UPDATE web_map 
        SET status = 'scanning' 
        WHERE id = (
            SELECT id FROM web_map 
            WHERE status = 'queued' 
            ORDER BY priority_score DESC, discovered_at ASC 
            LIMIT 1
        )
        RETURNING url, id;
        """
        with self.conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query)
            job = cur.fetchone()
            self.conn.commit()
            return job

# Example usage:
# manager = ArtemisWorkload(config)
# manager.add_to_harvest("https://example.com/new-tech")
# next_url = manager.get_next_job()
