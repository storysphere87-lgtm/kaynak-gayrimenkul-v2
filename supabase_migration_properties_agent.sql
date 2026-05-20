-- 4. İlanlar Tablosuna Danışman İlişkisi Eklenmesi
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- İndeks ekleyelim
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON public.properties(agent_id);

-- Geriye dönük uyumluluk: Eğer sistemde daha önceden atanmış ilan yoksa,
-- hepsini ilk bulduğumuz yöneticiye veya boşta bırakalım.
-- RLS politikası: Danışmanlar kendi ilanlarını ekleyebilir/düzenleyebilir, yöneticiler hepsini görebilir.
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Herkes aktif ilanları görebilir" ON public.properties;
CREATE POLICY "Herkes aktif ilanları görebilir" 
ON public.properties FOR SELECT 
USING (status = 'aktif' OR status = 'taslak');

DROP POLICY IF EXISTS "Danışmanlar kendi ilanlarını ekleyebilir/düzenleyebilir" ON public.properties;
CREATE POLICY "Danışmanlar kendi ilanlarını ekleyebilir/düzenleyebilir" 
ON public.properties FOR ALL 
USING (
  agent_id = auth.uid() OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
