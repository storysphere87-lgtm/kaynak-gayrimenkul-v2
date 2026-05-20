import { supabase } from './supabase';

/**
 * Quantum OS - Hata ve API Log Yönetim Sistemi (Faz 3)
 * Tüm giden ve gelen API çağrılarının sürelerini ve durumlarını asenkron olarak saklar.
 */
export async function logApiCall(params: {
  endpoint: string;
  status: 'success' | 'error';
  statusCode?: number;
  errorMessage?: string;
  durationMs: number;
}) {
  try {
    // Performans kaybını önlemek için asenkron olarak arka planda kaydeder
    supabase
      .from('api_logs')
      .insert([{
        endpoint: params.endpoint,
        status: params.status,
        status_code: params.statusCode || null,
        error_message: params.errorMessage || null,
        duration_ms: params.durationMs,
        created_at: new Date().toISOString()
      }])
      .then(({ error }) => {
        if (error) {
          console.error("API Log kaydedilemedi (Supabase hatası):", error.message);
        }
      });
  } catch (err: any) {
    console.error("API Log hatası:", err.message);
  }
}
