'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function KPIDashboardPage({ params }: { params: { lang: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { getAgentKPIsAction } = await import('../actions');
      const res = await getAgentKPIsAction();
      if (res.success && res.data) {
        setKpiData(res.data);
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      setNotification({ message: 'KPI verileri alınamadı: ' + e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pt-24 pb-20">
      {/* NOTIFICATION */}
      {notification && (
        <div className={`fixed top-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl shadow-2xl ${
          notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-3 font-bold">
            <span>{notification.type === 'success' ? '✅' : '❌'}</span>
            {notification.message}
          </div>
        </div>
      )}

      <div className="container mx-auto px-6">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <span className="text-yellow-600 text-xs font-bold uppercase tracking-[0.4em] mb-2 block">Broker Kokpiti</span>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white">Danışman KPI & Risk Analizi</h1>
          </div>
          <button 
            onClick={() => router.push(`/${params.lang}/admin`)}
            className="bg-white/5 border border-white/10 hover:border-yellow-600/50 text-white px-8 py-3 rounded-2xl font-bold transition-all"
          >
            ← Yönetim Paneline Dön
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-xl text-gray-500 font-bold">Analiz yapılıyor, lütfen bekleyin...</div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            
            {/* KPI Table */}
            <div className="bg-gray-900 border border-white/10 rounded-[3rem] p-8 md:p-12 overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-600/5 blur-[100px] rounded-full"></div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-widest font-bold">
                      <th className="pb-6">Danışman</th>
                      <th className="pb-6">Pozisyon</th>
                      <th className="pb-6 text-center">Toplam Müşteri (Lead)</th>
                      <th className="pb-6 text-center">AI Müşteri Kalitesi</th>
                      <th className="pb-6 text-center">Aktif Süreç</th>
                      <th className="pb-6 text-center">Kapatılan Satış</th>
                      <th className="pb-6 text-right">Toplam Ciro (Volume)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {kpiData.map((agent) => (
                      <tr key={agent.id} className="text-sm font-semibold hover:bg-white/[0.02] transition-colors">
                        <td className="py-6 font-bold text-white text-base">{agent.name}</td>
                        <td className="py-6 text-yellow-600 font-bold uppercase tracking-wider text-xs">{agent.title}</td>
                        <td className="py-6 text-center text-gray-300">{agent.totalLeads}</td>
                        <td className="py-6 text-center">
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${
                            agent.averageLeadScore > 75 
                              ? 'bg-green-600/10 border-green-600/30 text-green-500'
                              : agent.averageLeadScore > 40
                              ? 'bg-yellow-600/10 border-yellow-600/30 text-yellow-500'
                              : 'bg-red-600/10 border-red-600/30 text-red-500'
                          }`}>
                            {agent.averageLeadScore}/100
                          </span>
                        </td>
                        <td className="py-6 text-center text-gray-300 font-bold">{agent.activeDeals}</td>
                        <td className="py-6 text-center text-green-500 font-bold text-base">{agent.totalSales}</td>
                        <td className="py-6 text-right text-white font-bold text-base">
                          {agent.totalVolume.toLocaleString('tr-TR')} ₺
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PREDICTIVE RISK / AI WARNINGS CARD */}
            <div className="bg-gray-900 border border-red-600/20 rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] rounded-full"></div>
              <h3 className="text-2xl font-serif text-white mb-6 flex items-center gap-3">
                <span className="animate-pulse">🚨</span> Otonom Risk & Performans Uyarıları
              </h3>
              
              <div className="space-y-6">
                {kpiData.filter(agent => agent.riskWarning).length === 0 ? (
                  <div className="bg-green-600/5 border border-green-600/20 p-6 rounded-2xl text-green-400 font-bold text-sm">
                    ✨ Harika! Şu an ofiste herhangi bir danışman performansı veya operasyon riski tespit edilmedi.
                  </div>
                ) : (
                  kpiData.filter(agent => agent.riskWarning).map(agent => (
                    <div 
                      key={agent.id} 
                      className="bg-red-600/5 border border-red-600/20 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                    >
                      <div>
                        <h4 className="font-bold text-white text-lg mb-1">{agent.name}</h4>
                        <p className="text-gray-400 text-sm font-semibold">{agent.riskWarning}</p>
                      </div>
                      <span className="bg-red-600/20 text-red-500 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider border border-red-600/30">
                        Performans Riski
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
