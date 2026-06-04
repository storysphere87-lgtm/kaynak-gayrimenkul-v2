'use client';

import React from 'react';
import { TrendingUp, Activity, BarChart2 } from 'lucide-react';

interface MarketTrendsProps {
  trends: any[];
  dict: any;
  lang: string;
  isRtl: boolean;
}

export default function MarketTrends({ trends, dict, lang, isRtl }: MarketTrendsProps) {
  if (!trends || trends.length === 0) return null;

  return (
    <section className="py-32 border-y border-white/5 bg-gray-950 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[500px] bg-yellow-600/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className={`flex flex-col md:flex-row justify-between items-end mb-20 gap-8 ${isRtl ? 'md:flex-row-reverse text-right' : 'text-left'}`}>
          <div className="max-w-2xl">
            <span className="text-yellow-600 text-xs font-bold tracking-[0.4em] uppercase mb-4 block">
              Quantum OS Data
            </span>
            <h2 className="text-5xl md:text-6xl font-serif text-white leading-tight mb-6 italic">
              {lang === 'tr' ? 'Piyasa Dinamikleri' : lang === 'en' ? 'Market Dynamics' : 'ديناميكيات السوق'}
            </h2>
            <p className="text-gray-400 text-lg font-light tracking-wide">
              {lang === 'tr' 
                ? 'Yapay zeka destekli veri analiz motorumuzun Ankara gayrimenkul piyasasına ait güncel öngörüleri.' 
                : lang === 'en' 
                  ? 'Real-time insights from our AI-powered data engine for the Ankara real estate market.'
                  : 'رؤى فورية من محرك بيانات الذكاء الاصطناعي لسوق العقارات في أنقرة.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trends.map((trend, i) => (
            <div key={trend.id || i} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-yellow-600/30 transition-all duration-500 group relative flex flex-col justify-between overflow-hidden">
              {/* Inner highlight */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className={`flex justify-between items-start mb-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-white/5 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                  {trend.trend_direction === 'up' ? <TrendingUp className="text-green-500" /> : 
                   trend.trend_direction === 'down' ? <Activity className="text-red-500" /> : 
                   <BarChart2 className="text-yellow-500" />}
                </div>
                <div className={`text-right ${isRtl ? 'text-left' : ''}`}>
                  <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold block mb-1">
                    {lang === 'tr' ? 'Bölge' : lang === 'en' ? 'Region' : 'منطقة'}
                  </span>
                  <span className="text-white font-serif text-xl">{trend.district}</span>
                </div>
              </div>

              <div className={`space-y-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                    {lang === 'tr' ? 'Ort. m² Fiyatı' : lang === 'en' ? 'Avg. sqm Price' : 'متوسط سعر المتر'}
                  </span>
                  <span className="text-white font-mono text-lg font-bold">
                    ₺{trend.avg_sqm_price?.toLocaleString('tr-TR')}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                    {lang === 'tr' ? 'Aylık Değişim' : lang === 'en' ? 'Monthly Change' : 'التغيير الشهري'}
                  </span>
                  <span className={`font-mono text-lg font-bold ${trend.price_change_percentage > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {trend.price_change_percentage > 0 ? '+' : ''}{trend.price_change_percentage}%
                  </span>
                </div>
              </div>

              {trend.analysis_note && (
                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className={`text-gray-400 text-sm leading-relaxed font-light ${isRtl ? 'text-right' : 'text-left'}`}>
                    <span className="text-yellow-600 font-bold mr-2">AI NOTE:</span> 
                    {trend.analysis_note}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
