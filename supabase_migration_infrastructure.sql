-- Nextoria & Kaynak Gayrimenkul - Altyapı ve Güvenlik Güçlendirme Migrasyonu (Faz 3)
-- Kök Neden Analizli Üretim Sınıfı Güvenlik ve İzleme Şeması

-- 1. Leads Tablosunda RLS Etkinleştirme (Gözden Kaçan Güvenlik Açığı Kapatıldı)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 2. SLA Yanıt Süresi İzleme Sütunları
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS responded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. API Çağrı Loglama Tablosu (Rate Limit ve Hata Yönetimi İçin)
CREATE TABLE IF NOT EXISTS public.api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  status_code INTEGER,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- api_logs RLS Politikaları (Sadece Admin veya Sistem Okuyabilir)
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view api logs" 
ON public.api_logs FOR SELECT 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 4. Kullanıcı / Danışman Dashboard Erişim Logları Tablosu (Churn Önleme)
CREATE TABLE IF NOT EXISTS public.session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'login', 'page_view', 'action_click'
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- session_logs RLS Politikaları
ALTER TABLE public.session_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own session logs" 
ON public.session_logs FOR SELECT 
USING ( profile_id = auth.uid() );

CREATE POLICY "Admins can view all session logs" 
ON public.session_logs FOR SELECT 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- 5. Google Sitemap Arama Motoru Ping İzleme Tablosu
CREATE TABLE IF NOT EXISTS public.sitemap_pings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  triggered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_url TEXT NOT NULL,
  status_code INTEGER,
  response_body TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sitemap_pings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view sitemap pings" 
ON public.sitemap_pings FOR SELECT 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
