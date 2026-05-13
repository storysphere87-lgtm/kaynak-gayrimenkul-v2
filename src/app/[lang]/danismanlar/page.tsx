import { Metadata } from 'next';
import Link from 'next/link';
import { getDictionary, Locale } from '@/getDictionary';

export async function generateMetadata({ params: { lang } }: { params: { lang: Locale } }): Promise<Metadata> {
  const dict = await getDictionary(lang);
  return {
    title: `Danışmanlarımız | Kaynak Gayrimenkul`,
    description: 'Ankara lüks gayrimenkul piyasasının en tecrübeli uzmanları ile tanışın.',
  };
}

export default async function DanismanlarPage({ params: { lang } }: { params: { lang: Locale } }) {
  const dict = await getDictionary(lang);
  const isRtl = lang === 'ar';

  const team = [
    {
      name: 'Cafer Peksoy',
      role: 'Kurucu Broker / Lüks Konut Uzmanı',
      image: '/cafer_peksoy_portrait_1778566851819.png',
      expertise: ['Çankaya', 'Gölbaşı', 'Lüks Konut', 'Ticari'],
      quote: 'Verinin otoritesiyle gayrimenkulde yeni nesil danışmanlık.'
    },
    {
      name: 'Refia Nur Peksoy',
      role: 'Broker / Yatırım Danışmanı',
      image: '/refia_nur_peksoy_portrait_1778566906221.png',
      expertise: ['İncek', 'Ümitköy', 'Yatırım Analizi', 'Arsa'],
      quote: 'Kusursuz süreç yönetimiyle mülkünüze değer katarız.'
    }
  ];

  return (
    <main className={`min-h-screen bg-gray-950 text-gray-100 pt-32 pb-32 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* NOISE OVERLAY */}
      <div className="fixed inset-0 z-[100] pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="container mx-auto px-6">
        <div className="text-center mb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="text-yellow-600 text-xs font-bold tracking-[0.5em] uppercase mb-4 block">UZMAN KADROMUZ</span>
          <h1 className="text-5xl md:text-8xl font-serif mb-8 text-white italic">Otorite İle <span className="text-yellow-500">Tanışın</span></h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed">
            Ankara'nın her bölgesinde saha tecrübesi ve veri analitiği ile size en doğru yatırım kararlarını aldırmak için buradayız.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-6xl mx-auto">
          {team.map((member, i) => (
            <div key={i} className="group relative bg-white/[0.02] border border-white/5 rounded-[4rem] overflow-hidden hover:border-yellow-600/30 transition-all duration-700 shadow-2xl">
              <div className="aspect-[4/5] relative overflow-hidden">
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-110 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10" />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-12 z-20">
                <span className="text-yellow-600 text-[10px] font-bold uppercase tracking-[0.3em] mb-4 block">{member.role}</span>
                <h3 className="text-4xl font-serif text-white mb-6 group-hover:text-yellow-500 transition-colors">{member.name}</h3>
                
                <div className={`flex flex-wrap gap-2 mb-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  {member.expertise.map((exp, idx) => (
                    <span key={idx} className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                      {exp}
                    </span>
                  ))}
                </div>

                <Link href={`/${lang}/iletisim`} className="inline-flex items-center gap-4 text-white text-[10px] font-bold uppercase tracking-[0.4em] group/btn">
                   DANIŞMANA ULAŞIN <span className="transition-transform group-hover/btn:translate-x-2">→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
