/**
 * Kaynak Gayrimenkul - Production Rate Limiter
 * Bellek tabanlı, IP başına istek sınırlama.
 * Herhangi bir Redis veya harici servis gerektirmez.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number; // Unix timestamp (ms)
}

// Sunucu belleğinde tutulan istek sayacı
const store = new Map<string, RateLimitEntry>();

// Bellek sızıntısını önlemek için eski kayıtları periyodik temizle
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 60_000); // Her 60 saniyede bir temizle

export interface RateLimitConfig {
  /** Pencere süresi (saniye) */
  windowSeconds: number;
  /** Penceredeki maksimum istek sayısı */
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * IP adresi ve rota bazında istek sınırlama kontrolü yapar.
 * @param ip      - İstemci IP adresi
 * @param route   - Route tanımlayıcı (örn. "negotiate")
 * @param config  - Limit konfigürasyonu
 */
export function checkRateLimit(
  ip: string,
  route: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${ip}:${route}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // İlk istek veya pencere sıfırlanmış
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + windowMs };
  }

  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
}

/**
 * Rate limit konfigürasyonları — tüm public AI endpointleri için merkezi tanım
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  negotiate:          { windowSeconds: 60, maxRequests: 10 },
  personalizedOffer:  { windowSeconds: 60, maxRequests: 5  },
  evaluate:           { windowSeconds: 60, maxRequests: 10 },
  lead:               { windowSeconds: 60, maxRequests: 5  },
  socialPost:         { windowSeconds: 60, maxRequests: 10 },
};

/**
 * Next.js Request'ten IP adresini güvenli şekilde okur.
 * Cloudflare, Netlify ve doğrudan bağlantıları destekler.
 */
export function getClientIP(request: Request): string {
  const headers = new Headers((request as any).headers);
  return (
    headers.get('cf-connecting-ip') ??       // Cloudflare
    headers.get('x-real-ip') ??              // Nginx/Netlify
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??  // Proxy zinciri
    '0.0.0.0'
  );
}
