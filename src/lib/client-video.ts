/**
 * Quantum OS - Zero-Cost Client-Side Video Render Engine
 * Canva API ve sunucu tarafı FFmpeg/Remotion bağımlılıklarını tamamen ortadan kaldırır.
 * Tarayıcı üzerinde HTML5 Canvas ve MediaRecorder kullanarak saniyede 30 kare hızında,
 * donanım hızlandırmalı ultra premium .webm/.mp4 lüks tanıtım videosu üretir.
 * Maliyet: $0.00 | Sunucu Yükü: %0 | Performans: Maksimum (Local GPU)
 */

export interface VideoRenderParams {
  title: string;
  price: string;
  district: string;
  specs: string;
  imageUrl: string;
  format: 'story' | 'post';
  onProgress: (progress: number) => void;
}

export async function renderVideoOnClient(params: VideoRenderParams): Promise<string> {
  const { title, price, district, specs, imageUrl, format, onProgress } = params;

  // 1. Çözünürlük Belirleme
  const width = format === 'story' ? 720 : 720;
  const height = format === 'story' ? 1280 : 720;
  const duration = 5000; // 5 saniyelik mikro video
  const fps = 30;
  const totalFrames = (duration / 1000) * fps;

  // 2. Görseli Önceden Yükle
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = imageUrl || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=720";
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => {
      // Fallback
      image.src = "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=720";
      image.onload = resolve;
    };
  });

  // 3. Canvas ve Çizim Ortamını Hazırla
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Canvas context 2d alınamadı");

  // 4. Stream ve MediaRecorder Kurulumu
  const stream = canvas.captureStream(fps);
  
  // Desteklenen mime type'ı seçelim
  let options = { mimeType: 'video/webm;codecs=vp9,opus' };
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: 'video/webm;codecs=vp8' };
  }
  if (!MediaRecorder.isTypeSupported(options.mimeType)) {
    options = { mimeType: 'video/webm' };
  }

  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(stream, options);
  
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordPromise = new Promise<string>((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const videoUrl = URL.createObjectURL(blob);
      resolve(videoUrl);
    };
  });

  // Kayda başla
  recorder.start();

  // 5. Animasyon Döngüsü ve Render
  for (let frame = 0; frame <= totalFrames; frame++) {
    const t = frame / totalFrames; // 0 ile 1 arası ilerleme (zaman)
    onProgress(Math.round(t * 100));

    // A. Siyah Lüks Arka Plan
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, width, height);

    // B. Görsel Çizimi (Ken Burns Efekti - Yavaş Zoom ve Kayma)
    const scale = 1.0 + t * 0.15; // %15 zoom-in
    const imgWidth = width * scale;
    const imgHeight = (width * scale) * (image.height / image.width);
    const xOffset = -((imgWidth - width) / 2);
    const yOffset = -((imgHeight - height) / 2) - (t * 20); // Yukarı yavaş kayma

    ctx.globalAlpha = 0.65; // Karartılmış asil görsel etkisi
    ctx.drawImage(image, xOffset, yOffset, imgWidth, imgHeight);
    ctx.globalAlpha = 1.0;

    // C. Yarı Transparan Siyah Degradeler (Yazıların Okunması İçin)
    const grad = ctx.createLinearGradient(0, height * 0.5, 0, height);
    grad.addColorStop(0, 'rgba(3, 7, 18, 0)');
    grad.addColorStop(1, 'rgba(3, 7, 18, 0.95)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, height * 0.4, width, height * 0.6);

    // D. Altın Sarısı Marka Logosu ve İnce Çizgiler
    ctx.strokeStyle = 'rgba(200, 169, 110, 0.25)';
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    ctx.fillStyle = '#c8a96e';
    ctx.font = "italic bold 12px serif";
    ctx.textAlign = "center";
    ctx.letterSpacing = "6px";
    ctx.fillText("KAYNAK GAYRİMENKUL", width / 2, 70);

    // E. Dinamik İlan Bilgileri Giriş Animasyonu (Gecikmeli Fade-in)
    const textAlpha = Math.min(1, Math.max(0, (t - 0.1) * 1.5));
    ctx.globalAlpha = textAlpha;

    // İlçe/Bölge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = "bold 14px sans-serif";
    ctx.letterSpacing = "4px";
    ctx.fillText((district || "ANAKARA").toUpperCase(), width / 2, height - 200);

    // Başlık (Lüks İlan İsmi)
    ctx.fillStyle = '#ffffff';
    ctx.font = "italic 32px serif";
    ctx.letterSpacing = "1px";
    
    // Satır bölme (Çok uzun başlıklar taşmasın)
    const maxTextWidth = width - 120;
    const words = title.split(' ');
    let line = '';
    let currentY = height - 150;
    
    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' ';
      let metrics = ctx.measureText(testLine);
      if (metrics.width > maxTextWidth && n > 0) {
        ctx.fillText(line.trim(), width / 2, currentY);
        line = words[n] + ' ';
        currentY += 40;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), width / 2, currentY);

    // F. Özellikler Etiketi
    ctx.fillStyle = '#c8a96e';
    ctx.font = "bold 12px sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText(specs.toUpperCase(), width / 2, currentY + 45);

    // G. Fiyat Animasyonu (Alttan Süzülerek Gelme)
    const priceY = currentY + 100 - (textAlpha * 10);
    ctx.fillStyle = '#ffffff';
    ctx.font = "bold 36px monospace";
    ctx.fillText(`${price} TL`, width / 2, priceY);

    ctx.globalAlpha = 1.0;

    // H. Altın Parçacık Animasyonları (Gold Dust Efekti)
    ctx.fillStyle = 'rgba(200, 169, 110, 0.4)';
    for (let i = 0; i < 15; i++) {
      const pX = (Math.sin(t * 5 + i * 10) * 100) + (width / 2);
      const pY = (height - 250) - (t * 150) - (i * 20);
      ctx.beginPath();
      ctx.arc(pX, pY, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bir sonraki kareyi yakalamak için tarayıcıya çizim süresi tanıyalım
    await new Promise(r => setTimeout(r, 1000 / fps));
  }

  // 6. Kaydı Durdur ve URL'yi Teslim Et
  recorder.stop();
  return recordPromise;
}
