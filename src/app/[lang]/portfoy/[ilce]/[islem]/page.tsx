import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDistrictData, getPropertiesByDistrict, getAllDistricts } from '@/lib/api';

interface PageParams {
  params: Promise<{
    lang: Locale;
    ilce: string;
    islem: string;
  }>;
}

export async function generateStaticParams() {
  const districts = await getAllDistricts();
  const types = ['satilik', 'kiralik'];
  const languages: Locale[] = ['tr', 'en', 'ar'];
  
  const params = [];
  for (const lang of languages) {
    for (const dist of districts) {
      for (const islem of types) {
        params.push({ lang, ilce: dist.slug, islem });
      }
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { lang, ilce, islem } = await params;
  const district = await getDistrictData(ilce);
  if (!district) return { title: 'Sayfa Bulunamadı' };
  const islemText = islem === 'satilik' ? (lang === 'tr' ? 'Satılık' : 'For Sale') : (lang === 'tr' ? 'Kiralık' : 'For Rent');
  return {
    title: `${district.name} ${islemText} Daire İlanları | Kaynak Gayrimenkul`,
    description: `${district.name} bölgesindeki güncel ${islem} ilanları ve yatırım fırsatları.`
  };
}

export default async function DistrictPage({ params }: PageParams) {
  const { lang, ilce, islem } = await params;
  const district = await getDistrictData(ilce);
  if (!district) notFound();
  const properties = await getPropertiesByDistrict(district.id, islem);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-32">
      <section className="relative py-24 border-b border-white/5 bg-gradient-to-b from-gray-900 to-gray-950 pt-32">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl">
            <nav className="text-xs text-yellow-600/80 mb-6 flex gap-2 uppercase font-bold">
              <Link href={`/${lang}`}>Anasayfa</Link> / <Link href={`/${lang}/portfoy`}>Portföy</Link> / <span className="text-gray-500">{district.name}</span>
            </nav>
            <h1 className="text-4xl md:text-7xl font-serif mb-6 leading-tight">
              {district.name} <span className="text-yellow-500">{islem === 'satilik' ? 'Satılık' : 'Kiralık'}</span> <br /> İlanları
            </h1>
            <p className="text-xl text-gray-400 leading-relaxed max-w-2xl">{district.description}</p>
          </div>
        </div>
      </section>

      <section className="py-12 -mt-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/50 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Ortalama m² Fiyatı</p>
              <div className="text-2xl font-bold text-white">{district.avg_sqm_price.toLocaleString('tr-TR')} TL</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Amortisman Süresi</p>
              <div className="text-2xl font-bold text-white">{district.roi_years} Yıl</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Yıllık Trend</p>
              <div className="text-2xl font-bold text-yellow-500">+{district.trend_percentage}%</div>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Aktif İlan</p>
              <div className="text-2xl font-bold text-white">{properties.length || district.active_listings}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 container mx-auto px-6">
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-serif italic">Güncel İlanlar</h2>
          <div className="h-px flex-1 bg-white/5 mx-8 hidden md:block"></div>
        </div>
        {properties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {properties.map((item) => (
              <div key={item.id} className="group bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-yellow-600/50 transition-all duration-500">
                <div className="aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 relative">
                  <div className="absolute top-4 left-4 z-10 bg-yellow-600 text-gray-950 px-2 py-1 text-[10px] font-bold uppercase rounded">{item.type}</div>
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-serif mb-4 group-hover:text-yellow-500 transition-colors">{item.title}</h3>
                  <div className="text-2xl font-bold text-white mb-6">{formatPrice(item.price)}</div>
                  <div className="flex gap-4 text-xs text-gray-500 border-t border-white/5 pt-4">
                    <span>{item.rooms}</span> <span>{item.sqm} m²</span> <span>{item.status.toUpperCase()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/5 border border-dashed border-white/10 rounded-[3rem] p-20 text-center">
            <p className="text-gray-500 text-xl font-serif italic">Bu bölgede şu an aktif dijital ilan bulunmamaktadır.<br/>Özel portföyümüz için bizimle iletişime geçin.</p>
          </div>
        )}
      </section>

      {/* Mahalleler Section */}
      {district.neighborhoods && (
        <section className="py-20 bg-gray-900/30 border-y border-white/5">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-serif mb-12 italic">{district.name} Popüler Mahalleler</h2>
            <div className="flex flex-wrap gap-4">
              {district.neighborhoods.map((m: string) => (
                <span key={m} className="bg-white/5 border border-white/10 px-6 py-3 rounded-full text-sm font-medium hover:bg-yellow-600/10 hover:border-yellow-600/30 transition-colors cursor-default">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQs Section */}
      <section className="py-32 container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-serif mb-16 text-center italic">Sıkça Sorulan Sorular</h2>
          <div className="space-y-6">
            {(islem === 'satilik' ? district.faqs_sale : district.faqs_rent)?.map((faq: any, idx: number) => (
              <div key={idx} className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors">
                <h3 className="text-xl font-bold text-yellow-500 mb-4">{faq.q}</h3>
                <p className="text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="fixed bottom-8 left-0 right-0 z-50 px-6">
        <div className="container mx-auto">
          <div className="bg-yellow-600 shadow-2xl rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-gray-950 text-2xl font-bold font-serif">{district.name} Bölgesinde Mülkünüz mü Var?</h3>
              <p className="text-gray-950/80 font-medium">Gerçek değerini otonom sistemimizle hemen öğrenin.</p>
            </div>
            <Link href={`/${lang}/evimi-satmak-istiyorum`} className="bg-gray-950 text-yellow-500 px-10 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-all">Ücretsiz Değerleme Al →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
