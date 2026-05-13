-- Leads (Müşteri Talepleri) Tablosu
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  phone TEXT,
  email TEXT,
  district TEXT,
  property_type TEXT,
  budget TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Properties (İlanlar) Tablosu
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  price BIGINT,
  district_id TEXT,
  type TEXT,
  rooms TEXT,
  sqm INTEGER,
  status TEXT DEFAULT 'aktif',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Acil Operasyon İzni: Form akışının kesilmemesi için RLS devre dışı bırakıldı.
ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
