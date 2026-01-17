-- schema.sql - ARTEMIS Database Schema (PostgreSQL / SQLite compatible)
-- Purpose: Persistent storage for domain mapping, harvests, inventions, stewardship, conflicts, and logs
-- Created: January 17, 2026

-- 0. Internet Map (your original table - central domain catalog)
CREATE TABLE IF NOT EXISTS internet_map (
    id SERIAL PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    discovered_by VARCHAR(50),          -- Which agent/script found it (e.g., 'crawler_engine', 'heartbeat')
    tech_stack JSONB,                   -- Detected technologies (e.g. {"frontend": "React", "server": "Node"})
    priority_rank INTEGER CHECK(priority_rank BETWEEN 1 AND 10),  -- 1-10, based on Mom Directives
    status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'analyzing', 'processed', 'archived', 'recycled')),
    is_good_news BOOLEAN DEFAULT FALSE, -- Nurture directive filter
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1. Harvests Table (single & recursive harvests)
CREATE TABLE IF NOT EXISTS harvests (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL UNIQUE,
    domain TEXT NOT NULL,
    title TEXT,
    description TEXT,
    emails TEXT,                        -- JSON array or comma-separated
    flaws TEXT,                         -- JSON array or text summary
    council_verdict TEXT,
    nurture_score INTEGER DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    depth INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processed', 'failed', 'recycled'))
);

-- 2. Inventions Table (from architect.invent())
CREATE TABLE IF NOT EXISTS inventions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    source_url TEXT,                    -- Link to harvest/internet_map entry that inspired it
    concept TEXT,
    blueprint TEXT,                     -- Code sketch, MD content, or JSON blueprint
    nurture_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'prototype' CHECK(status IN ('prototype', 'reviewed', 'implemented', 'archived')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Conflicts & Legal Risks (from compass.js)
CREATE TABLE IF NOT EXISTS conflicts (
    id SERIAL PRIMARY KEY,
    reason TEXT NOT NULL,
    intent JSONB,                       -- Full intent object
    source_context TEXT,
    report_path TEXT,                   -- Path to .md file in morality-conflict/
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT
);

CREATE TABLE IF NOT EXISTS legal_risks (
    id SERIAL PRIMARY KEY,
    type TEXT,
    level TEXT CHECK(level IN ('LOW', 'MEDIUM', 'HIGH')),
    intent JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Stewardship / Good News (nurtured content)
CREATE TABLE IF NOT EXISTS good_news (
    id SERIAL PRIMARY KEY,
    source_url TEXT,
    content TEXT NOT NULL,
    nurture_score INTEGER DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. System Logs (audit trail)
CREATE TABLE IF NOT EXISTS logs (
    id SERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,           -- e.g., 'harvest', 'invention', 'conflict', 'heartbeat', 'genesis'
    details JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_internet_map_url ON internet_map(url);
CREATE INDEX IF NOT EXISTS idx_harvests_url ON harvests(url);
CREATE INDEX IF NOT EXISTS idx_harvests_timestamp ON harvests(timestamp);
CREATE INDEX IF NOT EXISTS idx_inventions_name ON inventions(name);
CREATE INDEX IF NOT EXISTS idx_conflicts_timestamp ON conflicts(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);

-- Views for quick queries
CREATE VIEW IF NOT EXISTS recent_harvests AS
  SELECT url, title, nurture_score, timestamp, status
  FROM harvests
  ORDER BY timestamp DESC
  LIMIT 50;

CREATE VIEW IF NOT EXISTS high_nurture_domains AS
  SELECT url, nurture_score, status
  FROM internet_map
  WHERE is_good_news = TRUE AND nurture_score >= 7
  ORDER BY nurture_score DESC;

-- Initial seed data (optional - run once or on genesis)
INSERT INTO logs (event_type, details)
VALUES ('genesis', '{"message": "Database schema initialized", "version": "1.0", "date": "2026-01-17"}')
ON CONFLICT DO NOTHING;

-- Optional: Foreign key examples (uncomment if using PostgreSQL)
-- ALTER TABLE harvests ADD CONSTRAINT fk_harvests_map FOREIGN KEY (url) REFERENCES internet_map(url);
-- ALTER TABLE inventions ADD CONSTRAINT fk_inventions_source FOREIGN KEY (source_url) REFERENCES internet_map(url);
