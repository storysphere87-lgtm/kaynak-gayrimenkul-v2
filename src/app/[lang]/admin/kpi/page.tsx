'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { BarChart3, TrendingUp, ShieldAlert, CheckCircle2, UserCheck } from 'lucide-react';

export default function KPIDashboardPage({ params }: { params: { lang: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'agent' | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push(`/${params.lang}/admin/login`);
        return;
      }

      const role = session.user.user_metadata?.role;
      setUserRole(role);
      setCurrentUserId(session.user.id);

      const { getAgentKPIsAction } = await import('../actions');
      const res = await getAgentKPIsAction();
      
      if (res.success && res.data) {
        // Raporlama filtresini uygulayalım (RBAC koruması)
        if (role === 'agent') {
          // Danışman sadece kendi KPI verisini görsün
          const myKPI = res.data.filter((a: any) => a.id === session.user.id);
          setKpiData(myKPI);
        } else {
          // Yönetici tüm listeyi görsün
          setKpiData(res.data);
        }
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
            <span className="text-yellow-600 text-xs font-bold uppercase tracking-[0.4em] mb-2 block">
              {userRole === 'admin' ? 'Broker Kokpiti' : 'Danışman Performans Paneli'}
            </span>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white flex items-center gap-3">
              <BarChart3 className="text-yellow-500" size={32} />
              {userRole === 'admin' ? 'Danışman KPI & Risk Analizi' : 'Kişisel Performans Analizim'}
            </h1>
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
            
            {/* KPI TABLE / CARD */}
            <div className="bg-gray-900 border border-white/10 rounded-[3rem] p-8 md:p-12 overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-600/5 blur-[100px] rounded-full"></div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-500 text-xs uppercase tracking-widest font-bold">
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
                    {kpiData.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500 italic text-xs">Hesaplanmış performans kaydınız bulunmuyor.</td>
                      </tr>
                    ) : (
                      kpiData.map((agent) => (
                        <tr key={agent.id} className="text-sm font-semibold hover:bg-white/[0.02] transition-colors">
                          <td className="py-6 font-bold text-white text-base flex items-center gap-2">
                            <UserCheck size={18} className="text-yellow-500" />
                            {agent.name}
                          </td>
                          <td className="py-6 text-yellow-600 font-bold uppercase tracking-wider text-[10px]">{agent.title}</td>
                          <td className="py-6 text-center text-gray-300 font-mono">{agent.totalLeads}</td>
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
                          <td className="py-6 text-center text-gray-300 font-bold font-mono">{agent.activeDeals}</td>
                          <td className="py-6 text-center text-green-500 font-bold text-base font-mono">{agent.totalSales}</td>
                          <td className="py-6 text-right text-white font-bold text-base font-mono">
                            {Number(agent.totalVolume).toLocaleString('tr-TR')} ₺
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PREDICTIVE RISK / AI WARNINGS CARD (SADECE YÖNETİCİLER / BROKER GÖREBİLİR!) */}
            {userRole === 'admin' && (
              <div className="bg-gray-900 border border-red-600/20 rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] rounded-full"></div>
                
                <h3 className="text-2xl font-serif text-white mb-6 flex items-center gap-3">
                  <ShieldAlert className="text-red-500 animate-pulse" size={24} /> 
                  Otonom Risk & Performans Uyarıları (Yönetici Paneli)
                </h3>
                
                <div className="space-y-6">
                  {kpiData.filter(agent => agent.riskWarning).length === 0 ? (
                    <div className="bg-green-600/5 border border-green-600/20 p-6 rounded-2xl text-green-400 font-bold text-sm flex items-center gap-2">
                      <CheckCircle2 size={16} />
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
            )}

          </div>
        )}
      </div>
    </div>
  );
}
