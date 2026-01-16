/* creator-creation/atlas/schema.sql */

CREATE TABLE IF NOT EXISTS internet_map (
    id SERIAL PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    discovered_by VARCHAR(50),   -- Which agent found it
    tech_stack JSONB,            -- Detected site tech
    priority_rank INTEGER,       -- 1-10 (Determined by 'Mom Directives')
    status VARCHAR(20),          -- 'pending', 'analyzing', 'archived'
    is_good_news BOOLEAN,        -- Filter for the Nurture directive
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
