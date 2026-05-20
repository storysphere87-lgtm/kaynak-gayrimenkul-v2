import React from 'react';
import { ShieldAlert, ArrowLeft, Cookie, HelpCircle } from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function CookiePolicyPage({ params }: Props) {
  const { lang } = await params;
  const isTr = lang === 'tr';
  const isAr = lang === 'ar';

  const t = {
    tr: {
      title: "Çerez Politikası",
      subtitle: "Çerezlerin (Cookies) Kullanımı ve Yönetimi Hakkında Bilgi",
      intro: "Kaynak Gayrimenkul olarak, ziyaretçilerimizin kullanıcı deneyimlerini en üst seviyeye çıkarmak amacıyla çerezleri kullanmaktayız. Bu politika, hangi çerezlerin ne amaçla işlendiğini açıklamaktadır.",
      section1Title: "1. Çerez (Cookie) Nedir?",
      section1Desc: "Çerezler, bir web sitesini ziyaret ettiğinizde tarayıcınız aracılığıyla cihazınıza kaydedilen küçük metin dosyalarıdır. Sizi hatırlamak ve bir sonraki ziyaretinizde daha iyi hizmet sunmak amacıyla kullanılır.",
      section2Title: "2. Hangi Çerezleri Kullanıyoruz?",
      section2Desc: "Sistemimiz iki tür çerez kullanmaktadır: 1. Zorunlu Çerezler: Sitenin temel işlevlerini yürütebilmesi için gereklidir. 2. Analitik ve Profil Çerezleri (Quantum OS): Gezdiğiniz lüks portföyleri, bütçe aralıklarınızı ve bölge tercihlerinizi anonim olarak analiz eden çerezlerdir.",
      section3Title: "3. Çerez Tercihlerinizi Nasıl Yönetirsiniz?",
      section3Desc: "Web sitemize giriş yaptığınızda karşınıza çıkan 'Veri & Gizlilik' pop-up paneli üzerinden çerez izinlerinizi dilediğiniz gibi düzenleyebilir veya 'Sadece Zorunlu' seçeneği ile analitik izlemeyi tamamen kapatabilirsiniz.",
      section4Title: "4. Yasal Haklar ve İletişim",
      section4Desc: "Çerezlerin toplanması ve işlenmesi faaliyetleri hakkında merak ettiğiniz tüm detayları öğrenmek ve haklarınızı kullanmak için info@kaynakgayrimenkul.com adresi üzerinden bizimle iletişime geçebilirsiniz.",
      backBtn: "Geri Dön",
    },
    en: {
      title: "Cookie Policy",
      subtitle: "Information on the Use and Management of Cookies",
      intro: "As Kaynak Gayrimenkul, we use cookies to maximize the user experience of our visitors. This policy explains which cookies are processed and for what purpose.",
      section1Title: "1. What is a Cookie?",
      section1Desc: "Cookies are small text files saved to your device through your browser when you visit a website. They are used to remember you and provide better service on your next visit.",
      section2Title: "2. Which Cookies Do We Use?",
      section2Desc: "Our system uses two types of cookies: 1. Mandatory Cookies: Necessary for the website to run its core functions. 2. Analytical and Profile Cookies (Quantum OS): Cookies that anonymously analyze the luxury portfolios you visit, your budget ranges, and region preferences.",
      section3Title: "3. How to Manage Cookie Preferences?",
      section3Desc: "You can arrange your cookie consents as you wish through the 'Data & Privacy' pop-up panel that appears when you enter our website, or completely turn off analytical tracking with the 'Strictly Necessary' option.",
      section4Title: "4. Legal Rights and Contact",
      section4Desc: "You can contact us via info@kaynakgayrimenkul.com to learn all the details you are curious about regarding cookie collection and processing activities, and to exercise your rights.",
      backBtn: "Go Back",
    },
    ar: {
      title: "سياسة ملفات التعريف (Cookies)",
      subtitle: "معلومات حول استخدام وإدارة ملفات تعريف الارتباط",
      intro: "بصفتنا كاينك غايريمنكول، نستخدم ملفات تعريف الارتباط لزيادة تجربة المستخدم لزوارنا إلى أقصى حد. تشرح هذه السياسة ملفات تعريف الارتباط التي تتم معالجتها ولأي غرض.",
      section1Title: "1. ما هو ملف تعريف الارتباط؟",
      section1Desc: "ملفات تعريف الارتباط هي ملفات نصية صغيرة تُحفظ على جهازك من خلال متصفحك عند زيارة موقع ويب. يتم استخدامها لتذكرك وتقديم خدمة أفضل في زيارتك القادمة.",
      section2Title: "2. ما هي ملفات تعريف الارتباط التي نستخدمها؟",
      section2Desc: "يستخدم نظامنا نوعين من ملفات تعريف الارتباط: 1. ملفات تعريف الارتباط الإلزامية: ضرورية ليعمل الموقع بوظائفه الأساسية. 2. ملفات تعريف الارتباط التحليلية وملفات التعريف الشخصية (Quantum OS): ملفات تعريف الارتباط التي تحلل بشكل مجهول المحافظ الفاخرة التي تزورها، ونطاقات ميزانيتك، وتفضيلات المنطقة.",
      section3Title: "3. كيف تدير تفضيلات ملفات تعريف الارتباط؟",
      section3Desc: "يمكنك ترتيب موافقات ملفات تعريف الارتباط الخاصة بك كما تريد من خلال لوحة 'البيانات والخصوصية' المنبثقة التي تظهر عند دخولك إلى موقعنا، أو إيقاف التتبع التحليلي تمامًا باستخدام خيار 'الضروري فقط'.",
      section4Title: "4. الحقوق القانونية والاتصال",
      section4Desc: "يمكنك الاتصال بنا عبر info@kaynakgayrimenkul.com لمعرفة جميع التفاصيل التي تثير فضولك فيما يتعلق بأنشطة جمع ومعالجة ملفات تعريف الارتباط، وممارسة حقوقك.",
      backBtn: "الرجوع للخلف",
    }
  };

  const content = t[lang as 'tr' | 'en' | 'ar'] || t.tr;
  const isRtl = isAr;

  return (
    <main className={`min-h-screen bg-gray-950 text-gray-100 p-6 pt-36 pb-24 relative overflow-hidden ${isRtl ? 'rtl text-right' : 'ltr text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-600/5 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-900/40 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* Back Button */}
        <Link 
          href={`/${lang}`} 
          className={`inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest transition-colors mb-12 ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <ArrowLeft size={14} className={isRtl ? 'rotate-180' : ''} />
          {content.backBtn}
        </Link>

        {/* Header */}
        <div className="mb-16">
          <div className={`flex items-center gap-4 mb-4 ${isRtl ? 'justify-start flex-row-reverse' : ''}`}>
            <div className="p-3 bg-yellow-600/10 border border-yellow-600/30 rounded-2xl text-yellow-500">
              <Cookie size={28} />
            </div>
            <span className="text-yellow-600 text-xs font-bold uppercase tracking-[0.4em]">Quantum OS Cookies</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 italic leading-tight">{content.title}</h1>
          <p className="text-gray-400 font-light text-lg">{content.subtitle}</p>
        </div>

        {/* Main Content Card */}
        <div className="glass-opal border border-white/10 rounded-[3rem] p-8 md:p-16 shadow-[0_40px_100px_rgba(0,0,0,0.7)] space-y-12">
          
          <p className="text-gray-300 leading-relaxed font-light text-base border-b border-white/5 pb-8">
            {content.intro}
          </p>

          <div className="space-y-10">
            <div className="space-y-4">
              <h2 className="text-xl font-serif text-white italic flex items-center gap-3">
                <HelpCircle size={18} className="text-yellow-600" />
                {content.section1Title}
              </h2>
              <p className="text-gray-400 leading-relaxed font-light text-sm pl-0">
                {content.section1Desc}
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-serif text-white italic flex items-center gap-3">
                <Cookie size={18} className="text-yellow-600" />
                {content.section2Title}
              </h2>
              <p className="text-gray-400 leading-relaxed font-light text-sm pl-0">
                {content.section2Desc}
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-serif text-white italic flex items-center gap-3">
                <ShieldAlert size={18} className="text-yellow-600" />
                {content.section3Title}
              </h2>
              <p className="text-gray-400 leading-relaxed font-light text-sm pl-0">
                {content.section3Desc}
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-serif text-white italic flex items-center gap-3">
                <HelpCircle size={18} className="text-yellow-600" />
                {content.section4Title}
              </h2>
              <p className="text-gray-400 leading-relaxed font-light text-sm pl-0">
                {content.section4Desc}
              </p>
            </div>
          </div>
          
        </div>

      </div>
    </main>
  );
}
