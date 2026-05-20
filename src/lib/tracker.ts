/**
 * Quantum OS - Yerel Davranış Profilleme Motoru (Faz 5.7)
 * Alıcının hangi bölgelere baktığını, bütçe yoğunluğunu ve dijital ayak izini profiller.
 */

export interface UserBehaviorProfile {
  viewedProperties: { id: string; price: number; district: string }[];
  preferredDistricts: { [key: string]: number };
  averageBudget: number;
  totalViews: number;
  highestPriceViewed: number;
}

const STORAGE_KEY = 'quantum_behavior_profile';

export function trackPropertyVisit(property: { id: string; price: number; district: string }) {
  if (typeof window === 'undefined') return;

  // Yasal KVKK Kontrolü (GDPR Compliance)
  const consent = localStorage.getItem('quantum_cookie_consent');
  if (consent !== 'all') return; // İzin yoksa izlemeyi durdur

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let profile: UserBehaviorProfile = raw 
      ? JSON.parse(raw) 
      : { viewedProperties: [], preferredDistricts: {}, averageBudget: 0, totalViews: 0, highestPriceViewed: 0 };

    // Ziyaret edilen mülkü ekleyelim (Eğer listede zaten yoksa)
    const exists = profile.viewedProperties.some(p => p.id === property.id);
    if (!exists) {
      profile.viewedProperties.push(property);
    }

    profile.totalViews += 1;

    // Bölge yoğunluğunu güncelleyelim
    const dist = property.district || 'Diger';
    profile.preferredDistricts[dist] = (profile.preferredDistricts[dist] || 0) + 1;

    // En yüksek fiyatı güncelleyelim
    if (property.price > profile.highestPriceViewed) {
      profile.highestPriceViewed = property.price;
    }

    // Ortalama bütçeyi güncelleyelim
    const totalPrices = profile.viewedProperties.reduce((acc, curr) => acc + curr.price, 0);
    profile.averageBudget = Math.round(totalPrices / profile.viewedProperties.length);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Quantum Tracker Hatası:', e);
  }
}

export function getUserBehaviorProfile(): UserBehaviorProfile | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}
