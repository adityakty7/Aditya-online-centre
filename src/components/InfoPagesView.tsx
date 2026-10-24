import React from 'react';
import {
  AppView,
  CenterSettings,
  Language,
  ShopTimeSlotKey,
  ShopVisitToken,
} from '../types';
import {
  BRAND_IDENTITY,
  BUSINESS_INFO,
  getActiveSocialLinks,
  SocialLinkItem,
} from '../config/businessInfo';
import { BrandLogo } from './BrandLogo';
import {
  SHOP_TIME_SLOTS,
  buildShopTokenWhatsAppUrl,
  generateShopVisitTokenNumber,
  sanitizeString,
  validateContactMessageInput,
  validateShopVisitTokenInput,
} from '../utils/rules';
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  Globe,
  Shield,
  FileText,
  Smartphone,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Send,
  ArrowLeft,
  Ticket,
  Clock,
  Download,
  Printer,
} from 'lucide-react';

export interface ContactSubmissionPayload {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  orderId: string;
  preferredLanguage: Language;
}

interface InfoPagesViewProps {
  mode: 'contact' | 'privacy' | 'terms';
  lang: Language;
  settings: CenterSettings;
  onNavigate: (view: AppView) => void;
  onSubmitContactMessage: (payload: ContactSubmissionPayload) => Promise<string>;
}

function renderSocialIcon(key: SocialLinkItem['key']) {
  if (key === 'facebook') {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="w-4 h-4 fill-current shrink-0"
      >
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
      </svg>
    );
  }
  if (key === 'instagram') {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="w-4 h-4 fill-current shrink-0"
      >
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    );
  }
  return <Globe className="w-4 h-4 shrink-0" />;
}

export const InfoPagesView: React.FC<InfoPagesViewProps> = ({
  mode,
  lang,
  onNavigate,
  onSubmitContactMessage,
}) => {
  const [contactName, setContactName] = React.useState('');
  const [contactPhone, setContactPhone] = React.useState('');
  const [contactEmail, setContactEmail] = React.useState('');
  const [contactSubject, setContactSubject] = React.useState('');
  const [contactMessage, setContactMessage] = React.useState('');
  const [contactOrderId, setContactOrderId] = React.useState('');
  const [preferredLanguage, setPreferredLanguage] =
    React.useState<Language>(lang);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [savedMessageId, setSavedMessageId] = React.useState<string | null>(
    null
  );

  // Upgrade 5: In-Shop Priority Visit Token Booker State
  const [tokenCustomerName, setTokenCustomerName] = React.useState(
    'Ramesh Kumar'
  );
  const [tokenCustomerPhone, setTokenCustomerPhone] = React.useState(
    '9876543210'
  );
  const [tokenVisitDate, setTokenVisitDate] = React.useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [tokenTimeSlot, setTokenTimeSlot] =
    React.useState<ShopTimeSlotKey>('morning');
  const [tokenServiceType, setTokenServiceType] = React.useState(
    'Bihar Post-Matric Scholarship / Online Form'
  );
  const [tokenSequence, setTokenSequence] = React.useState(104);
  const [tokenError, setTokenError] = React.useState<string | null>(null);
  const [generatedToken, setGeneratedToken] =
    React.useState<ShopVisitToken | null>(() => {
      try {
        if (typeof window !== 'undefined') {
          const saved = window.localStorage.getItem('aoc_latest_shop_token');
          if (saved) return JSON.parse(saved) as ShopVisitToken;
        }
      } catch {
        // Ignore storage errors
      }
      return null;
    });

  const handleBookShopToken = (e: React.FormEvent) => {
    e.preventDefault();
    setTokenError(null);
    const check = validateShopVisitTokenInput({
      customerName: tokenCustomerName,
      customerPhone: tokenCustomerPhone,
      visitDate: tokenVisitDate,
      timeSlot: tokenTimeSlot,
      serviceType: tokenServiceType,
    });
    if (!check.valid) {
      setTokenError(lang === 'en' ? check.errorEn! : check.errorHi!);
      return;
    }

    const slotMeta =
      SHOP_TIME_SLOTS.find((s) => s.key === tokenTimeSlot) ||
      SHOP_TIME_SLOTS[0];
    const tokenNum = generateShopVisitTokenNumber(tokenSequence);
    const nextToken: ShopVisitToken = {
      tokenNumber: tokenNum,
      customerName: sanitizeString(tokenCustomerName, 80),
      customerPhone: sanitizeString(tokenCustomerPhone, 15),
      visitDate: tokenVisitDate,
      timeSlot: tokenTimeSlot,
      timeSlotLabelEn: slotMeta.labelEn,
      timeSlotLabelHi: slotMeta.labelHi,
      serviceType: sanitizeString(tokenServiceType, 120),
      createdAt: new Date().toISOString(),
    };
    setGeneratedToken(nextToken);
    setTokenSequence((prev) => prev + 1);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          'aoc_latest_shop_token',
          JSON.stringify(nextToken)
        );
      }
    } catch {
      // Ignore storage errors
    }
  };

  const handleDownloadTokenCard = (tok: ShopVisitToken) => {
    const canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0A0D12';
    ctx.fillRect(0, 0, 720, 420);
    ctx.strokeStyle = '#FF5C35';
    ctx.lineWidth = 4;
    ctx.strokeRect(14, 14, 692, 392);

    ctx.fillStyle = '#FFB547';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('ADITYA ONLINE CENTER · KATEYA PRIORITY VISIT TOKEN', 36, 54);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 46px monospace';
    ctx.fillText(tok.tokenNumber, 36, 112);

    ctx.fillStyle = '#10B981';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(
      `DATE: ${tok.visitDate}   |   SLOT: ${tok.timeSlotLabelEn}`,
      36,
      154
    );

    ctx.fillStyle = '#E2E8F0';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`Visitor: ${tok.customerName} (${tok.customerPhone})`, 36, 206);
    ctx.font = '18px sans-serif';
    ctx.fillText(`Service: ${tok.serviceType}`, 36, 244);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '14px sans-serif';
    ctx.fillText(
      'Location: Ward No. 08, Near G.A. High School / Nagar Panchayat, Kateya (841437)',
      36,
      320
    );
    ctx.fillStyle = '#FFB547';
    ctx.fillText('WhatsApp Support Desk: +91 6206800799', 36, 352);

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Aditya_Online_Center_Token_${tok.tokenNumber.replace('#', '')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  React.useEffect(() => {
    setPreferredLanguage(lang);
  }, [lang]);

  const activeSocialLinks = React.useMemo(() => getActiveSocialLinks(), []);

  if (mode === 'privacy') {
    return (
      <div className="bg-[#F7F3EA] min-h-screen">
        <section className="editorial-dark-grid text-[#F7F3EA] border-b border-[#272732] py-10 sm:py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4">
            <div className="inline-flex items-center gap-2 font-mono-tabular text-xs font-bold uppercase tracking-[0.2em] text-[#FF5C35]">
              <Shield className="w-4 h-4 text-[#FFB547]" />
              <span>
                {lang === 'en'
                  ? '06 // DATA ISOLATION & PRIVACY PROTOCOL'
                  : '06 // ग्राहक डेटा और दस्तावेज़ सुरक्षा'}
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F7F3EA] tracking-tight">
              {lang === 'en'
                ? 'Privacy Policy — Aditya Online Center'
                : 'गोपनीयता नीति — आदित्य ऑनलाइन सेंटर'}
            </h1>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
          <div className="border-t-2 border-b border-[#101014] divide-y divide-[#DCD4C6] text-sm text-[#4A463E] leading-relaxed">
            <div className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-3 font-mono-tabular text-xs font-bold uppercase text-[#C83713]">
                01 // COLLECTION
              </div>
              <div className="sm:col-span-9 text-[#101014]">
                {lang === 'en'
                  ? '1. Purpose of Data Collection: Aditya Online Center (Kateya, Gopalganj, Bihar, India) collects only the information and supporting documents strictly required to prepare your requested resume, biodata, PDF formatting, or online form application.'
                  : '1. डेटा संग्रह का उद्देश्य: आदित्य ऑनलाइन सेंटर (कटेया, गोपालगंज, बिहार, भारत) केवल वही जानकारी और दस्तावेज़ एकत्र करता है जो आपके द्वारा मांगे गए रिज्यूमे, बायोडाटा, PDF या ऑनलाइन फॉर्म को तैयार करने के लिए आवश्यक हैं।'}
              </div>
            </div>

            <div className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-3 font-mono-tabular text-xs font-bold uppercase text-[#C83713]">
                02 // PRIVATE VAULT
              </div>
              <div className="sm:col-span-9 text-[#101014]">
                {lang === 'en'
                  ? '2. 100% Private & Safe Document Vault: Uploaded files (marksheets, ID proofs, photos, and receipts) are protected under our Complete Data Privacy Guarantee. Customers can only view or download their own orders and files, and no documents are ever shared publicly.'
                  : '2. 100% सुरक्षित एवं गोपनीय दस्तावेज़ वॉल्ट: अपलोड की गई फ़ाइलें (मार्कशीट, फोटो, प्रमाणपत्र) पूर्ण डेटा गोपनीयता गारंटी के तहत सुरक्षित रहती हैं। कोई भी अन्य ग्राहक आपके दस्तावेज़ या ऑर्डर नहीं देख सकता।'}
              </div>
            </div>

            <div className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-3 font-mono-tabular text-xs font-bold uppercase text-[#C83713]">
                03 // ZERO SECRETS
              </div>
              <div className="sm:col-span-9 text-[#101014]">
                {lang === 'en'
                  ? '3. Zero Credential Storage: We NEVER ask for, collect, or store banking passwords, UPI PINs, or sensitive one-time passwords (OTPs) inside application records.'
                  : '3. पासवर्ड या पिन कभी नहीं मांगा जाता: हम कभी भी आपका बैंक पासवर्ड, UPI पिन या संवेदनशील OTP संग्रहीत नहीं करते हैं।'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="min-h-[44px] px-5 py-2.5 bg-[#101014] hover:bg-[#FF5C35] text-white text-xs font-mono-tabular uppercase tracking-wider font-bold transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {lang === 'en' ? 'Return to Home' : 'होम पेज पर वापस जाएं'}
            </span>
          </button>
        </section>
      </div>
    );
  }

  if (mode === 'terms') {
    return (
      <div className="bg-[#F7F3EA] min-h-screen">
        <section className="editorial-dark-grid text-[#F7F3EA] border-b border-[#272732] py-10 sm:py-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-4">
            <div className="inline-flex items-center gap-2 font-mono-tabular text-xs font-bold uppercase tracking-[0.2em] text-[#FF5C35]">
              <FileText className="w-4 h-4 text-[#FFB547]" />
              <span>
                {lang === 'en'
                  ? '07 // SERVICE TERMS & ANDROID ARCHITECTURE'
                  : '07 // सेवा की शर्तें और तकनीकी जानकारी'}
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F7F3EA] tracking-tight">
              {lang === 'en'
                ? 'Terms of Service & Deployment Guide'
                : 'सेवा की शर्तें और तकनीकी जानकारी'}
            </h1>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
          <div className="border-t-2 border-b border-[#101014] divide-y divide-[#DCD4C6] text-sm leading-relaxed">
            <div className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-3 font-mono-tabular text-xs font-bold uppercase text-[#C83713]">
                01 // DISCLOSURE
              </div>
              <div className="sm:col-span-9 text-[#101014]">
                {lang === 'en'
                  ? '1. Independent Cyber Cafe Assistance: Aditya Online Center is an independent private digital services center in Kateya, Gopalganj, Bihar, India. We provide typing, document formatting, and online form-filling assistance. We are not affiliated with any government department and do not issue official government certificates.'
                  : '1. स्वतंत्र डिजिटल सेवा केंद्र: आदित्य ऑनलाइन सेंटर कटेया, गोपालगंज, बिहार, भारत में एक स्वतंत्र निजी डिजिटल सेवा केंद्र है। हम टाइपिंग, दस्तावेज़ सुधार और फॉर्म भरने में सहायता प्रदान करते हैं। हम किसी सरकारी विभाग से संबद्ध नहीं हैं।'}
              </div>
            </div>

            <div className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-3 font-mono-tabular text-xs font-bold uppercase text-[#C83713]">
                02 // UPI PROTOCOL
              </div>
              <div className="sm:col-span-9 text-[#101014]">
                {lang === 'en'
                  ? '2. Manual UPI Payment Verification: Submitting a UTR number or payment screenshot marks an order as "Pending Verification". Work proceeds and deliverables are finalized once the center administrator verifies the actual credit in the business bank account.'
                  : '2. मैनुअल UPI भुगतान सत्यापन: UTR नंबर या रसीद अपलोड करने पर भुगतान "सत्यापन लंबित" रहता है। बैंक खाते में वास्तविक राशि की पुष्टि के बाद ही भुगतान सत्यापित माना जाता है।'}
              </div>
            </div>

            <div className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-3 font-mono-tabular text-xs font-bold uppercase text-[#C83713]">
                03 // CANCELLATION
              </div>
              <div className="sm:col-span-9 text-[#101014]">
                {lang === 'en'
                  ? '3. Order Cancellation: Customers may cancel an order while its status is Submitted, Under Review, or Awaiting Payment before document preparation starts.'
                  : '3. ऑर्डर रद्दीकरण: कार्य शुरू होने से पहले (Submitted, Under Review या Awaiting Payment स्थिति में) ग्राहक अपना ऑर्डर रद्द कर सकते हैं।'}
              </div>
            </div>
          </div>

          {/* Stage 7: Deployment & Android Packaging Options */}
          <div className="bg-[#101014] text-[#F7F3EA] p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-base font-bold text-[#FFB547] font-display">
              <Smartphone className="w-5 h-5 text-[#FF5C35]" />
              <h2>
                {lang === 'en'
                  ? 'Deployment & Android App Packaging Options'
                  : 'डिप्लॉयमेंट और एंड्रॉइड ऐप विकल्प'}
              </h2>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-[#D8D3C8] list-disc pl-5">
              <li>
                <strong className="text-white">
                  Web Hosting (Cloud Run / Firebase Hosting):
                </strong>{' '}
                Build with{' '}
                <code className="font-mono-tabular bg-[#1E1E28] text-[#FFB547] px-1.5 py-0.5">
                  npm run build
                </code>{' '}
                and deploy static assets or container directly. Remember to add
                your production domain to Firebase Authentication → Settings →
                Authorized Domains.
              </li>
              <li>
                <strong className="text-white">
                  Android Packaging Option 1 (PWA / Add to Home Screen - Free):
                </strong>{' '}
                Customers in Kateya on Android Chrome can tap &ldquo;Add to Home
                Screen&rdquo; for full-screen mobile access with zero Play Store
                fees.
              </li>
              <li>
                <strong className="text-white">
                  Android Packaging Option 2 (Trusted Web Activity / Bubblewrap
                  or Capacitor):
                </strong>{' '}
                Wrap the deployed HTTPS URL using{' '}
                <code className="font-mono-tabular bg-[#1E1E28] text-[#FFB547] px-1.5 py-0.5">
                  @capacitor/android
                </code>{' '}
                or Google Bubblewrap TWA to generate a signed{' '}
                <code className="font-mono-tabular">.aab</code> /{' '}
                <code className="font-mono-tabular">.apk</code> for Google Play
                distribution (Google Play Developer registration requires a
                one-time $25 fee).
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="min-h-[44px] px-5 py-2.5 bg-[#101014] hover:bg-[#FF5C35] text-white text-xs font-mono-tabular uppercase tracking-wider font-bold transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {lang === 'en' ? 'Return to Home' : 'होम पेज पर वापस जाएं'}
            </span>
          </button>
        </section>
      </div>
    );
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validation = validateContactMessageInput({
      name: contactName,
      phone: contactPhone,
      email: contactEmail,
      subject: contactSubject,
      message: contactMessage,
      orderId: contactOrderId,
      preferredLanguage,
    });

    if (!validation.valid) {
      setFormError(
        (lang === 'en' ? validation.errorEn : validation.errorHi) ||
          'Invalid input.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const msgId = await onSubmitContactMessage({
        name: sanitizeString(contactName, 100),
        phone: sanitizeString(contactPhone, 20),
        email: sanitizeString(contactEmail, 150),
        subject: sanitizeString(contactSubject, 150),
        message: sanitizeString(contactMessage, 1500),
        orderId: sanitizeString(contactOrderId, 40),
        preferredLanguage,
      });
      setSavedMessageId(msgId);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : lang === 'en'
          ? 'Could not save your message to the database. Please try again.'
          : 'आपका संदेश डेटाबेस में सहेजा नहीं जा सका। कृपया पुनः प्रयास करें।'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F7F3EA] min-h-screen">
      {/* Dark Charcoal Editorial Masthead */}
      <section className="editorial-dark-grid text-[#F7F3EA] border-b border-[#272732] py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <BrandLogo variant="badge" lang={lang} showSubtitle={false} />
            <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.2em] text-[#FF5C35]">
              {lang === 'en'
                ? '05 // CITIZEN ASSISTANCE & CONTACT DESK'
                : '05 // आधिकारिक ग्राहक सहायता और संपर्क केंद्र'}
            </div>
          </div>
          <h1
            id="contact-page-heading"
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F7F3EA] tracking-tight"
          >
            {lang === 'en'
              ? `Contact ${BUSINESS_INFO.businessName}`
              : `${BUSINESS_INFO.businessNameHi} से संपर्क करें`}
          </h1>
          <p className="text-xs sm:text-sm text-[#D8D3C8] max-w-2xl leading-relaxed">
            {lang === 'en'
              ? 'Reach out via WhatsApp, email, or the secure inquiry form for help with resumes, biodata, PDF tools, scholarship applications, and online form assistance.'
              : 'रिज्यूमे, बायोडाटा, PDF सुधार, छात्रवृत्ति आवेदन और ऑनलाइन फॉर्म सहायता के लिए व्हाट्सएप, ईमेल या नीचे दिए गए सुरक्षित फॉर्म के माध्यम से संपर्क करें।'}
          </p>
        </div>
      </section>

      <section
        aria-labelledby="contact-page-heading"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left 5 Columns: Verified Business Ledger & Direct Actions */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="flex items-baseline justify-between border-b-2 border-[#101014] pb-3">
                <h2 className="font-display text-lg font-extrabold text-[#101014]">
                  {lang === 'en'
                    ? '01 // Direct Dispatch Channels'
                    : '01 // सीधा संपर्क माध्यम'}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={BUSINESS_INFO.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={
                    lang === 'en'
                      ? `Chat on WhatsApp with ${BUSINESS_INFO.businessName} at ${BUSINESS_INFO.whatsappNumber}`
                      : `${BUSINESS_INFO.businessNameHi} से व्हाट्सएप (${BUSINESS_INFO.whatsappNumber}) पर चैट करें`
                  }
                  className="min-h-[48px] px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {lang === 'en'
                      ? 'Chat on WhatsApp'
                      : 'व्हाट्सएप पर चैट करें'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
                </a>

                <a
                  href={BUSINESS_INFO.mailtoUrl}
                  aria-label={
                    lang === 'en'
                      ? `Send an email to ${BUSINESS_INFO.email}`
                      : `${BUSINESS_INFO.email} पर ईमेल भेजें`
                  }
                  className="min-h-[48px] px-4 py-3 bg-[#101014] hover:bg-[#FF5C35] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#FFB547] shrink-0" />
                  <span>{lang === 'en' ? 'Send Email' : 'ईमेल भेजें'}</span>
                </a>
              </div>

              {/* Direct Google Maps Direction Link Button */}
              <a
                href={BUSINESS_INFO.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="google-maps-direction-btn"
                className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-gradient-to-r from-[#FF5C35] to-[#E54922] hover:from-[#FF6B47] hover:to-[#FF5C35] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-[0_8px_24px_-6px_rgba(255,92,53,0.45)] transition-all"
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span>
                  {lang === 'en'
                    ? 'Get Directions on Google Maps (Kateya Ward 08)'
                    : 'गूगल मैप्स (Google Maps) पर रास्ता देखें'}
                </span>
                <ExternalLink className="w-3.5 h-3.5 opacity-90 shrink-0" />
              </a>
            </div>

            {/* Verified Business Information Ledger */}
            <dl className="divide-y divide-[#DCD4C6] border-t-2 border-b border-[#101014] text-sm">
              <div className="py-4 flex items-start gap-3">
                <Globe className="w-4 h-4 text-[#FF5C35] shrink-0 mt-1" />
                <div>
                  <dt className="font-mono-tabular text-xs font-bold uppercase text-[#5C5852]">
                    {lang === 'en'
                      ? 'Business Name & Service Area'
                      : 'संस्था का नाम और सेवा क्षेत्र'}
                  </dt>
                  <dd className="text-[#101014] font-semibold mt-0.5">
                    {lang === 'en'
                      ? BUSINESS_INFO.businessName
                      : BUSINESS_INFO.businessNameHi}{' '}
                    —{' '}
                    <span className="font-normal text-[#4A463E]">
                      {lang === 'en'
                        ? BUSINESS_INFO.serviceAreaEn
                        : BUSINESS_INFO.serviceAreaHi}
                    </span>
                  </dd>
                </div>
              </div>

              <div className="py-4 flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#FF5C35] shrink-0 mt-1" />
                <div>
                  <dt className="font-mono-tabular text-xs font-bold uppercase text-[#5C5852]">
                    {lang === 'en' ? 'Business Address' : 'केंद्र का पता'}
                  </dt>
                  <dd className="text-[#101014] font-semibold mt-0.5">
                    {lang === 'en'
                      ? BUSINESS_INFO.addressEn
                      : BUSINESS_INFO.addressHi}
                  </dd>
                </div>
              </div>

              <div className="py-4 flex items-start gap-3">
                <MessageCircle className="w-4 h-4 text-[#FF5C35] shrink-0 mt-1" />
                <div>
                  <dt className="font-mono-tabular text-xs font-bold uppercase text-[#5C5852]">
                    {lang === 'en' ? 'WhatsApp Contact' : 'व्हाट्सएप नंबर'}
                  </dt>
                  <dd className="font-mono-tabular mt-0.5">
                    <a
                      href={BUSINESS_INFO.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#C83713] hover:underline font-bold"
                    >
                      {BUSINESS_INFO.whatsappNumber}
                    </a>
                  </dd>
                </div>
              </div>

              {BUSINESS_INFO.phone.trim().length > 0 && (
                <div className="py-4 flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[#FF5C35] shrink-0 mt-1" />
                  <div>
                    <dt className="font-mono-tabular text-xs font-bold uppercase text-[#5C5852]">
                      {lang === 'en' ? 'Phone Number' : 'फ़ोन नंबर'}
                    </dt>
                    <dd className="font-mono-tabular text-[#101014] font-semibold mt-0.5">
                      {BUSINESS_INFO.phone}
                    </dd>
                  </div>
                </div>
              )}

              <div className="py-4 flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#FF5C35] shrink-0 mt-1" />
                <div>
                  <dt className="font-mono-tabular text-xs font-bold uppercase text-[#5C5852]">
                    {lang === 'en' ? 'Business Email' : 'आधिकारिक ईमेल'}
                  </dt>
                  <dd className="font-mono-tabular break-all mt-0.5">
                    <a
                      href={BUSINESS_INFO.mailtoUrl}
                      className="text-[#C83713] hover:underline font-bold"
                    >
                      {BUSINESS_INFO.email}
                    </a>
                  </dd>
                </div>
              </div>

              <div className="py-4 flex items-start gap-3">
                <Calendar className="w-4 h-4 text-[#FF5C35] shrink-0 mt-1" />
                <div>
                  <dt className="font-mono-tabular text-xs font-bold uppercase text-[#5C5852]">
                    {lang === 'en'
                      ? 'Working Days & Hours'
                      : 'कार्य दिवस एवं समय'}
                  </dt>
                  <dd className="text-[#101014] font-semibold mt-0.5">
                    {lang === 'en'
                      ? BUSINESS_INFO.workingDaysEn
                      : BUSINESS_INFO.workingDaysHi}
                  </dd>
                </div>
              </div>
            </dl>

            {activeSocialLinks.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#5C5852]">
                  {lang === 'en'
                    ? 'Connect on Social Media'
                    : 'सोशल मीडिया पर जुड़ें'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeSocialLinks.map((social) => (
                    <a
                      key={social.key}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[42px] px-3.5 py-2 bg-[#FFFDF9] hover:bg-[#101014] hover:text-white border border-[#101014] text-xs font-semibold text-[#101014] flex items-center justify-between gap-2 transition-colors"
                    >
                      <span className="flex items-center gap-2 truncate">
                        {renderSocialIcon(social.key)}
                        <span className="truncate">
                          {lang === 'en' ? social.labelEn : social.labelHi}
                        </span>
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right 7 Columns: Validated Firebase Contact Form */}
          <div className="lg:col-span-7 bg-[#FFFDF9] border border-[#101014] p-6 sm:p-8 space-y-6">
            <div className="border-b-2 border-[#101014] pb-3">
              <h2 className="font-display text-xl font-extrabold text-[#101014]">
                {lang === 'en'
                  ? '02 // Send a Contact Message'
                  : '02 // संपर्क और पूछताछ संदेश भेजें'}
              </h2>
              <p className="text-xs text-[#5C5852] mt-1">
                {lang === 'en'
                  ? 'Messages are securely stored in our database and can only be read by authorized center administrators.'
                  : 'आपका संदेश सुरक्षित डेटाबेस में सहेजा जाता है और केवल अधिकृत व्यवस्थापक (Admin) द्वारा पढ़ा जा सकता है।'}
              </p>
            </div>

            {savedMessageId ? (
              <div
                role="status"
                aria-live="polite"
                className="p-6 bg-emerald-50 border-l-4 border-emerald-700 text-sm text-emerald-950 space-y-4"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <h3 className="text-base font-bold">
                      {lang === 'en'
                        ? 'Message Saved Successfully!'
                        : 'आपका संदेश सफलतापूर्वक सहेज लिया गया है!'}
                    </h3>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      {lang === 'en'
                        ? 'Thank you for contacting Aditya Online Center. Your inquiry has been recorded in our system for admin review.'
                        : 'आदित्य ऑनलाइन सेंटर से संपर्क करने के लिए धन्यवाद। आपका संदेश हमारे सिस्टम में दर्ज कर लिया गया है।'}
                    </p>
                    <div className="pt-1 text-xs font-mono-tabular text-emerald-800">
                      {lang === 'en' ? 'Reference ID: ' : 'संदर्भ आईडी: '}
                      <strong>{savedMessageId}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSavedMessageId(null);
                      setContactSubject('');
                      setContactMessage('');
                      setContactOrderId('');
                    }}
                    className="min-h-[42px] px-4 py-2 bg-[#FFFDF9] border border-emerald-700 text-emerald-950 text-xs font-bold hover:bg-emerald-100 transition-colors"
                  >
                    {lang === 'en'
                      ? 'Send Another Message'
                      : 'एक और संदेश भेजें'}
                  </button>
                  <a
                    href={BUSINESS_INFO.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[42px] px-4 py-2 bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 flex items-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>
                      {lang === 'en'
                        ? 'Also Message on WhatsApp'
                        : 'व्हाट्सएप पर भी संपर्क करें'}
                    </span>
                  </a>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleFormSubmit}
                noValidate
                className="space-y-5"
              >
                {formError && (
                  <div
                    role="alert"
                    className="p-3.5 bg-red-50 border-l-4 border-red-600 text-xs text-red-900 flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#101014] mb-1.5"
                    >
                      {lang === 'en' ? 'Full Name *' : 'पूरा नाम *'}
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      maxLength={100}
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder={
                        lang === 'en'
                          ? 'e.g., Ramesh Kumar'
                          : 'जैसे: रमेश कुमार'
                      }
                      className="w-full min-h-[44px] px-3.5 py-2 bg-[#F7F3EA] border border-[#101014] text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#101014] mb-1.5"
                    >
                      {lang === 'en'
                        ? 'Phone / WhatsApp Number *'
                        : 'फ़ोन / व्हाट्सएप नंबर *'}
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      required
                      maxLength={20}
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="e.g., 9876543210"
                      className="w-full min-h-[44px] px-3.5 py-2 bg-[#F7F3EA] border border-[#101014] text-sm font-mono-tabular text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#101014] mb-1.5"
                    >
                      {lang === 'en'
                        ? 'Email Address (Optional)'
                        : 'ईमेल पता (वैकल्पिक)'}
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      maxLength={150}
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="customer@example.com"
                      className="w-full min-h-[44px] px-3.5 py-2 bg-[#F7F3EA] border border-[#101014] text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-order-id"
                      className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#101014] mb-1.5"
                    >
                      {lang === 'en'
                        ? 'Order ID (Optional)'
                        : 'ऑर्डर आईडी (वैकल्पिक)'}
                    </label>
                    <input
                      id="contact-order-id"
                      type="text"
                      maxLength={40}
                      value={contactOrderId}
                      onChange={(e) => setContactOrderId(e.target.value)}
                      placeholder="e.g., AOC-20261018-D101"
                      className="w-full min-h-[44px] px-3.5 py-2 bg-[#F7F3EA] border border-[#101014] text-sm font-mono-tabular text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-8">
                    <label
                      htmlFor="contact-subject"
                      className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#101014] mb-1.5"
                    >
                      {lang === 'en' ? 'Subject *' : 'विषय (Subject) *'}
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      required
                      maxLength={150}
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      placeholder={
                        lang === 'en'
                          ? 'e.g., Question about Resume / Scholarship Form'
                          : 'जैसे: रिज्यूमे या छात्रवृत्ति फॉर्म के बारे में'
                      }
                      className="w-full min-h-[44px] px-3.5 py-2 bg-[#F7F3EA] border border-[#101014] text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label
                      htmlFor="contact-pref-lang"
                      className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#101014] mb-1.5"
                    >
                      {lang === 'en'
                        ? 'Preferred Language *'
                        : 'पसंदीदा भाषा *'}
                    </label>
                    <select
                      id="contact-pref-lang"
                      value={preferredLanguage}
                      onChange={(e) =>
                        setPreferredLanguage(
                          e.target.value === 'hi' ? 'hi' : 'en'
                        )
                      }
                      className="w-full min-h-[44px] px-3 py-2 bg-[#F7F3EA] border border-[#101014] text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                    >
                      <option value="en">English (अंग्रेजी)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-msg"
                    className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#101014] mb-1.5"
                  >
                    {lang === 'en' ? 'Your Message *' : 'आपका संदेश *'}
                  </label>
                  <textarea
                    id="contact-msg"
                    rows={4}
                    required
                    maxLength={1500}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder={
                      lang === 'en'
                        ? 'Describe the service or assistance you need...'
                        : 'आपको किस सेवा या फॉर्म में सहायता चाहिए, यहाँ लिखें...'
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F7F3EA] border border-[#101014] text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] px-5 py-3 bg-[#FF5C35] hover:bg-[#E54922] disabled:bg-slate-400 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? lang === 'en'
                        ? 'Saving Message...'
                        : 'संदेश सहेजा जा रहा है...'
                      : lang === 'en'
                      ? 'Submit Message'
                      : 'संदेश भेजें'}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* UPGRADE 5: BOOK IN-SHOP PRIORITY TOKEN (दुकान पर आने का समय बुक करें)    */}
        {/* ===================================================================== */}
        <div
          id="shop-visit-token-section"
          data-testid="shop-visit-token-widget"
          className="mt-14 rounded-3xl bg-[#0A0D12] text-[#F7F3EA] border border-[#272732] p-6 sm:p-10 shadow-[0_24px_60px_-15px_rgba(10,13,18,0.85)]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Priority Token Booking Form */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2 border-b border-white/10 pb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5C35]/15 border border-[#FF5C35]/40 text-[#FFB547] font-mono-tabular text-[11px] font-bold uppercase tracking-wider">
                  <Ticket className="w-3.5 h-3.5 text-[#FF5C35]" />
                  <span>
                    {lang === 'en'
                      ? '03 // ZERO-WAIT COUNTER QUEUE SYSTEM'
                      : '03 // बिना लाइन में लगे प्राथमिकता काउंटर टोकन'}
                  </span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {lang === 'en'
                    ? 'Book In-Shop Priority Token (दुकान पर आने का समय बुक करें)'
                    : 'दुकान पर आने का समय बुक करें (Book In-Shop Priority Token)'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {lang === 'en'
                    ? 'Visiting our studio at Ward No. 08, Near G.A. High School, Kateya? Reserve a priority time slot and get an instant Digital Token Card (#KTY-104) to skip the queue.'
                    : 'वार्ड नं. 08, जी.ए. हाई स्कूल के पास, कटेया स्थित हमारे सेंटर पर आ रहे हैं? भीड़ से बचने के लिए अपना समय स्लॉट चुनें और तुरंत डिजिटल टोकन कार्ड (#KTY-104) प्राप्त करें।'}
                </p>
              </div>

              {tokenError && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/40 text-xs text-red-200 flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{tokenError}</span>
                </div>
              )}

              <form onSubmit={handleBookShopToken} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="token-visitor-name"
                      className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                    >
                      {lang === 'en' ? 'Visitor Full Name *' : 'आपका पूरा नाम *'}
                    </label>
                    <input
                      id="token-visitor-name"
                      data-testid="token-visitor-name-input"
                      type="text"
                      value={tokenCustomerName}
                      onChange={(e) => setTokenCustomerName(e.target.value)}
                      placeholder={
                        lang === 'en' ? 'Enter your name' : 'अपना नाम लिखें'
                      }
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#121721] border border-white/15 text-sm text-white focus:border-[#FF5C35] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="token-visitor-phone"
                      className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                    >
                      {lang === 'en'
                        ? '10-Digit Mobile Number *'
                        : '10-अंकीय मोबाइल नंबर *'}
                    </label>
                    <input
                      id="token-visitor-phone"
                      data-testid="token-visitor-phone-input"
                      type="tel"
                      value={tokenCustomerPhone}
                      onChange={(e) => setTokenCustomerPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#121721] border border-white/15 text-sm font-mono-tabular text-white focus:border-[#FF5C35] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="token-visit-date"
                      className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                    >
                      {lang === 'en' ? 'Preferred Visit Date *' : 'आने की तिथि *'}
                    </label>
                    <input
                      id="token-visit-date"
                      data-testid="token-visit-date-input"
                      type="date"
                      value={tokenVisitDate}
                      onChange={(e) => setTokenVisitDate(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#121721] border border-white/15 text-sm font-mono-tabular text-white focus:border-[#FF5C35] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="token-service-select"
                      className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                    >
                      {lang === 'en' ? 'Service Type *' : 'सेवा का प्रकार *'}
                    </label>
                    <select
                      id="token-service-select"
                      data-testid="token-service-select"
                      value={tokenServiceType}
                      onChange={(e) => setTokenServiceType(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#121721] border border-white/15 text-sm text-white focus:border-[#FF5C35] focus:outline-none"
                    >
                      <option value="Bihar Post-Matric Scholarship / Online Form">
                        {lang === 'en'
                          ? 'Bihar Post-Matric Scholarship / Online Form'
                          : 'बिहार पोस्ट-मैट्रिक छात्रवृत्ति / ऑनलाइन फॉर्म'}
                      </option>
                      <option value="SSC / Bihar Police / BPSC Exam Form Filling">
                        {lang === 'en'
                          ? 'SSC / Bihar Police / BPSC Exam Form Filling'
                          : 'SSC / बिहार पुलिस / BPSC परीक्षा फॉर्म'}
                      </option>
                      <option value="Professional Job Resume / Marriage Biodata">
                        {lang === 'en'
                          ? 'Professional Job Resume / Marriage Biodata'
                          : 'प्रोफेशनल जॉब रिज्यूमे / शादी बायोडाटा'}
                      </option>
                      <option value="RTPS Caste / Income / Residence Certificate">
                        {lang === 'en'
                          ? 'RTPS Caste / Income / Residence Certificate'
                          : 'RTPS जाति / आय / निवास प्रमाण पत्र'}
                      </option>
                      <option value="Aadhaar / PAN / Document Scanning & PDF">
                        {lang === 'en'
                          ? 'Aadhaar / PAN / Document Scanning & PDF'
                          : 'आधार / पैन / दस्तावेज़ स्कैनिंग और PDF'}
                      </option>
                    </select>
                  </div>
                </div>

                {/* Time Slot Selector */}
                <div>
                  <span className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    {lang === 'en'
                      ? 'Select Shop Time Slot (Mon–Sat) *'
                      : 'समय स्लॉट चुनें (सोमवार–शनिवार) *'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {SHOP_TIME_SLOTS.map((slot) => {
                      const active = tokenTimeSlot === slot.key;
                      return (
                        <button
                          key={slot.key}
                          type="button"
                          data-testid={`token-slot-${slot.key}`}
                          onClick={() => setTokenTimeSlot(slot.key)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            active
                              ? 'bg-[#FF5C35] text-white border-[#FF5C35] shadow-[0_8px_20px_-6px_rgba(255,92,53,0.6)]'
                              : 'bg-[#121721] text-slate-300 border-white/15 hover:border-white/35'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-mono-tabular text-xs font-extrabold">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {lang === 'en' ? slot.labelEn : slot.labelHi}
                            </span>
                          </div>
                          <div className="text-[11px] opacity-85 mt-1">
                            {lang === 'en' ? slot.windowEn : slot.windowHi}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  data-testid="generate-shop-token-btn"
                  className="w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-xl bg-gradient-to-r from-[#FF5C35] to-[#E54922] hover:from-[#FF6B47] hover:to-[#FF5C35] text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_12px_28px_-6px_rgba(255,92,53,0.55)]"
                >
                  <Ticket className="w-4 h-4" />
                  <span>
                    {lang === 'en'
                      ? 'Generate Priority Digital Token Card →'
                      : 'डिजिटल टोकन कार्ड जनरेट करें →'}
                  </span>
                </button>
              </form>
            </div>

            {/* Right 5 Columns: Live Printable / Downloadable Digital Token Card */}
            <div className="lg:col-span-5">
              {(() => {
                const activeTok: ShopVisitToken = generatedToken || {
                  tokenNumber: '#KTY-104',
                  customerName: tokenCustomerName || 'Ramesh Kumar',
                  customerPhone: tokenCustomerPhone || '9876543210',
                  visitDate: tokenVisitDate,
                  timeSlot: tokenTimeSlot,
                  timeSlotLabelEn:
                    SHOP_TIME_SLOTS.find((s) => s.key === tokenTimeSlot)
                      ?.labelEn || 'Morning (8:00 AM – 12:00 PM)',
                  timeSlotLabelHi:
                    SHOP_TIME_SLOTS.find((s) => s.key === tokenTimeSlot)
                      ?.labelHi || 'सुबह (8:00 AM – 12:00 PM)',
                  serviceType: tokenServiceType,
                  createdAt: new Date().toISOString(),
                };

                const tokenWhatsAppUrl = buildShopTokenWhatsAppUrl({
                  whatsappNumber: BUSINESS_INFO.whatsappNumber,
                  tokenNumber: activeTok.tokenNumber,
                  customerName: activeTok.customerName,
                  visitDate: activeTok.visitDate,
                  timeSlotLabel:
                    lang === 'en'
                      ? activeTok.timeSlotLabelEn
                      : activeTok.timeSlotLabelHi,
                  serviceType: activeTok.serviceType,
                });

                return (
                  <div
                    data-testid="digital-token-card"
                    className="rounded-2xl bg-gradient-to-br from-[#121721] via-[#161E2E] to-[#0A0D12] border-2 border-[#FFB547]/60 p-6 space-y-5 shadow-[0_16px_40px_-10px_rgba(255,181,71,0.25)]"
                  >
                    <div className="flex items-center justify-between border-b border-white/15 pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#0A0D12] border border-[#FF5C35]/40 p-1 flex items-center justify-center shrink-0">
                          <img
                            src={BRAND_IDENTITY.logoUrl}
                            alt="Aditya Online Center Logo"
                            width={32}
                            height={32}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-contain brand-logo-glow"
                          />
                        </div>
                        <div>
                          <div className="font-mono-tabular text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                            {lang === 'en'
                              ? 'OFFICIAL DIGITAL APPOINTMENT PASS'
                              : 'आधिकारिक डिजिटल अपॉइंटमेंट पास'}
                          </div>
                          <div className="font-display text-sm font-extrabold text-white mt-0.5">
                            Aditya Online Center · Kateya
                          </div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono-tabular text-[10px] font-bold">
                        {generatedToken
                          ? lang === 'en'
                            ? 'CONFIRMED PASS'
                            : 'कन्फर्म पास'
                          : lang === 'en'
                          ? 'LIVE PREVIEW'
                          : 'लाइव प्रीव्यू'}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-slate-400">
                          {lang === 'en' ? 'TOKEN NUMBER' : 'टोकन नंबर'}
                        </div>
                        <div
                          data-testid="generated-token-number"
                          className="font-mono-tabular text-3xl sm:text-4xl font-extrabold text-[#FFB547] tracking-wider mt-0.5"
                        >
                          {activeTok.tokenNumber}
                        </div>
                      </div>
                      <div className="text-right font-mono-tabular text-xs">
                        <div className="text-slate-400">
                          {lang === 'en' ? 'DATE' : 'तिथि'}
                        </div>
                        <div className="text-white font-bold mt-0.5">
                          {activeTok.visitDate}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                        <span className="text-slate-400 font-mono-tabular">
                          {lang === 'en' ? 'VISITOR' : 'आगंतुक'}
                        </span>
                        <span className="font-bold text-white">
                          {activeTok.customerName} ({activeTok.customerPhone})
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-white/10">
                        <span className="text-slate-400 font-mono-tabular">
                          {lang === 'en' ? 'TIME SLOT' : 'समय स्लॉट'}
                        </span>
                        <span className="font-bold text-emerald-300">
                          {lang === 'en'
                            ? activeTok.timeSlotLabelEn
                            : activeTok.timeSlotLabelHi}
                        </span>
                      </div>
                      <div className="py-1.5 border-b border-white/10">
                        <div className="text-slate-400 font-mono-tabular">
                          {lang === 'en' ? 'SERVICE DESK' : 'सेवा डेस्क'}
                        </div>
                        <div className="font-bold text-white mt-0.5">
                          {activeTok.serviceType}
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-300 pt-1">
                        📍 Ward No. 08, Near G.A. High School / Nagar Panchayat,
                        Kateya, Gopalganj (841437)
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      <button
                        type="button"
                        data-testid="download-token-card-btn"
                        onClick={() => handleDownloadTokenCard(activeTok)}
                        className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#FFB547] hover:bg-[#FFA726] text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'en'
                            ? 'Download Token Card'
                            : 'टोकन कार्ड डाउनलोड करें'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'en' ? 'Print Pass' : 'प्रिंट करें'}
                        </span>
                      </button>
                    </div>

                    <a
                      href={tokenWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="whatsapp-token-confirm-btn"
                      className="w-full min-h-[42px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>
                        {lang === 'en'
                          ? 'Confirm Token Slot on WhatsApp (6206800799)'
                          : 'व्हाट्सएप पर टोकन स्लॉट कन्फर्म करें'}
                      </span>
                    </a>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
