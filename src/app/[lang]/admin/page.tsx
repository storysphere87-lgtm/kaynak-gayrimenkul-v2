'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getLeads, uploadImage, createProperty } from '@/lib/admin';
import { getAllDistricts } from '@/lib/api';

export default function AdminDashboard({ params }: { params: { lang: string } }) {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [activeProperties, setActiveProperties] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    title_en: '',
    title_ar: '',
    price: '',
    district_id: '',
    type: 'Satılık',
    rooms: '3+1',
    sqm: '',
    category: 'Daire',
    description: '',
    description_en: '',
    description_ar: ''
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();
      
      if (!session) {
        router.push(`/${params.lang}/admin/login`);
        return;
      }

      // Role kontrolü (JWT içinden kontrol)
      const role = session.user.user_metadata?.role;
      if (role !== 'admin') {
        setNotification({ message: 'Yetkisiz Erişim! Bu panel sadece yöneticiler içindir.', type: 'error' });
        await (await import('@/lib/supabase')).supabase.auth.signOut();
        router.push(`/${params.lang}/admin/login`);
        return;
      }

      fetchData();
    }

    async function fetchData() {
      try {
        const supabase = (await import('@/lib/supabase')).supabase;
        const [leadsData, districtsData, settingsRes] = await Promise.all([
          getLeads(),
          getAllDistricts(),
          supabase.from('settings').select('*')
        ]);
        setLeads(leadsData);
        setDistricts(districtsData);
        setSettings(settingsRes.data || []);
        
        // İlanları çek
        const { data: allProps } = await supabase
          .from('properties')
          .select('*')
          .order('created_at', { ascending: false });
        
        setDrafts(allProps?.filter(p => p.status === 'taslak') || []);
        setActiveProperties(allProps?.filter(p => p.status !== 'taslak') || []);

      } catch (error) {
        console.error('Veri çekme hatası:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [params.lang]);

  const handleLogout = async () => {
    await (await import('@/lib/supabase')).supabase.auth.signOut();
    router.push(`/${params.lang}/admin/login`);
  };

  const handleApprove = async (id: string) => {
    const { approvePropertyAction } = await import('./actions');
    const result = await approvePropertyAction(id, params.lang);
    if (result.success) {
      setNotification({ message: 'İlan Başarıyla Yayına Alındı!', type: 'success' });
      window.location.reload();
    } else {
      setNotification({ message: 'Hata: ' + result.error, type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu ilanı tamamen silmek istediğinize emin misiniz?')) return;
    const { deletePropertyAction } = await import('./actions');
    const result = await deletePropertyAction(id, params.lang);
    if (result.success) {
      setNotification({ message: 'İlan Sistemden Silindi.', type: 'success' });
      window.location.reload();
    } else {
      setNotification({ message: 'Hata: ' + result.error, type: 'error' });
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const { updateSettingsAction } = await import('./actions');
    const result = await updateSettingsAction(settings, params.lang);
    if (result.success) setNotification({ message: 'Sistem Ayarları Güncellendi.', type: 'success' });
    else setNotification({ message: 'Hata: ' + result.error, type: 'error' });
  };

  const handleAIAnalysis = async (id: string) => {
    setNotification({ message: 'AI Analizi yapılıyor, lütfen bekleyin...', type: 'success' });
    const { analyzePropertyPriceAction } = await import('./actions');
    const result = await analyzePropertyPriceAction(id);
    if (result.success && result.result) {
      alert(`AI DEĞERLENDİRMESİ:\n\nDeğerleme: ${result.result.evaluation}\nTahmini Fiyat: ${result.result.estimated_value}\nÖneri: ${result.result.suggestion}`);
    } else {
      setNotification({ message: 'Hata: ' + result.error, type: 'error' });
    }
  };

  const handleDownloadStory = (property: any) => {
    const url = new URL(window.location.origin + '/api/social-story');
    url.searchParams.set('title', property.title);
    url.searchParams.set('price', property.price.toLocaleString('tr-TR'));
    url.searchParams.set('district', property.district_id);
    url.searchParams.set('specs', `${property.rooms} | ${property.sqm} m² | ${property.type}`);
    if (property.images && property.images.length > 0) {
      url.searchParams.set('image', property.images[0]);
    }
    window.open(url.toString(), '_blank');
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const { createPropertyAction } = await import('./actions');
      const formDataToSend = new FormData();
      
      // Form verilerini doldur
      formDataToSend.append('title', formData.title);
      formDataToSend.append('title_en', formData.title_en);
      formDataToSend.append('title_ar', formData.title_ar);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('district_id', formData.district_id);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('rooms', formData.rooms);
      formDataToSend.append('sqm', formData.sqm);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('description_en', formData.description_en);
      formDataToSend.append('description_ar', formData.description_ar);
      
      // Resimleri ekle
      selectedFiles.forEach(file => {
        formDataToSend.append('images', file);
      });

      const result = await createPropertyAction(formDataToSend, params.lang);

      if (result.success) {
        setNotification({ message: 'İlan başarıyla oluşturuldu!', type: 'success' });
        window.location.reload();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      setNotification({ message: 'Hata: ' + error.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-20 text-center">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pt-24 pb-20">
      {/* PROFESSIONAL NOTIFICATION BANNER */}
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
          <button 
            onClick={handleLogout}
            className="bg-red-50 text-red-600 px-6 py-2 rounded-xl font-bold hover:bg-red-100 transition-all"
          >
            Güvenli Çıkış
          </button>
        </div>

        {/* QUICK NAVIGATION */}
        <div className="flex gap-4 mb-12">
          <button 
            onClick={() => router.push(`/${params.lang}/admin`)}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold shadow-md"
          >
            İlanlar & Talepler
          </button>
          <button 
            onClick={() => router.push(`/${params.lang}/admin/egitim`)}
            className="bg-white text-gray-700 px-6 py-3 rounded-xl font-bold border border-gray-200 hover:bg-gray-50 transition-all"
          >
            🎓 Eğitimleri Yönet
          </button>
          <button 
            onClick={() => router.push(`/${params.lang}/admin/belgeler`)}
            className="bg-white text-gray-700 px-6 py-3 rounded-xl font-bold border border-gray-200 hover:bg-gray-50 transition-all"
          >
            📄 Belgeleri Yönet
          </button>
          <button 
            onClick={() => router.push(`/${params.lang}/admin/pipeline`)}
            className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold border border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
          >
            💼 İşlem Takibi (Kanban)
          </button>
          <button 
            onClick={() => router.push(`/${params.lang}/admin/kpi`)}
            className="bg-white text-purple-600 px-6 py-3 rounded-xl font-bold border border-purple-200 hover:bg-purple-50 transition-all shadow-sm"
          >
            📊 Danışman KPI
          </button>
        </div>

        {/* QUANTUM OS - İSTATİSTİKLER (FAZ 4) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Toplam Talep</p>
              <p className="text-3xl font-bold">{leads.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">👥</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">VIP & Sıcak Lead</p>
              <p className="text-3xl font-bold text-yellow-600">
                {leads.filter(l => l.intent_level === 'VIP' || l.intent_level === 'Hot').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center text-xl">🔥</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Aktif İlan</p>
              <p className="text-3xl font-bold text-green-600">{activeProperties.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-xl">🏠</div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Bekleyen İlan</p>
              <p className="text-3xl font-bold text-orange-600">{drafts.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-xl">⏳</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* SOL: YENİ İLAN EKLEME */}
          <div className="lg:col-span-7 bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold mb-6">Yeni İlan Ekle</h2>
            <form onSubmit={handleCreateProperty} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2">İlan Başlığı (TR)</label>
                    <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border p-3 rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-500">İlan Başlığı (EN)</label>
                    <input value={formData.title_en} onChange={e => setFormData({...formData, title_en: e.target.value})} className="w-full border p-3 rounded-xl bg-gray-50" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-2 text-gray-500">İlan Başlığı (AR)</label>
                    <input value={formData.title_ar} onChange={e => setFormData({...formData, title_ar: e.target.value})} className="w-full border p-3 rounded-xl bg-gray-50" dir="rtl" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Fiyat (₺)</label>
                  <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border p-3 rounded-xl" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">Bölge</label>
                  <select required value={formData.district_id} onChange={e => setFormData({...formData, district_id: e.target.value})} className="w-full border p-3 rounded-xl">
                    <option value="">Seçiniz</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2">İşlem Tipi</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full border p-3 rounded-xl">
                    <option value="Satılık">Satılık</option>
                    <option value="Kiralık">Kiralık</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-2">Açıklama (TR)</label>
                  <textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border p-3 rounded-xl"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-500">Açıklama (EN)</label>
                  <textarea rows={4} value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} className="w-full border p-3 rounded-xl bg-gray-50"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 text-gray-500">Açıklama (AR)</label>
                  <textarea rows={4} value={formData.description_ar} onChange={e => setFormData({...formData, description_ar: e.target.value})} className="w-full border p-3 rounded-xl bg-gray-50" dir="rtl"></textarea>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">Resimler (Çoklu Seçebilirsiniz)</label>
                <input type="file" multiple accept="image/*" onChange={e => setSelectedFiles(Array.from(e.target.files || []))} className="w-full" />
              </div>

              <button disabled={uploading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all">
                {uploading ? 'Yükleniyor...' : 'İlanı Yayınla'}
              </button>
            </form>
          </div>

          {/* SAĞ: GELEN TALEPLER VE TASLAKLAR */}
          <div className="lg:col-span-5 space-y-8">
            {/* TASLAKLAR (Eklentiden Gelenler) */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-yellow-500/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] px-3 py-1 font-bold">EKLEME BEKLEYENLER</div>
              <h2 className="text-2xl font-bold mb-6">Onay Bekleyenler ({drafts.length})</h2>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {drafts.length === 0 && <p className="text-gray-400 italic">Şu an onay bekleyen ilan yok.</p>}
                {drafts.map((draft: any) => (
                  <div key={draft.id} className="border p-4 rounded-2xl bg-gray-50 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm">{draft.title}</p>
                      <p className="text-xs text-gray-500">{draft.district_id} | {draft.price} ₺</p>
                    </div>
                    <button 
                      onClick={() => handleApprove(draft.id)}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded-lg font-bold transition-all"
                    >
                      Onayla
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* GELEN TALEPLER (QUANTUM OS SCORING) */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold mb-6">Gelen Talepler ({leads.length})</h2>
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {leads.map((lead: any) => (
                  <div key={lead.id} className="border p-5 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3 border-b pb-3">
                      <div>
                        <span className="font-bold text-lg block text-gray-900">{lead.full_name || lead.name}</span>
                        <span className="text-xs text-gray-400">{new Date(lead.created_at).toLocaleString('tr-TR')}</span>
                      </div>
                      
                      {/* AI Skor Göstergesi */}
                      <div className="flex flex-col items-end gap-1">
                        {lead.score ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">AI SCORE</span>
                            <span className={`px-2 py-1 rounded font-mono font-bold text-xs
                              ${lead.score >= 80 ? 'bg-green-100 text-green-700' : 
                                lead.score >= 50 ? 'bg-yellow-100 text-yellow-700' : 
                                'bg-red-100 text-red-700'}`}>
                              {lead.score}/100
                            </span>
                          </div>
                        ) : null}
                        {lead.intent_level ? (
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border
                            ${lead.intent_level === 'VIP' ? 'bg-purple-100 text-purple-700 border-purple-200' : 
                              lead.intent_level === 'Hot' ? 'bg-red-100 text-red-700 border-red-200' : 
                              lead.intent_level === 'Warm' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
                              'bg-gray-100 text-gray-700 border-gray-200'}`}>
                            {lead.intent_level}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <p className="text-sm text-gray-700">📞 <a href={`tel:${lead.phone}`} className="hover:text-blue-600">{lead.phone}</a></p>
                      <p className="text-sm text-gray-700">📍 {lead.district || 'Belirtilmedi'}</p>
                      <p className="text-sm text-gray-700">💰 {lead.budget || 'Belirtilmedi'}</p>
                      <p className="text-sm text-gray-700">🏠 {lead.property_type || 'Belirtilmedi'}</p>
                    </div>

                    {lead.message && (
                      <div className="bg-white p-3 rounded-xl border border-gray-100 text-sm text-gray-600">
                        "{lead.message}"
                      </div>
                    )}
                    
                    {lead.source && (
                      <div className="mt-3 text-right">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">Kaynak: {lead.source}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SAAS KONTROL MERKEZİ (Sistem Ayarları) */}
            <div className="bg-[#0a0a0a] text-white p-8 rounded-3xl shadow-xl border border-yellow-500/20 shadow-yellow-500/5">
              <h2 className="text-2xl font-bold mb-6 text-yellow-500">Quantum OS / SaaS Ayarları</h2>
              <form onSubmit={handleUpdateSettings} className="space-y-4">
                {settings.map((s, index) => (
                  <div key={s.key}>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-widest">
                      {s.description || s.key}
                    </label>
                    <input 
                      type="text"
                      value={s.value || ''}
                      onChange={(e) => {
                        const newSettings = [...settings];
                        newSettings[index].value = e.target.value;
                        setSettings(newSettings);
                      }}
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-xl focus:border-yellow-500 outline-none text-sm transition-all"
                    />
                  </div>
                ))}
                <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 rounded-xl transition-all mt-4">
                  Sistem Ayarlarını Güncelle
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ALT: TÜM PORTFÖY YÖNETİMİ */}
        <div className="mt-16 bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold mb-8">Tüm Portföyü Yönet</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-gray-400 text-sm">
                  <th className="pb-4 font-medium">İlan Başlığı</th>
                  <th className="pb-4 font-medium">Bölge</th>
                  <th className="pb-4 font-medium">Fiyat</th>
                  <th className="pb-4 font-medium">Durum</th>
                  <th className="pb-4 font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {activeProperties.map((p: any) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="py-4 font-bold">{p.title}</td>
                    <td className="py-4 text-gray-600">{p.district_id}</td>
                    <td className="py-4 font-mono">{p.price.toLocaleString('tr-TR')} ₺</td>
                    <td className="py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleDownloadStory(p)}
                          className="text-purple-500 hover:text-purple-700 font-bold text-sm transition-colors flex items-center gap-1"
                          title="Günün Story'sini İndir"
                        >
                          📸 Story
                        </button>
                        <button 
                          onClick={() => handleAIAnalysis(p.id)}
                          className="text-blue-500 hover:text-blue-700 font-bold text-sm transition-colors flex items-center gap-1"
                        >
                          🤖 AI Analiz
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="text-red-500 hover:text-red-700 font-bold text-sm transition-colors"
                        >
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
