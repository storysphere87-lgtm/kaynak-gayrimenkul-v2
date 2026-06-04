import dns from 'dns';

// Node.js'e IPv4'ü tercih ettir — IPv6 route'larındaki bağlantı zaman aşımı sorununu önler
dns.setDefaultResultOrder('ipv4first');

/**
 * Kaynak Gayrimenkul - Merkezi AI Gateway
 *
 * Tüm yapay zeka çağrıları bu modül üzerinden geçer.
 * Sorumlulukları:
 *  1. API key ve provider ayarlarını tek seferlik okur (in-memory TTL cache)
 *  2. Gemini REST API çağrılarını standardize eder
 *  3. Model adını merkezi .env değişkeninden okur
 *  4. Hata yönetimi ve timeout'u tek noktada yönetir
 */

// ─── Tip Tanımları ────────────────────────────────────────────────────────────

export type AIProvider = 'gemini' | 'grok';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
}

export interface GeminiSchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: GeminiSchemaProperty;
  properties?: Record<string, GeminiSchemaProperty>;
  required?: string[];
}

export interface GeminiJsonSchema {
  type: 'OBJECT' | 'ARRAY' | 'STRING' | 'NUMBER' | 'BOOLEAN';
  properties?: Record<string, GeminiSchemaProperty>;
  required?: string[];
  items?: GeminiJsonSchema;
}

// ─── In-Memory Cache ─────────────────────────────────────────────────────────

interface CachedConfig {
  config: AIConfig | null;
  expiresAt: number;
}

let configCache: CachedConfig = { config: null, expiresAt: 0 };
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 dakika

/**
 * AI yapılandırmasını döndürür.
 * İlk çağrıda Supabase'den okur, sonraki çağrılarda bellekten döner.
 */
export async function getAIConfig(): Promise<AIConfig | null> {
  const now = Date.now();

  if (configCache.config && configCache.expiresAt > now) {
    return configCache.config;
  }

  // .env'deki doğrudan değerler en hızlı ve güvenli yol
  const envKey = process.env.GEMINI_API_KEY?.trim();
  if (envKey) {
    const config: AIConfig = { provider: 'gemini', apiKey: envKey };
    configCache = { config, expiresAt: now + CACHE_TTL_MS };
    return config;
  }

  // Fallback: Supabase settings tablosundan oku (sadece env key yoksa)
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: settings } = await supabase.from('settings').select('key, value');

    const provider = (settings?.find(s => s.key === 'ai_provider')?.value ?? 'gemini') as AIProvider;
    const apiKey   =  settings?.find(s => s.key === 'ai_api_key')?.value?.trim() ?? '';

    if (!apiKey) {
      configCache = { config: null, expiresAt: now + CACHE_TTL_MS };
      return null;
    }

    const config: AIConfig = { provider, apiKey };
    configCache = { config, expiresAt: now + CACHE_TTL_MS };
    return config;
  } catch (err) {
    console.error('[AI Gateway] Yapılandırma okunamadı:', err);
    return null;
  }
}

/**
 * Cache'i manuel olarak geçersiz kılar.
 * Settings tablosundan yapılandırma değiştirildiğinde çağrılabilir.
 */
export function invalidateAIConfigCache() {
  configCache = { config: null, expiresAt: 0 };
}

// ─── Gemini API Çağrı Motoru ─────────────────────────────────────────────────

/** Kullanılacak Gemini model adı. .env'den okunur, varsayılan: gemini-2.5-flash */
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

/** API isteği zaman aşımı: 30 saniye */
const FETCH_TIMEOUT_MS = 30_000;

/**
 * Gemini API'ye prompt gönderir ve ham metin yanıtı döndürür.
 *
 * @param prompt  - Kullanıcıya gönderilecek prompt
 * @param config  - getAIConfig() ile alınan yapılandırma
 * @param schema  - Opsiyonel: JSON Schema ile yapılandırılmış yanıt
 */
export async function callGemini(
  prompt: string,
  config: AIConfig,
  schema?: GeminiJsonSchema
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${config.apiKey}`;

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  if (schema) {
    body.generationConfig = {
      responseMimeType: 'application/json',
      responseSchema: schema,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Gemini API hatası [${response.status}]: ${errBody}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Grok API'ye prompt gönderir ve ham metin yanıtı döndürür.
 */
export async function callGrok(prompt: string, config: AIConfig): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Grok API hatası [${response.status}]: ${errBody}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ?? '';
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Provider'a göre doğru AI fonksiyonunu çağırır.
 * Tüm AI rotaları bu tek fonksiyonu kullanır.
 *
 * @param prompt  - Kullanıcıya gönderilecek prompt
 * @param schema  - Opsiyonel JSON Schema (yalnızca Gemini için)
 * @returns Ham metin yanıtı veya null (yapılandırma yoksa)
 */
export async function callAI(
  prompt: string,
  schema?: GeminiJsonSchema
): Promise<string | null> {
  const config = await getAIConfig();
  if (!config) return null;

  if (config.provider === 'gemini') return callGemini(prompt, config, schema);
  if (config.provider === 'grok')   return callGrok(prompt, config);
  return null;
}

/**
 * JSON yanıtı güvenli şekilde parse eder.
 * Markdown kod blokları ve fazla boşlukları temizler.
 */
export function safeParseJSON<T>(text: string, fallback: T): T {
  try {
    const cleaned = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}
