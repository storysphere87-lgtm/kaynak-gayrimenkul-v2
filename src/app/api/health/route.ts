import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logApiCall } from '@/lib/api-logger';

/**
 * Quantum OS - Uptime İzleme & Sağlık Denetimi Ucu (Faz 3)
 * Uptime Robot veya Better Uptime tarafından her 5 dakikada bir çağrılarak
 * veritabanı bağlantı durumunu ve sunucu sağlığını (downtime) denetler.
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // 1. Supabase veritabanı bağlantı durumunu sorgula (Hızlı ping)
    const { data, error } = await supabase
      .from('districts')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    const durationMs = Date.now() - startTime;

    // Başarılı denetimi logla
    logApiCall({
      endpoint: 'GET /api/health (Uptime Ping)',
      status: 'success',
      statusCode: 200,
      durationMs
    });

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      latency_ms: durationMs,
      timestamp: new Date().toISOString()
    }, { status: 200 });

  } catch (err: any) {
    console.error("DOWNTIME TESPİT EDİLDİ (Health Check Failure):", err.message);

    const durationMs = Date.now() - startTime;

    // Kritik çöküş logu
    logApiCall({
      endpoint: 'GET /api/health (DOWNTIME WARNING)',
      status: 'error',
      statusCode: 500,
      errorMessage: err.message,
      durationMs
    });

    // İsteğe bağlı olarak buraya kritik anlık yöneticileri uyaran SMS/Telegram fallback alert eklenebilir!
    try {
      const { sendTelegramNotification } = await import('@/lib/notifications');
      await sendTelegramNotification({
        name: "SYSTEM MONITOR",
        phone: "0000000000",
        message: `🚨 KRİTİK ALTYAPI ÇÖKÜŞ ALARMI 🚨\nSistem veritabanı bağlantısı koptu veya Supabase çöktü!\nHata: ${err.message}`
      });
    } catch (e) { console.error("Downtime notification error:", e); }

    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
