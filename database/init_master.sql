-- database/init_master.sql

CREATE TABLE IF NOT EXISTS web_map (
    id SERIAL PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    source_origin TEXT,          -- Where did we find this URL?
    tech_stack JSONB,            -- Detected technologies
    priority_score INTEGER DEFAULT 1, 
    status VARCHAR(20) DEFAULT 'queued', -- queued, scanning, completed, failed
    last_scanned TIMESTAMP,
    discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inspirations (
    id SERIAL PRIMARY KEY,
    url_id INTEGER REFERENCES web_map(id),
    concept_tags TEXT[],         -- e.g., {'automation', 'neural-net'}
    logic_summary TEXT,          -- What Artemis found interesting
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
