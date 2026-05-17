'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Video, FileText, Download, Filter } from 'lucide-react';
import { Locale } from '@/getDictionary';

export default function DanismanEgitimPage({ params }: { params: { lang: string } }) {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  
  const lang = params.lang as Locale;
  const isRtl = lang === 'ar';

  useEffect(() => {
    async function fetchResources() {
      try {
        const { supabase } = await import('@/lib/supabase');
        // İleride danışman girişi varsa is_public filtrelemesi auth duruma göre değişir
        // Şimdilik test amaçlı hepsini çekiyoruz veya sadece public olanları.
        // admin paneli olmadan normal sayfadan girildiği için.
        const { data, error } = await supabase
          .from('training_resources')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setResources(data || []);
      } catch (err) {
        console.error('Eğitim verileri çekilemedi', err);
      } finally {
        setLoading(false);
      }
    }
    fetchResources();
  }, []);

  const filteredResources = filter === 'all' 
    ? resources 
    : resources.filter(r => r.category === filter);

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={32} className="text-blue-400" />;
      case 'pdf': return <FileText size={32} className="text-red-400" />;
      case 'word': return <FileText size={32} className="text-blue-600" />;
      default: return <BookOpen size={32} className="text-gray-400" />;
    }
  };

  return (
    <main className={`min-h-screen bg-gray-950 text-gray-100 pt-32 pb-20 font-sans ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="mb-16">
          <h1 className="text-4xl md:text-6xl font-serif mb-6 leading-tight">
            {lang === 'tr' ? 'Danışman Akademi' : lang === 'en' ? 'Advisor Academy' : 'أكاديمية المستشارين'}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            {lang === 'tr' 
              ? 'Sektörün zirvesine giden yolda, Kaynak Gayrimenkul özel eğitim ve gelişim kaynakları.' 
              : lang === 'en' 
                ? 'Exclusive training and development resources for Kaynak Gayrimenkul advisors.' 
                : 'موارد تدريب وتطوير حصرية لمستشاري كايناك العقارية.'}
          </p>
        </div>

        {/* FİLTRELEME */}
        <div className="flex flex-wrap items-center gap-4 mb-12">
          <div className="flex items-center gap-2 text-gray-400 mr-4">
            <Filter size={20} />
            <span className="font-bold uppercase tracking-widest text-xs">KATEGORİLER</span>
          </div>
          {['all', 'pazarlama', 'hukuk', 'teknik', 'oryantasyon'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-3 rounded-full text-sm font-bold transition-all ${
                filter === cat 
                  ? 'bg-yellow-600 text-gray-950 shadow-[0_0_20px_rgba(202,138,4,0.3)]' 
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              {cat === 'all' ? (lang === 'tr' ? 'Tümü' : 'All') : cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* EĞİTİM KARTLARI */}
        {loading ? (
          <div className="text-center py-20 text-gray-500 italic">Eğitim modülleri yükleniyor...</div>
        ) : filteredResources.length === 0 ? (
          <div className="bg-white/5 border border-white/10 p-12 rounded-[2rem] text-center">
            <BookOpen size={48} className="mx-auto text-gray-700 mb-4" />
            <p className="text-gray-400 text-lg">Bu kategoride henüz eğitim materyali bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredResources.map(resource => (
              <div key={resource.id} className="bg-white/5 border border-white/10 rounded-[2rem] p-8 hover:border-yellow-600/50 transition-all group relative overflow-hidden flex flex-col h-full">
                
                <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
                  {getIcon(resource.file_type)}
                </div>

                <div className="mb-8">
                  <span className="inline-block px-3 py-1 bg-gray-900 rounded-lg text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-4 border border-white/5">
                    {resource.category}
                  </span>
                  <h3 className="text-2xl font-serif text-white mb-3 line-clamp-2">{resource.title}</h3>
                  {resource.description && (
                    <p className="text-gray-400 text-sm line-clamp-3">{resource.description}</p>
                  )}
                </div>

                <div className="mt-auto pt-6 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-mono">
                    {new Date(resource.created_at).toLocaleDateString('tr-TR')}
                  </span>
                  <a 
                    href={resource.file_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 bg-yellow-600/10 text-yellow-500 hover:bg-yellow-600 hover:text-gray-950 px-5 py-2 rounded-xl text-sm font-bold transition-all"
                  >
                    {resource.file_type === 'video' ? 'İzle' : 'Görüntüle / İndir'}
                    <Download size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
