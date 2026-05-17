'use server'

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Service role ile yetki kısıtlaması olmadan işlem yapıyoruz
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Taslak ilanı yayına alır
 */
export async function approvePropertyAction(id: string, lang: string) {
  try {
    const { error } = await supabase
      .from('properties')
      .update({ status: 'aktif' })
      .eq('id', id);

    if (error) throw error;
    
    // Sayfayı sunucu tarafında yenileyerek verinin güncel gelmesini sağlıyoruz
    revalidatePath(`/${lang}/admin`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * İlanı veritabanından tamamen siler
 */
export async function deletePropertyAction(id: string, lang: string) {
  try {
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id);

    if (error) throw error;

    revalidatePath(`/${lang}/admin`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * İlan durumunu değiştirir (Aktif/Pasif)
 */
export async function togglePropertyStatusAction(id: string, currentStatus: string, lang: string) {
  try {
    const newStatus = currentStatus === 'aktif' ? 'pasif' : 'aktif';
    const { error } = await supabase
      .from('properties')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) throw error;

    revalidatePath(`/${lang}/admin`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Sistem ayarlarını günceller (SaaS Core)
 */
export async function updateSettingsAction(settings: { key: string, value: string }[], lang: string) {
  try {
    for (const setting of settings) {
      const { error } = await supabase
        .from('settings')
        .update({ value: setting.value })
        .eq('key', setting.key);
      
      if (error) throw error;
    }

    revalidatePath(`/${lang}/admin`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Yeni ilan oluşturur (Resim yükleme dahil - Adım 3 & 4)
 */
export async function createPropertyAction(formData: FormData, lang: string) {
  try {
    const title = formData.get('title') as string;
    let titleEn = formData.get('title_en') as string;
    let titleAr = formData.get('title_ar') as string;
    const price = parseInt(formData.get('price') as string);
    const district_id = formData.get('district_id') as string;
    const sqm = parseInt(formData.get('sqm') as string);
    const rooms = formData.get('rooms') as string;
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    let descEn = formData.get('description_en') as string;
    let descAr = formData.get('description_ar') as string;
    const type = formData.get('type') as string;
    const files = formData.getAll('images') as File[];

    const uploadedImages = [];

    // 1. Resimleri Storage'a Yükle
    for (const file of files) {
      if (file.size > 0) {
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
          .from('assets')
          .upload(`properties/${fileName}`, file);
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(data.path);
        uploadedImages.push(publicUrl);
      }
    }

    // 1.5 Otonom Çeviri (TR -> EN & AR) (Sadece manuel girilmediyse)
    if (!descEn || !descAr) {
      try {
        const { translateDescription } = await import('@/lib/ai');
        const [aiDescEn, aiDescAr] = await Promise.all([
          !descEn ? translateDescription(description, 'en') : Promise.resolve(descEn),
          !descAr ? translateDescription(description, 'ar') : Promise.resolve(descAr)
        ]);
        descEn = aiDescEn;
        descAr = aiDescAr;
      } catch (e) { console.error("Çeviri hatası:", e); }
    }

    // Başlıklar girilmediyse basit fallback
    if (!titleEn) titleEn = title;
    if (!titleAr) titleAr = title;

    // 2. Veritabanına Kaydet
    const { error } = await supabase.from('properties').insert([{
      title,
      title_en: titleEn,
      title_ar: titleAr,
      price,
      district_id,
      sqm,
      rooms,
      category,
      description,
      description_en: descEn,
      description_ar: descAr,
      status: 'aktif',
      images: uploadedImages,
      external_url: '' 
    }]);

    if (error) throw error;

    revalidatePath(`/${lang}/admin`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Quantum OS - AI Destekli Fiyat Analizi (Faz 4)
 */
export async function analyzePropertyPriceAction(propertyId: string) {
  try {
    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (error || !property) throw new Error('İlan bulunamadı.');

    const { analyzePriceWithAI } = await import('@/lib/ai');
    const result = await analyzePriceWithAI(property);

    return { success: true, result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Quantum OS - Pipeline (CRM) Verilerini Çeker (Faz 5)
 */
export async function getPipelineTransactionsAction() {
  try {
    // Tüm aktif ilanları ve bunların eğer varsa transaction verilerini alıyoruz
    const { data: properties, error: pError } = await supabase
      .from('properties')
      .select('id, title, price, district_id, status');

    if (pError) throw pError;

    // Transactions verilerini çekmeye çalışıyoruz
    let transactions: any[] = [];
    try {
      const { data: txData } = await supabase
        .from('transactions')
        .select('*');
      if (txData) transactions = txData;
    } catch (e) {
      console.warn("Transactions tablosu henüz göç ettirilmemiş olabilir, geçici olarak boş dönecek.");
    }

    // Her ilanı bir sürece eşliyoruz. Eğer transaction yoksa 'Sözleşme' (aktif ilan) durumundadır.
    const pipelineData = properties.map((p: any) => {
      const tx = transactions.find(t => t.property_id === p.id);
      return {
        id: p.id,
        title: p.title,
        price: p.price,
        district: p.district_id,
        status: tx ? tx.status : 'Sözleşme', // Varsayılan durum
        txId: tx ? tx.id : null,
        buyer_name: tx ? tx.buyer_name : '',
        buyer_phone: tx ? tx.buyer_phone : ''
      };
    });

    return { success: true, data: pipelineData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Quantum OS - Pipeline Durumunu Günceller (Faz 5)
 */
export async function updatePipelineStatusAction(propertyId: string, status: string, buyerName?: string, buyerPhone?: string) {
  try {
    // Önce bu ilan için var olan bir transaction var mı bakıyoruz
    let tx: any = null;
    try {
      const { data } = await supabase
        .from('transactions')
        .select('id')
        .eq('property_id', propertyId)
        .maybeSingle();
      tx = data;
    } catch (e) {
      // Eğer tablo yoksa hata fırlatıp kullanıcıya migration yapmasını söyleyelim
      throw new Error("Veritabanı tablosu 'transactions' bulunamadı. Lütfen supabase_migration_pipeline.sql dosyasını Supabase panelinde çalıştırın.");
    }

    if (tx) {
      // Güncelle
      const { error } = await supabase
        .from('transactions')
        .update({ 
          status,
          buyer_name: buyerName || null,
          buyer_phone: buyerPhone || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', tx.id);
      if (error) throw error;
    } else {
      // İlan detayını alalım
      const { data: prop } = await supabase
        .from('properties')
        .select('price')
        .eq('id', propertyId)
        .single();

      // Yeni oluştur
      const { error } = await supabase
        .from('transactions')
        .insert([{
          property_id: propertyId,
          status,
          price: prop ? prop.price : 0,
          buyer_name: buyerName || null,
          buyer_phone: buyerPhone || null
        }]);
      if (error) throw error;
    }

    // Eğer tapu aşamasına geldiyse otonom süreçleri (WhatsApp vb.) tetiklemek için bir not dönebiliriz
    let otonomMesaj = "";
    if (status === 'Tapu') {
      otonomMesaj = `https://wa.me/${buyerPhone || ''}?text=${encodeURIComponent(
        `Merhaba ${buyerName || 'Müşterimiz'}, Kaynak Gayrimenkul tapu süreciniz başlamıştır. Yanınızda bulunması gereken evraklar: 1- Kimlik Aslı, 2- DASK Poliçesi, 3- Borcu Yoktur Belgesi.`
      )}`;
    }

    revalidatePath('/admin/pipeline');
    return { success: true, otonomMesaj };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Quantum OS - Danışman KPI ve Risk Analizini Çeker (Faz 5)
 */
export async function getAgentKPIsAction() {
  try {
    // Tüm danışmanları çek
    const { data: advisors, error: aError } = await supabase
      .from('advisors')
      .select('id, name, title');
    
    if (aError) throw aError;

    // Tüm leads verilerini çek
    const { data: allLeads } = await supabase
      .from('leads')
      .select('id, score, agent_id');

    // Tüm transactions verilerini çek
    let allTx: any[] = [];
    try {
      const { data } = await supabase
        .from('transactions')
        .select('*');
      if (data) allTx = data;
    } catch(e) {}

    const kpiData = advisors.map((adv: any) => {
      const advLeads = allLeads?.filter(l => l.agent_id === adv.id) || [];
      const advTx = allTx?.filter(t => t.agent_id === adv.id) || [];
      
      const totalLeads = advLeads.length;
      const averageLeadScore = totalLeads > 0 
        ? Math.round(advLeads.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalLeads)
        : 0;

      const totalSales = advTx.filter(t => t.status === 'Tamamlandı').length;
      const totalVolume = advTx.filter(t => t.status === 'Tamamlandı')
        .reduce((acc, curr) => acc + Number(curr.price || 0), 0);

      const activeDeals = advTx.filter(t => t.status !== 'Tamamlandı' && t.status !== 'İptal').length;

      // Risk Analizi Vizyonu: Müşteri lead puanları çok yüksek ama satış yoksa "Risk" uyarısı ver.
      let riskWarning = "";
      if (averageLeadScore > 75 && totalSales === 0 && totalLeads > 5) {
        riskWarning = "Müşteri potansiyeli çok yüksek (Ort. Skor > 75) fakat satış kapatma oranı sıfır. Satış koçluğu desteği önerilir.";
      } else if (totalLeads === 0) {
        riskWarning = "Bu ay hiç lead almadı. Saha aktivitesi veya portal dağıtımı kontrol edilmeli.";
      }

      return {
        id: adv.id,
        name: adv.name,
        title: adv.title,
        totalLeads,
        averageLeadScore,
        totalSales,
        totalVolume,
        activeDeals,
        riskWarning
      };
    });

    return { success: true, data: kpiData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


