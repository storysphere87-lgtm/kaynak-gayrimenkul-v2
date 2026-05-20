/**
 * Quantum OS - Canva Connect API Entegrasyon Motoru
 * Sunucu tarafında ağır FFmpeg/Chromium çalıştırmadan (Remotion alternatifi),
 * Canva Şablonları üzerinden otonom mikro-video (.mp4) üretimi yapar.
 */

export interface CanvaAutofillPayload {
  templateId: string;
  title: string;
  data: {
    [key: string]: {
      type: 'text' | 'image';
      text?: string;
      image_url?: string;
    };
  };
}

export interface CanvaJobStatus {
  id: string;
  status: 'in_progress' | 'success' | 'failed';
  url?: string;
  error?: string;
}

/**
 * Canva API üzerinden video/görsel şablonu doldurur ve asenkron iş (job) başlatır
 */
export async function triggerCanvaVideoGeneration(payload: CanvaAutofillPayload): Promise<CanvaJobStatus> {
  const token = process.env.CANVA_API_KEY;
  if (!token) {
    console.warn("Canva API Key bulunamadı (.env). Mock modunda çalışılıyor.");
    return mockCanvaJob(payload);
  }

  try {
    // 1. Autofill API İsteği Gönderme
    const response = await fetch("https://api.canva.com/v1/autofills", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        brand_template_id: payload.templateId,
        title: payload.title,
        data: payload.data
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Canva API hatası: ${response.status} - ${errText}`);
    }

    const job = await response.json();
    return {
      id: job.id,
      status: 'in_progress'
    };

  } catch (error: any) {
    console.error("Canva video tetikleme hatası:", error);
    return {
      id: "err_" + Date.now(),
      status: 'failed',
      error: error.message
    };
  }
}

/**
 * Başlatılan Canva export işinin (job) durumunu sorgular (.mp4 linkini alır)
 */
export async function checkCanvaJobStatus(jobId: string): Promise<CanvaJobStatus> {
  const token = process.env.CANVA_API_KEY;
  if (!token || jobId.startsWith("mock_") || jobId.startsWith("err_")) {
    return mockCheckJob(jobId);
  }

  try {
    const response = await fetch(`https://api.canva.com/v1/autofills/${jobId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Job sorgulama hatası: ${response.status}`);
    }

    const job = await response.json();
    
    if (job.status === 'success') {
      return {
        id: jobId,
        status: 'success',
        url: job.result.url // Üretilen mp4 video dosyasının indirme adresi
      };
    }

    if (job.status === 'failed') {
      return {
        id: jobId,
        status: 'failed',
        error: job.error?.message || "Canva render işlemi başarısız oldu."
      };
    }

    return {
      id: jobId,
      status: 'in_progress'
    };

  } catch (error: any) {
    console.error("Canva job status check error:", error);
    return {
      id: jobId,
      status: 'failed',
      error: error.message
    };
  }
}

// --- LOCAL MOCK ENTEGRASYON YEDEĞİ (Geliştirme & Test Aşaması) ---

function mockCanvaJob(payload: CanvaAutofillPayload): CanvaJobStatus {
  return {
    id: "mock_job_" + Math.random().toString(36).substring(7),
    status: 'in_progress'
  };
}

function mockCheckJob(jobId: string): Promise<CanvaJobStatus> {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (jobId.startsWith("err_")) {
        resolve({
          id: jobId,
          status: 'failed',
          error: "Canva API Key eksik olduğu için mockup başarısız oldu."
        });
      } else {
        resolve({
          id: jobId,
          status: 'success',
          // Premium mockup video linki (Cafer Bey için harika bir demo video!)
          url: "https://assets.mixkit.co/videos/preview/mixkit-modern-luxury-house-exterior-view-32328-large.mp4"
        });
      }
    }, 2000);
  });
}
