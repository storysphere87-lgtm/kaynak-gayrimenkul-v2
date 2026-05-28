-- Nextoria & Kaynak Gayrimenkul - Supabase RLS Sonsuz Döngü (Infinite Recursion) Düzeltme Migrasyonu
-- Bu dosya, public.profiles tablosuna yapılan sorguların kendi içindeki RLS politikaları nedeniyle 
-- veritabanı kilitlenmelerine ("infinite recursion detected in policy") sebep olmasını kalıcı olarak çözer.

-- ===========================================================================================
-- 1. ADIM: Güvenlik Tanımlı (SECURITY DEFINER) Yardımcı Fonksiyon Oluşturma
-- Bu fonksiyon, RLS politikalarını tetiklemeden (Postgres Owner yetkisiyle) kullanıcının admin olup olmadığını sorgular.
-- ===========================================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::public.user_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===========================================================================================
-- 2. ADIM: PROFILES TABLOSU İÇİN YENİ REKÜRSİF OLMAYAN RLS POLİTİKALARI
-- ===========================================================================================

-- Eski problemli politikayı kaldıralım
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Yöneticiler tüm profilleri görebilir (Sonsuz döngüyü önleyen yeni fonksiyon ile)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING ( public.is_admin() );

-- Herkes kendi profilini görebilir (Bu sayede recursion tetiklenmez)
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING ( auth.uid() = id );

-- Herkes kendi profilini güncelleyebilir
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING ( auth.uid() = id );


-- ===========================================================================================
-- 3. ADIM: LEADS TABLOSU POLİTİKALARINI GÜNCELLEME
-- ===========================================================================================

DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update all leads" ON public.leads;
DROP POLICY IF EXISTS "Agents can view assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Agents can update assigned leads" ON public.leads;

-- Yöneticiler tüm talepleri görebilir
CREATE POLICY "Admins can view all leads" 
ON public.leads FOR SELECT 
USING ( public.is_admin() );

-- Yöneticiler tüm talepleri güncelleyebilir
CREATE POLICY "Admins can update all leads" 
ON public.leads FOR UPDATE 
USING ( public.is_admin() );

-- Danışmanlar kendilerine atanan talepleri veya yöneticiler her şeyi görebilir
CREATE POLICY "Agents can view assigned leads" 
ON public.leads FOR SELECT 
USING ( assigned_to = auth.uid() OR public.is_admin() );

-- Danışmanlar kendilerine atanan talepleri veya yöneticiler her şeyi güncelleyebilir
CREATE POLICY "Agents can update assigned leads" 
ON public.leads FOR UPDATE 
USING ( assigned_to = auth.uid() OR public.is_admin() );


-- ===========================================================================================
-- 4. ADIM: PROPERTIES TABLOSU POLİTİKALARINI GÜNCELLEME
-- ===========================================================================================

DROP POLICY IF EXISTS "Danışmanlar kendi ilanlarını ekleyebilir/düzenleyebilir" ON public.properties;

CREATE POLICY "Danışmanlar kendi ilanlarını ekleyebilir/düzenleyebilir" 
ON public.properties FOR ALL 
USING ( agent_id = auth.uid() OR public.is_admin() );


-- ===========================================================================================
-- 5. ADIM: ACTIVITIES (KPI TAKİBİ) TABLOSU POLİTİKALARINI GÜNCELLEME
-- ===========================================================================================

DROP POLICY IF EXISTS "Herkes kendi aktivitelerini görebilir" ON public.activities;
DROP POLICY IF EXISTS "Danışmanlar kendi aktivitesini ekleyebilir" ON public.activities;
DROP POLICY IF EXISTS "Yöneticiler tüm aktiviteleri yönetebilir" ON public.activities;

CREATE POLICY "Herkes kendi aktivitelerini görebilir" 
ON public.activities FOR SELECT 
USING ( agent_id = auth.uid() OR public.is_admin() );

CREATE POLICY "Danışmanlar kendi aktivitesini ekleyebilir" 
ON public.activities FOR INSERT 
WITH CHECK ( agent_id = auth.uid() OR public.is_admin() );

CREATE POLICY "Yöneticiler tüm aktiviteleri yönetebilir" 
ON public.activities FOR ALL 
USING ( public.is_admin() );


-- ===========================================================================================
-- 6. ADIM: ALTYAPI VE İZLEME (INFRASTRUCTURE & STATS) POLİTİKALARINI GÜNCELLEME
-- ===========================================================================================

-- API Logs
DROP POLICY IF EXISTS "Admins can view api logs" ON public.api_logs;
CREATE POLICY "Admins can view api logs" 
ON public.api_logs FOR SELECT 
USING ( public.is_admin() );

-- Session Logs
DROP POLICY IF EXISTS "Admins can view all session logs" ON public.session_logs;
CREATE POLICY "Admins can view all session logs" 
ON public.session_logs FOR SELECT 
USING ( public.is_admin() );

-- Sitemap Pings
DROP POLICY IF EXISTS "Admins can view sitemap pings" ON public.sitemap_pings;
CREATE POLICY "Admins can view sitemap pings" 
ON public.sitemap_pings FOR SELECT 
USING ( public.is_admin() );

-- Market Stats (Piyasa İstatistikleri)
DROP POLICY IF EXISTS "Sadece yöneticiler piyasa istatistiklerini düzenleyebilir" ON public.market_stats;
CREATE POLICY "Sadece yöneticiler piyasa istatistiklerini düzenleyebilir" 
ON public.market_stats FOR ALL 
USING ( public.is_admin() );

-- ===========================================================================================
-- DÜZELTME BAŞARIYLA HAZIRLANDI!
-- Bu SQL kodlarını Supabase SQL Editor'de çalıştırdığınızda tüm RLS döngü hataları sıfırlanacaktır.
-- ===========================================================================================
