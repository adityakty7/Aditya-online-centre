export type Language = 'en' | 'hi';

export type ServiceCategoryKey = string;

export interface CategoryMeta {
  key: ServiceCategoryKey | 'all';
  labelEn: string;
  labelHi: string;
  summaryEn: string;
  summaryHi: string;
  isCustom?: boolean;
  order?: number;
  updatedAt?: string;
}

export type OrderStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Awaiting Payment'
  | 'Payment Verification'
  | 'In Progress'
  | 'Needs Customer Information'
  | 'Completed'
  | 'Delivered'
  | 'Cancelled';

export type PaymentStatus =
  | 'Unpaid'
  | 'Pending Verification'
  | 'Verified'
  | 'Rejected';

export type AppView =
  | 'home'
  | 'services'
  | 'service-detail'
  | 'order-form'
  | 'order-confirmation'
  | 'track-order'
  | 'dashboard'
  | 'admin'
  | 'contact'
  | 'privacy'
  | 'terms';

export type AllowedFileFormat = 'pdf' | 'jpg' | 'png' | 'docx';

export type DocumentCategoryTag =
  | 'identity'
  | 'academic'
  | 'certificate'
  | 'financial'
  | 'photo_sign'
  | 'other';

export interface DocumentLibraryItem {
  id: string;
  labelEn: string;
  labelHi: string;
  categoryTag: DocumentCategoryTag;
  defaultRequired: boolean;
  acceptedFormats: AllowedFileFormat[];
  maxSizeKb: number;
  defaultInstructionsEn: string;
  defaultInstructionsHi: string;
  isCustom?: boolean;
  updatedAt: string;
}

export interface ServiceDocumentRequirement {
  docId: string;
  labelEn: string;
  labelHi: string;
  required: boolean;
  acceptedFormats: AllowedFileFormat[];
  maxSizeKb: number;
  instructionsEn?: string;
  instructionsHi?: string;
  order: number;
}

export interface ServiceCustomField {
  id: string;
  labelEn: string;
  labelHi: string;
  type: 'text' | 'textarea' | 'select';
  required: boolean;
  placeholderEn?: string;
  placeholderHi?: string;
  options?: string[];
}

export type AdminSection =
  | 'dashboard'
  | 'services'
  | 'categories'
  | 'documents'
  | 'orders'
  | 'customers'
  | 'payments'
  | 'messages'
  | 'settings';

export interface DigitalService {
  id: string;
  category: ServiceCategoryKey;
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
  requiredDocsEn?: string[];
  requiredDocsHi?: string[];
  documentRequirementsJson?: string;
  customFieldsJson: string;
  isActive: boolean;
  featured: boolean;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  phone: string;
  villageOrTown: string;
  preferredLanguage: Language;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerLocation: string;
  serviceId: string;
  serviceTitleEn: string;
  serviceTitleHi: string;
  serviceCategory: ServiceCategoryKey;
  priceInr: number;
  estimatedCompletion: string;
  formResponsesSummary: string;
  customerNotes: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentUtr: string;
  adminNote: string;
  missingInfoRequest: string;
  customerInfoReply: string;
  uploadedFileCount: number;
  hasDeliverable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderFile {
  fileId: string;
  orderId: string;
  customerId: string;
  uploadedByRole: 'customer' | 'admin';
  fileCategory: 'customer_document' | 'payment_receipt' | 'final_deliverable';
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  dataUrl: string;
  requirementId?: string;
  requirementLabel?: string;
  createdAt: string;
}

export interface OrderStatusEvent {
  historyId: string;
  orderId: string;
  customerId: string;
  status: OrderStatus;
  note: string;
  actorUid: string;
  actorRole: 'customer' | 'admin';
  actorName: string;
  createdAt: string;
}

export interface CenterSettings {
  upiId: string;
  payeeName: string;
  qrCodeDataUrl: string;
  paymentInstructionsEn: string;
  paymentInstructionsHi: string;
  isUpiConfigured: boolean;
  shopPhone: string;
  shopAddressEn: string;
  shopAddressHi: string;
  updatedAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
  orderId: string;
  preferredLanguage: Language;
  status: 'New' | 'Replied';
  createdAt: string;
}
