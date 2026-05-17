-- FAZ 4: Quantum OS Veritabanı Güncellemeleri

-- 1. Leads (Talepler) tablosuna AI Skoru ve Niyet Seviyesi eklenmesi
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS intent_level text DEFAULT 'Cold'; -- Seçenekler: Cold, Warm, Hot, VIP

-- 2. Eğer leads tablosunda 'source' kolonu yoksa ekleyelim (Nereden geldi: Exit Intent, İlan Detay vb.)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS source text DEFAULT 'Direct';

-- 3. Settings tablosuna Quantum OS metrikleri için varsayılan değerler
INSERT INTO settings (key, value, description)
VALUES 
  ('ai_lead_threshold', '75', 'Lead Skoru VIP sayılma sınırı'),
  ('market_trend_active', 'true', 'Pazar trendleri önyüzde gösterilsin mi?')
ON CONFLICT (key) DO NOTHING;
