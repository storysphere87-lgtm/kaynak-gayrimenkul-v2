'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FolderOpen, X, Upload, Download, Printer, FileText, Trash2, Briefcase, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const STAGES = ['Sözleşme', 'Kapora', 'Ekspertiz', 'Kredi Bekliyor', 'Tapu', 'Tamamlandı'];

export default function PipelinePage({ params }: { params: { lang: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pipelineData, setPipelineData] = useState<any[]>([]);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // Buyer Modal State
  const [selectedProp, setSelectedProp] = useState<any | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [nextStage, setNextStage] = useState('');

  // Unified Transaction Folder Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTx, setActiveTx] = useState<any | null>(null);
  const [txDocs, setTxDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('sözleşme');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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
          if (confirm("Tapu süreci başladı! Alıcıya gerekli belgeler listesini otomatik WhatsApp mesajı olarak göndermek ister misiniz?")) {
            window.open(res.otonomMesaj, '_blank');
          }
        }
        await fetchData();
        // Eğer çekmece açıksa güncel değerleri aktar
        if (activeTx && activeTx.id === propertyId) {
          const updatedTx = { ...activeTx, status: stage, buyer_name: name, buyer_phone: phone };
          setActiveTx(updatedTx);
        }
      } else {
        throw new Error(res.error);
      }
    } catch (e: any) {
      setNotification({ message: 'Hata: ' + e.message, type: 'error' });
      setLoading(false);
    }
  };

  // ─── İŞLEM KLASÖRÜ DRWER İŞLEMLERİ ──────────────────────────────────────────

  const openTransactionFolder = async (tx: any) => {
    setActiveTx(tx);
    setDrawerOpen(true);
    setLoadingDocs(true);
    setDocTitle('');
    setSelectedFile(null);

    try {
      // Bu işleme atanmış evrakları çekelim
      const { data, error } = await supabase
        .from('agency_documents')
        .select('*')
        .eq('transaction_id', tx.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTxDocs(data || []);

    } catch (err: any) {
      setNotification({ message: 'Evraklar yüklenemedi: ' + err.message, type: 'error' });
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !activeTx) return;

    setUploadingDoc(true);
    try {
      // 1. Dosyayı Supabase Storage 'documents' bucket'ına yükle
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `transactions/${activeTx.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      // Public Url Al
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // 2. agency_documents tablosuna transaction_id ile insert at
      const { error: dbError } = await supabase
        .from('agency_documents')
        .insert([{
          title: docTitle || `${docType.toUpperCase()} Evrakı`,
          document_type: docType,
          file_url: publicUrl,
          transaction_id: activeTx.id
        }]);

      if (dbError) throw dbError;

      setNotification({ message: 'Belge başarıyla yüklendi ve işleme bağlandı!', type: 'success' });
      setDocTitle('');
      setSelectedFile(null);

      // Belgeleri tekrar yükle
      const { data } = await supabase
        .from('agency_documents')
        .select('*')
        .eq('transaction_id', activeTx.id)
        .order('created_at', { ascending: false });
      
      setTxDocs(data || []);

    } catch (err: any) {
      setNotification({ message: 'Yükleme başarısız: ' + err.message, type: 'error' });
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDocDelete = async (docId: string) => {
    if (!confirm("Bu evrakı silmek istediğinize emin misiniz?")) return;
    try {
      const { error } = await supabase
        .from('agency_documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;
      setNotification({ message: 'Belge silindi.', type: 'success' });
      setTxDocs(txDocs.filter(d => d.id !== docId));
    } catch (err: any) {
      setNotification({ message: 'Silinemedi: ' + err.message, type: 'error' });
    }
  };

  const handlePrint = (url: string) => {
    const w = window.open(url, '_blank');
    if (w) {
      w.onload = () => w.print();
    } else {
      setNotification({ message: 'Lütfen tarayıcı açılır pencerelerine izin verin.', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 pt-24 pb-20 relative overflow-x-hidden">
      
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
                <div key={stage} className="bg-gray-900/40 border border-white/5 p-6 rounded-[2rem] min-w-[290px] flex flex-col h-[750px] relative overflow-hidden backdrop-blur-md">
                  
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
                        className="bg-gray-900 border border-white/10 p-5 rounded-2xl hover:border-yellow-600/30 transition-all shadow-lg flex flex-col gap-3 group relative"
                      >
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{p.district}</span>
                        <h4 className="font-bold text-white group-hover:text-yellow-500 transition-colors text-sm line-clamp-2">{p.title}</h4>
                        
                        <div className="text-sm font-bold text-yellow-600 font-mono">
                          {p.price.toLocaleString('tr-TR')} ₺
                        </div>

                        {p.buyer_name && (
                          <div className="border-t border-white/5 pt-2 mt-1 flex flex-col gap-1 text-[11px] text-gray-400">
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-0.5">Alıcı Bilgileri</span>
                            <span className="font-semibold text-gray-200">👤 {p.buyer_name}</span>
                            <span>📞 {p.buyer_phone}</span>
                          </div>
                        )}

                        {/* Evrak Jeneratör & İşlem Dosyası Butonları */}
                        <div className="border-t border-white/5 pt-3 mt-2 flex flex-col gap-2">
                          <button 
                            onClick={() => openTransactionFolder(p)}
                            className="w-full bg-yellow-600/10 hover:bg-yellow-600 text-yellow-500 hover:text-gray-950 border border-yellow-600/20 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                          >
                            <FolderOpen size={12} />
                            📂 İşlem Klasörü
                          </button>
                          
                          {p.buyer_name && (
                            <Link 
                              href={`/${params.lang}/admin/pipeline/sozlesme?propertyId=${p.id}`}
                              className="text-center bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                            >
                              <FileText size={12} />
                              📄 Evrak Jeneratörü
                            </Link>
                          )}
                        </div>

                        {/* Move Actions */}
                        <div className="border-t border-white/5 pt-3 mt-1 grid grid-cols-2 gap-2">
                          <select 
                            value={p.status}
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

      {/* UNIFIED TRANSACTION FOLDER SLIDE-OUT DRAWER */}
      {drawerOpen && activeTx && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          {/* Overlay background */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}></div>
          
          {/* Drawer Body */}
          <div className="relative w-full max-w-lg bg-gray-950 border-l border-white/10 h-full flex flex-col z-20 shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="absolute top-0 left-0 w-64 h-64 bg-yellow-600/5 blur-[100px] rounded-full"></div>
            
            {/* Drawer Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center relative z-10">
              <div className="flex items-center gap-3">
                <Briefcase className="text-yellow-500" size={24} />
                <div>
                  <h3 className="font-serif text-xl font-bold text-white">İşlem Dosyası</h3>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{activeTx.status} Aşaması</span>
                </div>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 p-2 rounded-xl text-gray-400 hover:text-white transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 relative z-10">
              
              {/* PROPERTY BRIEF CARD */}
              <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col gap-3">
                <span className="text-[9px] text-yellow-500 font-bold uppercase tracking-widest">İşlem Detayları</span>
                <h4 className="text-white font-bold text-base leading-snug">{activeTx.title}</h4>
                <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-2">
                  <span className="text-xs text-gray-400 font-semibold">Ankara / {activeTx.district}</span>
                  <span className="text-sm font-bold text-yellow-500 font-mono">{activeTx.price.toLocaleString('tr-TR')} ₺</span>
                </div>
                {activeTx.buyer_name && (
                  <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 mt-2 flex flex-col gap-2">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Alıcı Kaydı</span>
                    <span className="text-xs font-semibold text-gray-200">👤 {activeTx.buyer_name}</span>
                    <span className="text-xs text-gray-400">📞 {activeTx.buyer_phone}</span>
                  </div>
                )}
              </div>

              {/* LIST OF CURRENT DOCUMENTS */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">Evrak Dosyaları ({txDocs.length})</h4>
                  <span className="text-[9px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded font-mono font-bold">ARŞİV</span>
                </div>

                {loadingDocs ? (
                  <div className="text-center py-6 text-xs text-gray-500">Yükleniyor...</div>
                ) : txDocs.length === 0 ? (
                  <div className="border border-white/5 rounded-3xl p-8 text-center text-xs text-gray-500 italic bg-white/[0.01]">
                    Henüz bu işleme ait yüklenmiş evrak bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {txDocs.map(doc => (
                      <div key={doc.id} className="bg-white/[0.01] border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col gap-3 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="px-2 py-0.5 bg-yellow-600/10 border border-yellow-600/30 rounded text-[9px] font-bold uppercase tracking-widest text-yellow-500 mb-1 inline-block">
                              {doc.document_type}
                            </span>
                            <h5 className="font-bold text-sm text-white">{doc.title}</h5>
                          </div>
                          <button 
                            onClick={() => handleDocDelete(doc.id)}
                            className="text-gray-500 hover:text-red-500 p-1.5 rounded transition-all"
                            title="Evrakı Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        
                        <div className="border-t border-white/5 pt-3 mt-1 flex gap-2 justify-end">
                          <button 
                            onClick={() => handlePrint(doc.file_url)}
                            className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-white/10 transition-colors"
                          >
                            <Printer size={10} /> Yazdır
                          </button>
                          <a 
                            href={doc.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 bg-yellow-600 hover:bg-yellow-500 text-gray-950 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                          >
                            <Download size={10} /> İndir
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* UPLOAD FORM */}
              <div className="bg-white/[0.01] border border-white/5 rounded-[2rem] p-6 space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                  <Plus size={16} className="text-yellow-500" /> Yeni Evrak Ekle
                </h4>
                
                <form onSubmit={handleDocUpload} className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Evrak İsmi</label>
                    <input 
                      required 
                      type="text" 
                      value={docTitle} 
                      onChange={e => setDocTitle(e.target.value)} 
                      placeholder="Örn: Komisyon Sözleşmesi" 
                      className="bg-gray-950 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-yellow-600 text-xs" 
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Evrak Türü</label>
                    <select 
                      value={docType} 
                      onChange={e => setDocType(e.target.value)} 
                      className="bg-gray-950 border border-white/10 p-3 rounded-xl text-white outline-none focus:border-yellow-600 text-xs cursor-pointer"
                    >
                      <option value="komisyon">Komisyon Sözleşmesi</option>
                      <option value="kapora">Kapora Makbuzu</option>
                      <option value="tapu">Tapu Senedi</option>
                      <option value="yer_gosterme">Yer Gösterme Belgesi</option>
                      <option value="kimlik">Kimlik/Pasaport Fotokopisi</option>
                      <option value="diger">Diğer Evrak</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dosya Seçin</label>
                    <input 
                      required 
                      type="file" 
                      onChange={e => setSelectedFile(e.target.files?.[0] || null)} 
                      className="w-full border border-white/10 bg-gray-950 p-2.5 rounded-xl text-[10px] text-gray-400" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={uploadingDoc || !selectedFile}
                    className="w-full bg-yellow-600 hover:bg-yellow-500 text-gray-950 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  >
                    <Upload size={14} />
                    {uploadingDoc ? 'Yükleniyor...' : 'Belgeyi Yükle ve İlişkilendir'}
                  </button>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
