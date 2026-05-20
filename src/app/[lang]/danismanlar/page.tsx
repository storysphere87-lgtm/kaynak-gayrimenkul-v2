import { Metadata } from 'next';
import Link from 'next/link';
import { getDictionary, Locale } from '@/getDictionary';
import { Shield, Sparkles, MessageSquare, ArrowUpRight, TrendingUp } from 'lucide-react';

export async function generateMetadata({ params: { lang } }: { params: { lang: Locale } }): Promise<Metadata> {
  const dict = await getDictionary(lang);
  return {
    title: `Lüks Konut Danışmanlarımız | Kaynak Gayrimenkul`,
    description: 'Ankara lüks gayrimenkul piyasasının en tecrübeli bölgesel uzmanları ve yatırım brokerları ile tanışın.',
  };
}

export default async function DanismanlarPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = await getDictionary(lang);
  const isRtl = lang === 'ar';

  const team = [
    {
      name: 'Cafer Peksoy',
      role: 'Kurucu Broker / Lüks Konut Uzmanı',
      username: 'cafer',
      bgImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=600', // Çankaya Lüks Residans Temalı
      badges: ['🏆 ÇANKAYA & ÇAYYOLU OTORİTESİ', '💰 18+ YILLIK SEKTÖR DENEYİMİ', '📈 %98 TAVSİYE ORANI'],
      hookTitle: 'Verinin Otoritesiyle Mülkünüze Değer Biçelim',
      hookText: 'Son 3 ayda Çankaya & Çayyolu bölgesinde 240M+ TL portföy değerleme analizi gerçekleştirdik. Sizin mülkünüzün gerçek pazar değeri nedir?',
      expertise: ['Çankaya', 'Çayyolu', 'Lüks Rezidans', 'Yatırım Danışmanlığı'],
      waMessage: 'Merhaba Cafer Bey, Çankaya/Çayyolu bölgesi için hazırladığınız güncel yatırım ve değerleme raporunu incelemek istiyorum.'
    },
    {
      name: 'Refia Nur Peksoy',
      role: 'Yatırım Danışmanı / Villa Segment Lideri',
      username: 'refia',
      bgImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=600', // İncek Lüks Villa Temalı
      badges: ['🏡 İNCEK & ÜMİTKÖY VİLLA UZMANI', '🤫 OFF-MARKET PORTFÖY LİDERİ', '⏱ 18 GÜNDE SATIŞ GÜCÜ'],
      hookTitle: 'Off-Market Portföylerle Sessiz Lüks Ayrıcalığı',
      hookText: 'İncek & Ümitköy villa pazarında halka açık olmayan (gizli) portföylerimizle Ankara’nın en seçkin ailelerine kapalı kapılar ardında rehberlik ediyoruz.',
      expertise: ['İncek', 'Ümitköy', 'Villa Segmenti', 'Off-Market Portföy'],
      waMessage: 'Merhaba Refia Hanım, İncek/Ümitköy bölgesi için hazırladığınız off-market (halka kapalı) lüks villa portföy kataloğunu alabilir miyim?'
    }
  ];

  return (
    <main className={`min-h-screen bg-gray-950 text-gray-100 pt-32 pb-32 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* NOISE OVERLAY */}
      <div className="fixed inset-0 z-10 pointer-events-none opacity-[0.02] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="container mx-auto px-6 relative z-20">
        
        {/* HEADER */}
        <div className="text-center mb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="text-yellow-600 text-xs font-bold tracking-[0.5em] uppercase mb-4 block">BÖLGESEL YATIRIM OTORİTELERİ</span>
          <h1 className="text-4xl md:text-7xl font-serif mb-8 text-white italic">Otorite İle <span className="text-yellow-500">Tanışın</span></h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Ankara'nın en prestijli lokasyonlarında, klasik emlakçılığın ötesinde veri analitiği ve gizlilik esaslı yatırım danışmanlığı.
          </p>
        </div>

        {/* TEAM CARDS CONTAINER */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {team.map((member, i) => {
            const waUrl = `https://wa.me/905323530606?text=${encodeURIComponent(member.waMessage)}`;

            return (
              <div 
                key={i} 
                className="group relative bg-gradient-to-b from-gray-900 to-gray-950 border border-white/5 rounded-[2.5rem] overflow-hidden hover:border-yellow-600/30 transition-all duration-500 shadow-2xl flex flex-col justify-between"
              >
                
                {/* 1. ÜST KISIM: LÜKS BÖLGESEL ARKA PLAN VE ROZETLER */}
                <div className="aspect-[16/10] w-full relative overflow-hidden">
                  <img 
                    src={member.bgImage} 
                    alt={member.name} 
                    className="w-full h-full object-cover transition-transform duration-[10000ms] group-hover:scale-110 opacity-40 group-hover:opacity-50"
                  />
                  {/* Karartılmış Elite Gradyan */}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent z-10" />
                  
                  {/* Otorite Rozetleri */}
                  <div className="absolute top-6 left-6 z-20 flex flex-col gap-2 max-w-[90%]">
                    {member.badges.map((badge, idx) => (
                      <span 
                        key={idx} 
                        className="bg-gray-950/80 border border-yellow-500/30 text-yellow-500 text-[9px] font-bold py-1.5 px-4 rounded-full uppercase tracking-wider shadow-lg backdrop-blur-md w-fit"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>

                  {/* Sağ Üst Köşe Lüks Logo Rozeti */}
                  <div className="absolute top-6 right-6 z-20 bg-yellow-500/10 border border-yellow-500/20 p-2 rounded-full backdrop-blur-md">
                    <Sparkles size={16} className="text-yellow-500 animate-pulse" />
                  </div>
                </div>

                {/* 2. ORTA VE ALT KISIM: ESTETİK VE OKUNAKLI YAZI ALANI (TAŞMA VE KIVRIM BUG'I GİDERİLDİ) */}
                <div className="p-8 md:p-10 flex-1 flex flex-col justify-between relative z-20 bg-gray-950/40 backdrop-blur-sm -mt-10 rounded-t-[2rem]">
                  
                  <div>
                    {/* Danışman Kimliği */}
                    <span className="text-yellow-600 text-[10px] font-bold uppercase tracking-[0.25em] mb-2 block">
                      {member.role}
                    </span>
                    <h3 className="text-3xl font-serif text-white mb-6 group-hover:text-yellow-500 transition-colors">
                      {member.name}
                    </h3>

                    {/* KANCA BAŞLIK VE HEDEF FUNNEL METNİ */}
                    <div className="border-l-2 border-yellow-500/40 pl-4 mb-6">
                      <h4 className="text-base font-bold text-gray-200 mb-2 italic">
                        "{member.hookTitle}"
                      </h4>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {member.hookText}
                      </p>
                    </div>

                    {/* Uzmanlık Alanları */}
                    <div className="flex flex-wrap gap-2 mb-8">
                      {member.expertise.map((exp, idx) => (
                        <span 
                          key={idx} 
                          className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[9px] font-bold uppercase text-gray-400 tracking-wider"
                        >
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Çift Dönüşüm Kanca Butonu (SLA & NFC Destekli) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-white/5">
                    
                    {/* Eylem 1: Bölgesel Veri Talebi (WhatsApp Funnel) */}
                    <a 
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-gray-950 font-bold text-[10px] py-3.5 px-4 rounded-xl uppercase tracking-widest transition-all active:scale-[0.98] shadow-lg shadow-yellow-600/10"
                    >
                      <MessageSquare size={14} />
                      Analiz Raporu Al
                    </a>

                    {/* Eylem 2: Dijital Kartviziti İncele (NFC / QR Link) */}
                    <Link 
                      href={`/${lang}/kartvizit/${member.username}`}
                      className="flex items-center justify-center gap-2 bg-gray-900 border border-white/10 hover:border-yellow-600/30 text-white hover:bg-gray-800 font-bold text-[10px] py-3.5 px-4 rounded-xl uppercase tracking-widest transition-all active:scale-[0.98]"
                    >
                      Dijital Kartvizit
                      <ArrowUpRight size={14} className="text-gray-400" />
                    </Link>

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
