-- 1. Danışman Aktiviteleri Tablosu (KPI Takibi için)
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('Arama', 'Görüşme', 'Yer Gösterme', 'Portföy Ekleme')),
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Ayarları
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes kendi aktivitelerini görebilir" 
ON public.activities FOR SELECT 
USING (
  agent_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Danışmanlar kendi aktivitesini ekleyebilir" 
ON public.activities FOR INSERT 
WITH CHECK (
  agent_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Yöneticiler tüm aktiviteleri yönetebilir" 
ON public.activities FOR ALL 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
