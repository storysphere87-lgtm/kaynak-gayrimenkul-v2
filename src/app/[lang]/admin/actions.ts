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
    // 1. Önce profiles (gerçek kullanıcı/danışman) tablosunu deneyelim, yoksa advisors'ı deneyelim
    let advisors: any[] = [];
    
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, full_name, role');
      
    if (!pError && profiles && profiles.length > 0) {
      advisors = profiles.map(p => ({
        id: p.id,
        name: p.full_name || 'İsimsiz Danışman',
        title: p.role === 'admin' ? 'Broker / Yönetici' : 'Lüks Konut Uzmanı'
      }));
    } else {
      // Fallback to advisors table
      const { data: advList, error: aError } = await supabase
        .from('advisors')
        .select('id, name, title');
      
      if (!aError && advList) {
        advisors = advList;
      }
    }

    // Eğer sistemde hiç danışman yoksa varsayılan bir broker gösterelim (Boş kalmaması için)
    if (advisors.length === 0) {
      advisors = [{
        id: '00000000-0000-0000-0000-000000000000',
        name: 'Kaynak Gayrimenkul Broker',
        title: 'Broker / Kurucu'
      }];
    }

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
      
      // Eğer tek bir broker varsa ve agent_id eşleşmesi yoksa, tüm datayı broker'a atayalım (Başlangıç dostu)
      const matches = advLeads.length > 0 || advTx.length > 0;
      const finalLeads = (!matches && advisors.length === 1) ? (allLeads || []) : advLeads;
      const finalTx = (!matches && advisors.length === 1) ? allTx : advTx;

      const totalLeads = finalLeads.length;
      const averageLeadScore = totalLeads > 0 
        ? Math.round(finalLeads.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalLeads)
        : 0;

      const totalSales = finalTx.filter(t => t.status === 'Tamamlandı').length;
      const totalVolume = finalTx.filter(t => t.status === 'Tamamlandı')
        .reduce((acc, curr) => acc + Number(curr.price || 0), 0);

      const activeDeals = finalTx.filter(t => t.status !== 'Tamamlandı' && t.status !== 'İptal').length;

      // Risk Analizi
      let riskWarning = "";
      if (averageLeadScore > 75 && totalSales === 0 && totalLeads > 5) {
        riskWarning = "Müşteri potansiyeli çok yüksek (Ort. Skor > 75) fakat satış kapatma oranı sıfır. Yakın takip desteği önerilir.";
      } else if (totalLeads === 0) {
        riskWarning = "Bu dönem aktif lead almadı. Portal ilanları veya saha aktivitesi kontrol edilmeli.";
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

/**
 * Tüm kullanıcı profillerini çeker (Broker/Admin yetkisiyle)
 */
export async function getAllProfilesAction() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Broker'ın yeni bir danışman (agent) oluşturmasını sağlar (Otonom e-posta doğrulama onaylı)
 */
export async function createAdvisorAction(email: string, password: string, fullName: string, phone: string, role: 'admin' | 'agent' = 'agent') {
  try {
    // 1. Auth tablosunda kullanıcı oluştur (email_confirm: true ile aktivasyon gerekmez!)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        full_name: fullName
      }
    });

    if (authError) throw authError;

    if (authData?.user) {
      // 2. Profiles tablosuna (trigger oluşturmuş olsa da telefon gibi bilgileri eklemek için) upsert yapalım
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          role,
          full_name: fullName,
          phone
        });

      if (profileError) throw profileError;
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Danışman profil bilgilerini günceller (Admin veya kullanıcının kendisi yapabilir)
 */
export async function updateAdvisorAction(id: string, fullName: string, phone: string, role: 'admin' | 'agent', email?: string) {
  try {
    // 1. Profil tablosunu güncelle
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone,
        role
      })
      .eq('id', id);

    if (profileError) throw profileError;

    // 2. Eğer email adresi de güncellenmek istendiyse auth.users tablosunda güncelle
    if (email) {
      const { error: authError } = await supabase.auth.admin.updateUserById(id, {
        email,
        email_confirm: true, // E-posta aktivasyon beklemesini devre dışı bırakıp doğrudan doğrular
        user_metadata: {
          role,
          full_name: fullName
        }
      });
      if (authError) throw authError;
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Danışmanı sistemden ve auth tablosundan tamamen siler (Broker yetkisiyle)
 */
export async function deleteAdvisorAction(id: string) {
  try {
    // Auth kullanıcısını sildiğimizde, cascading foreign key'ler sayesinde profil ve ilişkili bağımlılıklar otomatik silinir
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Danışmanın şifresini sıfırlar / değiştirir (Broker yetkisiyle veya kullanıcının kendisi)
 */
export async function resetAdvisorPasswordAction(id: string, newPassword: string) {
  try {
    const { error } = await supabase.auth.admin.updateUserById(id, {
      password: newPassword
    });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Kullanıcının kendi şifresini değiştirir (Admin API ile — service role gerektirir)
 */
export async function changeMyPasswordAction(userId: string, newPassword: string) {
  try {
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Şifre en az 6 karakter olmalıdır.' };
    }
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    });
    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Kullanıcı rolünü düzeltir — hem JWT metadata hem profiles tablosunu günceller
 * 'Doğru şifre ama giriş yapılamıyor' sorununu kalıcı çözer
 */
export async function fixUserRoleAction(
  userId: string,
  role: 'admin' | 'agent' = 'agent',
  fullName?: string
) {
  try {
    // 1. profiles tablosunu upsert et
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({ id: userId, role, full_name: fullName || 'Danışman' });
    if (profileError) throw profileError;

    // 2. Auth user_metadata güncelle
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role, full_name: fullName || 'Danışman' }
    });
    if (authError) throw authError;

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
