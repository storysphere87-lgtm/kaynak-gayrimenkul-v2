import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { getDictionary, Locale } from '@/getDictionary';
import Link from 'next/link';
import { siteConfig } from '@/config/site';

export const revalidate = 0; // Her zaman canlı veri çek

export async function generateMetadata(props: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: langParam } = await props.params;
  const lang = langParam as Locale;
  const dict = await getDictionary(lang);
  
  return {
    title: `Quantum Stealth OS | Kaynak Gayrimenkul`,
    description: 'Şifrelendirilmiş özel VIP gayrimenkul portföy erişim kapısı.',
    robots: { index: false, follow: false } // Arama motorlarından tamamen gizle
  };
}

export default async function StealthPortfolioPage(props: { params: Promise<{ lang: string, token: string }> }) {
  const { lang: langParam, token } = await props.params;
  const lang = langParam as Locale;
  const dict = await getDictionary(lang);
  const isRtl = lang === 'ar';

  // 1. Servis rolü yetkisiyle RLS'i bypass ederek veri tabanına bağlanalım
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 2. Token (Lead ID) doğrulaması yapalım
  // Müşterinin skoru yüksek mi veya VIP mi kontrol edelim
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', token)
    .single();

  if (leadError || !lead) {
    // Geçersiz token -> Erişim engellendi
    return renderAccessDenied(lang);
  }

  const isAuthorized = (lead.score && lead.score >= 80) || lead.intent_level === 'VIP';
  if (!isAuthorized) {
    // Yetersiz niyet skoru -> Erişim engellendi
    return renderAccessDenied(lang);
  }

  // 3. Yetkili alıcı için gizli (is_stealth = true) portföyleri çekelim
  const { data: stealthProperties, error: propError } = await supabase
    .from('properties')
    .select('*')
    .eq('is_stealth', true)
    .eq('status', 'aktif');

  if (propError || !stealthProperties || stealthProperties.length === 0) {
    return renderNoProperties(lang, lead.full_name);
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(lang === 'en' ? 'en-US' : lang === 'ar' ? 'ar-SA' : 'tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <main className={`min-h-screen bg-gray-950 text-gray-100 pt-32 pb-32 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* NOISE OVERLAY */}
      <div className="fixed inset-0 z-[100] pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      <div className="container mx-auto px-6">
        {/* BRAND HEADER */}
        <div className="flex flex-col items-center justify-center text-center mb-16 relative">
          <div className="absolute top-0 w-64 h-64 bg-yellow-600/10 blur-[120px] rounded-full -z-10" />
          <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-[0.4em] mb-4">📢 QUANTUM STEALTH OS ONLINE</span>
          <h1 className="text-4xl md:text-5xl font-serif italic text-white mb-4">
            Gizli & Off-Market Portföy Havuzu
          </h1>
          <p className="text-sm text-gray-400 max-w-xl font-light tracking-wide">
            Sayın <strong className="text-white">{lead.full_name}</strong>, yüksek niyet skorunuz ve VIP alıcı profiliniz doğrulanmıştır. Sizin için hazırladığımız özel portföy eşleşmeleri aşağıda listelenmiştir.
          </p>
          <div className="w-16 h-[2px] bg-yellow-600/30 mt-8" />
        </div>

        {/* PROPERTIES GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {stealthProperties.map((property) => {
            const propertyTitle = lang === 'en' ? (property.title_en || property.title) : lang === 'ar' ? (property.title_ar || property.title) : property.title;
            const propertyDescription = lang === 'en' ? (property.description_en || property.description) : lang === 'ar' ? (property.description_ar || property.description) : property.description;
            
            return (
              <div key={property.id} className="bg-white/[0.02] border border-white/5 rounded-[3rem] overflow-hidden hover:border-yellow-600/20 transition-all duration-500 group flex flex-col justify-between">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-900 border-b border-white/5">
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 to-transparent z-10" />
                  {property.images?.[0] ? (
                    <img 
                      src={property.images[0]} 
                      alt={propertyTitle} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700">🔮 Görsel Yok</div>
                  )}
                  
                  {/* Badge */}
                  <span className="absolute top-6 left-6 z-20 text-[8px] font-bold bg-yellow-600 text-gray-950 px-3 py-1.5 rounded-full uppercase tracking-widest">
                    OFF-MARKET / GİZLİ
                  </span>
                </div>

                <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
                  <div>
                    <h2 className="text-xl font-bold font-serif text-white group-hover:text-yellow-600 transition-colors line-clamp-1">
                      {propertyTitle}
                    </h2>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                      Ankara / {property.district_name || 'Çankaya'}
                    </p>
                    <p className="text-gray-400 text-xs font-light mt-4 line-clamp-3 leading-relaxed">
                      {propertyDescription}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-6">
                    <div>
                      <p className="text-[8px] text-gray-500 uppercase tracking-widest">VIP ÖZEL FİYAT</p>
                      <p className="text-lg font-bold text-white font-serif italic">{formatPrice(property.price)}</p>
                    </div>

                    <Link 
                      href={`/${lang}/portfoy/${property.district_name?.toLowerCase() || 'cankaya'}/${property.type === 'Satılık' ? 'satilik' : 'kiralik'}/${property.id}`}
                      className="bg-white/5 border border-white/10 hover:bg-yellow-600 hover:text-gray-950 text-white text-[10px] font-bold px-6 py-3.5 rounded-xl transition-all uppercase tracking-widest"
                    >
                      İncele
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

// 403 Erişim Engellendi Sayfası
function renderAccessDenied(lang: string) {
  const isRtl = lang === 'ar';
  return (
    <main className={`min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center pt-32 pb-32 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <div className="max-w-md w-full mx-6 bg-white/[0.02] border border-white/5 p-12 rounded-[4rem] text-center relative overflow-hidden backdrop-blur-3xl">
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-[80px] rounded-full" />
        <span className="text-4xl block mb-6">🔒</span>
        <h2 className="text-2xl font-serif italic text-white mb-4">Yetkisiz Erişim Koruması</h2>
        <p className="text-sm text-gray-400 leading-relaxed font-light mb-8">
          Bu şifreli bağlantı geçersizdir veya VIP niyet seviyesi doğrulaması başarısız olmuştur. Gizli portföy erişimi için lütfen özel gayrimenkul danışmanınızla görüşerek niyet skorunuzu güncelleyin.
        </p>
        <Link href={`/${lang}`} className="w-full inline-block bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all uppercase tracking-widest text-[10px]">
          Ana Sayfaya Dön
        </Link>
      </div>
    </main>
  );
}

// Boş Portföy Sayfası
function renderNoProperties(lang: string, name: string) {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center pt-32 pb-32">
      <div className="max-w-md w-full mx-6 bg-white/[0.02] border border-white/5 p-12 rounded-[4rem] text-center relative backdrop-blur-3xl">
        <span className="text-4xl block mb-6">🔮</span>
        <h2 className="text-2xl font-serif italic text-white mb-4">Eşleşme Bulunamadı</h2>
        <p className="text-sm text-gray-400 leading-relaxed font-light mb-8">
          Sayın <strong className="text-white">{name}</strong>, VIP niyet seviyeniz başarıyla onaylanmıştır. Ancak şu anda kriterlerinize uyan aktif bir stealth (off-market) portföyümüz bulunmamaktadır. Danışmanlarımız sizin için özel araştırmaya devam etmektedir.
        </p>
        <Link href={`/${lang}`} className="w-full inline-block bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-4 rounded-xl transition-all uppercase tracking-widest text-[10px]">
          Ana Sayfaya Dön
        </Link>
      </div>
    </main>
  );
}
