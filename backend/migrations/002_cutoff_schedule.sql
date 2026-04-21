-- Cutoff schedule configuration (singleton table)
CREATE TABLE IF NOT EXISTS cutoff_schedules (
    id SERIAL PRIMARY KEY,
    cutoff_time VARCHAR(5) NOT NULL DEFAULT '16:00',
    is_auto_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
