import {
  DigitalService,
  ServiceAppearanceConfig,
  ServiceAnimationStyle,
  ServiceImageFit,
  ServiceVisualMode,
} from '../types';

export interface MediaLibraryVisualItem {
  id: string;
  titleEn: string;
  titleHi: string;
  categoryLabelEn: string;
  categoryLabelHi: string;
  accentPrimary: string;
  accentSecondary: string;
  badgeTextEn: string;
  badgeTextHi: string;
  svgPresetKey:
    | 'resume_3d'
    | 'biodata_3d'
    | 'typing_3d'
    | 'pdf_3d'
    | 'scholarship_3d'
    | 'exam_form_3d'
    | 'certificate_3d'
    | 'aadhaar_3d'
    | 'pan_3d'
    | 'passport_3d'
    | 'railway_3d'
    | 'bill_pay_3d';
  customDataUrl?: string;
}

/**
 * 12 Curated 3D Illustrative Visuals in the Built-In Media Library.
 * Covers all existing services AND common cyber cafe services (Aadhaar, PAN, Passport,
 * Railway Ticket, Online Forms, Certificates, Bill Payments, Resume, Biodata, PDF, Typing, Scholarship).
 * Uses illustrative 3D iconography without misleading official government emblems.
 */
export const BUILTIN_3D_MEDIA_LIBRARY: MediaLibraryVisualItem[] = [
  {
    id: 'preset-resume-3d',
    titleEn: 'ATS Resume & CV 3D Dossier',
    titleHi: 'ATS रिज़्यूमे और बायोडाटा 3D विज़ुअल',
    categoryLabelEn: 'Career & Resume',
    categoryLabelHi: 'करियर और रिज़्यूमे',
    accentPrimary: '#FF5C35',
    accentSecondary: '#FFB547',
    badgeTextEn: 'ATS 300-DPI',
    badgeTextHi: 'ATS 300-DPI',
    svgPresetKey: 'resume_3d',
  },
  {
    id: 'preset-biodata-3d',
    titleEn: 'Marriage Biodata 3D Card',
    titleHi: 'विवाह बायोडाटा 3D कार्ड',
    categoryLabelEn: 'Matrimonial Design',
    categoryLabelHi: 'विवाह बायोडाटा',
    accentPrimary: '#FFB547',
    accentSecondary: '#FF5C35',
    badgeTextEn: 'BILINGUAL A4',
    badgeTextHi: 'द्विभाषी A4',
    svgPresetKey: 'biodata_3d',
  },
  {
    id: 'preset-aadhaar-3d',
    titleEn: 'Smart Identity & Biometric Card 3D',
    titleHi: 'स्मार्ट पहचान और बायोमेट्रिक कार्ड 3D',
    categoryLabelEn: 'Identity Services',
    categoryLabelHi: 'पहचान सेवाएं',
    accentPrimary: '#FF5C35',
    accentSecondary: '#38BDF8',
    badgeTextEn: 'E-KYC / PRINT',
    badgeTextHi: 'ई-केवाईसी / प्रिंट',
    svgPresetKey: 'aadhaar_3d',
  },
  {
    id: 'preset-pan-3d',
    titleEn: 'Tax ID & PAN Card 3D Hologram',
    titleHi: 'पैन (PAN) कार्ड 3D विज़ुअल',
    categoryLabelEn: 'PAN & Tax Card',
    categoryLabelHi: 'पैन और टैक्स कार्ड',
    accentPrimary: '#38BDF8',
    accentSecondary: '#FFB547',
    badgeTextEn: 'E-PAN / NSDL',
    badgeTextHi: 'ई-पैन / सुधार',
    svgPresetKey: 'pan_3d',
  },
  {
    id: 'preset-passport-3d',
    titleEn: 'Passport & Travel Document 3D',
    titleHi: 'पासपोर्ट और यात्रा दस्तावेज़ 3D',
    categoryLabelEn: 'Passport & Travel',
    categoryLabelHi: 'पासपोर्ट सेवा',
    accentPrimary: '#6366F1',
    accentSecondary: '#FFB547',
    badgeTextEn: 'APPOINTMENT',
    badgeTextHi: 'पासपोर्ट अपॉइंटमेंट',
    svgPresetKey: 'passport_3d',
  },
  {
    id: 'preset-railway-3d',
    titleEn: 'Railway Express & Travel Ticket 3D',
    titleHi: 'रेलवे टिकट बुकिंग 3D विज़ुअल',
    categoryLabelEn: 'Travel & Rail',
    categoryLabelHi: 'रेलवे और यात्रा',
    accentPrimary: '#FF5C35',
    accentSecondary: '#34D399',
    badgeTextEn: 'IRCTC / PNR',
    badgeTextHi: 'रेल टिकट बुकिंग',
    svgPresetKey: 'railway_3d',
  },
  {
    id: 'preset-exam-form-3d',
    titleEn: 'Online Recruitment & Exam Form 3D',
    titleHi: 'ऑनलाइन भर्ती और परीक्षा फॉर्म 3D',
    categoryLabelEn: 'Online Forms',
    categoryLabelHi: 'ऑनलाइन फॉर्म',
    accentPrimary: '#FF5C35',
    accentSecondary: '#FFB547',
    badgeTextEn: 'PORTAL FORM',
    badgeTextHi: 'ऑनलाइन आवेदन',
    svgPresetKey: 'exam_form_3d',
  },
  {
    id: 'preset-scholarship-3d',
    titleEn: 'Scholarship & College Admission 3D',
    titleHi: 'छात्रवृत्ति और कॉलेज नामांकन 3D',
    categoryLabelEn: 'Scholarship & Education',
    categoryLabelHi: 'छात्रवृत्ति सेवा',
    accentPrimary: '#818CF8',
    accentSecondary: '#38BDF8',
    badgeTextEn: 'PMS / NSP',
    badgeTextHi: 'छात्रवृत्ति पोर्टल',
    svgPresetKey: 'scholarship_3d',
  },
  {
    id: 'preset-certificate-3d',
    titleEn: 'Caste, Income & Domicile Certificate 3D',
    titleHi: 'जाति, आय और निवास प्रमाणपत्र 3D',
    categoryLabelEn: 'Citizen Certificates',
    categoryLabelHi: 'प्रमाणपत्र सेवाएं',
    accentPrimary: '#10B981',
    accentSecondary: '#FFB547',
    badgeTextEn: 'RTPS VERIFIED',
    badgeTextHi: 'आरटीपीएस प्रमाणपत्र',
    svgPresetKey: 'certificate_3d',
  },
  {
    id: 'preset-pdf-3d',
    titleEn: 'PDF Merge, Compress & Scan Studio 3D',
    titleHi: 'PDF मर्ज, कंप्रेस और स्कैन 3D',
    categoryLabelEn: 'PDF & Photo Tools',
    categoryLabelHi: 'PDF और फोटो टूल्स',
    accentPrimary: '#10B981',
    accentSecondary: '#FF5C35',
    badgeTextEn: 'DPI OPTIMIZER',
    badgeTextHi: 'PDF ऑप्टिमाइज़र',
    svgPresetKey: 'pdf_3d',
  },
  {
    id: 'preset-typing-3d',
    titleEn: 'Hindi & English Application Typing 3D',
    titleHi: 'हिन्दी और अंग्रेज़ी टाइपिंग 3D',
    categoryLabelEn: 'Letters & Typing',
    categoryLabelHi: 'पत्र और टाइपिंग',
    accentPrimary: '#06B6D4',
    accentSecondary: '#FFB547',
    badgeTextEn: 'UNICODE / A4',
    badgeTextHi: 'हिन्दी / अंग्रेज़ी',
    svgPresetKey: 'typing_3d',
  },
  {
    id: 'preset-bill-pay-3d',
    titleEn: 'Electricity, Recharge & Bill Payment 3D',
    titleHi: 'बिजली बिल और डिजिटल भुगतान 3D',
    categoryLabelEn: 'Bill Payments',
    categoryLabelHi: 'बिल भुगतान',
    accentPrimary: '#FFB547',
    accentSecondary: '#10B981',
    badgeTextEn: 'INSTANT RECEIPT',
    badgeTextHi: 'त्वरित रसीद',
    svgPresetKey: 'bill_pay_3d',
  },
];

export const ALLOWED_SERVICE_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export const MAX_SERVICE_IMAGE_RAW_BYTES = 5 * 1024 * 1024; // 5 MB raw upload limit before client-side optimization
export const MAX_STORED_APPEARANCE_JSON_LENGTH = 450000; // Safe Firestore document field boundary

/**
 * Determines the default 3D preset ID for any service based on its ID, title, or category.
 * Ensures every existing and future service has a distinct, appropriate 3D visual fallback.
 */
export function resolveDefaultPresetIdForService(
  service?: Partial<Pick<DigitalService, 'id' | 'titleEn' | 'category'>> | null
): string {
  const id = (service?.id || '').toLowerCase();
  const title = (service?.titleEn || '').toLowerCase();
  const cat = (service?.category || '').toLowerCase();

  if (id.includes('resume') || title.includes('resume') || title.includes('cv')) {
    return 'preset-resume-3d';
  }
  if (id.includes('biodata') || title.includes('biodata') || title.includes('marriage')) {
    return 'preset-biodata-3d';
  }
  if (id.includes('aadhaar') || title.includes('aadhaar') || title.includes('aadhar')) {
    return 'preset-aadhaar-3d';
  }
  if (id.includes('pan') || title.includes('pan card') || title.includes('e-pan')) {
    return 'preset-pan-3d';
  }
  if (id.includes('passport') || title.includes('passport') || title.includes('visa')) {
    return 'preset-passport-3d';
  }
  if (
    id.includes('rail') ||
    id.includes('train') ||
    id.includes('irctc') ||
    title.includes('railway') ||
    title.includes('train') ||
    title.includes('ticket')
  ) {
    return 'preset-railway-3d';
  }
  if (
    id.includes('bill') ||
    id.includes('electricity') ||
    id.includes('recharge') ||
    title.includes('bill') ||
    title.includes('electricity')
  ) {
    return 'preset-bill-pay-3d';
  }
  if (id.includes('pdf') || title.includes('pdf') || cat === 'pdf_tools') {
    return 'preset-pdf-3d';
  }
  if (
    id.includes('scholarship') ||
    title.includes('scholarship') ||
    cat === 'scholarship_admission'
  ) {
    return 'preset-scholarship-3d';
  }
  if (
    id.includes('caste') ||
    id.includes('income') ||
    id.includes('domicile') ||
    title.includes('certificate') ||
    cat === 'other_online_forms'
  ) {
    return 'preset-certificate-3d';
  }
  if (
    id.includes('typing') ||
    id.includes('application') ||
    title.includes('typing') ||
    title.includes('letter') ||
    cat === 'letters_formatting'
  ) {
    return 'preset-typing-3d';
  }
  if (
    id.includes('exam') ||
    id.includes('govt') ||
    title.includes('exam') ||
    title.includes('form') ||
    cat === 'govt_job_assistance'
  ) {
    return 'preset-exam-form-3d';
  }
  return 'preset-exam-form-3d';
}

export function getDefaultServiceAppearanceConfig(
  service?: Partial<Pick<DigitalService, 'id' | 'titleEn' | 'category'>> | null
): ServiceAppearanceConfig {
  return {
    visualMode: 'default_3d',
    customImageUrl: '',
    customImageName: '',
    mediaLibraryId: resolveDefaultPresetIdForService(service),
    imageFit: 'contain',
    imageScale: 1,
    focalPointX: 50,
    focalPointY: 50,
    enable3DAnimation: true,
    animationStyle: 'float_tilt',
    glowIntensity: 'ember',
    updatedAt: new Date(0).toISOString(),
  };
}

export function clampImageScale(val: unknown): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return 1;
  return Math.min(1.6, Math.max(0.6, Number(num.toFixed(2))));
}

export function clampFocalPoint(val: unknown): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return 50;
  return Math.min(100, Math.max(0, Math.round(num)));
}

export function isValidServiceImageUrlOrDataUrl(url: string): boolean {
  if (!url) return true;
  const trimmed = url.trim();
  if (trimmed.length > 420000) return false;
  if (trimmed.startsWith('/')) return true;
  if (trimmed.startsWith('https://')) return true;
  const safeImageRegex =
    /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\r\n]+$/i;
  return safeImageRegex.test(trimmed);
}

/**
 * Validates an uploaded service image file on the client before processing/uploading.
 */
export function validateServiceImageUploadFile(file: {
  name: string;
  type: string;
  size: number;
}): {
  valid: boolean;
  errorEn?: string;
  errorHi?: string;
} {
  if (!file || !file.name) {
    return {
      valid: false,
      errorEn: 'Please select a valid image file.',
      errorHi: 'कृपया एक मान्य इमेज फ़ाइल चुनें।',
    };
  }

  const allowedTypes: readonly string[] = ALLOWED_SERVICE_IMAGE_MIME_TYPES;
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      errorEn:
        'Unsupported image format. Please upload a PNG, JPG/JPEG, WebP, or transparent PNG file.',
      errorHi:
        'असमर्थित फ़ाइल प्रकार। कृपया केवल PNG, JPG/JPEG, या WebP इमेज अपलोड करें।',
    };
  }

  if (file.size <= 0) {
    return {
      valid: false,
      errorEn: 'The selected image file is empty (0 bytes).',
      errorHi: 'चुनी गई इमेज फ़ाइल खाली (0 bytes) है।',
    };
  }

  if (file.size > MAX_SERVICE_IMAGE_RAW_BYTES) {
    return {
      valid: false,
      errorEn: 'Image file exceeds the 5 MB maximum upload limit. Please choose a smaller image.',
      errorHi: 'इमेज फ़ाइल 5 MB की अधिकतम सीमा से बड़ी है। कृपया छोटी इमेज चुनें।',
    };
  }

  return { valid: true };
}

/**
 * Parses `service.appearanceConfigJson` safely, merging with service-specific defaults.
 */
export function getServiceAppearanceConfig(
  service: Pick<DigitalService, 'id' | 'titleEn' | 'category' | 'appearanceConfigJson'>
): ServiceAppearanceConfig {
  const fallback = getDefaultServiceAppearanceConfig(service);
  if (
    !service.appearanceConfigJson ||
    typeof service.appearanceConfigJson !== 'string' ||
    service.appearanceConfigJson.trim().length < 2
  ) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(service.appearanceConfigJson);
    if (!parsed || typeof parsed !== 'object') return fallback;

    const visualMode: ServiceVisualMode =
      parsed.visualMode === 'custom_upload' ||
      parsed.visualMode === 'media_library' ||
      parsed.visualMode === 'default_3d'
        ? parsed.visualMode
        : fallback.visualMode;

    const imageFit: ServiceImageFit =
      parsed.imageFit === 'contain' ||
      parsed.imageFit === 'cover' ||
      parsed.imageFit === 'scale-down'
        ? parsed.imageFit
        : fallback.imageFit;

    const animationStyle: ServiceAnimationStyle =
      parsed.animationStyle === 'float_tilt' ||
      parsed.animationStyle === 'gentle_float' ||
      parsed.animationStyle === 'hover_depth' ||
      parsed.animationStyle === 'static'
        ? parsed.animationStyle
        : fallback.animationStyle;

    const glowIntensity: 'subtle' | 'medium' | 'ember' =
      parsed.glowIntensity === 'subtle' ||
      parsed.glowIntensity === 'medium' ||
      parsed.glowIntensity === 'ember'
        ? parsed.glowIntensity
        : fallback.glowIntensity;

    const customImageUrl =
      typeof parsed.customImageUrl === 'string' &&
      isValidServiceImageUrlOrDataUrl(parsed.customImageUrl)
        ? parsed.customImageUrl.trim()
        : '';

    const mediaLibraryId =
      typeof parsed.mediaLibraryId === 'string' && parsed.mediaLibraryId.trim()
        ? parsed.mediaLibraryId.trim()
        : fallback.mediaLibraryId;

    const customImageName =
      typeof parsed.customImageName === 'string'
        ? parsed.customImageName.trim().slice(0, 120)
        : '';

    return {
      visualMode:
        visualMode === 'custom_upload' && !customImageUrl
          ? 'default_3d'
          : visualMode,
      customImageUrl,
      customImageName,
      mediaLibraryId,
      imageFit,
      imageScale: clampImageScale(parsed.imageScale),
      focalPointX: clampFocalPoint(parsed.focalPointX),
      focalPointY: clampFocalPoint(parsed.focalPointY),
      enable3DAnimation:
        typeof parsed.enable3DAnimation === 'boolean'
          ? parsed.enable3DAnimation
          : true,
      animationStyle,
      glowIntensity,
      updatedAt:
        typeof parsed.updatedAt === 'string' && parsed.updatedAt
          ? parsed.updatedAt
          : fallback.updatedAt,
    };
  } catch {
    return fallback;
  }
}

export function serializeServiceAppearanceConfig(
  config: ServiceAppearanceConfig
): string {
  const normalized: ServiceAppearanceConfig = {
    visualMode:
      config.visualMode === 'custom_upload' && !config.customImageUrl
        ? 'default_3d'
        : config.visualMode,
    customImageUrl: (config.customImageUrl || '').trim(),
    customImageName: (config.customImageName || '').trim().slice(0, 120),
    mediaLibraryId: (config.mediaLibraryId || 'preset-resume-3d').trim(),
    imageFit: config.imageFit || 'contain',
    imageScale: clampImageScale(config.imageScale),
    focalPointX: clampFocalPoint(config.focalPointX),
    focalPointY: clampFocalPoint(config.focalPointY),
    enable3DAnimation: Boolean(config.enable3DAnimation),
    animationStyle: config.animationStyle || 'float_tilt',
    glowIntensity: config.glowIntensity || 'ember',
    updatedAt: config.updatedAt || new Date().toISOString(),
  };
  return JSON.stringify(normalized);
}

/**
 * Pure helper that updates only the target service's appearance config in a service catalog array,
 * guaranteeing that changing one service's image NEVER alters another service's image.
 */
export function applyAppearanceToSingleService(
  services: DigitalService[],
  targetServiceId: string,
  newConfig: ServiceAppearanceConfig
): DigitalService[] {
  const serialized = serializeServiceAppearanceConfig(newConfig);
  const nowIso = newConfig.updatedAt || new Date().toISOString();
  return services.map((srv) => {
    if (srv.id !== targetServiceId) {
      return srv;
    }
    return {
      ...srv,
      appearanceConfigJson: serialized,
      updatedAt: nowIso,
    };
  });
}
