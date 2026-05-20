import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { buyerName, buyerPhone, sellerName, sellerPhone, price, propertyTitle, district } = body;

    const formattedPrice = Number(price || 0).toLocaleString('tr-TR');
    const today = new Date().toLocaleDateString('tr-TR');

    // MS Word/HTML formatında gerçek yasal maddelerle dolu lüks sözleşme taslağı
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Gayrimenkul Alım Satım ve Aracılık Sözleşmesi</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; line-height: 1.6; color: #1a1a1a; padding: 40px; }
          h1 { text-align: center; color: #b3862b; font-size: 20pt; margin-bottom: 30px; font-weight: bold; text-transform: uppercase; }
          h2 { color: #1a1a1a; font-size: 14pt; border-bottom: 2px solid #b3862b; padding-bottom: 5px; margin-top: 30px; text-transform: uppercase; }
          .party-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .party-table td { border: 1px solid #d3d3d3; padding: 12px; font-size: 11pt; }
          .party-header { background-color: #f9f9f9; font-weight: bold; color: #b3862b; width: 25%; }
          .article { margin-bottom: 20px; font-size: 11pt; text-align: justify; }
          .article-title { font-weight: bold; display: block; margin-bottom: 5px; }
          .signature-section { width: 100%; margin-top: 60px; border-collapse: collapse; }
          .signature-section td { width: 33%; text-align: center; font-size: 11pt; padding-top: 50px; }
          .footer-note { text-align: center; font-size: 9pt; color: #7f8c8d; margin-top: 80px; border-top: 1px solid #e0e0e0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <h1>GAYRİMENKUL ALIM SATIM VE ARACILIK SÖZLEŞMESİ</h1>
        <p style="text-align: right; font-weight: bold;">Tarih: ${today}</p>
        
        <h2>1. TARAFLAR</h2>
        <table class="party-table">
          <tr>
            <td class="party-header">SATICI</td>
            <td><strong>İsim / Unvan:</strong> ${sellerName || 'Kaynak Gayrimenkul Portföy Sahibi'}<br/><strong>Telefon:</strong> ${sellerPhone || 'Belirtilmedi'}</td>
          </tr>
          <tr>
            <td class="party-header">ALICI</td>
            <td><strong>İsim / Unvan:</strong> ${buyerName || 'Belirtilmedi'}<br/><strong>Telefon:</strong> ${buyerPhone || 'Belirtilmedi'}</td>
          </tr>
          <tr>
            <td class="party-header">ARACI KURUM</td>
            <td><strong>İsim:</strong> Kaynak Gayrimenkul A.Ş.<br/><strong>Adres:</strong> Ahi Mesut Mah. 1905. Sokak Etimesgut / Ankara</td>
          </tr>
        </table>

        <h2>2. SÖZLEŞME KONUSU GAYRİMENKUL</h2>
        <p class="article">Ankara ili, <strong>${district || 'Etimesgut'}</strong> ilçesi sınırları dahilinde yer alan ve tapuda <strong>${propertyTitle || 'Lüks Konut'}</strong> niteliğiyle kayıtlı bulunan taşınmazın alım, satım ve aracılık şartlarının belirlenmesidir.</p>

        <h2>3. ANLAŞMA BEDELİ VE ÖDEME KOŞULLARI</h2>
        <div class="article">
          <span class="article-title">Madde 3.1:</span>
          Taraflar, sözleşme konusu taşınmazın toplam satış bedeli üzerinde <strong>₺${formattedPrice}</strong> (Türk Lirası) olarak mutabakata varmışlardır.
        </div>
        <div class="article">
          <span class="article-title">Madde 3.2:</span>
          Satış bedelinin ödenmesi, Tapu Müdürlüğü'nde tescil işleminin gerçekleştirilmesi ile eş zamanlı olarak (Bloke Çek veya Güvenli Ödeme Sistemi ile) yapılacaktır.
        </div>

        <h2>4. HAK VE YÜKÜMLÜLÜKLER</h2>
        <div class="article">
          <span class="article-title">Madde 4.1:</span>
          Satıcı, gayrimenkul üzerinde herhangi bir haciz, ipotek, şerh veya hukuki takyidat bulunmadığını, taşınmazı tüm borçlarından ari olarak teslim edeceğini beyan ve taahhüt eder.
        </div>
        <div class="article">
          <span class="article-title">Madde 4.2:</span>
          Alıcı, tapu harçları ve yasal masrafların mevzuata uygun şekilde taraflarca ödenmesini kabul eder. Aracı kurum hizmet bedeli (komisyon) her iki taraftan da %2 + KDV oranında tahsil edilecektir.
        </div>

        <h2>5. UYUŞMAZLIKLARIN ÇÖZÜMÜ</h2>
        <div class="article">
          <span class="article-title">Madde 5.1:</span>
          Bu sözleşmeden doğabilecek her türlü ihtilafın çözümünde Ankara Mahkemeleri ve İcra Daireleri yetkilidir.
        </div>

        <table class="signature-section">
          <tr>
            <td><strong>SATICI IMZASI</strong><br/><br/><br/>__________________</td>
            <td><strong>ARACI KURUM (KAYNAK)</strong><br/><br/><br/>__________________</td>
            <td><strong>ALICI IMZASI</strong><br/><br/><br/>__________________</td>
          </tr>
        </table>

        <div class="footer-note">
          Bu sözleşme Quantum OS Otonom Sözleşme Altyapısı tarafından yasal standartlara uygun olarak üretilmiştir.
        </div>
      </body>
      </html>
    `;

    // Tarayıcıya .doc dosyası olarak indirtme komutu gönderir (Word uyumlu)
    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'application/msword',
        'Content-Disposition': `attachment; filename="gayrimenkul_satis_sozlesmesi_${today.replace(/\./g, '_')}.doc"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
