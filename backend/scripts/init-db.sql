-- Initialize Twinkle database with TimescaleDB extension

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schemas for organization
CREATE SCHEMA IF NOT EXISTS indexer;
CREATE SCHEMA IF NOT EXISTS api;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA indexer TO twinkle;
GRANT ALL PRIVILEGES ON SCHEMA api TO twinkle;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Twinkle database initialized with TimescaleDB support';
END $$;
