'use client';

import React from 'react';
import Link from 'next/link';

interface District {
  id: string;
  name: string;
  slug: string;
  activeCount: number;
}

export default function RegionCatalogue({ districts, dict, lang, isRtl }: { districts: District[], dict: any, lang: string, isRtl: boolean }) {
  // Eğer veri yoksa boş kutu göstermek yerine kullanıcıyı bilgilendiren lüks bir placeholder
  if (!districts || districts.length === 0) {
    return (
      <div className="py-20 text-center border border-dashed border-white/10 rounded-[3rem]">
        <p className="text-gray-500 font-serif italic text-xl">Aktif portföy verileri yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
      {districts.map((dist) => (
        <Link 
          key={dist.id} 
          href={`/${lang}/portfoy/${dist.slug}/satilik`} 
          className="group relative h-[600px] rounded-[4rem] overflow-hidden glass-opal transition-all duration-700 hover:scale-[1.02] block"
        >
          {/* BACKGROUND IMAGE: Breathing Effect */}
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-gray-950/10 via-transparent to-gray-950/80 z-10" />
            <img 
              src={`/regions/${dist.slug}.jpg`} 
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1200';
              }}
              alt={dist.name} 
              className="w-full h-full object-cover transition-all duration-[3000ms] group-hover:scale-110 animate-breathing opacity-60 group-hover:opacity-90"
            />
          </div>

          {/* GLASS OVERLAY (Opal Layer) */}
          <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-white/[0.02] backdrop-blur-[2px]" />

          {/* CONTENT: Vitrin Estetiği */}
          <div className="absolute inset-0 z-20 p-12 flex flex-col justify-between">
            <div className={`flex justify-between items-start ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="flex flex-col">
                <span className="text-[10px] font-sans font-bold uppercase tracking-[0.4em] text-white/40 mb-2">
                  District
                </span>
                <span className="w-8 h-[1px] bg-white/20" />
              </div>
              <div className="bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                <span className="text-[9px] font-sans font-bold uppercase tracking-[0.2em] text-white/80">
                  {dist.activeCount} {dict.home.catalog.activePortfolio}
                </span>
              </div>
            </div>

            <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
              <h3 className="text-5xl font-serif text-white mb-4 leading-tight tracking-tight text-reveal">
                {dist.name}
              </h3>
              <p className="text-[9px] font-sans font-medium uppercase tracking-[0.6em] text-white/30 group-hover:text-white/60 transition-colors duration-500">
                {isRtl ? 'عرض المجموعة' : 'Explore Collection'}
              </p>
            </div>
          </div>

          {/* BORDER GLOW */}
          <div className="absolute inset-0 border border-white/5 group-hover:border-white/20 transition-colors duration-700 rounded-[4rem] pointer-events-none" />
        </Link>
      ))}
    </div>
  );
}
