'use client';

import React, { useState } from 'react';

type ValuationState = 'input' | 'calculating' | 'result';

export default function DegerlemeClient({ districts }: { districts: any[] }) {
  const [step, setStep] = useState<ValuationState>('input');
  const [formData, setFormData] = useState({
    district: '',
    sqm: '',
    rooms: '3+1',
    age: '5-10',
  });
  const [estimate, setEstimate] = useState<{ min: number, max: number } | null>(null);
  
  // Lead Form
  const [leadPhone, setLeadPhone] = useState('');
  const [leadStatus, setLeadStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const calculateValue = () => {
    if (!formData.district || !formData.sqm) return;
    
    setStep('calculating');

    // Tersine Mühendislik (Real Estate Valuation Algorithm)
    const districtData = districts.find(d => d.slug === formData.district);
    const basePricePerSqm = districtData ? districtData.avg_sqm_price : 20000;
    
    const sqm = parseInt(formData.sqm) || 100;
    
    let roomMultiplier = 1.0;
    if (formData.rooms === '1+1') roomMultiplier = 0.9;
    if (formData.rooms === '3+1') roomMultiplier = 1.1;
    if (formData.rooms === '4+1+') roomMultiplier = 1.25;

    let ageMultiplier = 1.0;
    if (formData.age === '0-5') ageMultiplier = 1.15;
    if (formData.age === '10-20') ageMultiplier = 0.9;
    if (formData.age === '20+') ageMultiplier = 0.75;

    const baseValue = basePricePerSqm * sqm * roomMultiplier * ageMultiplier;
    
    setTimeout(() => {
      setEstimate({
        min: baseValue * 0.9, // %10 yanılma payı (min)
        max: baseValue * 1.1  // %10 yanılma payı (max)
      });
      setStep('result');
    }, 1500); // Algoritma çalışıyor hissi (Psikolojik bekleme)
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeadStatus('loading');
    
    const districtName = districts.find(d => d.slug === formData.district)?.name || formData.district;

    try {
      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Otonom Değerleme Müşterisi',
          phone: leadPhone,
          email: '',
          district: districtName,
          propertyType: 'Mülk Değerleme',
          budget: estimate ? `${formatPrice(estimate.min)} - ${formatPrice(estimate.max)}` : 'Bilinmiyor',
          message: `${formData.sqm} m², ${formData.rooms}, ${formData.age} yaşındaki mülk için kesin ekspertiz istiyor.`
        })
      });
      setLeadStatus('success');
    } catch (err) {
      setLeadStatus('idle');
    }
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="pt-32 pb-20 bg-gray-950 min-h-screen text-gray-100 font-sans">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="text-center mb-12">
          <span className="text-yellow-600 text-xs font-bold tracking-widest uppercase mb-4 block">Yapay Zeka Destekli</span>
          <h1 className="text-4xl md:text-6xl mb-6 font-serif text-white">Anında Konut <span className="text-yellow-500 italic">Değerleme</span></h1>
          <p className="text-gray-400 text-lg">Mülkünüzün güncel piyasa değerini büyük veri analiziyle saniyeler içinde öğrenin.</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          
          {step === 'input' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2 block ml-2">İlçe</label>
                  <select 
                    value={formData.district} 
                    onChange={e => setFormData({...formData, district: e.target.value})}
                    className="w-full bg-gray-900 border border-white/5 p-4 rounded-2xl text-white outline-none focus:border-yellow-600 transition-colors"
                  >
                    <option value="">Seçiniz</option>
                    {districts.map(d => <option key={d.id} value={d.slug}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2 block ml-2">Brüt m²</label>
                  <input 
                    type="number" 
                    value={formData.sqm}
                    onChange={e => setFormData({...formData, sqm: e.target.value})}
                    placeholder="Örn: 120"
                    className="w-full bg-gray-900 border border-white/5 p-4 rounded-2xl text-white outline-none focus:border-yellow-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2 block ml-2">Oda Sayısı</label>
                  <select 
                    value={formData.rooms} 
                    onChange={e => setFormData({...formData, rooms: e.target.value})}
                    className="w-full bg-gray-900 border border-white/5 p-4 rounded-2xl text-white outline-none focus:border-yellow-600 transition-colors"
                  >
                    <option value="1+1">1+1</option>
                    <option value="2+1">2+1</option>
                    <option value="3+1">3+1</option>
                    <option value="4+1+">4+1 ve üzeri</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2 block ml-2">Bina Yaşı</label>
                  <select 
                    value={formData.age} 
                    onChange={e => setFormData({...formData, age: e.target.value})}
                    className="w-full bg-gray-900 border border-white/5 p-4 rounded-2xl text-white outline-none focus:border-yellow-600 transition-colors"
                  >
                    <option value="0-5">0-5 Yaş (Yeni)</option>
                    <option value="5-10">5-10 Yaş</option>
                    <option value="10-20">10-20 Yaş</option>
                    <option value="20+">20 Yaş ve Üzeri</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={calculateValue}
                disabled={!formData.district || !formData.sqm}
                className="w-full bg-yellow-600 disabled:opacity-50 hover:bg-yellow-500 text-gray-950 font-bold py-5 rounded-2xl text-lg mt-8 transition-all shadow-xl"
              >
                Değerini Hesapla
              </button>
            </div>
          )}

          {step === 'calculating' && (
            <div className="py-20 flex flex-col items-center justify-center animate-in zoom-in duration-500">
              <div className="w-16 h-16 border-4 border-yellow-600/30 border-t-yellow-500 rounded-full animate-spin mb-8"></div>
              <h3 className="text-2xl font-serif text-white mb-2">Büyük Veri Analiz Ediliyor...</h3>
              <p className="text-gray-500 text-sm">Son 6 aylık piyasa verileri taranıyor.</p>
            </div>
          )}

          {step === 'result' && estimate && (
            <div className="text-center animate-in slide-in-from-bottom-8 duration-700">
              <span className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4 block">Tahmini Piyasa Değeri</span>
              <div className="bg-gray-900/50 border border-yellow-600/30 rounded-3xl p-8 mb-8 inline-block shadow-2xl">
                <div className="text-4xl md:text-5xl font-serif text-yellow-500 font-bold mb-2">
                  {formatPrice(estimate.min)} - {formatPrice(estimate.max)}
                </div>
                <div className="text-gray-400 text-sm mt-4">*Bu değer algoritmik bir tahmindir.</div>
              </div>

              {/* Lead Capture Funnel */}
              {leadStatus === 'success' ? (
                 <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-6 rounded-2xl">
                  <span className="text-2xl mb-2 block">✅</span>
                  <h4 className="font-bold">Talebiniz Alındı</h4>
                  <p className="text-sm">Bölge uzmanımız net değerleme için sizi arayacak.</p>
                 </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 max-w-xl mx-auto">
                  <h4 className="text-xl font-serif text-white mb-2">Kesin ve Sertifikalı Ekspertiz İster misiniz?</h4>
                  <p className="text-gray-500 text-sm mb-6">Mülkünüzün gerçek satış değerini belirlemek için ücretsiz fiziki eksper talep edin.</p>
                  <form onSubmit={handleLeadSubmit} className="flex flex-col md:flex-row gap-4">
                    <input 
                      type="tel" 
                      required
                      value={leadPhone}
                      onChange={e => setLeadPhone(e.target.value)}
                      placeholder="Telefon Numaranız" 
                      className="flex-1 bg-gray-900 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-600"
                    />
                    <button disabled={leadStatus === 'loading'} className="bg-yellow-600 hover:bg-yellow-500 text-gray-950 font-bold px-8 py-4 rounded-xl transition-all whitespace-nowrap disabled:opacity-50">
                      Ücretsiz Talep Et
                    </button>
                  </form>
                </div>
              )}
              
              <button onClick={() => setStep('input')} className="mt-8 text-gray-500 text-sm hover:text-white underline">Yeni Bir Hesaplama Yap</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
