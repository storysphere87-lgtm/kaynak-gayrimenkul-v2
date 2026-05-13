import { Metadata } from 'next';
import { getDictionary, Locale } from '@/getDictionary';

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: langParam } = await props.params;
  const lang = langParam as Locale;
  const dict = await getDictionary(lang);
  return {
    title: 'Hakkımızda | Kaynak Gayrimenkul Ankara',
    description: 'Ankara lüks konut piyasasında güvenin adresi. Otonom değerleme, elit portföy ve veri odaklı gayrimenkul danışmanlığı.',
  };
}

export default async function HakkimizdaPage(props: { params: Promise<{ lang: string }> }) {
  const { lang: langParam } = await props.params;
  const lang = langParam as Locale;
  const dict = await getDictionary(lang);
  const isRtl = lang === 'ar';

  return (
    <div className={`pt-32 pb-20 bg-gray-950 min-h-screen text-white ${isRtl ? 'rtl text-right' : 'ltr text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-6 max-w-6xl">
        
        {/* HERO BÖLÜMÜ */}
        <div className="text-center mb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <span className="text-yellow-600 text-xs font-bold tracking-[0.4em] uppercase mb-4 block">
            {isRtl ? 'سلطة الجيل القادم في العقارات' : lang === 'en' ? 'Next Generation Real Estate Authority' : 'Gayrimenkulde Yeni Nesil Otorite'}
          </span>
          <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight">
            {isRtl ? 'ثقة تقليدية،' : lang === 'en' ? 'Traditional Trust,' : 'Geleneksel Güven,'} <br /> 
            <span className="text-yellow-500 italic">
              {isRtl ? 'تكنولوجيا ذاتية.' : lang === 'en' ? 'Autonomous Tech.' : 'Otonom Teknoloji.'}
            </span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            {isRtl 
              ? 'في "كايناك" للعقارات، نتجاوز الوساطة التقليدية في أرقى مناطق أنقرة. نكشف عن الإمكانات الحقيقية لعقارك من خلال تحليل البيانات وخدماتنا الفاخرة.' 
              : lang === 'en' 
                ? 'At Kaynak Real Estate, we go beyond traditional brokerage in Ankara\'s most prestigious areas. We reveal the true potential of your property through data-driven analysis and luxury service.' 
                : 'Kaynak Gayrimenkul olarak Ankara\'nın en prestijli bölgelerinde, sıradan komisyonculuğun ötesine geçiyoruz. Veri odaklı analiz ve lüks hizmet anlayışımızla mülkünüzün gerçek potansiyelini ortaya çıkarıyoruz.'}
          </p>
        </div>

        {/* NEDEN BİZ? GRID (GLASSMORPHISM) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          {/* Otonom Değerleme */}
          <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-md hover:border-yellow-600/50 hover:bg-yellow-600/5 transition-all duration-500 hover:-translate-y-2 group">
            <div className="text-4xl mb-6 grayscale group-hover:grayscale-0 transition-all">🧠</div>
            <h3 className="text-2xl font-serif mb-4">
              {isRtl ? 'التقييم الذاتي' : lang === 'en' ? 'Autonomous Valuation' : 'Otonom Değerleme'}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {isRtl 
                ? 'نقوم بتحليل بيانات الأسعار الإقليمية في ثوانٍ باستخدام بنيتنا التحتية المدعومة بالذكاء الاصطناعي، ونقوم بتسعير عقارك بأكثر الطرق ربحية وواقعية.' 
                : lang === 'en' 
                  ? 'We analyze regional price data in seconds with our AI-supported infrastructure, making the most profitable and realistic pricing for your property.' 
                  : 'Yapay zeka destekli altyapımızla bölgesel m² verilerini saniyeler içinde analiz eder, mülkünüz için en kârlı ve gerçekçi fiyatlamayı yaparız.'}
            </p>
          </div>

          {/* Elit Portföy Ağı */}
          <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-md hover:border-yellow-600/50 hover:bg-yellow-600/5 transition-all duration-500 hover:-translate-y-2 group">
            <div className="text-4xl mb-6 grayscale group-hover:grayscale-0 transition-all">💎</div>
            <h3 className="text-2xl font-serif mb-4">
              {isRtl ? 'شبكة المحفظة النخبة' : lang === 'en' ? 'Elite Portfolio Network' : 'Elit Portföy Ağı'}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {isRtl 
                ? 'نحن نوفر الوصول المباشر إلى الفرص غير المدرجة في السوق ومجمع المشترين المغلق في المناطق الفاخرة مثل تشانكايا وجولباشي وإنجيك.' 
                : lang === 'en' 
                  ? 'We provide direct access to off-market opportunities and the closed buyer pool in luxury areas such as Cankaya, Golbasi, and Incek.' 
                  : 'Çankaya, Gölbaşı ve İncek gibi lüks bölgelerdeki off-market (gizli) fırsatlara ve kapalı alıcı havuzuna doğrudan erişim sağlıyoruz.'}
            </p>
          </div>

          {/* Mülk Koruma Zırhı */}
          <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] backdrop-blur-md hover:border-yellow-600/50 hover:bg-yellow-600/5 transition-all duration-500 hover:-translate-y-2 group">
            <div className="text-4xl mb-6 grayscale group-hover:grayscale-0 transition-all">🛡️</div>
            <h3 className="text-2xl font-serif mb-4">
              {isRtl ? 'درع حماية العقارات' : lang === 'en' ? 'Property Protection Shield' : 'Mülk Koruma Zırhı'}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {isRtl 
                ? 'نحن نقوم بتصفية جميع المخاطر القانونية والمالية في عملية البيع، ونجلب فقط المشترين المعتمدين ("Lead-Scored") إلى الطاولة.' 
                : lang === 'en' 
                  ? 'We filter all legal and financial risks in the sales process and bring only verified ("Lead-Scored") buyers to the table.' 
                  : 'Satış sürecindeki hukuki ve finansal tüm riskleri filtreler, yalnızca doğrulanmış ("Lead-Scored") alıcıları masaya getiririz.'}
            </p>
          </div>
        </div>
        {/* TEAM SECTION: AUTHENTIC AUTHORITY */}
        <div className="py-24">
          <h2 className="text-4xl md:text-6xl font-serif mb-20 italic text-white text-center">
            {isRtl ? 'فريقنا' : lang === 'en' ? 'Our Team' : 'Ekibimiz'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 max-w-6xl mx-auto">
            {/* Cafer Peksoy */}
            <div className="bg-white/5 border border-white/10 rounded-[3.5rem] overflow-hidden hover:border-yellow-600/50 transition-all group shadow-2xl">
              <div className={`flex flex-col md:flex-row items-center ${isRtl ? 'md:flex-row-reverse text-right' : 'text-left'}`}>
                <div className="w-full md:w-1/2 aspect-square overflow-hidden">
                  <img 
                    src="/cafer_peksoy_portrait_1778566851819.png" 
                    alt="Cafer Peksoy" 
                    className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-110"
                  />
                </div>
                <div className="p-10 md:w-1/2">
                  <h3 className="text-3xl font-serif mb-2 text-white">Cafer Peksoy</h3>
                  <p className="text-yellow-600 text-sm font-bold uppercase tracking-[0.3em] mb-6">Kurucu Broker</p>
                  <p className="text-gray-400 italic text-lg leading-relaxed">
                    {isRtl ? '"الثقة في العقارات تجد قيمتها الحقيقية عندما تقترن بسلطة البيانات."' : lang === 'en' ? '"Trust in real estate finds its true value when combined with data authority."' : '"Gayrimenkulde güven, verinin otoritesiyle birleştiğinde gerçek değerini bulur."'}
                  </p>
                </div>
              </div>
            </div>

            {/* Refia Nur Peksoy */}
            <div className="bg-white/5 border border-white/10 rounded-[3.5rem] overflow-hidden hover:border-yellow-600/50 transition-all group shadow-2xl">
              <div className={`flex flex-col md:flex-row items-center ${isRtl ? 'md:flex-row-reverse text-right' : 'text-left'}`}>
                <div className="w-full md:w-1/2 aspect-square overflow-hidden">
                  <img 
                    src="/refia_nur_peksoy_portrait_1778566906221.png" 
                    alt="Refia Nur Peksoy" 
                    className="w-full h-full object-cover transition-transform duration-[3000ms] group-hover:scale-110"
                  />
                </div>
                <div className="p-10 md:w-1/2">
                  <h3 className="text-3xl font-serif mb-2 text-white">Refia Nur Peksoy</h3>
                  <p className="text-yellow-600 text-sm font-bold uppercase tracking-[0.3em] mb-6">Broker</p>
                  <p className="text-gray-400 italic text-lg leading-relaxed">
                    {isRtl ? '"الفخامة ليست مجرد مكان، بل هي عملية استشارية مثالية."' : lang === 'en' ? '"Luxury is not just a place; it is a perfect consultancy process."' : '"Lüks, sadece bir mekan değil; kusursuz bir danışmanlık sürecidir."'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
