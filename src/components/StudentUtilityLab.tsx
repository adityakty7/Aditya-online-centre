import React from 'react';
import { DigitalService, Language } from '../types';
import {
  EXAM_PHOTO_PRESETS,
  ExamPhotoPreset,
  calculateExactAgeAndEligibility,
  estimateDataUrlSizeKb,
} from '../utils/rules';
import {
  Camera,
  Calendar,
  Download,
  Sparkles,
  CheckCircle2,
  XCircle,
  Upload,
  Sliders,
  FileImage,
  Calculator,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface StudentUtilityLabProps {
  lang: Language;
  services: DigitalService[];
  onStartOrder: (service: DigitalService) => void;
}

export const StudentUtilityLab: React.FC<StudentUtilityLabProps> = ({
  lang,
  services,
  onStartOrder,
}) => {
  const [activeTab, setActiveTab] = React.useState<'resizer' | 'age'>('resizer');

  // ============================================================================
  // TAB 1 STATE: HTML5 CANVAS PHOTO & SIGNATURE RESIZER + DATE STAMPER
  // ============================================================================
  const [selectedPresetId, setSelectedPresetId] =
    React.useState<string>('ssc-photo');
  const [customWidth, setCustomWidth] = React.useState<number>(200);
  const [customHeight, setCustomHeight] = React.useState<number>(230);
  const [jpegQuality, setJpegQuality] = React.useState<number>(0.86);
  const [addNameDateStamp, setAddNameDateStamp] = React.useState<boolean>(true);
  const [stampName, setStampName] = React.useState<string>('ANKIT KUMAR VERMA');
  const [stampDate, setStampDate] = React.useState<string>('24-10-2026');
  const [sourceImageObj, setSourceImageObj] =
    React.useState<HTMLImageElement | null>(null);
  const [sourceLabel, setSourceLabel] = React.useState<string>(
    'Built-In Studio Sample Portrait'
  );
  const [outputDataUrl, setOutputDataUrl] = React.useState<string>('');
  const [outputSizeKb, setOutputSizeKb] = React.useState<number>(0);

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const activePreset: ExamPhotoPreset = React.useMemo(() => {
    return (
      EXAM_PHOTO_PRESETS.find((p) => p.id === selectedPresetId) ||
      EXAM_PHOTO_PRESETS[0]
    );
  }, [selectedPresetId]);

  React.useEffect(() => {
    if (selectedPresetId !== 'custom') {
      setCustomWidth(activePreset.widthPx);
      setCustomHeight(activePreset.heightPx);
      setJpegQuality(activePreset.defaultQuality);
    }
  }, [selectedPresetId, activePreset]);

  // Render output onto HTML5 Canvas whenever parameters or source image change
  const renderCanvasOutput = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = Math.max(80, Math.min(1200, Number(customWidth) || 200));
    const h = Math.max(40, Math.min(1200, Number(customHeight) || 230));
    canvas.width = w;
    canvas.height = h;

    // 1. Studio Backdrop
    if (selectedPresetId === 'exam-signature') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#E0F2FE');
      grad.addColorStop(1, '#BAE6FD');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Draw either uploaded image or studio vector portrait/signature
    if (sourceImageObj) {
      const imgRatio = sourceImageObj.width / Math.max(1, sourceImageObj.height);
      const canvasRatio = w / Math.max(1, h);
      let drawW = w;
      let drawH = h;
      let offsetX = 0;
      let offsetY = 0;
      if (imgRatio > canvasRatio) {
        drawW = h * imgRatio;
        offsetX = -(drawW - w) / 2;
      } else {
        drawH = w / imgRatio;
        offsetY = -(drawH - h) / 2;
      }
      ctx.drawImage(sourceImageObj, offsetX, offsetY, drawW, drawH);
    } else if (selectedPresetId === 'exam-signature') {
      // Sample Cursive Signature Vector
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.65);
      ctx.bezierCurveTo(w * 0.28, h * 0.2, w * 0.45, h * 0.85, w * 0.62, h * 0.35);
      ctx.bezierCurveTo(w * 0.72, h * 0.18, w * 0.8, h * 0.7, w * 0.88, h * 0.48);
      ctx.stroke();
      ctx.fillStyle = '#1E293B';
      ctx.font = `italic bold ${Math.max(12, Math.round(h * 0.28))}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Ankit Kr. Verma', w / 2, h * 0.58);
    } else {
      // Clean Studio Passport Silhouette Vector
      const cx = w / 2;
      const headRadius = Math.min(w, h) * 0.21;
      const headY = h * 0.34;

      // Shoulders / Suit
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.ellipse(cx, h * 0.84, w * 0.38, h * 0.28, 0, Math.PI, 0, false);
      ctx.fill();

      // Collar / Shirt V
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.1, h * 0.58);
      ctx.lineTo(cx + w * 0.1, h * 0.58);
      ctx.lineTo(cx, h * 0.76);
      ctx.closePath();
      ctx.fill();

      // Tie
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.025, h * 0.62);
      ctx.lineTo(cx + w * 0.025, h * 0.62);
      ctx.lineTo(cx + w * 0.035, h * 0.78);
      ctx.lineTo(cx, h * 0.83);
      ctx.lineTo(cx - w * 0.035, h * 0.78);
      ctx.closePath();
      ctx.fill();

      // Neck
      ctx.fillStyle = '#FDBA74';
      ctx.fillRect(cx - headRadius * 0.38, headY + headRadius * 0.7, headRadius * 0.76, headRadius * 0.55);

      // Face
      ctx.fillStyle = '#FED7AA';
      ctx.beginPath();
      ctx.arc(cx, headY, headRadius, 0, Math.PI * 2);
      ctx.fill();

      // Hair
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(cx, headY - headRadius * 0.15, headRadius * 1.02, Math.PI, 0, false);
      ctx.fill();
    }

    // 3. Optional Name & Date of Photo (DOP) White Slate at Bottom
    if (addNameDateStamp && selectedPresetId !== 'exam-signature') {
      const stripH = Math.max(28, Math.round(h * 0.22));
      const stripY = h - stripH;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, stripY, w, stripH);

      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0.75, stripY, w - 1.5, stripH - 0.75);

      const fontSizeName = Math.max(9, Math.min(15, Math.round(w * 0.058)));
      const fontSizeDate = Math.max(8, Math.min(13, Math.round(w * 0.05)));

      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.font = `bold ${fontSizeName}px Inter, Arial, sans-serif`;
      const cleanName = (stampName || 'APPLICANT NAME').trim().toUpperCase();
      ctx.fillText(cleanName.slice(0, 24), w / 2, stripY + stripH * 0.44);

      ctx.font = `bold ${fontSizeDate}px JetBrains Mono, monospace`;
      const cleanDate = (stampDate || '24-10-2026').trim();
      ctx.fillText(`DOP: ${cleanDate}`, w / 2, stripY + stripH * 0.82);
    }

    // 4. Outer 1px border frame
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
      setOutputDataUrl(dataUrl);
      setOutputSizeKb(estimateDataUrlSizeKb(dataUrl));
    } catch {
      // Ignore canvas security errors if any
    }
  }, [
    customWidth,
    customHeight,
    jpegQuality,
    addNameDateStamp,
    stampName,
    stampDate,
    sourceImageObj,
    selectedPresetId,
  ]);

  React.useEffect(() => {
    renderCanvasOutput();
  }, [renderCanvasOutput]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setSourceImageObj(img);
        setSourceLabel(file.name);
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ============================================================================
  // TAB 2 STATE: GOVERNMENT EXAM AGE ELIGIBILITY CALCULATOR
  // ============================================================================
  const [dobInput, setDobInput] = React.useState<string>('2003-05-15');
  const [cutoffInput, setCutoffInput] = React.useState<string>('2026-08-01');

  const ageResult = React.useMemo(() => {
    return calculateExactAgeAndEligibility(dobInput, cutoffInput);
  }, [dobInput, cutoffInput]);

  const pdfService = React.useMemo(() => {
    return (
      services.find((s) => s.id === 'srv-pdf-document-pack') || services[0]
    );
  }, [services]);

  return (
    <section
      id="student-utility-lab-section"
      data-testid="student-utility-lab-section"
      className="editorial-dark-grid text-[#F7F3EA] border-t border-b border-white/15 py-14 sm:py-22 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-8">
        {/* Section Header + Tab Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/15 pb-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/15 border border-cyan-400/40 font-mono-tabular text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-[#FF5C35]" />
              <span>
                {lang === 'en'
                  ? '01.F · SELF-SERVICE STUDENT UTILITY LAB'
                  : '01.F · निःशुल्क छात्र फोटो रिसाइज़र एवं आयु कैलकुलेटर'}
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-[1.06]">
              {lang === 'en'
                ? 'Exam Photo Date-Stamper & Age Eligibility Lab'
                : 'परीक्षा फोटो नाम-तारीख स्टैम्पर और आयु पात्रता लैब'}
            </h2>
            <p className="text-xs sm:text-sm text-[#D8D3C8] leading-relaxed">
              {lang === 'en'
                ? 'Resize your passport photo or signature to exact SSC, BPSC, Bihar Board, or PAN dimensions with a Name & Date of Photo (DOP) slate—or check your exact cut-off age eligibility instantly.'
                : 'SSC, BPSC, बिहार बोर्ड या पैन कार्ड के लिए फोटो पर नाम व तारीख (DOP) जोड़ें और सही KB साइज बनाएं, या कट-ऑफ तिथि पर अपनी सटीक आयु जांचें।'}
            </p>
          </div>

          {/* 2-Tab Pill Switcher */}
          <div
            role="tablist"
            aria-label={
              lang === 'en' ? 'Student Utility Lab Tools' : 'छात्र उपयोगिता टूल्स'
            }
            className="flex flex-wrap items-center gap-2 bg-white/[0.06] p-1.5 rounded-2xl border border-white/15 self-start lg:self-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'resizer'}
              data-testid="utility-tab-resizer"
              onClick={() => setActiveTab('resizer')}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'resizer'
                  ? 'bg-gradient-to-r from-[#FF5C35] to-[#E54922] text-white shadow-[0_6px_18px_rgba(255,92,53,0.4)]'
                  : 'text-[#D8D3C8] hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>
                {lang === 'en'
                  ? 'Tab 1: Photo Resizer + Date Stamper'
                  : 'टैब 1: फोटो रिसाइज़र + तारीख स्टैम्प'}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'age'}
              data-testid="utility-tab-age"
              onClick={() => setActiveTab('age')}
              className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'age'
                  ? 'bg-gradient-to-r from-[#FF5C35] to-[#E54922] text-white shadow-[0_6px_18px_rgba(255,92,53,0.4)]'
                  : 'text-[#D8D3C8] hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>
                {lang === 'en'
                  ? 'Tab 2: Govt Exam Age Calculator'
                  : 'टैब 2: सरकारी परीक्षा आयु कैलकुलेटर'}
              </span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* TAB 1 CONTENT: EXAM PHOTO & SIGNATURE RESIZER + DATE STAMPER        */}
        {/* =================================================================== */}
        {activeTab === 'resizer' ? (
          <div
            data-testid="photo-resizer-panel"
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Left 7 Columns: Controls, Preset Selector & Name/Date Stamper */}
            <div className="lg:col-span-7 rounded-3xl glass-obsidian-panel p-6 sm:p-8 space-y-6 border border-white/15">
              {/* Upload or Reset Sample */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/15">
                <div>
                  <div className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#FFB547] font-bold">
                    {lang === 'en'
                      ? 'STEP 1 · SELECT SOURCE PHOTO OR SIGNATURE'
                      : 'चरण 1 · अपनी फोटो या हस्ताक्षर चुनें'}
                  </div>
                  <div className="text-xs text-[#D8D3C8] mt-0.5">
                    {lang === 'en' ? 'Active Source:' : 'सक्रिय फ़ाइल:'}{' '}
                    <span className="text-white font-semibold">{sourceLabel}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                  <button
                    type="button"
                    data-testid="upload-custom-photo-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#FF5C35] to-[#E54922] hover:from-[#FF6B47] hover:to-[#FF5C35] text-white text-xs font-bold flex items-center gap-2 shadow-[0_6px_18px_rgba(255,92,53,0.35)]"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'en'
                        ? 'Upload Photo / Sign'
                        : 'फोटो / हस्ताक्षर अपलोड करें'}
                    </span>
                  </button>

                  {sourceImageObj && (
                    <button
                      type="button"
                      onClick={() => {
                        setSourceImageObj(null);
                        setSourceLabel('Built-In Studio Sample Portrait');
                      }}
                      className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-xs font-semibold text-[#D8D3C8] flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'en' ? 'Use Demo Sample' : 'डेमो फोटो रीसेट'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Preset Selector */}
              <div className="space-y-3">
                <label
                  htmlFor="exam-photo-preset-select"
                  className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#FFB547]"
                >
                  {lang === 'en'
                    ? 'STEP 2 · PICK PORTAL PRESET (SSC, BPSC, BIHAR BOARD, PAN, CUSTOM)'
                    : 'चरण 2 · पोर्टल प्रीसेट चुनें (SSC, BPSC, बिहार बोर्ड, पैन कार्ड)'}
                </label>
                <select
                  id="exam-photo-preset-select"
                  data-testid="exam-photo-preset-select"
                  value={selectedPresetId}
                  onChange={(e) => setSelectedPresetId(e.target.value)}
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#10131C] border border-white/25 text-sm text-white font-semibold focus:border-[#FF5C35] focus:outline-none"
                >
                  {EXAM_PHOTO_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {lang === 'en' ? preset.labelEn : preset.labelHi}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[#D8D3C8]">
                  {lang === 'en' ? activePreset.notesEn : activePreset.notesHi}
                </p>
              </div>

              {/* Width, Height & JPEG Compression Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label
                    htmlFor="resizer-width-input"
                    className="block font-mono-tabular text-[11px] uppercase tracking-wider text-[#D8D3C8] mb-1"
                  >
                    {lang === 'en' ? 'Width (px)' : 'चौड़ाई (px)'}
                  </label>
                  <input
                    id="resizer-width-input"
                    type="number"
                    min={80}
                    max={1000}
                    value={customWidth}
                    onChange={(e) => {
                      setSelectedPresetId('custom');
                      setCustomWidth(Number(e.target.value) || 200);
                    }}
                    className="w-full min-h-[42px] px-3 py-1.5 rounded-xl bg-black/50 border border-white/20 text-sm font-mono-tabular text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="resizer-height-input"
                    className="block font-mono-tabular text-[11px] uppercase tracking-wider text-[#D8D3C8] mb-1"
                  >
                    {lang === 'en' ? 'Height (px)' : 'ऊंचाई (px)'}
                  </label>
                  <input
                    id="resizer-height-input"
                    type="number"
                    min={40}
                    max={1000}
                    value={customHeight}
                    onChange={(e) => {
                      setSelectedPresetId('custom');
                      setCustomHeight(Number(e.target.value) || 230);
                    }}
                    className="w-full min-h-[42px] px-3 py-1.5 rounded-xl bg-black/50 border border-white/20 text-sm font-mono-tabular text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="resizer-quality-range"
                    className="block font-mono-tabular text-[11px] uppercase tracking-wider text-[#D8D3C8] mb-1"
                  >
                    {lang === 'en' ? 'KB Compression' : 'KB कम्प्रेशन'}:{' '}
                    <span className="text-[#FFB547] font-bold">
                      {Math.round(jpegQuality * 100)}%
                    </span>
                  </label>
                  <input
                    id="resizer-quality-range"
                    type="range"
                    min={0.3}
                    max={0.98}
                    step={0.02}
                    value={jpegQuality}
                    onChange={(e) => setJpegQuality(Number(e.target.value))}
                    className="w-full accent-[#FF5C35] mt-2.5 cursor-pointer"
                  />
                </div>
              </div>

              {/* Optional Toggle: Add Name & Date of Photo at Bottom */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/15 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="toggle-name-date-stamp"
                    className="font-display text-sm sm:text-base font-bold text-white flex items-center gap-2.5 cursor-pointer"
                  >
                    <input
                      id="toggle-name-date-stamp"
                      data-testid="toggle-name-date-stamp"
                      type="checkbox"
                      checked={addNameDateStamp}
                      onChange={(e) => setAddNameDateStamp(e.target.checked)}
                      className="w-4 h-4 accent-[#FF5C35] rounded cursor-pointer"
                    />
                    <span>
                      {lang === 'en'
                        ? 'Add Name & Date of Photo at Bottom (SSC / BPSC Rule)'
                        : 'नीचे नाम और फोटो की तारीख (DOP) जोड़ें (SSC / BPSC नियम)'}
                    </span>
                  </label>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 font-mono-tabular text-[10px] font-bold text-emerald-300">
                    {addNameDateStamp
                      ? lang === 'en'
                        ? 'STAMP ACTIVE'
                        : 'चालू'
                      : lang === 'en'
                      ? 'OFF'
                      : 'बंद'}
                  </span>
                </div>

                {addNameDateStamp && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label
                        htmlFor="stamp-applicant-name"
                        className="block font-mono-tabular text-[11px] uppercase tracking-wider text-[#D8D3C8] mb-1"
                      >
                        {lang === 'en'
                          ? 'Candidate Name on Slate'
                          : 'फोटो पर छपने वाला नाम'}
                      </label>
                      <input
                        id="stamp-applicant-name"
                        data-testid="stamp-applicant-name"
                        type="text"
                        maxLength={26}
                        value={stampName}
                        onChange={(e) => setStampName(e.target.value)}
                        placeholder="e.g., ANKIT KUMAR VERMA"
                        className="w-full min-h-[42px] px-3.5 py-1.5 rounded-xl bg-black/55 border border-white/20 text-xs sm:text-sm font-mono-tabular text-white focus:border-[#FFB547] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="stamp-photo-date"
                        className="block font-mono-tabular text-[11px] uppercase tracking-wider text-[#D8D3C8] mb-1"
                      >
                        {lang === 'en'
                          ? 'Date of Photo (DD-MM-YYYY)'
                          : 'फोटो लेने की तारीख (DOP)'}
                      </label>
                      <input
                        id="stamp-photo-date"
                        data-testid="stamp-photo-date"
                        type="text"
                        maxLength={16}
                        value={stampDate}
                        onChange={(e) => setStampDate(e.target.value)}
                        placeholder="24-10-2026"
                        className="w-full min-h-[42px] px-3.5 py-1.5 rounded-xl bg-black/55 border border-white/20 text-xs sm:text-sm font-mono-tabular text-white focus:border-[#FFB547] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right 5 Columns: Live HTML5 Canvas Output Preview & Download */}
            <div className="lg:col-span-5 rounded-3xl glass-obsidian-panel p-6 sm:p-8 space-y-6 border border-[#FF5C35]/40 flex flex-col items-center text-center">
              <div className="w-full flex items-center justify-between border-b border-white/15 pb-3">
                <span className="font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#FFB547] flex items-center gap-1.5">
                  <FileImage className="w-4 h-4 text-[#FF5C35]" />
                  {lang === 'en' ? 'LIVE CANVAS OUTPUT' : 'लाइव आउटपुट प्रीव्यू'}
                </span>
                <span
                  data-testid="resizer-output-kb-badge"
                  className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 font-mono-tabular text-xs font-extrabold text-emerald-300"
                >
                  ~{outputSizeKb} KB · {customWidth}×{customHeight}px
                </span>
              </div>

              {/* Hidden/Visible Canvas for rendering */}
              <div className="p-4 rounded-2xl bg-black/60 border border-white/15 flex items-center justify-center min-h-[240px] w-full">
                <canvas
                  ref={canvasRef}
                  data-testid="photo-resizer-canvas"
                  className="max-w-full max-h-[260px] rounded shadow-[0_12px_30px_rgba(0,0,0,0.6)] border border-white/20"
                />
              </div>

              <div className="w-full space-y-2.5">
                <a
                  href={outputDataUrl || '#'}
                  download={`AOC_${selectedPresetId}_${customWidth}x${customHeight}.jpg`}
                  data-testid="download-resized-photo-btn"
                  className="w-full min-h-[46px] px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(16,185,129,0.35)] transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {lang === 'en'
                      ? `Download Ready JPG (~${outputSizeKb} KB)`
                      : `तैयार फोटो डाउनलोड करें (~${outputSizeKb} KB)`}
                  </span>
                </a>

                <button
                  type="button"
                  onClick={() => onStartOrder(pdfService)}
                  className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-[#FF5C35] text-white border border-white/20 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>
                    {lang === 'en'
                      ? 'Need Studio Background Removal + PDF Pack? Order @ ₹40'
                      : 'बैकग्राउंड सुधार व PDF मर्ज पैक ऑर्डर करें (₹40)'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* =================================================================== */
          /* TAB 2 CONTENT: GOVERNMENT EXAM AGE ELIGIBILITY CALCULATOR           */
          /* =================================================================== */
          <div
            data-testid="age-calculator-panel"
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Left 5 Columns: Date of Birth & Target Cut-Off Date Inputs */}
            <div className="lg:col-span-5 rounded-3xl glass-obsidian-panel p-6 sm:p-8 space-y-6 border border-white/15">
              <div className="space-y-1 border-b border-white/15 pb-4">
                <div className="font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#FFB547]">
                  {lang === 'en'
                    ? 'ENTER BIRTH & CUT-OFF DATES'
                    : 'जन्म तिथि और कट-ऑफ तिथि दर्ज करें'}
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  {lang === 'en'
                    ? 'Exact Age as on Notification Date'
                    : 'भर्ती नोटिफिकेशन तिथि पर सटीक आयु'}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="age-calc-dob-input"
                    className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#D8D3C8] mb-1.5"
                  >
                    {lang === 'en'
                      ? '1. Candidate Date of Birth (DOB)'
                      : '1. आवेदक की जन्म तिथि (DOB)'}
                  </label>
                  <input
                    id="age-calc-dob-input"
                    data-testid="age-calc-dob-input"
                    type="date"
                    value={dobInput}
                    onChange={(e) => setDobInput(e.target.value)}
                    className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-black/55 border border-white/25 text-sm font-mono-tabular text-white focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="age-calc-cutoff-input"
                    className="block font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#D8D3C8] mb-1.5"
                  >
                    {lang === 'en'
                      ? '2. Exam Target Cut-Off Date'
                      : '2. परीक्षा कट-ऑफ तिथि (Cut-Off Date)'}
                  </label>
                  <input
                    id="age-calc-cutoff-input"
                    data-testid="age-calc-cutoff-input"
                    type="date"
                    value={cutoffInput}
                    onChange={(e) => setCutoffInput(e.target.value)}
                    className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-black/55 border border-white/25 text-sm font-mono-tabular text-white focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>

                {/* Quick Cut-off Presets */}
                <div className="pt-1 space-y-2">
                  <div className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#A09D96]">
                    {lang === 'en'
                      ? 'Quick Recruitment Cut-Off Dates:'
                      : 'प्रमुख भर्ती कट-ऑफ तिथियां:'}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        date: '2026-08-01',
                        labelEn: '01 Aug 2026 (BPSC / Bihar Police)',
                        labelHi: '01 अगस्त 2026 (BPSC / बिहार पुलिस)',
                      },
                      {
                        date: '2027-01-01',
                        labelEn: '01 Jan 2027 (SSC GD / CGL)',
                        labelHi: '01 जनवरी 2027 (SSC GD / CGL)',
                      },
                    ].map((preset) => (
                      <button
                        key={preset.date}
                        type="button"
                        onClick={() => setCutoffInput(preset.date)}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.07] hover:bg-[#FF5C35]/25 border border-white/15 text-xs font-mono-tabular text-[#FFB547]"
                      >
                        {lang === 'en' ? preset.labelEn : preset.labelHi}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 7 Columns: Exact Years/Months/Days Result & Category Matrix */}
            <div className="lg:col-span-7 rounded-3xl glass-obsidian-panel p-6 sm:p-8 space-y-6 border border-[#FFB547]/40">
              {ageResult.valid ? (
                <>
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-[#FF5C35]/20 via-[#FFB547]/15 to-emerald-500/15 border border-[#FFB547]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#FFB547] font-bold">
                        {lang === 'en'
                          ? 'CALCULATED EXACT AGE'
                          : 'कट-ऑफ तिथि पर आपकी सटीक आयु'}
                      </div>
                      <div
                        data-testid="age-calc-result-summary"
                        className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1"
                      >
                        {lang === 'en'
                          ? ageResult.summaryEn
                          : ageResult.summaryHi}
                      </div>
                    </div>
                    <div className="font-mono-tabular text-xs text-emerald-300 bg-black/40 px-3.5 py-2 rounded-xl border border-emerald-400/30">
                      {ageResult.totalDays.toLocaleString()}{' '}
                      {lang === 'en' ? 'Total Days' : 'कुल दिन'}
                    </div>
                  </div>

                  {/* Category-wise Eligibility Table */}
                  <div className="space-y-3">
                    <div className="font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#D8D3C8]">
                      {lang === 'en'
                        ? 'CATEGORY-WISE RECRUITMENT ELIGIBILITY STATUS'
                        : 'श्रेणी के अनुसार भर्ती पात्रता स्थिति'}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {ageResult.categories.map((cat) => (
                        <div
                          key={cat.categoryKey}
                          data-testid={`age-category-${cat.categoryKey}`}
                          className={`p-4 rounded-2xl border flex flex-col justify-between gap-2 ${
                            cat.eligible
                              ? 'bg-emerald-500/12 border-emerald-400/40'
                              : 'bg-red-500/10 border-red-400/35'
                          }`}
                        >
                          <div className="text-xs sm:text-sm font-bold text-white">
                            {lang === 'en' ? cat.labelEn : cat.labelHi}
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <span
                              className={`inline-flex items-center gap-1.5 font-mono-tabular text-xs font-extrabold ${
                                cat.eligible
                                  ? 'text-emerald-300'
                                  : 'text-red-300'
                              }`}
                            >
                              {cat.eligible ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400" />
                              )}
                              <span>
                                {lang === 'en' ? cat.statusEn : cat.statusHi}
                              </span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 rounded-2xl bg-red-500/15 border border-red-400/40 text-sm text-red-200">
                  {lang === 'en' ? ageResult.errorEn : ageResult.errorHi}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
