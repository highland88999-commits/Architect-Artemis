# harvesting/queue_monitor.py
"""
Simple CLI dashboard to monitor the harvest queue.
Run: python queue_monitor.py
"""

import argparse
import sys
from tabulate import tabulate

from workload_manager import ArtemisWorkload
from config import get_config


def show_stats(manager: ArtemisWorkload):
    stats = manager.get_queue_stats()
    print("\n=== Harvest Queue Status ===")
    print(tabulate(
        [[k.capitalize(), v] for k, v in stats.items()],
        headers=["Status", "Count"],
        tablefmt="simple"
    ))


def list_top_jobs(manager: ArtemisWorkload, limit: int = 10):
    conn = manager._get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, url, priority_score, discovered_at, status
                FROM web_map
                ORDER BY priority_score DESC, discovered_at ASC
                LIMIT %s
            """, (limit,))
            rows = cur.fetchall()
            if not rows:
                print("No jobs in queue.")
                return

            print(f"\n=== Top {limit} Jobs by Priority ===")
            print(tabulate(
                [[r[0], r[1][:60] + "..." if len(r[1]) > 60 else r[1], f"{r[2]:.1f}", r[3], r[4]]
                 for r in rows],
                headers=["ID", "URL", "Priority", "Discovered", "Status"],
                tablefmt="github"
            ))
    finally:
        manager._put_connection(conn)


def main():
    parser = argparse.ArgumentParser(description="Artemis Harvest Queue Monitor")
    parser.add_argument("--stats", action="store_true", help="Show queue statistics")
    parser.add_argument("--top", type=int, default=10, help="Show top N jobs by priority")
    args = parser.parse_args()

    config = get_config()
    manager = ArtemisWorkload(config['db'])

    if args.stats:
        show_stats(manager)

    if args.top:
        list_top_jobs(manager, args.top)

    manager.close()


if __name__ == "__main__":
    main()
