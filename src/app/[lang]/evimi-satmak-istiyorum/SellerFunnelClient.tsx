'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SellerFunnelClient({ dict, lang, districts }: { dict: any, lang: string, districts: any[] }) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    propertyType: '',
    district: '',
    sqm: 0,
    name: '',
    phone: ''
  });
  const [valuation, setValuation] = useState<{ min: number; max: number } | null>(null);

  const isRtl = lang === 'ar';

  useEffect(() => {
    if (formData.district && formData.sqm > 0) {
      const districtData = districts.find(d => d.slug === formData.district);
      const basePrice = districtData ? districtData.avg_sqm_price : 25000;
      const estimatedValue = formData.sqm * basePrice;
      setValuation({
        min: estimatedValue * 0.95,
        max: estimatedValue * 1.05
      });
    } else {
      setValuation(null);
    }
  }, [formData.district, formData.sqm, districts]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const startAnalysis = () => {
    setIsAnalyzing(true);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setAnalysisProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsAnalyzing(false);
          setStep(3);
        }, 500);
      }
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const districtName = districts.find(d => d.slug === formData.district)?.name || formData.district;
      
      const leadData = {
        name: formData.name,
        phone: formData.phone,
        email: '',
        district: districtName,
        propertyType: formData.propertyType,
        budget: valuation ? `${formatCurrency(valuation.min)} - ${formatCurrency(valuation.max)}` : 'Bilinmiyor',
        message: `${formData.sqm} m² ${formData.propertyType} satışı için otonom değerleme yapıldı.`
      };

      await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      });

      setStep(4);
    } catch (error) {
      console.error('Lead gönderim hatası:', error);
      alert('Bir hata oluştu, lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const openWhatsApp = () => {
    const districtName = districts.find(d => d.slug === formData.district)?.name || formData.district;
    const message = `Merhaba Cafer Bey, ${districtName}'deki ${formData.sqm}m² ${formData.propertyType} mülküm için otonom değerleme yaptım. %98 doğruluk payıyla tahmini değer: ${valuation ? formatCurrency(valuation.min) + ' - ' + formatCurrency(valuation.max) : 'Hesaplanıyor'}. Detaylı rapor ve satış stratejisi için görüşmek istiyorum.`;
    window.open(`https://wa.me/905323530606?text=${encodeURIComponent(message)}`, '_blank');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(lang === 'en' ? 'en-US' : lang === 'ar' ? 'ar-SA' : 'tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(value);
  };

  const analysisSteps = [
    "Market Data Scanning...",
    "Local District Trends Analysis...",
    "AI Comp Matching...",
    "Neural Valuation Engine Running...",
    "Generating Final Report..."
  ];

  return (
    <main className={`min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-4 pt-32 neural-bg ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-2xl relative">
        {/* NEURAL SCAN LINE */}
        {isAnalyzing && <div className="neural-scan" />}

        {step < 4 && !isAnalyzing && (
          <div className={`mb-12 flex justify-between items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={`h-1 flex-1 rounded-full transition-all duration-700 ${
                  step >= s ? 'bg-yellow-600 shadow-[0_0_10px_rgba(202,138,4,0.5)]' : 'bg-white/5'
                }`} 
              />
            ))}
          </div>
        )}

        <div className="glass-opal border border-white/10 rounded-[3rem] p-8 md:p-16 shadow-[0_40px_100px_rgba(0,0,0,0.7)] relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className={`absolute -top-40 ${isRtl ? '-left-40' : '-right-40'} w-80 h-80 bg-yellow-600/5 blur-[120px] rounded-full pointer-events-none`} />
          
          {isAnalyzing ? (
            <div className="py-20 text-center animate-in fade-in duration-700">
              <div className="relative w-32 h-32 mx-auto mb-12">
                <div className="absolute inset-0 border-4 border-yellow-600/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold font-sans">
                  %{analysisProgress}
                </div>
              </div>
              <h2 className="text-3xl font-serif mb-6 italic">Neural OS Analiz Ediyor</h2>
              <div className="h-2 w-full bg-white/5 rounded-full mb-8 overflow-hidden">
                <div className="h-full bg-yellow-600 transition-all duration-300" style={{ width: `${analysisProgress}%` }} />
              </div>
              <p className="text-yellow-600/60 font-sans text-[10px] uppercase tracking-[0.4em] animate-pulse">
                {analysisSteps[Math.min(Math.floor(analysisProgress / 20), 4)]}
              </p>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className={`animate-in fade-in slide-in-from-bottom-8 duration-700 ${isRtl ? 'text-right' : ''}`}>
                  <span className="text-yellow-600 text-[10px] font-bold uppercase tracking-[0.5em] mb-4 block">ADIM 01</span>
                  <h1 className="text-4xl md:text-5xl font-serif mb-4 italic">{dict.step1.title}</h1>
                  <p className="text-gray-500 mb-12 font-light">{dict.step1.subtitle}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dict.step1.types.map((type: string, index: number) => {
                      const val = ['Daire', 'Villa', 'Arsa', 'Ticari'][index] || type;
                      return (
                        <button
                          key={type}
                          onClick={() => {
                            setFormData({ ...formData, propertyType: val });
                            setStep(2);
                          }}
                          className={`p-10 ${isRtl ? 'text-right' : 'text-left'} rounded-[2rem] border border-white/5 bg-white/[0.02] hover:border-yellow-600/30 hover:bg-yellow-600/5 transition-all group relative overflow-hidden`}
                        >
                          <span className="relative z-10 text-xl font-serif group-hover:text-yellow-500 transition-colors">{type}</span>
                          <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className={`animate-in fade-in slide-in-from-right-8 duration-700 ${isRtl ? 'text-right' : ''}`}>
                  <button onClick={() => setStep(1)} className={`text-white/20 hover:text-white mb-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${isRtl ? 'flex-row-reverse w-full justify-start' : ''}`}>
                    {isRtl ? '→' : '←'} {dict.step2.back}
                  </button>
                  <h2 className="text-4xl font-serif mb-12 italic">{dict.step2.title}</h2>
                  <div className="space-y-8">
                    <div className="group">
                      <label className="block text-[10px] text-white/30 mb-4 uppercase tracking-[0.4em] font-bold">{dict.step2.district}</label>
                      <select 
                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                        className={`w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-yellow-600 outline-none transition-all appearance-none cursor-pointer font-sans text-sm ${isRtl ? 'text-right pl-12' : 'pr-12'}`}
                      >
                        <option value="" className="bg-gray-950">{dict.step2.select}</option>
                        {districts.map(d => (
                          <option key={d.id} value={d.slug} className="bg-gray-950">{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="group">
                      <label className="block text-[10px] text-white/30 mb-4 uppercase tracking-[0.4em] font-bold">{dict.step2.sqm}</label>
                      <input 
                        type="number"
                        placeholder={dict.step2.sqmPlaceholder}
                        onChange={(e) => setFormData({ ...formData, sqm: Number(e.target.value) })}
                        className={`w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-yellow-600 outline-none transition-all font-sans text-sm ${isRtl ? 'text-right' : ''}`}
                      />
                    </div>
                    
                    <button
                      disabled={!formData.district || !formData.sqm}
                      onClick={startAnalysis}
                      className="w-full p-6 rounded-2xl bg-white/10 hover:bg-white text-white hover:text-gray-950 font-bold text-xs uppercase tracking-[0.4em] transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
                    >
                      {dict.step2.submit}
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className={`animate-in fade-in slide-in-from-right-8 duration-700 ${isRtl ? 'text-right' : ''}`}>
                  <div className="mb-12 p-10 rounded-[2.5rem] bg-yellow-600/5 border border-yellow-600/20 relative overflow-hidden group">
                    <div className="neural-scan opacity-30" />
                    <span className="text-[10px] text-yellow-600 uppercase tracking-[0.5em] mb-4 block font-bold">TAHMİNİ PİYASA DEĞERİ</span>
                    <div className="text-4xl md:text-5xl font-serif text-white italic drop-shadow-2xl">
                      {valuation ? (
                        <>
                          <span className="digit-animate">{formatCurrency(valuation.min)}</span>
                          <span className="mx-4 opacity-30">—</span>
                          <span className="digit-animate">{formatCurrency(valuation.max)}</span>
                        </>
                      ) : '...'}
                    </div>
                  </div>

                  <h2 className="text-2xl font-serif mb-2 italic">{dict.step3.title}</h2>
                  <p className="text-gray-500 mb-10 font-light">{dict.step3.subtitle}</p>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] text-white/30 mb-3 uppercase tracking-widest font-bold">{dict.step3.name}</label>
                        <input required type="text" onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={`w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-yellow-600 outline-none transition-all font-sans text-sm ${isRtl ? 'text-right' : ''}`} />
                      </div>
                      <div>
                        <label className="block text-[10px] text-white/30 mb-3 uppercase tracking-widest font-bold">{dict.step3.phone}</label>
                        <input required type="tel" placeholder="05xx xxx xx xx" onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={`w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-yellow-600 outline-none transition-all font-sans text-sm ${isRtl ? 'text-right' : ''}`} />
                      </div>
                    </div>
                    <button disabled={isLoading} type="submit" className="w-full p-6 rounded-2xl bg-yellow-600 hover:bg-yellow-500 text-gray-950 font-bold text-xs uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 shadow-[0_20px_40px_rgba(202,138,4,0.3)]">
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-gray-950/20 border-t-gray-950 rounded-full animate-spin" />
                      ) : dict.step3.submit}
                    </button>
                  </form>
                </div>
              )}

              {step === 4 && (
                <div className="text-center animate-in zoom-in duration-700 py-10">
                  <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-10 border border-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.2)]">✓</div>
                  <h2 className="text-4xl font-serif mb-6 italic">{dict.step4.title}</h2>
                  <p className="text-gray-500 mb-12 leading-relaxed font-light max-w-md mx-auto">{dict.step4.description}</p>
                  
                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={openWhatsApp}
                      className="w-full p-6 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4 shadow-[0_20px_40px_rgba(37,211,102,0.2)]"
                    >
                      <span>WHATSAPP İLE RAPORU AL</span>
                    </button>
                    <Link href={`/${lang}`} className="text-white/30 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors py-4">
                      {dict.step4.home}
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
