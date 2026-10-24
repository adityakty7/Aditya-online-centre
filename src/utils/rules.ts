export const ORDER_WORKFLOW_STEPS = [
  'Submitted',
  'Under Review',
  'Awaiting Payment',
  'Payment Verification',
  'In Progress',
  'Needs Customer Information',
  'Completed',
  'Delivered',
] as const;

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const MAX_FILE_SIZE_BYTES = 524288; // 512 KB limit for Firestore-backed private document chunks

export const VALID_ID_PATTERN = /^[a-zA-Z0-9_\-]+$/;

const SAFE_DATA_URL_PATTERN =
  /^data:(application\/pdf|image\/jpeg|image\/png|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document);base64,[A-Za-z0-9+/=\r\n]+$/;

export function sanitizeString(input: string, maxLength: number): string {
  return String(input ?? '').trim().slice(0, maxLength);
}

export function isValidEntityId(id: string): boolean {
  return typeof id === 'string' && id.length >= 1 && id.length <= 128 && VALID_ID_PATTERN.test(id);
}

export function isSafeDataUrl(dataUrl: string): boolean {
  if (typeof dataUrl !== 'string' || dataUrl.length < 20 || dataUrl.length > 700000) {
    return false;
  }
  return SAFE_DATA_URL_PATTERN.test(dataUrl);
}

export function generateOrderNumber(now: Date = new Date(), randomSuffix?: string): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const suffix =
    randomSuffix ||
    Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '7');
  return `AOC-${year}${month}${day}-${suffix}`;
}

export interface OrderFormValidationInput {
  customerName: string;
  customerPhone: string;
  customerLocation: string;
  requiredCustomFields: Array<{ id: string; label: string; required: boolean }>;
  customFieldValues: Record<string, string>;
}

export interface ValidationResult {
  valid: boolean;
  errorEn?: string;
  errorHi?: string;
}

export function validateCustomerOrderInput(input: OrderFormValidationInput): ValidationResult {
  const name = sanitizeString(input.customerName, 100);
  if (name.length < 2) {
    return {
      valid: false,
      errorEn: 'Please enter your full name (at least 2 characters).',
      errorHi: 'कृपया अपना पूरा नाम दर्ज करें (कम से कम 2 अक्षर)।',
    };
  }

  const digitsOnly = String(input.customerPhone ?? '').replace(/\D/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 13) {
    return {
      valid: false,
      errorEn: 'Please enter a valid 10-digit mobile number.',
      errorHi: 'कृपया एक मान्य 10-अंकीय मोबाइल नंबर दर्ज करें।',
    };
  }

  const location = sanitizeString(input.customerLocation, 120);
  if (location.length < 2) {
    return {
      valid: false,
      errorEn: 'Please enter your village, ward, or town (e.g., Kateya, Gopalganj).',
      errorHi: 'कृपया अपना गाँव, वार्ड या शहर दर्ज करें (जैसे कटेया, गोपालगंज)।',
    };
  }

  for (const field of input.requiredCustomFields) {
    if (field.required) {
      const val = sanitizeString(input.customFieldValues[field.id] || '', 500);
      if (!val) {
        return {
          valid: false,
          errorEn: `Please fill out the required field: ${field.label}`,
          errorHi: `कृपया आवश्यक जानकारी भरें: ${field.label}`,
        };
      }
    }
  }

  return { valid: true };
}

export function validateUploadedFile(file: {
  name: string;
  type: string;
  size: number;
}): ValidationResult {
  if (!file || !file.name || file.name.trim().length === 0) {
    return {
      valid: false,
      errorEn: 'File name is missing.',
      errorHi: 'फ़ाइल का नाम अनुपस्थित है।',
    };
  }
  if (file.name.length > 150) {
    return {
      valid: false,
      errorEn: 'File name is too long (maximum 150 characters).',
      errorHi: 'फ़ाइल का नाम बहुत लंबा है (अधिकतम 150 अक्षर)।',
    };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return {
      valid: false,
      errorEn: 'Unsupported file format. Only PDF, JPG, PNG, and DOCX files are allowed.',
      errorHi: 'अमान्य फ़ाइल प्रारूप। केवल PDF, JPG, PNG और DOCX फ़ाइलों की अनुमति है।',
    };
  }
  if (file.size <= 0 || file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      errorEn: 'File size must be between 1 byte and 500 KB for secure private storage.',
      errorHi: 'सुरक्षित स्टोरेज के लिए फ़ाइल का आकार 500 KB से कम होना चाहिए।',
    };
  }
  return { valid: true };
}

export function validateUpiUtr(utr: string): ValidationResult {
  const cleaned = sanitizeString(utr, 60);
  if (cleaned.length < 6 || cleaned.length > 36) {
    return {
      valid: false,
      errorEn: 'Please enter a valid UPI Transaction ID / UTR reference (6 to 36 characters).',
      errorHi: 'कृपया एक मान्य UPI ट्रांजेक्शन आईडी / UTR नंबर दर्ज करें (6 से 36 अक्षर)।',
    };
  }
  if (!/^[a-zA-Z0-9_\-]+$/.test(cleaned)) {
    return {
      valid: false,
      errorEn: 'UPI reference must contain only letters, numbers, hyphens, or underscores.',
      errorHi: 'UPI रेफरेंस में केवल अक्षर और संख्याएं होनी चाहिए।',
    };
  }
  return { valid: true };
}

export function isDuplicateSubmission(
  lastSignature: string | null,
  lastTimestampMs: number | null,
  currentSignature: string,
  nowMs: number,
  windowMs: number = 60000
): boolean {
  if (!lastSignature || lastTimestampMs === null) {
    return false;
  }
  return lastSignature === currentSignature && nowMs - lastTimestampMs < windowMs;
}

export function canCustomerCancelOrder(status: string): boolean {
  return (
    status === 'Submitted' ||
    status === 'Under Review' ||
    status === 'Awaiting Payment'
  );
}

export function canCustomerSubmitUtr(status: string, paymentStatus: string): boolean {
  if (paymentStatus === 'Verified') return false;
  return (
    status === 'Submitted' ||
    status === 'Under Review' ||
    status === 'Awaiting Payment' ||
    status === 'Payment Verification'
  );
}

export function isTerminalOrderStatus(status: string): boolean {
  return status === 'Delivered' || status === 'Cancelled';
}

export interface OrderMetricsSummary {
  total: number;
  pendingAction: number;
  activeInProgress: number;
  completedDelivered: number;
  verifiedRevenueInr: number;
  pendingVerificationCount: number;
}

export function calculateOrderMetrics(
  orders: Array<{ status: string; paymentStatus: string; priceInr: number }>
): OrderMetricsSummary {
  let total = 0;
  let pendingAction = 0;
  let activeInProgress = 0;
  let completedDelivered = 0;
  let verifiedRevenueInr = 0;
  let pendingVerificationCount = 0;

  for (const order of orders) {
    total += 1;
    if (
      order.status === 'Submitted' ||
      order.status === 'Under Review' ||
      order.status === 'Awaiting Payment' ||
      order.status === 'Payment Verification'
    ) {
      pendingAction += 1;
    } else if (
      order.status === 'In Progress' ||
      order.status === 'Needs Customer Information'
    ) {
      activeInProgress += 1;
    } else if (order.status === 'Completed' || order.status === 'Delivered') {
      completedDelivered += 1;
    }

    if (order.paymentStatus === 'Verified' && order.status !== 'Cancelled') {
      verifiedRevenueInr += Number(order.priceInr) || 0;
    }
    if (order.paymentStatus === 'Pending Verification') {
      pendingVerificationCount += 1;
    }
  }

  return {
    total,
    pendingAction,
    activeInProgress,
    completedDelivered,
    verifiedRevenueInr,
    pendingVerificationCount,
  };
}

export interface ContactMessageValidationInput {
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  orderId?: string;
  preferredLanguage: 'en' | 'hi';
}

export function generateContactMessageId(now: Date = new Date(), randomSuffix?: string): string {
  const ts = now.getTime();
  const suffix =
    randomSuffix ||
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '9');
  return `MSG-${ts}-${suffix}`;
}

export function validateContactMessageInput(
  input: ContactMessageValidationInput
): ValidationResult {
  const name = sanitizeString(input.name, 100);
  if (name.length < 2) {
    return {
      valid: false,
      errorEn: 'Please enter your full name (2 to 100 characters).',
      errorHi: 'कृपया अपना पूरा नाम दर्ज करें (2 से 100 अक्षर)।',
    };
  }

  const rawPhone = sanitizeString(input.phone, 20);
  const digitsOnly = rawPhone.replace(/\D/g, '');
  if (rawPhone.length < 10 || rawPhone.length > 20 || digitsOnly.length < 10 || digitsOnly.length > 13) {
    return {
      valid: false,
      errorEn: 'Please enter a valid 10-digit mobile or WhatsApp number.',
      errorHi: 'कृपया एक मान्य 10-अंकीय मोबाइल या व्हाट्सएप नंबर दर्ज करें।',
    };
  }

  const email = sanitizeString(input.email || '', 150);
  if (email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      valid: false,
      errorEn: 'Please enter a valid email address or leave the optional email field blank.',
      errorHi: 'कृपया एक मान्य ईमेल पता दर्ज करें या वैकल्पिक ईमेल फ़ील्ड खाली छोड़ दें।',
    };
  }

  const subject = sanitizeString(input.subject, 150);
  if (subject.length < 3) {
    return {
      valid: false,
      errorEn: 'Please enter a subject (at least 3 characters).',
      errorHi: 'कृपया संदेश का विषय दर्ज करें (कम से कम 3 अक्षर)।',
    };
  }

  const message = sanitizeString(input.message, 1500);
  if (message.length < 5) {
    return {
      valid: false,
      errorEn: 'Please enter your message (at least 5 characters).',
      errorHi: 'कृपया अपना संदेश विस्तार से लिखें (कम से कम 5 अक्षर)।',
    };
  }

  const orderId = sanitizeString(input.orderId || '', 40);
  if (orderId.length > 0 && !VALID_ID_PATTERN.test(orderId)) {
    return {
      valid: false,
      errorEn: 'Order ID may only contain letters, numbers, hyphens, or underscores (e.g., AOC-20261018-D101).',
      errorHi: 'ऑर्डर आईडी में केवल अक्षर, संख्याएं या हाइफ़न हो सकते हैं (जैसे AOC-20261018-D101)।',
    };
  }

  if (input.preferredLanguage !== 'en' && input.preferredLanguage !== 'hi') {
    return {
      valid: false,
      errorEn: 'Please select a valid preferred language (English or Hindi).',
      errorHi: 'कृपया अपनी पसंदीदा भाषा चुनें (अंग्रेजी या हिंदी)।',
    };
  }

  return { valid: true };
}

export const VALID_SERVICE_CATEGORIES = [
  'resume_biodata',
  'letters_formatting',
  'pdf_tools',
  'govt_job_assistance',
  'scholarship_admission',
  'other_online_forms',
] as const;

export function isValidCategoryKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  return (
    trimmed.length >= 2 &&
    trimmed.length <= 64 &&
    /^[a-zA-Z0-9_\-]+$/.test(trimmed)
  );
}

export function generateCategoryKey(
  labelEn: string,
  existingKeys: string[] = []
): string {
  const baseSlug = String(labelEn ?? '')
    .toLowerCase()
    .replace(/^cat-+/, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  const root = baseSlug || 'custom_category';
  const existingSet = new Set(existingKeys);
  if (!existingSet.has(root)) {
    return root;
  }
  let counter = 2;
  while (existingSet.has(`${root}_${counter}`)) {
    counter += 1;
  }
  return `${root}_${counter}`;
}

export interface CategoryValidationInput {
  key: string;
  labelEn: string;
  labelHi: string;
  summaryEn: string;
  summaryHi: string;
}

export function validateCategoryInput(
  input: CategoryValidationInput,
  existingKeys: string[] = [],
  isEdit = false
): ValidationResult {
  const key = sanitizeString(input.key, 64);
  if (!isValidCategoryKey(key)) {
    return {
      valid: false,
      errorEn:
        'Category Key (Slug) must be 2 to 64 characters using letters, numbers, hyphens, or underscores.',
      errorHi:
        'श्रेणी कुंजी (Slug) में केवल 2 से 64 अक्षर, संख्याएं, हाइफ़न या अंडरस्कोर होने चाहिए।',
    };
  }
  if (!isEdit && existingKeys.includes(key)) {
    return {
      valid: false,
      errorEn: `Category key "${key}" already exists. Please choose a different key.`,
      errorHi: `श्रेणी कुंजी "${key}" पहले से मौजूद है। कृपया कोई अन्य कुंजी चुनें।`,
    };
  }
  const labelEn = sanitizeString(input.labelEn, 100);
  if (labelEn.length < 2) {
    return {
      valid: false,
      errorEn: 'Please enter a Category Name in English (at least 2 characters).',
      errorHi: 'कृपया अंग्रेजी में श्रेणी का नाम दर्ज करें (कम से कम 2 अक्षर)।',
    };
  }
  const labelHi = sanitizeString(input.labelHi, 100);
  if (labelHi.length < 2) {
    return {
      valid: false,
      errorEn: 'Please enter a Category Name in Hindi (at least 2 characters).',
      errorHi: 'कृपया हिंदी में श्रेणी का नाम दर्ज करें (कम से कम 2 अक्षर)।',
    };
  }
  const summaryEn = sanitizeString(input.summaryEn, 300);
  if (summaryEn.length < 3) {
    return {
      valid: false,
      errorEn: 'Please enter a short English summary for this category.',
      errorHi: 'कृपया इस श्रेणी के लिए एक संक्षिप्त अंग्रेजी विवरण दर्ज करें।',
    };
  }
  const summaryHi = sanitizeString(input.summaryHi, 300);
  if (summaryHi.length < 3) {
    return {
      valid: false,
      errorEn: 'Please enter a short Hindi summary for this category.',
      errorHi: 'कृपया इस श्रेणी के लिए एक संक्षिप्त हिंदी विवरण दर्ज करें।',
    };
  }
  return { valid: true };
}

export interface ServiceMetricsSummary {
  totalServices: number;
  activeServices: number;
  inactiveServices: number;
  featuredServices: number;
  categoryCounts: Record<string, number>;
}

export function calculateServiceMetrics(
  services: Array<{
    category: string;
    isActive: boolean;
    featured: boolean;
  }>
): ServiceMetricsSummary {
  let totalServices = 0;
  let activeServices = 0;
  let inactiveServices = 0;
  let featuredServices = 0;
  const categoryCounts: Record<string, number> = {};

  for (const srv of services) {
    totalServices += 1;
    if (srv.isActive) {
      activeServices += 1;
    } else {
      inactiveServices += 1;
    }
    if (srv.featured) {
      featuredServices += 1;
    }
    categoryCounts[srv.category] = (categoryCounts[srv.category] || 0) + 1;
  }

  return {
    totalServices,
    activeServices,
    inactiveServices,
    featuredServices,
    categoryCounts,
  };
}

export function generateServiceId(
  titleEn: string,
  existingIds: string[] = []
): string {
  const baseSlug = String(titleEn ?? '')
    .toLowerCase()
    .replace(/^srv-+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const root = `srv-${baseSlug || 'custom-service'}`;
  const existingSet = new Set(existingIds);
  if (!existingSet.has(root)) {
    return root;
  }
  let counter = 2;
  while (existingSet.has(`${root}-${counter}`)) {
    counter += 1;
  }
  return `${root}-${counter}`;
}

export interface DigitalServiceValidationInput {
  id: string;
  category: string;
  titleEn: string;
  titleHi: string;
  descEn: string;
  descHi: string;
  priceInr: number;
  minPriceInr?: number;
  maxPriceInr?: number;
  instructionsEn?: string;
  instructionsHi?: string;
  estimatedTimeEn: string;
  estimatedTimeHi: string;
  requiredDocs: string;
  documentRequirementsJson?: string;
  customFieldsJson: string;
}

export function validateDigitalServiceInput(
  input: DigitalServiceValidationInput
): ValidationResult {
  if (!isValidEntityId(input.id)) {
    return {
      valid: false,
      errorEn:
        'Service ID must be 1 to 128 characters using letters, numbers, hyphens, or underscores.',
      errorHi:
        'सेवा आईडी (Service ID) में केवल अक्षर, संख्याएं या हाइफ़न होने चाहिए।',
    };
  }

  if (!isValidCategoryKey(input.category)) {
    return {
      valid: false,
      errorEn: 'Please select a valid service category.',
      errorHi: 'कृपया एक मान्य सेवा श्रेणी चुनें।',
    };
  }

  const titleEn = sanitizeString(input.titleEn, 120);
  if (titleEn.length < 2) {
    return {
      valid: false,
      errorEn: 'Please enter the service name in English (at least 2 characters).',
      errorHi: 'कृपया अंग्रेजी में सेवा का नाम दर्ज करें (कम से कम 2 अक्षर)।',
    };
  }

  const titleHi = sanitizeString(input.titleHi, 120);
  if (titleHi.length < 2) {
    return {
      valid: false,
      errorEn: 'Please enter the service name in Hindi (at least 2 characters).',
      errorHi: 'कृपया हिंदी में सेवा का नाम दर्ज करें (कम से कम 2 अक्षर)।',
    };
  }

  const descEn = sanitizeString(input.descEn, 600);
  if (descEn.length < 5) {
    return {
      valid: false,
      errorEn: 'Please enter a short description in English (5 to 600 characters).',
      errorHi: 'कृपया अंग्रेजी में संक्षिप्त विवरण दर्ज करें (5 से 600 अक्षर)।',
    };
  }

  const descHi = sanitizeString(input.descHi, 600);
  if (descHi.length < 5) {
    return {
      valid: false,
      errorEn: 'Please enter a short description in Hindi (5 to 600 characters).',
      errorHi: 'कृपया हिंदी में संक्षिप्त विवरण दर्ज करें (5 से 600 अक्षर)।',
    };
  }

  const price = Number(input.priceInr);
  if (!Number.isFinite(price) || price < 0 || price > 100000) {
    return {
      valid: false,
      errorEn: 'Base price must be between ₹0 and ₹1,00,000.',
      errorHi: 'मूल्य ₹0 और ₹1,00,000 के बीच होना चाहिए।',
    };
  }

  if (input.minPriceInr !== undefined) {
    const minP = Number(input.minPriceInr);
    if (!Number.isFinite(minP) || minP < 0 || minP > 100000) {
      return {
        valid: false,
        errorEn: 'Minimum price must be between ₹0 and ₹1,00,000.',
        errorHi: 'न्यूनतम मूल्य ₹0 और ₹1,00,000 के बीच होना चाहिए।',
      };
    }
  }

  if (input.maxPriceInr !== undefined) {
    const maxP = Number(input.maxPriceInr);
    if (!Number.isFinite(maxP) || maxP < 0 || maxP > 100000) {
      return {
        valid: false,
        errorEn: 'Maximum price must be between ₹0 and ₹1,00,000.',
        errorHi: 'अधिकतम मूल्य ₹0 और ₹1,00,000 के बीच होना चाहिए।',
      };
    }
  }

  if (
    input.minPriceInr !== undefined &&
    input.maxPriceInr !== undefined &&
    input.maxPriceInr > 0 &&
    input.minPriceInr > input.maxPriceInr
  ) {
    return {
      valid: false,
      errorEn: 'Maximum price cannot be less than minimum price.',
      errorHi: 'अधिकतम मूल्य न्यूनतम मूल्य से कम नहीं हो सकता।',
    };
  }

  const etaEn = sanitizeString(input.estimatedTimeEn, 80);
  if (etaEn.length < 1) {
    return {
      valid: false,
      errorEn: 'Please provide the estimated completion time.',
      errorHi: 'कृपया अनुमानित समय दर्ज करें।',
    };
  }

  const reqDocs = sanitizeString(input.requiredDocs, 500);
  if (reqDocs.length < 2) {
    return {
      valid: false,
      errorEn: 'Please specify the required documents for this service.',
      errorHi: 'कृपया इस सेवा के लिए आवश्यक दस्तावेज़ दर्ज करें।',
    };
  }

  const customJson = String(input.customFieldsJson || '[]').trim();
  if (customJson.length > 1500) {
    return {
      valid: false,
      errorEn: 'Custom order form fields configuration exceeds the 1,500 character limit.',
      errorHi: 'कस्टम फॉर्म फ़ील्ड की सीमा (1,500 अक्षर) पार हो गई है।',
    };
  }

  try {
    const parsed = JSON.parse(customJson);
    if (!Array.isArray(parsed)) {
      return {
        valid: false,
        errorEn: 'Custom order form fields must be a valid list.',
        errorHi: 'कस्टम फॉर्म फ़ील्ड एक मान्य सूची होनी चाहिए।',
      };
    }
  } catch {
    return {
      valid: false,
      errorEn: 'Custom order form fields JSON is invalid.',
      errorHi: 'कस्टम फॉर्म फ़ील्ड डेटा अमान्य है।',
    };
  }

  return { valid: true };
}

export function createDuplicateService<
  T extends {
    id: string;
    titleEn: string;
    titleHi: string;
    isActive?: boolean;
    featured?: boolean;
    updatedAt: string;
  }
>(source: T, existingIds: string[], nowIso: string = new Date().toISOString()): T {
  const newId = generateServiceId(`${source.id}-copy`, existingIds);
  const copyTitleEn = sanitizeString(`${source.titleEn} (Copy)`, 120);
  const copyTitleHi = sanitizeString(`${source.titleHi} (प्रतिलिपि)`, 120);
  return {
    ...source,
    id: newId,
    titleEn: copyTitleEn,
    titleHi: copyTitleHi,
    isActive: false,
    featured: false,
    updatedAt: nowIso,
  };
}

export type ServiceSortField =
  | 'name'
  | 'category'
  | 'price'
  | 'status'
  | 'updatedAt';

export type ServiceStatusFilter = 'all' | 'active' | 'inactive' | 'featured';

export function filterAndSortServices<
  T extends {
    id: string;
    category: string;
    titleEn: string;
    titleHi: string;
    descEn: string;
    descHi: string;
    requiredDocs: string;
    priceInr: number;
    isActive: boolean;
    featured: boolean;
    updatedAt: string;
  }
>(
  services: T[],
  options: {
    searchQuery?: string;
    category?: string;
    statusFilter?: ServiceStatusFilter;
    sortBy?: ServiceSortField;
    sortDir?: 'asc' | 'desc';
  }
): T[] {
  const q = String(options.searchQuery || '')
    .trim()
    .toLowerCase();
  const cat = options.category || 'all';
  const statusFilter = options.statusFilter || 'all';
  const sortBy = options.sortBy || 'updatedAt';
  const sortDir = options.sortDir || 'desc';

  const filtered = services.filter((s) => {
    if (cat !== 'all' && s.category !== cat) return false;
    if (statusFilter === 'active' && !s.isActive) return false;
    if (statusFilter === 'inactive' && s.isActive) return false;
    if (statusFilter === 'featured' && !s.featured) return false;
    if (!q) return true;
    return (
      s.id.toLowerCase().includes(q) ||
      s.titleEn.toLowerCase().includes(q) ||
      s.titleHi.toLowerCase().includes(q) ||
      s.descEn.toLowerCase().includes(q) ||
      s.descHi.toLowerCase().includes(q) ||
      s.requiredDocs.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  });

  const factor = sortDir === 'asc' ? 1 : -1;
  return [...filtered].sort((a, b) => {
    if (sortBy === 'name') {
      return a.titleEn.localeCompare(b.titleEn) * factor;
    }
    if (sortBy === 'category') {
      const cmp = a.category.localeCompare(b.category);
      return (cmp !== 0 ? cmp : a.titleEn.localeCompare(b.titleEn)) * factor;
    }
    if (sortBy === 'price') {
      const cmp = (Number(a.priceInr) || 0) - (Number(b.priceInr) || 0);
      return (cmp !== 0 ? cmp : a.titleEn.localeCompare(b.titleEn)) * factor;
    }
    if (sortBy === 'status') {
      const cmp = Number(a.isActive) - Number(b.isActive);
      return (cmp !== 0 ? cmp : a.titleEn.localeCompare(b.titleEn)) * factor;
    }
    // default: updatedAt
    const cmp = String(a.updatedAt || '').localeCompare(String(b.updatedAt || ''));
    return (cmp !== 0 ? cmp : a.titleEn.localeCompare(b.titleEn)) * factor;
  });
}

export interface CustomerRecordSummary {
  customerId: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  verifiedSpentInr: number;
  lastOrderDate: string;
}

export function deriveCustomerSummaries(
  orders: Array<{
    customerId: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerLocation: string;
    status: string;
    paymentStatus: string;
    priceInr: number;
    createdAt: string;
  }>
): CustomerRecordSummary[] {
  const map = new Map<string, CustomerRecordSummary>();

  for (const ord of orders) {
    const key = `${ord.customerPhone || ord.customerId}`;
    const existing = map.get(key);
    const isCompleted =
      ord.status === 'Completed' || ord.status === 'Delivered';
    const isActive =
      ord.status !== 'Completed' &&
      ord.status !== 'Delivered' &&
      ord.status !== 'Cancelled';
    const verifiedAmt =
      ord.paymentStatus === 'Verified' && ord.status !== 'Cancelled'
        ? Number(ord.priceInr) || 0
        : 0;

    if (!existing) {
      map.set(key, {
        customerId: ord.customerId,
        name: ord.customerName,
        phone: ord.customerPhone,
        email: ord.customerEmail,
        location: ord.customerLocation,
        totalOrders: 1,
        activeOrders: isActive ? 1 : 0,
        completedOrders: isCompleted ? 1 : 0,
        verifiedSpentInr: verifiedAmt,
        lastOrderDate: ord.createdAt,
      });
    } else {
      existing.totalOrders += 1;
      if (isActive) existing.activeOrders += 1;
      if (isCompleted) existing.completedOrders += 1;
      existing.verifiedSpentInr += verifiedAmt;
      if (ord.createdAt > existing.lastOrderDate) {
        existing.lastOrderDate = ord.createdAt;
        existing.name = ord.customerName || existing.name;
        existing.location = ord.customerLocation || existing.location;
        existing.email = ord.customerEmail || existing.email;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    b.lastOrderDate.localeCompare(a.lastOrderDate)
  );
}

export type AllowedDocFormat = 'pdf' | 'jpg' | 'png' | 'docx';

export interface StructuredDocRequirement {
  docId: string;
  labelEn: string;
  labelHi: string;
  required: boolean;
  allowedFormats: AllowedDocFormat[];
  maxSizeKb: number;
  instructionsEn: string;
  instructionsHi: string;
  allowMultiple: boolean;
}

export interface LibraryDocTemplate {
  id: string;
  labelEn: string;
  labelHi: string;
  defaultFormats: AllowedDocFormat[];
  defaultMaxSizeKb: number;
  defaultInstructionsEn: string;
  defaultInstructionsHi: string;
  allowMultiple: boolean;
}

const FORMAT_TO_MIME: Record<AllowedDocFormat, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  png: 'image/png',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const MIME_TO_FORMAT: Record<string, AllowedDocFormat> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

export function getAcceptAttributeForFormats(formats: AllowedDocFormat[]): string {
  const validFormats: AllowedDocFormat[] =
    Array.isArray(formats) && formats.length > 0 ? formats : ['pdf', 'jpg', 'png'];
  const acceptParts: string[] = [];
  for (const fmt of validFormats) {
    if (fmt === 'pdf') acceptParts.push('.pdf', 'application/pdf');
    if (fmt === 'jpg') acceptParts.push('.jpg', '.jpeg', 'image/jpeg');
    if (fmt === 'png') acceptParts.push('.png', 'image/png');
    if (fmt === 'docx') {
      acceptParts.push(
        '.docx',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      );
    }
  }
  return acceptParts.join(',');
}

export function generateDocumentTypeId(labelEn: string): string {
  const slug = String(labelEn ?? '')
    .toLowerCase()
    .replace(/^doc-+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return `doc-${slug || 'custom-document'}`;
}

export function canAddDocumentLibraryItem(
  existingItems: Array<{ id: string; labelEn: string }>,
  labelEn: string
): { valid: boolean; slugId: string; errorEn?: string; errorHi?: string } {
  const cleaned = sanitizeString(labelEn, 120);
  if (cleaned.length < 2) {
    return {
      valid: false,
      slugId: '',
      errorEn: 'Please enter a document name (at least 2 characters).',
      errorHi: 'कृपया दस्तावेज़ का नाम दर्ज करें (कम से कम 2 अक्षर)।',
    };
  }
  const slugId = generateDocumentTypeId(cleaned);
  const normalizedLabel = cleaned.toLowerCase();
  const duplicate = existingItems.some(
    (item) =>
      item.id.toLowerCase() === slugId.toLowerCase() ||
      item.labelEn.trim().toLowerCase() === normalizedLabel
  );
  if (duplicate) {
    return {
      valid: false,
      slugId,
      errorEn: `"${cleaned}" already exists in the document library.`,
      errorHi: `"${cleaned}" दस्तावेज़ लाइब्रेरी में पहले से मौजूद है।`,
    };
  }
  return { valid: true, slugId };
}

export function cleanDocumentLabel(rawLabel: string): string {
  let str = String(rawLabel ?? '').trim();
  if (!str) return '';
  if (str.includes('||')) {
    str = str.split('||')[0].trim();
  }
  const suffixPattern =
    /\s*\((?:optional|required|mandatory|opt|req|वैकल्पिक|अनिवार्य|आवश्यक)\)\s*$/i;
  while (suffixPattern.test(str)) {
    str = str.replace(suffixPattern, '').trim();
  }
  return sanitizeString(str, 120);
}

export function parseServiceDocumentRequirements(
  documentRequirementsJson?: string,
  requiredDocsEn: string[] = [],
  requiredDocsHi: string[] = [],
  libraryItems: Array<{
    id: string;
    labelEn: string;
    labelHi: string;
    acceptedFormats?: AllowedDocFormat[];
    defaultFormats?: AllowedDocFormat[];
    maxSizeKb?: number;
    defaultMaxSizeKb?: number;
    defaultInstructionsEn?: string;
    defaultInstructionsHi?: string;
    allowMultiple?: boolean;
  }> = []
): StructuredDocRequirement[] {
  if (documentRequirementsJson && documentRequirementsJson.trim().length > 2) {
    try {
      const parsed = JSON.parse(documentRequirementsJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const result: StructuredDocRequirement[] = [];
        const seen = new Set<string>();
        for (const item of parsed) {
          if (!item || typeof item !== 'object') continue;
          const cleanedEn = cleanDocumentLabel(item.labelEn || item.docId || 'Document');
          const cleanedHi = cleanDocumentLabel(
            item.labelHi || item.labelEn || item.docId || 'दस्तावेज़'
          );
          const docId = sanitizeString(
            item.docId || generateDocumentTypeId(cleanedEn || 'doc'),
            128
          );
          if (!docId || seen.has(docId)) continue;
          seen.add(docId);
          const rawFormats = Array.isArray(item.allowedFormats)
            ? item.allowedFormats
            : Array.isArray(item.acceptedFormats)
            ? item.acceptedFormats
            : [];
          const allowedFormats = rawFormats.filter(
            (f: string): f is AllowedDocFormat =>
              f === 'pdf' || f === 'jpg' || f === 'png' || f === 'docx'
          );
          const maxSizeKb = Math.min(
            500,
            Math.max(50, Number(item.maxSizeKb) || 500)
          );
          result.push({
            docId,
            labelEn: cleanedEn || docId,
            labelHi: cleanedHi || cleanedEn || docId,
            required: item.required !== false,
            allowedFormats:
              allowedFormats.length > 0 ? allowedFormats : ['pdf', 'jpg', 'png'],
            maxSizeKb,
            instructionsEn: sanitizeString(item.instructionsEn || '', 300),
            instructionsHi: sanitizeString(item.instructionsHi || '', 300),
            allowMultiple: Boolean(item.allowMultiple),
          });
        }
        if (result.length > 0) {
          return result;
        }
      }
    } catch {
      // Fallback to legacy string arrays below
    }
  }

  // Normalize legacy requiredDocs arrays if a pipe separator '||' was embedded
  let normalizedEnList = [...requiredDocsEn];
  let normalizedHiList = [...requiredDocsHi];
  const joinedEn = normalizedEnList.join(', ');
  if (joinedEn.includes('||')) {
    const [enPart, hiPart] = joinedEn.split('||');
    normalizedEnList = (enPart || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (normalizedHiList.length === 0 && hiPart) {
      normalizedHiList = hiPart
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  // Fallback for legacy services without documentRequirementsJson
  const fallbackResult: StructuredDocRequirement[] = [];
  const seenIds = new Set<string>();
  for (let i = 0; i < normalizedEnList.length; i++) {
    const rawEn = sanitizeString(normalizedEnList[i] || '', 120);
    if (!rawEn) continue;
    const rawHi = sanitizeString(normalizedHiList[i] || rawEn, 120);
    const hasLegacyOptionalSuffix =
      /\(\s*(?:optional|opt|वैकल्पिक)\s*\)\s*$/i.test(rawEn) ||
      /\(\s*(?:optional|opt|वैकल्पिक)\s*\)\s*$/i.test(rawHi);
    const cleanedEn = cleanDocumentLabel(rawEn);
    const cleanedHi = cleanDocumentLabel(rawHi);
    if (!cleanedEn) continue;

    const cleanForMatch = cleanedEn
      .replace(/\(.*?\)/g, '')
      .trim()
      .toLowerCase();

    const matchedLib = libraryItems.find((lib) => {
      const libLower = lib.labelEn.toLowerCase();
      return (
        libLower === cleanForMatch ||
        cleanForMatch.includes(libLower) ||
        libLower.includes(cleanForMatch)
      );
    });

    const docId = matchedLib ? matchedLib.id : generateDocumentTypeId(cleanedEn);
    const uniqueDocId = seenIds.has(docId) ? `${docId}-${i + 1}` : docId;
    seenIds.add(uniqueDocId);

    const libFormats = Array.isArray(matchedLib?.defaultFormats)
      ? matchedLib.defaultFormats
      : Array.isArray(
          (matchedLib as unknown as { acceptedFormats?: AllowedDocFormat[] })
            ?.acceptedFormats
        )
      ? (matchedLib as unknown as { acceptedFormats?: AllowedDocFormat[] })
          .acceptedFormats!
      : (['pdf', 'jpg', 'png'] as AllowedDocFormat[]);

    const libMaxSize =
      typeof matchedLib?.defaultMaxSizeKb === 'number'
        ? matchedLib.defaultMaxSizeKb
        : typeof (matchedLib as unknown as { maxSizeKb?: number })?.maxSizeKb ===
          'number'
        ? (matchedLib as unknown as { maxSizeKb?: number }).maxSizeKb!
        : 500;

    fallbackResult.push({
      docId: uniqueDocId,
      labelEn: matchedLib ? cleanDocumentLabel(matchedLib.labelEn) : cleanedEn,
      labelHi: matchedLib ? cleanDocumentLabel(matchedLib.labelHi) : cleanedHi,
      required: !hasLegacyOptionalSuffix,
      allowedFormats: [...libFormats],
      maxSizeKb: libMaxSize,
      instructionsEn:
        matchedLib?.defaultInstructionsEn || 'Upload a clear, readable copy.',
      instructionsHi:
        matchedLib?.defaultInstructionsHi || 'स्पष्ट और पठनीय प्रति अपलोड करें।',
      allowMultiple: Boolean(matchedLib?.allowMultiple),
    });
  }

  return fallbackResult;
}

export function getServiceDocumentRequirements(
  service: {
    documentRequirementsJson?: string;
    requiredDocs?: string;
    requiredDocsEn?: string[];
    requiredDocsHi?: string[];
  },
  libraryItems: Array<{
    id: string;
    labelEn: string;
    labelHi: string;
    acceptedFormats?: AllowedDocFormat[];
    defaultFormats?: AllowedDocFormat[];
    maxSizeKb?: number;
    defaultMaxSizeKb?: number;
    defaultInstructionsEn?: string;
    defaultInstructionsHi?: string;
    allowMultiple?: boolean;
  }> = []
): StructuredDocRequirement[] {
  const rawPipe = String(service.requiredDocs || '');
  let fallbackEn = service.requiredDocsEn || [];
  let fallbackHi = service.requiredDocsHi || [];
  if (fallbackEn.length === 0 && rawPipe) {
    const [enPart, hiPart] = rawPipe.split('||');
    fallbackEn = (enPart || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (fallbackHi.length === 0 && hiPart) {
      fallbackHi = hiPart
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }
  return parseServiceDocumentRequirements(
    service.documentRequirementsJson,
    fallbackEn,
    fallbackHi,
    libraryItems
  );
}

export function syncLegacyRequiredDocsFromRequirements(
  reqs: Array<{ labelEn: string; labelHi: string; required: boolean }>
): {
  requiredDocsEn: string[];
  requiredDocsHi: string[];
  requiredDocsPipe: string;
} {
  if (!Array.isArray(reqs) || reqs.length === 0) {
    return {
      requiredDocsEn: ['Supporting Document'],
      requiredDocsHi: ['सहायक दस्तावेज़'],
      requiredDocsPipe: 'Supporting Document||सहायक दस्तावेज़',
    };
  }
  const requiredDocsEn = reqs.map((r) => {
    const baseEn = cleanDocumentLabel(r.labelEn) || 'Document';
    return r.required ? baseEn : `${baseEn} (Optional)`;
  });
  const requiredDocsHi = reqs.map((r) => {
    const baseHi = cleanDocumentLabel(r.labelHi || r.labelEn) || 'दस्तावेज़';
    return r.required ? baseHi : `${baseHi} (वैकल्पिक)`;
  });
  const enStr = requiredDocsEn.join(', ').slice(0, 240);
  const hiStr = requiredDocsHi.join(', ').slice(0, 240);
  return {
    requiredDocsEn,
    requiredDocsHi,
    requiredDocsPipe: `${enStr}||${hiStr}`,
  };
}

export function serializeServiceDocumentRequirements(
  reqs: StructuredDocRequirement[]
): string {
  if (!Array.isArray(reqs)) return '[]';
  const clean = reqs.map((r) => {
    const cleanedEn = cleanDocumentLabel(r.labelEn);
    const cleanedHi = cleanDocumentLabel(r.labelHi || r.labelEn);
    return {
      docId: String(r.docId || '').trim(),
      labelEn: cleanedEn,
      labelHi: cleanedHi || cleanedEn,
      required: Boolean(r.required),
      allowedFormats: Array.isArray(r.allowedFormats)
        ? r.allowedFormats
        : (['pdf', 'jpg', 'png'] as AllowedDocFormat[]),
      maxSizeKb: Math.min(500, Math.max(50, Number(r.maxSizeKb) || 500)),
      instructionsEn: String(r.instructionsEn || '').trim(),
      instructionsHi: String(r.instructionsHi || '').trim(),
      allowMultiple: Boolean(r.allowMultiple),
    };
  });
  return JSON.stringify(clean);
}

export function reorderDocumentRequirements<T>(
  items: T[],
  index: number,
  direction: 'up' | 'down'
): T[] {
  if (!Array.isArray(items) || index < 0 || index >= items.length) {
    return [...(items || [])];
  }
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return [...items];
  }
  const next = [...items];
  const temp = next[index];
  next[index] = next[targetIndex];
  next[targetIndex] = temp;
  return next;
}

export function validateFileForDocumentRequirement(
  file: { name: string; type: string; size: number },
  req: {
    labelEn: string;
    labelHi: string;
    allowedFormats: AllowedDocFormat[];
    maxSizeKb: number;
  }
): ValidationResult {
  const baseValidation = validateUploadedFile(file);
  if (!baseValidation.valid) {
    return baseValidation;
  }

  const detectedFormat = MIME_TO_FORMAT[file.type];
  const allowed =
    Array.isArray(req.allowedFormats) && req.allowedFormats.length > 0
      ? req.allowedFormats
      : (['pdf', 'jpg', 'png'] as AllowedDocFormat[]);

  if (!detectedFormat || !allowed.includes(detectedFormat)) {
    const upperFormats = allowed.map((f) => f.toUpperCase()).join(', ');
    return {
      valid: false,
      errorEn: `${req.labelEn}: Only ${upperFormats} format is allowed for this document.`,
      errorHi: `${req.labelHi}: इस दस्तावेज़ के लिए केवल ${upperFormats} फ़ाइल प्रारूप मान्य है।`,
    };
  }

  const maxBytes = Math.min(MAX_FILE_SIZE_BYTES, Math.max(10, req.maxSizeKb || 500) * 1024);
  if (file.size > maxBytes) {
    const maxKbDisplay = Math.round(maxBytes / 1024);
    return {
      valid: false,
      errorEn: `${req.labelEn}: File size (${Math.round(file.size / 1024)} KB) exceeds the ${maxKbDisplay} KB limit.`,
      errorHi: `${req.labelHi}: फ़ाइल का आकार (${Math.round(file.size / 1024)} KB) अधिकतम सीमा ${maxKbDisplay} KB से अधिक है।`,
    };
  }

  return { valid: true };
}

export interface ChecklistCompletenessResult {
  valid: boolean;
  missingDocsEn: string[];
  missingDocsHi: string[];
  uploadedRequiredCount: number;
  totalRequiredCount: number;
  totalUploadedFiles: number;
  errorEn?: string;
  errorHi?: string;
}

export function validateServiceDocumentChecklistUploads(
  requirements: Array<{
    docId: string;
    labelEn: string;
    labelHi: string;
    required: boolean;
  }>,
  uploadedByDocId: Record<string, unknown[]>
): ChecklistCompletenessResult {
  const missingDocsEn: string[] = [];
  const missingDocsHi: string[] = [];
  let totalRequiredCount = 0;
  let uploadedRequiredCount = 0;
  let totalUploadedFiles = 0;

  for (const files of Object.values(uploadedByDocId || {})) {
    if (Array.isArray(files)) {
      totalUploadedFiles += files.length;
    }
  }

  for (const req of requirements) {
    const filesForDoc = uploadedByDocId?.[req.docId];
    const hasFile = Array.isArray(filesForDoc) && filesForDoc.length > 0;
    if (req.required) {
      totalRequiredCount += 1;
      if (hasFile) {
        uploadedRequiredCount += 1;
      } else {
        missingDocsEn.push(req.labelEn);
        missingDocsHi.push(req.labelHi || req.labelEn);
      }
    }
  }

  if (missingDocsEn.length > 0) {
    return {
      valid: false,
      missingDocsEn,
      missingDocsHi,
      uploadedRequiredCount,
      totalRequiredCount,
      totalUploadedFiles,
      errorEn: `Please upload required documents before submitting: ${missingDocsEn.join(', ')}`,
      errorHi: `कृपया सबमिट करने से पहले आवश्यक दस्तावेज़ अपलोड करें: ${missingDocsHi.join(', ')}`,
    };
  }

  return {
    valid: true,
    missingDocsEn: [],
    missingDocsHi: [],
    uploadedRequiredCount,
    totalRequiredCount,
    totalUploadedFiles,
  };
}

export { FORMAT_TO_MIME, MIME_TO_FORMAT };

export type SupportedVisualTheme = 'obsidian' | 'royal';

export function resolveVisualTheme(raw: unknown): SupportedVisualTheme {
  if (raw === 'royal') return 'royal';
  return 'obsidian';
}

export function toggleVisualTheme(current: SupportedVisualTheme): SupportedVisualTheme {
  return current === 'obsidian' ? 'royal' : 'obsidian';
}

export const BEFORE_AFTER_SHOWCASE_TABS = [
  {
    key: 'resume' as const,
    serviceId: 'srv-modern-resume',
    labelEn: 'Job Resume (ATS-Ready)',
    labelHi: 'जॉब रिज़्यूमे (ATS-रेडी)',
    badgeEn: 'TAB 01 · CAREER & GULF / PRIVATE JOBS',
    badgeHi: 'टैब 01 · प्राइवेट जॉब और प्लेसमेंट सीवी',
    beforeTitleEn: 'Raw Customer Input (Handwritten / Phone Notes)',
    beforeTitleHi: 'ग्राहक द्वारा भेजा गया साधारण कागज़ / नोट्स',
    afterTitleEn: 'Aditya Online Center Studio Output (ATS PDF)',
    afterTitleHi: 'आदित्य ऑनलाइन सेंटर द्वारा तैयार प्रोफेशनल PDF',
  },
  {
    key: 'biodata' as const,
    serviceId: 'srv-marriage-biodata',
    labelEn: 'Marriage Biodata',
    labelHi: 'शादी बायोडाटा (विवाह विवरण)',
    badgeEn: 'TAB 02 · TRADITIONAL & MODERN MATRIMONIAL PDF',
    badgeHi: 'टैब 02 · पारंपरिक और आधुनिक विवाह बायोडाटा',
    beforeTitleEn: 'Raw Family Details on Plain Paper Photo',
    beforeTitleHi: 'सादे कागज़ पर लिखा पारिवारिक विवरण',
    afterTitleEn: 'Framed High-Resolution Matrimonial Biodata PDF',
    afterTitleHi: 'सुंदर बॉर्डर और सुस्पष्ट फ़ॉन्ट में तैयार बायोडाटा PDF',
  },
] as const;

export const MOBILE_DOCK_SHORTCUTS = [
  {
    id: 'home' as const,
    labelEn: 'Home',
    labelHi: 'होम',
    targetView: 'home' as const,
  },
  {
    id: 'services' as const,
    labelEn: 'Services',
    labelHi: 'सेवाएं',
    targetView: 'services' as const,
  },
  {
    id: 'track-order' as const,
    labelEn: 'Track Order',
    labelHi: 'ट्रैक',
    targetView: 'track-order' as const,
  },
  {
    id: 'account' as const,
    labelEn: 'Account',
    labelHi: 'खाता',
    targetView: 'dashboard' as const,
  },
  {
    id: 'whatsapp' as const,
    labelEn: 'WhatsApp',
    labelHi: 'व्हाट्सएप',
    targetView: null,
  },
] as const;

export interface BundleEstimateResult {
  serviceCount: number;
  totalFeeInr: number;
  uniqueRequiredDocsEn: string[];
  uniqueRequiredDocsHi: string[];
  estimatedTurnaroundEn: string;
  estimatedTurnaroundHi: string;
}

export function calculateBundleEstimate(
  selectedIds: string[],
  services: Array<{
    id: string;
    priceInr: number;
    documentRequirementsJson?: string;
    requiredDocs?: string;
    requiredDocsEn?: string[];
    requiredDocsHi?: string[];
  }>
): BundleEstimateResult {
  const idSet = new Set(selectedIds || []);
  const chosen = (services || []).filter((s) => idSet.has(s.id));
  if (chosen.length === 0) {
    return {
      serviceCount: 0,
      totalFeeInr: 0,
      uniqueRequiredDocsEn: [],
      uniqueRequiredDocsHi: [],
      estimatedTurnaroundEn: 'Select 1 or more services',
      estimatedTurnaroundHi: 'कोई भी 1 या अधिक सेवा चुनें',
    };
  }

  let totalFeeInr = 0;
  const seenDocIds = new Set<string>();
  const uniqueRequiredDocsEn: string[] = [];
  const uniqueRequiredDocsHi: string[] = [];

  for (const srv of chosen) {
    totalFeeInr += Math.max(0, Number(srv.priceInr) || 0);
    const reqs = getServiceDocumentRequirements(srv);
    for (const r of reqs) {
      if (!r.required) continue;
      const key = r.docId.toLowerCase();
      if (!seenDocIds.has(key)) {
        seenDocIds.add(key);
        uniqueRequiredDocsEn.push(cleanDocumentLabel(r.labelEn));
        uniqueRequiredDocsHi.push(cleanDocumentLabel(r.labelHi || r.labelEn));
      }
    }
  }

  const estimatedTurnaroundEn =
    chosen.length === 1
      ? 'Same Day (1 to 4 Hours)'
      : chosen.length <= 3
      ? 'Same Day (2 to 6 Hours)'
      : 'Within 24 Hours';
  const estimatedTurnaroundHi =
    chosen.length === 1
      ? 'उसी दिन (1 से 4 घंटे)'
      : chosen.length <= 3
      ? 'उसी दिन (2 से 6 घंटे)'
      : '24 घंटे के भीतर';

  return {
    serviceCount: chosen.length,
    totalFeeInr,
    uniqueRequiredDocsEn,
    uniqueRequiredDocsHi,
    estimatedTurnaroundEn,
    estimatedTurnaroundHi,
  };
}

export const HERO_CINEMATIC_MEDIA = {
  webmSrc: '/hero-ember-loop.webm',
  mp4Src: '/hero-ember-loop.mp4',
  posterSrc: '/hero-ember-poster.svg',
} as const;

export function clampComparisonSlider(value: unknown, fallback = 62): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(95, Math.max(5, Math.round(num)));
}

export function buildServiceWhatsAppUrl(
  serviceTitle: string,
  whatsappNumber = '6206800799'
): string {
  const cleanTitle = sanitizeString(serviceTitle || 'Digital Service', 140);
  const digits = String(whatsappNumber || '6206800799').replace(/\D/g, '');
  const fullNumber = digits.startsWith('91') && digits.length === 12 ? digits : `91${digits}`;
  const text = `Hello Aditya, I want to apply for ${cleanTitle}`;
  return `https://wa.me/${fullNumber}?text=${encodeURIComponent(text)}`;
}

export interface CustomerTestimonialItem {
  id: string;
  nameEn: string;
  nameHi: string;
  locationEn: string;
  locationHi: string;
  serviceTagEn: string;
  serviceTagHi: string;
  rating: number;
  quoteEn: string;
  quoteHi: string;
}

export const CUSTOMER_TESTIMONIALS: CustomerTestimonialItem[] = [
  {
    id: 'rev-fast-form-filling',
    nameEn: 'Ankit Kumar Verma',
    nameHi: 'अंकित कुमार वर्मा',
    locationEn: 'Ward No. 08, Near G.A. High School, Kateya',
    locationHi: 'वार्ड नं. 08, जी.ए. हाई स्कूल के पास, कटेया',
    serviceTagEn: 'Fast Scholarship & Exam Form Filling',
    serviceTagHi: 'तेज़ छात्रवृत्ति और परीक्षा फॉर्म सहायता',
    rating: 5,
    quoteEn:
      'I sent my Bihar Post-Matric Scholarship and BSSC exam documents from home on WhatsApp. Every marksheet and certificate was resized accurately and my form receipt PDF was delivered within 3 hours without standing in any queue.',
    quoteHi:
      'मैंने घर बैठे बिहार पोस्ट-मैट्रिक छात्रवृत्ति और BSSC फॉर्म के दस्तावेज़ अपलोड किए। बिना किसी कतार में लगे 3 घंटे के भीतर सही साइज में दस्तावेज़ अपलोड होकर फाइनल रसीद PDF मिल गई।',
  },
  {
    id: 'rev-biodata-typing',
    nameEn: 'Priya Kumari',
    nameHi: 'प्रिया कुमारी',
    locationEn: 'Kateya Bazar, Nagar Panchayat, Gopalganj',
    locationHi: 'कटेया बाज़ार, नगर पंचायत, गोपालगंज',
    serviceTagEn: 'Accurate Biodata & ATS Resume Typing',
    serviceTagHi: 'सटीक विवाह बायोडाटा और जॉब रिज़्यूमे टाइपिंग',
    rating: 5,
    quoteEn:
      'Aditya Online Center prepared both my English ATS job resume and a traditional Hindi marriage biodata for my brother with zero spelling mistakes. The print-ready PDF layout looked clean and professional.',
    quoteHi:
      'आदित्य ऑनलाइन सेंटर ने मेरा अंग्रेजी जॉब रिज़्यूमे और भाई के लिए हिंदी विवाह बायोडाटा बिना किसी वर्तनी (spelling) त्रुटि के बेहद सुंदर बॉर्डर और साफ प्रिंट-रेडी PDF में तैयार किया।',
  },
  {
    id: 'rev-instant-resizing',
    nameEn: 'Rakesh Tiwari',
    nameHi: 'राकेश तिवारी',
    locationEn: 'Bathua Bazar, Kateya Block, Gopalganj',
    locationHi: 'बथुआ बाज़ार, प्रखंड कटेया, गोपालगंज',
    serviceTagEn: 'Instant PDF Merge & KB Photo Resizing',
    serviceTagHi: 'तुरंत PDF मर्ज और फोटो/हस्ताक्षर KB रीसाइज',
    rating: 5,
    quoteEn:
      'My portal rejected my phone photos for being over 200 KB. Within 45 minutes of placing the ₹40 order, I received a merged marksheet PDF under 150 KB plus my photo and signature with exact pixel dimensions.',
    quoteHi:
      'पोर्टल पर फोटो और मार्कशीट का साइज बड़ा होने के कारण अपलोड नहीं हो रहा था। मात्र ₹40 में 45 मिनट के अंदर मुझे 150 KB से कम की साफ PDF और सही माप में फोटो-सिग्नेचर मिल गए।',
  },
];

// ============================================================================
// UPGRADE 1: LIVE BIHAR EXAM, SCHOLARSHIP & JOB FORM RADAR (SECTION 01.B)
// ============================================================================

export type ExamRadarCategoryKey =
  | 'all'
  | 'scholarship'
  | 'recruitment'
  | 'board_admission'
  | 'rtps_certificate'
  | 'job_exam';

export interface ExamRadarItemConfig {
  id: string;
  category: Exclude<ExamRadarCategoryKey, 'all'>;
  portalBadgeEn: string;
  portalBadgeHi: string;
  titleEn: string;
  titleHi: string;
  startDate: string; // YYYY-MM-DD
  lastDate: string; // YYYY-MM-DD
  requiredDocsEn: string[];
  requiredDocsHi: string[];
  feeInr: number;
  linkedServiceId: string;
  isRolling?: boolean;
  isHot?: boolean;
  authorityEn?: string;
  authorityHi?: string;
  matchedServiceId?: string;
  badgeEn?: string;
  badgeHi?: string;
  isActive?: boolean;
}

export const EXAM_RADAR_CATEGORY_PILLS: Array<{
  key: ExamRadarCategoryKey;
  labelEn: string;
  labelHi: string;
}> = [
  { key: 'all', labelEn: 'All Active Portals', labelHi: 'सभी सक्रिय पोर्टल' },
  {
    key: 'scholarship',
    labelEn: 'Bihar Scholarships',
    labelHi: 'बिहार छात्रवृत्ति',
  },
  {
    key: 'recruitment',
    labelEn: 'BPSC / SSC / Police Jobs',
    labelHi: 'BPSC / SSC / पुलिस भर्ती',
  },
  {
    key: 'board_admission',
    labelEn: 'Bihar Board & Admissions',
    labelHi: 'बिहार बोर्ड और नामांकन',
  },
  {
    key: 'rtps_certificate',
    labelEn: 'RTPS & Citizen Docs',
    labelHi: 'RTPS और प्रमाणपत्र',
  },
];

export const INITIAL_EXAM_RADAR_ITEMS: ExamRadarItemConfig[] = [
  {
    id: 'radar-pms-bihar-2026',
    category: 'scholarship',
    portalBadgeEn: 'PMS ONLINE · BIHAR GOVT',
    portalBadgeHi: 'PMS ऑनलाइन · बिहार सरकार',
    titleEn: 'Bihar Post-Matric Scholarship (BC / EBC / SC / ST) 2026–27',
    titleHi: 'बिहार पोस्ट-मैट्रिक छात्रवृत्ति (BC / EBC / SC / ST) 2026–27',
    startDate: '2026-10-01',
    lastDate: '2026-11-25',
    requiredDocsEn: [
      'Bonafide Certificate',
      'Fee Structure Receipt',
      'RTPS Caste, Income & Residence',
      '10th/12th Marksheet & Aadhaar',
    ],
    requiredDocsHi: [
      'बोनाफाइड प्रमाणपत्र',
      'फीस रसीद',
      'जाति, आय और निवास (RTPS)',
      'मार्कशीट और आधार कार्ड',
    ],
    feeInr: 100,
    linkedServiceId: 'srv-bihar-scholarship',
    isHot: true,
  },
  {
    id: 'radar-bihar-police-ssc-2026',
    category: 'recruitment',
    portalBadgeEn: 'CSBC / BSSC / SSC PORTAL',
    portalBadgeHi: 'CSBC / BSSC / SSC भर्ती पोर्टल',
    titleEn: 'Bihar Police Constable, BSSC Inter Level & SSC GD Recruitment',
    titleHi: 'बिहार पुलिस कांस्टेबल, BSSC इंटर स्तरीय एवं SSC GD भर्ती फॉर्म',
    startDate: '2026-10-10',
    lastDate: '2026-11-18',
    requiredDocsEn: [
      '10th & 12th Marksheet',
      'Live / Dated Passport Photo',
      'Hindi & English Signature',
      'Category / NCL / EWS Certificate',
    ],
    requiredDocsHi: [
      '10वीं और 12वीं मार्कशीट',
      'तारीख वाला पासपोर्ट फोटो',
      'हिंदी और अंग्रेजी हस्ताक्षर',
      'जाति / NCL / EWS प्रमाणपत्र',
    ],
    feeInr: 100,
    linkedServiceId: 'srv-govt-job-form',
    isHot: true,
  },
  {
    id: 'radar-bseb-11th-12th-exam',
    category: 'board_admission',
    portalBadgeEn: 'OFSS / BSEB PATNA',
    portalBadgeHi: 'OFSS / बिहार विद्यालय परीक्षा समिति',
    titleEn: 'Bihar Board (BSEB) 11th/12th Admission & Annual Exam Form',
    titleHi: 'बिहार बोर्ड (BSEB) 11वीं/12वीं नामांकन एवं परीक्षा फॉर्म',
    startDate: '2026-10-05',
    lastDate: '2026-11-12',
    requiredDocsEn: [
      'Matric / Previous Marksheet',
      'School Leaving Certificate (SLC)',
      'Passport Photo (35x45mm)',
      'Aadhaar & Bank Passbook',
    ],
    requiredDocsHi: [
      'मैट्रिक मार्कशीट',
      'स्कूल परित्याग प्रमाणपत्र (SLC)',
      'पासपोर्ट साइज फोटो',
      'आधार और बैंक पासबुक',
    ],
    feeInr: 100,
    linkedServiceId: 'srv-bihar-scholarship',
  },
  {
    id: 'radar-rtps-caste-income-domicile',
    category: 'rtps_certificate',
    portalBadgeEn: 'SERVICE PLUS BIHAR (RTPS)',
    portalBadgeHi: 'सर्विस प्लस बिहार (RTPS)',
    titleEn: 'RTPS Caste, Income, Residence (Domicile) & NCL Application',
    titleHi: 'RTPS जाति, आय, आवासीय (निवास) एवं NCL प्रमाणपत्र आवेदन',
    startDate: '2026-01-01',
    lastDate: '2026-12-31',
    requiredDocsEn: [
      'Aadhaar Card',
      'Self-Declaration Form (स्व-घोषणा)',
      'Land Revenue Receipt / Father ID',
      'Passport Photo',
    ],
    requiredDocsHi: [
      'आधार कार्ड',
      'स्व-घोषणा पत्र',
      'लगान रसीद / पिता का प्रमाण',
      'पासपोर्ट फोटो',
    ],
    feeInr: 60,
    linkedServiceId: 'srv-citizen-form',
    isRolling: true,
  },
];

export interface ExamCountdownResult {
  daysLeft: number;
  status: 'open_rolling' | 'closing_soon' | 'active' | 'expired';
  badgeEn: string;
  badgeHi: string;
}

export function calculateExamDaysLeft(
  lastDateIso: string,
  nowDate: Date = new Date('2026-10-23T12:00:00Z'),
  isRolling = false
): ExamCountdownResult {
  if (isRolling) {
    return {
      daysLeft: 365,
      status: 'open_rolling',
      badgeEn: 'OPEN YEAR-ROUND',
      badgeHi: 'वर्षभर चालू (24×7)',
    };
  }
  const target = new Date(`${lastDateIso}T23:59:59Z`);
  if (Number.isNaN(target.getTime())) {
    return {
      daysLeft: 15,
      status: 'active',
      badgeEn: '15 DAYS LEFT',
      badgeHi: '15 दिन शेष',
    };
  }
  const diffMs = target.getTime() - nowDate.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) {
    return {
      daysLeft: 0,
      status: 'expired',
      badgeEn: 'DATE EXTENDED / CHECK DESK',
      badgeHi: 'तिथि विस्तारित / केंद्र से पूछें',
    };
  }
  if (daysLeft <= 7) {
    return {
      daysLeft,
      status: 'closing_soon',
      badgeEn: `${daysLeft} DAYS LEFT · URGENT`,
      badgeHi: `${daysLeft} दिन शेष · शीघ्र करें`,
    };
  }
  return {
    daysLeft,
    status: 'active',
    badgeEn: `${daysLeft} DAYS LEFT`,
    badgeHi: `${daysLeft} दिन शेष`,
  };
}

export function filterExamRadarItems(
  items: ExamRadarItemConfig[],
  category: ExamRadarCategoryKey
): ExamRadarItemConfig[] {
  if (!Array.isArray(items)) return [];
  if (category === 'all') return items;
  return items.filter((item) => item.category === category);
}

// ============================================================================
// UPGRADE 2: SELF-SERVICE STUDENT UTILITY LAB (SECTION 01.F)
// ============================================================================

export interface ExamPhotoPreset {
  id: string;
  labelEn: string;
  labelHi: string;
  widthPx: number;
  heightPx: number;
  targetMinKb: number;
  targetMaxKb: number;
  defaultQuality: number;
  notesEn: string;
  notesHi: string;
}

export const EXAM_PHOTO_PRESETS: ExamPhotoPreset[] = [
  {
    id: 'ssc-photo',
    labelEn: 'SSC / Railway Photo (200×230 px · 20–50 KB)',
    labelHi: 'SSC / रेलवे पासपोर्ट फोटो (200×230 px · 20–50 KB)',
    widthPx: 200,
    heightPx: 230,
    targetMinKb: 20,
    targetMaxKb: 50,
    defaultQuality: 0.86,
    notesEn: '3.5cm × 4.5cm standard colour photo, optional Name & Date slate',
    notesHi: '3.5cm × 4.5cm रंगीन फोटो, नीचे नाम और फोटो की तारीख विकल्प के साथ',
  },
  {
    id: 'bpsc-photo',
    labelEn: 'BPSC / Bihar Police Photo (250×300 px · 25–50 KB)',
    labelHi: 'BPSC / बिहार पुलिस फोटो (250×300 px · 25–50 KB)',
    widthPx: 250,
    heightPx: 300,
    targetMinKb: 25,
    targetMaxKb: 50,
    defaultQuality: 0.85,
    notesEn: 'Light background, clear both ears visible for Bihar portals',
    notesHi: 'हल्का बैकग्राउंड, बिहार भर्ती पोर्टल के लिए स्पष्ट पासपोर्ट माप',
  },
  {
    id: 'bihar-board',
    labelEn: 'Bihar Board / Scholarship Photo (210×270 px · 20–60 KB)',
    labelHi: 'बिहार बोर्ड / छात्रवृत्ति फोटो (210×270 px · 20–60 KB)',
    widthPx: 210,
    heightPx: 270,
    targetMinKb: 20,
    targetMaxKb: 60,
    defaultQuality: 0.85,
    notesEn: 'Compatible with OFSS, PMS Online, and NSP Scholarship',
    notesHi: 'OFSS, बिहार पोस्ट-मैट्रिक और NSP छात्रवृत्ति के लिए उपयुक्त',
  },
  {
    id: 'pan-photo',
    labelEn: 'PAN Card NSDL / UTI Photo (213×213 px · 20–40 KB)',
    labelHi: 'पैन कार्ड (NSDL / UTI) फोटो (213×213 px · 20–40 KB)',
    widthPx: 213,
    heightPx: 213,
    targetMinKb: 20,
    targetMaxKb: 40,
    defaultQuality: 0.84,
    notesEn: '213×213 square 300 DPI specification for PAN portals',
    notesHi: 'पैन कार्ड पोर्टल के लिए 213×213 वर्गाकार माप',
  },
  {
    id: 'exam-signature',
    labelEn: 'Official Exam Signature Strip (140×60 px · 10–20 KB)',
    labelHi: 'आधिकारिक परीक्षा हस्ताक्षर (140×60 px · 10–20 KB)',
    widthPx: 140,
    heightPx: 60,
    targetMinKb: 10,
    targetMaxKb: 20,
    defaultQuality: 0.82,
    notesEn: 'Horizontal signature box for SSC, BPSC, CSBC & Bank exams',
    notesHi: 'SSC, BPSC और बैंक फॉर्म के लिए हस्ताक्षर बॉक्स साइज',
  },
  {
    id: 'custom',
    labelEn: 'Custom Dimensions & KB Target',
    labelHi: 'कस्टम चौड़ाई, ऊंचाई और KB साइज',
    widthPx: 240,
    heightPx: 300,
    targetMinKb: 15,
    targetMaxKb: 100,
    defaultQuality: 0.85,
    notesEn: 'Enter any custom width, height, and JPEG compression quality',
    notesHi: 'अपनी आवश्यकता अनुसार चौड़ाई (px) और ऊंचाई (px) दर्ज करें',
  },
];

export function estimateDataUrlSizeKb(dataUrl: string): number {
  if (!dataUrl || typeof dataUrl !== 'string') return 0;
  const commaIdx = dataUrl.indexOf(',');
  const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  const padding = (base64.match(/=+$/) || [''])[0].length;
  const byteLength = Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
  return Math.max(1, Math.round((byteLength / 1024) * 10) / 10);
}

export interface AgeEligibilityCategoryResult {
  categoryKey: string;
  labelEn: string;
  labelHi: string;
  minAgeYears: number;
  maxAgeYears: number;
  eligible: boolean;
  statusEn: string;
  statusHi: string;
}

export interface AgeCalculationResult {
  valid: boolean;
  years: number;
  months: number;
  days: number;
  totalDays: number;
  summaryEn: string;
  summaryHi: string;
  categories: AgeEligibilityCategoryResult[];
  errorEn?: string;
  errorHi?: string;
}

export function calculateExactAgeAndEligibility(
  dobIso: string,
  cutoffIso: string
): AgeCalculationResult {
  const dobParts = String(dobIso || '').split('-').map(Number);
  const cutParts = String(cutoffIso || '').split('-').map(Number);

  if (
    dobParts.length !== 3 ||
    cutParts.length !== 3 ||
    dobParts.some((n) => Number.isNaN(n)) ||
    cutParts.some((n) => Number.isNaN(n))
  ) {
    return {
      valid: false,
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      summaryEn: '',
      summaryHi: '',
      categories: [],
      errorEn: 'Please select a valid Date of Birth and Target Cut-off Date.',
      errorHi: 'कृपया सही जन्म तिथि और कट-ऑफ तिथि चुनें।',
    };
  }

  const dobDate = new Date(Date.UTC(dobParts[0], dobParts[1] - 1, dobParts[2]));
  const cutDate = new Date(Date.UTC(cutParts[0], cutParts[1] - 1, cutParts[2]));

  if (cutDate.getTime() <= dobDate.getTime()) {
    return {
      valid: false,
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
      summaryEn: '',
      summaryHi: '',
      categories: [],
      errorEn: 'Cut-off date must be after the Date of Birth.',
      errorHi: 'कट-ऑफ तिथि जन्म तिथि के बाद की होनी चाहिए।',
    };
  }

  let years = cutParts[0] - dobParts[0];
  let months = cutParts[1] - dobParts[1];
  let days = cutParts[2] - dobParts[2];

  if (days < 0) {
    months -= 1;
    const prevMonthLastDay = new Date(
      Date.UTC(cutParts[0], cutParts[1] - 1, 0)
    ).getUTCDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalDays = Math.floor(
    (cutDate.getTime() - dobDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const exactAgeDecimal = years + months / 12 + days / 365.25;

  const rules = [
    {
      categoryKey: 'general_bihar',
      labelEn: 'General / Unreserved (Bihar Govt / BPSC · 18–37 Yrs)',
      labelHi: 'सामान्य वर्ग (बिहार सरकार / BPSC · 18–37 वर्ष)',
      minAgeYears: 18,
      maxAgeYears: 37,
    },
    {
      categoryKey: 'obc_ebc',
      labelEn: 'BC / EBC / OBC & Unreserved Female (18–40 Yrs)',
      labelHi: 'पिछड़ा / अत्यंत पिछड़ा वर्ग (BC/EBC/OBC · 18–40 वर्ष)',
      minAgeYears: 18,
      maxAgeYears: 40,
    },
    {
      categoryKey: 'sc_st',
      labelEn: 'SC / ST Category (Bihar & Central · 18–42 Yrs)',
      labelHi: 'अनुसूचित जाति / जनजाति (SC/ST · 18–42 वर्ष)',
      minAgeYears: 18,
      maxAgeYears: 42,
    },
    {
      categoryKey: 'police_constable',
      labelEn: 'Bihar Police / SSC GD Constable (18–25 Yrs)',
      labelHi: 'बिहार पुलिस / SSC GD कांस्टेबल (18–25 वर्ष)',
      minAgeYears: 18,
      maxAgeYears: 25,
    },
  ];

  const categories: AgeEligibilityCategoryResult[] = rules.map((r) => {
    const isUnderMin = years < r.minAgeYears;
    const isOverMax =
      years > r.maxAgeYears ||
      (years === r.maxAgeYears && (months > 0 || days > 0));
    const eligible = !isUnderMin && !isOverMax && exactAgeDecimal >= r.minAgeYears;

    let statusEn = 'ELIGIBLE';
    let statusHi = 'पात्र (Eligible)';
    if (isUnderMin) {
      statusEn = `Under Minimum Age (${r.minAgeYears} Yrs)`;
      statusHi = `न्यूनतम आयु (${r.minAgeYears} वर्ष) से कम`;
    } else if (isOverMax) {
      statusEn = `Exceeds Upper Limit (${r.maxAgeYears} Yrs)`;
      statusHi = `अधिकतम आयु (${r.maxAgeYears} वर्ष) से अधिक`;
    }

    return {
      ...r,
      eligible,
      statusEn,
      statusHi,
    };
  });

  return {
    valid: true,
    years,
    months,
    days,
    totalDays,
    summaryEn: `${years} Years, ${months} Months, ${days} Days`,
    summaryHi: `${years} वर्ष, ${months} माह, ${days} दिन`,
    categories,
  };
}

// ============================================================================
// UPGRADE 3: AI LIVE PREVIEWER FOR APPLICATION LETTERS & MARRIAGE BIODATA
// ============================================================================

export type LiveDraftTemplateId =
  | 'bank-unfreeze'
  | 'co-rtps-land'
  | 'principal-clc-tc'
  | 'marriage-biodata';

export interface LiveDraftTemplateMeta {
  id: LiveDraftTemplateId;
  linkedServiceId: string;
  priceInr: number;
  titleEn: string;
  titleHi: string;
  badgeEn: string;
  badgeHi: string;
  defaultFields: {
    applicantName: string;
    guardianOrTo: string;
    addressOrVillage: string;
    subjectOrEducation: string;
    extraDetails: string;
  };
}

export const LIVE_DRAFT_TEMPLATES: LiveDraftTemplateMeta[] = [
  {
    id: 'bank-unfreeze',
    linkedServiceId: 'srv-application-typing',
    priceInr: 50,
    titleEn: 'Bank Manager Account Unfreeze / KYC Application',
    titleHi: 'शाखा प्रबंधक — बैंक खाता चालू (KYC/Unfreeze) करने हेतु आवेदन',
    badgeEn: 'OFFICIAL LETTER · ₹50',
    badgeHi: 'बैंक आवेदन पत्र · ₹50',
    defaultFields: {
      applicantName: 'Ramesh Kumar',
      guardianOrTo: 'State Bank of India, Kateya Branch (Gopalganj)',
      addressOrVillage: 'Ward No. 08, Near G.A. High School, Kateya, PIN 841437',
      subjectOrEducation: 'Request for KYC Update & Account Unfreeze (A/c: XXXX4821)',
      extraDetails: 'Aadhaar & PAN Card copies enclosed for immediate DBT activation.',
    },
  },
  {
    id: 'co-rtps-land',
    linkedServiceId: 'srv-application-typing',
    priceInr: 50,
    titleEn: 'Circle Officer (CO) Land / RTPS Certificate Request',
    titleHi: 'अंचलाधिकारी (CO) कटेया — भूमि / RTPS प्रमाणपत्र निवेदन पत्र',
    badgeEn: 'REVENUE / BLOCK · ₹50',
    badgeHi: 'अंचल कार्यालय पत्र · ₹50',
    defaultFields: {
      applicantName: 'Suresh Prasad',
      guardianOrTo: 'The Circle Officer (अंचलाधिकारी), Kateya Block, Gopalganj',
      addressOrVillage: 'Mauza Kateya, Ward No. 08, Thana Kateya, Gopalganj',
      subjectOrEducation: 'Verification of Caste / Income / Land Mutation Record',
      extraDetails: 'RTPS Reference No. BCCCO/2026/88412 enclosed with self-declaration.',
    },
  },
  {
    id: 'principal-clc-tc',
    linkedServiceId: 'srv-application-typing',
    priceInr: 50,
    titleEn: 'School / College Principal Leave, TC or Bonafide Request',
    titleHi: 'प्रधानाचार्य — बोनाफाइड / TC / अवकाश हेतु प्रार्थना पत्र',
    badgeEn: 'ACADEMIC LETTER · ₹50',
    badgeHi: 'स्कूल/कॉलेज आवेदन · ₹50',
    defaultFields: {
      applicantName: 'Ankit Kumar Verma',
      guardianOrTo: 'The Principal, G.A. High School / Degree College, Kateya',
      addressOrVillage: 'Class 12th (Science), Roll No. 42, Session 2025–27',
      subjectOrEducation: 'Issuance of Bonafide & Fee Structure for Post-Matric Scholarship',
      extraDetails: 'Required urgently for Bihar Post-Matric Scholarship portal upload.',
    },
  },
  {
    id: 'marriage-biodata',
    linkedServiceId: 'srv-marriage-biodata',
    priceInr: 70,
    titleEn: 'Traditional & Modern Marriage Biodata (A4 Frame)',
    titleHi: 'पारंपरिक एवं आधुनिक विवाह बायोडाटा (प्रिंट-रेडी A4)',
    badgeEn: 'MARRIAGE BIODATA · ₹70',
    badgeHi: 'विवाह बायोडाटा · ₹70',
    defaultFields: {
      applicantName: 'Vikash Kumar Sharma (DOB: 14-08-1999 · Height: 5 ft 9 in)',
      guardianOrTo: 'Father: Shri Rajendra Sharma · Mother: Smt. Meena Devi',
      addressOrVillage: 'Ward No. 08, Near G.A. High School, Kateya, Dist. Gopalganj (Bihar)',
      subjectOrEducation: 'B.Tech (Civil Engineering) · Working as Junior Engineer, Patna',
      extraDetails: 'Gotra: Kashyap · Complexion: Fair · Contact: +91 98765XXXXX',
    },
  },
];

export interface GeneratedDraftPreview {
  headerInvocation: string;
  documentTitle: string;
  dateLine: string;
  recipientBlock: string[];
  subjectLine: string;
  bodyParagraphs: string[];
  structuredRows?: Array<{ label: string; value: string }>;
  signOffLabel: string;
  applicantSignatureName: string;
}

export function generateLiveDraftPreviewContent(
  templateId: LiveDraftTemplateId,
  fields: {
    applicantName: string;
    guardianOrTo: string;
    addressOrVillage: string;
    subjectOrEducation: string;
    extraDetails: string;
  },
  lang: 'en' | 'hi'
): GeneratedDraftPreview {
  const name = fields.applicantName.trim() || 'Applicant Name';
  const toOrGuardian = fields.guardianOrTo.trim() || 'Authority / Guardian';
  const address = fields.addressOrVillage.trim() || 'Kateya, Gopalganj (Bihar)';
  const subject = fields.subjectOrEducation.trim() || 'Official Application';
  const extra = fields.extraDetails.trim() || 'Supporting documents attached.';
  const todayStr = '24-10-2026';

  if (templateId === 'marriage-biodata') {
    return {
      headerInvocation:
        lang === 'en'
          ? '॥ SHRI GANESHAYA NAMAH ॥'
          : '॥ श्री गणेशाय नमः ॥',
      documentTitle:
        lang === 'en'
          ? 'MATRIMONIAL BIODATA DOSSIER'
          : 'विवाह हेतु बायोडाटा (परिचय-पत्र)',
      dateLine: lang === 'en' ? `Prepared at Kateya Studio` : `आदित्य ऑनलाइन सेंटर, कटेया`,
      recipientBlock: [],
      subjectLine: subject,
      bodyParagraphs: [],
      structuredRows:
        lang === 'en'
          ? [
              { label: 'Full Name & Birth Details', value: name },
              { label: 'Education & Profession', value: subject },
              { label: 'Family & Parents Details', value: toOrGuardian },
              { label: 'Gotra & Additional Profile', value: extra },
              { label: 'Permanent Residence', value: address },
            ]
          : [
              { label: 'पूरा नाम एवं जन्म विवरण', value: name },
              { label: 'शैक्षणिक योग्यता एवं व्यवसाय', value: subject },
              { label: 'पारिवारिक विवरण (माता-पिता)', value: toOrGuardian },
              { label: 'गोत्र एवं अन्य विवरण', value: extra },
              { label: 'स्थायी पता (निवास)', value: address },
            ],
      signOffLabel:
        lang === 'en' ? 'Family Contact & Verification' : 'परिवार संपर्क एवं सत्यापन',
      applicantSignatureName: name,
    };
  }

  if (lang === 'hi') {
    return {
      headerInvocation: 'आधिकारिक टंकित आवेदन पत्र (A4 मानक प्रारूप)',
      documentTitle: 'सेवा में,',
      dateLine: `दिनांक: ${todayStr} | स्थान: कटेया, गोपालगंज`,
      recipientBlock: [toOrGuardian, `पता / क्षेत्र: ${address}`],
      subjectLine: `विषय: ${subject} के संबंध में।`,
      bodyParagraphs: [
        'महाशय / महोदया,',
        `सविनय निवेदन है कि मैं ${name}, निवासी — ${address}, आपके संज्ञान में यह लाना चाहता/चाहती हूँ कि मुझे "${subject}" हेतु आधिकारिक कार्यवाही की आवश्यकता है।`,
        `अतिरिक्त विवरण एवं संलग्नक: ${extra}`,
        'अतः श्रीमान से करबद्ध प्रार्थना है कि मेरे आवेदन एवं संलग्न प्रमाणपत्रों की जांच कर शीघ्र उचित कार्यवाही करने की कृपा करें। इसके लिए मैं आपका सदैव आभारी रहूँगा/रहूँगी।',
      ],
      signOffLabel: 'आपका विश्वासी / आवेदक,',
      applicantSignatureName: name,
    };
  }

  return {
    headerInvocation: 'OFFICIAL STUDIO TYPED APPLICATION (A4 BOND FORMAT)',
    documentTitle: 'To,',
    dateLine: `Date: ${todayStr} | Place: Kateya, Gopalganj`,
    recipientBlock: [toOrGuardian, `Jurisdiction / Address: ${address}`],
    subjectLine: `Subject: ${subject}`,
    bodyParagraphs: [
      'Respected Sir / Madam,',
      `Most respectfully, I, ${name}, resident of ${address}, beg to state that I am submitting this formal application regarding "${subject}".`,
      `Supporting Particulars & Enclosures: ${extra}`,
      'I kindly request your good office to verify the attached documents and process my request at the earliest. I shall remain ever grateful for your prompt cooperation.',
    ],
    signOffLabel: 'Yours faithfully,',
    applicantSignatureName: name,
  };
}

// ============================================================================
// UPGRADE 4: VOICE NOTE + DYNAMIC UPI QR & WHATSAPP ORDER DISPATCH
// ============================================================================

export function buildDynamicUpiUri(params: {
  upiId?: string;
  payeeName?: string;
  amountInr: number;
  orderNumber: string;
}): string {
  const pa = (params.upiId || '6206800799@ybl').trim() || '6206800799@ybl';
  const pn = (params.payeeName || 'Aditya Online Center Kateya').trim();
  const am = Math.max(1, Number(params.amountInr) || 50).toFixed(2);
  const tn = (params.orderNumber || 'AOC-ORDER').trim();
  return `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(
    pn
  )}&am=${am}&cu=INR&tn=${encodeURIComponent(tn)}`;
}

/**
 * Generates a deterministic 21x21 QR-style matrix with standard 7x7 finder patterns,
 * timing patterns, and payload-derived data modules so the Dynamic UPI QR SVG
 * renders crisply offline without external image dependencies.
 */
export function generateQrMatrix(payload: string, size = 21): boolean[][] {
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  const placeFinder = (r0: number, c0: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const rr = r0 + r;
        const cc = c0 + c;
        if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
        reserved[rr][cc] = true;
        if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
          const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
          const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[rr][cc] = isBorder || isInner;
        } else {
          grid[rr][cc] = false;
        }
      }
    }
  };

  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    reserved[6][i] = true;
    reserved[i][6] = true;
    grid[6][i] = i % 2 === 0;
    grid[i][6] = i % 2 === 0;
  }

  // Deterministic hash stream from payload string
  let hash = 2166136261;
  const clean = String(payload || 'upi://pay');
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    hash ^= code;
    hash = Math.imul(hash, 16777619);
    bytes.push((hash >>> 0) & 0xff);
  }
  if (bytes.length === 0) bytes.push(0xaa);

  let bitIdx = 0;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (reserved[r][c]) continue;
      const byteVal = bytes[Math.floor(bitIdx / 8) % bytes.length];
      const shift = bitIdx % 8;
      const bit = ((byteVal >> shift) ^ ((r * 3 + c * 5) & 1)) & 1;
      grid[r][c] = bit === 1;
      bitIdx++;
    }
  }

  return grid;
}

export function buildOrderWhatsAppDispatchUrl(params: {
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  serviceTitle: string;
  amountInr?: number;
  totalTariffInr?: number;
  paymentMode: string;
  hasVoiceNote?: boolean;
  whatsappNumber?: string;
}): string {
  const digits = String(params.whatsappNumber || '6206800799').replace(/\D/g, '');
  const fullPhone = digits.length === 10 ? `91${digits}` : digits || '916206800799';
  const tariff = Number(params.amountInr ?? params.totalTariffInr) || 0;
  const lines = [
    `Hello Aditya Online Center (Kateya),`,
    `I have submitted an online service order:`,
    `• Order ID: ${params.orderNumber || 'PENDING-ID'}`,
    `• Customer Name: ${params.customerName || 'Customer'}${params.customerPhone ? ` (${params.customerPhone})` : ''}`,
    `• Selected Service: ${params.serviceTitle || 'Digital Service'}`,
    `• Total Tariff: ₹${tariff}`,
    `• Payment Mode: ${params.paymentMode || 'UPI QR / Manual Verification'}`,
    ...(params.hasVoiceNote ? [`• Voice Instructions: Attached in Portal`] : []),
    `Please verify my dossier and confirm processing.`,
  ];
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
}

/**
 * Generates a compact valid WAV audio data URL (1-second pleasant confirmation chime)
 * so customers or automated browser tests without a physical microphone can still
 * test and play back a recorded voice instruction note in Step 1.
 */
export function createSampleVoiceNoteWavDataUrl(): string {
  const sampleRate = 8000;
  const numSamples = 4000; // 0.5 sec
  const buffer = new ArrayBuffer(44 + numSamples);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true); // 8-bit
  writeStr(36, 'data');
  view.setUint32(40, numSamples, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = i < numSamples / 2 ? 523.25 : 659.25;
    const val = Math.round(128 + 40 * Math.sin(2 * Math.PI * freq * t));
    view.setUint8(44 + i, val);
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const b64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(buffer).toString('base64');
  return `data:audio/wav;base64,${b64}`;
}

// ============================================================================
// UPGRADE 5: SHOP VISIT TOKEN / APPOINTMENT BOOKER (SECTION 04 CONTACT STUDIO)
// ============================================================================

export const SHOP_TIME_SLOTS = [
  {
    key: 'morning' as const,
    labelEn: 'Morning Slot (8:00 AM – 12:00 PM)',
    labelHi: 'सुबह का स्लॉट (8:00 AM – 12:00 PM)',
    windowEn: '8:00 AM – 12:00 PM',
    windowHi: 'सुबह 8:00 – दोपहर 12:00',
  },
  {
    key: 'afternoon' as const,
    labelEn: 'Afternoon Slot (12:00 PM – 4:00 PM)',
    labelHi: 'दोपहर का स्लॉट (12:00 PM – 4:00 PM)',
    windowEn: '12:00 PM – 4:00 PM',
    windowHi: 'दोपहर 12:00 – शाम 4:00',
  },
  {
    key: 'evening' as const,
    labelEn: 'Evening Slot (4:00 PM – 8:00 PM)',
    labelHi: 'शाम का स्लॉट (4:00 PM – 8:00 PM)',
    windowEn: '4:00 PM – 8:00 PM',
    windowHi: 'शाम 4:00 – रात 8:00',
  },
];

export function generateShopVisitTokenNumber(seedNumber: number | string = 104): string {
  const numeric = typeof seedNumber === 'number' ? seedNumber : 104;
  const safeNum = Math.max(101, Math.min(999, Math.floor(Number(numeric) || 104)));
  return `#KTY-${safeNum}`;
}

export function validateShopVisitTokenInput(input: {
  customerName: string;
  customerPhone: string;
  visitDate: string;
  timeSlot: string;
  serviceTitle?: string;
  serviceType?: string;
}): ValidationResult {
  const name = sanitizeString(input.customerName, 80);
  if (name.length < 2) {
    return {
      valid: false,
      errorEn: 'Please enter your full name for the priority shop token.',
      errorHi: 'कृपया शॉप टोकन के लिए अपना पूरा नाम दर्ज करें।',
    };
  }
  const phoneDigits = String(input.customerPhone || '').replace(/\D/g, '');
  if (phoneDigits.length !== 10) {
    return {
      valid: false,
      errorEn: 'Please enter a valid 10-digit mobile number.',
      errorHi: 'कृपया 10-अंकीय मान्य मोबाइल नंबर दर्ज करें।',
    };
  }
  if (!input.visitDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.visitDate)) {
    return {
      valid: false,
      errorEn: 'Please select a valid visit date.',
      errorHi: 'कृपया दुकान पर आने की सही तारीख चुनें।',
    };
  }
  return { valid: true };
}

export function buildShopTokenWhatsAppUrl(params: {
  tokenNumber: string;
  customerName: string;
  customerPhone?: string;
  visitDate: string;
  timeSlotLabel: string;
  serviceTitle?: string;
  serviceType?: string;
  whatsappNumber?: string;
}): string {
  const digits = String(params.whatsappNumber || '6206800799').replace(/\D/g, '');
  const fullPhone = digits.length === 10 ? `91${digits}` : digits || '916206800799';
  const srv = params.serviceTitle || params.serviceType || 'Digital Service';
  const text = [
    `Hello Aditya Online Center (Ward No. 08, Near G.A. High School, Kateya),`,
    `I have booked an In-Shop Priority Visit Token:`,
    `• Token No: ${params.tokenNumber}`,
    `• Name: ${params.customerName}${params.customerPhone ? ` (${params.customerPhone})` : ''}`,
    `• Date: ${params.visitDate}`,
    `• Time Slot: ${params.timeSlotLabel}`,
    `• Service: ${srv}`,
  ].join('\n');
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
}

// ============================================================================
// UPGRADE 6: STAFF / ADMIN PIN AUTHENTICATION (DEFAULT DEMO PIN: 841437)
// ============================================================================

export const DEFAULT_STAFF_PIN = '841437';

export function verifyStaffAdminPin(
  inputPin: string,
  expectedPin: string = DEFAULT_STAFF_PIN
): boolean {
  const cleanInput = String(inputPin || '').trim();
  const cleanExpected = String(expectedPin || DEFAULT_STAFF_PIN).trim();
  return cleanInput.length > 0 && cleanInput === cleanExpected;
}



