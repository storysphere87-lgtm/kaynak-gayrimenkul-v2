'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Film, Image as ImageIcon, Download, Sparkles, Layout, User, ArrowLeft, RefreshCw, BarChart2 } from 'lucide-react';
import { renderVideoOnClient } from '@/lib/client-video';

export default function SocialStudioPage({ params }: { params: { lang: string } }) {
  const router = useRouter();
  const [userRole, setUserRole] = useState<'admin' | 'agent' | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedPropId, setSelectedPropId] = useState('');
  
  // Customization State (Listing Graphic)
  const [format, setFormat] = useState<'post' | 'story'>('story');
  const [customTitle, setCustomTitle] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customDistrict, setCustomDistrict] = useState('');
  const [customSpecs, setCustomSpecs] = useState('');
  const [customAgent, setCustomAgent] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  
  // Market Stats (TÜİK Graphic)
  const [statsDistrict, setStatsDistrict] = useState('Çankaya');
  const [statsMonth, setStatsMonth] = useState('Mayıs 2026');
  const [statsVolume, setStatsVolume] = useState('1450');
  const [statsChange, setStatsChange] = useState('4.2');
  const [statsPrice, setStatsPrice] = useState('54.200');

  const [activeTab, setActiveTab] = useState<'listing' | 'market'>('listing');
  const [previewUrl, setPreviewUrl] = useState('');
  const [marketPreviewUrl, setMarketPreviewUrl] = useState('');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [clientVideoLoading, setClientVideoLoading] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);

  useEffect(() => {
    async function checkAuthAndFetch() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push(`/${params.lang}/admin/login`);
        return;
      }

      // Profile'dan rolünü çekelim
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', session.user.id)
        .single();

      if (!profile) {
        router.push(`/${params.lang}/admin/login`);
        return;
      }

      setUserRole(profile.role);
      setCurrentUser({
        id: session.user.id,
        name: profile.full_name,
        role: profile.role
      });
      setCustomAgent(profile.full_name || 'Kaynak Gayrimenkul');

      // Verileri çekelim
      try {
        let propQuery = supabase.from('properties').select('*, districts(name)').eq('status', 'aktif');
        
        // RBAC Sınırlaması: Danışmanlar sadece kendi aktif portföylerini görebilir ve üretebilir!
        if (profile.role === 'agent') {
          propQuery = propQuery.eq('agent_id', session.user.id);
        }

        const [propsRes, statsRes] = await Promise.all([
          propQuery.order('created_at', { ascending: false }),
          supabase.from('market_stats').select('district_name').order('district_name')
        ]);

        setProperties(propsRes.data || []);
        
        // Eşsiz bölge listesi
        const dists = Array.from(new Set((statsRes.data || []).map(d => d.district_name)));
        setDistricts(dists);

        if (propsRes.data && propsRes.data.length > 0) {
          const firstProp = propsRes.data[0];
          setSelectedPropId(firstProp.id);
          populatePropertyDetails(firstProp, profile.full_name);
        }

      } catch (err) {
        console.error('Stüdyo verileri yüklenemedi:', err);
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndFetch();
  }, [params.lang]);

  // Form alanlarını seçilen ilana göre doldur
  const populatePropertyDetails = (property: any, agentName: string) => {
    setCustomTitle(property.title || '');
    setCustomPrice(Number(property.price || 0).toLocaleString('tr-TR'));
    setCustomDistrict(property.districts?.name || 'Çankaya');
    setCustomSpecs(`${property.rooms} | ${property.sqm} m² | ${property.type}`);
    setCustomAgent(agentName || customAgent);
    if (property.images && property.images.length > 0) {
      setSelectedImage(property.images[0]);
    } else {
      setSelectedImage('');
    }
  };

  const handlePropChange = (id: string) => {
    setSelectedPropId(id);
    setVideoUrl('');
    const prop = properties.find(p => p.id === id);
    if (prop) {
      populatePropertyDetails(prop, currentUser?.name);
    }
  };

  // TÜİK Bölge Değişikliğinde verileri otomatik çekme
  const handleMarketDistrictChange = async (distName: string) => {
    setStatsDistrict(distName);
    try {
      const { data } = await supabase
        .from('market_stats')
        .select('*')
        .eq('district_name', distName)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setStatsMonth(data.month_year);
        setStatsVolume(data.sales_volume.toString());
        setStatsChange(data.price_index_change.toString());
        setStatsPrice(Number(data.average_sqm_price).toLocaleString('tr-TR'));
      }
    } catch (e) {
      console.warn("Market verileri çekilemedi.", e);
    }
  };

  // Dinamik önizleme linklerini güncelle
  useEffect(() => {
    if (!loading) {
      const endpoint = format === 'story' ? '/api/social-story' : '/api/social-post-og';
      const url = new URL(window.location.origin + endpoint);
      url.searchParams.set('title', customTitle);
      url.searchParams.set('price', customPrice);
      url.searchParams.set('district', customDistrict);
      url.searchParams.set('specs', customSpecs);
      url.searchParams.set('agent', customAgent);
      if (selectedImage) {
        url.searchParams.set('image', selectedImage);
      }
      setPreviewUrl(url.toString());
    }
  }, [customTitle, customPrice, customDistrict, customSpecs, customAgent, selectedImage, format, loading]);

  useEffect(() => {
    if (!loading) {
      const url = new URL(window.location.origin + '/api/market-story');
      // Tablodan besleniyor fakat arayüz parametreleriyle de manipüle edebiliriz
      url.searchParams.set('district', statsDistrict);
      url.searchParams.set('month', statsMonth);
      url.searchParams.set('volume', statsVolume);
      url.searchParams.set('change', statsChange);
      url.searchParams.set('price', statsPrice);
      setMarketPreviewUrl(url.toString());
    }
  }, [statsDistrict, statsMonth, statsVolume, statsChange, statsPrice, loading]);

  const handleDownload = async (urlToDownload: string, filename: string) => {
    setNotification({ message: 'Görsel hazırlanıyor, indirme başlayacak...', type: 'success' });
    try {
      const response = await fetch(urlToDownload);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setNotification({ message: 'Görsel başarıyla indirildi! ✅', type: 'success' });
    } catch (e) {
      setNotification({ message: 'İndirme başarısız oldu.', type: 'error' });
    }
  };

  const handleGenerateVideo = async () => {
    setVideoLoading(true);
    setVideoUrl('');
    setNotification({ message: 'Canva otonom video motoru tetikleniyor...', type: 'success' });
    try {
      const response = await fetch('/api/social-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: customTitle,
          price: customPrice,
          district: customDistrict,
          specs: customSpecs,
          image: selectedImage
        })
      });
      const data = await response.json();
      if (data.success && data.videoUrl) {
        setVideoUrl(data.videoUrl);
        setNotification({ message: 'Mikro-Video başarıyla üretildi! 🎬', type: 'success' });
      } else {
        throw new Error(data.error || 'Video üretilemedi.');
      }
    } catch (err: any) {
      setNotification({ message: `Hata: ${err.message}`, type: 'error' });
    } finally {
      setVideoLoading(false);
    }
  };

  const handleGenerateClientVideo = async () => {
    setClientVideoLoading(true);
    setVideoUrl('');
    setRenderProgress(0);
    setNotification({ message: 'Yerel GPU video motoru başlatılıyor...', type: 'success' });
    try {
      const generatedUrl = await renderVideoOnClient({
        title: customTitle,
        price: customPrice,
        district: customDistrict,
        specs: customSpecs,
        imageUrl: selectedImage,
        format: format,
        onProgress: (p) => setRenderProgress(p)
      });
      setVideoUrl(generatedUrl);
      setNotification({ message: 'Yerel Mikro-Video başarıyla üretildi! 🎬', type: 'success' });
    } catch (err: any) {
      setNotification({ message: `Hata: ${err.message}`, type: 'error' });
    } finally {
      setClientVideoLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center text-gray-500 font-bold bg-gray-950 min-h-screen">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pt-24 pb-20">
      
      {/* NOTIFICATION */}
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
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <span className="text-yellow-600 text-xs font-bold uppercase tracking-[0.4em] mb-2 block">Pazarlama & Sosyal Medya Kokpiti</span>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white flex items-center gap-3">
              Quantum Sosyal Medya Stüdyosu
            </h1>
          </div>
          <button 
            onClick={() => router.push(`/${params.lang}/admin`)}
            className="bg-white/5 border border-white/10 hover:border-yellow-600/50 text-white px-8 py-3 rounded-2xl font-bold transition-all flex items-center gap-2"
          >
            <ArrowLeft size={16} /> Dashboard'a Dön
          </button>
        </div>

        {/* ROLE INDICATOR */}
        <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl mb-8 flex justify-between items-center text-xs font-semibold text-gray-400">
          <div className="flex items-center gap-2">
            <User size={14} className="text-yellow-500" />
            <span>Giriş Yapan: <strong>{currentUser?.name}</strong></span>
          </div>
          <span className="bg-yellow-600/10 border border-yellow-600/30 text-yellow-500 px-3 py-1 rounded-full uppercase tracking-wider text-[10px]">
            {userRole === 'admin' ? 'Broker / Yönetici Yetkisi' : 'Danışman Sınırlı Modu'}
          </span>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex gap-4 border-b border-white/10 pb-4 mb-10">
          <button 
            onClick={() => setActiveTab('listing')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeTab === 'listing' ? 'bg-yellow-600 text-gray-950 shadow-lg shadow-yellow-600/10' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <ImageIcon size={16} /> İlan Sosyal Medya Kartı
          </button>
          <button 
            onClick={() => setActiveTab('market')}
            className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeTab === 'market' ? 'bg-yellow-600 text-gray-950 shadow-lg shadow-yellow-600/10' : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <BarChart2 size={16} /> TÜİK Piyasa Endeks Kartı
          </button>
        </div>

        {/* TAB 1: LISTING GRAPHIC GENERATOR */}
        {activeTab === 'listing' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* SOL FORM: SEÇENEKLER VE ÖZELLEŞTİRME */}
            <div className="lg:col-span-5 bg-gray-900 border border-white/10 rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-6 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-600/5 blur-[50px] rounded-full"></div>
              
              <h3 className="text-xl font-serif font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="text-yellow-500" size={18} /> Şablonu Özelleştir
              </h3>

              {/* İlan Seçici */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">İlan Portföyü Seçin</label>
                {properties.length === 0 ? (
                  <div className="text-xs text-gray-500 bg-white/5 p-4 rounded-xl border border-white/5">
                    {userRole === 'agent' 
                      ? 'Aktif atanmış ilanınız bulunmamaktadır. Görsel üretmek için önce bir ilan oluşturmalısınız.' 
                      : 'Sistemde aktif ilan bulunmamaktadır.'}
                  </div>
                ) : (
                  <select 
                    value={selectedPropId} 
                    onChange={e => handlePropChange(e.target.value)}
                    className="bg-gray-950 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-600 text-sm"
                  >
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Format Seçici */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Görsel Boyut Formati</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setFormat('story')}
                    className={`py-3 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all ${
                      format === 'story' 
                        ? 'bg-white/10 border-yellow-500 text-yellow-500' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    📸 Story (1080x1920)
                  </button>
                  <button 
                    onClick={() => setFormat('post')}
                    className={`py-3 rounded-xl font-bold text-xs uppercase tracking-wider border transition-all ${
                      format === 'post' 
                        ? 'bg-white/10 border-yellow-500 text-yellow-500' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    🖼️ Post / Kare (1080x1080)
                  </button>
                </div>
              </div>

              {/* Başlık Girişi */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Görsel Başlığı</label>
                <input 
                  type="text" 
                  value={customTitle} 
                  onChange={e => setCustomTitle(e.target.value)} 
                  className="bg-gray-950 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-600 text-sm" 
                />
              </div>

              {/* Fiyat Girişi */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fiyat Gösterimi</label>
                <input 
                  type="text" 
                  value={customPrice} 
                  onChange={e => setCustomPrice(e.target.value)} 
                  className="bg-gray-950 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-600 text-sm font-mono" 
                />
              </div>

              {/* Bölge Girişi */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">İlçe / Bölge</label>
                <input 
                  type="text" 
                  value={customDistrict} 
                  onChange={e => setCustomDistrict(e.target.value)} 
                  className="bg-gray-950 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-600 text-sm" 
                />
              </div>

              {/* Özellikler Etiketi */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Alt Etiket Detayları</label>
                <input 
                  type="text" 
                  value={customSpecs} 
                  onChange={e => setCustomSpecs(e.target.value)} 
                  className="bg-gray-950 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-600 text-sm" 
                />
              </div>

              {/* Danışman İsmi */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Afiş Danışmanı</label>
                <input 
                  type="text" 
                  value={customAgent} 
                  onChange={e => setCustomAgent(e.target.value)} 
                  className="bg-gray-950 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-600 text-sm" 
                />
              </div>

              {/* Resim Seçici (Eğer ilanın birden çok resmi varsa seçsin) */}
              {properties.find(p => p.id === selectedPropId)?.images?.length > 1 && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Kapak Resmi Seçimi</label>
                  <div className="grid grid-cols-4 gap-2">
                    {properties.find(p => p.id === selectedPropId).images.slice(0, 4).map((imgUrl: string, idx: number) => (
                      <button 
                        key={idx}
                        onClick={() => setSelectedImage(imgUrl)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                          selectedImage === imgUrl ? 'border-yellow-500' : 'border-transparent'
                        }`}
                      >
                        <img src={imgUrl} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* İNDİRME BUTONU */}
              <button 
                onClick={() => handleDownload(previewUrl, `${customTitle.replace(/\s+/g, '_')}_pazarlama.png`)}
                disabled={properties.length === 0}
                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-950 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-yellow-600/10 active:scale-[0.98] mt-4"
              >
                <Download size={18} />
                Sosyal Medya Görselini İndir
              </button>

              {/* LOCAL GPU MİKRO VİDEO BUTONU */}
              <button 
                onClick={handleGenerateClientVideo}
                disabled={properties.length === 0 || clientVideoLoading}
                className="w-full bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 border border-yellow-600/50 hover:from-yellow-600/30 hover:to-yellow-500/30 text-yellow-500 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] mt-3"
              >
                <Film size={18} className="text-yellow-500 animate-pulse" />
                {clientVideoLoading ? `Yerel GPU Render: %${renderProgress}` : '🎬 Sıfır Maliyetli Video Üret'}
              </button>

              {/* CANVA MİKRO VİDEO BUTONU */}
              <button 
                onClick={handleGenerateVideo}
                disabled={properties.length === 0 || videoLoading}
                className="w-full bg-slate-800/40 border border-slate-700 hover:border-yellow-600/30 hover:bg-slate-700/60 text-gray-400 hover:text-white font-bold py-3 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2 text-xs"
              >
                Canva Connect API ile Üret (Ücretli)
              </button>
            </div>

            {/* SAĞ TARAF: CANLI GERÇEK ÖNİZLEME */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center bg-gray-900/20 border border-white/5 rounded-[3rem] p-10 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full"></div>
              
              <div className="flex justify-between items-center w-full mb-6 max-w-sm">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Canlı Stüdyo Önizlemesi</span>
                <span className="bg-white/5 border border-white/10 text-gray-400 font-bold px-3 py-1 rounded-full text-[9px] uppercase tracking-wider flex items-center gap-1">
                  <RefreshCw size={10} className="animate-spin" /> Gerçek Zamanlı Render
                </span>
              </div>

              {/* Responsive Visual Sandbox frame */}
              <div className={`border-4 border-yellow-500/20 rounded-[2rem] overflow-hidden shadow-2xl relative bg-gray-950 aspect-[9/16] w-full max-w-xs transition-all duration-500 ${
                format === 'post' ? 'aspect-square max-w-[420px]' : 'aspect-[9/16] max-w-xs'
              }`}>
                {videoUrl ? (
                  <video src={videoUrl} controls autoPlay loop className="w-full h-full object-cover" />
                ) : previewUrl ? (
                  <img src={previewUrl} alt="Visual Dynamic Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 italic">Yükleniyor...</div>
                )}
              </div>
              
              <p className="text-[10px] text-gray-500 text-center mt-6 max-w-xs tracking-wide leading-relaxed">
                * Görsel doğrudan sunucu üzerinde <strong>Edge Runtime</strong> altyapısıyla çizilmektedir. İndir butonuna tıkladığınızda tam çözünürlüklü lüks görsel bilgisayarınıza inecektir.
              </p>
            </div>

          </div>
        )}

        {/* TAB 2: MARKET TRENDS GRAPHIC */}
        {activeTab === 'market' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* SOL FORM */}
            <div className="lg:col-span-5 bg-gray-900 border border-white/10 rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-6 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-600/5 blur-[50px] rounded-full"></div>
              
              <h3 className="text-xl font-serif font-bold text-white mb-2 flex items-center gap-2">
                <Sparkles className="text-yellow-500" size={18} /> TÜİK Grafik Sihirbazı
              </h3>

              {/* Bölge Seçici */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Bölge / İlçe</label>
                {districts.length === 0 ? (
                  <input 
                    type="text" 
                    value={statsDistrict} 
                    onChange={e => setStatsDistrict(e.target.value)} 
                    className="bg-gray-950 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-600 text-sm" 
                  />
                ) : (
                  <select 
                    value={statsDistrict} 
                    onChange={e => handleMarketDistrictChange(e.target.value)}
                    className="bg-gray-950 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-600 text-sm"
                  >
                    {districts.map((d: any) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Ay Yıl Girişi */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">İndeks Dönemi</label>
                <input 
                  type="text" 
                  value={statsMonth} 
                  onChange={e => setStatsMonth(e.target.value)} 
                  className="bg-gray-950 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-600 text-sm" 
                />
              </div>

              {/* Satış Adedi Girişi */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aylık Konut Satışı (TÜİK)</label>
                <input 
                  type="number" 
                  value={statsVolume} 
                  onChange={e => setStatsVolume(e.target.value)} 
                  className="bg-gray-950 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-600 text-sm font-mono" 
                />
              </div>

              {/* Değişim Oranı */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aylık Fiyat Artış Hızı (%)</label>
                <input 
                  type="text" 
                  value={statsChange} 
                  onChange={e => setStatsChange(e.target.value)} 
                  className="bg-gray-950 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-600 text-sm font-mono" 
                />
              </div>

              {/* Ortalama m2 fiyatı */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ortalama Konut Fiyatı (TL)</label>
                <input 
                  type="text" 
                  value={statsPrice} 
                  onChange={e => setStatsPrice(e.target.value)} 
                  className="bg-gray-950 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-600 text-sm font-mono" 
                />
              </div>

              {/* İNDİRME BUTONU */}
              <button 
                onClick={() => handleDownload(marketPreviewUrl, `${statsDistrict.replace(/\s+/g, '_')}_tuik_indeks.png`)}
                className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-950 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-yellow-600/10 active:scale-[0.98] mt-4"
              >
                <Download size={18} />
                Piyasa İndeks Görselini İndir
              </button>
            </div>

            {/* SAĞ TARAF */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center bg-gray-900/20 border border-white/5 rounded-[3rem] p-10 backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-yellow-600/5 blur-[100px] rounded-full"></div>
              
              <div className="flex justify-between items-center w-full mb-6 max-w-sm">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Canlı Piyasa Görsel Önizlemesi</span>
                <span className="bg-white/5 border border-white/10 text-gray-400 font-bold px-3 py-1 rounded-full text-[9px] uppercase tracking-wider flex items-center gap-1">
                  <RefreshCw size={10} className="animate-spin" /> Real-Time Render
                </span>
              </div>

              {/* Infographic Preview */}
              <div className="border-4 border-yellow-500/20 rounded-[2rem] overflow-hidden shadow-2xl relative bg-gray-950 aspect-[9/16] w-full max-w-xs">
                {marketPreviewUrl ? (
                  <img src={marketPreviewUrl} alt="Market Trend Graphic Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 italic">Yükleniyor...</div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
