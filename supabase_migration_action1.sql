-- ACTION 1: Digital Footprint & AI Intelligence for Leads
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS behavior_data JSONB,
ADD COLUMN IF NOT EXISTS ai_score INTEGER DEFAULT 0;

-- Ensure RLS allows the API to insert this data
-- (Assuming the service_role key will be used for AI updates, which bypasses RLS)
