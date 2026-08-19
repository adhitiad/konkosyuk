-- Full-Text Search GIN Index for properties table
-- This index speeds up Indonesian language full-text search on title, address, and description

CREATE INDEX IF NOT EXISTS properties_search_idx 
ON properties 
USING GIN (to_tsvector('indonesian', name || ' ' || address || ' ' || COALESCE(description, '')));
