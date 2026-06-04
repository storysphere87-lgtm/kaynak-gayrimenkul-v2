'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getLeads, uploadImage, createProperty } from '@/lib/admin';
import { getAllDistricts } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Shield, User, Image as ImageIcon, Briefcase, FileText, GraduationCap, Settings, Sparkles, BarChart3, LogOut, Plus, QrCode, Copy, ExternalLink, X } from 'lucide-react';

export default function AdminDashboard({ params }: { params: { lang: string } }) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<'admin' | 'agent' | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [leads, setLeads] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [activeProperties, setActiveProperties] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // Dashboard QR Modal State
  const [showDashboardQR, setShowDashboardQR] = useState(false);

  // Değerleme Raporu Modal State
  const [valuationModal, setValuationModal] = useState<{
    show: boolean;
    loading: boolean;
    propertyTitle: string;
    result: any | null;
  }>({ show: false, loading: false, propertyTitle: '', result: null });


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
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    async function checkAuthAndFetch() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push(`/${params.lang}/admin/login`);
        return;
      }

      // ─── KÖK NEDEN DÜZELTMESİ ─────────────────────────────────────────────
      // Eski kod: sadece JWT metadata.role kontrol ediyordu → boşsa logout
      // Yeni kod: JWT → profiles tablosu → güvenli fallback (agent)
      // Bu sayede doğru şifre girildiğinde sistem artık kullanıcıyı atmıyor.
      // ─────────────────────────────────────────────────────────────────────────
      let role: string = session.user.user_metadata?.role || '';

      if (!role || (role !== 'admin' && role !== 'agent')) {
        // JWT'de geçerli rol yok, profiles tablosuna bak
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        role = profileData?.role || '';
      }

      if (!role || (role !== 'admin' && role !== 'agent')) {
        // Profiles tablosunda da yoksa güvenli fallback: agent
        role = 'agent';
        // Hem JWT metadata hem profiles tablosunu güncelle (bir sonraki girişte sorun olmaz)
        await supabase.auth.updateUser({ data: { role: 'agent' } });
        await supabase.from('profiles').upsert({
          id: session.user.id,
          role: 'agent',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Danışman',
        });
      }

      setUserRole(role as 'admin' | 'agent');
      setCurrentUser({
        id: session.user.id,
        email: session.user.email,
        name: session.user.user_metadata?.full_name || 'Danışman',
        role: role
      });

      // Veri Çekme Akışı (Rol Bazlı Filtreleme ile)
      try {
        const [districtsData, settingsRes] = await Promise.all([
          getAllDistricts(),
          supabase.from('settings').select('*')
        ]);
        
        setDistricts(districtsData);
        setSettings(settingsRes.data || []);

        // 1. Leads (Müşteri Talepleri) Filtreleme
        let leadsQuery = supabase.from('leads').select('*');
        if (role === 'agent') {
          // Danışman sadece kendisine atanmış leads'i görsün
          leadsQuery = leadsQuery.eq('agent_id', session.user.id);
        }
        const { data: leadsData } = await leadsQuery.order('created_at', { ascending: false });
        setLeads(leadsData || []);

        // 2. İlanları Çekme (Danışman filtrelemesi ile)
        let propsQuery = supabase.from('properties').select('*');
        if (role === 'agent') {
          // Danışman sadece kendi oluşturduğu/yönettiği ilanları görsün
          propsQuery = propsQuery.eq('agent_id', session.user.id);
        }
        const { data: allProps } = await propsQuery.order('created_at', { ascending: false });
        
        setDrafts(allProps?.filter(p => p.status === 'taslak') || []);
        setActiveProperties(allProps?.filter(p => p.status !== 'taslak') || []);

      } catch (error) {
        console.error('Veri çekme hatası:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndFetch();
  }, [params.lang, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
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

  const handleAIAnalysis = async (property: any) => {
    setValuationModal({ show: true, loading: true, propertyTitle: property.title, result: null });
    const { analyzePropertyPriceAction } = await import('./actions');
    const result = await analyzePropertyPriceAction(property.id);
    if (result.success && result.result) {
      setValuationModal({ show: true, loading: false, propertyTitle: property.title, result: result.result });
    } else {
      setValuationModal({ show: false, loading: false, propertyTitle: '', result: null });
      setNotification({ message: 'Değerleme Hatası: ' + result.error, type: 'error' });
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
      
      selectedFiles.forEach(file => {
        formDataToSend.append('images', file);
      });

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        formDataToSend.append('agent_id', session.user.id);
      }

      const result = await createPropertyAction(formDataToSend, params.lang);

      if (result.success) {
        if (session) {
          const { data: latestProp } = await supabase
            .from('properties')
            .select('id')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
            
          if (latestProp) {
            await supabase
              .from('properties')
              .update({ agent_id: session.user.id })
              .eq('id', latestProp.id);
          }
        }

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

  if (loading) return <div className="p-20 text-center text-gray-500 font-bold bg-gray-950 min-h-screen">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pt-24 pb-20 relative">
      
      {/* NOTIFICATION BANNER */}
      {notification && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl shadow-2xl ${
          notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-3 font-bold">
            <span>{notification.type === 'success' ? '✅' : '❌'}</span>
            {notification.message}
          </div>
        </div>
      )}

      <div className="container mx-auto px-6">
        
        {/* HEADER BAR */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <span className="text-yellow-600 text-xs font-bold uppercase tracking-[0.4em] mb-2 block">Kaynak Gayrimenkul</span>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white flex items-center gap-3">
              {userRole === 'admin' ? 'Yönetim & Broker Kokpiti' : 'Danışman Operasyon Portalı'}
            </h1>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-white/5 border border-white/10 hover:border-red-500/50 hover:text-red-500 px-8 py-3 rounded-2xl font-bold transition-all flex items-center gap-2"
          >
            <LogOut size={16} /> Güvenli Çıkış
          </button>
        </div>

        {/* QUICK NAVIGATION PANEL */}
        <div className="flex flex-wrap gap-4 mb-12">
          <button 
            onClick={() => router.push(`/${params.lang}/admin`)}
            className="bg-yellow-600 text-gray-950 px-8 py-3 rounded-xl font-bold shadow-lg shadow-yellow-600/10 flex items-center gap-2"
          >
            <Shield size={16} /> İlanlar & Talepler
          </button>
          
          <button 
            onClick={() => router.push(`/${params.lang}/admin/egitim`)}
            className="bg-white/5 text-white border border-white/10 hover:border-yellow-600/30 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
          >
            <GraduationCap size={16} /> 🎓 Eğitimler
          </button>
          
          <button 
            onClick={() => router.push(`/${params.lang}/admin/belgeler`)}
            className="bg-white/5 text-white border border-white/10 hover:border-yellow-600/30 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
          >
            <FileText size={16} /> 📄 Belgeler
          </button>
          
          <button 
            onClick={() => router.push(`/${params.lang}/admin/pipeline`)}
            className="bg-white/5 text-white border border-white/10 hover:border-yellow-600/30 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
          >
            <Briefcase size={16} /> 💼 İşlem Takibi (Kanban)
          </button>
          
          <button 
            onClick={() => router.push(`/${params.lang}/admin/sosyal-medya`)}
            className="bg-white/5 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500 hover:text-gray-950 px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
          >
            <Sparkles size={16} /> 📸 Sosyal Medya Stüdyosu
          </button>

          {userRole === 'admin' && (
            <button 
              onClick={() => router.push(`/${params.lang}/admin/kpi`)}
              className="bg-white/5 text-purple-400 border border-purple-500/20 hover:bg-purple-500 hover:text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
            >
              <BarChart3 size={16} /> 📊 Danışman KPI
            </button>
          )}

          <button 
            onClick={() => router.push(`/${params.lang}/admin/profil`)}
            className="bg-white/5 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500 hover:text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
          >
            <Settings size={16} /> ⚙️ Profil & Danışman Yönetimi
          </button>
        </div>

        {/* METRICS & COUNTERS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                {userRole === 'admin' ? 'Toplam Talep' : 'Bana Özel Talepler'}
              </p>
              <p className="text-3xl font-bold text-white font-mono">{leads.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center text-xl font-bold">👥</div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">VIP & Sıcak Müşteri</p>
              <p className="text-3xl font-bold text-yellow-500 font-mono">
                {leads.filter(l => l.intent_level === 'VIP' || l.intent_level === 'Hot').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/10 text-yellow-500 rounded-xl flex items-center justify-center text-xl font-bold">🔥</div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">
                {userRole === 'admin' ? 'Toplam Aktif İlan' : 'Aktif Portföylerim'}
              </p>
              <p className="text-3xl font-bold text-green-500 font-mono">{activeProperties.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center text-xl font-bold">🏠</div>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Eklentiden Gelen / Bekleyen</p>
              <p className="text-3xl font-bold text-orange-500 font-mono">{drafts.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center text-xl font-bold">⏳</div>
          </div>
        </div>

        {/* TWO-COLUMN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* LEFT PANEL: PROPERTY BUILDER */}
          <div className="lg:col-span-7 bg-gray-900 border border-white/10 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-600/5 blur-[50px] rounded-full"></div>
            
            <h2 className="text-2xl font-serif font-bold text-white mb-6 flex items-center gap-2">
              <Plus className="text-yellow-500" size={20} /> Yeni Portföy Girişi
            </h2>
            
            <form onSubmit={handleCreateProperty} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Başlık (TR)</label>
                    <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-gray-950 border border-white/10 p-3.5 rounded-xl text-white focus:border-yellow-500 outline-none text-sm transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Başlık (EN)</label>
                    <input value={formData.title_en} onChange={e => setFormData({...formData, title_en: e.target.value})} className="w-full bg-gray-950 border border-white/5 p-3.5 rounded-xl text-white focus:border-yellow-500 outline-none text-sm transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Başlık (AR)</label>
                    <input value={formData.title_ar} onChange={e => setFormData({...formData, title_ar: e.target.value})} className="w-full bg-gray-950 border border-white/5 p-3.5 rounded-xl text-white focus:border-yellow-500 outline-none text-sm transition-all" dir="rtl" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Fiyat (₺)</label>
                  <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-gray-950 border border-white/10 p-3.5 rounded-xl text-white focus:border-yellow-500 outline-none text-sm transition-all font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Seçkin Bölge</label>
                  <select required value={formData.district_id} onChange={e => setFormData({...formData, district_id: e.target.value})} className="w-full bg-gray-950 border border-white/10 p-3.5 rounded-xl text-white focus:border-yellow-500 outline-none text-xs transition-all cursor-pointer">
                    <option value="">Seçiniz</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">İşlem Tipi</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-gray-950 border border-white/10 p-3.5 rounded-xl text-white focus:border-yellow-500 outline-none text-xs transition-all cursor-pointer">
                    <option value="Satılık">Satılık</option>
                    <option value="Kiralık">Kiralık</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Oda Sayısı</label>
                  <input required value={formData.rooms} onChange={e => setFormData({...formData, rooms: e.target.value})} className="w-full bg-gray-950 border border-white/10 p-3.5 rounded-xl text-white focus:border-yellow-500 outline-none text-sm transition-all" placeholder="Örn: 4+1" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Brüt m²</label>
                  <input required type="number" value={formData.sqm} onChange={e => setFormData({...formData, sqm: e.target.value})} className="w-full bg-gray-950 border border-white/10 p-3.5 rounded-xl text-white focus:border-yellow-500 outline-none text-sm transition-all font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Kategori</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-950 border border-white/10 p-3.5 rounded-xl text-white focus:border-yellow-500 outline-none text-xs transition-all cursor-pointer">
                    <option value="Daire">Lüks Konut</option>
                    <option value="Villa">Villa / Malikane</option>
                    <option value="Ticari">Ticari Gayrimenkul</option>
                    <option value="Arsa">Arsa / Arazi</option>
                  </select>
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Açıklama (TR)</label>
                  <textarea required rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-950 border border-white/10 p-3.5 rounded-xl text-white focus:border-yellow-500 outline-none text-xs transition-all"></textarea>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Açıklama (EN)</label>
                  <textarea rows={4} value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} className="w-full bg-gray-950 border border-white/5 p-3.5 rounded-xl text-white focus:border-yellow-500 outline-none text-xs transition-all"></textarea>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Açıklama (AR)</label>
                  <textarea rows={4} value={formData.description_ar} onChange={e => setFormData({...formData, description_ar: e.target.value})} className="w-full bg-gray-950 border border-white/5 p-3.5 rounded-xl text-white focus:border-yellow-500 outline-none text-xs transition-all" dir="rtl"></textarea>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Görsel Dosyaları</label>
                <input type="file" multiple accept="image/*" onChange={e => setSelectedFiles(Array.from(e.target.files || []))} className="w-full border border-white/10 bg-gray-950 p-3 rounded-xl text-xs text-gray-400 cursor-pointer" />
              </div>

              <button disabled={uploading} className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-950 font-bold py-4 rounded-xl transition-all shadow-xl shadow-yellow-600/10 active:scale-[0.98] mt-4">
                {uploading ? 'İlan Görselleri Yükleniyor...' : 'Yeni İlanı Yayına Al'}
              </button>
            </form>
          </div>

          {/* RIGHT PANEL: LEADS, APPROVALS & WIN CARD PREVIEW */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* WIN CARD CONTROL PANEL */}
            {currentUser && (
              <div className="bg-gray-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-600/5 blur-[50px] rounded-full"></div>
                <span className="absolute top-0 right-0 bg-yellow-600 text-gray-950 text-[9px] font-extrabold px-4 py-1.5 uppercase tracking-widest rounded-bl-2xl">
                  DIJITAL KARTVIZIT
                </span>
                
                <h2 className="text-xl font-serif font-bold text-white mb-2">Win Card Profilim</h2>
                <p className="text-xs text-gray-500 mb-6">Müşterilerinizle paylaşabileceğiniz dijital kimliğiniz.</p>
                
                <div className="flex flex-col gap-4">
                  <div className="bg-gray-950 border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{currentUser.name}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{currentUser.role === 'admin' ? 'Broker / Yönetici' : 'Gayrimenkul Danışmanı'}</p>
                    </div>
                    
                    <button 
                      onClick={() => setShowDashboardQR(true)}
                      className="bg-yellow-600/10 hover:bg-yellow-600 text-yellow-500 hover:text-gray-950 border border-yellow-600/20 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                    >
                      <QrCode size={12} /> QR Kod
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <a 
                      href={`/${params.lang}/wincard/${currentUser.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-center bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    >
                      <ExternalLink size={12} /> Kartı Gör
                    </a>
                    
                    <a 
                      href={`/api/vcard?agentId=${currentUser.id}`}
                      className="text-center bg-yellow-600 hover:bg-yellow-500 text-gray-950 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                    >
                      <FileText size={12} /> Rehbere Ekle
                    </a>
                  </div>

                  <button 
                    onClick={() => {
                      const url = `${window.location.origin}/${params.lang}/wincard/${currentUser.id}`;
                      navigator.clipboard.writeText(url);
                      setNotification({ message: 'Win Card bağlantısı panoya kopyalandı!', type: 'success' });
                    }}
                    className="w-full bg-white/[0.02] hover:bg-white/5 border border-white/5 text-gray-400 hover:text-white py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                  >
                    <Copy size={10} /> Bağlantıyı Kopyala
                  </button>
                </div>
              </div>
            )}

            {/* ONAY BEKLEYENLER (EKLENTİDEN / SCRAPER'DAN GELENLER) */}
            <div className="bg-gray-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
              <span className="absolute top-0 right-0 bg-yellow-600 text-gray-950 text-[9px] font-extrabold px-4 py-1.5 uppercase tracking-widest rounded-bl-2xl">
                ONAY BEKLEYENLER
              </span>
              
              <h2 className="text-xl font-serif font-bold text-white mb-6">Onay Bekleyen Taslaklar ({drafts.length})</h2>
              
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                {drafts.length === 0 && <p className="text-gray-500 italic text-xs">Şu an onay bekleyen taslak ilanınız bulunmuyor.</p>}
                {drafts.map((draft: any) => (
                  <div key={draft.id} className="border border-white/5 p-4 rounded-2xl bg-white/[0.01] hover:bg-white/[0.03] flex justify-between items-center transition-all">
                    <div>
                      <p className="font-bold text-sm text-white line-clamp-1">{draft.title}</p>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                        {draft.district_id} | {Number(draft.price).toLocaleString('tr-TR')} ₺
                      </p>
                    </div>
                    <button 
                      onClick={() => handleApprove(draft.id)}
                      className="bg-green-600 hover:bg-green-500 text-white text-xs px-4 py-2.5 rounded-xl font-bold transition-all"
                    >
                      Yayınla
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* CUSTOMER LEADS LIST */}
            <div className="bg-gray-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
              <h2 className="text-xl font-serif font-bold text-white mb-6">Gelen Müşteri Talepleri ({leads.length})</h2>
              
              <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                {leads.length === 0 && <p className="text-gray-500 italic text-xs">Atanmış yeni talep bulunmamaktadır.</p>}
                {leads.map((lead: any) => (
                  <div key={lead.id} className="border border-white/5 p-5 rounded-2xl bg-white/[0.01] hover:bg-white/[0.02] transition-all">
                    <div className="flex justify-between items-start mb-3 border-b border-white/5 pb-3">
                      <div>
                        <span className="font-bold text-sm block text-white">{lead.full_name || lead.name}</span>
                        <span className="text-[9px] text-gray-500 font-bold uppercase mt-1 block tracking-wider">{new Date(lead.created_at).toLocaleString('tr-TR')}</span>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5">
                        {lead.score && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">AI SCORE</span>
                            <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px]
                              ${lead.score >= 80 ? 'bg-green-600/10 text-green-500 border border-green-500/20' : 
                                lead.score >= 50 ? 'bg-yellow-600/10 text-yellow-500 border border-yellow-500/20' : 
                                'bg-red-600/10 text-red-500 border border-red-500/20'}`}>
                              {lead.score}
                            </span>
                          </div>
                        )}
                        {lead.intent_level && (
                          <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border
                            ${lead.intent_level === 'VIP' ? 'bg-purple-600/10 text-purple-500 border-purple-500/20' : 
                              lead.intent_level === 'Hot' ? 'bg-red-600/10 text-red-500 border-red-500/20' : 
                              lead.intent_level === 'Warm' ? 'bg-orange-600/10 text-orange-500 border-orange-500/20' : 
                              'bg-gray-600/10 text-gray-500 border-gray-500/20'}`}>
                            {lead.intent_level}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3 text-xs text-gray-400">
                      <p>📞 <a href={`tel:${lead.phone}`} className="hover:text-yellow-500">{lead.phone}</a></p>
                      <p>📍 {lead.district || 'Belirtilmedi'}</p>
                      <p>💰 {lead.budget || 'Belirtilmedi'}</p>
                      <p>🏠 {lead.property_type || 'Belirtilmedi'}</p>
                    </div>

                    {lead.message && (
                      <div className="bg-gray-950 p-3 rounded-xl border border-white/5 text-xs text-gray-400 italic">
                        "{lead.message}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SAAS CONTROL MERKEZİ (SADECE ADMİNLERE GÖSTERİLİR!) */}
            {userRole === 'admin' && (
              <div className="bg-[#0a0a0a] border border-yellow-500/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <h2 className="text-xl font-serif font-bold text-yellow-500 mb-6 flex items-center gap-2">
                  <Settings size={18} /> SaaS Core Kontrol Merkezi
                </h2>
                <form onSubmit={handleUpdateSettings} className="space-y-4">
                  {settings.map((s, index) => (
                    <div key={s.key}>
                      <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1.5 tracking-widest">
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
                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl focus:border-yellow-500 outline-none text-xs text-gray-300 transition-all font-mono"
                      />
                    </div>
                  ))}
                  <button className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-950 font-bold py-3.5 rounded-xl transition-all shadow-xl shadow-yellow-600/10 mt-4 text-xs uppercase tracking-wider">
                    Sistem Ayarlarını Güncelle
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>

        {/* BOTTOM SECTION: PORTFOLIO GRID */}
        <div className="mt-16 bg-gray-900 border border-white/10 p-8 md:p-10 rounded-[3rem] shadow-2xl">
          <h2 className="text-2xl font-serif font-bold text-white mb-8">
            {userRole === 'admin' ? 'Tüm Kurumsal Portföyü Yönet' : 'Aktif Portföylerim'}
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 text-xs font-bold uppercase tracking-widest">
                  <th className="pb-4">İlan Başlığı</th>
                  <th className="pb-4">Bölge</th>
                  <th className="pb-4">Fiyat</th>
                  <th className="pb-4">Durum</th>
                  <th className="pb-4">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {activeProperties.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 italic">Yayında olan aktif ilanınız bulunmamaktadır.</td>
                  </tr>
                )}
                {activeProperties.map((p: any) => (
                  <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 font-bold text-white">{p.title}</td>
                    <td className="py-4 text-gray-400">{p.district_id}</td>
                    <td className="py-4 font-mono font-bold text-yellow-500">{Number(p.price).toLocaleString('tr-TR')} ₺</td>
                    <td className="py-4">
                      <span className="bg-green-600/10 border border-green-500/20 text-green-500 font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleDownloadStory(p)}
                          className="text-purple-400 hover:text-purple-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1 transition-colors"
                          title="Story Afişi İndir"
                        >
                          📸 Story
                        </button>
                        <button 
                          onClick={() => handleAIAnalysis(p)}
                          className="text-blue-400 hover:text-blue-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1 transition-colors"
                        >
                          🤖 AI Analiz
                        </button>
                        <button 
                          onClick={() => handleDelete(p.id)}
                          className="text-red-500 hover:text-red-400 font-bold text-xs uppercase tracking-wider transition-colors"
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

      {/* DASHBOARD QR CODE MODAL */}
      {showDashboardQR && currentUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-white/10 p-8 md:p-10 rounded-[3rem] w-full max-w-sm relative text-center shadow-2xl">
            <button 
              onClick={() => setShowDashboardQR(false)}
              className="absolute top-6 right-6 bg-white/5 hover:bg-white/10 p-2 rounded-xl text-gray-400 hover:text-white transition-all border border-white/5"
            >
              <X size={16} />
            </button>
            
            <h3 className="text-xl font-serif text-white mb-2">Win Card QR Kodu</h3>
            <p className="text-xs text-gray-500 mb-8">Bu QR kodu müşterilerinize taratarak dijital kartvizitinizi anında paylaşabilirsiniz.</p>
            
            <div className="bg-white p-4 rounded-3xl inline-block mb-6 shadow-2xl">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/' + params.lang + '/wincard/' + currentUser.id)}`} 
                alt="Win Card QR"
                className="w-48 h-48 mx-auto"
              />
            </div>
            
            <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest mb-6">Taratın ve Bağlantı Kurun</p>
            
            <a 
              href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(window.location.origin + '/' + params.lang + '/wincard/' + currentUser.id)}`}
              download="wincard-qr.png"
              target="_blank"
              rel="noreferrer"
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-gray-950 font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all block text-center"
            >
              QR Kodu Büyük Boy İndir
            </a>
          </div>
        </div>
      )}

      {/* DEĞERLEME RAPORU MODALİ — GERSÇEK VERİ TABANLI */}
      {valuationModal.show && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[130] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-white/10 rounded-[2.5rem] w-full max-w-2xl relative shadow-2xl my-4">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start p-8 pb-4">
              <div>
                <span className="text-yellow-600 text-[10px] font-extrabold uppercase tracking-[0.3em] block mb-1">Quantum OS Değerleme Raporu</span>
                <h3 className="text-xl font-serif font-bold text-white">{valuationModal.propertyTitle}</h3>
              </div>
              <button 
                onClick={() => setValuationModal({ show: false, loading: false, propertyTitle: '', result: null })}
                className="bg-white/5 hover:bg-white/10 p-2 rounded-xl text-gray-400 hover:text-white transition-all border border-white/5 flex-shrink-0 ml-4"
              >
                <X size={16} />
              </button>
            </div>

            {valuationModal.loading ? (
              <div className="p-12 text-center">
                <div className="w-10 h-10 border-2 border-yellow-600/30 border-t-yellow-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400 text-sm">Piyasa verisi analiz ediliyor...</p>
                <p className="text-gray-600 text-xs mt-2">CMA verisi + Ankara bölge endeksi hesaplanıyor</p>
              </div>
            ) : valuationModal.result && (
              <div className="p-8 space-y-5">

                {/* Fiyat Değerlendirmesi */}
                <div className="bg-gray-950 border border-white/5 rounded-2xl p-5">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Piyasa Değerlendirmesi</p>
                  <p className="text-white text-sm leading-relaxed">{valuationModal.result.evaluation}</p>
                </div>

                {/* Tahmini Değer + CMA */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-yellow-950/30 border border-yellow-600/20 rounded-2xl p-5 text-left">
                    <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest mb-1">Tahmini Piyasa Değeri</p>
                    <p className="text-yellow-400 font-bold text-sm">{valuationModal.result.estimated_value}</p>
                  </div>
                  {valuationModal.result.cma?.count > 0 && (
                    <div className="bg-blue-950/30 border border-blue-600/20 rounded-2xl p-5 text-left">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">CMA — Benzer İlan Ort.</p>
                      <p className="text-blue-300 font-bold text-sm">{valuationModal.result.cma.avgPrice?.toLocaleString('tr-TR')} TL</p>
                      <p className="text-blue-600 text-[10px] mt-1">{valuationModal.result.cma.count} ilan karşılaştırıldı</p>
                    </div>
                  )}
                </div>

                {/* Konum / Şerefiye Primi */}
                {valuationModal.result.valuation?.streetPremium?.premiumPercent > 0 && (
                  <div className="bg-purple-950/30 border border-purple-600/20 rounded-2xl p-5 text-left">
                    <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Konum Şerefiye Analizi</p>
                    <p className="text-white text-sm font-semibold">
                      Mülk, <span className="text-purple-300">"{valuationModal.result.valuation.streetPremium.detectedName}"</span> caddesi/bulvarı üzerinde tespit edilmiştir.
                    </p>
                    <p className="text-purple-400 text-xs mt-1">
                      Şerefiye Primi: <span className="font-extrabold text-purple-300">+%{valuationModal.result.valuation.streetPremium.premiumPercent}</span> ({valuationModal.result.valuation.streetPremium.type})
                    </p>
                  </div>
                )}

                {/* Bölge Verileri */}
                {valuationModal.result.valuation?.success && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Bölge m² Ort.</p>
                      <p className="text-white font-bold text-sm">{valuationModal.result.valuation.marketAvgPerSqm?.toLocaleString('tr-TR')}</p>
                      <p className="text-gray-600 text-[9px]">TL/m²</p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Yatırım Notu</p>
                      <p className={`font-extrabold text-lg ${valuationModal.result.valuation.investmentRating?.startsWith('A') ? 'text-green-500' : 'text-yellow-500'}`}>
                        {valuationModal.result.valuation.investmentRating}
                      </p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Talep Skoru</p>
                      <p className="text-white font-bold text-sm">{valuationModal.result.valuation.demandScore}</p>
                      <p className="text-gray-600 text-[9px]">/ 100</p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-center">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Bölge Trendi</p>
                      <p className={`font-bold text-xs ${
                        valuationModal.result.valuation.trend === 'yükselen' ? 'text-green-500' 
                        : valuationModal.result.valuation.trend === 'düşen' ? 'text-red-500' 
                        : 'text-yellow-500'
                      }`}>
                        {valuationModal.result.valuation.trend === 'yükselen' ? '↑ Yükselen' 
                         : valuationModal.result.valuation.trend === 'düşen' ? '↓ Düşen' 
                         : '→ Stabil'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Bölge Piyasa Notu */}
                {valuationModal.result.valuation?.marketNote && (
                  <div className="bg-gray-950 border border-white/5 rounded-xl p-4 text-xs text-gray-400 italic leading-relaxed text-left">
                    📍 {valuationModal.result.valuation.marketNote}
                  </div>
                )}

                {/* Mahalle Karşılaştırma Listesi */}
                {valuationModal.result.valuation?.neighborhoodsComparison?.length > 0 && (
                  <div className="bg-gray-950 border border-white/5 rounded-2xl p-5 text-left">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Çevredeki Mahalleler Ortalama Değer Karşılaştırması</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[140px] overflow-y-auto pr-1">
                      {valuationModal.result.valuation.neighborhoodsComparison.map((n: any, idx: number) => (
                        <div key={idx} className="bg-white/[0.01] border border-white/5 rounded-lg p-2.5 flex flex-col justify-between">
                          <p className="text-white text-xs font-bold truncate">{n.name}</p>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-[10px] text-gray-400 font-mono">{n.avgPricePerSqm?.toLocaleString('tr-TR')} ₺/m²</p>
                            <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded ${
                              n.trend === 'yükselen' ? 'bg-green-600/10 text-green-400'
                              : n.trend === 'düşen' ? 'bg-red-600/10 text-red-400'
                              : 'bg-yellow-600/10 text-yellow-400'
                            }`}>
                              {n.investmentRating}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strateji Önerisi */}
                <div className="bg-green-950/30 border border-green-600/20 rounded-2xl p-5 text-left">
                  <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-2">Danışman Strateji Önerisi</p>
                  <p className="text-green-300 text-sm leading-relaxed">{valuationModal.result.suggestion}</p>
                </div>

                <button
                  onClick={() => setValuationModal({ show: false, loading: false, propertyTitle: '', result: null })}
                  className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Kapat
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
