import { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import ContactForm from '@/components/ContactForm';
import { getDictionary, Locale } from '@/getDictionary';

export async function generateMetadata({ params: { lang } }: { params: { lang: Locale } }): Promise<Metadata> {
  const dict = await getDictionary(lang);
  return {
    title: `${dict.nav.contact} | Kaynak Gayrimenkul`,
    description: 'Ankara lüks gayrimenkul ofisimizle iletişime geçin. Mülkünüz için hemen ücretsiz ekspertiz talebinde bulunun.',
  };
}

export default async function IletisimPage({ params: { lang } }: { params: { lang: Locale } }) {
  const isRtl = lang === 'ar';
  const dict = await getDictionary(lang);

  // Form bileşeni için dil verilerini hazırlıyoruz
  const formDict = {
    name: dict.contactPage.name,
    phone: dict.contactPage.phone,
    email: dict.contactPage.email,
    message: dict.contactPage.message,
    submit: dict.contactPage.submit,
    sending: dict.contactPage.sending,
    namePlaceholder: dict.contactPage.namePlaceholder,
    emailPlaceholder: dict.contactPage.emailPlaceholder,
    messagePlaceholder: dict.contactPage.messagePlaceholder,
    formSuccess: dict.contactPage.formSuccess,
    formSuccessSub: dict.contactPage.formSuccessSub,
    newMsg: dict.contactPage.newMsg || 'Yeni Mesaj'
  };

  return (
    <div className={`pt-32 pb-20 bg-gray-950 min-h-screen text-white ${isRtl ? 'rtl text-right' : 'ltr text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-6 max-w-7xl">
        
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-5xl md:text-7xl font-serif mb-6"><span className="text-yellow-500 italic">{dict.nav.contact}</span> {isRtl ? 'مرکز' : 'Merkezi'}</h1>
          <p className="text-gray-400 max-w-xl mx-auto text-lg">{dict.contactPage.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          
          {/* SOL: BİLGİLER VE FORM */}
          <div className="bg-white/5 border border-white/10 p-10 md:p-14 rounded-[3rem] backdrop-blur-md">
            <h3 className="text-3xl font-serif mb-8">{isRtl ? 'خط مباشر' : lang === 'en' ? 'Direct Line' : 'Doğrudan Hat'} <span className="text-yellow-500">.</span></h3>
            
            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-4 text-gray-300 hover:text-yellow-500 transition-colors">
                <span className="text-2xl">📞</span>
                <a href={`tel:${siteConfig.contact.phoneUrl}`} className="text-xl font-bold font-serif tracking-wider">{siteConfig.contact.phone}</a>
              </div>
              <div className="flex items-center gap-4 text-gray-300 hover:text-yellow-500 transition-colors">
                <span className="text-2xl">✉️</span>
                <a href={`mailto:${siteConfig.contact.email}`} className="text-lg">{siteConfig.contact.email}</a>
              </div>
              <div className="flex items-center gap-4 text-gray-300">
                <span className="text-2xl">📍</span>
                <span className="text-lg leading-relaxed">{siteConfig.contact.address}</span>
              </div>
            </div>

            <div className="border-t border-white/10 pt-10">
              <h4 className="text-sm font-bold text-yellow-600 uppercase tracking-widest mb-6">{dict.contactPage.formTitle}</h4>
              <ContactForm dict={formDict} lang={lang} />
            </div>
          </div>

          {/* SAĞ: KARANLIK GOOGLE MAPS */}
          <div className="bg-gray-900 rounded-[3rem] overflow-hidden border border-white/10 h-[500px] lg:h-auto relative group shadow-2xl">
            {/* CSS Invert Trick for Dark Map */}
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d195884.30043125697!2d32.61054350170464!3d39.90355566601438!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14d347d52073281d%3A0x7b3f61bf1afa48ba!2s%C3%87ankaya%2FAnkara!5e0!3m2!1str!2str!4v1715000000000!5m2!1str!2str" 
              width="100%" 
              height="100%" 
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) opacity(0.8)' }} 
              allowFullScreen={false} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 transition-all duration-1000 group-hover:scale-105"
            ></iframe>
            <div className="absolute top-8 right-8 bg-black/80 backdrop-blur-md text-yellow-500 text-[10px] font-bold uppercase tracking-widest px-5 py-2 rounded-full border border-yellow-500/30 shadow-2xl">
              {isRtl ? 'المكتب الرئيسي' : lang === 'en' ? 'Head Office' : 'Merkez Ofis'}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
