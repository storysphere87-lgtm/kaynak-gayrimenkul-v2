-- Nextoria & Kaynak Gayrimenkul - Quantum OS Veritabanı Genişleme Migrasyonu (Modüller 1, 2 & 4)
-- Bu betik; e-Devlet doğrulaması, Gizli (Stealth) Portföy yapısı ve Birleşik Müşteri Etkileşim İzleyicisini kurar.

-- ===========================================================================================
-- 1. ADIM: PROPERTIES (İLANLAR) TABLOSUNUN GENİŞLETİLMESİ
-- ===========================================================================================

-- e-Devlet Uyumluluk Sütunları
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS e_devlet_verified BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS tapu_kayit_no TEXT;

-- Off-Market Stealth Portföy Sütunu
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS is_stealth BOOLEAN DEFAULT false NOT NULL;

-- İndeksleme (Sorgu performansı için)
CREATE INDEX IF NOT EXISTS idx_properties_is_stealth ON public.properties(is_stealth);

-- ===========================================================================================
-- 2. ADIM: STEALTH RLS GÜVENLİK POLİTİKALARININ GÜNCELLENMESİ
-- ===========================================================================================

-- Eski genel ilan izleme politikasını kaldıralım
DROP POLICY IF EXISTS "Herkes aktif ilanları görebilir" ON public.properties;

-- Yeni Akıllı RLS Politikası: Halka açık kullanıcılar sadece gizli olmayan (is_stealth = false) aktif ilanları görebilir.
-- Yöneticiler ise (public.is_admin() ile döngüsüz şekilde) tüm gizli ilanları da görebilir.
CREATE POLICY "Herkes aktif ilanları görebilir" 
ON public.properties FOR SELECT 
USING (
  (status = 'aktif' OR status = 'taslak') 
  AND (is_stealth = false OR public.is_admin())
);

-- ===========================================================================================
-- 3. ADIM: MÜŞTERİ ETKİLEŞİM İZLEYİCİSİ (CUSTOMER INTERACTIONS) TABLOSU
-- ===========================================================================================

CREATE TABLE IF NOT EXISTS public.customer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'negotiation_offer', 'form_submit', 'personalized_offer_generated')),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Etkinleştirme
ALTER TABLE public.customer_interactions ENABLE ROW LEVEL SECURITY;

-- Sadece yöneticiler (Admins) tüm etkileşim zaman tünelini görebilir
DROP POLICY IF EXISTS "Admins can view all customer interactions" ON public.customer_interactions;
CREATE POLICY "Admins can view all customer interactions" 
ON public.customer_interactions FOR SELECT 
USING ( public.is_admin() );

-- ===========================================================================================
-- GEÇİŞ BAŞARIYLA HAZIRLANDI!
-- ===========================================================================================
