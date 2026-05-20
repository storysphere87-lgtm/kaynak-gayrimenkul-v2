import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 1. Önce query parametrelerini kontrol et (Arayüzden gelen özelleştirilmiş değerler)
    const paramDistrict = searchParams.get('district');
    const paramMonth = searchParams.get('month');
    const paramVolume = searchParams.get('volume');
    const paramChange = searchParams.get('change');
    const paramPrice = searchParams.get('price');

    let districtsData = [];
    let headingTitle = "ANKARA PİYASA ENDEKSİ";
    let headingSubtitle = "Güncel Konut Analiz Verileri";

    if (paramDistrict && paramMonth) {
      // Stüdyodan gelen özel tekli bölge grafiği oluştur
      headingTitle = `${paramDistrict.toUpperCase()} ENDEKSİ`;
      headingSubtitle = `${paramMonth} TÜİK İstatistik Raporu`;
      
      districtsData = [
        { name: 'AYLIK TOPLAM SATIŞ', avgPrice: `${paramVolume} Adet`, total: 'TÜİK Tapu Hacmi' },
        { name: 'AYLIK FİYAT DEĞİŞİMİ', avgPrice: `%${paramChange}`, total: 'Bölge Değer Artışı' },
        { name: 'ORTALAMA M² FİYATI', avgPrice: `${paramPrice} ₺`, total: 'Yatırım Göstergesi' }
      ];
    } else {
      // 2. Parametre yoksa veritabanından çek (Dynamic Fallback)
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: stats } = await supabase
        .from('market_stats')
        .select('*')
        .order('created_at', { ascending: false });

      if (stats && stats.length > 0) {
        // En güncel 3 bölge kaydını alalım
        const latestStats = stats.slice(0, 3);
        districtsData = latestStats.map(s => ({
          name: s.district_name.toUpperCase(),
          avgPrice: `%${s.price_index_change} Artış`,
          total: `${Number(s.average_sqm_price).toLocaleString('tr-TR')} ₺ / m²`
        }));
        
        headingSubtitle = `${stats[0].month_year} Piyasa Trend Analizi`;
      } else {
        // DB boşsa varsayılan yedek veriler
        districtsData = [
          { name: 'ÇANKAYA', avgPrice: '%4.2 Artış', total: '54.200 ₺ / m²' },
          { name: 'GÖLBAŞI', avgPrice: '%5.1 Artış', total: '68.000 ₺ / m²' },
          { name: 'ETİMESGUT', avgPrice: '%3.8 Artış', total: '32.100 ₺ / m²' }
        ];
      }
    }

    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#030712', fontFamily: 'sans-serif', position: 'relative' }}>
          
          {/* Fütüristik Geometrik Arka Plan */}
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', backgroundImage: 'radial-gradient(circle at 50% 10%, rgba(202, 138, 4, 0.25) 0%, transparent 60%)' }} />
          <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '120%', height: '120%', backgroundImage: 'radial-gradient(circle at 50% 90%, rgba(30, 41, 59, 0.5) 0%, transparent 60%)' }} />

          {/* Golden Frame Border */}
          <div style={{ position: 'absolute', top: '40px', left: '40px', right: '40px', bottom: '40px', border: '1px solid rgba(202, 138, 4, 0.15)', borderRadius: '32px', pointerEvents: 'none' }} />

          {/* Content Wrapper */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', padding: '100px', zIndex: 10, justifyContent: 'space-between' }}>
            
            {/* Header: Branding */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <span style={{ color: '#ca8a04', fontSize: 45, fontWeight: 900, letterSpacing: '25px', textTransform: 'uppercase' }}>KAYNAK</span>
              <span style={{ color: '#ffffff', fontSize: 20, letterSpacing: '12px', opacity: 0.8, marginTop: '10px' }}>GAYRİMENKUL</span>
              <div style={{ width: '80px', height: '3px', backgroundColor: '#ca8a04', marginTop: '30px' }} />
            </div>

            {/* Middle: Infographic Title & Data Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: '50px', marginBottom: '50px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '60px' }}>
                <span style={{ color: '#ca8a04', fontSize: 30, fontWeight: 900, letterSpacing: '8px', textTransform: 'uppercase', marginBottom: '15px' }}>ANKARA</span>
                <span style={{ color: '#ffffff', fontSize: 56, fontWeight: 900, letterSpacing: '4px', textAlign: 'center', lineHeight: 1.2 }}>
                  {headingTitle}
                </span>
                <span style={{ color: '#a1a1aa', fontSize: 25, letterSpacing: '2px', marginTop: '20px', textTransform: 'uppercase' }}>
                  {headingSubtitle}
                </span>
              </div>

              {/* Data Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%' }}>
                {districtsData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '30px', padding: '40px', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(10px)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#ca8a04', fontSize: 32, fontWeight: 900, letterSpacing: '3px' }}>{d.name}</span>
                      <span style={{ color: '#a1a1aa', fontSize: 24, marginTop: '8px' }}>{d.total}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ color: '#ffffff', fontSize: 38, fontWeight: 900 }}>{d.avgPrice}</span>
                      <span style={{ color: '#ca8a04', fontSize: 20, marginTop: '8px', fontWeight: 'bold' }}>Quantum Analiz</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom: Expert Authority Signature */}
            <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '50px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#a1a1aa', fontSize: 22, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '5px' }}>Yayınlayan</span>
                <span style={{ color: '#ffffff', fontSize: 38, fontWeight: 800 }}>Kaynak Bölge Raporu</span>
              </div>
              <div style={{ display: 'flex', backgroundColor: 'rgba(202, 138, 4, 0.1)', border: '1px solid #ca8a04', color: '#ca8a04', padding: '20px 40px', borderRadius: '100px', fontSize: 24, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
                Piyasa Güveni
              </div>
            </div>
            
          </div>
        </div>
      ), { width: 1080, height: 1920 }
    );
  } catch (error: any) {
    return new Response(`Grafik Motoru Hatası: ${error.message}`, { status: 500 });
  }
}
