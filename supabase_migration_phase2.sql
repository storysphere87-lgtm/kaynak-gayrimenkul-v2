-- 1. Add translation columns to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS title_en TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS title_ar TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- 2. Create property-images Storage Bucket (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Setup Storage Policies for the new bucket
-- Anyone can view public property images
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'property-images');

-- Authenticated admins/service_role can upload
CREATE POLICY "Admin/Service Upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'property-images' AND auth.role() IN ('authenticated', 'service_role'));

-- 4. Supabase Webhook Setup Note:
-- Note: Supabase restricts creating pg_net HTTP triggers directly via SQL in free tier without pg_net extension enabled. 
-- The user should set up the webhook manually in the Supabase Dashboard -> Database -> Webhooks.
-- Event: INSERT on table 'properties'
-- Method: POST
-- URL: https://[YOUR_NETLIFY_URL]/api/webhook/property
