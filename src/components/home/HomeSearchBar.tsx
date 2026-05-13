'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomeSearchBar({ districts, dict, lang, isRtl }: { districts: any[], dict: any, lang: string, isRtl: boolean }) {
  const [district, setDistrict] = useState('');
  const [type, setType] = useState('');
  const router = useRouter();

  const handleSearch = () => {
    const d = district || 'ankara';
    const t = type || 'satilik';
    router.push(`/${lang}/portfoy/${d}/${t}`);
  };

  return (
    <div className="max-w-4xl mx-auto glass-opal p-2 rounded-[2.5rem] flex flex-col md:flex-row gap-2 shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
      <div className="flex-1 flex items-center px-6 group">
        <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-white/20 group-focus-within:text-white/60 transition-colors">Loc:</span>
        <select 
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className={`w-full bg-transparent border-none p-4 outline-none text-white font-sans text-sm font-medium cursor-pointer ${isRtl ? 'text-right pr-4' : ''}`}
        >
          <option value="" className="bg-gray-950">{dict.home.search.region}</option>
          {districts.map(d => (
            <option key={d.id} value={d.slug} className="bg-gray-950">{d.name}</option>
          ))}
        </select>
      </div>
      <div className="hidden md:block w-px h-10 bg-white/5 self-center" />
      <div className="flex-1 flex items-center px-6 group">
        <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-white/20 group-focus-within:text-white/60 transition-colors">Typ:</span>
        <select 
          value={type}
          onChange={(e) => setType(e.target.value)}
          className={`w-full bg-transparent border-none p-4 outline-none text-white font-sans text-sm font-medium cursor-pointer ${isRtl ? 'text-right pr-4' : ''}`}
        >
          <option value="" className="bg-gray-950">{dict.home.search.type}</option>
          <option value="satilik" className="bg-gray-950">{dict.home.search.sale}</option>
          <option value="kiralik" className="bg-gray-950">{dict.home.search.rent}</option>
        </select>
      </div>
      <button 
        onClick={handleSearch}
        className="relative group overflow-hidden bg-white/10 hover:bg-white/20 text-white font-sans text-xs font-bold px-12 py-5 rounded-[2rem] transition-all border border-white/10 hover:border-white/20 tracking-[0.3em] uppercase"
      >
        <span className="relative z-10">{dict.home.search.button}</span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      </button>
    </div>
  );
}
