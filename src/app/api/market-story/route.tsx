import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Veritabanından en güncel bölge ilan sayılarını ve fiyat ortalamalarını çekelim
    const { data: properties } = await supabase
      .from('properties')
      .select('price, district_id');

    // Basitçe ilçe gruplaması yapalım
    const stats: { [key: string]: { total: number, avgPrice: number } } = {};
    if (properties) {
      properties.forEach(p => {
        if (!stats[p.district_id]) {
          stats[p.district_id] = { total: 0, avgPrice: 0 };
        }
        stats[p.district_id].total += 1;
        stats[p.district_id].avgPrice += Number(p.price || 0);
      });
      
      Object.keys(stats).forEach(k => {
        stats[k].avgPrice = Math.round(stats[k].avgPrice / stats[k].total);
      });
    }

    const firstThreeDistricts = Object.keys(stats).slice(0, 3).map(k => ({
      name: k.toUpperCase(),
      avgPrice: stats[k].avgPrice.toLocaleString('tr-TR') + ' TL',
      total: stats[k].total + ' İlan'
    }));

    // Eğer veri yoksa fallback koyalım
    const districtsData = firstThreeDistricts.length > 0 ? firstThreeDistricts : [
      { name: 'ÇANKAYA', avgPrice: '6.850.000 TL', total: '24 İlan' },
      { name: 'ÜMİTKÖY', avgPrice: '12.400.000 TL', total: '12 İlan' },
      { name: 'GÖLBAŞI', avgPrice: '18.900.000 TL', total: '8 İlan' }
    ];

    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#030712', fontFamily: 'sans-serif', position: 'relative' }}>
          
          {/* Fütüristik Geometrik Arka Plan */}
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', backgroundImage: 'radial-gradient(circle at 50% 10%, rgba(202, 138, 4, 0.25) 0%, transparent 60%)' }} />
          <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '120%', height: '120%', backgroundImage: 'radial-gradient(circle at 50% 90%, rgba(30, 41, 59, 0.5) 0%, transparent 60%)' }} />

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
                <span style={{ color: '#ffffff', fontSize: 60, fontWeight: 900, letterSpacing: '4px', textAlign: 'center' }}>PİYASA ENDEKSİ</span>
                <span style={{ color: '#a1a1aa', fontSize: 25, letterSpacing: '2px', marginTop: '15px', textTransform: 'uppercase' }}>Güncel Konut Analiz Verileri</span>
              </div>

              {/* Data Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', width: '100%' }}>
                {districtsData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '30px', padding: '40px', alignItems: 'center', justifyContent: 'space-between', backdropFilter: 'blur(10px)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#ca8a04', fontSize: 32, fontWeight: 900, letterSpacing: '3px' }}>{d.name}</span>
                      <span style={{ color: '#a1a1aa', fontSize: 24, marginTop: '8px' }}>{d.total} aktif ilan</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ color: '#ffffff', fontSize: 38, fontWeight: 900 }}>{d.avgPrice}</span>
                      <span style={{ color: '#ca8a04', fontSize: 20, marginTop: '8px', fontWeight: 'bold' }}>Ortalama Fiyat</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom: Expert Authority Signature */}
            <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '50px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#a1a1aa', fontSize: 22, letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '5px' }}>Yayınlayan</span>
                <span style={{ color: '#ffffff', fontSize: 38, fontWeight: 800 }}>Kaynak Analiz Raporu</span>
              </div>
              <div style={{ display: 'flex', backgroundColor: 'rgba(202, 138, 4, 0.1)', border: '1px solid #ca8a04', color: '#ca8a04', padding: '20px 40px', borderRadius: '100px', fontSize: 24, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
                Pazar Dinamikleri
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
