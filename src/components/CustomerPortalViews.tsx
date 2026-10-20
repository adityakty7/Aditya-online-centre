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
  canCustomerCancelOrder,
  canCustomerSubmitUtr,
  isSafeDataUrl,
  sanitizeString,
  validateUploadedFile,
  validateUpiUtr,
} from '../utils/rules';
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
    receiptFile?: { fileName: string; mimeType: string; sizeBytes: number; dataUrl: string }
  ) => Promise<void>;
  onSubmitCustomerInfoReply: (order: ServiceOrder, reply: string) => Promise<void>;
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
  const [profName, setProfName] = React.useState(userProfile?.displayName || '');
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
    return (
      orders.find((o) => o.orderNumber.toUpperCase() === clean) ||
      orders.find((o) => o.orderNumber === selectedOrderNumber) ||
      orders[0] ||
      null
    );
  }, [orders, lookupInput, selectedOrderNumber]);

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
      await onSubmitUpiPayment(activeOrder, utrInput.trim(), receiptUpload || undefined);
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
        text: err instanceof Error ? err.message : 'Payment submission failed.',
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

  if (mode === 'dashboard') {
    return (
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#101014] font-display">
              {lang === 'en'
                ? 'Customer Portal & Order History'
                : 'ग्राहक पोर्टल और ऑर्डर इतिहास'}
            </h1>
            <p className="text-sm text-[#4A463E] mt-1">
              {lang === 'en'
                ? 'Manage your profile details, view your own submitted orders, and download completed documents.'
                : 'अपना प्रोफ़ाइल विवरण प्रबंधित करें, अपने ऑर्डर देखें और तैयार दस्तावेज़ डाउनलोड करें।'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('services')}
            className="min-h-[44px] px-5 py-2.5 bg-[#FF5C35] hover:bg-[#E04823] text-white text-sm font-bold rounded-xl transition-colors self-start"
          >
            + {lang === 'en' ? 'New Service Order' : 'नया ऑर्डर करें'}
          </button>
        </div>

        {feedbackMsg && (
          <div
            role="status"
            className={`p-4 rounded-xl border text-sm ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            {feedbackMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Customer Profile Editor */}
          <div className="lg:col-span-4">
            <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-base font-bold text-[#101014] font-display">
                <User className="w-5 h-5 text-[#FF5C35]" />
                <h2>{lang === 'en' ? 'My Customer Profile' : 'मेरा ग्राहक प्रोफ़ाइल'}</h2>
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
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="prof-name"
                    className="block text-xs font-semibold text-[#4A463E] mb-1"
                  >
                    {lang === 'en' ? 'Full Name' : 'पूरा नाम'}
                  </label>
                  <input
                    id="prof-name"
                    type="text"
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#FFFDF9] border border-[#D4CCB8] rounded-xl text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prof-phone"
                    className="block text-xs font-semibold text-[#4A463E] mb-1"
                  >
                    {lang === 'en' ? 'Mobile Number' : 'मोबाइल नंबर'}
                  </label>
                  <input
                    id="prof-phone"
                    type="tel"
                    value={profPhone}
                    onChange={(e) => setProfPhone(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#FFFDF9] border border-[#D4CCB8] rounded-xl text-sm font-mono-tabular text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="prof-location"
                    className="block text-xs font-semibold text-[#4A463E] mb-1"
                  >
                    {lang === 'en' ? 'Village / Town' : 'गाँव / शहर'}
                  </label>
                  <input
                    id="prof-location"
                    type="text"
                    value={profLocation}
                    onChange={(e) => setProfLocation(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#FFFDF9] border border-[#D4CCB8] rounded-xl text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full min-h-[44px] px-4 py-2 bg-[#101014] hover:bg-[#1E1E26] text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors"
                >
                  {lang === 'en' ? 'Save Profile Changes' : 'प्रोफ़ाइल सहेजें'}
                </button>
              </form>
            </div>
          </div>

          {/* Customer Order History List */}
          <div className="lg:col-span-8">
            <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl p-6">
              <h2 className="text-base font-bold text-[#101014] font-display mb-4">
                {lang === 'en' ? 'My Orders' : 'मेरे ऑर्डर'} ({orders.length})
              </h2>

              {orders.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-sm text-[#4A463E] mb-4">
                    {lang === 'en'
                      ? 'You have not placed any orders yet.'
                      : 'आपने अभी तक कोई ऑर्डर नहीं किया है।'}
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('services')}
                    className="min-h-[44px] px-5 py-2 bg-[#FF5C35] hover:bg-[#E04823] text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    {lang === 'en' ? 'Explore Services' : 'सेवाएं देखें'}
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-[#E6DFD3] text-xs text-[#787166]">
                        <th className="py-3 pr-4 font-semibold">
                          {lang === 'en' ? 'Order ID' : 'ऑर्डर आईडी'}
                        </th>
                        <th className="py-3 px-4 font-semibold">
                          {lang === 'en' ? 'Service' : 'सेवा'}
                        </th>
                        <th className="py-3 px-4 font-semibold text-right">
                          {lang === 'en' ? 'Fee' : 'शुल्क'}
                        </th>
                        <th className="py-3 px-4 font-semibold">
                          {lang === 'en' ? 'Status & Payment' : 'स्थिति और भुगतान'}
                        </th>
                        <th className="py-3 pl-4 font-semibold text-right">
                          {lang === 'en' ? 'Action' : 'कार्य'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E6DFD3]">
                      {orders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-[#F7F3EA]/70">
                          <td className="py-3.5 pr-4 font-mono-tabular font-semibold text-[#C83713] whitespace-nowrap">
                            {ord.orderNumber}
                          </td>
                          <td className="py-3.5 px-4 text-[#101014]">
                            <div className="font-medium">
                              {lang === 'en'
                                ? ord.serviceTitleEn
                                : ord.serviceTitleHi}
                            </div>
                            <div className="text-xs text-[#787166] font-mono-tabular">
                              {ord.createdAt.slice(0, 10)}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-[#101014] whitespace-nowrap">
                            ₹{ord.priceInr}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-[#4A463E]">
                            <span className="font-semibold text-[#101014]">
                              {ord.status}
                            </span>
                            <span aria-hidden="true"> · </span>
                            <span>{ord.paymentStatus}</span>
                          </td>
                          <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectOrderNumber(ord.orderNumber);
                                onNavigate('track-order');
                              }}
                              className="min-h-[38px] px-3 py-1.5 bg-[#FFF2ED] hover:bg-[#FFE3D8] text-[#C83713] font-semibold text-xs rounded-lg transition-colors"
                            >
                              {lang === 'en'
                                ? 'Track / Download'
                                : 'ट्रैक / डाउनलोड'}
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
        </div>
      </section>
    );
  }

  // Track Order & Payment / Deliverable View
  const currentStepIndex = activeOrder
    ? ORDER_WORKFLOW_STEPS.indexOf(
        activeOrder.status as (typeof ORDER_WORKFLOW_STEPS)[number]
      )
    : -1;

  const filesForActiveOrder = activeOrder
    ? orderFiles[activeOrder.orderNumber] || orderFiles[activeOrder.id] || []
    : [];
  const deliverables = filesForActiveOrder.filter(
    (f) => f.fileCategory === 'final_deliverable'
  );
  const customerUploadedDocs = filesForActiveOrder.filter(
    (f) => f.fileCategory !== 'final_deliverable'
  );
  const historyForActiveOrder = activeOrder
    ? orderHistory[activeOrder.orderNumber] || orderHistory[activeOrder.id] || []
    : [];

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Order Search & Quick Selector Bar */}
      <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#101014] font-display">
              {lang === 'en'
                ? 'Track Order Status, Payment & Downloads'
                : 'ऑर्डर की स्थिति, भुगतान और डाउनलोड ट्रैक करें'}
            </h1>
            <p className="text-sm text-[#4A463E] mt-1">
              {lang === 'en'
                ? 'Enter your Order ID (e.g., AOC-20261018-D101) or choose from your orders below.'
                : 'अपना ऑर्डर नंबर दर्ज करें या नीचे दिए गए अपने ऑर्डर में से चुनें।'}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full md:w-96">
            <div className="relative flex-1">
              <label htmlFor="track-order-id-input" className="sr-only">
                {lang === 'en' ? 'Order Number' : 'ऑर्डर नंबर'}
              </label>
              <Search className="w-4 h-4 text-[#787166] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="track-order-id-input"
                type="text"
                value={lookupInput}
                onChange={(e) => {
                  setLookupInput(e.target.value);
                  onSelectOrderNumber(e.target.value);
                }}
                placeholder="AOC-20261018-D101"
                className="w-full min-h-[44px] pl-10 pr-3 py-2 bg-[#FFFDF9] border border-[#D4CCB8] rounded-xl text-sm font-mono-tabular text-[#101014] focus:border-[#FF5C35] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {orders.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#E6DFD3] flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[#787166] mr-1">
              {lang === 'en' ? 'Your Orders:' : 'आपके ऑर्डर:'}
            </span>
            {orders.map((ord) => (
              <button
                key={ord.id}
                type="button"
                onClick={() => {
                  setLookupInput(ord.orderNumber);
                  onSelectOrderNumber(ord.orderNumber);
                  setFeedbackMsg(null);
                }}
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-mono-tabular font-semibold transition-colors ${
                  activeOrder?.orderNumber === ord.orderNumber
                    ? 'bg-[#101014] text-white'
                    : 'bg-[#F0EAE0] text-[#4A463E] hover:bg-[#E6DFD3]'
                }`}
              >
                {ord.orderNumber} ({ord.status})
              </button>
            ))}
          </div>
        )}
      </div>

      {feedbackMsg && (
        <div
          role="status"
          className={`p-4 rounded-xl border text-sm ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {feedbackMsg.text}
        </div>
      )}

      {!activeOrder ? (
        <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl p-10 text-center">
          <p className="text-base font-semibold text-[#101014]">
            {lang === 'en'
              ? 'No order found matching that Order ID.'
              : 'इस ऑर्डर आईडी से कोई ऑर्डर नहीं मिला।'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Order Overview & 8-Stage Status Timeline */}
          <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E6DFD3]">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#787166] mb-1">
                  <span className="font-mono-tabular font-bold text-[#C83713]">
                    {activeOrder.orderNumber}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{activeOrder.customerName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeOrder.customerLocation}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#101014] font-display">
                  {lang === 'en'
                    ? activeOrder.serviceTitleEn
                    : activeOrder.serviceTitleHi}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="text-left sm:text-right">
                  <div className="text-xs text-[#787166]">
                    {lang === 'en'
                      ? 'Confirmed Price · Payment Status'
                      : 'निर्धारित शुल्क · भुगतान स्थिति'}
                  </div>
                  <div className="text-lg font-bold text-[#101014] font-mono-tabular">
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
                    className="min-h-[40px] px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{lang === 'en' ? 'Cancel Order' : 'ऑर्डर रद्द करें'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* 8-Stage Status Workflow Stepper */}
            <div>
              <h3 className="text-xs font-semibold text-[#787166] mb-4">
                {lang === 'en'
                  ? 'Order Progress Timeline (Submitted → Delivered)'
                  : 'ऑर्डर प्रगति समयरेखा (सबमिटेड → डिलीवर्ड)'}
              </h3>

              {activeOrder.status === 'Cancelled' ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 font-semibold">
                  {lang === 'en'
                    ? 'This order was Cancelled.'
                    : 'यह ऑर्डर रद्द कर दिया गया है।'}
                </div>
              ) : (
                <ol className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                  {ORDER_WORKFLOW_STEPS.map((stepName, idx) => {
                    const isCurrent = activeOrder.status === stepName;
                    const isCompleted =
                      currentStepIndex > idx ||
                      activeOrder.status === 'Delivered';
                    return (
                      <li
                        key={stepName}
                        className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-[#101014] text-white border-[#FF5C35] font-semibold'
                            : isCompleted
                            ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                            : 'bg-[#F7F3EA] text-[#787166] border-[#E6DFD3]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-mono-tabular text-[11px]">
                            0{idx + 1}
                          </span>
                          {isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : isCurrent ? (
                            <Clock className="w-3.5 h-3.5 text-[#FFB547]" />
                          ) : null}
                        </div>
                        <span className="leading-tight">{stepName}</span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            {/* Action Alert when Status is "Needs Customer Information" */}
            {activeOrder.status === 'Needs Customer Information' && (
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 space-y-4">
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
                    className="block text-xs font-semibold text-amber-950"
                  >
                    {lang === 'en' ? 'Your Reply / Details' : 'आपका उत्तर / विवरण'}
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
                    className="w-full px-3.5 py-2 bg-[#FFFDF9] border border-amber-300 rounded-xl text-sm text-[#101014]"
                  />
                  <button
                    type="submit"
                    className="min-h-[44px] px-5 py-2 bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-2"
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Manual UPI Payment & Verification Box */}
            <div className="lg:col-span-6">
              <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl p-6 space-y-5 h-full">
                <div className="flex items-center justify-between gap-2 border-b border-[#E6DFD3] pb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#FF5C35]" />
                    <h3 className="text-base font-bold text-[#101014] font-display">
                      {lang === 'en'
                        ? 'Manual UPI Payment & Verification'
                        : 'मैनुअल UPI भुगतान और सत्यापन'}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-[#4A463E]">
                    {activeOrder.paymentStatus}
                  </span>
                </div>

                {/* Display Real Business UPI Details ONLY after owner configures them */}
                {settings.isUpiConfigured && settings.upiId ? (
                  <div className="p-4 bg-[#F7F3EA] border border-[#E6DFD3] rounded-xl space-y-3">
                    <div className="flex items-center justify-between text-xs text-[#787166]">
                      <span>
                        {lang === 'en' ? 'Official Payee Name' : 'आधिकारिक प्राप्तकर्ता'}
                      </span>
                      <span className="font-semibold text-[#101014]">
                        {settings.payeeName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#787166]">
                      <span>{lang === 'en' ? 'Business UPI ID' : 'बिजनेस UPI आईडी'}</span>
                      <span className="font-mono-tabular font-bold text-[#C83713]">
                        {settings.upiId}
                      </span>
                    </div>
                    {settings.qrCodeDataUrl && isSafeDataUrl(settings.qrCodeDataUrl) && (
                      <div className="pt-2 flex justify-center">
                        <img
                          src={settings.qrCodeDataUrl}
                          alt="Configured Business UPI QR Code"
                          referrerPolicy="no-referrer"
                          className="w-40 h-40 object-contain border border-[#E6DFD3] rounded-lg bg-white p-2"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-[#F7F3EA] border border-[#E6DFD3] rounded-xl text-xs text-[#4A463E] space-y-1.5">
                    <div className="font-semibold text-[#101014]">
                      {lang === 'en'
                        ? 'Business UPI QR / ID Awaiting Owner Configuration'
                        : 'बिजनेस UPI QR / आईडी अभी एडमिन द्वारा कॉन्फ़िगर नहीं किया गया है'}
                    </div>
                    <p>
                      {lang === 'en'
                        ? 'For security, no dummy UPI ID is shown. The center owner can configure the official UPI ID and QR code in the Admin Panel → UPI Payment Settings.'
                        : 'सुरक्षा कारणों से कोई काल्पनिक UPI आईडी नहीं दिखाई गई है। केंद्र संचालक एडमिन पैनल में अपनी वास्तविक UPI आईडी और QR सेट कर सकते हैं।'}
                    </p>
                  </div>
                )}

                <p className="text-xs text-[#4A463E] leading-relaxed">
                  {lang === 'en'
                    ? settings.paymentInstructionsEn
                    : settings.paymentInstructionsHi}
                </p>

                {activeOrder.paymentStatus === 'Verified' ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-900 flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <div className="font-bold">
                        {lang === 'en'
                          ? 'UPI Payment Verified by Admin'
                          : 'एडमिन द्वारा UPI भुगतान सत्यापित'}
                      </div>
                      <div className="text-xs font-mono-tabular mt-0.5">
                        UTR: {activeOrder.paymentUtr} · Amount: ₹{activeOrder.priceInr}
                      </div>
                    </div>
                  </div>
                ) : !canCustomerSubmitUtr(
                    activeOrder.status,
                    activeOrder.paymentStatus
                  ) ? (
                  <div className="p-4 bg-[#F7F3EA] border border-[#E6DFD3] rounded-xl text-xs text-[#4A463E]">
                    {lang === 'en'
                      ? `UTR submission is closed while order status is "${activeOrder.status}".`
                      : `ऑर्डर स्थिति "${activeOrder.status}" होने के कारण UTR सबमिशन बंद है।`}
                  </div>
                ) : (
                  <form onSubmit={handleUpiSubmit} className="space-y-4 pt-2">
                    <div>
                      <label
                        htmlFor="upi-utr-input"
                        className="block text-xs font-semibold text-[#101014] mb-1"
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
                        className="w-full min-h-[44px] px-3.5 py-2 bg-[#FFFDF9] border border-[#D4CCB8] rounded-xl text-sm font-mono-tabular text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <label className="min-h-[40px] px-3 py-2 bg-[#F0EAE0] hover:bg-[#E6DFD3] text-[#101014] text-xs font-semibold rounded-xl cursor-pointer flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-[#FF5C35]" />
                        <span>
                          {receiptUpload
                            ? receiptUpload.fileName
                            : lang === 'en'
                            ? 'Optional: Attach Receipt Screenshot'
                            : 'वैकल्पिक: भुगतान रसीद अपलोड करें'}
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
                        className="min-h-[44px] px-5 py-2 bg-[#FF5C35] hover:bg-[#E04823] text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap"
                      >
                        {lang === 'en'
                          ? 'Submit UTR for Verification'
                          : 'सत्यापन के लिए UTR जमा करें'}
                      </button>
                    </div>

                    <div className="flex items-start gap-2 text-[11px] text-[#787166]">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        {lang === 'en'
                          ? 'Note: Uploading a screenshot or UTR never marks an order as paid automatically. An authorized admin manually verifies the bank credit first.'
                          : 'नोट: स्क्रीनशॉट या UTR अपलोड करने से भुगतान स्वतः सफल नहीं माना जाता। एडमिन बैंक स्टेटमेंट से मिलान के बाद ही इसे सत्यापित करते हैं।'}
                      </span>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Completed Document Downloads & Private Files */}
            <div className="lg:col-span-6">
              <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl p-6 space-y-5 h-full flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="flex items-center justify-between gap-2 border-b border-[#E6DFD3] pb-4">
                    <div className="flex items-center gap-2">
                      <Download className="w-5 h-5 text-[#FF5C35]" />
                      <h3 className="text-base font-bold text-[#101014] font-display">
                        {lang === 'en'
                          ? 'Completed Deliverables & Private Files'
                          : 'तैयार दस्तावेज़ डाउनलोड और निजी फ़ाइलें'}
                      </h3>
                    </div>
                  </div>

                  {/* Final Deliverables Section */}
                  <div>
                    <h4 className="text-xs font-semibold text-[#787166] mb-2.5">
                      {lang === 'en'
                        ? 'Final Completed Documents from Center'
                        : 'केंद्र द्वारा तैयार फाइनल दस्तावेज़'}
                    </h4>
                    {deliverables.length === 0 ? (
                      <div className="p-4 bg-[#F7F3EA] border border-[#E6DFD3] rounded-xl text-xs text-[#4A463E]">
                        {lang === 'en'
                          ? 'Your final document will appear here for secure download once the order reaches Completed or Delivered status.'
                          : 'ऑर्डर पूरा होने (Completed / Delivered) के बाद आपका तैयार दस्तावेज़ सुरक्षित डाउनलोड के लिए यहाँ उपलब्ध होगा।'}
                      </div>
                    ) : (
                      <ul className="space-y-2.5">
                        {deliverables.map((file) => (
                          <li
                            key={file.fileId}
                            className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-[#101014] truncate">
                                {file.fileName}
                              </div>
                              <div className="text-xs text-[#4A463E] font-mono-tabular">
                                {Math.max(1, Math.round(file.sizeBytes / 1024))} KB ·{' '}
                                {file.createdAt.slice(0, 10)}
                              </div>
                            </div>
                            {isSafeDataUrl(file.dataUrl) && (
                              <a
                                href={file.dataUrl}
                                download={file.fileName}
                                className="min-h-[44px] px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                              >
                                <Download className="w-4 h-4" />
                                <span>
                                  {lang === 'en' ? 'Download PDF' : 'डाउनलोड करें'}
                                </span>
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Customer Uploaded Supporting Documents */}
                  <div>
                    <h4 className="text-xs font-semibold text-[#787166] mb-2.5">
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
                      <ul className="space-y-2">
                        {customerUploadedDocs.map((docFile) => (
                          <li
                            key={docFile.fileId}
                            className="p-3 bg-[#F7F3EA] border border-[#E6DFD3] rounded-xl flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-[#787166] shrink-0" />
                              <span className="font-medium text-[#101014] truncate">
                                {docFile.fileName}
                              </span>
                            </div>
                            <span className="text-[#787166] font-mono-tabular shrink-0">
                              {Math.max(1, Math.round(docFile.sizeBytes / 1024))} KB
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Status Audit History Log */}
                <div className="pt-4 border-t border-[#E6DFD3]">
                  <h4 className="text-xs font-semibold text-[#787166] mb-2.5">
                    {lang === 'en'
                      ? 'Order Status Audit Trail'
                      : 'ऑर्डर स्थिति इतिहास'}
                  </h4>
                  <ul className="space-y-2 text-xs text-[#4A463E] max-h-40 overflow-y-auto">
                    {historyForActiveOrder.map((ev) => (
                      <li
                        key={ev.historyId}
                        className="pb-2 border-b border-[#E6DFD3] last:border-none"
                      >
                        <div className="flex items-center justify-between font-medium text-[#101014]">
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
        </div>
      )}
    </section>
  );
};
