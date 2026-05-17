'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserBehaviorProfile } from '@/lib/tracker';

export default function RoportajPage({ params }: { params: { lang: string } }) {
  const router = useRouter();
  
  // States
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Form, 2: Loading, 3: Custom Brochure
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [budget, setBudget] = useState<number>(15000000);
  const [rooms, setRooms] = useState('3+1');
  const [district, setDistrict] = useState('Çankaya');
  const [lifestyle, setLifestyle] = useState('Aile Yaşamı & Güvenlik');
  
  const [detectedProfile, setDetectedProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Ziyaret geçmişi profilleme
  useEffect(() => {
    const profile = getUserBehaviorProfile();
    if (profile && profile.totalViews > 0) {
      setDetectedProfile(profile);
      // Davranış verileriyle form alanlarını akıllı ön-doldur
      if (profile.averageBudget > 0) {
        setBudget(profile.averageBudget);
      }
      const topDistrict = Object.keys(profile.preferredDistricts).reduce((a, b) => 
        profile.preferredDistricts[a] > profile.preferredDistricts[b] ? a : b, 'Çankaya'
      );
      setDistrict(topDistrict);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
    setLoading(true);

    try {
      const res = await fetch('/api/personalized-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, budget, rooms, district, lifestyle })
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
        setStep(3);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      alert('Yapay zeka eşleme servisimizde geçici yoğunluk var. Lütfen tekrar deneyin.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pt-32 pb-32 relative overflow-hidden">
      {/* GLOW OVERLAYS */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-600/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-800/5 blur-[120px] rounded-full" />

      <div className="container mx-auto px-6 max-w-4xl relative z-10">
        
        {/* STEP 1: INTERACTIVE SURVEY */}
        {step === 1 && (
          <div className="bg-white/[0.02] border border-white/5 p-8 md:p-16 rounded-[4rem] backdrop-blur-3xl shadow-2xl">
            <div className="text-center mb-12">
              <span className="text-yellow-600 text-xs font-bold uppercase tracking-[0.4em] mb-2 block">QUANTUM REALTY OS</span>
              <h1 className="text-4xl font-serif text-white font-bold mb-4">Kişisel Portföy Röportajı</h1>
              <p className="text-gray-400 text-sm max-w-lg mx-auto">
                Lüks konut danışmanlığı artık otonom. Yaşam tarzınızı girin, sizin için veritabanından en doğru 3 lüks mülkü eşleyelim.
              </p>
            </div>

            {/* Smart Tracker Badge */}
            {detectedProfile && (
              <div className="bg-yellow-600/10 border border-yellow-600/30 p-5 rounded-3xl mb-10 flex items-center gap-4 animate-pulse">
                <span className="text-2xl">🤖</span>
                <div className="text-left text-xs">
                  <span className="font-bold text-yellow-500 block">Quantum Profil İzleyici Aktif!</span>
                  Önceki gezinmelerinizden ortalama <span className="font-black text-white">{detectedProfile.averageBudget.toLocaleString('tr-TR')} TL</span> bütçe ve <span className="font-black text-white">{district}</span> bölgesi ilginiz algılandı. Parametreler otomatik eşlendi.
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Adınız Soyadınız</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Seçkin Alıcı" 
                    required 
                    className="bg-gray-900/60 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-yellow-600 transition-all text-sm"
                  />
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Telefon Numaranız</label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="905..." 
                    required 
                    className="bg-gray-900/60 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-yellow-600 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tercih Edilen Bölge</label>
                  <select 
                    value={district} 
                    onChange={e => setDistrict(e.target.value)}
                    className="bg-gray-900/60 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-yellow-600 transition-all text-sm"
                  >
                    <option value="Çankaya">Çankaya</option>
                    <option value="İncek">İncek</option>
                    <option value="Ümitköy">Ümitköy</option>
                    <option value="Etimesgut">Etimesgut</option>
                    <option value="Yenimahalle">Yenimahalle</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Oda Sayısı</label>
                  <select 
                    value={rooms} 
                    onChange={e => setRooms(e.target.value)}
                    className="bg-gray-900/60 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-yellow-600 transition-all text-sm"
                  >
                    <option value="2+1">2+1</option>
                    <option value="3+1">3+1</option>
                    <option value="4+1">4+1</option>
                    <option value="5+1">5+1 ve üzeri</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Yaşam Tarzı / Öncelik</label>
                  <select 
                    value={lifestyle} 
                    onChange={e => setLifestyle(e.target.value)}
                    className="bg-gray-900/60 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-yellow-600 transition-all text-sm"
                  >
                    <option value="Aile Yaşamı & Güvenlik">Aile Yaşamı & Güvenlik</option>
                    <option value="Yüksek ROI / Yatırım Amacı">Yüksek ROI / Yatırım Amacı</option>
                    <option value="Lüks & Prestij Odaklı">Lüks & Prestij Odaklı</option>
                    <option value="Doğa & Sessizlik">Doğa & Sessizlik</option>
                  </select>
                </div>
              </div>

              {/* Slider for Budget */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>Hedeflenen Maksimum Bütçe</span>
                  <span className="text-yellow-500 text-sm font-black">{budget.toLocaleString('tr-TR')} TL</span>
                </div>
                <input 
                  type="range" 
                  min={5000000} 
                  max={60000000} 
                  step={500000}
                  value={budget} 
                  onChange={e => setBudget(Number(e.target.value))}
                  className="w-full accent-yellow-600 bg-gray-800 rounded-lg cursor-pointer h-2"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-gray-950 font-bold py-5 rounded-2xl transition-all uppercase tracking-widest text-xs shadow-2xl"
              >
                Analizi ve Teklifi Hazırla
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: NEURAL MATCHING LOADING STATE */}
        {step === 2 && (
          <div className="bg-white/[0.02] border border-white/5 p-16 rounded-[4rem] text-center backdrop-blur-3xl min-h-[400px] flex flex-col items-center justify-center gap-6">
            <div className="w-16 h-16 border-t-2 border-r-2 border-yellow-600 rounded-full animate-spin" />
            <h3 className="text-2xl font-serif text-white font-bold animate-pulse">Portföyler Eşleniyor...</h3>
            <p className="text-gray-500 text-xs tracking-wider max-w-sm">
              Quantum Match Engine veritabanı kriterlerinizi tarıyor. Gemini AI, 3 ideal portföy için gerekçelendirilmiş kişisel teklifinizi yazıyor...
            </p>
          </div>
        )}

        {/* STEP 3: CUSTOM BROCHURE RESULT */}
        {step === 3 && result && (
          <div className="space-y-12 animate-in fade-in duration-700">
            {/* Header Greeting */}
            <div className="bg-white/[0.02] border border-white/5 p-12 rounded-[3.5rem] backdrop-blur-3xl relative overflow-hidden shadow-2xl text-left">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-600/5 blur-[50px] rounded-full" />
              <h2 className="text-3xl font-serif text-white italic mb-4">Özel Teklif Mektubu</h2>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-light">
                {result.analysis.intro}
              </p>
            </div>

            {/* Matched Properties */}
            <div className="space-y-8">
              <h3 className="text-xl font-bold uppercase tracking-widest text-yellow-600 text-left">Eşleşen 3 Alternatif Portföy</h3>
              
              {result.properties.map((p: any, idx: number) => {
                const aiExplanation = result.analysis.matches?.find((m: any) => m.id === p.id || idx === result.properties.indexOf(p))?.reason;

                return (
                  <div 
                    key={p.id} 
                    className="bg-white/[0.02] border border-white/5 rounded-[3.5rem] overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-8 hover:border-yellow-600/20 transition-all p-8 text-left group"
                  >
                    <div className="md:col-span-4 aspect-[4/3] rounded-3xl overflow-hidden relative">
                      <img 
                        src={p.images?.[0] || '/hero-bg.png'} 
                        alt={p.title} 
                        className="w-full h-full object-cover transition-transform duration-[5000ms] group-hover:scale-105" 
                      />
                    </div>
                    
                    <div className="md:col-span-8 flex flex-col justify-between gap-6">
                      <div>
                        <div className="flex justify-between items-start gap-4 mb-2">
                          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{p.districts?.name || p.district_id}</span>
                          <span className="bg-yellow-600/10 border border-yellow-600/30 text-yellow-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                            %{(p.matchScore || 100).toFixed(0)} Uyum
                          </span>
                        </div>
                        <h4 className="text-xl font-serif text-white font-bold mb-4">{p.title}</h4>
                        
                        {/* Gemini AI Custom Reasoning Box */}
                        <div className="bg-white/[0.03] border-l-2 border-yellow-600 p-4 rounded-xl text-xs font-semibold leading-relaxed text-gray-300">
                          <span className="text-[9px] text-yellow-600 font-bold uppercase tracking-widest block mb-2">🤖 Quantum AI Yatırım Gerekçesi</span>
                          {aiExplanation || 'Mülk bütçeniz ve konum tercihlerinizle en verimli amortisman dengesini sağlamaktadır.'}
                        </div>
                      </div>

                      <div className="flex justify-between items-center border-t border-white/5 pt-4">
                        <span className="text-xl font-serif text-yellow-600 font-bold">{p.price.toLocaleString('tr-TR')} TL</span>
                        <button 
                          onClick={() => router.push(`/${params.lang}/portfoy/${p.district_id}/${p.type === 'Satılık' ? 'satilik' : 'kiralik'}/${p.id}`)}
                          className="bg-white/5 hover:bg-yellow-600 text-white hover:text-gray-950 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                          Portföyü İncele →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Conclusion */}
            <div className="bg-white/[0.02] border border-white/5 p-12 rounded-[3.5rem] text-center backdrop-blur-3xl space-y-6">
              <p className="text-gray-300 text-sm font-light leading-relaxed max-w-xl mx-auto">
                {result.analysis.conclusion}
              </p>
              <div className="flex justify-center gap-4">
                <button 
                  onClick={() => setStep(1)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Yeniden Analiz Et
                </button>
                <button 
                  onClick={() => router.push(`/${params.lang}/iletisim`)}
                  className="bg-yellow-600 hover:bg-yellow-500 text-gray-950 px-8 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl"
                >
                  VIP Randevu Al
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
