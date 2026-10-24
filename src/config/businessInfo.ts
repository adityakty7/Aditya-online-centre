export interface SocialLinkItem {
  key: 'facebook' | 'instagram' | 'twitter' | 'youtube' | 'telegram' | 'linkedin';
  labelEn: string;
  labelHi: string;
  url: string;
}

export const BRAND_IDENTITY = {
  brandName: 'ADITYA ONLINE CENTER',
  displayNameEn: 'Aditya Online Center',
  displayNameHi: 'आदित्य ऑनलाइन सेंटर',
  taglineEn: 'Your Digital World, Simplified.',
  taglineHi: 'आपकी डिजिटल दुनिया, अब और सरल।',
  logoUrl: '/assets/aistudio/Aditya_Online_Center_Logo_Transparent_59adeda5.png',
  faviconSvgUrl: '/favicon.svg',
  colors: {
    charcoalBlack: '#101014',
    neonEmberOrange: '#FF5C35',
    amberGold: '#FFB547',
    metallicSilver: '#D4D8E2',
    warmCream: '#F7F3EA',
  },
} as const;

export interface BusinessInfoConfig {
  businessName: string;
  businessNameUpper: string;
  businessNameHi: string;
  taglineEn: string;
  taglineHi: string;
  logoUrl: string;
  faviconSvgUrl: string;
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
  workingHoursEn: string;
  workingHoursHi: string;
  googleMapsUrl: string;
  socialLinks: SocialLinkItem[];
}

export const BUSINESS_INFO: BusinessInfoConfig = {
  businessName: 'Aditya Online Center',
  businessNameUpper: BRAND_IDENTITY.brandName,
  businessNameHi: 'आदित्य ऑनलाइन सेंटर',
  taglineEn: BRAND_IDENTITY.taglineEn,
  taglineHi: BRAND_IDENTITY.taglineHi,
  logoUrl: BRAND_IDENTITY.logoUrl,
  faviconSvgUrl: BRAND_IDENTITY.faviconSvgUrl,
  serviceAreaEn: 'Kateya, Gopalganj, Bihar, India',
  serviceAreaHi: 'कटेया, गोपालगंज, बिहार, भारत',
  phone: '', // Not provided yet
  whatsappNumber: '6206800799',
  whatsappDisplay: '+91 62068 00799',
  whatsappUrl: 'https://wa.me/916206800799',
  email: 'Adityakty77@gmail.com',
  mailtoUrl: 'mailto:Adityakty77@gmail.com',
  addressEn:
    'Ward No. 08, Near G.A. High School / Nagar Panchayat, Kateya, Gopalganj (PIN 841437)',
  addressHi:
    'वार्ड नं. 08, जी.ए. हाई स्कूल / नगर पंचायत के पास, कटेया, गोपालगंज (पिन 841437)',
  workingDaysEn: 'Monday to Saturday (8:00 AM – 8:00 PM)',
  workingDaysHi: 'सोमवार से शनिवार (सुबह 8:00 – रात 8:00 बजे)',
  workingHoursEn: '8:00 AM – 8:00 PM',
  workingHoursHi: 'सुबह 8:00 बजे – रात 8:00 बजे',
  googleMapsUrl:
    'https://www.google.com/maps/dir/?api=1&destination=G.A.+High+School+Ward+No+08+Kateya+Gopalganj+Bihar+841437',
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
