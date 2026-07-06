-- SQL Schema for CivicMind AI Database (Supabase / PostgreSQL)

-- 1. Citizen Complaints / Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY, -- Formatted like 'MTC-1234'
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,
    department TEXT NOT NULL,
    officer TEXT NOT NULL,
    stage INTEGER DEFAULT 0,
    description TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for scanning active tickets by category or status
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);

-- 2. Telemetry Logs Table (historical recordings for forecast analysis)
CREATE TABLE IF NOT EXISTS telemetry_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id TEXT NOT NULL,
    sensor_type TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    metric TEXT,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for searching timeline trends
CREATE INDEX IF NOT EXISTS idx_telemetry_logs_sensor ON telemetry_logs(sensor_id, logged_at DESC);

-- 3. Action History Table
CREATE TABLE IF NOT EXISTS action_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_name TEXT NOT NULL,
    impact TEXT,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed Initial Mock Tickets for testing (if empty)
INSERT INTO tickets (id, title, category, priority, status, department, officer, stage, description, submitted_at)
VALUES 
('MTC-9482', 'Pothole on Broadway & 42nd St', 'Roads & Bridges', 'Medium', 'In Progress', 'Department of Transportation', 'Marcus Vance', 3, 'Large pothole in center lane causing traffic slow downs.', now() - interval '2 hours'),
('MTC-9388', 'Overflowing dumpsters near Central Park West exit', 'Sanitation & Waste', 'High', 'Resolved', 'Environmental Services', 'Elena Rostova', 4, 'Commercial dumpsters are completely full and garbage is spilling onto the pedestrian path.', now() - interval '1 day'),
('MTC-9210', 'Flickering streetlights outside Senior Care Center', 'Utilities & Lighting', 'Critical', 'Assigned', 'Power Grid Commission', 'Julian Drake', 2, 'Three streetlights are flickering or off, making the walkway dangerous for residents.', now() - interval '3 hours')
ON CONFLICT (id) DO NOTHING;
