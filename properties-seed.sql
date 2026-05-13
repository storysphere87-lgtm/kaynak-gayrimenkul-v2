-- İlanlar (Properties) Tablosu Güncelleme
ALTER TABLE properties ADD COLUMN IF NOT EXISTS images JSONB;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS category TEXT; -- Daire, Villa, Arsa vb.
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description TEXT;

-- RLS Devre Dışı
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;

-- Gerçekçi Portföy Verisi
INSERT INTO properties (title, price, district_id, type, rooms, sqm, status, category, description, images) VALUES
(
  'Çankaya Vadi Manzaralı Lüks Rezidans', 
  12500000, 
  'cankaya', 
  'Satılık', 
  '4+1', 
  185, 
  'aktif', 
  'Daire',
  'Ankara''nın en prestijli bölgesinde, tam donanımlı akıllı ev sistemi ve vadi manzarasına sahip ultra lüks daire.',
  '[
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1600607687940-4e2a09695d51?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&q=80&w=1200"
  ]'
),
(
  'İncek Modern Havuzlu Villa', 
  28000000, 
  'golbasi', 
  'Satılık', 
  '6+2', 
  450, 
  'aktif', 
  'Villa',
  'Doğa ile iç içe, müstakil havuzlu, yerden ısıtmalı ve akıllı ev teknolojisiyle donatılmış modern villa.',
  '[
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1613977257592-4871e5fcd7c4?auto=format&fit=crop&q=80&w=1200"
  ]'
),
(
  'Eryaman Metro Yakını Aile Konutu', 
  4800000, 
  'etimesgut', 
  'Satılık', 
  '3+1', 
  145, 
  'aktif', 
  'Daire',
  'Metro durağına yürüme mesafesinde, geniş peyzaj alanına sahip site içerisinde bakımlı aile konutu.',
  '[
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=1200"
  ]'
),
(
  'Ümitköy Merkezi Kiralık Lüks Daire', 
  45000, 
  'cankaya', 
  'Kiralık', 
  '3+1', 
  160, 
  'aktif', 
  'Daire',
  'Ümitköy''ün kalbinde, tüm ulaşım akslarına yakın, yeni tadilatlı ve full yapılı kiralık daire.',
  '[
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&q=80&w=1200",
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1200"
  ]'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  price = EXCLUDED.price,
  images = EXCLUDED.images,
  description = EXCLUDED.description;
