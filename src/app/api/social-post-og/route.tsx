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
            <img src={bgImage} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }} />
          ) : (
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(202, 138, 4, 0.15) 0%, transparent 60%)' }} />
          )}
          
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'linear-gradient(to bottom, rgba(3,7,18,0.2) 0%, rgba(3,7,18,0.85) 60%, rgba(3,7,18,1) 100%)' }} />

          {/* Golden Frame Border */}
          <div style={{ position: 'absolute', top: '30px', left: '30px', right: '30px', bottom: '30px', border: '1px solid rgba(202, 138, 4, 0.25)', borderRadius: '24px', pointerEvents: 'none' }} />

          {/* Content Wrapper */}
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', padding: '60px', zIndex: 10, justifyContent: 'space-between' }}>
            
            {/* Top Branding Bar */}
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: '#ca8a04', fontSize: 26, fontWeight: 900, letterSpacing: '8px', textTransform: 'uppercase' }}>KAYNAK</span>
                <span style={{ color: '#ffffff', fontSize: 11, letterSpacing: '4px', opacity: 0.8, marginTop: '2px' }}>GAYRİMENKUL</span>
              </div>
              <span style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 12, fontWeight: 'bold', letterSpacing: '4px', textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.15)', padding: '6px 16px', borderRadius: '100px' }}>
                {district}
              </span>
            </div>

            {/* Middle & Bottom: Details */}
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: 'auto' }}>
              
              {/* Specs & Features Tags */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                <span style={{ color: '#ca8a04', fontSize: 16, fontWeight: 800, letterSpacing: '4px', textTransform: 'uppercase', borderLeft: '3px solid #ca8a04', paddingLeft: '12px' }}>
                  {specs}
                </span>
              </div>
              
              {/* Listing Title */}
              <span style={{ color: '#ffffff', fontSize: 44, fontWeight: 900, lineHeight: 1.2, marginBottom: '25px', textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
                {title.length > 55 ? title.substring(0, 55) + '...' : title}
              </span>
              
              {/* Pricing & Agent Info Grid */}
              <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '25px' }}>
                
                {/* Agent Details */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ color: '#a1a1aa', fontSize: 13, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '4px' }}>Portföy Danışmanı</span>
                  <span style={{ color: '#ffffff', fontSize: 22, fontWeight: 800 }}>{agent}</span>
                </div>
                
                {/* Gold Price Tag */}
                <div style={{ display: 'flex', backgroundColor: 'rgba(202, 138, 4, 0.15)', border: '1px solid rgba(202, 138, 4, 0.4)', padding: '12px 28px', borderRadius: '16px' }}>
                  <span style={{ color: '#ca8a04', fontSize: 26, fontWeight: 900 }}>{price} ₺</span>
                </div>

              </div>
            </div>
            
          </div>
        </div>
      ), { width: 1080, height: 1080 }
    );
  } catch (error: any) {
    return new Response(`Görsel Motoru Hatası: ${error.message}`, { status: 500 });
  }
}
