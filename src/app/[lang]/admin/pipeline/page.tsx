'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STAGES = ['Sözleşme', 'Kapora', 'Ekspertiz', 'Kredi Bekliyor', 'Tapu', 'Tamamlandı'];

export default function PipelinePage({ params }: { params: { lang: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pipelineData, setPipelineData] = useState<any[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [selectedProp, setSelectedProp] = useState<any | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [nextStage, setNextStage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { getPipelineTransactionsAction } = await import('../actions');
      const res = await getPipelineTransactionsAction();
      if (res.success && res.data) {
        setPipelineData(res.data);
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      setNotification({ message: 'Veri çekilemedi: ' + e.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveStage = (prop: any, targetStage: string) => {
    // Sözleşme dışında bir yere taşınıyorsa alıcı bilgilerini isteyelim
    if (targetStage !== 'Sözleşme') {
      setSelectedProp(prop);
      setBuyerName(prop.buyer_name || '');
      setBuyerPhone(prop.buyer_phone || '');
      setNextStage(targetStage);
    } else {
      updateStage(prop.id, targetStage, '', '');
    }
  };

  const submitStageUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProp) return;
    await updateStage(selectedProp.id, nextStage, buyerName, buyerPhone);
    setSelectedProp(null);
  };

  const updateStage = async (propertyId: string, stage: string, name: string, phone: string) => {
    setLoading(true);
    try {
      const { updatePipelineStatusAction } = await import('../actions');
      const res = await updatePipelineStatusAction(propertyId, stage, name, phone);
      if (res.success) {
        setNotification({ message: 'Süreç başarıyla güncellendi.', type: 'success' });
        if (res.otonomMesaj) {
          // Otonom WhatsApp süreci
          if (confirm("Tapu süreci başladı! Alıcıya gerekli belgeler listesini otomatik WhatsApp mesajı olarak göndermek ister misiniz?")) {
            window.open(res.otonomMesaj, '_blank');
          }
        }
        await fetchData();
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      setNotification({ message: 'Hata: ' + e.message, type: 'error' });
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
            <span className="text-yellow-600 text-xs font-bold uppercase tracking-[0.4em] mb-2 block">Quantum OS CRM</span>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white">İşlem & Satış Takibi (Kanban)</h1>
          </div>
          <button 
            onClick={() => router.push(`/${params.lang}/admin`)}
            className="bg-white/5 border border-white/10 hover:border-yellow-600/50 text-white px-8 py-3 rounded-2xl font-bold transition-all"
          >
            ← Yönetim Paneline Dön
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-xl text-gray-500 font-bold">Yükleniyor...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 overflow-x-auto pb-6">
            {STAGES.map((stage) => {
              const stageProps = pipelineData.filter(p => p.status === stage);
              return (
                <div key={stage} className="bg-gray-900/40 border border-white/5 p-6 rounded-[2rem] min-w-[280px] flex flex-col h-[750px] relative overflow-hidden backdrop-blur-md">
                  
                  {/* Column Header */}
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                    <span className="font-bold text-white tracking-wide text-sm uppercase">{stage}</span>
                    <span className="bg-yellow-600/10 border border-yellow-600/30 text-yellow-500 font-bold px-3 py-1 rounded-full text-xs">
                      {stageProps.length}
                    </span>
                  </div>

                  {/* Column Items */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {stageProps.map((p) => (
                      <div 
                        key={p.id} 
                        className="bg-gray-900 border border-white/10 p-5 rounded-2xl hover:border-yellow-600/30 transition-all shadow-lg flex flex-col gap-3 group"
                      >
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{p.district}</span>
                        <h4 className="font-bold text-white group-hover:text-yellow-500 transition-colors text-sm line-clamp-2">{p.title}</h4>
                        
                        <div className="text-sm font-bold text-yellow-600">
                          {p.price.toLocaleString('tr-TR')} ₺
                        </div>

                        {p.buyer_name && (
                          <div className="border-t border-white/5 pt-2 mt-2 flex flex-col gap-1">
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Alıcı</span>
                            <span className="text-xs font-semibold text-gray-300">👤 {p.buyer_name}</span>
                            <span className="text-xs text-gray-400">📞 {p.buyer_phone}</span>
                            
                            {/* Dynamic Legal Doc Generator Link */}
                            <Link 
                              href={`/${params.lang}/admin/pipeline/sozlesme?propertyId=${p.id}`}
                              className="mt-2 text-center bg-yellow-600/10 hover:bg-yellow-600 text-yellow-500 hover:text-gray-950 border border-yellow-600/20 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                            >
                              📄 Evrak Jeneratörü
                            </Link>
                          </div>
                        )}

                        {/* Move Actions */}
                        <div className="border-t border-white/5 pt-3 mt-2 grid grid-cols-2 gap-2">
                          <select 
                            value={stage}
                            onChange={(e) => handleMoveStage(p, e.target.value)}
                            className="bg-gray-950 border border-white/10 text-xs font-semibold rounded-lg px-2 py-1 outline-none text-gray-300 focus:border-yellow-600 col-span-2"
                          >
                            <option disabled value="">Taşı...</option>
                            {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BUYER INFO MODAL */}
      {selectedProp && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <form 
            onSubmit={submitStageUpdate}
            className="bg-gray-900 border border-white/10 p-8 md:p-12 rounded-[3rem] w-full max-w-md relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-600/5 blur-[50px] rounded-full"></div>
            <h3 className="text-2xl font-serif text-white mb-2">Alıcı Bilgileri</h3>
            <p className="text-sm text-gray-500 mb-8">İşlemi bir sonraki aşamaya taşımak için alıcı bilgilerini girin.</p>
            
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Alıcı Adı Soyadı</label>
                <input 
                  type="text" 
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Ahmet Yılmaz" 
                  required
                  className="bg-gray-950 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-600 transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Alıcı Telefonu</label>
                <input 
                  type="tel" 
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="90555..." 
                  required
                  className="bg-gray-950 border border-white/10 p-4 rounded-xl text-white outline-none focus:border-yellow-600 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setSelectedProp(null)}
                  className="bg-white/5 border border-white/10 hover:bg-white/10 font-bold py-4 rounded-xl transition-all"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="bg-yellow-600 hover:bg-yellow-500 text-gray-950 font-bold py-4 rounded-xl transition-all shadow-lg"
                >
                  Taşı ve Kaydet
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
