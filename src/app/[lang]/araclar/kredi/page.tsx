'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function KrediHesaplama() {
  const [amount, setAmount] = useState(2000000);
  const [months, setMonths] = useState(120);
  const [rate, setRate] = useState(3.15);

  const i = rate / 100;
  const monthlyPayment = i > 0 
    ? (amount * i * Math.pow(1 + i, months)) / (Math.pow(1 + i, months) - 1)
    : amount / months;
  const totalPayment = monthlyPayment * months;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 font-sans pb-32 pt-40 selection:bg-yellow-600/30">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mb-16 text-white">
          <span className="text-yellow-500 text-xs font-bold tracking-[0.4em] uppercase mb-4 block">Finansal Çözümler</span>
          <h1 className="text-4xl md:text-7xl font-serif mb-6 leading-tight text-white">Konut Kredisi <br /><span className="italic text-yellow-500 text-white">Planlama Aracı.</span></h1>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-12 bg-white/5 border border-white/10 p-8 md:p-12 rounded-[2.5rem] backdrop-blur-2xl">
            <div className="space-y-6">
              <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Kredi Tutarı</label>
              <input type="range" min="100000" max="25000000" step="100000" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-yellow-600" />
              <div className="text-3xl font-bold text-white font-serif">{formatCurrency(amount)}</div>
            </div>
            <div className="space-y-6">
              <label className="text-xs uppercase tracking-widest text-gray-500 font-bold">Vade (Ay)</label>
              <input type="range" min="12" max="240" step="12" value={months} onChange={(e) => setMonths(Number(e.target.value))} className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-yellow-600" />
              <div className="text-3xl font-bold text-white">{months} Ay</div>
            </div>
          </div>
          <div className="space-y-8">
            <div className="bg-yellow-600 p-12 rounded-[2.5rem] shadow-2xl">
              <p className="text-gray-950/70 uppercase tracking-widest text-xs font-bold mb-4">Tahmini Aylık Taksit</p>
              <div className="text-5xl md:text-7xl font-serif font-bold text-gray-950">{formatCurrency(monthlyPayment)}</div>
            </div>
            <Link href="/iletisim" className="block w-full bg-white/5 border border-white/10 hover:border-yellow-600 text-white py-6 rounded-2xl text-center font-bold text-lg transition-all">Özel Kredi Tekliflerini Al →</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
