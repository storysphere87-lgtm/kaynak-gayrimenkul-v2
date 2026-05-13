'use client';

import { useState, useEffect } from 'react';
import { Locale } from '@/getDictionary';
import { Calculator, TrendingUp, Wallet, ShieldCheck, History } from 'lucide-react';

interface ROICalculatorClientProps {
  lang: Locale;
  dict: any;
  districts: any[];
}

export default function ROICalculatorClient({ lang, dict, districts }: ROICalculatorClientProps) {
  const [price, setPrice] = useState<number>(5000000);
  const [rent, setRent] = useState<number>(25000);
  const [appreciation, setAppreciation] = useState<number>(30);
  const [period, setPeriod] = useState<number>(10);

  // Results
  const [roi, setRoi] = useState<number>(0);
  const [amortization, setAmortization] = useState<number>(0);
  const [totalValue, setTotalValue] = useState<number>(0);

  useEffect(() => {
    // Amortization (Years)
    const annualRent = rent * 12;
    const amort = price / annualRent;
    setAmortization(amort);

    // Yearly ROI (Rental only)
    const rentalRoi = (annualRent / price) * 100;
    setRoi(rentalRoi);

    // Total Value Projection
    let projectedValue = price;
    for (let i = 0; i < period; i++) {
      projectedValue = projectedValue * (1 + appreciation / 100);
    }
    setTotalValue(projectedValue);
  }, [price, rent, appreciation, period]);

  const isRtl = lang === 'ar';

  return (
    <div className={`pt-32 pb-20 bg-gray-950 min-h-screen text-white ${isRtl ? 'rtl text-right' : 'ltr text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl font-serif mb-6 leading-tight">
            {lang === 'tr' ? 'Gayrimenkul ROI & Amortisman' : lang === 'en' ? 'Real Estate ROI & Amortization' : 'عائد الاستثمار العقاري والتدفق النقدي'}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            {lang === 'tr' 
              ? 'Yatırımınızın gelecekteki değerini ve geri dönüş süresini otonom algoritmalarımızla hesaplayın.' 
              : lang === 'en' 
                ? 'Calculate your investment\'s future value and return period with our autonomous algorithms.' 
                : 'احسب القيمة المستقبلية لاستثمارك وفترة العودة باستخدام خوارزمياتنا المستقلة.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* INPUTS */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-md">
              <h3 className="text-xl font-serif mb-8 flex items-center gap-3">
                <Calculator className="text-yellow-600" size={24} />
                {lang === 'tr' ? 'Yatırım Verileri' : lang === 'en' ? 'Investment Data' : 'بيانات الاستثمار'}
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">{lang === 'tr' ? 'Mülk Değeri (₺)' : lang === 'en' ? 'Property Value (₺)' : 'قيمة العقار (₺)'}</label>
                  <input 
                    type="number" 
                    value={price} 
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-yellow-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">{lang === 'tr' ? 'Aylık Kira Getirisi (₺)' : lang === 'en' ? 'Monthly Rent (₺)' : 'الإيجار الشهري (₺)'}</label>
                  <input 
                    type="number" 
                    value={rent} 
                    onChange={(e) => setRent(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-yellow-600 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">{lang === 'tr' ? 'Yıllık Değer Artış Beklentisi (%)' : lang === 'en' ? 'Expected Annual Appreciation (%)' : 'توقع زيادة القيمة السنوية (%)'}</label>
                  <input 
                    type="number" 
                    value={appreciation} 
                    onChange={(e) => setAppreciation(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-yellow-600 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* RESULTS */}
          <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp size={80} />
                </div>
                <p className="text-gray-400 text-sm mb-2">{lang === 'tr' ? 'Yıllık Kira Getirisi' : lang === 'en' ? 'Annual Rental Yield' : 'عائد الإيجار السنوي'}</p>
                <p className="text-5xl font-serif text-yellow-500">%{roi.toFixed(1)}</p>
              </div>

              <div className="bg-white/5 border border-white/10 p-10 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <History size={80} />
                </div>
                <p className="text-gray-400 text-sm mb-2">{lang === 'tr' ? 'Amortisman Süresi' : lang === 'en' ? 'Amortization Period' : 'فترة الاسترداد'}</p>
                <p className="text-5xl font-serif text-white">{amortization.toFixed(1)} <span className="text-xl">{lang === 'tr' ? 'Yıl' : lang === 'en' ? 'Years' : 'سنوات'}</span></p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-600/20 to-transparent border border-yellow-600/30 p-12 rounded-[3rem] relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl font-serif mb-6 flex items-center gap-3">
                  <ShieldCheck className="text-yellow-500" size={28} />
                  {lang === 'tr' ? '10 Yıllık Projeksiyon' : lang === 'en' ? '10-Year Projection' : 'توقعات 10 سنوات'}
                </h3>
                <div className="flex flex-col md:flex-row md:items-end gap-4">
                  <p className="text-6xl md:text-7xl font-serif text-white">
                    ₺{Math.round(totalValue / 1000000).toLocaleString()}M
                  </p>
                  <p className="text-gray-400 mb-2 md:mb-4 text-lg">
                    {lang === 'tr' ? 'Tahmini mülk değeri' : lang === 'en' ? 'Estimated property value' : 'قيمة العقار المقدرة'}
                  </p>
                </div>
                <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">{lang === 'tr' ? 'Toplam Net Kazanç' : lang === 'en' ? 'Total Net Gain' : 'إجمالي الربح الصافي'}</p>
                    <p className="text-2xl font-serif text-green-400">+₺{Math.round((totalValue - price) / 1000000).toLocaleString()}M</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-4 px-8 rounded-2xl transition-all">
                      {lang === 'tr' ? 'Portföy Önerisi Al' : lang === 'en' ? 'Get Portfolio Advice' : 'احصل على استشارة'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
