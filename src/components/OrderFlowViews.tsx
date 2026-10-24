import React from 'react';
import {
  AppView,
  DigitalService,
  DocumentLibraryItem,
  Language,
  ServiceCustomField,
  ServiceOrder,
  UserProfile,
} from '../types';
import {
  buildDynamicUpiUri,
  buildOrderWhatsAppDispatchUrl,
  cleanDocumentLabel,
  createSampleVoiceNoteWavDataUrl,
  generateQrMatrix,
  getAcceptAttributeForFormats,
  getServiceDocumentRequirements,
  sanitizeString,
  StructuredDocRequirement,
  validateCustomerOrderInput,
  validateFileForDocumentRequirement,
  validateServiceDocumentChecklistUploads,
  validateUploadedFile,
} from '../utils/rules';
import {
  DEFAULT_CENTER_SETTINGS,
  SAMPLE_DELIVERABLE_DATA_URL,
} from '../data/initialCatalog';
import { BUSINESS_INFO } from '../config/businessInfo';
import { BrandLogo } from './BrandLogo';
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
  Check,
  Clock,
  Mic,
  Square,
  Volume2,
  QrCode,
  MessageCircle,
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
  documentLibrary?: DocumentLibraryItem[];
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
    voiceNoteDataUrl?: string;
    paymentMode?: string;
  }) => Promise<void>;
  onNavigate: (view: AppView) => void;
  onTrackSpecificOrder: (orderNumber: string) => void;
}

export const OrderFlowViews: React.FC<OrderFlowViewsProps> = ({
  mode,
  lang,
  service,
  documentLibrary = [],
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

  // Voice Note Recorder State (30-second MediaRecorder + sample WAV fallback)
  const [voiceNoteDataUrl, setVoiceNoteDataUrl] = React.useState<string>('');
  const [isRecordingVoice, setIsRecordingVoice] = React.useState(false);
  const [recordingSeconds, setRecordingSeconds] = React.useState(0);
  const [voiceStatusMsg, setVoiceStatusMsg] = React.useState<string | null>(null);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const recordTimerRef = React.useRef<number | null>(null);

  // Payment Mode State for Dynamic UPI QR & WhatsApp Dispatch
  const [paymentMode, setPaymentMode] = React.useState<string>(
    'UPI QR Instant Scan'
  );

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

  const stopActiveVoiceRecording = React.useCallback(() => {
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== 'inactive'
    ) {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore stop errors
      }
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsRecordingVoice(false);
  }, []);

  React.useEffect(() => {
    return () => {
      stopActiveVoiceRecording();
    };
  }, [stopActiveVoiceRecording]);

  const handleStartVoiceRecording = async () => {
    setVoiceStatusMsg(null);
    if (
      typeof window === 'undefined' ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      const fallbackWav = createSampleVoiceNoteWavDataUrl();
      setVoiceNoteDataUrl(fallbackWav);
      setRecordingSeconds(3);
      setVoiceStatusMsg(
        lang === 'en'
          ? 'Microphone unavailable in this browser environment — attached 3-second studio voice note preview.'
          : 'माइक्रोफ़ोन उपलब्ध नहीं है — 3-सेकंड का सैंपल वॉइस नोट जोड़ दिया गया है।'
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunks.push(ev.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, {
          type: recorder.mimeType || 'audio/webm',
        });
        const reader = new FileReader();
        reader.onload = () => {
          setVoiceNoteDataUrl(String(reader.result || ''));
        };
        reader.readAsDataURL(blob);
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
      };

      recorder.start();
      setIsRecordingVoice(true);
      setRecordingSeconds(0);

      recordTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev + 1 >= 30) {
            stopActiveVoiceRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      const fallbackWav = createSampleVoiceNoteWavDataUrl();
      setVoiceNoteDataUrl(fallbackWav);
      setRecordingSeconds(3);
      setVoiceStatusMsg(
        lang === 'en'
          ? 'Microphone permission declined or unavailable — attached 3-second studio voice note preview.'
          : 'माइक्रोफ़ोन अनुमति उपलब्ध नहीं — 3-सेकंड का सैंपल वॉइस नोट जोड़ दिया गया है।'
      );
    }
  };

  const handleAttachSampleVoiceNote = () => {
    stopActiveVoiceRecording();
    const wavUrl = createSampleVoiceNoteWavDataUrl();
    setVoiceNoteDataUrl(wavUrl);
    setRecordingSeconds(3);
    setVoiceStatusMsg(
      lang === 'en'
        ? '3-second Hindi/Bhojpuri sample voice instruction attached for playback.'
        : '3-सेकंड का हिंदी/भोजपुरी वॉइस निर्देश सैंपल जोड़ दिया गया है।'
    );
  };

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

  // Structured document requirements from single source of truth
  const docRequirements: StructuredDocRequirement[] = React.useMemo(() => {
    if (!service) return [];
    return getServiceDocumentRequirements(service, documentLibrary);
  }, [service, documentLibrary]);

  React.useEffect(() => {
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

  // ============================================================================
  // MODE: ORDER CONFIRMATION CERTIFICATE
  // ============================================================================
  if (mode === 'order-confirmation' && confirmedOrder) {
    const confirmUpiUri = buildDynamicUpiUri({
      upiId: DEFAULT_CENTER_SETTINGS.upiId || '6206800799@ybl',
      payeeName: DEFAULT_CENTER_SETTINGS.payeeName,
      amountInr: confirmedOrder.priceInr,
      orderNumber: confirmedOrder.orderNumber,
    });
    const confirmQrMatrix = generateQrMatrix(confirmUpiUri, 25);
    const confirmWhatsAppUrl = buildOrderWhatsAppDispatchUrl({
      whatsappNumber: BUSINESS_INFO.whatsappNumber,
      orderNumber: confirmedOrder.orderNumber,
      customerName: confirmedOrder.customerName,
      customerPhone: confirmedOrder.customerPhone,
      serviceTitle:
        lang === 'en'
          ? confirmedOrder.serviceTitleEn
          : confirmedOrder.serviceTitleHi,
      totalTariffInr: confirmedOrder.priceInr,
      paymentMode: confirmedOrder.paymentMode || paymentMode,
      hasVoiceNote: Boolean(confirmedOrder.voiceNoteDataUrl),
    });

    return (
      <div className="bg-[#F7F3EA] min-h-screen">
        <section className="editorial-dark-grid text-[#F7F3EA] border-b border-[#272732] py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <BrandLogo variant="badge" lang={lang} showSubtitle={false} />
              <div className="inline-flex items-center gap-2 font-mono-tabular text-xs font-bold uppercase tracking-[0.2em] text-[#FFB547]">
                <CheckCircle2 className="w-4 h-4 text-[#FF5C35]" />
                <span>
                  {lang === 'en'
                    ? 'DISPATCH CONFIRMED · DOSSIER QUEUED'
                    : 'ऑर्डर सफलतापूर्वक दर्ज हो गया है'}
                </span>
              </div>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F7F3EA] tracking-tight leading-[1.05]">
              {lang === 'en'
                ? 'Save Your Unique Order Number.'
                : 'अपना यूनिक ऑर्डर नंबर सुरक्षित रखें।'}
            </h1>

            <p className="text-sm sm:text-base text-[#D8D3C8] max-w-2xl leading-relaxed">
              {lang === 'en'
                ? 'Your order and supporting documents have been securely queued for review at Aditya Online Center, Kateya. Scan the dynamic UPI QR below or send your order receipt directly on WhatsApp.'
                : 'आपका ऑर्डर और दस्तावेज़ आदित्य ऑनलाइन सेंटर में समीक्षा के लिए प्राप्त हो गए हैं। नीचे दिए गए डायनामिक UPI QR को स्कैन करें या व्हाट्सएप पर ऑर्डर रसीद भेजें।'}
            </p>

            {/* Glassmorphic Architectural Order Number Monolith */}
            <div className="glass-obsidian-panel p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="font-mono-tabular text-[11px] uppercase tracking-[0.18em] text-[#A09D96]">
                  {lang === 'en' ? 'UNIQUE ORDER ID' : 'यूनिक ऑर्डर आईडी'}
                </div>
                <div
                  data-testid="confirmed-order-number"
                  className="text-2xl sm:text-3xl font-extrabold text-[#FFB547] font-mono-tabular mt-1 tracking-wider"
                >
                  {confirmedOrder.orderNumber}
                </div>
              </div>

              <div className="sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 border-white/10">
                <div className="font-mono-tabular text-[11px] uppercase tracking-[0.18em] text-[#A09D96]">
                  {lang === 'en' ? 'TARIFF & STATUS' : 'सेवा शुल्क और स्थिति'}
                </div>
                <div className="text-lg font-bold text-[#F7F3EA] font-mono-tabular mt-1">
                  ₹{confirmedOrder.priceInr} · {confirmedOrder.status}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
          {/* Dynamic UPI QR + WhatsApp Dispatch Card on Confirmation */}
          <div className="rounded-2xl bg-[#101014] text-[#F7F3EA] border border-[#272732] p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-4 flex flex-col items-center justify-center bg-white p-4 rounded-xl border-2 border-[#FFB547]">
              <svg
                data-testid="confirmed-dynamic-upi-qr-svg"
                viewBox={`0 0 ${confirmQrMatrix.length} ${confirmQrMatrix.length}`}
                className="w-40 h-40"
                shapeRendering="crispEdges"
                role="img"
                aria-label={`Dynamic UPI QR for ₹${confirmedOrder.priceInr}`}
              >
                {confirmQrMatrix.map((row, rIdx) =>
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
              <div className="mt-2 text-center font-mono-tabular text-[11px] font-bold text-[#101014]">
                SCAN & PAY ₹{confirmedOrder.priceInr}
              </div>
            </div>

            <div className="md:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono-tabular text-[11px] font-bold">
                <QrCode className="w-3.5 h-3.5" />
                <span>
                  {lang === 'en'
                    ? `DYNAMIC UPI QR · ₹${confirmedOrder.priceInr} LOCKED`
                    : `डायनामिक UPI QR · ₹${confirmedOrder.priceInr} निर्धारित`}
                </span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold text-white">
                {lang === 'en'
                  ? 'Instant WhatsApp Order & Receipt Dispatch'
                  : 'व्हाट्सएप पर ऑर्डर और रसीद तुरंत भेजें'}
              </h2>
              <p className="text-xs sm:text-sm text-[#D8D3C8] leading-relaxed">
                {lang === 'en'
                  ? 'Click the WhatsApp button below to send your pre-filled Order ID, selected service, total tariff, and payment mode directly to Aditya Online Center (6206800799).'
                  : 'नीचे दिए गए व्हाट्सएप बटन पर क्लिक करके अपना ऑर्डर आईडी, चयनित सेवा, कुल शुल्क और भुगतान माध्यम सीधे आदित्य ऑनलाइन सेंटर (6206800799) को भेजें।'}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={confirmWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="confirm-whatsapp-dispatch-btn"
                  className="min-h-[48px] px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-[0_10px_25px_-5px_rgba(16,185,129,0.5)]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    {lang === 'en'
                      ? 'Send Order & Receipt on WhatsApp'
                      : 'व्हाट्सएप पर ऑर्डर और रसीद भेजें'}
                  </span>
                </a>
                <a
                  href={confirmUpiUri}
                  className="min-h-[48px] px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-mono-tabular text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <span>
                    {lang === 'en' ? 'Open UPI App ↗' : 'UPI ऐप खोलें ↗'}
                  </span>
                </a>
              </div>
            </div>
          </div>

          <div className="border-t-2 border-b border-[#101014] divide-y divide-[#DCD4C6]">
            <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div className="font-mono-tabular text-xs uppercase tracking-wider text-[#5C5852]">
                {lang === 'en' ? '01. Selected Service' : '01. चयनित सेवा'}
              </div>
              <div className="sm:col-span-2 font-bold text-[#101014]">
                {lang === 'en'
                  ? confirmedOrder.serviceTitleEn
                  : confirmedOrder.serviceTitleHi}
              </div>
            </div>

            <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div className="font-mono-tabular text-xs uppercase tracking-wider text-[#5C5852]">
                {lang === 'en' ? '02. Applicant' : '02. ग्राहक विवरण'}
              </div>
              <div className="sm:col-span-2 font-mono-tabular font-semibold text-[#101014]">
                {confirmedOrder.customerName} ({confirmedOrder.customerPhone}) —{' '}
                {confirmedOrder.customerLocation}
              </div>
            </div>

            <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div className="font-mono-tabular text-xs uppercase tracking-wider text-[#5C5852]">
                {lang === 'en' ? '03. Attached Dossier' : '03. संलग्न दस्तावेज़'}
              </div>
              <div className="sm:col-span-2 font-mono-tabular font-semibold text-[#101014]">
                {confirmedOrder.uploadedFileCount}{' '}
                {lang === 'en' ? 'file(s) attached' : 'फ़ाइलें जुड़ी हैं'}
                {confirmedOrder.voiceNoteDataUrl
                  ? lang === 'en'
                    ? ' + Voice Instruction Note'
                    : ' + वॉइस निर्देश'
                  : ''}
              </div>
            </div>

            <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
              <div className="font-mono-tabular text-xs uppercase tracking-wider text-[#5C5852]">
                {lang === 'en' ? '04. Submitted Summary' : '04. दर्ज विवरण'}
              </div>
              <div className="sm:col-span-2 text-[#4A463E]">
                {confirmedOrder.formResponsesSummary}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={() => onTrackSpecificOrder(confirmedOrder.orderNumber)}
              className="min-h-[48px] px-6 py-3.5 bg-[#FF5C35] hover:bg-[#E54922] text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
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
              className="min-h-[48px] px-6 py-3.5 bg-[#101014] hover:bg-[#272732] text-[#F7F3EA] font-semibold text-sm transition-colors"
            >
              {lang === 'en' ? 'Go to Customer Portal' : 'ग्राहक पोर्टल पर जाएं'}
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (!service) {
    return (
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="bg-[#FFFDF9] border border-[#101014] p-8 space-y-4">
          <h2 className="text-xl font-bold text-[#101014] font-display">
            {lang === 'en'
              ? 'Please select a digital service first'
              : 'कृपया पहले एक सेवा चुनें'}
          </h2>
          <p className="text-sm text-[#5C5852]">
            {lang === 'en'
              ? 'Browse our catalog of resumes, government form-filling, scholarships, and PDF services.'
              : 'हमारे कैटलॉग से रिज्यूमे, सरकारी फॉर्म, छात्रवृत्ति और पीडीएफ सेवाओं में से चुनें।'}
          </p>
          <button
            type="button"
            onClick={() => onNavigate('services')}
            className="min-h-[44px] px-5 py-2.5 bg-[#FF5C35] hover:bg-[#E54922] text-white text-sm font-semibold"
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
      fileName: req
        ? `${req.labelEn.replace(/[^a-zA-Z0-9]/g, '_')}_Sample.pdf`
        : 'Sample_Supporting_Document.pdf',
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
      setErrorMsg(
        lang === 'en' ? contactValidation.errorEn! : contactValidation.errorHi!
      );
      return;
    }

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
        customerEmail: sanitizeString(
          customerEmail || 'customer@example.com',
          150
        ),
        customerLocation: sanitizeString(customerLocation, 120),
        formResponsesSummary: sanitizeString(
          formattedResponsesSummary || 'Standard Service Order',
          2400
        ),
        customerNotes: sanitizeString(customerNotes, 950),
        uploads: allFlattenedUploads,
        voiceNoteDataUrl: voiceNoteDataUrl || undefined,
        paymentMode,
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

  const step2UpiUri = buildDynamicUpiUri({
    upiId: DEFAULT_CENTER_SETTINGS.upiId || '6206800799@ybl',
    payeeName: DEFAULT_CENTER_SETTINGS.payeeName,
    amountInr: service.priceInr,
    orderNumber: `AOC-${service.id.toUpperCase().slice(0, 8)}`,
  });
  const step2QrMatrix = React.useMemo(
    () => generateQrMatrix(step2UpiUri, 25),
    [step2UpiUri]
  );
  const step2WhatsAppUrl = buildOrderWhatsAppDispatchUrl({
    whatsappNumber: BUSINESS_INFO.whatsappNumber,
    orderNumber: `PENDING-${service.id.toUpperCase().slice(0, 6)}`,
    customerName: customerName || 'Kateya Customer',
    customerPhone: customerPhone || '',
    serviceTitle: lang === 'en' ? service.titleEn : service.titleHi,
    totalTariffInr: service.priceInr,
    paymentMode,
    hasVoiceNote: Boolean(voiceNoteDataUrl),
  });

  return (
    <div className="bg-[#F7F3EA] min-h-screen">
      {/* Dark Charcoal Architectural Masthead */}
      <section className="editorial-dark-grid text-[#F7F3EA] border-b border-[#272732]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#272732]">
            <button
              type="button"
              onClick={() => onNavigate('services')}
              className="min-h-[40px] px-3 py-1.5 bg-[#16161E] border border-[#272732] hover:border-[#FF5C35] text-xs font-mono-tabular uppercase tracking-wider text-[#F7F3EA] transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#FF5C35]" />
              <span>
                {lang === 'en' ? 'Back to Services' : 'सेवा सूची पर वापस जाएं'}
              </span>
            </button>

            <div className="font-mono-tabular text-xs text-[#FFB547] uppercase tracking-wider">
              {step === 'details'
                ? lang === 'en'
                  ? 'STEP 01 / 02 · DETAILS & DOCUMENT DOSSIER'
                  : 'चरण 01 / 02 · विवरण और दस्तावेज़'
                : lang === 'en'
                ? 'STEP 02 / 02 · FINAL VERIFICATION & UPI SUMMARY'
                : 'चरण 02 / 02 · अंतिम जांच और UPI विवरण'}
            </div>
          </div>

          {/* 2-Step Visual Progress Bar */}
          <div
            data-testid="order-step-progress-bar"
            className="pt-5 pb-2 space-y-2.5"
          >
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  step === 'details'
                    ? 'bg-[#FF5C35]/15 border-[#FF5C35] text-white shadow-[0_0_20px_-6px_rgba(255,92,53,0.45)]'
                    : 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg font-mono-tabular text-xs font-extrabold flex items-center justify-center shrink-0 ${
                    step === 'details'
                      ? 'bg-[#FF5C35] text-white'
                      : 'bg-emerald-500 text-white'
                  }`}
                >
                  {step === 'details' ? '01' : <Check className="w-4 h-4" />}
                </span>
                <div className="min-w-0">
                  <div className="font-mono-tabular text-[10px] uppercase tracking-wider opacity-80">
                    {lang === 'en' ? 'STEP 01' : 'चरण 01'}
                  </div>
                  <div className="text-xs sm:text-sm font-bold truncate">
                    {lang === 'en'
                      ? 'Applicant & Document Dossier'
                      : 'आवेदक विवरण और दस्तावेज़ अपलोड'}
                  </div>
                </div>
              </div>

              <div
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  step === 'review'
                    ? 'bg-[#FF5C35]/15 border-[#FF5C35] text-white shadow-[0_0_20px_-6px_rgba(255,92,53,0.45)]'
                    : 'bg-white/[0.03] border-white/10 text-[#9E988E]'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg font-mono-tabular text-xs font-extrabold flex items-center justify-center shrink-0 ${
                    step === 'review'
                      ? 'bg-[#FF5C35] text-white'
                      : 'bg-white/10 text-[#9E988E]'
                  }`}
                >
                  02
                </span>
                <div className="min-w-0">
                  <div className="font-mono-tabular text-[10px] uppercase tracking-wider opacity-80">
                    {lang === 'en' ? 'STEP 02' : 'चरण 02'}
                  </div>
                  <div className="text-xs sm:text-sm font-bold truncate">
                    {lang === 'en'
                      ? 'Verify Dossier & UPI Summary'
                      : 'दस्तावेज़ जांच और UPI सारांश'}
                  </div>
                </div>
              </div>
            </div>

            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#FF5C35] via-[#FFB547] to-emerald-400 transition-all duration-500"
                style={{ width: step === 'details' ? '50%' : '100%' }}
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.18em] text-[#FF5C35]">
                {lang === 'en'
                  ? 'SERVICE ORDER SPECIFICATION'
                  : 'डिजिटल सेवा ऑर्डर फॉर्म'}
              </div>
              <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#F7F3EA] tracking-tight">
                {lang === 'en' ? service.titleEn : service.titleHi}
              </h1>
              <p className="text-xs sm:text-sm text-[#D8D3C8] max-w-2xl">
                {lang === 'en' ? service.descEn : service.descHi}
              </p>
            </div>

            <div className="shrink-0 bg-[#14141C] border border-[#272732] px-5 py-3.5 sm:text-right">
              <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#A09D96]">
                {lang === 'en' ? 'SERVICE FEE' : 'सेवा शुल्क'}
              </div>
              <div className="font-mono-tabular text-2xl sm:text-3xl font-extrabold text-[#FFB547]">
                ₹{service.priceInr}
              </div>
              <div className="font-mono-tabular text-[11px] text-[#D8D3C8] flex items-center sm:justify-end gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-[#FF5C35]" />
                <span>
                  {lang === 'en'
                    ? service.estimatedTimeEn
                    : service.estimatedTimeHi}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {errorMsg && (
          <div
            role="alert"
            className="mb-8 p-4 bg-red-50 border-l-4 border-red-600 text-sm text-red-900 flex items-start gap-2.5"
          >
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="font-semibold">{errorMsg}</div>
          </div>
        )}

        {step === 'details' ? (
          <form
            onSubmit={handleProceedToReview}
            className="space-y-12"
            noValidate
          >
            {/* 01 // CUSTOMER CONTACT INFORMATION */}
            <div className="space-y-6">
              <div className="flex items-baseline justify-between border-b-2 border-[#101014] pb-3">
                <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#101014] flex items-center gap-2.5">
                  <span className="font-mono-tabular text-xs font-bold text-[#FF5C35]">
                    01 //
                  </span>
                  <span>
                    {lang === 'en'
                      ? 'Customer Contact Details'
                      : 'ग्राहक संपर्क विवरण'}
                  </span>
                </h2>
                <span className="font-mono-tabular text-xs text-[#5C5852]">
                  {lang === 'en' ? '* MANDATORY' : '* अनिवार्य फ़ील्ड'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="order-customer-name"
                    className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#101014] mb-1.5"
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
                      lang === 'en'
                        ? 'Enter your full name'
                        : 'अपना पूरा नाम लिखें'
                    }
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#FFFDF9] border border-[#101014] text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="order-customer-phone"
                    className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#101014] mb-1.5"
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
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#FFFDF9] border border-[#101014] text-sm text-[#101014] font-mono-tabular focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="order-customer-location"
                    className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#101014] mb-1.5"
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
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#FFFDF9] border border-[#101014] text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="order-customer-email"
                    className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#101014] mb-1.5"
                  >
                    {lang === 'en'
                      ? 'Email Address (Optional)'
                      : 'ईमेल पता (वैकल्पिक)'}
                  </label>
                  <input
                    id="order-customer-email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#FFFDF9] border border-[#101014] text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* 02 // SERVICE-SPECIFIC DYNAMIC PARAMETERS */}
            {customFields.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-baseline justify-between border-b-2 border-[#101014] pb-3">
                  <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#101014] flex items-center gap-2.5">
                    <span className="font-mono-tabular text-xs font-bold text-[#FF5C35]">
                      02 //
                    </span>
                    <span>
                      {lang === 'en'
                        ? 'Service-Specific Details'
                        : 'सेवा से संबंधित आवश्यक जानकारी'}
                    </span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  {customFields.map((field) => {
                    const inputId = `custom-field-${field.id}`;
                    return (
                      <div key={field.id}>
                        <label
                          htmlFor={inputId}
                          className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#101014] mb-1.5"
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
                            className="w-full min-h-[44px] px-3.5 py-2 bg-[#FFFDF9] border border-[#101014] text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
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
                            className="w-full px-3.5 py-2.5 bg-[#FFFDF9] border border-[#101014] text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
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
                            className="w-full min-h-[44px] px-3.5 py-2 bg-[#FFFDF9] border border-[#101014] text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 03 // DYNAMIC DOCUMENT CHECKLIST UPLOADS (Per-Document Slots) */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#101014] pb-3">
                <div>
                  <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#101014] flex items-center gap-2.5">
                    <span className="font-mono-tabular text-xs font-bold text-[#FF5C35]">
                      03 //
                    </span>
                    <span>
                      {lang === 'en'
                        ? 'Document Upload Checklist'
                        : 'दस्तावेज़ अपलोड चेकलिस्ट'}
                    </span>
                  </h2>
                  <p className="text-xs text-[#5C5852] mt-1">
                    {lang === 'en'
                      ? 'Upload each required document in its dedicated slot below.'
                      : 'प्रत्येक आवश्यक दस्तावेज़ को उसके निर्धारित स्थान में अपलोड करें।'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleAttachSampleDocument(docRequirements[0])}
                  className="min-h-[38px] px-3.5 py-1.5 text-xs font-mono-tabular font-bold uppercase tracking-wider text-[#101014] bg-[#FFFDF9] hover:bg-[#EFE9DC] border border-[#101014] transition-colors whitespace-nowrap self-start sm:self-auto"
                >
                  {lang === 'en'
                    ? '+ Attach Sample Test Document'
                    : '+ टेस्ट दस्तावेज़ जोड़ें'}
                </button>
              </div>

              {/* Architectural Progress Strip */}
              <div className="bg-[#101014] text-[#F7F3EA] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 font-mono-tabular text-xs">
                    <span className="text-[#FFB547] font-bold">
                      {lang === 'en'
                        ? `${completeness.uploadedRequiredCount} OF ${completeness.totalRequiredCount} REQUIRED DOCUMENTS ATTACHED`
                        : `${completeness.totalRequiredCount} में से ${completeness.uploadedRequiredCount} आवश्यक दस्तावेज़ संलग्न`}
                    </span>
                    {completeness.valid && completeness.totalRequiredCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                        <Check className="w-3.5 h-3.5" />
                        {lang === 'en' ? 'COMPLETE' : 'पूर्ण'}
                      </span>
                    )}
                  </div>
                  <div className="w-full sm:w-72 bg-[#272732] h-1.5 overflow-hidden">
                    <div
                      className="bg-[#FF5C35] h-full transition-all duration-300"
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

                <div className="font-mono-tabular text-xs text-[#D8D3C8]">
                  {totalAttachedFilesCount}{' '}
                  {lang === 'en' ? 'TOTAL FILE(S) IN DOSSIER' : 'कुल फ़ाइलें'}
                </div>
              </div>

              {/* Dedicated Per-Document Drag-and-Drop Dashed Upload Zones */}
              <div
                className="grid grid-cols-1 gap-4"
                data-testid="order-document-checklist"
              >
                {docRequirements.map((req, idx) => {
                  const uploadedFiles = uploadsByDocId[req.docId] || [];
                  const isUploaded = uploadedFiles.length > 0;
                  const slotError = slotErrors[req.docId];
                  const acceptAttr = getAcceptAttributeForFormats(
                    req.allowedFormats
                  );
                  const cleanTitle = cleanDocumentLabel(
                    lang === 'en' ? req.labelEn : req.labelHi || req.labelEn
                  );

                  return (
                    <div
                      key={req.docId}
                      data-testid={`upload-slot-${req.docId}`}
                      className={`rounded-2xl border-2 border-dashed p-5 sm:p-6 transition-all duration-200 ${
                        isUploaded
                          ? 'bg-emerald-50/75 border-emerald-500 shadow-[0_10px_24px_-8px_rgba(16,185,129,0.2)]'
                          : req.required
                          ? 'bg-[#FFFDF9] border-[#FF5C35]/60 hover:border-[#FF5C35] hover:bg-[#FFF9F6]'
                          : 'bg-[#F7F3EA]/80 border-[#C5BCAE] hover:border-[#101014]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span
                              className={`w-7 h-7 rounded-lg font-mono-tabular text-xs font-extrabold flex items-center justify-center shrink-0 ${
                                isUploaded
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : req.required
                                  ? 'bg-[#FF5C35]/15 text-[#C83713] border border-[#FF5C35]/40'
                                  : 'bg-[#EFE9DC] text-[#5C5852]'
                              }`}
                            >
                              {isUploaded ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                String(idx + 1).padStart(2, '0')
                              )}
                            </span>
                            <h3 className="font-display font-bold text-base sm:text-lg text-[#101014]">
                              {cleanTitle}
                            </h3>
                            {req.required ? (
                              <span className="font-mono-tabular text-[10px] font-bold uppercase tracking-wider text-[#C83713] bg-[#FFECE8] border border-[#FF5C35]/40 px-2.5 py-0.5 rounded-full">
                                {lang === 'en' ? 'Required' : 'अनिवार्य'}
                              </span>
                            ) : (
                              <span className="font-mono-tabular text-[10px] font-semibold uppercase tracking-wider text-[#5C5852] bg-[#EFE9DC] border border-[#DCD4C6] px-2.5 py-0.5 rounded-full">
                                {lang === 'en' ? 'Optional' : 'वैकल्पिक'}
                              </span>
                            )}
                            {isUploaded && (
                              <span className="font-mono-tabular text-[10px] font-bold uppercase tracking-wider text-emerald-950 bg-emerald-200/80 border border-emerald-500/50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                {lang === 'en'
                                  ? 'Verified & Attached ✓'
                                  : 'संलग्न ✓'}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 font-mono-tabular text-xs text-[#5C5852]">
                            <span>
                              {lang === 'en' ? 'DROP OR SELECT' : 'प्रारूप'}:{' '}
                              {req.allowedFormats
                                .map((f) => f.toUpperCase())
                                .join(', ')}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              {lang === 'en' ? 'MAX SIZE' : 'अधिकतम साइज'}:{' '}
                              {req.maxSizeKb} KB
                            </span>
                          </div>

                          {(req.instructionsEn || req.instructionsHi) && (
                            <p className="text-xs text-[#4A463E] leading-relaxed pt-0.5">
                              {lang === 'en'
                                ? req.instructionsEn
                                : req.instructionsHi}
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
                            className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${
                              isUploaded
                                ? 'bg-white hover:bg-emerald-50 border border-emerald-600 text-emerald-900 shadow-sm'
                                : req.required
                                ? 'bg-gradient-to-r from-[#FF5C35] to-[#E54922] hover:from-[#FF6B47] hover:to-[#FF5C35] text-white shadow-[0_8px_20px_-6px_rgba(255,92,53,0.5)]'
                                : 'bg-[#101014] hover:bg-[#272732] text-white'
                            }`}
                          >
                            {isUploaded ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
                                <span>
                                  {lang === 'en' ? 'Replace File' : 'फ़ाइल बदलें'}
                                </span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5" />
                                <span>
                                  {lang === 'en'
                                    ? `Upload ${cleanTitle}`
                                    : `${cleanTitle} अपलोड करें`}
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Slot Error Message */}
                      {slotError && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>{slotError}</span>
                        </div>
                      )}

                      {/* Uploaded File Previews Inside This Document Slot */}
                      {isUploaded && (
                        <div className="mt-4 pt-3 border-t border-[#DCD4C6] space-y-2">
                          {uploadedFiles.map((up) => {
                            const isImage = up.mimeType.startsWith('image/');
                            return (
                              <div
                                key={up.id}
                                className="flex items-center justify-between gap-3 p-2.5 bg-[#F7F3EA] border border-[#DCD4C6] text-xs"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {isImage ? (
                                    <div className="w-10 h-10 overflow-hidden bg-white border border-[#DCD4C6] shrink-0">
                                      <img
                                        src={up.dataUrl}
                                        alt={up.fileName}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 bg-white border border-[#DCD4C6] flex items-center justify-center text-[#FF5C35] shrink-0">
                                      <FileText className="w-5 h-5" />
                                    </div>
                                  )}

                                  <div className="min-w-0">
                                    <div className="font-semibold text-[#101014] truncate">
                                      {up.fileName}
                                    </div>
                                    <div className="text-[11px] text-[#5C5852] font-mono-tabular">
                                      {Math.max(
                                        1,
                                        Math.round(up.sizeBytes / 1024)
                                      )}{' '}
                                      KB ·{' '}
                                      {up.mimeType.split('/')[1]?.toUpperCase()}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleTriggerFileInput(req.docId)
                                    }
                                    className="min-h-[34px] px-2.5 py-1 text-xs font-semibold text-[#5C5852] hover:text-[#101014] hover:bg-white transition-colors"
                                  >
                                    {lang === 'en' ? 'Replace' : 'बदलें'}
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`Remove ${up.fileName}`}
                                    onClick={() =>
                                      handleRemoveSlotFile(req.docId, up.id)
                                    }
                                    className="min-h-[34px] min-w-[34px] flex items-center justify-center text-red-600 hover:bg-red-50 transition-colors"
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
              <div className="p-5 bg-[#EFE9DC] border border-[#DCD4C6] space-y-3">
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
                    <p className="text-xs text-[#4A463E] mt-0.5">
                      {lang === 'en'
                        ? 'Have an extra marksheet, bank statement, or certificate not listed above? Attach it here.'
                        : 'कोई अन्य मार्कशीट, बैंक पासबुक या अतिरिक्त दस्तावेज़ यहाँ जोड़ सकते हैं।'}
                    </p>
                  </div>

                  <label className="min-h-[40px] px-4 py-2 bg-[#FFFDF9] border border-[#101014] hover:bg-[#101014] hover:text-white text-[#101014] text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap self-start sm:self-auto transition-colors">
                    <Upload className="w-4 h-4 text-[#FF5C35]" />
                    <span>
                      {lang === 'en' ? 'Attach Extra File' : 'फ़ाइल जोड़ें'}
                    </span>
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
                        className="flex items-center justify-between gap-3 p-2.5 bg-[#FFFDF9] border border-[#DCD4C6] text-xs"
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
                          className="min-h-[34px] min-w-[34px] flex items-center justify-center text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* 04 // SPECIAL INSTRUCTIONS + VOICE NOTE RECORDER */}
            <div className="space-y-4">
              <div className="border-b-2 border-[#101014] pb-2 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="order-special-notes"
                  className="font-display text-base sm:text-lg font-extrabold text-[#101014] flex items-center gap-2.5"
                >
                  <span className="font-mono-tabular text-xs font-bold text-[#FF5C35]">
                    04 //
                  </span>
                  <span>
                    {lang === 'en'
                      ? 'Additional Instructions & Voice Note (हमें बोलकर बताएं)'
                      : 'अतिरिक्त निर्देश और वॉइस नोट (हमें बोलकर बताएं)'}
                  </span>
                </label>
                <span className="font-mono-tabular text-[11px] font-bold text-[#C83713]">
                  {lang === 'en'
                    ? 'HINDI / BHOJPURI / ENGLISH AUDIO SUPPORTED'
                    : 'हिंदी / भोजपुरी / अंग्रेजी ऑडियो समर्थित'}
                </span>
              </div>

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
                className="w-full px-3.5 py-2.5 bg-[#FFFDF9] border border-[#101014] text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
              />

              {/* Browser MediaRecorder Voice Note Box */}
              <div
                data-testid="voice-note-recorder"
                className="rounded-2xl bg-[#101014] text-[#F7F3EA] border border-[#272732] p-4 sm:p-5 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-mono-tabular text-xs font-bold text-[#FFB547]">
                      <Mic className="w-4 h-4 text-[#FF5C35]" />
                      <span>
                        {lang === 'en'
                          ? 'RECORD VOICE INSTRUCTIONS (हमें बोलकर बताएं · MAX 30s)'
                          : 'वॉइस निर्देश रिकॉर्ड करें (हमें बोलकर बताएं · अधिकतम 30 सेकंड)'}
                      </span>
                    </div>
                    <p className="text-xs text-[#D8D3C8]">
                      {lang === 'en'
                        ? 'Prefer speaking in Hindi or Bhojpuri instead of typing? Record a 30-second audio note for our Kateya operator.'
                        : 'टाइप करने के बजाय हिंदी या भोजपुरी में बोलकर बताना चाहते हैं? 30-सेकंड का ऑडियो संदेश रिकॉर्ड करें।'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {!isRecordingVoice ? (
                      <button
                        type="button"
                        data-testid="voice-note-record-btn"
                        onClick={handleStartVoiceRecording}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-[#FF5C35] hover:bg-[#E54922] text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-sm"
                      >
                        <Mic className="w-4 h-4" />
                        <span>
                          {lang === 'en'
                            ? 'Record Voice Instructions (हमें बोलकर बताएं)'
                            : 'हमें बोलकर बताएं (Record Voice)'}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        data-testid="voice-note-stop-btn"
                        onClick={stopActiveVoiceRecording}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-2 animate-pulse"
                      >
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>
                          {lang === 'en'
                            ? `Stop Recording (${recordingSeconds}s / 30s)`
                            : `रिकॉर्डिंग रोकें (${recordingSeconds}s / 30s)`}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      data-testid="voice-note-sample-btn"
                      onClick={handleAttachSampleVoiceNote}
                      className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-[#FFB547] font-mono-tabular text-xs font-bold transition-colors"
                    >
                      {lang === 'en'
                        ? '+ Sample Voice Note (3s)'
                        : '+ सैंपल वॉइस नोट (3s)'}
                    </button>
                  </div>
                </div>

                {voiceStatusMsg && (
                  <div className="text-xs text-emerald-300 font-mono-tabular">
                    {voiceStatusMsg}
                  </div>
                )}

                {voiceNoteDataUrl && (
                  <div
                    data-testid="voice-note-playback-box"
                    className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                      <Volume2 className="w-4 h-4 shrink-0" />
                      <span>
                        {lang === 'en'
                          ? `Voice Instruction Attached (${Math.max(1, recordingSeconds)}s)`
                          : `वॉइस निर्देश संलग्न (${Math.max(1, recordingSeconds)} सेकंड)`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <audio
                        data-testid="voice-note-audio-player"
                        controls
                        src={voiceNoteDataUrl}
                        className="h-9 max-w-[240px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setVoiceNoteDataUrl('');
                          setVoiceStatusMsg(null);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold"
                      >
                        {lang === 'en' ? 'Clear' : 'हटाएं'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#DCD4C6] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs font-mono-tabular">
                {completeness.valid ? (
                  <span className="text-emerald-800 font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    {lang === 'en'
                      ? 'ALL REQUIRED DOCUMENTS ATTACHED · READY FOR REVIEW'
                      : 'सभी आवश्यक दस्तावेज़ संलग्न हैं · समीक्षा के लिए तैयार'}
                  </span>
                ) : (
                  <span className="text-[#C83713] font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    {lang === 'en'
                      ? `MISSING: ${completeness.missingDocsEn.join(', ')}`
                      : `शेष: ${completeness.missingDocsHi.join(', ')}`}
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="min-h-[48px] px-7 py-3.5 bg-[#FF5C35] hover:bg-[#E54922] text-white font-bold text-sm transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <span>
                  {lang === 'en'
                    ? 'Review Order Details'
                    : 'ऑर्डर विवरण की समीक्षा करें'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          /* STEP 2: REVIEW & CONFIRM ORDER */
          <div className="space-y-8">
            <div className="border-t-2 border-b border-[#101014] divide-y divide-[#DCD4C6]">
              <div className="py-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-extrabold text-[#101014]">
                  {lang === 'en'
                    ? 'Review Your Order Dossier Before Dispatch'
                    : 'सबमिट करने से पहले अपने ऑर्डर की जांच करें'}
                </h2>
                <span className="font-mono-tabular text-xs text-[#C83713] font-bold">
                  STEP 02 // VERIFY
                </span>
              </div>

              <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-mono-tabular text-xs uppercase text-[#5C5852]">
                    {lang === 'en' ? 'Customer Name' : 'ग्राहक का नाम'}
                  </div>
                  <div className="font-bold text-[#101014] mt-0.5">
                    {customerName}
                  </div>
                </div>
                <div>
                  <div className="font-mono-tabular text-xs uppercase text-[#5C5852]">
                    {lang === 'en' ? 'Mobile Number' : 'मोबाइल नंबर'}
                  </div>
                  <div className="font-bold text-[#101014] font-mono-tabular mt-0.5">
                    {customerPhone}
                  </div>
                </div>
                <div>
                  <div className="font-mono-tabular text-xs uppercase text-[#5C5852]">
                    {lang === 'en' ? 'Village / Town' : 'गाँव / शहर'}
                  </div>
                  <div className="font-bold text-[#101014] mt-0.5">
                    {customerLocation}
                  </div>
                </div>
                <div>
                  <div className="font-mono-tabular text-xs uppercase text-[#5C5852]">
                    {lang === 'en' ? 'Attached Dossier' : 'संलग्न दस्तावेज़'}
                  </div>
                  <div className="font-bold text-[#101014] font-mono-tabular mt-0.5">
                    {allFlattenedUploads.length}{' '}
                    {lang === 'en' ? 'file(s) attached' : 'फ़ाइलें जुड़ी हैं'}
                    {voiceNoteDataUrl
                      ? lang === 'en'
                        ? ' + Voice Note'
                        : ' + वॉइस नोट'
                      : ''}
                  </div>
                </div>
              </div>

              <div className="py-4 space-y-2">
                <div className="font-mono-tabular text-xs uppercase text-[#5C5852]">
                  {lang === 'en'
                    ? 'Attached Document Breakdown'
                    : 'संलग्न दस्तावेज़ों की सूची'}
                </div>
                <div className="divide-y divide-[#DCD4C6] border border-[#DCD4C6] bg-[#FFFDF9]">
                  {allFlattenedUploads.map((up) => (
                    <div
                      key={up.id}
                      className="flex items-center justify-between text-xs px-3.5 py-2.5"
                    >
                      <span className="font-semibold text-[#101014]">
                        {cleanDocumentLabel(
                          lang === 'en'
                            ? up.documentLabelEn || up.fileName
                            : up.documentLabelHi || up.fileName
                        )}
                        :{' '}
                        <span className="text-[#52504C] font-normal">
                          {up.fileName}
                        </span>
                      </span>
                      <span className="text-[#787166] font-mono-tabular">
                        {Math.round(up.sizeBytes / 1024)} KB
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="py-4 text-sm">
                <div className="font-mono-tabular text-xs uppercase text-[#5C5852]">
                  {lang === 'en' ? 'Service Parameters' : 'सेवा विवरण'}
                </div>
                <div className="text-[#101014] mt-1">
                  {formattedResponsesSummary || 'Standard Request'}
                </div>
              </div>
            </div>

            {/* Framed Dynamic UPI QR & WhatsApp Dispatch Card */}
            <div
              data-testid="upi-payment-summary-card"
              className="rounded-2xl bg-[#101014] text-[#F7F3EA] border border-[#272732] p-6 sm:p-7 space-y-6 shadow-[0_20px_40px_-15px_rgba(16,16,20,0.45)]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div className="space-y-1">
                  <div className="font-mono-tabular text-[11px] font-bold uppercase tracking-[0.2em] text-[#FF5C35]">
                    {lang === 'en'
                      ? 'DYNAMIC UPI QR & WHATSAPP ORDER DISPATCH'
                      : 'डायनामिक UPI QR और व्हाट्सएप ऑर्डर डिस्पैच'}
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-extrabold text-white">
                    {lang === 'en'
                      ? 'Scan Exact Tariff QR or Dispatch via WhatsApp'
                      : 'सटीक शुल्क QR स्कैन करें या व्हाट्सएप पर भेजें'}
                  </h3>
                </div>
                <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5C35]/20 to-[#FFB547]/20 border border-[#FFB547]/40 sm:text-right">
                  <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#FFB547]">
                    {lang === 'en' ? 'PAYABLE TARIFF' : 'देय शुल्क'}
                  </div>
                  <div className="font-mono-tabular text-2xl font-extrabold text-white">
                    ₹{service.priceInr}
                  </div>
                </div>
              </div>

              {/* Payment Mode Selector + Dynamic QR Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-4 flex flex-col items-center justify-center bg-white p-4 rounded-xl border-2 border-[#FFB547]">
                  <svg
                    data-testid="dynamic-upi-qr-svg"
                    viewBox={`0 0 ${step2QrMatrix.length} ${step2QrMatrix.length}`}
                    className="w-40 h-40"
                    shapeRendering="crispEdges"
                    role="img"
                    aria-label={`Dynamic UPI QR Code for ₹${service.priceInr}`}
                  >
                    {step2QrMatrix.map((row, rIdx) =>
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
                  <div className="mt-2 font-mono-tabular text-[11px] font-extrabold text-[#101014] text-center">
                    UPI://PAY · ₹{service.priceInr}
                  </div>
                </div>

                <div className="md:col-span-8 space-y-4">
                  <div>
                    <label className="block font-mono-tabular text-[11px] uppercase tracking-wider text-[#FFB547] mb-2">
                      {lang === 'en'
                        ? 'SELECT PREFERRED PAYMENT MODE'
                        : 'भुगतान माध्यम चुनें'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        {
                          id: 'UPI QR Instant Scan',
                          labelEn: 'UPI QR Scan',
                          labelHi: 'UPI QR स्कैन',
                        },
                        {
                          id: 'UPI ID / Manual UTR',
                          labelEn: 'UPI / 12-Digit UTR',
                          labelHi: 'UPI / 12-अंकीय UTR',
                        },
                        {
                          id: 'Pay at Shop Counter',
                          labelEn: 'Pay at Kateya Shop',
                          labelHi: 'दुकान पर भुगतान',
                        },
                      ].map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentMode(pm.id)}
                          className={`min-h-[40px] px-3 py-2 rounded-xl font-mono-tabular text-xs font-bold border text-left transition-all ${
                            paymentMode === pm.id
                              ? 'bg-[#FF5C35] text-white border-[#FF5C35]'
                              : 'bg-white/[0.04] text-[#D8D3C8] border-white/15 hover:border-white/35'
                          }`}
                        >
                          {lang === 'en' ? pm.labelEn : pm.labelHi}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                      <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#9E988E]">
                        {lang === 'en' ? 'VERIFIED PAYEE' : 'प्राप्तकर्ता का नाम'}
                      </div>
                      <div className="font-bold text-sm text-white mt-0.5">
                        {DEFAULT_CENTER_SETTINGS.payeeName}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10">
                      <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#9E988E]">
                        {lang === 'en' ? 'ESTIMATED DELIVERY' : 'अनुमानित समय'}
                      </div>
                      <div className="font-mono-tabular text-sm font-bold text-emerald-400 mt-0.5">
                        {lang === 'en'
                          ? service.estimatedTimeEn
                          : service.estimatedTimeHi}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <a
                      href={step2WhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="step2-whatsapp-dispatch-btn"
                      className="min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition-all flex items-center gap-2 shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>
                        {lang === 'en'
                          ? 'Send Order & Receipt on WhatsApp'
                          : 'व्हाट्सएप पर ऑर्डर और रसीद भेजें'}
                      </span>
                    </a>
                    <span className="font-mono-tabular text-[11px] text-[#9E988E]">
                      WhatsApp: {BUSINESS_INFO.whatsappNumber}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-1 flex items-start gap-3 text-xs text-[#D8D3C8]">
                <ShieldCheck className="w-5 h-5 text-[#FFB547] shrink-0 mt-0.5" />
                <span>
                  {lang === 'en'
                    ? 'Security Notice: We never ask for bank passwords, UPI PINs, or OTPs. Place your order below to generate your official Order ID, then scan the UPI QR or dispatch on WhatsApp.'
                    : 'सुरक्षा सूचना: हम कभी भी बैंक पासवर्ड, UPI पिन या OTP नहीं मांगते हैं। अपना यूनिक ऑर्डर नंबर प्राप्त करने के लिए नीचे सबमिट करें।'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="min-h-[48px] px-5 py-3 bg-[#FFFDF9] hover:bg-[#EFE9DC] border border-[#101014] text-[#101014] font-semibold text-sm transition-colors"
              >
                ←{' '}
                {lang === 'en'
                  ? 'Edit Details & Files'
                  : 'विवरण और फ़ाइलें संशोधित करें'}
              </button>

              <button
                type="button"
                data-testid="confirm-place-order-btn"
                disabled={isSubmitting}
                onClick={handleConfirmSubmit}
                className="min-h-[48px] px-7 py-3.5 bg-[#FF5C35] hover:bg-[#E54922] disabled:opacity-60 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
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
      </section>
    </div>
  );
};
