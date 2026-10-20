import React from 'react';
import { AppView, CenterSettings, Language } from '../types';
import {
  BUSINESS_INFO,
  getActiveSocialLinks,
  SocialLinkItem,
} from '../config/businessInfo';
import {
  sanitizeString,
  validateContactMessageInput,
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

  React.useEffect(() => {
    setPreferredLanguage(lang);
  }, [lang]);

  const activeSocialLinks = React.useMemo(() => getActiveSocialLinks(), []);

  if (mode === 'privacy') {
    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl p-6 sm:p-10 space-y-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C83713]">
            <Shield className="w-4 h-4 text-[#FF5C35]" />
            <span>
              {lang === 'en'
                ? 'Customer Data & Document Protection'
                : 'ग्राहक डेटा और दस्तावेज़ सुरक्षा'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#101014] font-display">
            {lang === 'en'
              ? 'Privacy Policy — Aditya Online Center'
              : 'गोपनीयता नीति — आदित्य ऑनलाइन सेंटर'}
          </h1>

          <div className="space-y-4 text-sm text-[#4A463E] leading-relaxed">
            <p>
              {lang === 'en'
                ? '1. Purpose of Data Collection: Aditya Online Center (Kateya, Gopalganj, Bihar, India) collects only the information and supporting documents strictly required to prepare your requested resume, biodata, PDF formatting, or online form application.'
                : '1. डेटा संग्रह का उद्देश्य: आदित्य ऑनलाइन सेंटर (कटेया, गोपालगंज, बिहार, भारत) केवल वही जानकारी और दस्तावेज़ एकत्र करता है जो आपके द्वारा मांगे गए रिज्यूमे, बायोडाटा, PDF या ऑनलाइन फॉर्म को तैयार करने के लिए आवश्यक हैं।'}
            </p>
            <p>
              {lang === 'en'
                ? '2. Strict Document Isolation: Uploaded files (marksheets, ID proofs, photos, and receipts) are stored with strict Attribute-Based Access Control (ABAC) in Cloud Firestore. Customers can only read or download their own orders and files. Public directory listing is strictly disabled.'
                : '2. सख्त दस्तावेज़ सुरक्षा: अपलोड की गई फ़ाइलें (मार्कशीट, फोटो, प्रमाणपत्र) सख्त सुरक्षा नियमों के तहत सुरक्षित रहती हैं। कोई भी अन्य ग्राहक आपके दस्तावेज़ या ऑर्डर नहीं देख सकता।'}
            </p>
            <p>
              {lang === 'en'
                ? '3. Zero Credential Storage: We NEVER ask for, collect, or store banking passwords, UPI PINs, or sensitive one-time passwords (OTPs) inside application records.'
                : '3. पासवर्ड या पिन कभी नहीं मांगा जाता: हम कभी भी आपका बैंक पासवर्ड, UPI पिन या संवेदनशील OTP संग्रहीत नहीं करते हैं।'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="min-h-[44px] px-5 py-2 bg-[#101014] hover:bg-[#1E1E26] text-white text-xs font-semibold rounded-xl transition-colors"
          >
            ← {lang === 'en' ? 'Return to Home' : 'होम पेज पर वापस जाएं'}
          </button>
        </div>
      </section>
    );
  }

  if (mode === 'terms') {
    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl p-6 sm:p-10 space-y-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C83713]">
            <FileText className="w-4 h-4 text-[#FF5C35]" />
            <span>
              {lang === 'en'
                ? 'Service Terms & Independent Assistance Disclosure'
                : 'सेवा की शर्तें और स्वतंत्र सहायता सूचना'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#101014] font-display">
            {lang === 'en'
              ? 'Terms of Service & Deployment Guide'
              : 'सेवा की शर्तें और तकनीकी जानकारी'}
          </h1>

          <div className="space-y-4 text-sm text-[#4A463E] leading-relaxed">
            <p>
              {lang === 'en'
                ? '1. Independent Cyber Cafe Assistance: Aditya Online Center is an independent private digital services center in Kateya, Gopalganj, Bihar, India. We provide typing, document formatting, and online form-filling assistance. We are not affiliated with any government department and do not issue official government certificates.'
                : '1. स्वतंत्र डिजिटल सेवा केंद्र: आदित्य ऑनलाइन सेंटर कटेया, गोपालगंज, बिहार, भारत में एक स्वतंत्र निजी डिजिटल सेवा केंद्र है। हम टाइपिंग, दस्तावेज़ सुधार और फॉर्म भरने में सहायता प्रदान करते हैं। हम किसी सरकारी विभाग से संबद्ध नहीं हैं।'}
            </p>
            <p>
              {lang === 'en'
                ? '2. Manual UPI Payment Verification: Submitting a UTR number or payment screenshot marks an order as "Pending Verification". Work proceeds and deliverables are finalized once the center administrator verifies the actual credit in the business bank account.'
                : '2. मैनुअल UPI भुगतान सत्यापन: UTR नंबर या रसीद अपलोड करने पर भुगतान "सत्यापन लंबित" रहता है। बैंक खाते में वास्तविक राशि की पुष्टि के बाद ही भुगतान सत्यापित माना जाता है।'}
            </p>
            <p>
              {lang === 'en'
                ? '3. Order Cancellation: Customers may cancel an order while its status is Submitted, Under Review, or Awaiting Payment before document preparation starts.'
                : '3. ऑर्डर रद्दीकरण: कार्य शुरू होने से पहले (Submitted, Under Review या Awaiting Payment स्थिति में) ग्राहक अपना ऑर्डर रद्द कर सकते हैं।'}
            </p>
          </div>

          {/* Stage 7: Deployment & Android Packaging Options */}
          <div className="pt-6 border-t border-[#E6DFD3] space-y-3">
            <div className="flex items-center gap-2 text-base font-bold text-[#101014] font-display">
              <Smartphone className="w-5 h-5 text-[#FF5C35]" />
              <h2>
                {lang === 'en'
                  ? 'Deployment & Android App Packaging Options'
                  : 'डिप्लॉयमेंट और एंड्रॉइड ऐप विकल्प'}
              </h2>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-[#4A463E] list-disc pl-5">
              <li>
                <strong>Web Hosting (Cloud Run / Firebase Hosting):</strong> Build with{' '}
                <code className="font-mono-tabular bg-[#F0EAE0] px-1.5 py-0.5 rounded">
                  npm run build
                </code>{' '}
                and deploy static assets or container directly. Remember to add your production domain to Firebase Authentication → Settings → Authorized Domains.
              </li>
              <li>
                <strong>Android Packaging Option 1 (PWA / Add to Home Screen - Free):</strong>{' '}
                Customers in Kateya on Android Chrome can tap &ldquo;Add to Home Screen&rdquo; for full-screen mobile access with zero Play Store fees.
              </li>
              <li>
                <strong>Android Packaging Option 2 (Trusted Web Activity / Bubblewrap or Capacitor):</strong>{' '}
                Wrap the deployed HTTPS URL using{' '}
                <code className="font-mono-tabular bg-[#F0EAE0] px-1.5 py-0.5 rounded">
                  @capacitor/android
                </code>{' '}
                or Google Bubblewrap TWA to generate a signed <code className="font-mono-tabular">.aab</code> / <code className="font-mono-tabular">.apk</code> for Google Play distribution (Google Play Developer registration requires a one-time $25 fee).
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="min-h-[44px] px-5 py-2 bg-[#101014] hover:bg-[#1E1E26] text-white text-xs font-semibold rounded-xl transition-colors"
          >
            ← {lang === 'en' ? 'Return to Home' : 'होम पेज पर वापस जाएं'}
          </button>
        </div>
      </section>
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
    <section
      aria-labelledby="contact-page-heading"
      className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8"
    >
      <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left Column: Verified Business Details, Direct Actions & Social Links */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#C83713]">
                {lang === 'en'
                  ? 'Official Customer Support & Assistance Desk'
                  : 'आधिकारिक ग्राहक सहायता और संपर्क केंद्र'}
              </div>
              <h1
                id="contact-page-heading"
                className="text-2xl sm:text-3xl font-bold text-[#101014] font-display"
              >
                {lang === 'en'
                  ? `Contact ${BUSINESS_INFO.businessName}`
                  : `${BUSINESS_INFO.businessNameHi} से संपर्क करें`}
              </h1>
              <p className="text-sm text-[#4A463E] leading-relaxed">
                {lang === 'en'
                  ? 'Reach out via WhatsApp, email, or the secure inquiry form for help with resumes, biodata, PDF tools, scholarship applications, and online form assistance.'
                  : 'रिज्यूमे, बायोडाटा, PDF सुधार, छात्रवृत्ति आवेदन और ऑनलाइन फॉर्म सहायता के लिए व्हाट्सएप, ईमेल या नीचे दिए गए सुरक्षित फॉर्म के माध्यम से संपर्क करें।'}
              </p>
            </div>

            {/* Direct Action Buttons: WhatsApp & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <a
                href={BUSINESS_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={
                  lang === 'en'
                    ? `Chat on WhatsApp with ${BUSINESS_INFO.businessName} at ${BUSINESS_INFO.whatsappNumber}`
                    : `${BUSINESS_INFO.businessNameHi} से व्हाट्सएप (${BUSINESS_INFO.whatsappNumber}) पर चैट करें`
                }
                className="min-h-[48px] px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>
                  {lang === 'en' ? 'Chat on WhatsApp' : 'व्हाट्सएप पर चैट करें'}
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
                className="min-h-[48px] px-4 py-3 bg-[#101014] hover:bg-[#1E1E26] text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C35]"
              >
                <Mail className="w-4 h-4 text-[#FF5C35] shrink-0" />
                <span>{lang === 'en' ? 'Send Email' : 'ईमेल भेजें'}</span>
              </a>
            </div>

            {/* Verified Business Information List */}
            <dl className="space-y-3 pt-3 border-t border-[#E6DFD3] text-sm text-[#4A463E]">
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-[#FF5C35] shrink-0 mt-0.5" />
                <div>
                  <dt className="font-semibold text-[#101014]">
                    {lang === 'en'
                      ? 'Business Name & Service Area'
                      : 'संस्था का नाम और सेवा क्षेत्र'}
                  </dt>
                  <dd className="text-[#4A463E]">
                    <span className="font-medium text-[#101014]">
                      {lang === 'en'
                        ? BUSINESS_INFO.businessName
                        : BUSINESS_INFO.businessNameHi}
                    </span>{' '}
                    —{' '}
                    <span>
                      {lang === 'en'
                        ? BUSINESS_INFO.serviceAreaEn
                        : BUSINESS_INFO.serviceAreaHi}
                    </span>
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#FF5C35] shrink-0 mt-0.5" />
                <div>
                  <dt className="font-semibold text-[#101014]">
                    {lang === 'en' ? 'Business Address' : 'केंद्र का पता'}
                  </dt>
                  <dd className="text-[#4A463E]">
                    {lang === 'en'
                      ? BUSINESS_INFO.addressEn
                      : BUSINESS_INFO.addressHi}
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-[#FF5C35] shrink-0 mt-0.5" />
                <div>
                  <dt className="font-semibold text-[#101014]">
                    {lang === 'en' ? 'WhatsApp Contact' : 'व्हाट्सएप नंबर'}
                  </dt>
                  <dd className="font-mono-tabular text-[#101014]">
                    <a
                      href={BUSINESS_INFO.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#C83713] hover:underline font-semibold"
                    >
                      {BUSINESS_INFO.whatsappNumber}
                    </a>
                  </dd>
                </div>
              </div>

              {BUSINESS_INFO.phone.trim().length > 0 && (
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#FF5C35] shrink-0 mt-0.5" />
                  <div>
                    <dt className="font-semibold text-[#101014]">
                      {lang === 'en' ? 'Phone Number' : 'फ़ोन नंबर'}
                    </dt>
                    <dd className="font-mono-tabular text-[#101014]">
                      {BUSINESS_INFO.phone}
                    </dd>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-[#FF5C35] shrink-0 mt-0.5" />
                <div>
                  <dt className="font-semibold text-[#101014]">
                    {lang === 'en' ? 'Business Email' : 'आधिकारिक ईमेल'}
                  </dt>
                  <dd className="font-mono-tabular break-all">
                    <a
                      href={BUSINESS_INFO.mailtoUrl}
                      className="text-[#C83713] hover:underline font-semibold"
                    >
                      {BUSINESS_INFO.email}
                    </a>
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-[#FF5C35] shrink-0 mt-0.5" />
                <div>
                  <dt className="font-semibold text-[#101014]">
                    {lang === 'en' ? 'Working Days' : 'कार्य दिवस'}
                  </dt>
                  <dd className="text-[#4A463E]">
                    {lang === 'en'
                      ? BUSINESS_INFO.workingDaysEn
                      : BUSINESS_INFO.workingDaysHi}
                    {BUSINESS_INFO.workingHoursEn.trim().length > 0 && (
                      <span className="block text-xs text-[#787166] mt-0.5">
                        {lang === 'en'
                          ? BUSINESS_INFO.workingHoursEn
                          : BUSINESS_INFO.workingHoursHi}
                      </span>
                    )}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          {/* Configured Social Media Links (Only displays platforms with non-empty URLs) */}
          {activeSocialLinks.length > 0 && (
            <div className="pt-4 border-t border-[#E6DFD3] space-y-2.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#4A463E]">
                {lang === 'en'
                  ? 'Connect on Social Media'
                  : 'सोशल मीडिया पर जुड़ें'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeSocialLinks.map((social) => (
                  <a
                    key={social.key}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={
                      lang === 'en'
                        ? `Visit ${BUSINESS_INFO.businessName} on ${social.labelEn}`
                        : `${BUSINESS_INFO.businessNameHi} का ${social.labelHi} पेज खोलें`
                    }
                    className="min-h-[44px] px-3 py-2 bg-[#F7F3EA] hover:bg-[#FFF2ED] hover:text-[#C83713] border border-[#E6DFD3] rounded-xl text-xs font-semibold text-[#101014] flex items-center justify-between gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C35]"
                  >
                    <span className="flex items-center gap-2 truncate">
                      {renderSocialIcon(social.key)}
                      <span className="truncate">
                        {lang === 'en' ? social.labelEn : social.labelHi}
                      </span>
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#787166] shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Validated Firebase Contact Form */}
        <div className="lg:col-span-7 bg-[#F7F3EA] border border-[#E6DFD3] rounded-2xl p-6 sm:p-8">
          <div className="space-y-1 mb-5">
            <h2 className="text-lg sm:text-xl font-bold text-[#101014] font-display">
              {lang === 'en'
                ? 'Send a Contact Message'
                : 'संपर्क और पूछताछ संदेश भेजें'}
            </h2>
            <p className="text-xs text-[#4A463E]">
              {lang === 'en'
                ? 'Messages are securely stored in our database and can only be read by authorized center administrators.'
                : 'आपका संदेश सुरक्षित डेटाबेस में सहेजा जाता है और केवल अधिकृत व्यवस्थापक (Admin) द्वारा पढ़ा जा सकता है।'}
            </p>
          </div>

          {savedMessageId ? (
            <div
              role="status"
              aria-live="polite"
              className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-950 space-y-4"
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
                  className="min-h-[44px] px-4 py-2 bg-[#FFFDF9] border border-emerald-300 text-emerald-950 text-xs font-semibold rounded-xl hover:bg-emerald-100 transition-colors"
                >
                  {lang === 'en'
                    ? 'Send Another Message'
                    : 'एक और संदेश भेजें'}
                </button>
                <a
                  href={BUSINESS_INFO.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-xl hover:bg-emerald-800 flex items-center gap-1.5 transition-colors"
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
            <form onSubmit={handleFormSubmit} noValidate className="space-y-4">
              {formError && (
                <div
                  role="alert"
                  className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-semibold text-[#101014] mb-1"
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
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#FFFDF9] border border-[#D4CCB8] rounded-xl text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-phone"
                    className="block text-xs font-semibold text-[#101014] mb-1"
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
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#FFFDF9] border border-[#D4CCB8] rounded-xl text-sm font-mono-tabular text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-semibold text-[#101014] mb-1"
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
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#FFFDF9] border border-[#D4CCB8] rounded-xl text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-order-id"
                    className="block text-xs font-semibold text-[#101014] mb-1"
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
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#FFFDF9] border border-[#D4CCB8] rounded-xl text-sm font-mono-tabular text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-8">
                  <label
                    htmlFor="contact-subject"
                    className="block text-xs font-semibold text-[#101014] mb-1"
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
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#FFFDF9] border border-[#D4CCB8] rounded-xl text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label
                    htmlFor="contact-pref-lang"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    {lang === 'en' ? 'Preferred Language *' : 'पसंदीदा भाषा *'}
                  </label>
                  <select
                    id="contact-pref-lang"
                    value={preferredLanguage}
                    onChange={(e) =>
                      setPreferredLanguage(
                        e.target.value === 'hi' ? 'hi' : 'en'
                      )
                    }
                    className="w-full min-h-[44px] px-3 py-2 bg-[#FFFDF9] border border-[#D4CCB8] rounded-xl text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  >
                    <option value="en">English (अंग्रेजी)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact-msg"
                  className="block text-xs font-semibold text-[#101014] mb-1"
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
                  className="w-full px-3.5 py-2.5 bg-[#FFFDF9] border border-[#D4CCB8] rounded-xl text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[48px] px-5 py-3 bg-[#FF5C35] hover:bg-[#E04823] disabled:bg-slate-400 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
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
    </section>
  );
};
