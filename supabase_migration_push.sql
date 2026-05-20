-- Web Push Abonelikleri Tablosu (Zero-Cost Push Alerts)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Devre Dışı (SaaS entegrasyon kolaylığı için)
ALTER TABLE public.push_subscriptions DISABLE ROW LEVEL SECURITY;
