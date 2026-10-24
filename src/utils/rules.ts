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


