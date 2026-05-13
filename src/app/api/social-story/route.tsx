import { ImageResponse } from 'next/og';
export const runtime = 'edge';
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title') || 'YENİ PORTFÖY';
    const price = searchParams.get('price') || 'FİYAT İÇİN ARAYIN';

    return new ImageResponse(
      (
        <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#030712', padding: '80px', fontFamily: 'sans-serif' }}>
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(202, 138, 4, 0.15) 0%, transparent 60%)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '80px', zIndex: 10 }}>
            <span style={{ color: '#ca8a04', fontSize: 50, fontWeight: 900, letterSpacing: '15px' }}>KAYNAK</span>
            <span style={{ color: '#ffffff', fontSize: 30, letterSpacing: '10px', opacity: 0.7, marginTop: '15px' }}>GAYRİMENKUL</span>
            <div style={{ width: '150px', height: '2px', backgroundColor: '#ca8a04', marginTop: '30px' }} />
          </div>
          <div style={{ display: 'flex', textAlign: 'center', color: '#ffffff', fontSize: 80, fontWeight: 900, lineHeight: 1.1, marginBottom: '60px', zIndex: 10 }}>
            {title}
          </div>
          <div style={{ display: 'flex', backgroundColor: 'rgba(202, 138, 4, 0.1)', border: '4px solid #ca8a04', padding: '40px 80px', borderRadius: '40px', marginBottom: '80px', zIndex: 10 }}>
            <span style={{ color: '#ca8a04', fontSize: 75, fontWeight: 'bold' }}>{price} ₺</span>
          </div>
          <div style={{ display: 'flex', backgroundColor: '#ffffff', color: '#030712', padding: '30px 60px', borderRadius: '100px', fontSize: 35, fontWeight: 'bold', zIndex: 10 }}>
            Hemen İletişime Geçin
          </div>
        </div>
      ), { width: 1080, height: 1920 }
    );
  } catch (error: any) {
    return new Response(`Görsel Motoru Hatası: ${error.message}`, { status: 500 });
  }
}
