-- ACTION 4: AR/VR Virtual Tour Support
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT;
