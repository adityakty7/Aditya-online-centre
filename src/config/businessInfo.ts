export interface SocialLinkItem {
  key: 'facebook' | 'instagram' | 'twitter' | 'youtube' | 'telegram' | 'linkedin';
  labelEn: string;
  labelHi: string;
  url: string;
}

export interface BusinessInfoConfig {
  businessName: string;
  businessNameHi: string;
  serviceAreaEn: string;
  serviceAreaHi: string;
  phone: string; // Empty string if not provided yet
  whatsappNumber: string;
  whatsappDisplay: string;
  whatsappUrl: string;
  email: string;
  mailtoUrl: string;
  addressEn: string;
  addressHi: string;
  workingDaysEn: string;
  workingDaysHi: string;
  workingHoursEn: string; // Empty string if not provided yet
  workingHoursHi: string; // Empty string if not provided yet
  socialLinks: SocialLinkItem[];
}

export const BUSINESS_INFO: BusinessInfoConfig = {
  businessName: 'Aditya Online Center',
  businessNameHi: 'आदित्य ऑनलाइन सेंटर',
  serviceAreaEn: 'Kateya, Gopalganj, Bihar, India',
  serviceAreaHi: 'कटेया, गोपालगंज, बिहार, भारत',
  phone: '', // Not provided yet
  whatsappNumber: '6206800799',
  whatsappDisplay: '+91 62068 00799',
  whatsappUrl: 'https://wa.me/916206800799',
  email: 'Adityakty77@gmail.com',
  mailtoUrl: 'mailto:Adityakty77@gmail.com',
  addressEn: 'Kateya, Gopalganj, Bihar, India',
  addressHi: 'कटेया, गोपालगंज, बिहार, भारत',
  workingDaysEn: 'Monday to Saturday',
  workingDaysHi: 'सोमवार से शनिवार',
  workingHoursEn: '', // Not provided yet
  workingHoursHi: '', // Not provided yet
  socialLinks: [
    {
      key: 'facebook',
      labelEn: 'Facebook',
      labelHi: 'फेसबुक (Facebook)',
      url: 'https://www.facebook.com/Adityakty77',
    },
    {
      key: 'instagram',
      labelEn: 'Instagram',
      labelHi: 'इंस्टाग्राम (Instagram)',
      url: 'https://www.instagram.com/aditya_kty45?exln=bzNpNjE3aGN2NXNn',
    },
    {
      key: 'twitter',
      labelEn: 'X / Twitter',
      labelHi: 'एक्स / ट्विटर',
      url: '', // Not provided
    },
    {
      key: 'youtube',
      labelEn: 'YouTube',
      labelHi: 'यूट्यूब',
      url: '', // Not provided
    },
    {
      key: 'telegram',
      labelEn: 'Telegram',
      labelHi: 'टेलीग्राम',
      url: '', // Not provided
    },
    {
      key: 'linkedin',
      labelEn: 'LinkedIn',
      labelHi: 'लिंक्डइन',
      url: '', // Not provided
    },
  ],
};

export function getActiveSocialLinks(): SocialLinkItem[] {
  return BUSINESS_INFO.socialLinks.filter((item) => item.url.trim().length > 0);
}
