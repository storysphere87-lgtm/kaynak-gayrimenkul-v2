-- 3. Evrak Tablosuna İşlem İlişkisi Eklenmesi
ALTER TABLE public.agency_documents 
ADD COLUMN IF NOT EXISTS transaction_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE;

-- İndeks ekleyerek performansı optimize edelim
CREATE INDEX IF NOT EXISTS idx_agency_documents_transaction_id ON public.agency_documents(transaction_id);
