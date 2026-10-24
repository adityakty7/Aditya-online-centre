import React from 'react';
import { DigitalService, Language } from '../types';
import {
  LIVE_DRAFT_TEMPLATES,
  LiveDraftTemplateId,
  generateLiveDraftPreviewContent,
} from '../utils/rules';
import {
  X,
  Sparkles,
  FileText,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface LiveDraftPreviewModalProps {
  isOpen: boolean;
  initialTemplateId?: LiveDraftTemplateId;
  lang: Language;
  services: DigitalService[];
  onClose: () => void;
  onOrderService: (service: DigitalService) => void;
}

export const LiveDraftPreviewModal: React.FC<LiveDraftPreviewModalProps> = ({
  isOpen,
  initialTemplateId = 'bank-unfreeze',
  lang,
  services,
  onClose,
  onOrderService,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] =
    React.useState<LiveDraftTemplateId>(initialTemplateId);
  const [previewLang, setPreviewLang] = React.useState<Language>(lang);

  const activeTemplate = React.useMemo(() => {
    return (
      LIVE_DRAFT_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
      LIVE_DRAFT_TEMPLATES[0]
    );
  }, [selectedTemplateId]);

  const [fields, setFields] = React.useState(activeTemplate.defaultFields);

  React.useEffect(() => {
    setSelectedTemplateId(initialTemplateId);
  }, [initialTemplateId]);

  React.useEffect(() => {
    setPreviewLang(lang);
  }, [lang]);

  React.useEffect(() => {
    setFields(activeTemplate.defaultFields);
  }, [activeTemplate]);

  if (!isOpen) return null;

  const draft = generateLiveDraftPreviewContent(
    selectedTemplateId,
    fields,
    previewLang
  );

  const matchingService =
    services.find(
      (s) =>
        s.id === activeTemplate.linkedServiceId ||
        (activeTemplate.linkedServiceId === 'srv-application-typing' &&
          s.id === 'srv-hindi-english-typing')
    ) || services[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-draft-preview-modal-title"
      data-testid="live-draft-preview-modal"
      className="fixed inset-0 z-50 bg-[#0A0D12]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-6xl rounded-3xl glass-obsidian-panel border border-white/20 text-[#F7F3EA] shadow-[0_28px_80px_rgba(0,0,0,0.85)] overflow-hidden my-auto">
        {/* Top Modal Header */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-white/15 flex items-center justify-between gap-4 bg-[#10131C]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 font-mono-tabular text-[11px] font-bold uppercase tracking-[0.18em] text-[#FFB547]">
              <Sparkles className="w-3.5 h-3.5 text-[#FF5C35]" />
              <span>
                {lang === 'en'
                  ? 'INSTANT A4 STUDIO DRAFT PREVIEWER'
                  : 'लाइव A4 आवेदन पत्र एवं विवाह बायोडाटा प्रीव्यू'}
              </span>
            </div>
            <h2
              id="live-draft-preview-modal-title"
              className="font-display text-lg sm:text-2xl font-extrabold text-white"
            >
              {lang === 'en'
                ? 'Try Live Draft Preview — Application Letters & Marriage Biodata'
                : 'आवेदन पत्र एवं विवाह बायोडाटा का लाइव A4 ड्राफ्ट प्रीव्यू'}
            </h2>
          </div>

          <button
            type="button"
            data-testid="close-live-preview-modal-btn"
            aria-label="Close Live Draft Preview"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] rounded-xl bg-white/[0.08] hover:bg-[#FF5C35] text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main 2-Column Body */}
        <div className="p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 max-h-[82vh] overflow-y-auto">
          {/* Left 5 Columns: Template Picker & 5 Basic Input Fields */}
          <div className="lg:col-span-5 space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="live-draft-template-select"
                className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#FFB547]"
              >
                {lang === 'en'
                  ? '1. Choose Document Template'
                  : '1. दस्तावेज़ टेम्पलेट चुनें'}
              </label>
              <select
                id="live-draft-template-select"
                data-testid="live-draft-template-select"
                value={selectedTemplateId}
                onChange={(e) =>
                  setSelectedTemplateId(e.target.value as LiveDraftTemplateId)
                }
                className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl bg-[#0A0D12] border border-white/25 text-xs sm:text-sm font-bold text-white focus:border-[#FF5C35] focus:outline-none"
              >
                {LIVE_DRAFT_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {lang === 'en' ? tpl.titleEn : tpl.titleHi} (₹{tpl.priceInr})
                  </option>
                ))}
              </select>
            </div>

            {/* Output Language Switcher for A4 Sheet */}
            <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-white/[0.05] border border-white/15">
              <span className="font-mono-tabular text-xs text-[#D8D3C8]">
                {lang === 'en'
                  ? 'A4 Draft Output Language:'
                  : 'A4 ड्राफ्ट की भाषा चुनें:'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreviewLang('en')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    previewLang === 'en'
                      ? 'bg-[#FF5C35] text-white'
                      : 'bg-white/10 text-[#D8D3C8]'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewLang('hi')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    previewLang === 'hi'
                      ? 'bg-[#FF5C35] text-white'
                      : 'bg-white/10 text-[#D8D3C8]'
                  }`}
                >
                  हिन्दी
                </button>
              </div>
            </div>

            {/* 5 Editable Fields */}
            <div className="space-y-3.5">
              <div>
                <label
                  htmlFor="draft-field-name"
                  className="block font-mono-tabular text-[11px] uppercase tracking-wider text-[#D8D3C8] mb-1"
                >
                  {lang === 'en'
                    ? 'Applicant Full Name / DOB'
                    : 'आवेदक का पूरा नाम / जन्म तिथि'}
                </label>
                <input
                  id="draft-field-name"
                  data-testid="draft-field-name"
                  type="text"
                  value={fields.applicantName}
                  onChange={(e) =>
                    setFields((prev) => ({
                      ...prev,
                      applicantName: e.target.value,
                    }))
                  }
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-black/55 border border-white/20 text-xs sm:text-sm text-white focus:border-[#FFB547] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="draft-field-to"
                  className="block font-mono-tabular text-[11px] uppercase tracking-wider text-[#D8D3C8] mb-1"
                >
                  {selectedTemplateId === 'marriage-biodata'
                    ? lang === 'en'
                      ? 'Parents & Family Details'
                      : 'माता-पिता एवं परिवार का विवरण'
                    : lang === 'en'
                    ? 'Recipient Authority / Branch / Office'
                    : 'अधिकारी / बैंक शाखा / कार्यालय का नाम'}
                </label>
                <input
                  id="draft-field-to"
                  data-testid="draft-field-to"
                  type="text"
                  value={fields.guardianOrTo}
                  onChange={(e) =>
                    setFields((prev) => ({
                      ...prev,
                      guardianOrTo: e.target.value,
                    }))
                  }
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-black/55 border border-white/20 text-xs sm:text-sm text-white focus:border-[#FFB547] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="draft-field-address"
                  className="block font-mono-tabular text-[11px] uppercase tracking-wider text-[#D8D3C8] mb-1"
                >
                  {lang === 'en'
                    ? 'Address / Ward / Village (Kateya)'
                    : 'गाँव / वार्ड / पता (कटेया, गोपालगंज)'}
                </label>
                <input
                  id="draft-field-address"
                  data-testid="draft-field-address"
                  type="text"
                  value={fields.addressOrVillage}
                  onChange={(e) =>
                    setFields((prev) => ({
                      ...prev,
                      addressOrVillage: e.target.value,
                    }))
                  }
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-black/55 border border-white/20 text-xs sm:text-sm text-white focus:border-[#FFB547] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="draft-field-subject"
                  className="block font-mono-tabular text-[11px] uppercase tracking-wider text-[#D8D3C8] mb-1"
                >
                  {selectedTemplateId === 'marriage-biodata'
                    ? lang === 'en'
                      ? 'Education & Occupation'
                      : 'शैक्षणिक योग्यता एवं नौकरी/व्यवसाय'
                    : lang === 'en'
                    ? 'Application Subject / Account No.'
                    : 'आवेदन का विषय / खाता संख्या'}
                </label>
                <input
                  id="draft-field-subject"
                  data-testid="draft-field-subject"
                  type="text"
                  value={fields.subjectOrEducation}
                  onChange={(e) =>
                    setFields((prev) => ({
                      ...prev,
                      subjectOrEducation: e.target.value,
                    }))
                  }
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-black/55 border border-white/20 text-xs sm:text-sm text-white focus:border-[#FFB547] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="draft-field-extra"
                  className="block font-mono-tabular text-[11px] uppercase tracking-wider text-[#D8D3C8] mb-1"
                >
                  {lang === 'en'
                    ? 'Supporting Enclosures / Gotra / Notes'
                    : 'संलग्न दस्तावेज़ / गोत्र / अतिरिक्त विवरण'}
                </label>
                <input
                  id="draft-field-extra"
                  data-testid="draft-field-extra"
                  type="text"
                  value={fields.extraDetails}
                  onChange={(e) =>
                    setFields((prev) => ({
                      ...prev,
                      extraDetails: e.target.value,
                    }))
                  }
                  className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-black/55 border border-white/20 text-xs sm:text-sm text-white focus:border-[#FFB547] focus:outline-none"
                />
              </div>
            </div>

            {/* Order Watermark-Free Studio PDF CTA */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                data-testid="order-watermark-free-pdf-btn"
                onClick={() => {
                  onClose();
                  onOrderService(matchingService);
                }}
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF5C35] via-[#E54922] to-[#C83713] hover:from-[#FF6B47] hover:to-[#FF5C35] text-white font-extrabold text-xs sm:text-sm shadow-[0_8px_28px_rgba(255,92,53,0.45)] transition-all flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>
                  {lang === 'en'
                    ? `Order Watermark-Free Studio PDF (₹${activeTemplate.priceInr})`
                    : `बिना वॉटरमार्क के फाइनल PDF ऑर्डर करें (₹${activeTemplate.priceInr})`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-emerald-300 font-mono-tabular">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {lang === 'en'
                    ? 'Proofread by Kateya Studio typist & delivered in 1–3 hours'
                    : 'कटेया स्टूडियो टाइपिस्ट द्वारा जांचा गया प्रिंट-रेडी A4 PDF'}
                </span>
              </div>
            </div>
          </div>

          {/* Right 7 Columns: Formatted A4 Document Sheet with Watermark Overlay */}
          <div className="lg:col-span-7 flex flex-col">
            <div
              data-testid="live-a4-preview-sheet"
              className="relative flex-1 rounded-2xl bg-[#FFFDF9] text-[#101014] border-4 border-[#DCD4C6] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 sm:p-10 overflow-hidden select-none"
            >
              {/* Repeating Diagonal Watermark Overlay */}
              <div
                aria-hidden="true"
                data-testid="live-preview-watermark"
                className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-14 -rotate-24 opacity-20 z-20"
              >
                <span className="font-mono-tabular text-lg sm:text-2xl font-extrabold uppercase tracking-[0.22em] text-[#C83713] border-2 border-[#C83713] px-4 py-1.5 whitespace-nowrap">
                  ADITYA ONLINE CENTER - PREVIEW WATERMARK
                </span>
                <span className="font-mono-tabular text-lg sm:text-2xl font-extrabold uppercase tracking-[0.22em] text-[#101014] border-2 border-[#101014] px-4 py-1.5 whitespace-nowrap">
                  ADITYA ONLINE CENTER - PREVIEW WATERMARK
                </span>
                <span className="font-mono-tabular text-lg sm:text-2xl font-extrabold uppercase tracking-[0.22em] text-[#C83713] border-2 border-[#C83713] px-4 py-1.5 whitespace-nowrap">
                  KATEYA STUDIO DRAFT · ORDER FINAL PDF
                </span>
              </div>

              {/* A4 Sheet Content */}
              <div className="relative z-10 space-y-5">
                <div className="text-center border-b-2 border-[#101014] pb-3">
                  <div className="font-mono-tabular text-xs font-extrabold uppercase tracking-[0.2em] text-[#C83713]">
                    {draft.headerInvocation}
                  </div>
                  <div className="text-[11px] font-mono-tabular text-[#5C5852] mt-1">
                    {draft.dateLine}
                  </div>
                </div>

                {selectedTemplateId === 'marriage-biodata' &&
                draft.structuredRows ? (
                  <div className="space-y-4">
                    <h3 className="text-center font-display text-xl sm:text-2xl font-extrabold text-[#101014] tracking-tight">
                      {draft.documentTitle}
                    </h3>
                    <div className="border-2 border-[#C83713]/50 rounded-xl divide-y divide-[#DCD4C6] bg-white/90">
                      {draft.structuredRows.map((row) => (
                        <div
                          key={row.label}
                          className="p-3.5 grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-3 text-xs sm:text-sm"
                        >
                          <div className="sm:col-span-4 font-bold text-[#C83713]">
                            {row.label}:
                          </div>
                          <div className="sm:col-span-8 font-semibold text-[#101014]">
                            {row.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
                    <div className="space-y-1">
                      <div className="font-bold text-[#101014]">
                        {draft.documentTitle}
                      </div>
                      {draft.recipientBlock.map((line, i) => (
                        <div key={i} className="font-semibold text-[#272732] pl-4">
                          {line}
                        </div>
                      ))}
                    </div>

                    <div className="p-3 rounded-lg bg-[#F7F3EA] border-l-4 border-[#C83713] font-bold text-[#101014]">
                      {draft.subjectLine}
                    </div>

                    <div className="space-y-3 text-[#101014]">
                      {draft.bodyParagraphs.map((para, i) => (
                        <p key={i} className="leading-relaxed">
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-[#DCD4C6] flex items-end justify-between text-xs sm:text-sm">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 font-mono-tabular text-[10px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>A4 PRINT-READY MARGIN</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[#5C5852]">{draft.signOffLabel}</div>
                    <div className="font-bold text-[#101014] mt-1">
                      {draft.applicantSignatureName}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
