-- FAZ 5: Quantum Pipeline (CRM ve Kanban Altyapısı)

-- 1. Transactions (İşlemler) Tablosu
CREATE TABLE IF NOT EXISTS transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES advisors(id) ON DELETE SET NULL,
  buyer_name text,
  buyer_phone text,
  price numeric NOT NULL,
  status text DEFAULT 'Sözleşme' CHECK (status IN ('Sözleşme', 'Kapora', 'Ekspertiz', 'Kredi Bekliyor', 'Tapu', 'Tamamlandı', 'İptal')),
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) ayarları
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 2. Eğer leads tablosunda agent_id yoksa ekleyelim (KPI takibi için)
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES advisors(id) ON DELETE SET NULL;
