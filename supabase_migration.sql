-- FAZ 1.5: Çok dil alanları (İlanlar için)
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS title_en text,
ADD COLUMN IF NOT EXISTS title_ar text,
ADD COLUMN IF NOT EXISTS description_en text,
ADD COLUMN IF NOT EXISTS description_ar text;

-- FAZ 2B.1: Eğitim Bölümü
CREATE TABLE IF NOT EXISTS training_resources (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  file_type text NOT NULL, -- video, pdf, word, ppt
  category text NOT NULL,  -- pazarlama, hukuk, teknik, oryantasyon
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  uploaded_by uuid,
  is_public boolean DEFAULT false
);

-- FAZ 2C.1: Belge Yönetimi
CREATE TABLE IF NOT EXISTS agency_documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  file_url text NOT NULL,
  document_type text NOT NULL, -- tapu, beyan, vekaletname, sözleşme
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  tags text[]
);
