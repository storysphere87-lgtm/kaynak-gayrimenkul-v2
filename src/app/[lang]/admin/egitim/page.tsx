'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminEgitim({ params }: { params: { lang: string } }) {
  const router = useRouter();
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'pazarlama',
    file_type: 'pdf',
    is_public: false
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
          .from('training_resources')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setResources(data || []);
      } catch (err: any) {
        setNotification({ message: 'Eğitimler çekilemedi: ' + err.message, type: 'error' });
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
      
      // 1. Storage'a yükle (bucket: training)
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${formData.category}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('training')
        .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      // Public URL al
      const { data: { publicUrl } } = supabase.storage
        .from('training')
        .getPublicUrl(filePath);

      // 2. Veritabanına kaydet
      const { error: dbError } = await supabase
        .from('training_resources')
        .insert([{
          title: formData.title,
          description: formData.description,
          file_url: publicUrl,
          file_type: formData.file_type,
          category: formData.category,
          is_public: formData.is_public
        }]);

      if (dbError) throw dbError;

      setNotification({ message: 'Eğitim kaynağı başarıyla yüklendi!', type: 'success' });
      
      // Reset form & refresh
      setFormData({ ...formData, title: '', description: '' });
      setSelectedFile(null);
      
      // Refresh list
      const { data } = await supabase.from('training_resources').select('*').order('created_at', { ascending: false });
      setResources(data || []);
      
    } catch (error: any) {
      setNotification({ message: 'Hata: ' + error.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu eğitimi silmek istediğinize emin misiniz?')) return;
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase.from('training_resources').delete().eq('id', id);
      if (error) throw error;
      setNotification({ message: 'Eğitim silindi.', type: 'success' });
      setResources(resources.filter(r => r.id !== id));
    } catch (err: any) {
      setNotification({ message: 'Hata: ' + err.message, type: 'error' });
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
          <button onClick={() => router.push(`/${params.lang}/admin/egitim`)} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold shadow-md">🎓 Eğitimleri Yönet</button>
          <button onClick={() => router.push(`/${params.lang}/admin/belgeler`)} className="bg-white text-gray-700 px-6 py-3 rounded-xl font-bold border border-gray-200 hover:bg-gray-50 transition-all">📄 Belgeleri Yönet</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* SOL: YENİ EĞİTİM EKLEME */}
          <div className="lg:col-span-5 bg-white p-8 rounded-3xl shadow-sm border border-gray-200 self-start">
            <h2 className="text-2xl font-bold mb-6">Yeni Eğitim Yükle</h2>
            <form onSubmit={handleUpload} className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2">Başlık</label>
                <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border p-3 rounded-xl" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Kategori</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border p-3 rounded-xl bg-white">
                    <option value="pazarlama">Pazarlama</option>
                    <option value="hukuk">Hukuk</option>
                    <option value="teknik">Teknik Altyapı</option>
                    <option value="oryantasyon">Oryantasyon</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Dosya Türü</label>
                  <select value={formData.file_type} onChange={e => setFormData({...formData, file_type: e.target.value})} className="w-full border p-3 rounded-xl bg-white">
                    <option value="pdf">PDF</option>
                    <option value="video">Video (MP4)</option>
                    <option value="word">Word (DOCX)</option>
                    <option value="ppt">Sunum (PPTX)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Açıklama (Opsiyonel)</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border p-3 rounded-xl"></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Dosya</label>
                <input required type="file" onChange={e => setSelectedFile(e.target.files?.[0] || null)} className="w-full border p-2 rounded-xl text-sm" />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_public" checked={formData.is_public} onChange={e => setFormData({...formData, is_public: e.target.checked})} className="w-4 h-4" />
                <label htmlFor="is_public" className="text-sm">Herkese Açık (İşaretlenmezse sadece danışmanlar görebilir)</label>
              </div>

              <button disabled={uploading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all">
                {uploading ? 'Yükleniyor...' : 'Eğitimi Yükle'}
              </button>
            </form>
          </div>

          {/* SAĞ: MEVCUT EĞİTİMLER */}
          <div className="lg:col-span-7 bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold mb-6">Mevcut Eğitimler ({resources.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-gray-400 text-sm">
                    <th className="pb-4 font-medium">Başlık</th>
                    <th className="pb-4 font-medium">Kategori</th>
                    <th className="pb-4 font-medium">Tür</th>
                    <th className="pb-4 font-medium">İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-gray-400 italic">Henüz eğitim yüklenmedi.</td></tr>
                  )}
                  {resources.map((r: any) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-4 font-bold">{r.title}</td>
                      <td className="py-4 text-gray-600 capitalize">{r.category}</td>
                      <td className="py-4">
                        <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-bold uppercase">{r.file_type}</span>
                      </td>
                      <td className="py-4 flex gap-3">
                        <a href={r.file_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 font-bold text-sm">Görüntüle</a>
                        <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700 font-bold text-sm">Sil</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
