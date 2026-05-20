-- 2. TÜİK Piyasa Trend ve İstatistikleri Tablosu
CREATE TABLE IF NOT EXISTS public.market_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  district_name text NOT NULL, -- Çankaya, Etimesgut, Yenimahalle, Gölbaşı vb.
  month_year text NOT NULL, -- "Nisan 2026", "Mayıs 2026"
  sales_volume integer NOT NULL, -- Toplam konut satışı sayısı
  price_index_change numeric NOT NULL, -- Aylık fiyat artış yüzdesi (örn: 3.4)
  average_sqm_price numeric NOT NULL, -- Ortalama m² fiyatı (örn: 34500)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Ayarları (Piyasa verileri herkese açıktır)
ALTER TABLE public.market_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes piyasa istatistiklerini görebilir" 
ON public.market_stats FOR SELECT 
USING (true);

CREATE POLICY "Sadece yöneticiler piyasa istatistiklerini düzenleyebilir" 
ON public.market_stats FOR ALL 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- ÖRNEK TÜİK VERİLERİ (SEED DATA)
INSERT INTO public.market_stats (district_name, month_year, sales_volume, price_index_change, average_sqm_price)
VALUES 
  ('Çankaya', 'Mayıs 2026', 1450, 4.2, 54200),
  ('Etimesgut', 'Mayıs 2026', 890, 3.8, 32100),
  ('Yenimahalle', 'Mayıs 2026', 920, 3.5, 36500),
  ('Gölbaşı', 'Mayıs 2026', 420, 5.1, 68000),
  ('Çankaya', 'Nisan 2026', 1380, 3.9, 52000),
  ('Etimesgut', 'Nisan 2026', 840, 3.2, 30900),
  ('Yenimahalle', 'Nisan 2026', 885, 3.1, 35200),
  ('Gölbaşı', 'Nisan 2026', 390, 4.8, 64700)
ON CONFLICT DO NOTHING;
