/**
 * Quantum OS - vCard Generator
 * Danışman bilgilerini telefon rehberine kaydedilebilir .vcf formatına dönüştürür.
 */
export function generateVCard(agent: {
  name: string;
  phone: string;
  email: string;
  title: string;
  url: string;
}): string {
  // Parçalanmış isim (Basitçe ilk boşluktan böler)
  const nameParts = agent.name.split(' ');
  const lastName = nameParts.pop() || '';
  const firstName = nameParts.join(' ') || agent.name;

  return `BEGIN:VCARD
VERSION:3.0
N:${lastName};${firstName};;;
FN:${agent.name}
ORG:Kaynak Gayrimenkul
TITLE:${agent.title}
TEL;TYPE=CELL:${agent.phone}
EMAIL;TYPE=WORK:${agent.email}
URL:${agent.url}
NOTE:Kaynak Gayrimenkul Lüks Konut Uzmanı - Quantum OS Dijital Kartviziti
END:VCARD`;
}
