import React from 'react';
import {
  CategoryMeta,
  DigitalService,
  Language,
  ServiceAnimationStyle,
  ServiceAppearanceConfig,
  ServiceImageFit,
  ServiceVisualMode,
} from '../types';
import {
  BUILTIN_3D_MEDIA_LIBRARY,
  clampFocalPoint,
  clampImageScale,
  getDefaultServiceAppearanceConfig,
  getServiceAppearanceConfig,
  serializeServiceAppearanceConfig,
  validateServiceImageUploadFile,
} from '../utils/serviceVisuals';
import { uploadOrOptimizeServiceImage } from '../firebase';
import { Service3DVisualStage } from './Service3DVisualStage';
import {
  Search,
  Upload,
  Sparkles,
  Image as ImageIcon,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  Eye,
  Clock,
  Layers,
  Check,
  RefreshCw,
} from 'lucide-react';

interface CustomSavedMediaItem {
  id: string;
  label: string;
  imageUrl: string;
  createdAt: string;
}

const CUSTOM_MEDIA_STORAGE_KEY = 'aoc_admin_custom_media_library_v1';

function loadSavedCustomMedia(): CustomSavedMediaItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_MEDIA_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCustomMediaItem(item: CustomSavedMediaItem): CustomSavedMediaItem[] {
  const existing = loadSavedCustomMedia();
  const next = [item, ...existing.filter((x) => x.imageUrl !== item.imageUrl)].slice(
    0,
    12
  );
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CUSTOM_MEDIA_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota errors
    }
  }
  return next;
}

interface ServiceAppearanceManagerProps {
  lang: Language;
  services: DigitalService[];
  categories: CategoryMeta[];
  isLiveAdmin: boolean;
  initialSelectedServiceId?: string;
  onSaveService: (updatedService: DigitalService) => Promise<void>;
  onNotify: (msg: { type: 'success' | 'error'; text: string }) => void;
}

export const ServiceAppearanceManager: React.FC<ServiceAppearanceManagerProps> = ({
  lang,
  services,
  categories,
  isLiveAdmin,
  initialSelectedServiceId,
  onSaveService,
  onNotify,
}) => {
  const [selectedServiceId, setSelectedServiceId] = React.useState<string>(
    initialSelectedServiceId || services[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');

  React.useEffect(() => {
    if (
      initialSelectedServiceId &&
      services.some((s) => s.id === initialSelectedServiceId)
    ) {
      setSelectedServiceId(initialSelectedServiceId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelectedServiceId]);

  const selectedService = React.useMemo(
    () =>
      services.find((s) => s.id === selectedServiceId) || services[0] || null,
    [services, selectedServiceId]
  );

  const savedConfig = React.useMemo(
    () =>
      selectedService
        ? getServiceAppearanceConfig(selectedService)
        : getDefaultServiceAppearanceConfig({
            id: 'srv-default',
            category: 'resume_biodata',
          }),
    [selectedService]
  );

  // Draft state for live preview before saving
  const [draftConfig, setDraftConfig] =
    React.useState<ServiceAppearanceConfig>(savedConfig);
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [customMediaList, setCustomMediaList] = React.useState<
    CustomSavedMediaItem[]
  >(() => loadSavedCustomMedia());

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync draft when switching services
  React.useEffect(() => {
    setDraftConfig(savedConfig);
    setHasUnsavedChanges(false);
    setUploadError(null);
    setUploadProgress(null);
  }, [savedConfig, selectedService?.id]);

  const updateDraft = (patch: Partial<ServiceAppearanceConfig>) => {
    setDraftConfig((prev) => ({
      ...prev,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
    setHasUnsavedChanges(true);
    setUploadError(null);
  };

  const filteredServices = React.useMemo(() => {
    return services.filter((srv) => {
      const matchesCat =
        categoryFilter === 'all' || srv.category === categoryFilter;
      if (!matchesCat) return false;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        srv.titleEn.toLowerCase().includes(q) ||
        srv.titleHi.toLowerCase().includes(q) ||
        srv.id.toLowerCase().includes(q)
      );
    });
  }, [services, categoryFilter, searchQuery]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedService) return;

    setUploadError(null);
    const validation = validateServiceImageUploadFile({
      name: file.name,
      type: file.type,
      size: file.size,
    });

    if (!validation.valid) {
      setUploadError(
        lang === 'en'
          ? validation.errorEn || 'Invalid image file.'
          : validation.errorHi || 'अमान्य इमेज फ़ाइल।'
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setUploadProgress(10);
      const result = await uploadOrOptimizeServiceImage(
        selectedService.id,
        file,
        isLiveAdmin,
        (pct) => setUploadProgress(pct)
      );

      updateDraft({
        visualMode: 'custom_upload',
        customImageUrl: result.imageUrl,
        customImageName: file.name.slice(0, 120),
      });

      const updatedMedia = saveCustomMediaItem({
        id: `custom-media-${Date.now()}`,
        label: file.name.slice(0, 48),
        imageUrl: result.imageUrl,
        createdAt: new Date().toISOString(),
      });
      setCustomMediaList(updatedMedia);
      setUploadProgress(null);
    } catch (err) {
      setUploadProgress(null);
      setUploadError(
        err instanceof Error
          ? err.message
          : lang === 'en'
          ? 'Failed to process image file. Please try another PNG, JPG, or WebP image.'
          : 'इमेज प्रोसेस करने में त्रुटि हुई। कृपया दूसरी PNG, JPG या WebP फ़ाइल चुनें।'
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    if (!selectedService) return;
    const def = getDefaultServiceAppearanceConfig(selectedService);
    setDraftConfig({
      ...draftConfig,
      visualMode: 'default_3d',
      customImageUrl: '',
      customImageName: '',
      mediaLibraryId: def.mediaLibraryId,
      imageFit: 'contain',
      imageScale: 1,
      focalPointX: 50,
      focalPointY: 50,
      updatedAt: new Date().toISOString(),
    });
    setHasUnsavedChanges(true);
    setUploadError(null);
  };

  const handleResetFraming = () => {
    updateDraft({
      imageFit: 'contain',
      imageScale: 1,
      focalPointX: 50,
      focalPointY: 50,
    });
  };

  const handleCancelUnsaved = () => {
    setDraftConfig(savedConfig);
    setHasUnsavedChanges(false);
    setUploadError(null);
  };

  const handleSaveAppearance = async () => {
    if (!selectedService) return;
    setIsSaving(true);
    setUploadError(null);

    try {
      const normalizedConfig: ServiceAppearanceConfig = {
        ...draftConfig,
        imageScale: clampImageScale(draftConfig.imageScale),
        focalPointX: clampFocalPoint(draftConfig.focalPointX),
        focalPointY: clampFocalPoint(draftConfig.focalPointY),
        updatedAt: new Date().toISOString(),
      };

      const serialized = serializeServiceAppearanceConfig(normalizedConfig);
      const updatedService: DigitalService = {
        ...selectedService,
        appearanceConfigJson: serialized,
        updatedAt: new Date().toISOString(),
      };

      await onSaveService(updatedService);
      setHasUnsavedChanges(false);
      onNotify({
        type: 'success',
        text:
          lang === 'en'
            ? `Saved 3D appearance & visual settings for "${selectedService.titleEn}". Live on customer catalog.`
            : `"${selectedService.titleHi}" के लिए 3D विज़ुअल और इमेज सेटिंग्स सहेजी गईं।`,
      });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to save service appearance.';
      setUploadError(msg);
      onNotify({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedService) {
    return null;
  }

  return (
    <div className="space-y-6" data-testid="admin-appearance-manager">
      {/* Top Header Banner */}
      <div className="bg-[#101014] text-[#F7F3EA] border border-[#272732] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.18em] text-[#FF5C35] flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#FFB547]" />
            <span>
              {lang === 'en'
                ? 'SERVICE APPEARANCE & 3D IMAGES STUDIO'
                : 'सेवा दिखावट और 3D इमेज स्टूडियो'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#F7F3EA] mt-1 font-display">
            {lang === 'en'
              ? 'Service Appearance & 3D Images'
              : 'सेवा दिखावट और 3D इमेज प्रबंधन'}
          </h2>
          <p className="text-xs sm:text-sm text-[#D8D3C8] mt-1 max-w-2xl leading-relaxed">
            {lang === 'en'
              ? 'Assign an independent custom image, 3D Media Library visual, or default 3D icon to each service. Adjust fit, scale, focal point, and per-service 3D motion with instant live preview.'
              : 'प्रत्येक सेवा के लिए अलग कस्टम इमेज, 3D मीडिया लाइब्रेरी विज़ुअल या डिफ़ॉल्ट 3D आइकन चुनें। सेव करने से पहले लाइव प्रीव्यू देखें।'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {hasUnsavedChanges && (
            <button
              type="button"
              data-testid="appearance-cancel-btn"
              onClick={handleCancelUnsaved}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-[#F7F3EA] transition-colors"
            >
              {lang === 'en' ? 'Cancel Changes' : 'बदलाव रद्द करें'}
            </button>
          )}
          <button
            type="button"
            data-testid="appearance-save-btn"
            disabled={isSaving}
            onClick={handleSaveAppearance}
            className="min-h-[42px] px-5 py-2.5 rounded-xl bg-[#FF5C35] hover:bg-[#E04823] disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-[0_6px_20px_rgba(255,92,53,0.4)] transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isSaving
                ? lang === 'en'
                  ? 'Saving...'
                  : 'सहेजा जा रहा है...'
                : lang === 'en'
                ? 'Save Appearance'
                : 'दिखावट सहेजें'}
            </span>
          </button>
        </div>
      </div>

      {/* Main 12-Column Split Studio: Left Service Selector (4 cols) + Center Controls (4 cols) + Right Live Preview (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ================================================================= */}
        {/* COLUMN 1 (4 Cols): SERVICE SELECTOR SIDEBAR                       */}
        {/* ================================================================= */}
        <div className="xl:col-span-4 bg-[#FFFDF9] border border-[#101014] rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E6DFD3] pb-3">
            <div>
              <h3 className="font-display text-sm sm:text-base font-extrabold text-[#101014]">
                {lang === 'en'
                  ? `1. Select Service (${services.length})`
                  : `1. सेवा चुनें (${services.length})`}
              </h3>
              <p className="text-[11px] text-[#787166]">
                {lang === 'en'
                  ? 'Each service stores its own independent visual'
                  : 'प्रत्येक सेवा की अपनी स्वतंत्र इमेज सेटिंग है'}
              </p>
            </div>
            <Layers className="w-4 h-4 text-[#FF5C35]" />
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-[#787166] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Search service to customize appearance"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'en'
                    ? 'Search service name or ID...'
                    : 'सेवा का नाम या आईडी खोजें...'
                }
                className="w-full min-h-[40px] pl-9 pr-3 py-1.5 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs text-[#101014] focus:border-[#FF5C35] focus:outline-none"
              />
            </div>

            <select
              aria-label="Filter services by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full min-h-[38px] px-3 py-1.5 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs font-semibold text-[#101014] focus:border-[#FF5C35] focus:outline-none"
            >
              <option value="all">
                {lang === 'en' ? 'All Categories' : 'सभी श्रेणियाँ'}
              </option>
              {categories
                .filter((c) => c.key !== 'all')
                .map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {lang === 'en' ? cat.labelEn : cat.labelHi}
                  </option>
                ))}
            </select>
          </div>

          {/* Scrollable Service List */}
          <div className="max-h-[460px] overflow-y-auto space-y-2 pr-1">
            {filteredServices.map((srv) => {
              const isSelected = srv.id === selectedService.id;
              const srvConf = getServiceAppearanceConfig(srv);
              const modeBadge =
                srvConf.visualMode === 'custom_upload'
                  ? lang === 'en'
                    ? 'Custom Image'
                    : 'कस्टम इमेज'
                  : srvConf.visualMode === 'media_library'
                  ? lang === 'en'
                    ? '3D Library'
                    : '3D लाइब्रेरी'
                  : lang === 'en'
                  ? 'Default 3D'
                  : 'डिफ़ॉल्ट 3D';

              return (
                <button
                  key={srv.id}
                  type="button"
                  data-testid={`appearance-select-service-${srv.id}`}
                  onClick={() => setSelectedServiceId(srv.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#101014] text-[#F7F3EA] border-[#FF5C35] shadow-md'
                      : 'bg-[#F7F3EA]/70 hover:bg-[#F7F3EA] text-[#101014] border-[#DCD4C6]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs sm:text-sm truncate">
                      {lang === 'en' ? srv.titleEn : srv.titleHi}
                    </div>
                    <div
                      className={`font-mono-tabular text-[10px] mt-0.5 flex items-center gap-2 ${
                        isSelected ? 'text-[#D8D3C8]' : 'text-[#787166]'
                      }`}
                    >
                      <span>₹{srv.priceInr}</span>
                      <span>·</span>
                      <span
                        className={
                          srvConf.visualMode === 'custom_upload'
                            ? 'text-[#FFB547] font-bold'
                            : ''
                        }
                      >
                        {modeBadge}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono-tabular text-[10px] font-bold shrink-0 ${
                      srvConf.enable3DAnimation
                        ? isSelected
                          ? 'bg-[#FF5C35] text-white'
                          : 'bg-emerald-100 text-emerald-900'
                        : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {srvConf.enable3DAnimation ? '3D ON' : 'STATIC'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================================================================= */}
        {/* COLUMN 2 (4 Cols): VISUAL SOURCE, FRAMING & 3D MOTION CONTROLS    */}
        {/* ================================================================= */}
        <div className="xl:col-span-4 bg-[#FFFDF9] border border-[#101014] rounded-2xl p-4 sm:p-5 space-y-5">
          <div className="border-b border-[#E6DFD3] pb-3">
            <div className="font-mono-tabular text-[10px] font-bold uppercase tracking-wider text-[#C83713]">
              {selectedService.id}
            </div>
            <h3 className="font-display text-base font-extrabold text-[#101014] mt-0.5">
              {lang === 'en'
                ? `2. Visual Source & 3D Controls`
                : `2. इमेज स्रोत और 3D नियंत्रण`}
            </h3>
          </div>

          {/* Upload Error Alert */}
          {uploadError && (
            <div
              role="alert"
              data-testid="appearance-upload-error"
              className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{uploadError}</div>
            </div>
          )}

          {/* Visual Source Mode Switcher (3 Modes) */}
          <div className="space-y-2">
            <label className="block font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#4A463E]">
              {lang === 'en' ? 'CHOOSE VISUAL SOURCE' : 'इमेज स्रोत चुनें'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  {
                    mode: 'custom_upload' as ServiceVisualMode,
                    labelEn: 'Upload Image',
                    labelHi: 'कस्टम अपलोड',
                    icon: <Upload className="w-3.5 h-3.5" />,
                  },
                  {
                    mode: 'media_library' as ServiceVisualMode,
                    labelEn: '3D Library',
                    labelHi: '3D लाइब्रेरी',
                    icon: <ImageIcon className="w-3.5 h-3.5" />,
                  },
                  {
                    mode: 'default_3d' as ServiceVisualMode,
                    labelEn: 'Default 3D',
                    labelHi: 'डिफ़ॉल्ट 3D',
                    icon: <Sparkles className="w-3.5 h-3.5" />,
                  },
                ] as const
              ).map((tab) => {
                const active = draftConfig.visualMode === tab.mode;
                return (
                  <button
                    key={tab.mode}
                    type="button"
                    data-testid={`appearance-mode-${tab.mode}`}
                    onClick={() => updateDraft({ visualMode: tab.mode })}
                    className={`min-h-[42px] px-2.5 py-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center gap-1 ${
                      active
                        ? 'bg-[#101014] text-[#FFB547] border-[#FF5C35] shadow-sm'
                        : 'bg-[#F7F3EA] text-[#101014] border-[#D4CCBE] hover:border-[#FF5C35]/50'
                    }`}
                  >
                    {tab.icon}
                    <span className="text-[11px] leading-tight text-center">
                      {lang === 'en' ? tab.labelEn : tab.labelHi}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MODE A: UPLOAD CUSTOM IMAGE */}
          {draftConfig.visualMode === 'custom_upload' && (
            <div className="p-4 rounded-xl bg-[#F7F3EA] border border-[#DCD4C6] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#101014]">
                  {lang === 'en'
                    ? 'Device Gallery / File Manager Upload'
                    : 'गैलरी या फ़ाइल मैनेजर से इमेज अपलोड करें'}
                </span>
                <span className="font-mono-tabular text-[10px] text-[#5C5852]">
                  PNG, JPG, WebP · Max 5 MB
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                data-testid="appearance-file-input"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
                className="sr-only"
                id="service-appearance-file-input"
              />

              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor="service-appearance-file-input"
                  className="cursor-pointer min-h-[42px] px-4 py-2 rounded-xl bg-[#FF5C35] hover:bg-[#E04823] text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {draftConfig.customImageUrl
                      ? lang === 'en'
                        ? 'Replace Image'
                        : 'नई इमेज बदलें'
                      : lang === 'en'
                      ? 'Choose Image File'
                      : 'इमेज फ़ाइल चुनें'}
                  </span>
                </label>

                {draftConfig.customImageUrl && (
                  <button
                    type="button"
                    data-testid="appearance-remove-image-btn"
                    onClick={handleRemoveImage}
                    className="min-h-[42px] px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'en' ? 'Remove Image' : 'इमेज हटाएं'}
                    </span>
                  </button>
                )}
              </div>

              {uploadProgress !== null && (
                <div className="space-y-1">
                  <div className="w-full h-2 bg-[#DCD4C6] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FF5C35] transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-mono-tabular text-[#5C5852]">
                    {lang === 'en'
                      ? `Optimizing & preparing visual (${uploadProgress}%)...`
                      : `इमेज ऑप्टिमाइज़ हो रही है (${uploadProgress}%)...`}
                  </p>
                </div>
              )}

              {draftConfig.customImageName && (
                <div className="text-[11px] font-mono-tabular text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg truncate">
                  ✓ {draftConfig.customImageName}
                </div>
              )}
            </div>
          )}

          {/* MODE B: 3D MEDIA LIBRARY PICKER */}
          {draftConfig.visualMode === 'media_library' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#101014]">
                  {lang === 'en'
                    ? 'Select 3D Visual from Media Library (12 Presets)'
                    : 'मीडिया लाइब्रेरी से 3D विज़ुअल चुनें'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {BUILTIN_3D_MEDIA_LIBRARY.map((preset) => {
                  const isSelected = draftConfig.mediaLibraryId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      data-testid={`media-library-item-${preset.id}`}
                      onClick={() =>
                        updateDraft({
                          visualMode: 'media_library',
                          mediaLibraryId: preset.id,
                        })
                      }
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#101014] text-[#F7F3EA] border-[#FF5C35]'
                          : 'bg-[#F7F3EA] text-[#101014] border-[#D4CCBE] hover:border-[#FF5C35]/50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {lang === 'en' ? preset.titleEn : preset.titleHi}
                        </div>
                        <div
                          className={`text-[10px] truncate mt-0.5 ${
                            isSelected ? 'text-[#FFB547]' : 'text-[#787166]'
                          }`}
                        >
                          {lang === 'en'
                            ? preset.categoryLabelEn
                            : preset.categoryLabelHi}
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#FF5C35] shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {customMediaList.length > 0 && (
                <div className="pt-2 border-t border-[#E6DFD3] space-y-2">
                  <div className="text-[11px] font-mono-tabular font-bold uppercase text-[#5C5852]">
                    {lang === 'en'
                      ? 'Recently Uploaded Custom Visuals'
                      : 'हाल ही में अपलोड की गई इमेज'}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {customMediaList.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          updateDraft({
                            visualMode: 'custom_upload',
                            customImageUrl: item.imageUrl,
                            customImageName: item.label,
                          })
                        }
                        className="p-1.5 rounded-lg bg-[#101014] border border-[#272732] hover:border-[#FF5C35] flex flex-col items-center gap-1"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.label}
                          className="w-full h-12 object-contain rounded"
                        />
                        <span className="text-[10px] text-[#F7F3EA] truncate w-full text-center">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* IMAGE POSITIONING, FIT, SCALE & FOCAL POINT */}
          <div className="p-4 rounded-xl bg-[#F7F3EA] border border-[#DCD4C6] space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#101014] flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF5C35]" />
                <span>
                  {lang === 'en'
                    ? 'Framing, Fit, Scale & Focal Point'
                    : 'फिट, ज़ूम और पोज़िशनिंग'}
                </span>
              </span>
              <button
                type="button"
                onClick={handleResetFraming}
                className="text-[11px] font-mono-tabular font-bold text-[#C83713] hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{lang === 'en' ? 'Reset' : 'रीसेट'}</span>
              </button>
            </div>

            {/* Image Fit Selector */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#4A463E]">
                {lang === 'en'
                  ? 'Image Fit (Preserves Proportions)'
                  : 'इमेज फिट (अनुपात सुरक्षित रखता है)'}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { value: 'contain' as ServiceImageFit, label: 'Contain (Full)' },
                    { value: 'cover' as ServiceImageFit, label: 'Cover (Fill)' },
                    {
                      value: 'scale-down' as ServiceImageFit,
                      label: 'Scale Down',
                    },
                  ] as const
                ).map((fitOpt) => (
                  <button
                    key={fitOpt.value}
                    type="button"
                    data-testid={`appearance-fit-${fitOpt.value}`}
                    onClick={() => updateDraft({ imageFit: fitOpt.value })}
                    className={`min-h-[34px] px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                      draftConfig.imageFit === fitOpt.value
                        ? 'bg-[#101014] text-white border-[#101014]'
                        : 'bg-white text-[#101014] border-[#D4CCBE]'
                    }`}
                  >
                    {fitOpt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scale Slider (60% to 160%) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="appearance-scale-slider"
                  className="font-semibold text-[#4A463E]"
                >
                  {lang === 'en' ? 'Visual Scale (Zoom)' : 'इमेज ज़ूम (Scale)'}
                </label>
                <span className="font-mono-tabular font-bold text-[#101014]">
                  {Math.round(draftConfig.imageScale * 100)}%
                </span>
              </div>
              <input
                id="appearance-scale-slider"
                data-testid="appearance-scale-slider"
                type="range"
                min="0.6"
                max="1.6"
                step="0.05"
                value={draftConfig.imageScale}
                onChange={(e) =>
                  updateDraft({ imageScale: Number(e.target.value) })
                }
                className="w-full accent-[#FF5C35]"
              />
            </div>

            {/* Focal Point X & Y Sliders */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <label
                    htmlFor="appearance-focal-x"
                    className="font-semibold text-[#4A463E]"
                  >
                    {lang === 'en' ? 'Focal X (Left–Right)' : 'क्षैतिज (X)'}
                  </label>
                  <span className="font-mono-tabular font-bold text-[#101014]">
                    {draftConfig.focalPointX}%
                  </span>
                </div>
                <input
                  id="appearance-focal-x"
                  data-testid="appearance-focal-x"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={draftConfig.focalPointX}
                  onChange={(e) =>
                    updateDraft({ focalPointX: Number(e.target.value) })
                  }
                  className="w-full accent-[#FF5C35]"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <label
                    htmlFor="appearance-focal-y"
                    className="font-semibold text-[#4A463E]"
                  >
                    {lang === 'en' ? 'Focal Y (Top–Bottom)' : 'लंबवत (Y)'}
                  </label>
                  <span className="font-mono-tabular font-bold text-[#101014]">
                    {draftConfig.focalPointY}%
                  </span>
                </div>
                <input
                  id="appearance-focal-y"
                  data-testid="appearance-focal-y"
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={draftConfig.focalPointY}
                  onChange={(e) =>
                    updateDraft({ focalPointY: Number(e.target.value) })
                  }
                  className="w-full accent-[#FF5C35]"
                />
              </div>
            </div>
          </div>

          {/* PER-SERVICE 3D ANIMATION & GLOW CONTROLS */}
          <div className="p-4 rounded-xl bg-[#F7F3EA] border border-[#DCD4C6] space-y-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-[#101014]">
                  {lang === 'en'
                    ? 'Enable 3D Animation for This Service'
                    : 'इस सेवा के लिए 3D एनिमेशन सक्रिय करें'}
                </div>
                <div className="text-[11px] text-[#787166]">
                  {lang === 'en'
                    ? 'Independent per-service motion toggle'
                    : 'प्रत्येक सेवा के लिए अलग 3D मोशन नियंत्रण'}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draftConfig.enable3DAnimation}
                data-testid="appearance-toggle-3d-animation"
                onClick={() =>
                  updateDraft({
                    enable3DAnimation: !draftConfig.enable3DAnimation,
                  })
                }
                className={`min-h-[36px] px-3.5 py-1.5 rounded-full font-mono-tabular text-xs font-extrabold transition-colors ${
                  draftConfig.enable3DAnimation
                    ? 'bg-[#FF5C35] text-white'
                    : 'bg-[#DCD4C6] text-[#101014]'
                }`}
              >
                {draftConfig.enable3DAnimation ? '3D ON' : 'OFF'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#4A463E] mb-1">
                  {lang === 'en' ? 'Motion Style' : 'एनिमेशन शैली'}
                </label>
                <select
                  aria-label="3D Motion Style"
                  data-testid="appearance-animation-style-select"
                  value={draftConfig.animationStyle}
                  onChange={(e) =>
                    updateDraft({
                      animationStyle: e.target.value as ServiceAnimationStyle,
                    })
                  }
                  className="w-full min-h-[36px] px-2.5 py-1 bg-white border border-[#D4CCBE] rounded-lg text-xs font-semibold text-[#101014]"
                >
                  <option value="float_tilt">Float + 3D Hover Tilt</option>
                  <option value="gentle_float">Gentle Float Only</option>
                  <option value="hover_depth">Hover Depth Only</option>
                  <option value="static">Static (No Motion)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#4A463E] mb-1">
                  {lang === 'en' ? 'Ambient Light Glow' : 'लाइट ग्लो'}
                </label>
                <select
                  aria-label="Ambient Light Glow"
                  value={draftConfig.glowIntensity}
                  onChange={(e) =>
                    updateDraft({
                      glowIntensity: e.target.value as
                        | 'subtle'
                        | 'medium'
                        | 'ember',
                    })
                  }
                  className="w-full min-h-[36px] px-2.5 py-1 bg-white border border-[#D4CCBE] rounded-lg text-xs font-semibold text-[#101014]"
                >
                  <option value="subtle">Subtle Glow</option>
                  <option value="medium">Balanced Amber</option>
                  <option value="ember">Vibrant Neon Ember</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* COLUMN 3 (4 Cols): LIVE INTERACTIVE CUSTOMER CARD PREVIEW         */}
        {/* ================================================================= */}
        <div className="xl:col-span-4 bg-[#101014] text-[#F7F3EA] border border-[#272732] rounded-2xl p-4 sm:p-5 space-y-4 xl:sticky xl:top-20">
          <div className="flex items-center justify-between border-b border-white/15 pb-3">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#FFB547]" />
              <div>
                <h3 className="font-display text-sm sm:text-base font-extrabold text-white">
                  {lang === 'en'
                    ? '3. Live Customer Card Preview'
                    : '3. ग्राहक कार्ड लाइव प्रीव्यू'}
                </h3>
                <p className="text-[11px] text-[#D8D3C8]">
                  {lang === 'en'
                    ? 'Hover or touch the 3D stage below to test depth'
                    : 'डेप्थ और एनिमेशन जांचने के लिए कार्ड पर माउस ले जाएं'}
                </p>
              </div>
            </div>
            {hasUnsavedChanges && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#FFB547]/20 border border-[#FFB547]/50 font-mono-tabular text-[10px] font-bold text-[#FFB547]">
                {lang === 'en' ? 'UNSAVED DRAFT' : 'असहेजा ड्राफ्ट'}
              </span>
            )}
          </div>

          {/* Simulated Customer Service Card */}
          <div
            data-testid="admin-live-preview-card"
            className="rounded-3xl p-5 glass-cream-panel text-[#101014] space-y-4 shadow-2xl"
          >
            <Service3DVisualStage
              service={selectedService}
              lang={lang}
              overrideConfig={draftConfig}
              variant="preview"
            />

            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono-tabular text-[10px] font-bold uppercase tracking-wider text-[#C83713]">
                  {selectedService.id.toUpperCase()}
                </div>
                <h4 className="font-display text-lg font-extrabold text-[#101014] leading-snug mt-0.5">
                  {lang === 'en'
                    ? selectedService.titleEn
                    : selectedService.titleHi}
                </h4>
              </div>
              <div className="px-3 py-1.5 rounded-2xl bg-[#101014] text-white text-right shrink-0">
                <span className="block font-mono-tabular text-[9px] uppercase text-[#FFB547]">
                  {lang === 'en' ? 'TARIFF' : 'शुल्क'}
                </span>
                <span className="font-mono-tabular text-base font-extrabold">
                  ₹{selectedService.priceInr}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#4A463E] line-clamp-2 leading-relaxed">
              {lang === 'en' ? selectedService.descEn : selectedService.descHi}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-[#DCD4C6] text-[11px] font-mono-tabular text-[#5C5852]">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#FF5C35]" />
                {lang === 'en'
                  ? selectedService.estimatedTimeEn
                  : selectedService.estimatedTimeHi}
              </span>
              <span className="font-bold text-[#C83713]">
                {draftConfig.enable3DAnimation ? '3D INTERACTIVE' : 'STATIC CARD'}
              </span>
            </div>
          </div>

          {/* Save & Reset Footer Inside Live Preview Panel */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAppearance}
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5C35] to-[#E54922] hover:from-[#FF6B47] hover:to-[#FF5C35] text-white text-xs sm:text-sm font-bold shadow-[0_8px_24px_rgba(255,92,53,0.4)] transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isSaving
                  ? lang === 'en'
                    ? 'Saving...'
                    : 'सहेजा जा रहा है...'
                  : lang === 'en'
                  ? 'Save & Publish to Website'
                  : 'सहेजें और वेबसाइट पर दिखाएं'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleRemoveImage}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-semibold text-[#D8D3C8] hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Default 3D' : 'डिफ़ॉल्ट 3D'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
