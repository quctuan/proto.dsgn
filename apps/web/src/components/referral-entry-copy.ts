export const referralEntryCopy: Record<string, readonly [string, string]> = {
  'zh-CN': ['邀请好友获重置卡', '首订后，双方各得 1 张'],
  'zh-TW': ['邀請好友獲得重設卡', '首次訂閱後，雙方各得 1 張'],
  id: ['Bagikan proto.dsgn', 'Dapatkan kartu reset'],
  fa: ['proto.dsgn را به اشتراک بگذارید', 'کارت بازنشانی بگیرید'],
  ar: ['شارك proto.dsgn', 'احصل على بطاقات إعادة الضبط'],
  pl: ['Udostępnij proto.dsgn', 'Zdobądź karty resetowania'],
  hu: ['Oszd meg az OpenDesignt', 'Szerezz visszaállító kártyákat'],
  uk: ['Поділіться proto.dsgn', 'Отримуйте картки скидання'],
  tr: ['proto.dsgn’ı paylaş', 'Sıfırlama kartları kazan'],
  th: ['แชร์ proto.dsgn', 'รับการ์ดรีเซ็ต'],
  it: ['Condividi proto.dsgn', 'Ottieni carte di ripristino'],
  en: ['Share proto.dsgn', 'Earn reset cards'],
  pt: ['Partilhe proto.dsgn', 'Ganhe cartões reset'],
  es: ['Comparte proto.dsgn', 'Gana tarjetas reset'],
  ru: ['Делись proto.dsgn', 'Получи карту сброса'],
  fr: ['Partager proto.dsgn', 'Cartes reset offertes'],
  ko: ['proto.dsgn 공유', '초대로 초기화 카드'],
  de: ['proto.dsgn teilen', 'Reset-Karten erhalten'],
  ja: ['proto.dsgnを共有', '紹介でリセットカード'],
};
export function getReferralEntryCopy(locale: string): readonly [string, string] {
  return referralEntryCopy[locale] ?? referralEntryCopy[locale.split('-')[0] ?? ''] ?? ['Share proto.dsgn', 'Earn reset cards'];
}
