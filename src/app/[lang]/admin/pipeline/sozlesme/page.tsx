'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SozlesmeGeneratorPage({ params }: { params: { lang: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const [loading, setLoading] = useState(true);
  const [templateType, setTemplateType] = useState<'kira' | 'tahliye'>('kira');
  
  // Dynamic fields
  const [propDetails, setPropDetails] = useState<any>(null);
  const [ownerName, setOwnerName] = useState('Kaynak Gayrimenkul Portföy Sahibi');
  const [ownerTc, setOwnerTc] = useState('11111111111');
  const [ownerPhone, setOwnerPhone] = useState('0555 555 55 55');
  const [ownerAddress, setOwnerAddress] = useState('Ankara');
  const [ownerIban, setOwnerIban] = useState('TR00 0000 0000 0000 0000 0000 00');
  
  const [clientName, setClientName] = useState('Alıcı/Kiracı Adayı');
  const [clientTc, setClientTc] = useState('22222222222');
  const [clientPhone, setClientPhone] = useState('0555 555 55 55');
  const [clientAddress, setClientAddress] = useState('Ankara');
  
  const [leaseDuration, setLeaseDuration] = useState('1 Yıl');
  const [leaseStart, setLeaseStart] = useState(new Date().toLocaleDateString('tr-TR'));
  const [evictionDate, setEvictionDate] = useState(new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('tr-TR'));
  const [depozito, setDepozito] = useState('');

  useEffect(() => {
    if (propertyId) {
      fetchPropertyAndTx();
    } else {
      setLoading(false);
    }
  }, [propertyId]);

  const fetchPropertyAndTx = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      // İlanı çek
      const { data: prop } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();
      
      if (prop) {
        setPropDetails(prop);
        setDepozito((Number(prop.price) * 2).toString()); // 2 kira depozito varsayılan
        
        // Bu ilana bağlı aktif işlem/alıcı var mı bak
        const { data: tx } = await supabase
          .from('transactions')
          .select('*')
          .eq('property_id', propertyId)
          .maybeSingle();
        
        if (tx) {
          setClientName(tx.buyer_name || 'Alıcı/Kiracı Adayı');
          setClientPhone(tx.buyer_phone || '');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-20 text-center text-white">Sözleşme şablonu hazırlanıyor...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-800 pt-24 pb-20 print:pt-0 print:pb-0 print:bg-white print:text-black">
      
      {/* CONTROL PANEL - HIDDEN ON PRINT */}
      <div className="container mx-auto px-6 max-w-4xl mb-8 print:hidden">
        <div className="bg-gray-950 border border-white/10 p-8 rounded-[2rem] flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Resmi Evrak Kontrol Paneli</h2>
            <button 
              onClick={() => router.back()}
              className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-semibold"
            >
              ← Geri Dön
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setTemplateType('kira')}
              className={`py-3 rounded-xl font-bold transition-all ${templateType === 'kira' ? 'bg-yellow-600 text-gray-950' : 'bg-white/5 text-white'}`}
            >
              📄 İşyeri Kira Sözleşmesi
            </button>
            <button 
              onClick={() => setTemplateType('tahliye')}
              className={`py-3 rounded-xl font-bold transition-all ${templateType === 'tahliye' ? 'bg-yellow-600 text-gray-950' : 'bg-white/5 text-white'}`}
            >
              📄 Tahliye Taahhütnamesi
            </button>
          </div>

          {/* DYNAMIC FIELD ADJUSTMENTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-yellow-600 uppercase tracking-wider">Mülk Sahibi / Kiralayan</h3>
              <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Mülk Sahibi Adı" className="w-full bg-gray-900 border border-white/10 p-3 rounded-lg text-white text-sm" />
              <input type="text" value={ownerTc} onChange={e => setOwnerTc(e.target.value)} placeholder="T.C. Kimlik No" className="w-full bg-gray-900 border border-white/10 p-3 rounded-lg text-white text-sm" />
              <input type="text" value={ownerPhone} onChange={e => setOwnerPhone(e.target.value)} placeholder="Telefon" className="w-full bg-gray-900 border border-white/10 p-3 rounded-lg text-white text-sm" />
              <input type="text" value={ownerAddress} onChange={e => setOwnerAddress(e.target.value)} placeholder="Adres" className="w-full bg-gray-900 border border-white/10 p-3 rounded-lg text-white text-sm" />
              <input type="text" value={ownerIban} onChange={e => setOwnerIban(e.target.value)} placeholder="IBAN" className="w-full bg-gray-900 border border-white/10 p-3 rounded-lg text-white text-sm" />
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-yellow-600 uppercase tracking-wider">Müşteri / Kiracı</h3>
              <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Kiracı Adı" className="w-full bg-gray-900 border border-white/10 p-3 rounded-lg text-white text-sm" />
              <input type="text" value={clientTc} onChange={e => setClientTc(e.target.value)} placeholder="T.C. Kimlik No" className="w-full bg-gray-900 border border-white/10 p-3 rounded-lg text-white text-sm" />
              <input type="text" value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="Telefon" className="w-full bg-gray-900 border border-white/10 p-3 rounded-lg text-white text-sm" />
              <input type="text" value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Adres" className="w-full bg-gray-900 border border-white/10 p-3 rounded-lg text-white text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" value={leaseDuration} onChange={e => setLeaseDuration(e.target.value)} placeholder="Süre" className="bg-gray-900 border border-white/10 p-3 rounded-lg text-white text-sm" />
                <input type="text" value={depozito} onChange={e => setDepozito(e.target.value)} placeholder="Depozito" className="bg-gray-900 border border-white/10 p-3 rounded-lg text-white text-sm" />
              </div>
            </div>
          </div>

          <button 
            onClick={handlePrint}
            className="w-full bg-yellow-600 text-gray-950 font-bold py-4 rounded-xl text-lg hover:bg-yellow-500 transition-all shadow-lg"
          >
            🖨️ Sözleşmeyi Yazdır (PDF Olarak Kaydet)
          </button>
        </div>
      </div>

      {/* PRINTABLE LEGAL DOCUMENT CONTAINER */}
      <div className="bg-white max-w-[21cm] min-h-[29.7cm] mx-auto p-[2cm] shadow-2xl print:shadow-none print:mx-0 print:my-0">
        
        {templateType === 'kira' ? (
          /* İŞYERİ KİRA SÖZLEŞMESİ */
          <div className="text-xs leading-relaxed space-y-6">
            <h1 className="text-center font-bold text-lg border-b-2 border-black pb-2 uppercase tracking-wide">
              İŞYERİ KİRA SÖZLEŞMESİ
            </h1>

            {/* TABLO BİLGİLERİ */}
            <table className="w-full border-collapse border border-black">
              <tbody>
                <tr>
                  <td className="border border-black p-2 font-bold w-1/3">Kiralanan Taşınmazın İli / İlçesi</td>
                  <td className="border border-black p-2">Ankara / {propDetails?.district_id || 'Merkez'}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold">Adresi</td>
                  <td className="border border-black p-2">{propDetails?.title || 'İlan Adresi'}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold">Kiralanan Şeyin Cinsi</td>
                  <td className="border border-black p-2">{propDetails?.category || 'İşyeri / Ofis'}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold">Kiraya Verenin Adı, Soyadı</td>
                  <td className="border border-black p-2">{ownerName}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold">Kiraya Verenin T.C. Kimlik No</td>
                  <td className="border border-black p-2">{ownerTc}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold">Kiraya Verenin Adresi / Tel</td>
                  <td className="border border-black p-2">{ownerAddress} / {ownerPhone}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold">Kiracının Adı, Soyadı</td>
                  <td className="border border-black p-2">{clientName}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold">Kiracının T.C. Kimlik No</td>
                  <td className="border border-black p-2">{clientTc}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold">Kiracının Adresi / Tel</td>
                  <td className="border border-black p-2">{clientAddress} / {clientPhone}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold">Bir Aylık Kira Karşılığı</td>
                  <td className="border border-black p-2 font-bold">{propDetails?.price?.toLocaleString('tr-TR') || '0'} TL</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold">Bir Yıllık Kira Karşılığı</td>
                  <td className="border border-black p-2">{(Number(propDetails?.price || 0) * 12).toLocaleString('tr-TR')} TL</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold">Depozito Tutarı</td>
                  <td className="border border-black p-2">{Number(depozito).toLocaleString('tr-TR')} TL</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold">Kiraya Veren IBAN No</td>
                  <td className="border border-black p-2 font-mono text-[10px]">{ownerIban}</td>
                </tr>
                <tr>
                  <td className="border border-black p-2 font-bold">Kira Müddeti / Başlangıcı</td>
                  <td className="border border-black p-2">{leaseDuration} / {leaseStart}</td>
                </tr>
              </tbody>
            </table>

            {/* GENEL ŞARTLAR */}
            <div className="space-y-4 pt-4">
              <h2 className="font-bold text-center border-b border-black pb-1">KİRA SÖZLEŞMESİ GENEL ve HUSUSİ ŞARTLAR</h2>
              
              <div className="space-y-2">
                <p><strong>MADDE 1 - Sözleşmenin Tarafları:</strong> İşbu sözleşme tarafları bir tarafta KİRAYA VEREN ({ownerName}) ile diğer tarafta KİRACI ({clientName}) arasındadır.</p>
                <p><strong>MADDE 2 - Sözleşmenin Konusu:</strong> Sözleşmenin konusu, sözleşmeye konu taşınmazın işyeri amaçlı kullanılmak üzere kiralanmasıdır.</p>
                <p><strong>MADDE 3 - Kiralananın Kullanım Amacı:</strong> Kiracı, kiralananı kendi adına işyeri olarak ticari faaliyetlerini gerçekleştirmek amacı ile kullanacaktır.</p>
                <p><strong>MADDE 4 - Kiralama Süresi ve Kira Bedeli:</strong> Kira sözleşmesi {leaseDuration} süre için imzalanmış olup, kiralama başlangıç tarihi {leaseStart}'dir. Yıllık yeni kiralama dönemine ait kira artışı, mevcut kira bedelinin aylık net tutarı baz alınarak, bir önceki kira yılında tüketici fiyat endeksindeki (TÜFE) on iki aylık ortalamalara göre açıklanacak olan artış oranını geçmeyecek şekilde belirlenecektir.</p>
                <p><strong>MADDE 5 - Kira Ödeme Yeri ve Zamanı:</strong> Kira bedeli aylık ve PEŞİN olarak ödenecektir. Kira bedeli KİRACI tarafından KİRAYA VEREN'in {ownerIban} no'lu hesabına her ayın en geç 5. günü mesai saati bitimine kadar yatırılacaktır.</p>
                <p><strong>MADDE 6 - Kiralananın Teslimi:</strong> Kiralanan taşınmaz, kiracıya tam, eksiksiz ve kullanıma hazır şekilde teslim edilmiştir.</p>
                <p><strong>MADDE 7 - Depozito Teminatı:</strong> Kiracı, depozito olarak {Number(depozito).toLocaleString('tr-TR')} TL tutarı kiralama başlangıcında nakden/havale ile ödemiştir. Sözleşme sonrasında taşınmaza herhangi bir hasar verilmediğinin tespiti durumunda aynen iade edilecektir.</p>
                <p><strong>MADDE 8 - Bakım ve Onarımlar:</strong> Kiralanan taşınmazın kullanımından doğan olağan bakım ve onarımlar kiracıya aittir.</p>
                <p><strong>MADDE 9 - Yönetim Giderleri:</strong> Kiralanan taşınmaza ait aidat, elektrik, su, doğalgaz vb. tüm ortak alan yönetim giderleri kiracı tarafından karşılanacaktır.</p>
                <p><strong>MADDE 10 - Sözleşmenin Feshi:</strong> Kira sözleşmesinin sona ermesi veya haklı fesih durumlarında Borçlar Kanunu hükümleri geçerlidir.</p>
                <p><strong>MADDE 11 - Tahliye ve İade:</strong> Kira sözleşmesinin sonunda kiracı taşınmazı boş ve hasarsız olarak kiraya verene teslim etmekle yükümlüdür.</p>
              </div>
            </div>

            {/* İMZALAR */}
            <div className="grid grid-cols-2 gap-12 pt-16 text-center">
              <div>
                <p className="font-bold border-b border-black pb-2 mb-8">KİRAYA VEREN</p>
                <p>{ownerName}</p>
                <p className="text-[10px] text-gray-400 mt-4">(İmza)</p>
              </div>
              <div>
                <p className="font-bold border-b border-black pb-2 mb-8">KİRACI</p>
                <p>{clientName}</p>
                <p className="text-[10px] text-gray-400 mt-4">(İmza)</p>
              </div>
            </div>

          </div>
        ) : (
          /* TAHLİYE TAAHHÜTNAMESİ */
          <div className="text-sm leading-relaxed space-y-12 pt-8">
            <h1 className="text-center font-bold text-xl border-b-2 border-black pb-4 uppercase tracking-wide">
              TAHLİYE TAAHHÜTNAMESİ
            </h1>

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-4">
                <span className="font-bold text-gray-700">Taşınmaz Sahibi (Kiralayan):</span>
                <span className="col-span-2">{ownerName}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-4">
                <span className="font-bold text-gray-700">Kiracı:</span>
                <span className="col-span-2">{clientName}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-4">
                <span className="font-bold text-gray-700">Kiralanan Taşınmazın Adresi:</span>
                <span className="col-span-2">{propDetails?.title || 'İlan Adresi'}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 border-b border-gray-200 pb-4">
                <span className="font-bold text-gray-700">Tahliye Tarihi:</span>
                <span className="col-span-2 font-bold text-black underline">{evictionDate}</span>
              </div>
            </div>

            <div className="text-justify leading-loose pt-8 space-y-6">
              <p>
                Halen kiracı olarak kullanmakta olduğum yukarıda adresi yazılı taşınmazı hiçbir ihtar ve ihbara gerek kalmadan, kayıtsız ve şartsız olarak, 6098 sayılı Türk Borçlar Kanunu'nun ilgili maddeleri gereğince, belirtilen tarihte boş ve sağlam olarak tahliye edeceğimi, kabul ve taahhüt ederim.
              </p>
              <p className="text-right font-bold pt-8">Taahhüt Tarihi: {leaseStart}</p>
            </div>

            {/* İMZALAR */}
            <div className="grid grid-cols-2 gap-12 pt-24 text-center">
              <div>
                <p className="font-bold border-b border-black pb-2 mb-8">KİRALAYAN</p>
                <p>{ownerName}</p>
              </div>
              <div>
                <p className="font-bold border-b border-black pb-2 mb-8">TAAHHÜT EDEN (KİRACI)</p>
                <p>{clientName}</p>
                <p className="text-xs text-gray-500 mt-2">T.C. No: {clientTc}</p>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
