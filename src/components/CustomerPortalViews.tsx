import React from 'react';
import {
  AppView,
  CenterSettings,
  Language,
  OrderFile,
  OrderStatusEvent,
  ServiceOrder,
  UserProfile,
} from '../types';
import {
  ORDER_WORKFLOW_STEPS,
  buildDynamicUpiUri,
  buildOrderWhatsAppDispatchUrl,
  canCustomerCancelOrder,
  canCustomerSubmitUtr,
  generateQrMatrix,
  isSafeDataUrl,
  sanitizeString,
  validateUploadedFile,
  validateUpiUtr,
} from '../utils/rules';
import {
  DEMO_SAMPLE_FILES,
  DEMO_SAMPLE_HISTORY,
  DEMO_SAMPLE_ORDERS,
} from '../data/initialCatalog';
import { BUSINESS_INFO } from '../config/businessInfo';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  CreditCard,
  FileText,
  User,
  ShieldAlert,
  XCircle,
  Send,
  Upload,
  ArrowUpRight,
  Plus,
  MessageCircle,
  Volume2,
} from 'lucide-react';

interface CustomerPortalViewsProps {
  mode: 'track-order' | 'dashboard';
  lang: Language;
  orders: ServiceOrder[];
  orderFiles: Record<string, OrderFile[]>;
  orderHistory: Record<string, OrderStatusEvent[]>;
  selectedOrderNumber: string;
  onSelectOrderNumber: (orderNumber: string) => void;
  userProfile: UserProfile | null;
  settings: CenterSettings;
  onSaveProfile: (updated: {
    displayName: string;
    phone: string;
    villageOrTown: string;
    preferredLanguage: Language;
  }) => Promise<void>;
  onSubmitUpiPayment: (
    order: ServiceOrder,
    utr: string,
    receiptFile?: {
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      dataUrl: string;
    }
  ) => Promise<void>;
  onSubmitCustomerInfoReply: (
    order: ServiceOrder,
    reply: string
  ) => Promise<void>;
  onCancelOrder: (order: ServiceOrder) => Promise<void>;
  onNavigate: (view: AppView) => void;
}

export const CustomerPortalViews: React.FC<CustomerPortalViewsProps> = ({
  mode,
  lang,
  orders,
  orderFiles,
  orderHistory,
  selectedOrderNumber,
  onSelectOrderNumber,
  userProfile,
  settings,
  onSaveProfile,
  onSubmitUpiPayment,
  onSubmitCustomerInfoReply,
  onCancelOrder,
  onNavigate,
}) => {
  const [lookupInput, setLookupInput] = React.useState(
    selectedOrderNumber || (orders[0]?.orderNumber ?? '')
  );
  const [utrInput, setUtrInput] = React.useState('');
  const [receiptUpload, setReceiptUpload] = React.useState<{
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    dataUrl: string;
  } | null>(null);
  const [infoReplyInput, setInfoReplyInput] = React.useState('');
  const [feedbackMsg, setFeedbackMsg] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Profile editor state for Dashboard
  const [profName, setProfName] = React.useState(
    userProfile?.displayName || ''
  );
  const [profPhone, setProfPhone] = React.useState(userProfile?.phone || '');
  const [profLocation, setProfLocation] = React.useState(
    userProfile?.villageOrTown || 'Kateya, Gopalganj'
  );

  React.useEffect(() => {
    if (selectedOrderNumber) {
      setLookupInput(selectedOrderNumber);
    } else if (!lookupInput && orders.length > 0) {
      setLookupInput(orders[0].orderNumber);
    }
  }, [selectedOrderNumber, orders]);

  React.useEffect(() => {
    if (userProfile) {
      setProfName(userProfile.displayName);
      setProfPhone(userProfile.phone);
      setProfLocation(userProfile.villageOrTown);
    }
  }, [userProfile]);

  const activeOrder = React.useMemo(() => {
    const clean = lookupInput.trim().toUpperCase();
    const matchedUserOrder =
      orders.find((o) => o.orderNumber.toUpperCase() === clean) ||
      orders.find((o) => o.orderNumber === selectedOrderNumber) ||
      orders[0] ||
      null;
    if (matchedUserOrder) return matchedUserOrder;
    if (mode === 'track-order' && clean.length > 0) {
      return (
        DEMO_SAMPLE_ORDERS.find(
          (o) => o.orderNumber.toUpperCase() === clean
        ) || null
      );
    }
    return null;
  }, [orders, lookupInput, selectedOrderNumber, mode]);

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const valid = validateUploadedFile({
      name: file.name,
      type: file.type,
      size: file.size,
    });
    if (!valid.valid) {
      setFeedbackMsg({
        type: 'error',
        text: lang === 'en' ? valid.errorEn! : valid.errorHi!,
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptUpload({
        fileName: sanitizeString(file.name, 140),
        mimeType: file.type,
        sizeBytes: file.size,
        dataUrl: String(reader.result || ''),
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUpiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    setFeedbackMsg(null);
    const check = validateUpiUtr(utrInput);
    if (!check.valid) {
      setFeedbackMsg({
        type: 'error',
        text: lang === 'en' ? check.errorEn! : check.errorHi!,
      });
      return;
    }
    try {
      await onSubmitUpiPayment(
        activeOrder,
        utrInput.trim(),
        receiptUpload || undefined
      );
      setUtrInput('');
      setReceiptUpload(null);
      setFeedbackMsg({
        type: 'success',
        text:
          lang === 'en'
            ? 'UPI transaction reference submitted. Payment remains Pending Verification until checked by the admin.'
            : 'UPI ट्रांजेक्शन नंबर दर्ज हो गया है। एडमिन द्वारा जांच किए जाने तक भुगतान सत्यापन लंबित रहेगा।',
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text:
          err instanceof Error ? err.message : 'Payment submission failed.',
      });
    }
  };

  const handleInfoReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    setFeedbackMsg(null);
    const cleanReply = sanitizeString(infoReplyInput, 950);
    if (!cleanReply) {
      setFeedbackMsg({
        type: 'error',
        text:
          lang === 'en'
            ? 'Please enter the requested information before submitting.'
            : 'कृपया सबमिट करने से पहले मांगी गई जानकारी लिखें।',
      });
      return;
    }
    try {
      await onSubmitCustomerInfoReply(activeOrder, cleanReply);
      setInfoReplyInput('');
      setFeedbackMsg({
        type: 'success',
        text:
          lang === 'en'
            ? 'Information submitted to Aditya Online Center. Status updated to In Progress.'
            : 'जानकारी भेज दी गई है। ऑर्डर की स्थिति "प्रगति पर" कर दी गई है।',
      });
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to submit reply.',
      });
    }
  };

  // ============================================================================
  // MODE: CUSTOMER PORTAL & ORDER LEDGER
  // ============================================================================
  if (mode === 'dashboard') {
    return (
      <div className="bg-[#F7F3EA] min-h-screen">
        {/* Dark Charcoal Editorial Masthead with Glassmorphic Summary */}
        <section className="editorial-dark-grid text-[#F7F3EA] border-b border-[#272732]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <div className="rounded-3xl glass-obsidian-panel p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="space-y-2">
                <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.2em] text-[#FF5C35]">
                  03. CUSTOMER PORTAL & ARCHIVE
                </div>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F7F3EA] tracking-tight">
                  {lang === 'en'
                    ? 'Customer Portal & Order History'
                    : 'ग्राहक पोर्टल और ऑर्डर इतिहास'}
                </h1>
                <p className="text-xs sm:text-sm text-[#D8D3C8] max-w-xl">
                  {lang === 'en'
                    ? 'Manage your profile details, view your own submitted orders, and download completed documents.'
                    : 'अपना प्रोफ़ाइल विवरण प्रबंधित करें, अपने ऑर्डर देखें और तैयार दस्तावेज़ डाउनलोड करें।'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('services')}
                className="min-h-[46px] px-5 py-3 bg-[#FF5C35] hover:bg-[#E54922] text-white text-xs sm:text-sm font-bold transition-colors self-start sm:self-auto flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {lang === 'en' ? 'New Service Order' : 'नया ऑर्डर करें'}
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
          {feedbackMsg && (
            <div
              role="status"
              className={`p-4 border-l-4 text-sm font-medium ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-50 border-emerald-700 text-emerald-950'
                  : 'bg-red-50 border-red-600 text-red-900'
              }`}
            >
              {feedbackMsg.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left 4 Columns: Customer Profile Specification */}
            <div className="lg:col-span-4 space-y-5">
              <div className="flex items-baseline justify-between border-b-2 border-[#101014] pb-3">
                <h2 className="font-display text-lg font-extrabold text-[#101014] flex items-center gap-2">
                  <span className="font-mono-tabular text-xs text-[#FF5C35]">
                    01.
                  </span>
                  <span>
                    {lang === 'en'
                      ? 'My Customer Profile'
                      : 'मेरा ग्राहक प्रोफ़ाइल'}
                  </span>
                </h2>
                <User className="w-4 h-4 text-[#FF5C35]" />
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await onSaveProfile({
                    displayName: sanitizeString(profName, 100),
                    phone: sanitizeString(profPhone, 20),
                    villageOrTown: sanitizeString(profLocation, 120),
                    preferredLanguage: lang,
                  });
                  setFeedbackMsg({
                    type: 'success',
                    text:
                      lang === 'en'
                        ? 'Profile saved successfully.'
                        : 'प्रोफ़ाइल सफलतापूर्वक सहेजा गया।',
                  });
                }}
                className="space-y-4 bg-[#FFFDF9] border border-[#101014] p-6"
              >
                <div>
                  <label
                    htmlFor="prof-name"
                    className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#101014] mb-1.5"
                  >
                    {lang === 'en' ? 'Full Name' : 'पूरा नाम'}
                  </label>
                  <input
                    id="prof-name"
                    type="text"
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#F7F3EA] border border-[#101014] text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prof-phone"
                    className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#101014] mb-1.5"
                  >
                    {lang === 'en' ? 'Mobile Number' : 'मोबाइल नंबर'}
                  </label>
                  <input
                    id="prof-phone"
                    type="tel"
                    value={profPhone}
                    onChange={(e) => setProfPhone(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#F7F3EA] border border-[#101014] text-sm font-mono-tabular text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prof-location"
                    className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#101014] mb-1.5"
                  >
                    {lang === 'en' ? 'Village / Town' : 'गाँव / शहर'}
                  </label>
                  <input
                    id="prof-location"
                    type="text"
                    value={profLocation}
                    onChange={(e) => setProfLocation(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#F7F3EA] border border-[#101014] text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full min-h-[44px] px-4 py-2.5 bg-[#101014] hover:bg-[#FF5C35] text-white text-xs font-mono-tabular uppercase tracking-wider font-bold transition-colors"
                >
                  {lang === 'en' ? 'Save Profile Changes' : 'प्रोफ़ाइल सहेजें'}
                </button>
              </form>
            </div>

            {/* Right 8 Columns: Personal Order History Ledger */}
            <div className="lg:col-span-8 space-y-5">
              <div className="flex items-baseline justify-between border-b-2 border-[#101014] pb-3">
                <h2 className="font-display text-lg font-extrabold text-[#101014] flex items-center gap-2">
                  <span className="font-mono-tabular text-xs text-[#FF5C35]">
                    02.
                  </span>
                  <span>
                    {lang === 'en' ? 'My Orders' : 'मेरे ऑर्डर'} ({orders.length})
                  </span>
                </h2>
                <span className="font-mono-tabular text-xs text-[#5C5852]">
                  ABAC ISOLATED RECORDS
                </span>
              </div>

              {orders.length === 0 ? (
                <div className="bg-[#FFFDF9] border border-[#101014] p-10 text-center space-y-4">
                  <p className="text-sm text-[#4A463E]">
                    {lang === 'en'
                      ? 'You have not placed any orders yet.'
                      : 'आपने अभी तक कोई ऑर्डर नहीं किया है।'}
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('services')}
                    className="min-h-[44px] px-5 py-2.5 bg-[#FF5C35] hover:bg-[#E54922] text-white text-xs font-mono-tabular font-bold uppercase tracking-wider transition-colors"
                  >
                    {lang === 'en' ? 'Explore Services' : 'सेवाएं देखें'}
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto bg-[#FFFDF9] border border-[#101014]">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[#101014] bg-[#EFE9DC] font-mono-tabular text-[11px] uppercase tracking-wider text-[#5C5852]">
                        <th className="py-3.5 px-4 font-bold">
                          {lang === 'en' ? 'Order ID' : 'ऑर्डर आईडी'}
                        </th>
                        <th className="py-3.5 px-4 font-bold">
                          {lang === 'en' ? 'Service' : 'सेवा'}
                        </th>
                        <th className="py-3.5 px-4 font-bold text-right">
                          {lang === 'en' ? 'Fee' : 'शुल्क'}
                        </th>
                        <th className="py-3.5 px-4 font-bold">
                          {lang === 'en'
                            ? 'Status & Payment'
                            : 'स्थिति और भुगतान'}
                        </th>
                        <th className="py-3.5 px-4 font-bold text-right">
                          {lang === 'en' ? 'Action' : 'कार्य'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCD4C6]">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#F7F3EA]">
                          <td className="py-4 px-4 font-mono-tabular font-bold text-[#C83713] whitespace-nowrap">
                            {ord.orderNumber}
                          </td>
                          <td className="py-4 px-4 text-[#101014]">
                            <div className="font-bold">
                              {lang === 'en'
                                ? ord.serviceTitleEn
                                : ord.serviceTitleHi}
                            </div>
                            <div className="text-xs text-[#787166] font-mono-tabular">
                              {ord.createdAt.slice(0, 10)}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right font-mono-tabular font-bold text-[#101014] whitespace-nowrap">
                            ₹{ord.priceInr}
                          </td>
                          <td className="py-4 px-4 text-xs text-[#4A463E]">
                            <span className="font-bold text-[#101014]">
                              {ord.status}
                            </span>
                            <span aria-hidden="true"> · </span>
                            <span className="font-mono-tabular">
                              {ord.paymentStatus}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectOrderNumber(ord.orderNumber);
                                onNavigate('track-order');
                              }}
                              className="min-h-[38px] px-3.5 py-1.5 bg-[#101014] hover:bg-[#FF5C35] text-white font-mono-tabular font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-1"
                            >
                              <span>
                                {lang === 'en'
                                  ? 'Track / Download'
                                  : 'ट्रैक / डाउनलोड'}
                              </span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ============================================================================
  // MODE: TRACK ORDER STATUS, UPI VERIFICATION & DELIVERABLE VAULT
  // ============================================================================
  const currentStepIndex = activeOrder
    ? ORDER_WORKFLOW_STEPS.indexOf(
        activeOrder.status as (typeof ORDER_WORKFLOW_STEPS)[number]
      )
    : -1;

  const filesForActiveOrder = activeOrder
    ? orderFiles[activeOrder.orderNumber] ||
      orderFiles[activeOrder.id] ||
      (mode === 'track-order'
        ? DEMO_SAMPLE_FILES[activeOrder.orderNumber]
        : undefined) ||
      []
    : [];
  const deliverables = filesForActiveOrder.filter(
    (f) => f.fileCategory === 'final_deliverable'
  );
  const customerUploadedDocs = filesForActiveOrder.filter(
    (f) => f.fileCategory !== 'final_deliverable'
  );
  const historyForActiveOrder = activeOrder
    ? orderHistory[activeOrder.orderNumber] ||
      orderHistory[activeOrder.id] ||
      (mode === 'track-order'
        ? DEMO_SAMPLE_HISTORY[activeOrder.orderNumber]
        : undefined) ||
      []
    : [];

  return (
    <div className="bg-[#F7F3EA] min-h-screen">
      {/* Dark Charcoal Command Masthead with Glassmorphic Order Search */}
      <section className="editorial-dark-grid text-[#F7F3EA] border-b border-[#272732]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
          <div className="rounded-3xl glass-obsidian-panel p-6 sm:p-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.2em] text-[#FF5C35]">
                02. LIVE WORKFLOW & DELIVERABLE VAULT
              </div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F7F3EA] tracking-tight">
                {lang === 'en'
                  ? 'Track Order Status, Payment & Downloads'
                  : 'ऑर्डर की स्थिति, भुगतान और डाउनलोड ट्रैक करें'}
              </h1>
              <p className="text-xs sm:text-sm text-[#D8D3C8] max-w-2xl">
                {lang === 'en'
                  ? 'Enter your Order ID (e.g., AOC-20261018-D101) or choose from your orders below.'
                  : 'अपना ऑर्डर नंबर दर्ज करें या नीचे दिए गए अपने ऑर्डर में से चुनें।'}
              </p>
            </div>

            {/* Order ID Glass Command Input */}
            <div className="w-full lg:w-96 shrink-0 space-y-2">
              <label
                htmlFor="track-order-id-input"
                className="block font-mono-tabular text-[11px] uppercase tracking-wider text-[#FFB547]"
              >
                {lang === 'en' ? 'ENTER UNIQUE ORDER ID' : 'ऑर्डर नंबर दर्ज करें'}
              </label>
              <div className="relative rounded-xl glass-ember-search transition-all focus-within:ring-2 focus-within:ring-[#FF5C35]/50 focus-within:shadow-[0_0_24px_-4px_rgba(255,92,53,0.4)]">
                <Search className="w-4 h-4 text-[#FF5C35] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="track-order-id-input"
                  type="text"
                  value={lookupInput}
                  onChange={(e) => {
                    setLookupInput(e.target.value);
                    onSelectOrderNumber(e.target.value);
                  }}
                  placeholder="AOC-20261018-D101"
                  className="w-full min-h-[46px] pl-10 pr-4 py-2 bg-transparent text-sm font-mono-tabular text-[#F7F3EA] focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono-tabular text-[#A09D96]">
                <span>{lang === 'en' ? 'INSTANT DEMO:' : 'डेमो आईडी:'}</span>
                <button
                  type="button"
                  data-testid="track-sample-order-chip"
                  onClick={() => {
                    setLookupInput('AOC-20261018-D101');
                    onSelectOrderNumber('AOC-20261018-D101');
                    setFeedbackMsg(null);
                  }}
                  className="px-2.5 py-0.5 rounded-full bg-[#FF5C35]/15 hover:bg-[#FF5C35]/30 border border-[#FF5C35]/40 text-[#FFB547] font-bold transition-colors"
                >
                  AOC-20261018-D101 ↗
                </button>
              </div>
            </div>
          </div>

          {orders.length > 0 && (
            <div className="pt-4 border-t border-[#272732] flex flex-wrap items-center gap-2">
              <span className="font-mono-tabular text-xs uppercase tracking-wider text-[#A09D96] mr-1">
                {lang === 'en' ? 'YOUR ORDERS:' : 'आपके ऑर्डर:'}
              </span>
              {orders.map((ord) => {
                const isSelected = activeOrder?.orderNumber === ord.orderNumber;
                return (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => {
                      setLookupInput(ord.orderNumber);
                      onSelectOrderNumber(ord.orderNumber);
                      setFeedbackMsg(null);
                    }}
                    className={`min-h-[36px] px-3 py-1 text-xs font-mono-tabular font-semibold border transition-colors ${
                      isSelected
                        ? 'bg-[#FF5C35] text-white border-[#FF5C35]'
                        : 'bg-[#16161E] text-[#D8D3C8] border-[#272732] hover:border-[#FFB547]'
                    }`}
                  >
                    {ord.orderNumber} ({ord.status})
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        {feedbackMsg && (
          <div
            role="status"
            className={`p-4 border-l-4 text-sm font-medium ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-700 text-emerald-950'
                : 'bg-red-50 border-red-600 text-red-900'
            }`}
          >
            {feedbackMsg.text}
          </div>
        )}

        {!activeOrder ? (
          <div className="glass-cream-panel p-8 sm:p-10 text-center space-y-4">
            <p className="font-display text-lg sm:text-xl font-bold text-[#101014]">
              {lang === 'en'
                ? 'No order found matching that Order ID.'
                : 'इस ऑर्डर आईडी से कोई ऑर्डर नहीं मिला।'}
            </p>
            <p className="text-xs sm:text-sm text-[#4A463E] max-w-lg mx-auto">
              {lang === 'en'
                ? 'Sign in to view your personal order ledger or start a new digital service request to receive an instant Order ID (AOC-YYYYMMDD-XXXX).'
                : 'अपने ऑर्डर देखने के लिए लॉगिन करें या नया डिजिटल सेवा ऑर्डर शुरू करें।'}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('services')}
                className="min-h-[44px] px-5 py-2.5 bg-[#FF5C35] hover:bg-[#E54922] text-white text-xs font-mono-tabular font-bold uppercase tracking-wider transition-colors"
              >
                {lang === 'en' ? 'Explore Services & Order' : 'सेवाएं देखें और ऑर्डर करें'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="min-h-[44px] px-5 py-2.5 bg-[#101014] hover:bg-[#272732] text-[#F7F3EA] text-xs font-mono-tabular font-bold uppercase tracking-wider transition-colors"
              >
                {lang === 'en' ? 'Open Customer Portal' : 'ग्राहक पोर्टल खोलें'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* 01. ORDER SPECIFICATION & 8-STAGE PROGRESS MATRIX */}
            <div className="glass-cream-panel p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b-2 border-[#101014]">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 font-mono-tabular text-xs text-[#5C5852]">
                    <span className="font-bold text-[#C83713]">
                      {activeOrder.orderNumber}
                    </span>
                    <span aria-hidden="true">/</span>
                    <span>{activeOrder.customerName}</span>
                    <span aria-hidden="true">/</span>
                    <span>{activeOrder.customerLocation}</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#101014] tracking-tight">
                    {lang === 'en'
                      ? activeOrder.serviceTitleEn
                      : activeOrder.serviceTitleHi}
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-left sm:text-right">
                    <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#787166]">
                      {lang === 'en'
                        ? 'CONFIRMED FEE · PAYMENT STATUS'
                        : 'निर्धारित शुल्क · भुगतान स्थिति'}
                    </div>
                    <div className="text-lg sm:text-xl font-extrabold text-[#101014] font-mono-tabular mt-0.5">
                      ₹{activeOrder.priceInr} · {activeOrder.paymentStatus}
                    </div>
                  </div>

                  {canCustomerCancelOrder(activeOrder.status) && (
                    <button
                      type="button"
                      onClick={async () => {
                        await onCancelOrder(activeOrder);
                        setFeedbackMsg({
                          type: 'success',
                          text:
                            lang === 'en'
                              ? 'Order has been cancelled.'
                              : 'ऑर्डर रद्द कर दिया गया है।',
                        });
                      }}
                      className="min-h-[40px] px-3.5 py-2 text-xs font-mono-tabular font-bold uppercase tracking-wider text-red-800 bg-red-50 hover:bg-red-100 border border-red-300 transition-colors flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>
                        {lang === 'en' ? 'Cancel Order' : 'ऑर्डर रद्द करें'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* 8-Stage Status Workflow Matrix (Interactive Glowing Stepper) */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.16em] text-[#5C5852]">
                    {lang === 'en'
                      ? '01. 8-STAGE LIVE WORKFLOW TRACKER (SUBMITTED → DELIVERED)'
                      : '01. 8-चरणीय लाइव ऑर्डर प्रगति ट्रैक (सबमिटेड → डिलीवर्ड)'}
                  </div>
                  <div className="flex items-center gap-3 font-mono-tabular text-[11px]">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {lang === 'en' ? 'Completed' : 'पूर्ण'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#C83713] font-bold">
                      <span className="w-2 h-2 rounded-full bg-[#FF5C35] animate-ping" />
                      {lang === 'en' ? 'Active Stage' : 'वर्तमान चरण'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[#787166]">
                      <span className="w-2 h-2 rounded-full bg-[#D5CEC2]" />
                      {lang === 'en' ? 'Pending' : 'प्रतीक्षित'}
                    </span>
                  </div>
                </div>

                {activeOrder.status === 'Cancelled' ? (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-300 text-sm text-red-900 font-bold">
                    {lang === 'en'
                      ? 'This order was Cancelled.'
                      : 'यह ऑर्डर रद्द कर दिया गया है।'}
                  </div>
                ) : (
                  <ol
                    data-testid="eight-stage-live-tracker"
                    className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5"
                  >
                    {ORDER_WORKFLOW_STEPS.map((stepName, idx) => {
                      const isCurrent = activeOrder.status === stepName;
                      const isCompleted =
                        currentStepIndex > idx ||
                        activeOrder.status === 'Delivered';
                      return (
                        <li
                          key={stepName}
                          className={`relative rounded-xl p-3.5 text-xs flex flex-col justify-between gap-2.5 transition-all duration-300 ${
                            isCurrent
                              ? 'bg-[#101014] text-[#F7F3EA] font-bold border-2 border-[#FF5C35] ring-4 ring-[#FF5C35]/20 shadow-[0_10px_24px_-6px_rgba(255,92,53,0.45)] -translate-y-0.5'
                              : isCompleted
                              ? 'bg-emerald-50/90 text-emerald-950 font-semibold border border-emerald-500/50 shadow-[0_6px_16px_-6px_rgba(16,185,129,0.25)]'
                              : 'bg-[#F7F3EA]/70 text-[#8E887E] border border-[#DCD4C6]/80 opacity-75'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`font-mono-tabular text-[11px] font-bold px-1.5 py-0.5 rounded ${
                                isCurrent
                                  ? 'bg-[#FF5C35] text-white'
                                  : isCompleted
                                  ? 'bg-emerald-600/15 text-emerald-800'
                                  : 'bg-[#E5DEC9]/60 text-[#787166]'
                              }`}
                            >
                              0{idx + 1}
                            </span>
                            {isCompleted ? (
                              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </span>
                            ) : isCurrent ? (
                              <span className="relative flex h-5 w-5 items-center justify-center">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5C35] opacity-75" />
                                <Clock className="relative w-4 h-4 text-[#FFB547]" />
                              </span>
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-[#CFC8BC]" />
                            )}
                          </div>
                          <span className="leading-snug">{stepName}</span>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>

              {/* Action Alert when Status is "Needs Customer Information" */}
              {activeOrder.status === 'Needs Customer Information' && (
                <div className="bg-amber-50 border-l-4 border-amber-600 p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-amber-950">
                        {lang === 'en'
                          ? 'Action Required: Center Requested Missing Information'
                          : 'आवश्यक कार्रवाई: केंद्र ने अतिरिक्त जानकारी मांगी है'}
                      </h3>
                      <p className="text-sm text-amber-900 mt-1">
                        {activeOrder.missingInfoRequest ||
                          (lang === 'en'
                            ? 'Please provide the missing certificate or receipt details.'
                            : 'कृपया वांछित प्रमाण पत्र या रसीद संख्या प्रदान करें।')}
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleInfoReplySubmit} className="space-y-3">
                    <label
                      htmlFor="customer-missing-info-reply"
                      className="block font-mono-tabular text-xs font-bold uppercase text-amber-950"
                    >
                      {lang === 'en'
                        ? 'Your Reply / Details'
                        : 'आपका उत्तर / विवरण'}
                    </label>
                    <textarea
                      id="customer-missing-info-reply"
                      rows={2}
                      value={infoReplyInput}
                      onChange={(e) => setInfoReplyInput(e.target.value)}
                      placeholder={
                        lang === 'en'
                          ? 'Enter the requested receipt number, spelling, or details...'
                          : 'मांगी गई जानकारी यहाँ लिखें...'
                      }
                      className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-amber-400 text-sm text-[#101014]"
                    />
                    <button
                      type="submit"
                      className="min-h-[44px] px-5 py-2 bg-amber-900 hover:bg-black text-white text-xs font-mono-tabular font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'en'
                          ? 'Send Information to Admin'
                          : 'जानकारी एडमिन को भेजें'}
                      </span>
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* 02 & 03. ASYMMETRIC UPI VERIFICATION & DELIVERABLE VAULT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Left 6 Columns: Manual UPI Payment & Verification */}
              <div className="lg:col-span-6 bg-[#FFFDF9] border border-[#101014] p-6 sm:p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-2 border-b-2 border-[#101014] pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#FF5C35]" />
                      <h3 className="font-display text-lg font-extrabold text-[#101014]">
                        {lang === 'en'
                          ? '02. Manual UPI Payment & Verification'
                          : '02. मैनुअल UPI भुगतान और सत्यापन'}
                      </h3>
                    </div>
                    <span className="font-mono-tabular text-xs font-bold text-[#C83713]">
                      {activeOrder.paymentStatus}
                    </span>
                  </div>

                  {/* Dynamic UPI QR Code + WhatsApp Order & Receipt Dispatch */}
                  {(() => {
                    const trackUpiUri = buildDynamicUpiUri({
                      upiId: settings.upiId || '6206800799@ybl',
                      payeeName:
                        settings.payeeName || 'Aditya Online Center, Kateya',
                      amountInr: activeOrder.priceInr,
                      orderNumber: activeOrder.orderNumber,
                    });
                    const trackQrMatrix = generateQrMatrix(trackUpiUri, 25);
                    const trackWhatsAppUrl = buildOrderWhatsAppDispatchUrl({
                      whatsappNumber: BUSINESS_INFO.whatsappNumber,
                      orderNumber: activeOrder.orderNumber,
                      customerName: activeOrder.customerName,
                      customerPhone: activeOrder.customerPhone,
                      serviceTitle:
                        lang === 'en'
                          ? activeOrder.serviceTitleEn
                          : activeOrder.serviceTitleHi,
                      totalTariffInr: activeOrder.priceInr,
                      paymentMode:
                        activeOrder.paymentMode || 'UPI QR / Manual UTR',
                      hasVoiceNote: Boolean(activeOrder.voiceNoteDataUrl),
                    });

                    return (
                      <div className="p-4 rounded-xl bg-[#101014] text-[#F7F3EA] border border-[#272732] space-y-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                          <div className="bg-white p-2.5 rounded-lg border-2 border-[#FFB547] shrink-0">
                            <svg
                              data-testid="track-dynamic-upi-qr-svg"
                              viewBox={`0 0 ${trackQrMatrix.length} ${trackQrMatrix.length}`}
                              className="w-28 h-28"
                              shapeRendering="crispEdges"
                              role="img"
                              aria-label={`Dynamic UPI QR for Order ${activeOrder.orderNumber}`}
                            >
                              {trackQrMatrix.map((row, rIdx) =>
                                row.map((cell, cIdx) =>
                                  cell ? (
                                    <rect
                                      key={`${rIdx}-${cIdx}`}
                                      x={cIdx}
                                      y={rIdx}
                                      width={1}
                                      height={1}
                                      fill="#101014"
                                    />
                                  ) : null
                                )
                              )}
                            </svg>
                          </div>

                          <div className="space-y-2 flex-1 text-xs">
                            <div className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#FFB547]">
                              {lang === 'en'
                                ? `DYNAMIC UPI QR · ₹${activeOrder.priceInr} (${activeOrder.orderNumber})`
                                : `डायनामिक UPI QR · ₹${activeOrder.priceInr} (${activeOrder.orderNumber})`}
                            </div>
                            <div className="text-[#D8D3C8]">
                              {lang === 'en'
                                ? `Payee: ${settings.payeeName || 'Aditya Online Center, Kateya'}`
                                : `प्राप्तकर्ता: ${settings.payeeName || 'आदित्य ऑनलाइन सेंटर, कटेया'}`}
                            </div>
                            <div className="pt-1 flex flex-wrap gap-2">
                              <a
                                href={trackWhatsAppUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-testid="track-whatsapp-dispatch-btn"
                                className="min-h-[38px] px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs inline-flex items-center gap-1.5 transition-all"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>
                                  {lang === 'en'
                                    ? 'Send Order & Receipt on WhatsApp'
                                    : 'व्हाट्सएप पर ऑर्डर और रसीद भेजें'}
                                </span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <p className="text-xs text-[#4A463E] leading-relaxed">
                    {lang === 'en'
                      ? settings.paymentInstructionsEn
                      : settings.paymentInstructionsHi}
                  </p>
                </div>

                {activeOrder.paymentStatus === 'Verified' ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-600 text-sm text-emerald-950 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <div className="font-bold">
                        {lang === 'en'
                          ? 'UPI Payment Verified by Admin'
                          : 'एडमिन द्वारा UPI भुगतान सत्यापित'}
                      </div>
                      <div className="text-xs font-mono-tabular mt-0.5">
                        UTR: {activeOrder.paymentUtr} · Amount: ₹
                        {activeOrder.priceInr}
                      </div>
                    </div>
                  </div>
                ) : !canCustomerSubmitUtr(
                    activeOrder.status,
                    activeOrder.paymentStatus
                  ) ? (
                  <div className="p-4 bg-[#F7F3EA] border border-[#DCD4C6] text-xs text-[#4A463E]">
                    {lang === 'en'
                      ? `UTR submission is closed while order status is "${activeOrder.status}".`
                      : `ऑर्डर स्थिति "${activeOrder.status}" होने के कारण UTR सबमिशन बंद है।`}
                  </div>
                ) : (
                  <form onSubmit={handleUpiSubmit} className="space-y-4 pt-2">
                    <div>
                      <label
                        htmlFor="upi-utr-input"
                        className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#101014] mb-1.5"
                      >
                        {lang === 'en'
                          ? '12-Digit UPI UTR / Transaction Reference Number *'
                          : '12-अंकों का UPI UTR / ट्रांजेक्शन रेफरेंस नंबर *'}
                      </label>
                      <input
                        id="upi-utr-input"
                        type="text"
                        value={utrInput}
                        onChange={(e) => setUtrInput(e.target.value)}
                        placeholder={
                          activeOrder.paymentUtr || 'e.g., 429183746512'
                        }
                        className="w-full min-h-[44px] px-3.5 py-2 bg-[#F7F3EA] border border-[#101014] text-sm font-mono-tabular text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label className="min-h-[42px] px-3.5 py-2 bg-[#EFE9DC] hover:bg-[#DCD4C6] border border-[#101014] text-[#101014] text-xs font-semibold cursor-pointer flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-[#FF5C35]" />
                        <span>
                          {receiptUpload
                            ? receiptUpload.fileName
                            : lang === 'en'
                            ? 'Optional: Attach Receipt'
                            : 'वैकल्पिक: रसीद जोड़ें'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleReceiptFileChange}
                          className="sr-only"
                        />
                      </label>

                      <button
                        type="submit"
                        className="min-h-[42px] px-5 py-2 bg-[#FF5C35] hover:bg-[#E54922] text-white text-xs font-bold transition-colors whitespace-nowrap"
                      >
                        {lang === 'en'
                          ? 'Submit UTR for Verification'
                          : 'सत्यापन के लिए UTR जमा करें'}
                      </button>
                    </div>

                    <div className="flex items-start gap-2 text-[11px] text-[#5C5852]">
                      <ShieldAlert className="w-4 h-4 text-[#C83713] shrink-0 mt-0.5" />
                      <span>
                        {lang === 'en'
                          ? 'Note: Uploading a screenshot or UTR never marks an order as paid automatically. An authorized admin manually verifies the bank credit first.'
                          : 'नोट: स्क्रीनशॉट या UTR अपलोड करने से भुगतान स्वतः सफल नहीं माना जाता। एडमिन बैंक स्टेटमेंट से मिलान के बाद ही इसे सत्यापित करते हैं।'}
                      </span>
                    </div>
                  </form>
                )}
              </div>

              {/* Right 6 Columns: Completed Document Downloads & Audit Trail */}
              <div className="lg:col-span-6 bg-[#FFFDF9] border border-[#101014] p-6 sm:p-8 space-y-6 flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-2 border-b-2 border-[#101014] pb-3">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-[#FF5C35]" />
                      <h3 className="font-display text-lg font-extrabold text-[#101014]">
                        {lang === 'en'
                          ? '03. Completed Deliverables & Private Files'
                          : '03. तैयार दस्तावेज़ डाउनलोड और निजी फ़ाइलें'}
                      </h3>
                    </div>
                  </div>

                  {/* Final Deliverables Section */}
                  <div className="space-y-2.5">
                    <h4 className="font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#5C5852]">
                      {lang === 'en'
                        ? 'Final Completed Documents from Center'
                        : 'केंद्र द्वारा तैयार फाइनल दस्तावेज़'}
                    </h4>
                    {deliverables.length === 0 ? (
                      <div className="p-4 bg-[#F7F3EA] border border-[#DCD4C6] text-xs text-[#4A463E]">
                        {lang === 'en'
                          ? 'Your final document will appear here for secure download once the order reaches Completed or Delivered status.'
                          : 'ऑर्डर पूरा होने (Completed / Delivered) के बाद आपका तैयार दस्तावेज़ सुरक्षित डाउनलोड के लिए यहाँ उपलब्ध होगा।'}
                      </div>
                    ) : (
                      <ul className="space-y-2.5">
                        {deliverables.map((file) => {
                          const canDownload =
                            isSafeDataUrl(file.dataUrl) ||
                            /^https?:\/\//i.test(file.dataUrl) ||
                            file.dataUrl.startsWith('/');
                          return (
                            <li
                              key={file.fileId}
                              data-testid={`deliverable-item-${file.fileId}`}
                              className="p-4 bg-[#101014] text-[#F7F3EA] flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-[#FFB547] truncate">
                                  {file.fileName}
                                </div>
                                <div className="text-xs text-[#D8D3C8] font-mono-tabular mt-0.5">
                                  {Math.max(
                                    1,
                                    Math.round(file.sizeBytes / 1024)
                                  )}{' '}
                                  KB · {file.createdAt.slice(0, 10)}
                                </div>
                              </div>
                              {canDownload && (
                                <a
                                  href={file.dataUrl}
                                  download={file.fileName}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  data-testid="download-deliverable-pdf-btn"
                                  className="min-h-[42px] px-4 py-2 bg-[#FF5C35] hover:bg-[#E54922] text-white text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>
                                    {lang === 'en'
                                      ? 'Download PDF'
                                      : 'डाउनलोड करें'}
                                  </span>
                                </a>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {activeOrder.voiceNoteDataUrl && (
                    <div className="p-3.5 bg-[#F7F3EA] border border-[#DCD4C6] space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#101014]">
                        <Volume2 className="w-4 h-4 text-[#FF5C35]" />
                        <span>
                          {lang === 'en'
                            ? 'Attached Voice Instruction Note'
                            : 'ग्राहक का वॉइस निर्देश'}
                        </span>
                      </div>
                      <audio
                        controls
                        src={activeOrder.voiceNoteDataUrl}
                        className="h-9 w-full"
                      />
                    </div>
                  )}

                  {/* Customer Uploaded Supporting Documents */}
                  <div className="space-y-2.5">
                    <h4 className="font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#5C5852]">
                      {lang === 'en'
                        ? 'Your Uploaded Supporting Documents'
                        : 'आपके द्वारा अपलोड किए गए दस्तावेज़'}
                    </h4>
                    {customerUploadedDocs.length === 0 ? (
                      <p className="text-xs text-[#787166]">
                        {lang === 'en'
                          ? 'No customer files uploaded for this order.'
                          : 'कोई सहायक फ़ाइल अपलोड नहीं की गई है।'}
                      </p>
                    ) : (
                      <ul className="divide-y divide-[#DCD4C6] border border-[#DCD4C6] bg-[#F7F3EA]">
                        {customerUploadedDocs.map((docFile) => (
                          <li
                            key={docFile.fileId}
                            className="px-3.5 py-2.5 flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-[#FF5C35] shrink-0" />
                              <span className="font-semibold text-[#101014] truncate">
                                {docFile.fileName}
                              </span>
                            </div>
                            <span className="text-[#5C5852] font-mono-tabular shrink-0">
                              {Math.max(
                                1,
                                Math.round(docFile.sizeBytes / 1024)
                              )}{' '}
                              KB
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Status Audit History Log */}
                <div className="pt-4 border-t border-[#DCD4C6]">
                  <h4 className="font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#5C5852] mb-2.5">
                    {lang === 'en'
                      ? 'Order Status Audit Trail'
                      : 'ऑर्डर स्थिति इतिहास'}
                  </h4>
                  <ul className="space-y-2 text-xs text-[#4A463E] max-h-40 overflow-y-auto divide-y divide-[#EFE9DC]">
                    {historyForActiveOrder.map((ev) => (
                      <li key={ev.historyId} className="py-1.5">
                        <div className="flex items-center justify-between font-bold text-[#101014]">
                          <span>{ev.status}</span>
                          <span className="font-mono-tabular text-[11px] text-[#787166]">
                            {ev.createdAt.slice(0, 16).replace('T', ' ')}
                          </span>
                        </div>
                        <div className="text-[#4A463E] mt-0.5">
                          {ev.note} ({ev.actorName})
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
