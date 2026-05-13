'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';

export default function PortfoyClient({ properties, districts, dict, lang }: { properties: any[], districts: any[], dict: any, lang: string }) {
  const [filterIlce, setFilterIlce] = useState('');
  const [filterTip, setFilterTip] = useState('');

  const isRtl = lang === 'ar';

  // Gerçek Veri Filtreleme (UUID Uyumu)
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      // p.district_id artık bir UUID'dir
      if (filterIlce && p.district_id !== filterIlce) return false;
      if (filterTip && p.type.toLowerCase() !== filterTip.toLowerCase()) return false;
      return true;
    });
  }, [properties, filterIlce, filterTip]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(lang === 'en' ? 'en-US' : lang === 'ar' ? 'ar-SA' : 'tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className={`pt-32 pb-20 bg-gray-950 min-h-screen ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-6">
        {/* HEADER & FILTERS */}
        <div className={`flex flex-col md:flex-row justify-between items-end mb-16 gap-8 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
          <div className={isRtl ? 'text-right' : 'text-left'}>
            <span className="text-yellow-600 text-xs font-bold tracking-widest uppercase mb-4 block animate-in fade-in slide-in-from-bottom-2">
              {dict.badge || 'Lüks Portföyümüz'}
            </span>
            <h1 className="text-5xl md:text-7xl mb-4 font-serif text-white leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700" dangerouslySetInnerHTML={{ __html: dict.title || 'Seçkin Portföy' }}></h1>
            <p className="text-gray-400 max-w-xl text-lg animate-in fade-in slide-in-from-bottom-6 duration-1000">{dict.description}</p>
          </div>
          
          <div className="bg-white/5 border border-white/10 p-4 rounded-[2rem] flex flex-wrap gap-4 backdrop-blur-2xl shadow-2xl">
            <select 
              value={filterIlce} 
              onChange={(e) => setFilterIlce(e.target.value)}
              className={`bg-gray-900 border border-white/10 text-white rounded-xl px-6 py-3 outline-none focus:border-yellow-600 transition-all cursor-pointer ${isRtl ? 'text-right pl-8' : ''}`}
            >
              <option value="">{dict.allRegions || 'Tüm Bölgeler'}</option>
              {districts.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <select 
              value={filterTip} 
              onChange={(e) => setFilterTip(e.target.value)}
              className={`bg-gray-900 border border-white/10 text-white rounded-xl px-6 py-3 outline-none focus:border-yellow-600 transition-all cursor-pointer ${isRtl ? 'text-right pl-8' : ''}`}
            >
              <option value="">{dict.allTypes || 'İşlem Tipi'}</option>
              <option value="satılık">Satılık</option>
              <option value="kiralık">Kiralık</option>
            </select>
          </div>
        </div>

        {/* PROPERTY GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {filteredProperties.length === 0 ? (
            <div className="col-span-full py-40 text-center text-gray-500 glass-opal rounded-[3rem] border border-dashed border-white/10">
              <div className="text-6xl mb-6">🏘️</div>
              <p className="text-2xl font-serif italic mb-6">{dict.notFound || 'Aranan kriterlerde ilan bulunamadı.'}</p>
              <button 
                onClick={() => {setFilterIlce(''); setFilterTip('');}} 
                className="text-yellow-600 font-bold uppercase tracking-widest text-[10px] hover:text-yellow-500 transition-colors"
              >
                {dict.clearFilters || 'Filtreleri Temizle'}
              </button>
            </div>
          ) : (
            filteredProperties.map((item) => {
              const districtObj = districts.find(d => d.id === item.district_id);
              const districtName = districtObj?.name || 'Belirtilmedi';
              const districtSlug = districtObj?.slug || 'ankara';
              
              const islemSlug = item.type.toLowerCase() === 'satılık' ? 'satilik' : 'kiralik';
              const detailUrl = `/${lang}/portfoy/${districtSlug}/${islemSlug}/${item.id}`;

              return (
                <Link 
                  href={detailUrl} 
                  key={item.id} 
                  className={`group glass-opal rounded-[3rem] overflow-hidden hover:scale-[1.02] transition-all duration-700 block shadow-2xl ${isRtl ? 'text-right' : 'text-left'}`}
                >
                  <div className="aspect-[4/3] bg-gray-900 relative overflow-hidden">
                    <img 
                      src={item.images?.[0] || "/hero-bg.png"} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-all duration-[3000ms] group-hover:scale-110 opacity-70 group-hover:opacity-100 animate-breathing"
                    />
                    <div className={`absolute top-6 ${isRtl ? 'right-6' : 'left-6'} z-10 bg-white/10 backdrop-blur-md border border-white/10 text-white px-5 py-2 text-[9px] font-bold uppercase rounded-full shadow-2xl tracking-[0.2em]`}>
                      {item.type}
                    </div>
                  </div>
                  <div className="p-10 relative">
                    {/* Inner Glass Glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.01] to-white/[0.03] pointer-events-none" />
                    
                    <div className="text-yellow-600 text-[9px] font-bold uppercase tracking-[0.4em] mb-4">
                      {districtName}
                    </div>
                    <h3 className="text-2xl font-serif mb-4 group-hover:text-yellow-500 transition-colors text-white line-clamp-1 italic">
                      {item.title}
                    </h3>
                    <div className="text-3xl font-bold text-white mb-8 font-serif tracking-tighter">
                      {formatPrice(item.price)}
                    </div>
                    
                    <div className={`flex gap-8 text-[9px] text-white/40 border-t border-white/5 pt-8 font-sans font-bold uppercase tracking-[0.3em] ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <div className="flex items-center gap-2 group-hover:text-white transition-colors">
                        <span className="text-yellow-600/30">🛏️</span> {item.rooms}
                      </div>
                      <div className="flex items-center gap-2 group-hover:text-white transition-colors">
                        <span className="text-yellow-600/30">📐</span> {item.sqm} M²
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
