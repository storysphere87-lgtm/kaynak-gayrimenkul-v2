'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Printer, Download, FileText } from 'lucide-react';

export default function AdminBelgeler({ params }: { params: { lang: string } }) {
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    document_type: 'sözleşme',
    tags: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    async function checkAuthAndFetch() {
      const { supabase } = await import('@/lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push(`/${params.lang}/admin/login`);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('agency_documents')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setDocuments(data || []);
      } catch (err: any) {
        setNotification({ message: 'Belgeler çekilemedi: ' + err.message, type: 'error' });
      } finally {
        setLoading(false);
      }
    }
    checkAuthAndFetch();
  }, [params.lang, router]);

  const handleLogout = async () => {
    const { supabase } = await import('@/lib/supabase');
    await supabase.auth.signOut();
    router.push(`/${params.lang}/admin/login`);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setNotification({ message: 'Lütfen bir dosya seçin.', type: 'error' });
      return;
    }

    setUploading(true);
    try {
      const { supabase } = await import('@/lib/supabase');
      
      // 1. Storage'a yükle (bucket: documents)
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${formData.document_type}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      // Public URL al
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Etiketleri diziye çevir
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);

      // 2. Veritabanına kaydet
      const { error: dbError } = await supabase
        .from('agency_documents')
        .insert([{
          title: formData.title,
          description: formData.description,
          file_url: publicUrl,
          document_type: formData.document_type,
          tags: tagsArray
        }]);

      if (dbError) throw dbError;

      setNotification({ message: 'Belge başarıyla yüklendi!', type: 'success' });
      
      // Reset form & refresh
      setFormData({ ...formData, title: '', description: '', tags: '' });
      setSelectedFile(null);
      
      // Refresh list
      const { data } = await supabase.from('agency_documents').select('*').order('created_at', { ascending: false });
      setDocuments(data || []);
      
    } catch (error: any) {
      setNotification({ message: 'Hata: ' + error.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu belgeyi tamamen silmek istediğinize emin misiniz?')) return;
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.from('agency_documents').delete().eq('id', id);
      if (error) throw error;
      setNotification({ message: 'Belge silindi.', type: 'success' });
      setDocuments(documents.filter(d => d.id !== id));
    } catch (err: any) {
      setNotification({ message: 'Hata: ' + err.message, type: 'error' });
    }
  };

  const handlePrint = (url: string) => {
    // Basic implementation for printing a document
    // If it's a PDF, we can open it in an iframe or new window and trigger print
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      setNotification({ message: 'Lütfen açılır pencere engelleyicisini kapatın.', type: 'error' });
    }
  };

  if (loading) return <div className="p-20 text-center">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-24 pb-20">
      {notification && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-top-10 duration-500 ${
          notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-3 font-bold">
            <span>{notification.type === 'success' ? '✅' : '❌'}</span>
            {notification.message}
          </div>
        </div>
      )}

      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">Yönetim Paneli</h1>
          <button onClick={handleLogout} className="bg-red-50 text-red-600 px-6 py-2 rounded-xl font-bold hover:bg-red-100 transition-all">Güvenli Çıkış</button>
        </div>

        {/* QUICK NAVIGATION */}
        <div className="flex gap-4 mb-12">
          <button onClick={() => router.push(`/${params.lang}/admin`)} className="bg-white text-gray-700 px-6 py-3 rounded-xl font-bold border border-gray-200 hover:bg-gray-50 transition-all">İlanlar & Talepler</button>
          <button onClick={() => router.push(`/${params.lang}/admin/egitim`)} className="bg-white text-gray-700 px-6 py-3 rounded-xl font-bold border border-gray-200 hover:bg-gray-50 transition-all">🎓 Eğitimleri Yönet</button>
          <button onClick={() => router.push(`/${params.lang}/admin/belgeler`)} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold shadow-md">📄 Belgeleri Yönet</button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
          {/* SOL: YENİ BELGE YÜKLEME */}
          <div className="xl:col-span-4 bg-white p-8 rounded-3xl shadow-sm border border-gray-200 self-start">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <FileText className="text-yellow-600" /> Yeni Belge Ekle
            </h2>
            <form onSubmit={handleUpload} className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2">Belge Adı</label>
                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border p-3 rounded-xl" placeholder="Örn: Yetki Belgesi" />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2">Belge Türü</label>
                <select value={formData.document_type} onChange={e => setFormData({...formData, document_type: e.target.value})} className="w-full border p-3 rounded-xl bg-white">
                  <option value="sözleşme">Sözleşme</option>
                  <option value="tapu">Tapu</option>
                  <option value="vekaletname">Vekaletname</option>
                  <option value="beyan">Beyan</option>
                  <option value="diger">Diğer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Etiketler (Virgülle ayırın)</label>
                <input value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} className="w-full border p-3 rounded-xl text-sm" placeholder="Örn: acil, kiralık, çankaya" />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Açıklama (Opsiyonel)</label>
                <textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border p-3 rounded-xl"></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Dosya (PDF Önerilir)</label>
                <input required type="file" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="w-full border p-2 rounded-xl text-sm" />
              </div>

              <button disabled={uploading} className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all">
                {uploading ? 'Yükleniyor...' : 'Belgeyi Sisteme Ekle'}
              </button>
            </form>
          </div>

          {/* SAĞ: MEVCUT BELGELER */}
          <div className="xl:col-span-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold mb-6">Arşivlenmiş Belgeler ({documents.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {documents.length === 0 && (
                <div className="col-span-2 py-12 text-center text-gray-400 italic">Sistemde kayıtlı belge bulunmuyor.</div>
              )}
              {documents.map((doc: any) => (
                <div key={doc.id} className="border border-gray-100 rounded-2xl p-6 bg-gray-50 flex flex-col h-full hover:shadow-md hover:border-gray-200 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="px-2 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 inline-block">
                        {doc.document_type}
                      </span>
                      <h3 className="font-bold text-lg leading-tight">{doc.title}</h3>
                    </div>
                  </div>
                  
                  {doc.description && <p className="text-sm text-gray-600 mb-4 line-clamp-2">{doc.description}</p>}
                  
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {doc.tags.map((tag: string, i: number) => (
                        <span key={i} className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">#{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-gray-200 flex flex-wrap gap-2 justify-between items-center">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handlePrint(doc.file_url)}
                        className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800 transition-colors"
                      >
                        <Printer size={16} /> Yazdır
                      </button>
                      <a 
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors"
                      >
                        <Download size={16} /> İndir
                      </a>
                    </div>
                    <button 
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-500 hover:text-red-700 text-sm font-bold px-2 py-2"
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
