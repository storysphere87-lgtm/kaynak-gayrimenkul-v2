import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPropertyById, getDistrictData } from '@/lib/api';
import { getDictionary, Locale } from '@/getDictionary';
import ContactForm from '@/components/ContactForm';
import Link from 'next/link';
import Script from 'next/script';
import { siteConfig } from '@/config/site';

export async function generateMetadata(props: { params: Promise<{ lang: string, ilanId: string }> }): Promise<Metadata> {
  const { lang: langParam, ilanId } = await props.params;
  const lang = langParam as Locale;
  const property = await getPropertyById(ilanId);
  const dict = await getDictionary(lang);
  
  if (!property) return { title: 'İlan Bulunamadı' };

  return {
    title: `${property.title} | Kaynak Gayrimenkul`,
    description: property.description_en || property.description, // AI-ready description
  };
}

export default async function PropertyDetailPage(props: { params: Promise<{ lang: string, ilce: string, islem: string, ilanId: string }> }) {
  const { lang: langParam, ilanId } = await props.params;
  const lang = langParam as Locale;
  const property = await getPropertyById(ilanId);
  const dict = await getDictionary(lang);
  const isRtl = lang === 'ar';

  if (!property) notFound();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(lang === 'en' ? 'en-US' : lang === 'ar' ? 'ar-SA' : 'tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(price);
  };

  const propertyDescription = lang === 'en' ? property.description_en : lang === 'ar' ? property.description_ar : property.description;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "name": property.title,
    "description": property.description,
    "url": `${siteConfig.url}/${lang}/portfoy/${property.district_id}/${property.type === 'Satılık' ? 'satilik' : 'kiralik'}/${property.id}`,
    "datePosted": property.created_at,
    "image": property.images?.[0] || `${siteConfig.url}/hero-bg.png`,
    "mainEntity": {
      "@type": "SingleFamilyResidence",
      "name": property.title,
      "numberOfRooms": property.rooms,
      "floorSize": {
        "@type": "QuantitativeValue",
        "value": property.sqm,
        "unitCode": "MTK"
      },
      "address": {
        "@type": "PostalAddress",
        "addressLocality": property.districts?.name || "Ankara",
        "addressRegion": "Ankara",
        "addressCountry": "TR"
      }
    },
    "offers": {
      "@type": "Offer",
      "price": property.price,
      "priceCurrency": "TRY",
      "availability": "https://schema.org/InStock"
    }
  };

  return (
    <main className={`min-h-screen bg-gray-950 text-gray-100 pt-32 pb-32 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <Script
        id="property-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* NOISE OVERLAY */}
      <div className="fixed inset-0 z-[100] pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="container mx-auto px-6">
        {/* BREADCRUMB: MINIMALIST ENGINEER STYLE */}
        <nav className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 mb-12">
          <Link href={`/${lang}`} className="hover:text-yellow-600 transition-colors">OS</Link>
          <span className="w-4 h-[1px] bg-white/10" />
          <Link href={`/${lang}/portfoy`} className="hover:text-yellow-600 transition-colors">Portföy</Link>
          <span className="w-4 h-[1px] bg-white/10" />
          <span className="text-yellow-600/50">{property.districts?.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* LEFT: VISUALS & SPECS (8 COLS) */}
          <div className="lg:col-span-8 space-y-12">
            {/* MAIN IMAGE GALLERY: OPAL GLASS BORDER */}
            <div className="relative aspect-[16/9] rounded-[4rem] overflow-hidden border border-white/5 bg-white/[0.02] shadow-2xl group">
              <img 
                src={property.images?.[0] || "/hero-bg.png"} 
                alt={property.title} 
                className="w-full h-full object-cover transition-transform duration-[5000ms] group-hover:scale-110" 
              />
              <div className="absolute top-10 left-10 bg-black/80 backdrop-blur-xl border border-white/10 px-6 py-2 rounded-full text-[10px] font-bold tracking-widest text-yellow-600 uppercase">
                {property.type}
              </div>
            </div>

            {/* TECHNICAL SPECS: BRUSHED GOLD GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Metrekare', val: `${property.sqm} m²`, icon: '📐' },
                { label: 'Oda Sayısı', val: property.rooms, icon: '🛏️' },
                { label: 'Kat', val: property.floor || 'N/A', icon: '🏢' },
                { label: 'Isınma', val: property.heating || 'Merkezi', icon: '🔥' }
              ].map((spec, i) => (
                <div key={i} className="bg-white/[0.03] border border-white/5 p-8 rounded-[2.5rem] hover:border-yellow-600/20 transition-all group">
                  <span className="text-xl mb-4 block group-hover:scale-125 transition-transform">{spec.icon}</span>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{spec.label}</p>
                  <p className="text-xl font-bold text-white font-serif">{spec.val}</p>
                </div>
              ))}
            </div>

            {/* DESCRIPTION: TYPOGRAPHIC AUTHORITY */}
            <div className="space-y-8 max-w-4xl">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-serif italic text-white">Mülk Detayları</h2>
                <div className="h-[1px] flex-1 bg-white/5" />
                {property.description_en && (
                  <span className="text-[8px] border border-yellow-600/30 text-yellow-600 px-2 py-1 rounded uppercase tracking-tighter">AI Translated</span>
                )}
              </div>
              <div className="text-gray-400 text-lg leading-relaxed font-light tracking-wide whitespace-pre-wrap">
                {propertyDescription}
              </div>
            </div>
          </div>

          {/* RIGHT: PRICING & CONTACT (4 COLS) */}
          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-8">
              {/* PRICE CARD: FLOATING QUARTZ */}
              <div className="bg-white/[0.04] backdrop-blur-[50px] border border-white/10 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-600/10 blur-[80px] rounded-full" />
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.5em] mb-6 font-bold">LİSTE FİYATI</p>
                <div className="text-5xl font-bold text-white font-serif italic mb-8">{formatPrice(property.price)}</div>
                
                <div className="flex flex-col gap-4">
                  <a href={`tel:${siteConfig.contact.phoneUrl}`} className="w-full bg-yellow-600 hover:bg-yellow-500 text-gray-950 font-bold py-5 rounded-2xl text-center transition-all uppercase tracking-widest text-xs">
                    Hemen Arayın
                  </a>
                  <button className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-5 rounded-2xl transition-all uppercase tracking-widest text-[10px]">
                    WhatsApp Katalog İste
                  </button>
                </div>
              </div>

              {/* LEAD FORM: GLASSMORPHISM */}
              <div className="bg-white/[0.02] border border-white/5 p-12 rounded-[4rem] backdrop-blur-3xl">
                <h4 className="text-xl font-serif text-white mb-8 italic">Bilgi Talep Edin</h4>
                <ContactForm 
                  dict={{
                    name: 'Adınız',
                    phone: 'Telefon',
                    message: 'Mesajınız',
                    submit: 'Talebi Gönder',
                    sending: 'İletiliyor...',
                    formSuccess: 'Başarılı',
                    formSuccessSub: 'Uzmanımız dönecektir.'
                  }} 
                  lang={lang} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
