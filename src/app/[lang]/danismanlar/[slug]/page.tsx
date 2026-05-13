import React from 'react';
import { getAdvisorBySlug } from '@/lib/api';
import { notFound } from 'next/navigation';
import { getDictionary, Locale } from '@/getDictionary';
import { Metadata } from 'next';
import Link from 'next/link';

export async function generateMetadata({ params }: { params: Promise<{ lang: Locale, slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const advisor = await getAdvisorBySlug(slug);
  if (!advisor) return { title: 'Danışman Bulunamadı' };
  
  return {
    title: `${advisor.name} | ${advisor.title} - Kaynak Gayrimenkul`,
    description: `${advisor.name} Ankara lüks konut ve yatırım uzmanı olarak hizmet vermektedir.`,
  };
}

export default async function AdvisorDetailPage({ params }: { params: Promise<{ lang: Locale, slug: string }> }) {
  const { lang, slug } = await params;
  const advisor = await getAdvisorBySlug(slug);
  if (!advisor) notFound();
  
  const isRtl = lang === 'ar';

  return (
    <main className={`min-h-screen bg-gray-950 text-gray-100 pt-32 pb-20 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-6">
        <Link href={`/${lang}/danismanlar`} className={`text-gray-500 hover:text-yellow-500 text-sm font-bold uppercase tracking-widest mb-12 flex items-center gap-2 transition-colors ${isRtl ? 'flex-row-reverse w-full justify-start' : ''}`}>
           {isRtl ? '→' : '←'} Tüm Danışmanlar
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          {/* Sol: Fotoğraf */}
          <div className="lg:col-span-4">
            <div className="aspect-[3/4] rounded-[3rem] overflow-hidden border border-white/10 relative">
              <img src={advisor.image_url} alt={advisor.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 to-transparent"></div>
            </div>
            
            <div className="mt-8 space-y-4">
              <a href={`tel:${advisor.phone}`} className="w-full bg-white/5 border border-white/10 hover:border-yellow-600/50 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold transition-all">
                <span>📞</span> Hemen Ara
              </a>
              <a href={`https://wa.me/${advisor.whatsapp}`} target="_blank" className="w-full bg-green-600/20 border border-green-600/30 hover:bg-green-600/30 py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-green-500 transition-all">
                <span>💬</span> WhatsApp'tan Yaz
              </a>
            </div>
          </div>

          {/* Sağ: Bilgiler */}
          <div className="lg:col-span-8">
            <span className="text-yellow-600 text-sm font-bold uppercase tracking-[0.4em] mb-4 block">{advisor.title}</span>
            <h1 className="text-5xl md:text-8xl font-serif mb-8 text-white">{advisor.name}</h1>
            
            <div className="flex flex-wrap gap-3 mb-12">
              {advisor.expertise.map((exp: string) => (
                <span key={exp} className="bg-yellow-600/10 border border-yellow-600/30 px-6 py-2 rounded-full text-yellow-500 text-sm font-bold uppercase tracking-wider">
                  📍 {exp}
                </span>
              ))}
            </div>

            <div className="prose prose-invert max-w-none mb-16">
              <p className="text-xl text-gray-400 leading-relaxed font-light">{advisor.bio}</p>
            </div>

            {/* İletişim Formu Card */}
            <div className="bg-gray-900 border border-yellow-600/20 p-10 md:p-16 rounded-[4rem] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-600/5 blur-[100px] rounded-full"></div>
               <h3 className="text-3xl font-serif mb-2 text-white">{advisor.name} ile İletişime Geçin</h3>
               <p className="text-gray-500 mb-10">Mülkünüzün gerçek değerini öğrenmek veya yatırım danışmanlığı almak için formu doldurun.</p>
               
               <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <input type="text" placeholder="Adınız Soyadınız" className="bg-gray-950 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-yellow-600 transition-all" />
                 <input type="tel" placeholder="Telefon Numaranız" className="bg-gray-950 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-yellow-600 transition-all" />
                 <textarea placeholder="Mesajınız..." className="bg-gray-950 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-yellow-600 transition-all md:col-span-2 h-32 resize-none"></textarea>
                 <button className="bg-yellow-600 hover:bg-yellow-500 text-gray-950 font-bold py-5 rounded-2xl text-xl transition-all shadow-2xl md:col-span-2">
                   Talebi Gönder
                 </button>
               </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
