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

-- ADDED: Midas Status Table for Watchdog & Pivot
CREATE TABLE IF NOT EXISTS midas_status (
    id INTEGER PRIMARY KEY DEFAULT 1,
    trigger_intervention BOOLEAN DEFAULT FALSE,
    lost_id TEXT,
    target_id TEXT,
    latest_guidance TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial row required by check-midas-status and reset-midas-status
INSERT INTO midas_status (id, trigger_intervention, lost_id, target_id, latest_guidance)
VALUES (1, FALSE, NULL, NULL, 'System nominal. Awaiting telemetry.')
ON CONFLICT (id) DO NOTHING;
