-- GIN Indexes for JSONB columns on properties table
-- These indexes speed up queries that filter/search within amenities and metadata JSONB fields

CREATE INDEX IF NOT EXISTS properties_amenities_gin_idx 
ON properties 
USING GIN (amenities);

CREATE INDEX IF NOT EXISTS properties_metadata_gin_idx 
ON properties 
USING GIN (metadata);
