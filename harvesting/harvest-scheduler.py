# harvesting/harvest-scheduler.py
import time
import subprocess
from workload_manager import ArtemisWorkload
from config import get_config

config = get_config()

manager = ArtemisWorkload(config['db'])

while True:
    job = manager.get_next_job()
    if not job:
        print("Queue empty. Sleeping 30s...")
        time.sleep(30)
        continue

    url = job['url']
    print(f"Processing job {job['id']}: {url}")

    try:
        # Option A: Call Node.js recursive harvest
        result = subprocess.run(
            ["node", "recursive-harvest.js", url],
            capture_output=True, text=True, timeout=300
        )
        if result.returncode == 0:
            manager.mark_complete(job['id'], harvested_count=42)  # parse real count
        else:
            manager.mark_failed(job['id'], result.stderr)
    except Exception as e:
        manager.mark_failed(job['id'], str(e))
