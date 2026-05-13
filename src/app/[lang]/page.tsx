import React from 'react';
import Link from 'next/link';
import { getDictionary, Locale } from '@/getDictionary';
import { getDistrictsWithCounts, getMarketTrends } from '@/lib/api';

import HomeSearchBar from '@/components/home/HomeSearchBar';
import RegionCatalogue from '@/components/home/RegionCatalogue';

export default async function Home(props: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await props.params;
  const lang = langParam as Locale;
  const dict = await getDictionary(lang);
  const districts = await getDistrictsWithCounts();
  const marketTrends = await getMarketTrends();
  const isRtl = lang === 'ar';

  return (
    <main className={`min-h-screen bg-gray-950 text-gray-100 selection:bg-yellow-600/30 font-sans ${isRtl ? 'rtl' : 'ltr'}`}>
      {/* NOISE OVERLAY: Hafifletildi */}
      <div className="fixed inset-0 z-[100] pointer-events-none opacity-[0.02] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* HERO SECTION: CINEMATIC SILENT LUXURY */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* Cinematic Vignette & Deep Shadows */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-950/60 via-transparent to-gray-950 z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(10,10,14,0.4)_100%)] z-10" />
          
          {/* Animated Background Image */}
          <img 
            src="/cinematic_luxury_hero_bg.png" 
            alt="Kaynak Gayrimenkul Luxury" 
            className="w-full h-full object-cover opacity-70 scale-105 animate-breathing" 
          />
        </div>
        
        <div className="container relative z-20 px-6 text-center">
          <div className="inline-flex items-center gap-6 mb-12 animate-fade" style={{ animationDelay: '0.2s' }}>
            <span className="w-16 h-[1px] bg-white/20" />
            <span className="text-[11px] font-sans font-medium tracking-[0.8em] uppercase text-white/50">
              {isRtl ? 'التميز في العقارات' : 'Elite Property Management'}
            </span>
            <span className="w-16 h-[1px] bg-white/20" />
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-serif mb-16 leading-[0.9] text-white tracking-tighter drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade">
            {lang === 'tr' ? (
              <>Zamanın <br /> <span className="font-light italic text-white/90">Ötesinde.</span></>
            ) : isRtl ? (
              <>عقارات <br /> <span className="font-light italic text-white/90">خالدة.</span></>
            ) : (
              <>Timeless <br /> <span className="font-light italic text-white/90">Vision.</span></>
            )}
          </h1>

          <div className="max-w-4xl mx-auto animate-fade" style={{ animationDelay: '0.4s' }}>
            <HomeSearchBar districts={districts} dict={dict} lang={lang} isRtl={isRtl} />
          </div>

          <div className="mt-16 flex flex-col items-center gap-4 animate-fade" style={{ animationDelay: '0.6s' }}>
            <p className="text-[10px] font-sans font-bold uppercase tracking-[0.5em] text-white/30">Scroll to Explore</p>
            <div className="w-[1px] h-20 bg-gradient-to-b from-white/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* PORTFOLIO CATALOGUE: DAHA NET VE FERAH */}
      <section className="py-32 container mx-auto px-6">
        <div className={`flex flex-col md:flex-row justify-between items-end mb-20 gap-8 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
          <div className={`max-w-2xl ${isRtl ? 'text-right' : 'text-left'}`}>
            <h2 className="text-5xl md:text-6xl font-serif italic text-white leading-tight mb-6">
              {dict.home.catalog.title}
            </h2>
            <p className="text-gray-400 text-lg font-light tracking-wide">
              Ankara'nın en prestijli bölgelerinde, otonom sistemlerimizle filtrelenmiş portföyler.
            </p>
          </div>
          <Link href={`/${lang}/portfoy`} className="group flex items-center gap-4 text-yellow-600 text-[10px] font-bold tracking-[0.4em] uppercase pb-2 border-b border-yellow-600/20 hover:border-yellow-600 transition-all">
            {dict.home.catalog.viewAll} <span className="transition-transform group-hover:translate-x-2">{isRtl ? '←' : '→'}</span>
          </Link>
        </div>
        
        <RegionCatalogue districts={districts.slice(0, 8)} dict={dict} lang={lang} isRtl={isRtl} />
      </section>

      {/* SYSTEM FLOW: TEKNİK OTORİTE (Dengelenmiş Yerleşim) */}
      <section className="py-32 border-y border-white/5 bg-white/[0.01]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
            {[
              { num: '01', title: 'Data Analysis', desc: 'Anlık piyasa verisi taraması.' },
              { num: '02', title: 'AI Matching', desc: 'Yatırımcı-Portföy optimizasyonu.' },
              { num: '03', title: 'Legal Audit', desc: 'Kusursuz hukuki süreç yönetimi.' },
              { num: '04', title: 'Fast Exit', desc: 'Hedef kitleye doğrudan erişim.' }
            ].map((step, i) => (
              <div key={i} className="text-center md:text-left group">
                <div className="text-5xl font-serif text-white/10 mb-4 group-hover:text-yellow-600/20 transition-colors">{step.num}</div>
                <h4 className="text-white font-bold tracking-widest uppercase text-[10px] mb-3">{step.title}</h4>
                <p className="text-gray-500 text-xs font-light leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVICES SECTION: LUXURY CONSULTANCY */}
      <section className="py-32 container mx-auto px-6">
        <div className="text-center mb-20">
          <span className="text-yellow-600 text-[10px] font-bold tracking-[0.5em] uppercase mb-4 block">HİZMETLERİMİZ</span>
          <h2 className="text-5xl md:text-6xl font-serif italic text-white leading-tight">Size Özel <span className="text-yellow-600">Çözümler</span></h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { title: 'Konut Satışı', desc: 'Daire, villa ve müstakil ev satışında otonom veri analiziyle en hızlı sonuç.', icon: '🏠' },
            { title: 'Kiralama Hizmeti', desc: 'Güvenilir kiracı profili analizi ve kurumsal mülk yönetimi.', icon: '🔑' },
            { title: 'Ticari Yatırım', desc: 'Ofis, dükkan ve plaza yatırımlarında ROI odaklı danışmanlık.', icon: '🏢' },
            { title: 'Yatırım Danışmanlığı', desc: 'Ankara lüks konut piyasasında veriye dayalı stratejik rehberlik.', icon: '📈' }
          ].map((service, i) => (
            <div key={i} className="bg-white/[0.02] border border-white/5 p-16 rounded-[3rem] hover:border-yellow-600/30 transition-all group">
              <div className="text-4xl mb-8 group-hover:scale-110 transition-transform">{service.icon}</div>
              <h4 className="text-xl font-serif text-white mb-4">{service.title}</h4>
              <p className="text-gray-500 text-xs font-light leading-relaxed">{service.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HYPER-LOCAL INTELLIGENCE: ETİMESGUT AUTHORITY (Silah 1 & 4) */}
      <section className="py-40 container mx-auto px-6">
        <div className="bg-white/[0.02] border border-white/5 rounded-[4rem] p-16 md:p-32 relative group">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-yellow-600/5 via-transparent to-transparent" />
          
          <div className="flex flex-col lg:flex-row justify-between items-center gap-16 relative z-10">
            <div className="max-w-2xl text-center lg:text-left">
              <span className="text-yellow-600 text-[10px] font-bold tracking-[0.5em] uppercase mb-4 block">HİPER-LOKAL ZEKA</span>
              <h2 className="text-5xl md:text-7xl font-serif text-white mb-8 italic px-4 leading-[1.1]">Etimesgut’u <br /><span className="text-yellow-600">Sokak Sokak</span> Tanıyoruz</h2>
              <p className="text-gray-400 text-lg font-light leading-relaxed mb-12">
                Franchise ofislerinin aksine, biz Yapracık'taki m² trendini, Elvankent'in okul çevresi analizini ve Etimesgut metro hattının konut fiyatlarına etkisini gerçek zamanlı verilerle takip ediyoruz.
              </p>
              
              <div className="grid grid-cols-2 gap-8 text-left">
                {marketTrends && marketTrends.length > 0 ? (
                  <>
                    <div>
                      <div className="text-2xl font-bold text-white mb-1">
                        {marketTrends[0].avgPrice.toLocaleString('tr-TR')} TL
                      </div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                        {marketTrends[0].name} Ort. m²
                      </p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white mb-1">
                        {marketTrends[0].count} Aktif
                      </div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                        İncelenen Portföy
                      </p>
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="text-xl font-bold text-white mb-1 italic opacity-50">Veri İşleniyor...</div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Otonom Analiz Devam Ediyor</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="w-full lg:w-1/3 bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-12 rounded-[3rem] shadow-2xl">
              <h4 className="text-xl font-serif text-white mb-6 italic">Etimesgut Değerleme</h4>
              <p className="text-gray-500 text-sm mb-8 font-light">Mülkünüzün Etimesgut piyasasındaki güncel değerini otonom olarak hesaplayın.</p>
              <Link href={`/${lang}/evimi-satmak-istiyorum`} className="block w-full bg-yellow-600 text-gray-950 text-center py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-yellow-500 transition-all shadow-[0_10px_30px_rgba(202,138,4,0.3)]">
                ŞİMDİ HESAPLA
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="py-40 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-16 md:p-24 rounded-[4rem] shadow-2xl relative text-center">
            <span className="text-[10px] font-bold tracking-[0.6em] text-yellow-600 uppercase mb-8 block">QUANTUM OS ENGINE</span>
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif mb-10 leading-[1.2] text-white italic px-6">
              {dict.home.sell.title}
            </h2>
            <p className="text-gray-400 text-lg mb-16 max-w-2xl mx-auto font-light">
              {dict.home.sell.description}
            </p>
            
            <Link 
              href={`/${lang}/evimi-satmak-istiyorum`} 
              className="inline-block bg-yellow-600 hover:bg-yellow-500 text-gray-950 px-16 py-6 rounded-2xl font-bold text-lg transition-all shadow-[0_10px_40px_rgba(202,138,4,0.3)] hover:-translate-y-1 uppercase tracking-widest"
            >
              {dict.home.sell.button}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
