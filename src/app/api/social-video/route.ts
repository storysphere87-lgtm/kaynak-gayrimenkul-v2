import { NextResponse } from 'next/server';
import { triggerCanvaVideoGeneration, checkCanvaJobStatus } from '@/lib/canva';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, price, district, specs, image } = body;

    if (!title || !price) {
      return NextResponse.json({ error: 'Eksik başlık veya fiyat verisi' }, { status: 400 });
    }

    // Canva Connect API için template ve marka verileri hazırlanır
    const templateId = process.env.CANVA_TEMPLATE_ID || "template_real_estate_luxury_01";

    const payload = {
      templateId,
      title: `Social Video - ${title}`,
      data: {
        title_text_key: {
          type: 'text' as const,
          text: title
        },
        price_text_key: {
          type: 'text' as const,
          text: `${price} TL`
        },
        district_text_key: {
          type: 'text' as const,
          text: district || 'Ankara'
        },
        specs_text_key: {
          type: 'text' as const,
          text: specs || ''
        },
        image_key: {
          type: 'image' as const,
          image_url: image || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200"
        }
      }
    };

    // 1. İşlemi tetikle
    const job = await triggerCanvaVideoGeneration(payload);

    if (job.status === 'failed') {
      throw new Error(job.error || "Canva tetikleme hatası");
    }

    // 2. Canlı sorgulama simülasyonu / bekleme (Maksimum 5 saniye)
    let checkCount = 0;
    let currentJob = job;

    while (checkCount < 10 && currentJob.status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 500));
      currentJob = await checkCanvaJobStatus(job.id);
      checkCount++;
    }

    if (currentJob.status === 'success') {
      return NextResponse.json({
        success: true,
        jobId: job.id,
        videoUrl: currentJob.url
      });
    }

    // Hala devam ediyorsa asenkron teslim
    return NextResponse.json({
      success: true,
      jobId: job.id,
      status: 'pending',
      videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-modern-luxury-house-exterior-view-32328-large.mp4" // Fallback preview
    });

  } catch (err: any) {
    console.error("Video API hatası:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
