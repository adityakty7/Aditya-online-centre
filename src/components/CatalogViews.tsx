import React from 'react';
import {
  AppView,
  CategoryMeta,
  CenterSettings,
  DigitalService,
  Language,
  ServiceCategoryKey,
  ServiceCustomField,
} from '../types';
import { SERVICE_CATEGORIES } from '../data/initialCatalog';
import { BUSINESS_INFO } from '../config/businessInfo';
import {
  Search,
  ArrowRight,
  FileText,
  Clock,
  CheckCircle2,
  Shield,
  PhoneCall,
  MapPin,
  FileCheck,
  Briefcase,
  GraduationCap,
  Layers,
  FileSpreadsheet,
  Building2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  Upload,
  CreditCard,
  Download,
  Sparkles,
} from 'lucide-react';

interface CatalogViewsProps {
  mode: 'home' | 'services' | 'service-detail';
  lang: Language;
  services: DigitalService[];
  categories?: CategoryMeta[];
  selectedCategory: ServiceCategoryKey | 'all';
  onSelectCategory: (cat: ServiceCategoryKey | 'all') => void;
  searchQuery: string;
  onChangeSearch: (q: string) => void;
  selectedService: DigitalService | null;
  onInspectService: (service: DigitalService) => void;
  onStartOrder: (service: DigitalService) => void;
  onNavigate: (view: AppView) => void;
  onQuickTrackOrder?: (orderNumber: string) => void;
  settings: CenterSettings;
}

const FAQ_ITEMS = [
  {
    id: 'faq-privacy',
    qEn: 'How are my marksheets, Aadhaar, and personal documents kept private?',
    qHi: 'मेरी मार्कशीट, आधार और व्यक्तिगत दस्तावेज़ कैसे सुरक्षित रहते हैं?',
    aEn: 'Unlike forwarding documents on public WhatsApp groups or shared computers, files uploaded on Aditya Online Center are protected by user-isolated security rules. Only your signed-in account and the authorized center administrator can access your order documents.',
    aHi: 'सार्वजनिक व्हाट्सएप ग्रुप या साझा कंप्यूटर के विपरीत, आदित्य ऑनलाइन सेंटर पर अपलोड किए गए दस्तावेज़ उपयोगकर्ता-पृथक सुरक्षा नियमों से सुरक्षित रहते हैं। केवल आपका लॉगिन खाता और अधिकृत एडमिन ही आपकी फ़ाइलें देख सकते हैं।',
  },
  {
    id: 'faq-upi',
    qEn: 'How does manual UPI payment and UTR verification work?',
    qHi: 'मैनुअल UPI भुगतान और UTR सत्यापन कैसे काम करता है?',
    aEn: 'First submit your service request and documents. After reviewing your requirements, you pay the transparent service charge to our official business UPI ID and submit the 12-digit UTR reference number. We never ask for your UPI PIN, bank password, or OTP.',
    aHi: 'पहले अपना सेवा फॉर्म और दस्तावेज़ सबमिट करें। इसके बाद आप निर्धारित सेवा शुल्क का भुगतान आधिकारिक UPI पर करके 12-अंकों का UTR नंबर दर्ज करते हैं। हम कभी भी आपका UPI पिन, बैंक पासवर्ड या OTP नहीं मांगते हैं।',
  },
  {
    id: 'faq-turnaround',
    qEn: 'How fast will I receive my completed resume, biodata, or form receipt?',
    qHi: 'मुझे तैयार रिज्यूमे, बायोडाटा या फॉर्म रसीद कितनी जल्दी मिलेगी?',
    aEn: 'PDF resizing and typing tasks are typically completed within 1 to 2 hours. Professional ATS resumes and marriage biodata take 2 to 4 hours, while scholarship and recruitment forms take 3 to 6 hours during working days (Monday to Saturday).',
    aHi: 'PDF रीसाइज और टाइपिंग कार्य सामान्यतः 1 से 2 घंटे में पूरे होते हैं। रिज्यूमे और विवाह बायोडाटा में 2 से 4 घंटे और छात्रवृत्ति या नौकरी फॉर्म में 3 से 6 घंटे (सोमवार से शनिवार) लगते हैं।',
  },
  {
    id: 'faq-download',
    qEn: 'Where do I download my finished PDF document?',
    qHi: 'मैं अपना तैयार PDF दस्तावेज़ कहाँ से डाउनलोड कर सकता हूँ?',
    aEn: 'Once the admin marks your order as Completed or Delivered, a direct "Download PDF" button appears inside your Customer Portal and on the Track Order page.',
    aHi: 'एडमिन द्वारा आपका ऑर्डर Completed या Delivered किए जाने के तुरंत बाद, आपके ग्राहक पोर्टल और ऑर्डर ट्रैक पेज पर "Download PDF" बटन उपलब्ध हो जाता है।',
  },
  {
    id: 'faq-cancel',
    qEn: 'Can I cancel my order or provide missing certificate details later?',
    qHi: 'क्या मैं अपना ऑर्डर रद्द कर सकता हूँ या छूटी हुई जानकारी बाद में दे सकता हूँ?',
    aEn: 'Yes. You can cancel an order anytime while its status is Submitted, Under Review, or Awaiting Payment. If any certificate number or detail is missing, the admin will set your order to "Needs Customer Information" so you can reply directly from the Track Order page.',
    aHi: 'हाँ। जब तक ऑर्डर Submitted, Under Review या Awaiting Payment स्थिति में है, आप उसे रद्द कर सकते हैं। यदि कोई जानकारी कम है, तो आप सीधे ऑर्डर ट्रैक पेज से उत्तर भेज सकते हैं।',
  },
];

function getCategoryIcon(catKey: ServiceCategoryKey | 'all') {
  switch (catKey) {
    case 'resume_biodata':
      return <FileText className="w-5 h-5 text-[#FF5C35] shrink-0" />;
    case 'letters_formatting':
      return <FileSpreadsheet className="w-5 h-5 text-[#101014] shrink-0" />;
    case 'pdf_tools':
      return <Layers className="w-5 h-5 text-[#FF5C35] shrink-0" />;
    case 'govt_job_assistance':
      return <Briefcase className="w-5 h-5 text-[#101014] shrink-0" />;
    case 'scholarship_admission':
      return <GraduationCap className="w-5 h-5 text-[#FF5C35] shrink-0" />;
    case 'other_online_forms':
      return <Building2 className="w-5 h-5 text-[#101014] shrink-0" />;
    default:
      return <Sparkles className="w-5 h-5 text-[#FF5C35] shrink-0" />;
  }
}

export const AdityaEmblem: React.FC<{ className?: string }> = ({
  className = 'w-9 h-9',
}) => (
  <svg
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={className}
  >
    <rect
      x="2"
      y="2"
      width="36"
      height="36"
      rx="10"
      fill="#18181F"
      stroke="#272732"
      strokeWidth="1.5"
    />
    <path
      d="M20 8L30 30H24.4L20 19.6L15.6 30H10L20 8Z"
      fill="#FF5C35"
    />
    <path
      d="M15.5 23.5H24.5L26.2 27.5H13.8L15.5 23.5Z"
      fill="#FFB547"
    />
    <circle cx="20" cy="14.5" r="2" fill="#F7F3EA" />
  </svg>
);

export const CatalogViews: React.FC<CatalogViewsProps> = ({
  mode,
  lang,
  services,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onChangeSearch,
  selectedService,
  onInspectService,
  onStartOrder,
  onNavigate,
  onQuickTrackOrder,
  categories = SERVICE_CATEGORIES,
}) => {
  const [quickOrderId, setQuickOrderId] = React.useState('');
  const [openFaqId, setOpenFaqId] = React.useState<string>('faq-privacy');
  const [checkedDocs, setCheckedDocs] = React.useState<Record<number, boolean>>(
    {}
  );

  const categoriesList = React.useMemo(() => {
    return categories && categories.length > 0 ? categories : SERVICE_CATEGORIES;
  }, [categories]);

  React.useEffect(() => {
    setCheckedDocs({});
  }, [selectedService?.id]);

  const activeServices = React.useMemo(
    () => services.filter((s) => s.isActive),
    [services]
  );

  const featuredServices = React.useMemo(
    () => activeServices.filter((s) => s.featured).slice(0, 3),
    [activeServices]
  );

  const filteredServices = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeServices.filter((s) => {
      const matchesCat =
        selectedCategory === 'all' || s.category === selectedCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        s.titleEn.toLowerCase().includes(q) ||
        s.titleHi.toLowerCase().includes(q) ||
        s.descEn.toLowerCase().includes(q) ||
        s.descHi.toLowerCase().includes(q) ||
        s.requiredDocs.toLowerCase().includes(q)
      );
    });
  }, [activeServices, selectedCategory, searchQuery]);

  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: activeServices.length };
    for (const s of activeServices) {
      counts[s.category] = (counts[s.category] || 0) + 1;
    }
    return counts;
  }, [activeServices]);

  const getCategoryLabel = (catKey: ServiceCategoryKey) => {
    const found = categoriesList.find((c) => c.key === catKey);
    if (!found) return catKey;
    return lang === 'en' ? found.labelEn : found.labelHi;
  };

  // ===========================================================================
  // SERVICE DETAIL VIEW
  // ===========================================================================
  if (mode === 'service-detail' && selectedService) {
    let parsedFields: ServiceCustomField[] = [];
    try {
      parsedFields = JSON.parse(selectedService.customFieldsJson || '[]');
    } catch {
      parsedFields = [];
    }

    const reqDocsList = selectedService.requiredDocs
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);

    const checkedCount = Object.values(checkedDocs).filter(Boolean).length;

    return (
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onNavigate('services')}
            className="min-h-[44px] px-3.5 py-2 text-sm font-semibold text-[#101014] hover:text-[#FF5C35] rounded-xl hover:bg-[#ECE5D8] transition-colors whitespace-nowrap"
          >
            ← {lang === 'en' ? 'Back to All Services' : 'सभी सेवाओं पर वापस जाएं'}
          </button>

          <span className="text-xs font-mono-tabular text-[#5C5852]">
            ID: {selectedService.id}
          </span>
        </div>

        <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl p-6 sm:p-10">
          {/* Clean unboxed metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#FF5C35] mb-3">
            <span>{getCategoryLabel(selectedService.category)}</span>
            <span aria-hidden="true" className="text-[#9E978B]">·</span>
            <span className="text-[#101014]">
              {lang === 'en' ? 'Estimated Delivery:' : 'अनुमानित समय:'}{' '}
              {lang === 'en'
                ? selectedService.estimatedTimeEn
                : selectedService.estimatedTimeHi}
            </span>
            <span aria-hidden="true" className="text-[#9E978B]">·</span>
            <span className="text-[#5C5852]">
              {lang === 'en'
                ? 'Private Cloud Document Security'
                : 'सुरक्षित दस्तावेज़ गोपनीयता'}
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 pb-8 border-b border-[#E6DFD3]">
            <div className="max-w-2xl space-y-3">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#101014] tracking-tight">
                {lang === 'en'
                  ? selectedService.titleEn
                  : selectedService.titleHi}
              </h1>
              <p className="text-base text-[#52504C] leading-relaxed">
                {lang === 'en'
                  ? selectedService.descEn
                  : selectedService.descHi}
              </p>
            </div>

            <div className="bg-[#101014] text-[#F7F3EA] border border-[#272732] rounded-2xl p-6 shrink-0 lg:w-80 space-y-4">
              <div>
                <div className="text-xs font-medium text-[#A09D96]">
                  {lang === 'en'
                    ? 'Standard Service Fee'
                    : 'मानक सेवा शुल्क'}
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-extrabold text-[#FFB547] font-mono-tabular">
                    ₹{selectedService.priceInr}
                  </span>
                  {Boolean(
                    selectedService.minPriceInr &&
                      selectedService.maxPriceInr &&
                      selectedService.maxPriceInr >= selectedService.minPriceInr
                  ) && (
                    <span className="text-xs text-[#A09D96] font-mono-tabular">
                      (₹{selectedService.minPriceInr}–₹{selectedService.maxPriceInr})
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#D8D3C8] mt-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#FF5C35] shrink-0" />
                  <span>
                    {lang === 'en'
                      ? selectedService.estimatedTimeEn
                      : selectedService.estimatedTimeHi}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onStartOrder(selectedService)}
                className="w-full min-h-[48px] px-5 py-3 bg-[#FF5C35] hover:bg-[#E84B25] text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>
                  {lang === 'en'
                    ? 'Proceed to Order Form'
                    : 'ऑर्डर फॉर्म भरें'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
            {/* Interactive Required Document Checklist */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-[#101014] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#FF5C35]" />
                  <span>
                    {lang === 'en'
                      ? 'Required Documents Checklist'
                      : 'आवश्यक दस्तावेज़ चेकलिस्ट'}
                  </span>
                </h2>
                <span className="text-xs font-mono-tabular text-[#5C5852]">
                  {checkedCount}/{reqDocsList.length}{' '}
                  {lang === 'en' ? 'ready' : 'तैयार'}
                </span>
              </div>

              <p className="text-xs text-[#5C5852]">
                {lang === 'en'
                  ? 'Check off your documents below to make sure you have everything ready before starting:'
                  : 'ऑर्डर शुरू करने से पहले अपने दस्तावेज़ों की जांच करें:'}
              </p>

              <ul className="space-y-2.5 text-sm text-[#101014]">
                {reqDocsList.map((docItem, idx) => {
                  const isChecked = Boolean(checkedDocs[idx]);
                  return (
                    <li key={idx}>
                      <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E6DFD3] hover:bg-[#F7F3EA] cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setCheckedDocs((prev) => ({
                              ...prev,
                              [idx]: e.target.checked,
                            }))
                          }
                          className="mt-0.5 w-4 h-4 rounded border-[#CFC7B8] accent-[#FF5C35]"
                        />
                        <span
                          className={
                            isChecked
                              ? 'line-through text-[#78746E]'
                              : 'font-medium text-[#101014]'
                          }
                        >
                          {docItem}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Service-Specific Custom Fields Preview */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#101014] flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#FF5C35]" />
                <span>
                  {lang === 'en'
                    ? 'Information Requested in Order Form'
                    : 'फॉर्म में पूछी जाने वाली जानकारी'}
                </span>
              </h2>
              <p className="text-xs text-[#5C5852]">
                {lang === 'en'
                  ? 'You will fill out these service-specific fields on the next screen:'
                  : 'अगले चरण में आपसे यह जानकारी पूछी जाएगी:'}
              </p>

              {parsedFields.length > 0 ? (
                <ul className="space-y-2.5 text-sm text-[#52504C]">
                  {parsedFields.map((f) => (
                    <li
                      key={f.id}
                      className="p-3 bg-[#F7F3EA] border border-[#E6DFD3] rounded-xl flex items-center justify-between gap-2"
                    >
                      <span className="font-medium text-[#101014]">
                        {lang === 'en' ? f.labelEn : f.labelHi}
                      </span>
                      <span className="text-xs font-mono-tabular text-[#5C5852] shrink-0">
                        {f.required
                          ? lang === 'en'
                            ? 'Required'
                            : 'अनिवार्य'
                          : lang === 'en'
                          ? 'Optional'
                          : 'वैकल्पिक'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 bg-[#F7F3EA] border border-[#E6DFD3] rounded-xl text-sm text-[#52504C]">
                  {lang === 'en'
                    ? 'Standard customer contact details and formatting instructions.'
                    : 'ग्राहक संपर्क विवरण और सामान्य निर्देश।'}
                </div>
              )}
            </div>
          </div>

          {(selectedService.instructionsEn || selectedService.instructionsHi) && (
            <div className="mt-8 p-5 bg-[#F7F3EA] border border-[#DCD4C6] rounded-xl space-y-1.5">
              <div className="text-xs font-bold text-[#101014]">
                {lang === 'en'
                  ? 'Detailed Service Instructions & Preparation Notes'
                  : 'विस्तृत सेवा निर्देश और ग्राहक नोट्स'}
              </div>
              <p className="text-sm text-[#52504C] leading-relaxed">
                {lang === 'en'
                  ? selectedService.instructionsEn || selectedService.instructionsHi
                  : selectedService.instructionsHi || selectedService.instructionsEn}
              </p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-[#E6DFD3] text-xs text-[#5C5852] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p>
              {lang === 'en'
                ? 'Disclaimer: Aditya Online Center is an independent digital services and form-filling assistance center in Kateya, Bihar. We do not represent any government authority or issue government certificates.'
                : 'अस्वीकरण: आदित्य ऑनलाइन सेंटर कटेया, बिहार में एक स्वतंत्र डिजिटल सेवा और फॉर्म सहायता केंद्र है। हम किसी सरकारी विभाग का प्रतिनिधित्व नहीं करते हैं।'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  // ===========================================================================
  // HOME & SERVICE CATALOG VIEW (Alternating #101014 Charcoal & #F7F3EA Warm Cream)
  // ===========================================================================
  return (
    <div className="space-y-16 pb-20">
      {/* 1. NEON EMBER ARCHITECTURAL HERO SECTION (Charcoal #101014) */}
      {mode === 'home' && (
        <section className="bg-[#101014] text-[#F7F3EA] border-b border-[#272732] relative overflow-hidden">
          {/* Subtle architectural warm ember light wash */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#FF5C35]/15 via-[#FFB547]/5 to-transparent"
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16 relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
              {/* Left Column: Emblem, Editorial Headline, Search Bar & CTAs */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <AdityaEmblem className="w-9 h-9 shrink-0" />
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#FFB547]">
                      <span>
                        {lang === 'en'
                          ? 'Aditya Online Center · Kateya, Gopalganj, Bihar'
                          : 'आदित्य ऑनलाइन सेंटर · कटेया, गोपालगंज, बिहार'}
                      </span>
                      <span aria-hidden="true" className="text-[#5C5852]">·</span>
                      <span className="text-[#D8D3C8]">
                        {lang === 'en'
                          ? 'Order Online from Your Phone'
                          : 'मोबाइल से घर बैठे ऑर्डर करें'}
                      </span>
                    </div>
                  </div>

                  <h1
                    className="font-display text-3xl sm:text-4xl lg:text-[3.05rem] font-extrabold text-[#F7F3EA] tracking-tight leading-[1.1]"
                    style={{ textWrap: 'balance' }}
                  >
                    {lang === 'en'
                      ? 'Professional Resumes, Biodata, PDF Tools & Online Form Assistance From Home'
                      : 'प्रोफेशनल रिज्यूमे, बायोडाटा, PDF सुधार और ऑनलाइन फॉर्म सहायता अब घर बैठे'}
                  </h1>

                  <p className="text-base sm:text-lg text-[#D8D3C8] max-w-2xl leading-relaxed">
                    {lang === 'en'
                      ? 'Skip the queues in Kateya market. Upload your documents privately from your Android phone, track real-time order progress, verify payment by UPI UTR, and download your print-ready PDF.'
                      : 'कटेया बाजार में लंबी लाइन में लगने से बचें। अपने फोन से सुरक्षित रूप से दस्तावेज़ अपलोड करें, लाइव ऑर्डर स्थिति ट्रैक करें, UPI UTR से भुगतान सत्यापित करें और तैयार PDF डाउनलोड करें।'}
                  </p>
                </div>

                {/* Polished Service Search Bar + Primary & Secondary Actions */}
                <div className="space-y-4">
                  <div className="bg-[#18181F] border border-[#272732] p-2 rounded-2xl max-w-2xl">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <label htmlFor="hero-service-search" className="sr-only">
                          {lang === 'en'
                            ? 'Search digital services'
                            : 'डिजिटल सेवाएं खोजें'}
                        </label>
                        <Search className="w-4 h-4 text-[#A09D96] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="hero-service-search"
                          type="search"
                          value={searchQuery}
                          onChange={(e) => onChangeSearch(e.target.value)}
                          placeholder={
                            lang === 'en'
                              ? 'Search Resume, Biodata, PDF Resize, Scholarship, Exam Form...'
                              : 'खोजें: रिज्यूमे, बायोडाटा, PDF साइज, छात्रवृत्ति, परीक्षा फॉर्म...'
                          }
                          className="w-full min-h-[48px] pl-10 pr-4 py-2.5 bg-[#101014] border border-[#272732] rounded-xl text-sm text-[#F7F3EA] placeholder:text-[#78746E] focus:border-[#FF5C35] focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById('service-catalog');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            onNavigate('services');
                          }
                        }}
                        className="min-h-[48px] px-6 py-2.5 bg-[#FF5C35] hover:bg-[#E84B25] text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                      >
                        <span>
                          {lang === 'en' ? 'Explore Services' : 'सेवाएं खोजें'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Secondary CTA & Support Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => onNavigate('track-order')}
                      className="min-h-[42px] px-4 py-2 bg-[#18181F] hover:bg-[#23232E] text-[#F7F3EA] border border-[#272732] text-xs sm:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
                    >
                      {lang === 'en'
                        ? 'Track Existing Order →'
                        : 'मौजूदा ऑर्डर ट्रैक करें →'}
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate('contact')}
                      className="min-h-[42px] px-4 py-2 bg-[#18181F]/60 hover:bg-[#23232E] text-[#D8D3C8] border border-[#272732] text-xs sm:text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"
                    >
                      {lang === 'en' ? 'Ask on WhatsApp / Contact' : 'संपर्क और सहायता'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Order Tracker & Featured Rate Card Panel */}
              <div className="lg:col-span-5 flex">
                <div className="w-full bg-[#18181F] border border-[#272732] rounded-2xl p-6 flex flex-col justify-between space-y-6">
                  {/* Top: Quick Order Lookup */}
                  <div className="space-y-3 pb-5 border-b border-[#272732]">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold text-[#FFB547]">
                          {lang === 'en'
                            ? 'Instant Order Status & PDF Download'
                            : 'त्वरित ऑर्डर स्थिति और PDF डाउनलोड'}
                        </div>
                        <h2 className="text-base font-bold text-[#F7F3EA] mt-0.5">
                          {lang === 'en'
                            ? 'Track Your Order by ID'
                            : 'ऑर्डर आईडी से स्थिति देखें'}
                        </h2>
                      </div>
                      <span className="font-mono-tabular text-xs text-[#A09D96]">
                        AOC-2026
                      </span>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const trimmed = quickOrderId.trim();
                        if (trimmed && onQuickTrackOrder) {
                          onQuickTrackOrder(trimmed);
                        } else {
                          onNavigate('track-order');
                        }
                      }}
                      className="flex gap-2"
                    >
                      <label htmlFor="hero-quick-order-id" className="sr-only">
                        {lang === 'en' ? 'Enter Order ID' : 'ऑर्डर आईडी दर्ज करें'}
                      </label>
                      <input
                        id="hero-quick-order-id"
                        type="text"
                        value={quickOrderId}
                        onChange={(e) => setQuickOrderId(e.target.value)}
                        placeholder="e.g., AOC-20261018-D101"
                        className="flex-1 min-h-[42px] px-3.5 py-2 bg-[#101014] border border-[#272732] rounded-xl text-xs font-mono-tabular text-[#F7F3EA] placeholder:text-[#78746E] focus:border-[#FF5C35] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="min-h-[42px] px-4 py-2 bg-[#F7F3EA] hover:bg-[#FFB547] text-[#101014] font-semibold text-xs rounded-xl transition-colors whitespace-nowrap shrink-0"
                      >
                        {lang === 'en' ? 'Track Order' : 'ट्रैक करें'}
                      </button>
                    </form>
                  </div>

                  {/* Middle: Fast-Track Featured Services Rate List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#A09D96]">
                      <span>
                        {lang === 'en'
                          ? 'Popular Services & Standard Rates'
                          : 'प्रमुख सेवाएं और मानक शुल्क'}
                      </span>
                      <span>
                        {lang === 'en' ? 'Tap to Order' : 'ऑर्डर के लिए चुनें'}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {featuredServices.map((srv) => (
                        <button
                          key={srv.id}
                          type="button"
                          onClick={() => onStartOrder(srv)}
                          className="w-full p-3.5 bg-[#101014] hover:bg-[#23232E] border border-[#272732] hover:border-[#FF5C35]/60 rounded-xl text-left transition-colors flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-[#F7F3EA] truncate group-hover:text-[#FFB547] transition-colors">
                              {lang === 'en' ? srv.titleEn : srv.titleHi}
                            </div>
                            <div className="text-[11px] text-[#A09D96] mt-0.5">
                              {lang === 'en'
                                ? srv.estimatedTimeEn
                                : srv.estimatedTimeHi}{' '}
                              · {getCategoryLabel(srv.category)}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-extrabold text-[#FFB547] font-mono-tabular">
                              ₹{srv.priceInr}
                            </div>
                            <div className="text-[11px] text-[#A09D96] group-hover:text-[#FF5C35] transition-colors">
                              {lang === 'en' ? 'Order →' : 'चुनें →'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Security Guarantee */}
                  <div className="pt-4 border-t border-[#272732] flex items-center justify-between gap-3 text-xs text-[#D8D3C8]">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#FFB547] shrink-0" />
                      <span>
                        {lang === 'en'
                          ? 'Private Cloud Storage · No OTP/PIN Ever Asked'
                          : 'निजी क्लाउड सुरक्षा · कोई पिन या OTP नहीं मांगा जाता'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4-Column Operational Highlights Row Below Hero Split */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10 pt-8 border-t border-[#272732]">
              <div className="p-4 bg-[#18181F] rounded-xl border border-[#272732]">
                <div className="text-xs font-medium text-[#A09D96]">
                  {lang === 'en' ? 'Standard Pricing' : 'पारदर्शी सेवा शुल्क'}
                </div>
                <div className="text-xl font-extrabold text-[#FFB547] font-mono-tabular mt-1">
                  ₹40 – ₹100
                </div>
                <div className="text-xs text-[#D8D3C8] mt-1">
                  {lang === 'en'
                    ? 'Clear upfront rates before UPI payment'
                    : 'भुगतान से पहले स्पष्ट और पारदर्शी दरें'}
                </div>
              </div>

              <div className="p-4 bg-[#18181F] rounded-xl border border-[#272732]">
                <div className="text-xs font-medium text-[#A09D96]">
                  {lang === 'en' ? 'Fast Turnaround' : 'त्वरित डिलीवरी समय'}
                </div>
                <div className="text-xl font-extrabold text-[#F7F3EA] font-mono-tabular mt-1">
                  1 – 6 Hours
                </div>
                <div className="text-xs text-[#D8D3C8] mt-1">
                  {lang === 'en'
                    ? 'Same-day completion for resumes & PDFs'
                    : 'रिज्यूमे और PDF के लिए उसी दिन डिलीवरी'}
                </div>
              </div>

              <div className="p-4 bg-[#18181F] rounded-xl border border-[#272732]">
                <div className="text-xs font-medium text-[#A09D96]">
                  {lang === 'en' ? 'Bilingual Precision' : 'द्विभाषी विशेषज्ञता'}
                </div>
                <div className="text-xl font-extrabold text-[#F7F3EA] mt-1">
                  हिन्दी & English
                </div>
                <div className="text-xs text-[#D8D3C8] mt-1">
                  {lang === 'en'
                    ? 'Accurate Hindi (Unicode/KrutiDev) & English'
                    : 'हिंदी और अंग्रेजी दोनों में सटीक दस्तावेज़'}
                </div>
              </div>

              <div className="p-4 bg-[#18181F] rounded-xl border border-[#272732]">
                <div className="text-xs font-medium text-[#A09D96]">
                  {lang === 'en' ? 'Service Coverage' : 'स्थानीय सेवा क्षेत्र'}
                </div>
                <div className="text-xl font-extrabold text-[#F7F3EA] mt-1">
                  Kateya & Gopalganj
                </div>
                <div className="text-xs text-[#D8D3C8] mt-1">
                  {lang === 'en'
                    ? 'Serving Kateya, Panchdeori, Bhore & nearby'
                    : 'कटेया, पंचदेवरी, भोरे और गोपालगंज क्षेत्र'}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. BROWSE BY SERVICE CATEGORY GRID (Warm Cream #F7F3EA Canvas) */}
      {mode === 'home' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="text-xs font-semibold text-[#FF5C35] mb-1">
                {lang === 'en'
                  ? '01. Structured Digital Categories'
                  : '01. डिजिटल सेवा श्रेणियाँ'}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#101014] tracking-tight">
                {lang === 'en'
                  ? 'Browse Services by Category'
                  : 'श्रेणी के अनुसार सेवाएं चुनें'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('services')}
              className="text-xs sm:text-sm font-semibold text-[#101014] hover:text-[#FF5C35] flex items-center gap-1 self-start sm:self-auto transition-colors"
            >
              <span>
                {lang === 'en'
                  ? `View Full Catalog (${activeServices.length} Services)`
                  : `पूरी सूची देखें (${activeServices.length} सेवाएं)`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoriesList.filter((c) => c.key !== 'all').map((cat) => {
              const isSelected = selectedCategory === cat.key;
              const count = categoryCounts[cat.key] || 0;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => {
                    onSelectCategory(cat.key);
                    const el = document.getElementById('service-catalog');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`p-5 rounded-2xl border text-left transition-colors flex flex-col justify-between gap-4 ${
                    isSelected
                      ? 'bg-[#101014] text-[#F7F3EA] border-[#101014]'
                      : 'bg-[#FFFDF9] text-[#101014] border-[#E6DFD3] hover:border-[#FF5C35]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#18181F] border border-[#272732]'
                          : 'bg-[#F7F3EA] border border-[#E6DFD3]'
                      }`}
                    >
                      {getCategoryIcon(cat.key)}
                    </div>
                    <span
                      className={`text-xs font-mono-tabular font-semibold ${
                        isSelected ? 'text-[#FFB547]' : 'text-[#5C5852]'
                      }`}
                    >
                      {count} {lang === 'en' ? 'service(s)' : 'सेवाएं'}
                    </span>
                  </div>
                  <div>
                    <h3
                      className={`text-base font-bold ${
                        isSelected ? 'text-[#F7F3EA]' : 'text-[#101014]'
                      }`}
                    >
                      {lang === 'en' ? cat.labelEn : cat.labelHi}
                    </h3>
                    <p
                      className={`text-xs mt-1 leading-relaxed ${
                        isSelected ? 'text-[#D8D3C8]' : 'text-[#52504C]'
                      }`}
                    >
                      {lang === 'en' ? cat.summaryEn : cat.summaryHi}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. SERVICE CATALOG & INTERACTIVE FILTER SECTION */}
      <section
        id="service-catalog"
        className="max-w-7xl mx-auto px-4 sm:px-6 pt-2"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-xs font-semibold text-[#FF5C35] mb-1">
              {mode === 'home'
                ? lang === 'en'
                  ? '02. Transparent Pricing & Required Documents'
                  : '02. पारदर्शी शुल्क और आवश्यक दस्तावेज़'
                : lang === 'en'
                ? 'Complete Digital Services Directory'
                : 'संपूर्ण डिजिटल सेवा सूची'}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#101014] tracking-tight">
              {lang === 'en'
                ? 'Digital Services & Online Form Catalog'
                : 'डिजिटल सेवाएं और ऑनलाइन फॉर्म सूची'}
            </h2>
            <p className="text-sm sm:text-base text-[#52504C] mt-1">
              {lang === 'en'
                ? 'Select any service below to inspect required documents, check delivery time, and start your order.'
                : 'आवश्यक दस्तावेज़, समय और शुल्क देखने तथा ऑर्डर शुरू करने के लिए नीचे सेवा चुनें।'}
            </p>
          </div>

          <div className="w-full md:w-80 relative">
            <label htmlFor="catalog-search-input" className="sr-only">
              {lang === 'en' ? 'Filter services' : 'सेवाएं खोजें'}
            </label>
            <Search className="w-4 h-4 text-[#78746E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="catalog-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => onChangeSearch(e.target.value)}
              placeholder={
                lang === 'en'
                  ? 'Filter by service or document...'
                  : 'सेवा या दस्तावेज़ का नाम खोजें...'
              }
              className="w-full min-h-[44px] pl-10 pr-4 py-2 bg-[#FFFDF9] border border-[#DCD4C6] rounded-xl text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
            />
          </div>
        </div>

        {/* Interactive Category Filter Tabs */}
        <div
          role="tablist"
          aria-label={lang === 'en' ? 'Service Categories' : 'सेवा श्रेणियाँ'}
          className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-[#E6DFD3]"
        >
          {categoriesList.map((cat) => {
            const active = selectedCategory === cat.key;
            const count = categoryCounts[cat.key] || 0;
            return (
              <button
                key={cat.key}
                role="tab"
                aria-selected={active}
                type="button"
                onClick={() => onSelectCategory(cat.key)}
                className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                  active
                    ? 'bg-[#101014] text-[#F7F3EA]'
                    : 'bg-[#FFFDF9] text-[#101014] border border-[#E6DFD3] hover:bg-[#ECE5D8]'
                }`}
              >
                <span>{lang === 'en' ? cat.labelEn : cat.labelHi}</span>
                <span
                  className={`font-mono-tabular text-xs ${
                    active ? 'text-[#FFB547]' : 'text-[#5C5852]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Service Cards Grid */}
        {filteredServices.length === 0 ? (
          <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl p-10 text-center">
            <h3 className="text-lg font-bold text-[#101014] mb-2">
              {lang === 'en'
                ? 'No matching services found'
                : 'कोई मिलती-जुलती सेवा नहीं मिली'}
            </h3>
            <p className="text-sm text-[#52504C] mb-6">
              {lang === 'en'
                ? 'Try clearing your search filter or selecting "All Services".'
                : 'कृपया अपनी खोज बदलें या "सभी सेवाएं" चुनें।'}
            </p>
            <button
              type="button"
              onClick={() => {
                onSelectCategory('all');
                onChangeSearch('');
              }}
              className="min-h-[44px] px-5 py-2.5 bg-[#FF5C35] text-white text-sm font-semibold rounded-xl hover:bg-[#E84B25] transition-colors"
            >
              {lang === 'en' ? 'Reset Filters' : 'फ़िल्टर रीसेट करें'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((srv, index) => {
              const docPreviewItems = srv.requiredDocs
                .split(',')
                .map((d) => d.trim())
                .filter(Boolean)
                .slice(0, 3);

              return (
                <article
                  key={srv.id}
                  className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl p-6 flex flex-col justify-between hover:border-[#101014] transition-colors"
                >
                  <div>
                    {/* Top Row: Category Icon + Unboxed Metadata */}
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-[#5C5852]">
                        <span className="font-mono-tabular font-bold text-[#FF5C35]">
                          {String(index + 1).padStart(2, '0')}.
                        </span>
                        <span className="font-medium text-[#101014]">
                          {getCategoryLabel(srv.category)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#78746E]" />
                          {lang === 'en'
                            ? srv.estimatedTimeEn
                            : srv.estimatedTimeHi}
                        </span>
                      </div>

                      <div className="w-9 h-9 rounded-xl bg-[#F7F3EA] border border-[#E6DFD3] flex items-center justify-center shrink-0">
                        {getCategoryIcon(srv.category)}
                      </div>
                    </div>

                    <h3 className="font-display text-lg font-bold text-[#101014] mb-2 leading-snug">
                      {lang === 'en' ? srv.titleEn : srv.titleHi}
                    </h3>

                    <p className="text-sm text-[#52504C] leading-relaxed mb-4">
                      {lang === 'en' ? srv.descEn : srv.descHi}
                    </p>

                    {/* Structured Required Documents Preview */}
                    <div className="pt-3.5 border-t border-[#E6DFD3] mb-6 space-y-2">
                      <div className="text-xs font-semibold text-[#101014]">
                        {lang === 'en'
                          ? 'Key Required Documents:'
                          : 'प्रमुख आवश्यक दस्तावेज़:'}
                      </div>
                      <ul className="space-y-1 text-xs text-[#52504C]">
                        {docPreviewItems.map((docItem, dIdx) => (
                          <li key={dIdx} className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#FF5C35] shrink-0 mt-0.5" />
                            <span className="truncate">{docItem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E6DFD3] flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-medium text-[#5C5852]">
                        {lang === 'en' ? 'Service Fee' : 'सेवा शुल्क'}
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-extrabold text-[#101014] font-mono-tabular">
                          ₹{srv.priceInr}
                        </span>
                        {Boolean(
                          srv.minPriceInr &&
                            srv.maxPriceInr &&
                            srv.maxPriceInr >= srv.minPriceInr
                        ) && (
                          <span className="text-[11px] text-[#5C5852] font-mono-tabular">
                            (₹{srv.minPriceInr}–₹{srv.maxPriceInr})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onInspectService(srv)}
                        className="min-h-[42px] px-3.5 py-2 text-xs font-semibold text-[#101014] bg-[#F7F3EA] hover:bg-[#ECE5D8] border border-[#E6DFD3] rounded-xl transition-colors whitespace-nowrap"
                      >
                        {lang === 'en' ? 'Details' : 'विवरण'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onStartOrder(srv)}
                        className="min-h-[42px] px-4 py-2 text-xs font-semibold text-[#F7F3EA] bg-[#101014] hover:bg-[#FF5C35] hover:text-white rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5"
                      >
                        <span>{lang === 'en' ? 'Order Now' : 'ऑर्डर करें'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. SIMPLE THREE-STEP WORKFLOW SECTION (Charcoal #101014 Band) */}
      {mode === 'home' && (
        <section className="bg-[#101014] text-[#F7F3EA] border-y border-[#272732] py-14 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
            <div className="max-w-2xl space-y-2">
              <div className="text-xs font-semibold text-[#FFB547]">
                {lang === 'en'
                  ? '03. Simple Three-Step Process'
                  : '03. सरल तीन-चरणीय प्रक्रिया'}
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F7F3EA] tracking-tight">
                {lang === 'en'
                  ? 'How Online Ordering & Document Delivery Works'
                  : 'ऑनलाइन ऑर्डर और दस्तावेज़ डिलीवरी कैसे काम करती है'}
              </h2>
              <p className="text-sm text-[#D8D3C8] leading-relaxed">
                {lang === 'en'
                  ? 'Designed for mobile users in Kateya and Gopalganj—complete your digital work in three transparent steps without visiting the shop multiple times.'
                  : 'कटेया और गोपालगंज के मोबाइल उपयोगकर्ताओं के लिए डिज़ाइन किया गया—दुकान के बार-बार चक्कर लगाए बिना तीन सरल चरणों में अपना काम पूरा करें।'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-[#18181F] border border-[#272732] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono-tabular text-xs font-bold text-[#FF5C35]">
                    STEP 01
                  </span>
                  <Upload className="w-5 h-5 text-[#FF5C35]" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#F7F3EA]">
                  {lang === 'en'
                    ? '01. Fill Details & Upload Docs'
                    : '01. विवरण भरें और दस्तावेज़ जोड़ें'}
                </h3>
                <p className="text-xs sm:text-sm text-[#D8D3C8] leading-relaxed">
                  {lang === 'en'
                    ? 'Choose your service, enter the required form details, and attach clear mobile photos or PDF scans of your supporting certificates.'
                    : 'अपनी सेवा चुनें, आवश्यक विवरण भरें और अपने प्रमाणपत्रों की साफ फोटो या PDF अपलोड करें।'}
                </p>
              </div>

              <div className="p-6 bg-[#18181F] border border-[#272732] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono-tabular text-xs font-bold text-[#FFB547]">
                    STEP 02
                  </span>
                  <CreditCard className="w-5 h-5 text-[#FFB547]" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#F7F3EA]">
                  {lang === 'en'
                    ? '02. Admin Review & UPI Verification'
                    : '02. एडमिन जांच और UPI सत्यापन'}
                </h3>
                <p className="text-xs sm:text-sm text-[#D8D3C8] leading-relaxed">
                  {lang === 'en'
                    ? 'Receive your unique Order ID (AOC-...). Pay the transparent fee via UPI and submit the 12-digit UTR number for manual admin verification.'
                    : 'अपनी यूनिक ऑर्डर आईडी प्राप्त करें। UPI के माध्यम से शुल्क का भुगतान करें और सत्यापन के लिए 12-अंकीय UTR नंबर दर्ज करें।'}
                </p>
              </div>

              <div className="p-6 bg-[#18181F] border border-[#272732] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono-tabular text-xs font-bold text-emerald-400">
                    STEP 03
                  </span>
                  <Download className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-display text-lg font-bold text-[#F7F3EA]">
                  {lang === 'en'
                    ? '03. Download Completed PDF'
                    : '03. तैयार PDF डाउनलोड करें'}
                </h3>
                <p className="text-xs sm:text-sm text-[#D8D3C8] leading-relaxed">
                  {lang === 'en'
                    ? 'Track live status across 8 stages. Once completed, download your final print-ready PDF or application acknowledgment receipt directly.'
                    : '8 चरणों में लाइव स्थिति ट्रैक करें। कार्य पूरा होने पर सीधे अपना तैयार PDF या पावती रसीद डाउनलोड करें।'}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. TRUST & PRIVACY ASSURANCE + FREQUENTLY ASKED QUESTIONS (Warm Cream #F7F3EA) */}
      {mode === 'home' && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          {/* Security & Location Split */}
          <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#FF5C35]">
                <Shield className="w-4 h-4" />
                <span>
                  {lang === 'en'
                    ? '04. Security & Privacy Commitment'
                    : '04. सुरक्षा और गोपनीयता प्रतिबद्धता'}
                </span>
              </div>
              <h2 className="font-display text-2xl font-extrabold text-[#101014]">
                {lang === 'en'
                  ? 'Your Personal Documents Stay Strictly Private'
                  : 'आपके व्यक्तिगत दस्तावेज़ पूरी तरह सुरक्षित रहते हैं'}
              </h2>
              <p className="text-sm sm:text-base text-[#52504C] leading-relaxed">
                {lang === 'en'
                  ? 'Unlike sending sensitive marksheets or Aadhaar copies over public WhatsApp groups, documents uploaded on Aditya Online Center are protected by strict user-isolated security rules. Only you and the authorized center operator can view your order files.'
                  : 'सार्वजनिक ग्रुप में दस्तावेज़ भेजने के बजाय, आदित्य ऑनलाइन सेंटर पर अपलोड किए गए दस्तावेज़ सुरक्षित नियमों से सुरक्षित रहते हैं। केवल आप और अधिकृत ऑपरेटर ही आपकी फ़ाइलें देख सकते हैं।'}
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('track-order')}
                  className="min-h-[44px] px-4 py-2 bg-[#101014] text-[#F7F3EA] text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#FF5C35] hover:text-white transition-colors"
                >
                  {lang === 'en'
                    ? 'Track an Existing Order'
                    : 'मौजूदा ऑर्डर ट्रैक करें'}
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('privacy')}
                  className="min-h-[44px] px-4 py-2 bg-[#F7F3EA] text-[#101014] border border-[#E6DFD3] text-xs sm:text-sm font-semibold rounded-xl hover:bg-[#ECE5D8] transition-colors"
                >
                  {lang === 'en' ? 'Read Privacy Policy' : 'गोपनीयता नीति पढ़ें'}
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#F7F3EA] border border-[#E6DFD3] rounded-xl p-6 space-y-4">
              <h3 className="font-display text-base font-bold text-[#101014]">
                {lang === 'en'
                  ? 'Center Location & Assistance Desk'
                  : 'केंद्र का पता और सहायता डेस्क'}
              </h3>
              <div className="space-y-3 text-sm text-[#52504C]">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#FF5C35] shrink-0 mt-1" />
                  <span>
                    {lang === 'en'
                      ? BUSINESS_INFO.addressEn
                      : BUSINESS_INFO.addressHi}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <PhoneCall className="w-4 h-4 text-[#FF5C35] shrink-0" />
                  <span className="font-mono-tabular text-[#101014] font-medium">
                    WhatsApp: {BUSINESS_INFO.whatsappNumber}
                  </span>
                </div>
                <div className="text-xs text-[#5C5852] pt-2 border-t border-[#DCD4C6] flex items-center justify-between gap-2">
                  <span>
                    {lang === 'en'
                      ? `Working Days: ${BUSINESS_INFO.workingDaysEn}`
                      : `कार्य दिवस: ${BUSINESS_INFO.workingDaysHi}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('contact')}
                    className="font-semibold text-[#FF5C35] hover:underline"
                  >
                    {lang === 'en' ? 'Contact Us →' : 'संपर्क करें →'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive FAQ Accordion Section */}
          <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl p-6 sm:p-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#FF5C35] mb-1">
                  <HelpCircle className="w-4 h-4" />
                  <span>
                    {lang === 'en'
                      ? '05. Common Questions & Answers'
                      : '05. सामान्य प्रश्न और उत्तर (FAQ)'}
                  </span>
                </div>
                <h2 className="font-display text-2xl font-extrabold text-[#101014]">
                  {lang === 'en'
                    ? 'Frequently Asked Questions'
                    : 'अक्सर पूछे जाने वाले प्रश्न'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="text-xs sm:text-sm font-semibold text-[#FF5C35] hover:underline self-start sm:self-auto"
              >
                {lang === 'en'
                  ? 'Still have a question? Contact Us →'
                  : 'कोई अन्य प्रश्न है? हमसे संपर्क करें →'}
              </button>
            </div>

            <div className="divide-y divide-[#E6DFD3] border-t border-b border-[#E6DFD3]">
              {FAQ_ITEMS.map((item) => {
                const isOpen = openFaqId === item.id;
                return (
                  <div key={item.id} className="py-4">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() =>
                        setOpenFaqId((prev) =>
                          prev === item.id ? '' : item.id
                        )
                      }
                      className="w-full min-h-[44px] text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-[#101014] hover:text-[#FF5C35] transition-colors"
                    >
                      <span>{lang === 'en' ? item.qEn : item.qHi}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#FF5C35] shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#78746E] shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <p className="mt-2.5 text-xs sm:text-sm text-[#52504C] leading-relaxed pr-6">
                        {lang === 'en' ? item.aEn : item.aHi}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
