# harvesting/workload_manager.py
"""
Artemis Workload Manager
Manages prioritized URL harvesting queue in PostgreSQL.
Uses connection pooling for safety in concurrent or serverless environments.
"""

import logging
from typing import Dict, Optional, Any
from urllib.parse import urlparse

import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor, execute_values

# Configure logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
logger.addHandler(handler)


class ArtemisWorkload:
    """
    Manages the harvesting workload queue in PostgreSQL.
    Uses a threaded connection pool for safe concurrent access.
    """

    def __init__(self, db_config: Dict[str, Any] = None, minconn: int = 1, maxconn: int = 10):
        """
        Initialize the workload manager with connection pool.

        Args:
            db_config: Dict with keys: dbname, user, password, host, port
                       If None, reads from environment variables via psycopg2 defaults
            minconn: Minimum connections in pool
            maxconn: Maximum connections in pool
        """
        if db_config is None:
            db_config = {}  # Let psycopg2 use env vars (DATABASE_URL, etc.)

        self.pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=minconn,
            maxconn=maxconn,
            **db_config
        )
        logger.info("Workload manager initialized with connection pool (min=%d, max=%d)", minconn, maxconn)

    def _get_connection(self):
        """Get a connection from the pool."""
        return self.pool.getconn()

    def _put_connection(self, conn):
        """Return connection to pool."""
        self.pool.putconn(conn)

    def close(self):
        """Close all connections in the pool (call on shutdown)."""
        self.pool.closeall()
        logger.info("Connection pool closed")

    def add_to_harvest(
        self,
        url: str,
        origin: str = "harvester",
        priority_score: float = 1.0,
        source_note: str = None
    ) -> bool:
        """
        Add a URL to the harvest queue if it doesn't already exist.

        Returns True if inserted, False if already present.
        """
        if not url or not isinstance(url, str):
            raise ValueError("Valid URL string required")

        # Basic normalization
        parsed = urlparse(url)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError(f"Invalid URL format: {url}")

        query = """
        INSERT INTO web_map (url, source_origin, priority_score, source_note, status)
        VALUES (%s, %s, %s, %s, 'queued')
        ON CONFLICT (url) DO NOTHING
        RETURNING id;
        """
        conn = None
        try:
            conn = self._get_connection()
            with conn.cursor() as cur:
                cur.execute(query, (url, origin, priority_score, source_note))
                inserted = cur.fetchone() is not None
                conn.commit()
                logger.debug("URL %s %s", url, "inserted" if inserted else "already exists")
                return inserted
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error("Failed to add URL %s: %s", url, e)
            raise
        finally:
            if conn:
                self._put_connection(conn)

    def get_next_job(self) -> Optional[Dict[str, Any]]:
        """
        Atomically claim the highest-priority queued job and mark it as scanning.
        Returns job dict or None if no jobs available.
        """
        query = """
        UPDATE web_map 
        SET status = 'scanning', scanning_started_at = NOW()
        WHERE id = (
            SELECT id FROM web_map 
            WHERE status = 'queued'
            ORDER BY priority_score DESC, discovered_at ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        )
        RETURNING id, url, priority_score, source_origin;
        """
        conn = None
        try:
            conn = self._get_connection()
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query)
                job = cur.fetchone()
                if job:
                    conn.commit()
                    logger.info("Claimed job: %s (priority %.1f)", job['url'], job['priority_score'])
                    return dict(job)
                return None
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error("Failed to get next job: %s", e)
            raise
        finally:
            if conn:
                self._put_connection(conn)

    def mark_complete(self, job_id: int, harvested_count: int = 0) -> bool:
        """Mark a scanning job as complete."""
        query = """
        UPDATE web_map 
        SET status = 'complete', completed_at = NOW(), harvested_count = %s
        WHERE id = %s AND status = 'scanning';
        """
        return self._update_status(job_id, query, (harvested_count,))

    def mark_failed(self, job_id: int, error_message: str = None) -> bool:
        """Mark a scanning job as failed."""
        query = """
        UPDATE web_map 
        SET status = 'failed', error_message = %s, failed_at = NOW()
        WHERE id = %s AND status = 'scanning';
        """
        return self._update_status(job_id, query, (error_message,))

    def _update_status(self, job_id: int, query: str, params: tuple) -> bool:
        conn = None
        try:
            conn = self._get_connection()
            with conn.cursor() as cur:
                cur.execute(query, params + (job_id,))
                updated = cur.rowcount > 0
                conn.commit()
                if updated:
                    logger.debug("Updated job %d status", job_id)
                else:
                    logger.warning("Job %d not found or not in scanning state", job_id)
                return updated
        except Exception as e:
            if conn:
                conn.rollback()
            logger.error("Status update failed for job %d: %s", job_id, e)
            return False
        finally:
            if conn:
                self._put_connection(conn)

    def get_queue_stats(self) -> Dict[str, int]:
        """Get basic queue statistics."""
        query = """
        SELECT 
            COUNT(*) FILTER (WHERE status = 'queued') AS queued,
            COUNT(*) FILTER (WHERE status = 'scanning') AS scanning,
            COUNT(*) FILTER (WHERE status = 'complete') AS complete,
            COUNT(*) FILTER (WHERE status = 'failed') AS failed
        FROM web_map;
        """
        conn = self._get_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query)
                return dict(cur.fetchone())
        finally:
            self._put_connection(conn)


# ────────────────────────────────────────────────
# Example usage / test
# ────────────────────────────────────────────────
if __name__ == "__main__":
    import os

    # Example config (use env vars or config file in production)
    config = {
        "dbname": os.getenv("DB_NAME", "artemis"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", ""),
        "host": os.getenv("DB_HOST", "localhost"),
        "port": os.getenv("DB_PORT", "5432"),
    }

    manager = ArtemisWorkload(config)

    # Add some URLs
    manager.add_to_harvest("https://example.com/research", priority_score=8.5)
    manager.add_to_harvest("https://example.org/blog", priority_score=3.0)

    # Get and process next job
    job = manager.get_next_job()
    if job:
        print(f"Processing: {job['url']} (priority {job['priority_score']})")
        # ... do harvesting ...
        manager.mark_complete(job['id'], harvested_count=12)

    # Stats
    print("Queue stats:", manager.get_queue_stats())

    manager.close()
