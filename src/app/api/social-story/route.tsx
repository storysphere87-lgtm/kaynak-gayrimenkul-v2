import { ImageResponse } from 'next/og';
export const runtime = 'edge';
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'PREMIUM PORTFÖY';
    const price = searchParams.get('price') || 'FİYAT İÇİN ARAYIN';
    const district = searchParams.get('district') || 'Lüks Konut';
    const specs = searchParams.get('specs') || 'Özel Tasarım';
    const bgImage = searchParams.get('image') || '';
    const agent = searchParams.get('agent') || 'Kaynak Gayrimenkul';

    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#030712', fontFamily: 'sans-serif', position: 'relative' }}>
          
          {/* Background Image & Gradient */}
          {bgImage ? (
            <img src={bgImage} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
          ) : (
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(202, 138, 4, 0.2) 0%, transparent 70%)' }} />
          )}
          
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'linear-gradient(to bottom, rgba(3,7,18,0.1) 0%, rgba(3,7,18,0.9) 80%, rgba(3,7,18,1) 100%)' }} />

          {/* Content Wrapper */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', padding: '100px', zIndex: 10, justifyContent: 'space-between' }}>
            
            {/* Top: Branding */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <span style={{ color: '#ca8a04', fontSize: 60, fontWeight: 900, letterSpacing: '20px', textTransform: 'uppercase' }}>KAYNAK</span>
              <span style={{ color: '#ffffff', fontSize: 25, letterSpacing: '12px', opacity: 0.8, marginTop: '10px' }}>GAYRİMENKUL</span>
              <div style={{ width: '80px', height: '3px', backgroundColor: '#ca8a04', marginTop: '40px' }} />
            </div>

            {/* Middle: Details */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', marginTop: 'auto', marginBottom: '80px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                <span style={{ color: '#ca8a04', fontSize: 35, fontWeight: 800, letterSpacing: '8px', textTransform: 'uppercase', borderLeft: '4px solid #ca8a04', paddingLeft: '20px' }}>
                  {district}
                </span>
              </div>
              
              <span style={{ color: '#ffffff', fontSize: 85, fontWeight: 900, lineHeight: 1.1, marginBottom: '30px', textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
                {title.length > 40 ? title.substring(0, 40) + '...' : title}
              </span>
              
              <div style={{ display: 'flex', color: '#a1a1aa', fontSize: 35, letterSpacing: '3px', marginBottom: '60px', textTransform: 'uppercase' }}>
                {specs}
              </div>

              <div style={{ display: 'flex', backgroundColor: 'rgba(202, 138, 4, 0.15)', border: '2px solid rgba(202, 138, 4, 0.5)', padding: '30px 60px', borderRadius: '30px', backdropFilter: 'blur(10px)' }}>
                <span style={{ color: '#ca8a04', fontSize: 65, fontWeight: 900 }}>{price} ₺</span>
              </div>
            </div>

            {/* Bottom: Agent & CTA */}
            <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '50px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#a1a1aa', fontSize: 25, letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '10px' }}>Danışman</span>
                <span style={{ color: '#ffffff', fontSize: 45, fontWeight: 800 }}>{agent}</span>
              </div>
              <div style={{ display: 'flex', backgroundColor: '#ffffff', color: '#030712', padding: '25px 50px', borderRadius: '100px', fontSize: 30, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>
                Detaylar İçin Kaydır
              </div>
            </div>
            
          </div>
        </div>
      ), { width: 1080, height: 1920 }
    );
  } catch (error: any) {
    return new Response(`Görsel Motoru Hatası: ${error.message}`, { status: 500 });
  }
}
