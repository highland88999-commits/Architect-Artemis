# Harvesting Pipeline – Architect Artemis

This folder contains the core crawling & workload management system.

## Components

- `loom.js`                Single-page harvest (Node.js + cheerio)
- `recursive-harvest.js`   Depth-limited recursive crawler (Node.js)
- `workload_manager.py`    PostgreSQL queue manager (add jobs, claim next, mark complete/failed)
- `harvest-scheduler.py`   Long-running worker that pulls jobs & runs harvesters
- `content_analyzer.py`    Text extraction, keywords, sentiment, entities
- `media_downloader.py`    Download images/PDFs/videos found during crawl
- `queue_monitor.py`       CLI dashboard to view queue status & top jobs

## Setup

```bash
cd harvesting
pip install -r requirements.txt
