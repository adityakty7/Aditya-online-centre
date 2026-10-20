import React from 'react';
import {
  AppView,
  DigitalService,
  Language,
  ServiceCustomField,
  ServiceOrder,
  UserProfile,
} from '../types';
import {
  MAX_FILE_SIZE_BYTES,
  getAcceptAttributeForFormats,
  parseServiceDocumentRequirements,
  sanitizeString,
  StructuredDocRequirement,
  validateCustomerOrderInput,
  validateFileForDocumentRequirement,
  validateServiceDocumentChecklistUploads,
  validateUploadedFile,
} from '../utils/rules';
import { SAMPLE_DELIVERABLE_DATA_URL } from '../data/initialCatalog';
import {
  CheckCircle2,
  Upload,
  Trash2,
  AlertCircle,
  FileText,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  Plus,
  Paperclip,
  Image as ImageIcon,
  Check,
  Info,
} from 'lucide-react';

export interface PendingUploadItem {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
  documentTypeId?: string;
  documentLabelEn?: string;
  documentLabelHi?: string;
}

interface OrderFlowViewsProps {
  mode: 'order-form' | 'order-confirmation';
  lang: Language;
  service: DigitalService | null;
  userProfile: UserProfile | null;
  confirmedOrder: ServiceOrder | null;
  isSubmitting: boolean;
  onCreateOrder: (payload: {
    service: DigitalService;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerLocation: string;
    formResponsesSummary: string;
    customerNotes: string;
    uploads: PendingUploadItem[];
  }) => Promise<void>;
  onNavigate: (view: AppView) => void;
  onTrackSpecificOrder: (orderNumber: string) => void;
}

export const OrderFlowViews: React.FC<OrderFlowViewsProps> = ({
  mode,
  lang,
  service,
  userProfile,
  confirmedOrder,
  isSubmitting,
  onCreateOrder,
  onNavigate,
  onTrackSpecificOrder,
}) => {
  const [step, setStep] = React.useState<'details' | 'review'>('details');
  const [customerName, setCustomerName] = React.useState(
    userProfile?.displayName || ''
  );
  const [customerPhone, setCustomerPhone] = React.useState(
    userProfile?.phone || ''
  );
  const [customerEmail, setCustomerEmail] = React.useState(
    userProfile?.email || ''
  );
  const [customerLocation, setCustomerLocation] = React.useState(
    userProfile?.villageOrTown || 'Kateya, Gopalganj'
  );
  const [customValues, setCustomValues] = React.useState<Record<string, string>>(
    {}
  );
  const [customerNotes, setCustomerNotes] = React.useState('');

  // Per-Document Upload State: docId -> array of files
  const [uploadsByDocId, setUploadsByDocId] = React.useState<
    Record<string, PendingUploadItem[]>
  >({});

  // Additional optional files uploaded by customer
  const [additionalUploads, setAdditionalUploads] = React.useState<
    PendingUploadItem[]
  >([]);

  // Per-slot upload error messages
  const [slotErrors, setSlotErrors] = React.useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // Hidden file inputs refs map
  const fileInputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  React.useEffect(() => {
    if (userProfile) {
      if (!customerName && userProfile.displayName)
        setCustomerName(userProfile.displayName);
      if (!customerPhone && userProfile.phone)
        setCustomerPhone(userProfile.phone);
      if (!customerEmail && userProfile.email)
        setCustomerEmail(userProfile.email);
      if (userProfile.villageOrTown)
        setCustomerLocation(userProfile.villageOrTown);
    }
  }, [userProfile]);

  const customFields: ServiceCustomField[] = React.useMemo(() => {
    if (!service) return [];
    try {
      return JSON.parse(service.customFieldsJson || '[]');
    } catch {
      return [];
    }
  }, [service]);

  // Parse structured document requirements for the selected service
  const docRequirements: StructuredDocRequirement[] = React.useMemo(() => {
    if (!service) return [];
    return parseServiceDocumentRequirements(
      service.documentRequirementsJson,
      service.requiredDocsEn || (service.requiredDocs ? service.requiredDocs.split(',') : []),
      service.requiredDocsHi || []
    );
  }, [service]);

  React.useEffect(() => {
    // Initialize default select options
    const initial: Record<string, string> = {};
    for (const f of customFields) {
      if (f.type === 'select' && f.options && f.options.length > 0) {
        initial[f.id] = f.options[0];
      }
    }
    setCustomValues(initial);
    setUploadsByDocId({});
    setAdditionalUploads([]);
    setSlotErrors({});
    setStep('details');
    setErrorMsg(null);
  }, [service?.id, customFields]);

  // Derived upload stats
  const completeness = React.useMemo(() => {
    return validateServiceDocumentChecklistUploads(docRequirements, uploadsByDocId);
  }, [docRequirements, uploadsByDocId]);

  const totalAttachedFilesCount = React.useMemo(() => {
    let count = additionalUploads.length;
    for (const files of Object.values(uploadsByDocId)) {
      count += files.length;
    }
    return count;
  }, [uploadsByDocId, additionalUploads]);

  // Flattened uploads list
  const allFlattenedUploads = React.useMemo(() => {
    const list: PendingUploadItem[] = [];
    for (const [docId, files] of Object.entries(uploadsByDocId)) {
      const req = docRequirements.find((r) => r.docId === docId);
      for (const f of files) {
        list.push({
          ...f,
          documentTypeId: docId,
          documentLabelEn: req?.labelEn || f.fileName,
          documentLabelHi: req?.labelHi || f.fileName,
        });
      }
    }
    for (const addFile of additionalUploads) {
      list.push({
        ...addFile,
        documentTypeId: 'doc-additional-supporting',
        documentLabelEn: 'Additional Supporting Document',
        documentLabelHi: 'अतिरिक्त सहायक दस्तावेज़',
      });
    }
    return list;
  }, [uploadsByDocId, additionalUploads, docRequirements]);

  if (mode === 'order-confirmation' && confirmedOrder) {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl p-6 sm:p-10 shadow-xs">
          <div className="flex items-center gap-3 text-emerald-700 font-semibold text-sm mb-3">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <span>
              {lang === 'en'
                ? 'Order Submitted Successfully'
                : 'आपका ऑर्डर सफलतापूर्वक दर्ज हो गया है'}
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#101014] mb-2">
            {lang === 'en'
              ? 'Save Your Unique Order Number'
              : 'अपना यूनिक ऑर्डर नंबर सुरक्षित रखें'}
          </h1>
          <p className="text-sm sm:text-base text-[#52504C] mb-6 leading-relaxed">
            {lang === 'en'
              ? 'Your order and supporting documents have been securely queued for review at Aditya Online Center, Kateya. Use the Order ID below to track progress, verify your UPI payment, and download your finished document.'
              : 'आपका ऑर्डर और दस्तावेज़ आदित्य ऑनलाइन सेंटर में समीक्षा के लिए प्राप्त हो गए हैं। स्थिति ट्रैक करने, UPI भुगतान सत्यापित करने और तैयार दस्तावेज़ डाउनलोड करने के लिए नीचे दिए गए ऑर्डर नंबर का उपयोग करें।'}
          </p>

          <div className="bg-[#101014] text-[#F7F3EA] border border-[#272732] rounded-xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-[#A09D96]">
                {lang === 'en' ? 'Unique Order ID' : 'यूनिक ऑर्डर आईडी'}
              </div>
              <div
                data-testid="confirmed-order-number"
                className="text-2xl font-bold text-[#FFB547] font-mono-tabular mt-0.5 tracking-wider"
              >
                {confirmedOrder.orderNumber}
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs font-medium text-[#A09D96]">
                {lang === 'en' ? 'Service Fee & Status' : 'सेवा शुल्क और स्थिति'}
              </div>
              <div className="text-base font-bold text-[#F7F3EA] font-mono-tabular mt-0.5">
                ₹{confirmedOrder.priceInr} · {confirmedOrder.status}
              </div>
            </div>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm border-t border-b border-[#E6DFD3] py-5 mb-6">
            <div>
              <dt className="text-xs text-[#5C5852]">
                {lang === 'en' ? 'Selected Service' : 'चयनित सेवा'}
              </dt>
              <dd className="font-semibold text-[#101014] mt-0.5">
                {lang === 'en'
                  ? confirmedOrder.serviceTitleEn
                  : confirmedOrder.serviceTitleHi}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#5C5852]">
                {lang === 'en' ? 'Customer Details' : 'ग्राहक का नाम और मोबाइल'}
              </dt>
              <dd className="font-semibold text-[#101014] font-mono-tabular mt-0.5">
                {confirmedOrder.customerName} ({confirmedOrder.customerPhone})
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#5C5852]">
                {lang === 'en' ? 'Village / Town' : 'गाँव / शहर'}
              </dt>
              <dd className="font-semibold text-[#101014] mt-0.5">
                {confirmedOrder.customerLocation}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[#5C5852]">
                {lang === 'en' ? 'Attached Documents' : 'संलग्न दस्तावेज़'}
              </dt>
              <dd className="font-semibold text-[#101014] font-mono-tabular mt-0.5">
                {confirmedOrder.uploadedFileCount}{' '}
                {lang === 'en' ? 'file(s) attached' : 'फ़ाइलें जुड़ी हैं'}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-[#5C5852]">
                {lang === 'en' ? 'Submitted Details' : 'दर्ज किया गया विवरण'}
              </dt>
              <dd className="text-[#52504C] mt-0.5">
                {confirmedOrder.formResponsesSummary}
              </dd>
            </div>
          </dl>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={() => onTrackSpecificOrder(confirmedOrder.orderNumber)}
              className="min-h-[48px] px-6 py-3 bg-[#FF5C35] hover:bg-[#E84B25] text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <span>
                {lang === 'en'
                  ? 'Track Order & UPI Payment'
                  : 'ऑर्डर ट्रैक करें और UPI भुगतान देखें'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="min-h-[48px] px-5 py-3 bg-[#F7F3EA] hover:bg-[#ECE5D8] border border-[#E6DFD3] text-[#101014] font-semibold text-sm rounded-xl transition-colors"
            >
              {lang === 'en' ? 'Go to Customer Portal' : 'ग्राहक पोर्टल पर जाएं'}
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!service) {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl p-8">
          <h2 className="text-xl font-bold text-[#101014] mb-2 font-display">
            {lang === 'en'
              ? 'Please select a digital service first'
              : 'कृपया पहले एक सेवा चुनें'}
          </h2>
          <p className="text-sm text-[#5C5852] mb-4">
            {lang === 'en'
              ? 'Browse our catalog of resumes, government form-filling, scholarships, and PDF services.'
              : 'हमारे कैटलॉग से रिज्यूमे, सरकारी फॉर्म, छात्रवृत्ति और पीडीएफ सेवाओं में से चुनें।'}
          </p>
          <button
            type="button"
            onClick={() => onNavigate('services')}
            className="min-h-[44px] px-5 py-2.5 bg-[#FF5C35] hover:bg-[#E84B25] text-white text-sm font-semibold rounded-xl"
          >
            {lang === 'en' ? 'Browse All Services' : 'सभी सेवाएं देखें'}
          </button>
        </div>
      </section>
    );
  }

  // Handle file selection for a specific document requirement
  const handleSlotFileChange = (
    req: StructuredDocRequirement,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setSlotErrors((prev) => {
      const next = { ...prev };
      delete next[req.docId];
      return next;
    });
    setErrorMsg(null);

    const file = files[0];
    const validation = validateFileForDocumentRequirement(
      { name: file.name, type: file.type, size: file.size },
      req
    );

    if (!validation.valid) {
      setSlotErrors((prev) => ({
        ...prev,
        [req.docId]: lang === 'en' ? validation.errorEn! : validation.errorHi!,
      }));
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const newItem: PendingUploadItem = {
        id: `up-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fileName: sanitizeString(file.name, 140),
        mimeType: file.type,
        sizeBytes: file.size,
        dataUrl,
        documentTypeId: req.docId,
        documentLabelEn: req.labelEn,
        documentLabelHi: req.labelHi,
      };

      setUploadsByDocId((prev) => {
        const existing = prev[req.docId] || [];
        // If single file allowed, replace it; if allowMultiple is true, append up to 3 files
        if (req.allowMultiple) {
          return {
            ...prev,
            [req.docId]: [...existing.slice(0, 2), newItem],
          };
        }
        return {
          ...prev,
          [req.docId]: [newItem],
        };
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveSlotFile = (docId: string, fileId: string) => {
    setUploadsByDocId((prev) => {
      const current = prev[docId] || [];
      const updated = current.filter((f) => f.id !== fileId);
      if (updated.length === 0) {
        const next = { ...prev };
        delete next[docId];
        return next;
      }
      return { ...prev, [docId]: updated };
    });
  };

  const handleTriggerFileInput = (docId: string) => {
    const input = fileInputRefs.current[docId];
    if (input) {
      input.click();
    }
  };

  // Handle additional optional file upload
  const handleAdditionalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (totalAttachedFilesCount >= 10) {
      setErrorMsg(
        lang === 'en'
          ? 'Maximum 10 total files allowed per order.'
          : 'प्रति ऑर्डर अधिकतम 10 फ़ाइलों की अनुमति है।'
      );
      return;
    }

    const file = files[0];
    const check = validateUploadedFile({
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (!check.valid) {
      setErrorMsg(lang === 'en' ? check.errorEn! : check.errorHi!);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setAdditionalUploads((prev) => [
        ...prev,
        {
          id: `add-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          fileName: sanitizeString(file.name, 140),
          mimeType: file.type,
          sizeBytes: file.size,
          dataUrl,
          documentTypeId: 'doc-additional-supporting',
          documentLabelEn: 'Additional Supporting Document',
          documentLabelHi: 'अतिरिक्त सहायक दस्तावेज़',
        },
      ]);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAttachSampleDocument = (req?: StructuredDocRequirement) => {
    setErrorMsg(null);
    const targetDocId = req ? req.docId : 'doc-additional-supporting';
    const sampleItem: PendingUploadItem = {
      id: `sample-${Date.now()}`,
      fileName: req ? `${req.labelEn.replace(/[^a-zA-Z0-9]/g, '_')}_Sample.pdf` : 'Sample_Supporting_Document.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 42180,
      dataUrl: SAMPLE_DELIVERABLE_DATA_URL,
      documentTypeId: targetDocId,
      documentLabelEn: req?.labelEn || 'Sample Supporting Document',
      documentLabelHi: req?.labelHi || 'सैंपल सहायक दस्तावेज़',
    };

    if (req) {
      setUploadsByDocId((prev) => ({
        ...prev,
        [req.docId]: [sampleItem],
      }));
    } else {
      setAdditionalUploads((prev) => [...prev, sampleItem]);
    }
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // 1. Validate Customer Contact and Custom Fields
    const contactValidation = validateCustomerOrderInput({
      customerName,
      customerPhone,
      customerLocation,
      requiredCustomFields: customFields.map((f) => ({
        id: f.id,
        label: lang === 'en' ? f.labelEn : f.labelHi,
        required: f.required,
      })),
      customFieldValues: customValues,
    });

    if (!contactValidation.valid) {
      setErrorMsg(lang === 'en' ? contactValidation.errorEn! : contactValidation.errorHi!);
      return;
    }

    // 2. Validate Document Checklist Completeness
    const checklistCheck = validateServiceDocumentChecklistUploads(
      docRequirements,
      uploadsByDocId
    );

    if (!checklistCheck.valid) {
      setErrorMsg(
        lang === 'en'
          ? `Missing required documents: Please upload ${checklistCheck.missingDocsEn.join(', ')} before continuing.`
          : `कृपया आगे बढ़ने से पहले आवश्यक दस्तावेज़ अपलोड करें: ${checklistCheck.missingDocsHi.join(', ')}`
      );
      return;
    }

    setStep('review');
  };

  const formattedResponsesSummary = customFields
    .map((f) => {
      const val = sanitizeString(customValues[f.id] || 'N/A', 400);
      return `${f.labelEn}: ${val}`;
    })
    .join(' | ');

  const handleConfirmSubmit = async () => {
    setErrorMsg(null);
    try {
      await onCreateOrder({
        service,
        customerName: sanitizeString(customerName, 100),
        customerPhone: sanitizeString(customerPhone, 20),
        customerEmail: sanitizeString(customerEmail || 'customer@example.com', 150),
        customerLocation: sanitizeString(customerLocation, 120),
        formResponsesSummary: sanitizeString(
          formattedResponsesSummary || 'Standard Service Order',
          2400
        ),
        customerNotes: sanitizeString(customerNotes, 950),
        uploads: allFlattenedUploads,
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : lang === 'en'
          ? 'Could not submit order. Please check your inputs.'
          : 'ऑर्डर जमा करने में समस्या हुई। कृपया पुनः प्रयास करें।'
      );
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigate('services')}
          className="min-h-[44px] px-3 py-2 text-sm font-semibold text-[#101014] hover:text-[#FF5C35] hover:bg-[#ECE5D8] rounded-lg transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'en' ? 'Back to Services' : 'सेवा सूची पर वापस जाएं'}</span>
        </button>

        <div className="text-xs font-semibold text-[#5C5852]">
          {step === 'details'
            ? lang === 'en'
              ? 'Step 1 of 2 · Fill Details & Attach Documents'
              : 'चरण 1 / 2 · विवरण भरें और दस्तावेज़ जोड़ें'
            : lang === 'en'
            ? 'Step 2 of 2 · Review & Confirm Order'
            : 'चरण 2 / 2 · जांचें और पुष्टि करें'}
        </div>
      </div>

      <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl p-6 sm:p-10 shadow-xs">
        {/* Selected Service Summary Header */}
        <div className="pb-6 mb-6 border-b border-[#E6DFD3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-[#FF5C35] mb-1 uppercase tracking-wider">
              {lang === 'en' ? 'Digital Service Order Form' : 'डिजिटल सेवा ऑर्डर फॉर्म'}
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-[#101014]">
              {lang === 'en' ? service.titleEn : service.titleHi}
            </h1>
            <p className="text-xs text-[#5C5852] mt-1 max-w-xl">
              {lang === 'en' ? service.descEn : service.descHi}
            </p>
          </div>
          <div className="sm:text-right shrink-0 bg-[#F7F3EA] border border-[#E6DFD3] p-3.5 rounded-xl">
            <div className="text-xs text-[#5C5852]">
              {lang === 'en' ? 'Service Fee' : 'सेवा शुल्क'}
            </div>
            <div className="text-2xl font-bold text-[#101014] font-mono-tabular">
              ₹{service.priceInr}
            </div>
            <div className="text-[11px] text-[#787166]">
              {lang === 'en' ? service.estimatedTimeEn : service.estimatedTimeHi}
            </div>
          </div>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 flex items-start gap-2.5"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold">{errorMsg}</div>
            </div>
          </div>
        )}

        {step === 'details' ? (
          <form onSubmit={handleProceedToReview} className="space-y-8" noValidate>
            {/* Section 1: Customer Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-[#101014] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#101014] text-[#F7F3EA] text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <span>
                    {lang === 'en' ? 'Customer Contact Details' : 'ग्राहक संपर्क विवरण'}
                  </span>
                </h2>
                <span className="text-xs text-[#787166]">
                  {lang === 'en' ? '* Required fields' : '* अनिवार्य फ़ील्ड'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="order-customer-name"
                    className="block text-xs font-semibold text-[#101014] mb-1.5"
                  >
                    {lang === 'en' ? 'Full Name *' : 'पूरा नाम *'}
                  </label>
                  <input
                    id="order-customer-name"
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={
                      lang === 'en' ? 'Enter your full name' : 'अपना पूरा नाम लिखें'
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-[#DCD4C6] rounded-xl text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="order-customer-phone"
                    className="block text-xs font-semibold text-[#101014] mb-1.5"
                  >
                    {lang === 'en'
                      ? '10-Digit Mobile / WhatsApp Number *'
                      : '10-अंकीय मोबाइल / व्हाट्सएप नंबर *'}
                  </label>
                  <input
                    id="order-customer-phone"
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-[#DCD4C6] rounded-xl text-sm text-[#101014] font-mono-tabular focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="order-customer-location"
                    className="block text-xs font-semibold text-[#101014] mb-1.5"
                  >
                    {lang === 'en'
                      ? 'Village / Ward / Town (Kateya & Nearby) *'
                      : 'गाँव / वार्ड / शहर (कटेया या आस-पास) *'}
                  </label>
                  <input
                    id="order-customer-location"
                    type="text"
                    required
                    value={customerLocation}
                    onChange={(e) => setCustomerLocation(e.target.value)}
                    placeholder={
                      lang === 'en'
                        ? 'e.g., Kateya Ward 04, Gopalganj'
                        : 'जैसे: कटेया वार्ड 04, गोपालगंज'
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-[#DCD4C6] rounded-xl text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="order-customer-email"
                    className="block text-xs font-semibold text-[#101014] mb-1.5"
                  >
                    {lang === 'en' ? 'Email Address (Optional)' : 'ईमेल पता (वैकल्पिक)'}
                  </label>
                  <input
                    id="order-customer-email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-[#DCD4C6] rounded-xl text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Service-Specific Dynamic Fields */}
            {customFields.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-[#E6DFD3]">
                <h2 className="font-display text-base font-bold text-[#101014] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#101014] text-[#F7F3EA] text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <span>
                    {lang === 'en'
                      ? 'Service-Specific Details'
                      : 'सेवा से संबंधित आवश्यक जानकारी'}
                  </span>
                </h2>
                <div className="space-y-4">
                  {customFields.map((field) => {
                    const inputId = `custom-field-${field.id}`;
                    return (
                      <div key={field.id}>
                        <label
                          htmlFor={inputId}
                          className="block text-xs font-semibold text-[#101014] mb-1.5"
                        >
                          {lang === 'en' ? field.labelEn : field.labelHi}{' '}
                          {field.required ? '*' : ''}
                        </label>
                        {field.type === 'select' ? (
                          <select
                            id={inputId}
                            value={customValues[field.id] || ''}
                            onChange={(e) =>
                              setCustomValues((prev) => ({
                                ...prev,
                                [field.id]: e.target.value,
                              }))
                            }
                            className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-[#DCD4C6] rounded-xl text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                          >
                            {(field.options || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : field.type === 'textarea' ? (
                          <textarea
                            id={inputId}
                            rows={3}
                            value={customValues[field.id] || ''}
                            onChange={(e) =>
                              setCustomValues((prev) => ({
                                ...prev,
                                [field.id]: e.target.value,
                              }))
                            }
                            placeholder={
                              lang === 'en'
                                ? field.placeholderEn
                                : field.placeholderHi
                            }
                            className="w-full px-3.5 py-2.5 bg-white border border-[#DCD4C6] rounded-xl text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                          />
                        ) : (
                          <input
                            id={inputId}
                            type="text"
                            value={customValues[field.id] || ''}
                            onChange={(e) =>
                              setCustomValues((prev) => ({
                                ...prev,
                                [field.id]: e.target.value,
                              }))
                            }
                            placeholder={
                              lang === 'en'
                                ? field.placeholderEn
                                : field.placeholderHi
                            }
                            className="w-full min-h-[44px] px-3.5 py-2 bg-white border border-[#DCD4C6] rounded-xl text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 3: Dynamic Document Checklist Uploads (Per-Document Slots) */}
            <div className="space-y-6 pt-6 border-t border-[#E6DFD3]">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="font-display text-base font-bold text-[#101014] flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#101014] text-[#F7F3EA] text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <span>
                      {lang === 'en'
                        ? 'Document Upload Checklist'
                        : 'दस्तावेज़ अपलोड चेकलिस्ट'}
                    </span>
                  </h2>

                  <button
                    type="button"
                    onClick={() => handleAttachSampleDocument(docRequirements[0])}
                    className="min-h-[36px] px-3 py-1.5 text-xs font-semibold text-[#101014] bg-[#F7F3EA] hover:bg-[#ECE5D8] border border-[#DCD4C6] rounded-lg transition-colors whitespace-nowrap self-start"
                  >
                    {lang === 'en'
                      ? '+ Attach Sample Test Document'
                      : '+ टेस्ट दस्तावेज़ जोड़ें'}
                  </button>
                </div>

                {/* Checklist Progress Bar & Completion Counter */}
                <div className="mt-4 p-4 bg-[#F7F3EA] border border-[#E6DFD3] rounded-xl">
                  <div className="flex items-center justify-between text-xs font-bold text-[#101014] mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[#FF5C35]">
                        {lang === 'en'
                          ? `${completeness.uploadedRequiredCount} of ${completeness.totalRequiredCount} Required Documents Attached`
                          : `${completeness.totalRequiredCount} में से ${completeness.uploadedRequiredCount} आवश्यक दस्तावेज़ संलग्न`}
                      </span>
                      {completeness.valid && completeness.totalRequiredCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full text-[11px]">
                          <Check className="w-3 h-3" />
                          {lang === 'en' ? 'Checklist Ready' : 'चेकलिस्ट तैयार'}
                        </span>
                      )}
                    </div>
                    <span className="font-mono-tabular text-[#5C5852]">
                      {totalAttachedFilesCount} {lang === 'en' ? 'total file(s)' : 'कुल फ़ाइलें'}
                    </span>
                  </div>

                  <div className="w-full bg-[#E6DFD3] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#FF5C35] h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${
                          completeness.totalRequiredCount > 0
                            ? (completeness.uploadedRequiredCount /
                                completeness.totalRequiredCount) *
                              100
                            : 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Dynamically Rendered Dedicated Upload Cards for Each Requirement */}
              <div className="space-y-4">
                {docRequirements.map((req, idx) => {
                  const uploadedFiles = uploadsByDocId[req.docId] || [];
                  const isUploaded = uploadedFiles.length > 0;
                  const slotError = slotErrors[req.docId];
                  const acceptAttr = getAcceptAttributeForFormats(req.allowedFormats);

                  return (
                    <div
                      key={req.docId}
                      className={`rounded-2xl border transition-all p-5 ${
                        isUploaded
                          ? 'bg-[#FFFDF9] border-emerald-300 ring-1 ring-emerald-200'
                          : req.required && !completeness.valid
                          ? 'bg-[#FFFDF9] border-[#FF5C35]/40 shadow-xs'
                          : 'bg-[#FFFDF9] border-[#E6DFD3]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono-tabular text-xs font-bold text-[#A09D96] bg-[#101014] text-[#F7F3EA] px-2 py-0.5 rounded-md">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <h3 className="font-bold text-base text-[#101014]">
                              {lang === 'en' ? req.labelEn : req.labelHi}
                            </h3>
                            {req.required ? (
                              <span className="text-[11px] font-bold text-[#C83713] bg-[#FFECE8] border border-[#FF5C35]/30 px-2.5 py-0.5 rounded-full">
                                {lang === 'en' ? 'Required' : 'अनिवार्य'}
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-[#5C5852] bg-[#F7F3EA] border border-[#E6DFD3] px-2.5 py-0.5 rounded-full">
                                {lang === 'en' ? 'Optional' : 'वैकल्पिक'}
                              </span>
                            )}
                            {isUploaded && (
                              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                {lang === 'en' ? 'Attached' : 'संलग्न ✓'}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#5C5852]">
                            <span className="bg-[#F7F3EA] px-2 py-0.5 rounded-md font-mono-tabular">
                              {lang === 'en' ? 'Formats' : 'प्रारूप'}:{' '}
                              {req.allowedFormats.map((f) => f.toUpperCase()).join(', ')}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="bg-[#F7F3EA] px-2 py-0.5 rounded-md font-mono-tabular">
                              {lang === 'en' ? 'Max Size' : 'अधिकतम साइज'}: {req.maxSizeKb} KB
                            </span>
                          </div>

                          {(req.instructionsEn || req.instructionsHi) && (
                            <p className="text-xs text-[#52504C] leading-relaxed pt-1">
                              {lang === 'en' ? req.instructionsEn : req.instructionsHi}
                            </p>
                          )}
                        </div>

                        {/* Upload Trigger Button */}
                        <div className="shrink-0">
                          <input
                            type="file"
                            id={`file-input-${req.docId}`}
                            ref={(el) => {
                              fileInputRefs.current[req.docId] = el;
                            }}
                            accept={acceptAttr}
                            multiple={req.allowMultiple}
                            onChange={(e) => handleSlotFileChange(req, e)}
                            className="sr-only"
                          />
                          <button
                            type="button"
                            onClick={() => handleTriggerFileInput(req.docId)}
                            className={`min-h-[44px] px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${
                              isUploaded
                                ? 'bg-[#F7F3EA] hover:bg-[#ECE5D8] border border-[#DCD4C6] text-[#101014]'
                                : req.required
                                ? 'bg-[#FF5C35] hover:bg-[#E84B25] text-white'
                                : 'bg-[#101014] hover:bg-[#272732] text-white'
                            }`}
                          >
                            {isUploaded ? (
                              <>
                                <RefreshCw className="w-4 h-4" />
                                <span>{lang === 'en' ? 'Replace File' : 'फ़ाइल बदलें'}</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-4 h-4" />
                                <span>
                                  {lang === 'en'
                                    ? `Upload ${req.labelEn}`
                                    : `${req.labelHi} अपलोड करें`}
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Slot Error Message */}
                      {slotError && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>{slotError}</span>
                        </div>
                      )}

                      {/* Uploaded File Previews Inside This Document Slot */}
                      {isUploaded && (
                        <div className="mt-4 pt-4 border-t border-[#E6DFD3] space-y-2">
                          {uploadedFiles.map((up) => {
                            const isImage = up.mimeType.startsWith('image/');
                            return (
                              <div
                                key={up.id}
                                className="flex items-center justify-between gap-3 p-3 bg-[#F7F3EA] border border-[#E6DFD3] rounded-xl text-xs"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {isImage ? (
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-[#DCD4C6] shrink-0">
                                      <img
                                        src={up.dataUrl}
                                        alt={up.fileName}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 rounded-lg bg-white border border-[#DCD4C6] flex items-center justify-center text-[#FF5C35] shrink-0">
                                      <FileText className="w-5 h-5" />
                                    </div>
                                  )}

                                  <div className="min-w-0">
                                    <div className="font-semibold text-[#101014] truncate">
                                      {up.fileName}
                                    </div>
                                    <div className="text-[11px] text-[#5C5852] font-mono-tabular">
                                      {Math.max(1, Math.round(up.sizeBytes / 1024))} KB ·{' '}
                                      {up.mimeType.split('/')[1]?.toUpperCase()}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleTriggerFileInput(req.docId)}
                                    className="min-h-[36px] px-2.5 py-1 text-xs font-semibold text-[#5C5852] hover:text-[#101014] hover:bg-white rounded-lg transition-colors"
                                  >
                                    {lang === 'en' ? 'Replace' : 'बदलें'}
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`Remove ${up.fileName}`}
                                    onClick={() => handleRemoveSlotFile(req.docId, up.id)}
                                    className="min-h-[36px] min-w-[36px] flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {req.allowMultiple && uploadedFiles.length < 3 && (
                            <button
                              type="button"
                              onClick={() => handleTriggerFileInput(req.docId)}
                              className="text-xs font-semibold text-[#FF5C35] hover:underline flex items-center gap-1 pt-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>
                                {lang === 'en'
                                  ? '+ Add another page / file'
                                  : '+ दूसरा पृष्ठ या फ़ाइल जोड़ें'}
                              </span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Optional Additional Supporting Documents Upload Section */}
              <div className="p-5 bg-[#F7F3EA] border border-[#E6DFD3] rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-sm font-bold text-[#101014] flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-[#FF5C35]" />
                      <span>
                        {lang === 'en'
                          ? 'Additional Supporting Document (Optional)'
                          : 'अतिरिक्त सहायक दस्तावेज़ (वैकल्पिक)'}
                      </span>
                    </h3>
                    <p className="text-xs text-[#5C5852] mt-0.5">
                      {lang === 'en'
                        ? 'Have an extra marksheet, bank statement, or caste certificate not listed above? Attach it here.'
                        : 'कोई अन्य मार्कशीट, बैंक पासबुक या अतिरिक्त दस्तावेज़ यहाँ जोड़ सकते हैं।'}
                    </p>
                  </div>

                  <label className="min-h-[40px] px-4 py-2 bg-white border border-[#DCD4C6] hover:bg-[#ECE5D8] text-[#101014] text-xs font-semibold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap self-start sm:self-auto">
                    <Upload className="w-4 h-4 text-[#FF5C35]" />
                    <span>{lang === 'en' ? 'Attach Extra File' : 'फ़ाइल जोड़ें'}</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.docx"
                      onChange={handleAdditionalFileChange}
                      className="sr-only"
                    />
                  </label>
                </div>

                {additionalUploads.length > 0 && (
                  <ul className="space-y-2 pt-2 border-t border-[#DCD4C6]">
                    {additionalUploads.map((up) => (
                      <li
                        key={up.id}
                        className="flex items-center justify-between gap-3 p-3 bg-white border border-[#E6DFD3] rounded-xl text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-[#FF5C35] shrink-0" />
                          <span className="font-semibold text-[#101014] truncate">
                            {up.fileName}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#5C5852] font-mono-tabular shrink-0">
                            {Math.max(1, Math.round(up.sizeBytes / 1024))} KB
                          </span>
                        </div>
                        <button
                          type="button"
                          aria-label={`Remove ${up.fileName}`}
                          onClick={() =>
                            setAdditionalUploads((prev) =>
                              prev.filter((item) => item.id !== up.id)
                            )
                          }
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Section 4: Special Instructions */}
            <div className="space-y-2 pt-6 border-t border-[#E6DFD3]">
              <label
                htmlFor="order-special-notes"
                className="block text-xs font-semibold text-[#101014]"
              >
                {lang === 'en'
                  ? '4. Additional Instructions or Formatting Notes (Optional)'
                  : '4. अतिरिक्त निर्देश या विशेष जानकारी (वैकल्पिक)'}
              </label>
              <textarea
                id="order-special-notes"
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder={
                  lang === 'en'
                    ? 'Any specific layout requirement, urgent deadline, or spelling note...'
                    : 'कोई विशेष निर्देश या समय सीमा यहाँ लिखें...'
                }
                className="w-full px-3.5 py-2.5 bg-white border border-[#DCD4C6] rounded-xl text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
              />
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-[#5C5852]">
                {completeness.valid ? (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    {lang === 'en'
                      ? 'All required documents attached. Ready to review.'
                      : 'सभी आवश्यक दस्तावेज़ संलग्न हैं। समीक्षा के लिए तैयार।'}
                  </span>
                ) : (
                  <span className="text-[#C83713] font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    {lang === 'en'
                      ? `Missing: ${completeness.missingDocsEn.join(', ')}`
                      : `शेष: ${completeness.missingDocsHi.join(', ')}`}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="min-h-[48px] px-6 py-3 bg-[#FF5C35] hover:bg-[#E84B25] text-white font-semibold text-sm rounded-xl transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <span>
                  {lang === 'en' ? 'Review Order Details' : 'ऑर्डर विवरण की समीक्षा करें'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Review & Confirm Order */
          <div className="space-y-6">
            <div className="bg-[#F7F3EA] border border-[#E6DFD3] rounded-xl p-5 space-y-4">
              <h2 className="font-display text-base font-bold text-[#101014]">
                {lang === 'en'
                  ? 'Review Your Order Before Submitting'
                  : 'सबमिट करने से पहले अपने ऑर्डर की जांच करें'}
              </h2>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-[#5C5852]">
                    {lang === 'en' ? 'Customer Name' : 'ग्राहक का नाम'}
                  </dt>
                  <dd className="font-semibold text-[#101014] mt-0.5">
                    {customerName}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#5C5852]">
                    {lang === 'en' ? 'Mobile Number' : 'मोबाइल नंबर'}
                  </dt>
                  <dd className="font-semibold text-[#101014] font-mono-tabular mt-0.5">
                    {customerPhone}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#5C5852]">
                    {lang === 'en' ? 'Village / Town' : 'गाँव / शहर'}
                  </dt>
                  <dd className="font-semibold text-[#101014] mt-0.5">
                    {customerLocation}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#5C5852]">
                    {lang === 'en' ? 'Total Attached Files' : 'संलग्न दस्तावेज़'}
                  </dt>
                  <dd className="font-semibold text-[#101014] font-mono-tabular mt-0.5">
                    {allFlattenedUploads.length}{' '}
                    {lang === 'en' ? 'file(s) attached' : 'फ़ाइलें जुड़ी हैं'}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-xs text-[#5C5852]">
                    {lang === 'en' ? 'Attached Document Breakdown' : 'संलग्न दस्तावेज़ों की सूची'}
                  </dt>
                  <dd className="mt-1 space-y-1.5">
                    {allFlattenedUploads.map((up) => (
                      <div
                        key={up.id}
                        className="flex items-center justify-between text-xs bg-white px-3 py-1.5 rounded-lg border border-[#E6DFD3]"
                      >
                        <span className="font-medium text-[#101014]">
                          {lang === 'en' ? up.documentLabelEn : up.documentLabelHi}:{' '}
                          <span className="text-[#52504C]">{up.fileName}</span>
                        </span>
                        <span className="text-[#787166] font-mono-tabular">
                          {Math.round(up.sizeBytes / 1024)} KB
                        </span>
                      </div>
                    ))}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-xs text-[#5C5852]">
                    {lang === 'en' ? 'Service Details' : 'सेवा विवरण'}
                  </dt>
                  <dd className="text-[#101014] mt-0.5">
                    {formattedResponsesSummary || 'Standard Request'}
                  </dd>
                </div>
                {customerNotes && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-[#5C5852]">
                      {lang === 'en' ? 'Customer Instructions' : 'ग्राहक निर्देश'}
                    </dt>
                    <dd className="text-[#101014] mt-0.5">{customerNotes}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="p-4 bg-[#101014] border border-[#272732] rounded-xl text-xs text-[#D8D3C8] flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#FFB547] shrink-0 mt-0.5" />
              <span>
                {lang === 'en'
                  ? 'Security Notice: We never ask for bank passwords, UPI PINs, or OTPs. You will pay the transparent fee via UPI only after submitting the order and enter the UTR transaction reference for manual admin verification.'
                  : 'सुरक्षा सूचना: हम कभी भी बैंक पासवर्ड, UPI पिन या OTP नहीं मांगते हैं। ऑर्डर जमा करने के बाद आप सीधे UPI से भुगतान करेंगे और सत्यापन के लिए UTR नंबर दर्ज करेंगे।'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="min-h-[48px] px-5 py-2.5 bg-[#F7F3EA] hover:bg-[#ECE5D8] border border-[#DCD4C6] text-[#101014] font-semibold text-sm rounded-xl transition-colors"
              >
                ← {lang === 'en' ? 'Edit Details & Files' : 'विवरण और फ़ाइलें संशोधित करें'}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSubmit}
                className="min-h-[48px] px-6 py-3 bg-[#FF5C35] hover:bg-[#E84B25] disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <span>
                  {isSubmitting
                    ? lang === 'en'
                      ? 'Submitting Order...'
                      : 'ऑर्डर सबमिट हो रहा है...'
                    : lang === 'en'
                    ? 'Confirm & Place Order'
                    : 'पुष्टि करें और ऑर्डर सबमिट करें'}
                </span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
