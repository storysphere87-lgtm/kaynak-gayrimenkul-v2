import React from 'react';
import { ShieldCheck, ArrowLeft, FileText, Scale } from 'lucide-react';
import Link from 'next/link';

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function KvkkPage({ params }: Props) {
  const { lang } = await params;
  const isTr = lang === 'tr';
  const isAr = lang === 'ar';

  const t = {
    tr: {
      title: "KVKK Aydınlatma Metni",
      subtitle: "Kişisel Verilerin Korunması Kanunu Kapsamında Bilgilendirme",
      intro: "Kaynak Gayrimenkul olarak, kişisel verilerinizin güvenliği ve gizliliğine azami önem vermekteyiz. Bu kapsamda, Quantum OS akıllı analitik altyapımızı kullanırken işlenen verileriniz hakkında sizleri bilgilendirmek isteriz.",
      section1Title: "1. Veri Sorumlusu",
      section1Desc: "6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla 'Kaynak Gayrimenkul' tarafından aşağıda açıklanan kapsamda işlenebilecektir.",
      section2Title: "2. Kişisel Verilerin İşlenme Amacı",
      section2Desc: "Web sitemizdeki dijital ayak iziniz (ziyaret edilen ilanlar, tercih edilen bölgeler ve bütçe yoğunluğu), yalnızca size en uygun lüks gayrimenkul önerilerini sunabilmek, AI lead skorlama mekanizmasıyla hizmet kalitemizi artırmak ve taleplerinize doğru çözümler üretebilmek amacıyla işlenmektedir.",
      section3Title: "3. İşlenen Kişisel Verileriniz",
      section3Desc: "Hizmetlerimizi kullanırken sağladığınız Ad-Soyad, Telefon, E-posta bilgileriniz ile rızanız dahilinde toplanan anonim gezinme verileriniz (localStorage profilleme verileri) işleme faaliyetine tabidir.",
      section4Title: "4. Haklarınız",
      section4Desc: "KVKK'nın 11. maddesi uyarınca; verilerinizin işlenip işlenmediğini öğrenme, işlenmişse bilgi talep etme, işlenme amacına uygun kullanılıp kullanılmadığını öğrenme ve verilerin silinmesini veya düzeltilmesini talep etme hakkına sahipsiniz.",
      backBtn: "Geri Dön",
    },
    en: {
      title: "Clarification Text on PDPL",
      subtitle: "Information Under the Personal Data Protection Law",
      intro: "As Kaynak Gayrimenkul, we attach maximum importance to the security and privacy of your personal data. In this context, we would like to inform you about your data processed while using our Quantum OS smart analytical infrastructure.",
      section1Title: "1. Data Controller",
      section1Desc: "In accordance with the Personal Data Protection Law No. 6698 (PDPL), your personal data may be processed by 'Kaynak Gayrimenkul' as the data controller within the scope described below.",
      section2Title: "2. Purpose of Processing Personal Data",
      section2Desc: "Your digital footprint on our website (visited listings, preferred regions, and budget density) is processed solely to offer you the most suitable luxury real estate recommendations, increase our service quality through the AI lead scoring mechanism, and generate correct solutions for your requests.",
      section3Title: "3. Your Processed Personal Data",
      section3Desc: "Your Name-Surname, Phone, E-mail information provided while using our services, and your anonymous navigation data (localStorage profiling data) collected with your consent are subject to processing.",
      section4Title: "4. Your Rights",
      section4Desc: "Pursuant to Article 11 of the PDPL, you have the right to learn whether your data is processed, request information if processed, learn whether it is used in accordance with the purpose of processing, and request the deletion or correction of data.",
      backBtn: "Go Back",
    },
    ar: {
      title: "نص توضيحي بشأن حماية البيانات الشخصية",
      subtitle: "معلومات بموجب قانون حماية البيانات الشخصية",
      intro: "بصفتنا كاينك غايريمنكول، نولي أقصى درجات الأهمية لأمن وخصوصية بياناتك الشخصية. في هذا السياق، نود إعلامك ببياناتك التي يتم معالجتها أثناء استخدام البنية التحتية التحليلية الذكية لنظام كوانتوم.",
      section1Title: "1. مراقب البيانات",
      section1Desc: "وفقًا لقانون حماية البيانات الشخصية رقم 6698 (KVKK)، يجوز معالجة بياناتك الشخصية من قبل 'Kaynak Gayrimenkul' بصفته مراقب البيانات في النطاق الموضح أدناه.",
      section2Title: "2. الغرض من معالجة البيانات الشخصية",
      section2Desc: "يتم معالجة بصمتك الرقمية على موقعنا الإلكتروني (العقارات التي تمت زيارتها، والمناطق المفضلة، وكثافة الميزانية) فقط لتقديم أنسب التوصيات العقارية الفاخرة لك، وزيادة جودة خدمتنا من خلال آلية تسجيل عملاء الذكاء الاصطناعي، وإنشاء حلول صحيحة لطلباتك.",
      section3Title: "3. بياناتك الشخصية التي تمت معالجتها",
      section3Desc: "تخضع معلومات الاسم واللقب والهاتف والبريد الإلكتروني المقدمة أثناء استخدام خدماتنا، وبيانات التنقل المجهولة (بيانات ملف تعريف localStorage) التي تم جمعها بموافقتك، للمعالجة.",
      section4Title: "4. حقوقك",
      section4Desc: "بموجب المادة 11 من قانون حماية البيانات الشخصية؛ لديك الحق في معرفة ما إذا كانت بياناتك تتم معالجتها، وطلب المعلومات في حالة معالجتها، ومعرفة ما إذا كانت تُستخدم وفقًا لغرض المعالجة، وطلب حذف البيانات أو تصحيحها.",
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
              <ShieldCheck size={28} />
            </div>
            <span className="text-yellow-600 text-xs font-bold uppercase tracking-[0.4em]">Quantum OS Security</span>
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
                <Scale size={18} className="text-yellow-600" />
                {content.section1Title}
              </h2>
              <p className="text-gray-400 leading-relaxed font-light text-sm pl-0">
                {content.section1Desc}
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-serif text-white italic flex items-center gap-3">
                <FileText size={18} className="text-yellow-600" />
                {content.section2Title}
              </h2>
              <p className="text-gray-400 leading-relaxed font-light text-sm pl-0">
                {content.section2Desc}
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-serif text-white italic flex items-center gap-3">
                <ShieldCheck size={18} className="text-yellow-600" />
                {content.section3Title}
              </h2>
              <p className="text-gray-400 leading-relaxed font-light text-sm pl-0">
                {content.section3Desc}
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-serif text-white italic flex items-center gap-3">
                <Scale size={18} className="text-yellow-600" />
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
