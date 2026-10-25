import React from 'react';
import {
  AdminSection,
  CategoryMeta,
  CenterSettings,
  ContactMessage,
  DigitalService,
  DocumentCategoryTag,
  DocumentLibraryItem,
  Language,
  OrderFile,
  OrderStatus,
  OrderStatusEvent,
  PaymentStatus,
  ServiceCategoryKey,
  ServiceCustomField,
  ServiceOrder,
} from '../types';
import {
  EXAM_RADAR_CATEGORY_PILLS,
  ExamRadarCategoryKey,
  ExamRadarItemConfig,
  INITIAL_EXAM_RADAR_ITEMS,
  ORDER_WORKFLOW_STEPS,
  AllowedDocFormat,
  ServiceSortField,
  ServiceStatusFilter,
  StructuredDocRequirement,
  calculateOrderMetrics,
  calculateServiceMetrics,
  canAddDocumentLibraryItem,
  cleanDocumentLabel,
  createDuplicateService,
  deriveCustomerSummaries,
  filterAndSortServices,
  generateCategoryKey,
  generateDocumentTypeId,
  generateServiceId,
  getServiceDocumentRequirements,
  isSafeDataUrl,
  parseServiceDocumentRequirements,
  reorderDocumentRequirements,
  sanitizeString,
  serializeServiceDocumentRequirements,
  syncLegacyRequiredDocsFromRequirements,
  validateCategoryInput,
  validateDigitalServiceInput,
  validateUploadedFile,
} from '../utils/rules';
import {
  INITIAL_DOCUMENT_LIBRARY,
  SAMPLE_DELIVERABLE_DATA_URL,
  SERVICE_CATEGORIES,
} from '../data/initialCatalog';
import { BrandLogo } from './BrandLogo';
import { ServiceAppearanceManager } from './ServiceAppearanceManager';
import {
  ShieldCheck,
  Lock,
  Search,
  CheckCircle2,
  XCircle,
  Upload,
  FileText,
  Settings,
  Layers,
  ClipboardList,
  Plus,
  Download,
  MessageSquare,
  Trash2,
  LayoutDashboard,
  Users,
  CreditCard,
  Eye,
  Edit3,
  Copy,
  Power,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Star,
  Sparkles,
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  FolderPlus,
  SlidersHorizontal,
  CheckSquare,
  Square,
  FolderArchive,
  CloudUpload,
} from 'lucide-react';

interface AdminDashboardViewProps {
  lang: Language;
  isAuthorizedAdmin: boolean;
  isLiveAdmin: boolean;
  userEmail: string | null;
  onEnableSandboxAdmin: () => void;
  onOpenAuthModal: () => void;
  onOpenBackupModal?: () => void;
  orders: ServiceOrder[];
  orderFiles: Record<string, OrderFile[]>;
  orderHistory?: Record<string, OrderStatusEvent[]>;
  services: DigitalService[];
  settings: CenterSettings;
  categories?: CategoryMeta[];
  onSaveCategory?: (category: CategoryMeta) => Promise<void>;
  onDeleteCategory?: (categoryKey: string) => Promise<void>;
  documentLibrary?: DocumentLibraryItem[];
  onSaveDocumentLibraryItem?: (item: DocumentLibraryItem) => Promise<void>;
  onDeleteDocumentLibraryItem?: (docId: string) => Promise<void>;
  onAdminUpdateOrder: (
    order: ServiceOrder,
    updates: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      priceInr?: number;
      estimatedCompletion?: string;
      adminNote?: string;
      missingInfoRequest?: string;
      hasDeliverable?: boolean;
    },
    historyNote: string
  ) => Promise<void>;
  onAdminUploadDeliverable: (
    order: ServiceOrder,
    file: { fileName: string; mimeType: string; sizeBytes: number; dataUrl: string }
  ) => Promise<void>;
  onAdminSaveService: (service: DigitalService) => Promise<void>;
  onAdminDeleteService: (serviceId: string) => Promise<void>;
  onAdminSaveSettings: (settings: CenterSettings) => Promise<void>;
  contactMessages: ContactMessage[];
  onAdminUpdateContactMessageStatus: (
    message: ContactMessage,
    nextStatus: 'New' | 'Replied'
  ) => Promise<void>;
  onAdminDeleteContactMessage: (messageId: string) => Promise<void>;
  examRadarItems?: ExamRadarItemConfig[];
  onSaveExamRadarItems?: (items: ExamRadarItemConfig[]) => void;
}

const SERVICES_PER_PAGE = 6;

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  lang,
  isAuthorizedAdmin,
  isLiveAdmin,
  userEmail,
  onEnableSandboxAdmin,
  onOpenAuthModal,
  onOpenBackupModal,
  orders,
  orderFiles,
  orderHistory = {},
  services,
  settings,
  categories = SERVICE_CATEGORIES,
  onSaveCategory,
  onDeleteCategory,
  documentLibrary = INITIAL_DOCUMENT_LIBRARY,
  onSaveDocumentLibraryItem,
  onDeleteDocumentLibraryItem,
  onAdminUpdateOrder,
  onAdminUploadDeliverable,
  onAdminSaveService,
  onAdminDeleteService,
  onAdminSaveSettings,
  contactMessages,
  onAdminUpdateContactMessageStatus,
  onAdminDeleteContactMessage,
  examRadarItems = INITIAL_EXAM_RADAR_ITEMS,
  onSaveExamRadarItems,
}) => {
  const [activeSection, setActiveSection] =
    React.useState<AdminSection>('dashboard');
  const [appearanceServiceId, setAppearanceServiceId] = React.useState<string>(
    services[0]?.id || ''
  );
  const [statusMessage, setStatusMessage] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // ============================================================================
  // 1. SERVICE MANAGEMENT STATE (Search, Filter, Sort, Pagination, Modals)
  // ============================================================================
  const [srvSearch, setSrvSearch] = React.useState('');
  const [srvCategoryFilter, setSrvCategoryFilter] = React.useState<
    ServiceCategoryKey | 'all'
  >('all');
  const [srvStatusFilter, setSrvStatusFilter] =
    React.useState<ServiceStatusFilter>('all');
  const [srvSortBy, setSrvSortBy] =
    React.useState<ServiceSortField>('updatedAt');
  const [srvSortDir, setSrvSortDir] = React.useState<'asc' | 'desc'>('desc');
  const [srvPage, setSrvPage] = React.useState(1);

  // Service Modals: View Details, Create/Edit Editor, Delete Confirmation
  const [inspectedService, setInspectedService] =
    React.useState<DigitalService | null>(null);
  const [serviceEditorOpen, setServiceEditorOpen] = React.useState(false);
  const [serviceEditorMode, setServiceEditorMode] = React.useState<
    'create' | 'edit'
  >('create');
  const [serviceToDelete, setServiceToDelete] =
    React.useState<DigitalService | null>(null);
  const [isSavingService, setIsSavingService] = React.useState(false);
  const [serviceFormError, setServiceFormError] = React.useState<string | null>(
    null
  );

  // Service Editor Form Fields
  const [formId, setFormId] = React.useState('');
  const [formCategory, setFormCategory] =
    React.useState<ServiceCategoryKey>('resume_biodata');
  const [formTitleEn, setFormTitleEn] = React.useState('');
  const [formTitleHi, setFormTitleHi] = React.useState('');
  const [formDescEn, setFormDescEn] = React.useState('');
  const [formDescHi, setFormDescHi] = React.useState('');
  const [formPriceInr, setFormPriceInr] = React.useState<number>(80);
  const [formMinPriceInr, setFormMinPriceInr] = React.useState<string>('');
  const [formMaxPriceInr, setFormMaxPriceInr] = React.useState<string>('');
  const [formEtaEn, setFormEtaEn] = React.useState('2 to 4 Hours');
  const [formEtaHi, setFormEtaHi] = React.useState('2 से 4 घंटे');
  const [formRequiredDocs, setFormRequiredDocs] = React.useState(
    'Aadhaar Card, Marksheet, Passport Photo'
  );
  // Structured Document Requirements state for visual checklist builder
  const [formDocRequirements, setFormDocRequirements] = React.useState<
    StructuredDocRequirement[]
  >([]);
  const [docBuilderSearch, setDocBuilderSearch] = React.useState('');

  const [formInstructionsEn, setFormInstructionsEn] = React.useState('');
  const [formInstructionsHi, setFormInstructionsHi] = React.useState('');
  const [formIsActive, setFormIsActive] = React.useState(true);
  const [formFeatured, setFormFeatured] = React.useState(false);
  const [formCustomFields, setFormCustomFields] = React.useState<
    ServiceCustomField[]
  >([]);

  // Draft Custom Field Builder inside Service Editor
  const [newFieldLabelEn, setNewFieldLabelEn] = React.useState('');
  const [newFieldLabelHi, setNewFieldLabelHi] = React.useState('');
  const [newFieldType, setNewFieldType] = React.useState<
    'text' | 'textarea' | 'select'
  >('text');
  const [newFieldRequired, setNewFieldRequired] = React.useState(true);
  const [newFieldPlaceholderEn, setNewFieldPlaceholderEn] = React.useState('');
  const [newFieldPlaceholderHi, setNewFieldPlaceholderHi] = React.useState('');
  const [newFieldOptions, setNewFieldOptions] = React.useState('');

  // ============================================================================
  // REUSABLE DOCUMENT LIBRARY MANAGEMENT STATE
  // ============================================================================
  const [libSearchQuery, setLibSearchQuery] = React.useState('');
  const [libCategoryFilter, setLibCategoryFilter] = React.useState<string>('all');
  const [isAddCustomDocOpen, setIsAddCustomDocOpen] = React.useState(false);
  const [editingCustomDocItem, setEditingCustomDocItem] =
    React.useState<DocumentLibraryItem | null>(null);
  const [customDocLabelEn, setCustomDocLabelEn] = React.useState('');
  const [customDocLabelHi, setCustomDocLabelHi] = React.useState('');
  const [customDocCategory, setCustomDocCategory] =
    React.useState<DocumentCategoryTag>('certificate');
  const [customDocDefaultReq, setCustomDocDefaultReq] = React.useState(true);
  const [customDocFormats, setCustomDocFormats] = React.useState<
    AllowedDocFormat[]
  >(['pdf', 'jpg', 'png']);
  const [customDocMaxSizeKb, setCustomDocMaxSizeKb] = React.useState<number>(500);
  const [customDocInstructionsEn, setCustomDocInstructionsEn] =
    React.useState('');
  const [customDocInstructionsHi, setCustomDocInstructionsHi] =
    React.useState('');
  const [customDocError, setCustomDocError] = React.useState<string | null>(
    null
  );

  // ============================================================================
  // SERVICE CATEGORIES MANAGEMENT STATE & HANDLERS
  // ============================================================================
  const categoriesList = React.useMemo(() => {
    return categories && categories.length > 0 ? categories : SERVICE_CATEGORIES;
  }, [categories]);

  const [catSearchQuery, setCatSearchQuery] = React.useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [categoryModalMode, setCategoryModalMode] = React.useState<'create' | 'edit'>('create');
  const [catFormKey, setCatFormKey] = React.useState('');
  const [catFormLabelEn, setCatFormLabelEn] = React.useState('');
  const [catFormLabelHi, setCatFormLabelHi] = React.useState('');
  const [catFormSummaryEn, setCatFormSummaryEn] = React.useState('');
  const [catFormSummaryHi, setCatFormSummaryHi] = React.useState('');
  const [catFormOrder, setCatFormOrder] = React.useState<number>(99);
  const [catKeyManuallyEdited, setCatKeyManuallyEdited] = React.useState(false);
  const [catFormError, setCatFormError] = React.useState<string | null>(null);
  const [catFormSaving, setCatFormSaving] = React.useState(false);

  const openCreateCategoryModal = (prefillNameEn = '') => {
    setCategoryModalMode('create');
    setCatFormLabelEn(prefillNameEn);
    setCatFormLabelHi('');
    const existingKeys = categoriesList.map((c) => c.key);
    const suggestedKey = generateCategoryKey(prefillNameEn, existingKeys);
    setCatFormKey(prefillNameEn ? suggestedKey : '');
    setCatKeyManuallyEdited(false);
    setCatFormSummaryEn('');
    setCatFormSummaryHi('');
    setCatFormOrder(categoriesList.filter((c) => c.key !== 'all').length + 1);
    setCatFormError(null);
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: CategoryMeta) => {
    setCategoryModalMode('edit');
    setCatFormKey(cat.key);
    setCatKeyManuallyEdited(true);
    setCatFormLabelEn(cat.labelEn);
    setCatFormLabelHi(cat.labelHi);
    setCatFormSummaryEn(cat.summaryEn);
    setCatFormSummaryHi(cat.summaryHi);
    setCatFormOrder(cat.order ?? 99);
    setCatFormError(null);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategoryModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatFormError(null);
    const existingKeys = categoriesList.map((c) => c.key);
    const validation = validateCategoryInput(
      {
        key: catFormKey,
        labelEn: catFormLabelEn,
        labelHi: catFormLabelHi,
        summaryEn: catFormSummaryEn,
        summaryHi: catFormSummaryHi,
      },
      existingKeys,
      categoryModalMode === 'edit'
    );

    if (!validation.valid) {
      setCatFormError(lang === 'en' ? validation.errorEn! : validation.errorHi!);
      return;
    }

    setCatFormSaving(true);
    try {
      const categoryPayload: CategoryMeta = {
        key: catFormKey.trim(),
        labelEn: sanitizeString(catFormLabelEn, 100),
        labelHi: sanitizeString(catFormLabelHi, 100),
        summaryEn: sanitizeString(catFormSummaryEn, 300),
        summaryHi: sanitizeString(catFormSummaryHi, 300),
        isCustom: true,
        order: catFormOrder || 99,
        updatedAt: new Date().toISOString(),
      };

      if (onSaveCategory) {
        await onSaveCategory(categoryPayload);
      }

      setStatusMessage({
        type: 'success',
        text:
          lang === 'en'
            ? `Category "${categoryPayload.labelEn}" saved successfully.`
            : `श्रेणी "${categoryPayload.labelHi}" सफलतापूर्वक सहेजी गई।`,
      });

      // If service editor is currently open, auto-select this new category
      if (serviceEditorOpen) {
        setFormCategory(categoryPayload.key);
      }

      setIsCategoryModalOpen(false);
    } catch (err) {
      setCatFormError(
        err instanceof Error ? err.message : 'Failed to save category.'
      );
    } finally {
      setCatFormSaving(false);
    }
  };

  const handleDeleteCategoryAction = async (cat: CategoryMeta) => {
    const assignedCount = services.filter((s) => s.category === cat.key).length;
    if (assignedCount > 0) {
      alert(
        lang === 'en'
          ? `Cannot delete category "${cat.labelEn}" because ${assignedCount} active service(s) are currently assigned to it. Please reassign or delete those services first.`
          : `श्रेणी "${cat.labelHi}" को हटाया नहीं जा सकता क्योंकि इसमें ${assignedCount} सेवाएं जुड़ी हुई हैं। कृपया पहले उन सेवाओं की श्रेणी बदलें।`
      );
      return;
    }

    const confirmMsg =
      lang === 'en'
        ? `Are you sure you want to delete category "${cat.labelEn}" (${cat.key})?`
        : `क्या आप श्रेणी "${cat.labelHi}" को हटाना चाहते हैं?`;

    if (window.confirm && !window.confirm(confirmMsg)) return;

    try {
      if (onDeleteCategory) {
        await onDeleteCategory(cat.key);
      }
      setStatusMessage({
        type: 'success',
        text:
          lang === 'en'
            ? `Category "${cat.labelEn}" deleted.`
            : `श्रेणी "${cat.labelHi}" हटा दी गई।`,
      });
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Could not delete category.',
      });
    }
  };

  // Reset pagination when filters change
  React.useEffect(() => {
    setSrvPage(1);
  }, [srvSearch, srvCategoryFilter, srvStatusFilter, srvSortBy, srvSortDir]);

  const openCreateServiceModal = () => {
    setServiceEditorMode('create');
    setServiceFormError(null);
    setFormId('');
    setFormCategory('resume_biodata');
    setFormTitleEn('');
    setFormTitleHi('');
    setFormDescEn('');
    setFormDescHi('');
    setFormPriceInr(75);
    setFormMinPriceInr('50');
    setFormMaxPriceInr('120');
    setFormEtaEn('2 to 4 Hours');
    setFormEtaHi('2 से 4 घंटे');
    setFormRequiredDocs('Aadhaar Card, Marksheet, Passport Photo');
    const defaultInit = parseServiceDocumentRequirements(
      undefined,
      ['Aadhaar Card', 'Passport-size Photo', 'Signature'],
      ['आधार कार्ड', 'पासपोर्ट साइज फोटो', 'हस्ताक्षर']
    );
    setFormDocRequirements(defaultInit);
    setDocBuilderSearch('');
    setFormInstructionsEn(
      'Upload clear scans or photos of your supporting documents.'
    );
    setFormInstructionsHi(
      'अपने सहायक दस्तावेज़ों की साफ फोटो या PDF अपलोड करें।'
    );
    setFormIsActive(true);
    setFormFeatured(false);
    setFormCustomFields([]);
    setNewFieldLabelEn('');
    setNewFieldLabelHi('');
    setNewFieldOptions('');
    setServiceEditorOpen(true);
    setActiveSection('services');
  };

  const openEditServiceModal = (srv: DigitalService) => {
    setServiceEditorMode('edit');
    setServiceFormError(null);
    setFormId(srv.id);
    setFormCategory(srv.category);
    setFormTitleEn(srv.titleEn);
    setFormTitleHi(srv.titleHi);
    setFormDescEn(srv.descEn);
    setFormDescHi(srv.descHi);
    setFormPriceInr(srv.priceInr);
    setFormMinPriceInr(
      srv.minPriceInr !== undefined && srv.minPriceInr > 0
        ? String(srv.minPriceInr)
        : ''
    );
    setFormMaxPriceInr(
      srv.maxPriceInr !== undefined && srv.maxPriceInr > 0
        ? String(srv.maxPriceInr)
        : ''
    );
    setFormEtaEn(srv.estimatedTimeEn);
    setFormEtaHi(srv.estimatedTimeHi || srv.estimatedTimeEn);
    setFormRequiredDocs(srv.requiredDocs);
    const parsedReqs = getServiceDocumentRequirements(srv, documentLibrary);
    setFormDocRequirements(parsedReqs);
    setDocBuilderSearch('');
    setFormInstructionsEn(srv.instructionsEn || '');
    setFormInstructionsHi(srv.instructionsHi || '');
    setFormIsActive(srv.isActive);
    setFormFeatured(srv.featured);
    try {
      const parsed = JSON.parse(srv.customFieldsJson || '[]');
      setFormCustomFields(Array.isArray(parsed) ? parsed : []);
    } catch {
      setFormCustomFields([]);
    }
    setNewFieldLabelEn('');
    setNewFieldLabelHi('');
    setNewFieldOptions('');
    setInspectedService(null);
    setServiceEditorOpen(true);
    setActiveSection('services');
  };

  // Document Checklist Builder item actions
  const handleToggleDocRequired = (docId: string) => {
    setFormDocRequirements((prev) =>
      prev.map((r) => (r.docId === docId ? { ...r, required: !r.required } : r))
    );
  };

  const handleReorderDocRequirement = (index: number, dir: 'up' | 'down') => {
    setFormDocRequirements((prev) =>
      reorderDocumentRequirements(prev, index, dir)
    );
  };

  const handleRemoveDocRequirement = (docId: string) => {
    setFormDocRequirements((prev) => prev.filter((r) => r.docId !== docId));
  };

  const handleToggleFormatForRequirement = (
    docId: string,
    fmt: AllowedDocFormat
  ) => {
    setFormDocRequirements((prev) =>
      prev.map((r) => {
        if (r.docId !== docId) return r;
        const exists = r.allowedFormats.includes(fmt);
        const updatedFormats = exists
          ? r.allowedFormats.filter((f) => f !== fmt)
          : [...r.allowedFormats, fmt];
        // Keep at least one format
        return {
          ...r,
          allowedFormats:
            updatedFormats.length > 0 ? updatedFormats : r.allowedFormats,
        };
      })
    );
  };

  const handleUpdateDocMaxSize = (docId: string, sizeKb: number) => {
    setFormDocRequirements((prev) =>
      prev.map((r) => (r.docId === docId ? { ...r, maxSizeKb: sizeKb } : r))
    );
  };

  const handleUpdateDocInstructions = (
    docId: string,
    field: 'instructionsEn' | 'instructionsHi',
    val: string
  ) => {
    setFormDocRequirements((prev) =>
      prev.map((r) => (r.docId === docId ? { ...r, [field]: val } : r))
    );
  };

  const handleAddLibraryItemToService = (libItem: DocumentLibraryItem) => {
    setFormDocRequirements((prev) => {
      const alreadyHas = prev.some((r) => r.docId === libItem.id);
      if (alreadyHas) return prev;
      const newReq: StructuredDocRequirement = {
        docId: libItem.id,
        labelEn: libItem.labelEn,
        labelHi: libItem.labelHi,
        required: libItem.defaultRequired,
        allowedFormats: [...libItem.acceptedFormats],
        maxSizeKb: libItem.maxSizeKb,
        instructionsEn: libItem.defaultInstructionsEn,
        instructionsHi: libItem.defaultInstructionsHi,
        allowMultiple: false,
      };
      return [...prev, newReq];
    });
  };

  // Reusable Document Library Item Modal Handlers
  const openCreateCustomDocModal = () => {
    setEditingCustomDocItem(null);
    setCustomDocLabelEn('');
    setCustomDocLabelHi('');
    setCustomDocCategory('certificate');
    setCustomDocDefaultReq(true);
    setCustomDocFormats(['pdf', 'jpg', 'png']);
    setCustomDocMaxSizeKb(500);
    setCustomDocInstructionsEn('');
    setCustomDocInstructionsHi('');
    setCustomDocError(null);
    setIsAddCustomDocOpen(true);
  };

  const openEditCustomDocModal = (item: DocumentLibraryItem) => {
    setEditingCustomDocItem(item);
    setCustomDocLabelEn(item.labelEn);
    setCustomDocLabelHi(item.labelHi);
    setCustomDocCategory(item.categoryTag);
    setCustomDocDefaultReq(item.defaultRequired);
    setCustomDocFormats([...item.acceptedFormats]);
    setCustomDocMaxSizeKb(item.maxSizeKb);
    setCustomDocInstructionsEn(item.defaultInstructionsEn);
    setCustomDocInstructionsHi(item.defaultInstructionsHi);
    setCustomDocError(null);
    setIsAddCustomDocOpen(true);
  };

  const handleSaveCustomDocModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomDocError(null);

    if (!customDocLabelEn.trim()) {
      setCustomDocError('Document Name (English) is required.');
      return;
    }

    if (
      !editingCustomDocItem &&
      !canAddDocumentLibraryItem(documentLibrary, customDocLabelEn)
    ) {
      setCustomDocError(
        `A document with the name "${customDocLabelEn.trim()}" already exists in the Document Library.`
      );
      return;
    }

    const docId = editingCustomDocItem
      ? editingCustomDocItem.id
      : generateDocumentTypeId(customDocLabelEn);

    const docItem: DocumentLibraryItem = {
      id: docId,
      labelEn: sanitizeString(customDocLabelEn, 100),
      labelHi: sanitizeString(customDocLabelHi || customDocLabelEn, 100),
      categoryTag: customDocCategory,
      defaultRequired: customDocDefaultReq,
      acceptedFormats:
        customDocFormats.length > 0 ? customDocFormats : ['pdf', 'jpg'],
      maxSizeKb: Math.max(50, Math.min(500, Number(customDocMaxSizeKb) || 500)),
      defaultInstructionsEn: sanitizeString(customDocInstructionsEn, 300),
      defaultInstructionsHi: sanitizeString(
        customDocInstructionsHi || customDocInstructionsEn,
        300
      ),
      isCustom: true,
      updatedAt: new Date().toISOString(),
    };

    if (onSaveDocumentLibraryItem) {
      await onSaveDocumentLibraryItem(docItem);
    }

    // If currently in service editor, also attach this custom document right away!
    if (serviceEditorOpen) {
      handleAddLibraryItemToService(docItem);
    }

    setIsAddCustomDocOpen(false);
    setStatusMessage({
      type: 'success',
      text: editingCustomDocItem
        ? `Updated Document Library item "${docItem.labelEn}".`
        : `Added new Document "${docItem.labelEn}" (${docItem.id}) to Document Library.`,
    });
  };

  const handleAddCustomFieldToDraft = () => {
    if (!newFieldLabelEn.trim()) return;
    const fieldId =
      newFieldLabelEn
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')
        .slice(0, 32) || `field_${Date.now()}`;

    const optionsList =
      newFieldType === 'select'
        ? newFieldOptions
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        : undefined;

    const newField: ServiceCustomField = {
      id: `${fieldId}_${formCustomFields.length + 1}`,
      labelEn: sanitizeString(newFieldLabelEn, 100),
      labelHi: sanitizeString(
        newFieldLabelHi.trim() || newFieldLabelEn.trim(),
        100
      ),
      type: newFieldType,
      required: newFieldRequired,
      placeholderEn: sanitizeString(newFieldPlaceholderEn, 120) || undefined,
      placeholderHi:
        sanitizeString(
          newFieldPlaceholderHi || newFieldPlaceholderEn,
          120
        ) || undefined,
      options:
        optionsList && optionsList.length > 0
          ? optionsList
          : newFieldType === 'select'
          ? ['Option 1', 'Option 2']
          : undefined,
    };

    setFormCustomFields((prev) => [...prev, newField]);
    setNewFieldLabelEn('');
    setNewFieldLabelHi('');
    setNewFieldPlaceholderEn('');
    setNewFieldPlaceholderHi('');
    setNewFieldOptions('');
  };

  const handleSaveServiceForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setServiceFormError(null);

    if (formDocRequirements.length === 0) {
      setServiceFormError(
        lang === 'en'
          ? 'Please select or add at least one document requirement from the Document Library.'
          : 'कृपया दस्तावेज़ लाइब्रेरी से कम से कम एक आवश्यक दस्तावेज़ चुनें।'
      );
      return;
    }

    const existingIds = services.map((s) => s.id);
    const resolvedId =
      serviceEditorMode === 'edit'
        ? formId
        : formId.trim()
        ? formId.trim()
        : generateServiceId(formTitleEn, existingIds);

    const resolvedTitleHi = formTitleHi.trim() || formTitleEn.trim();
    const resolvedDescEn =
      formDescEn.trim() ||
      `${formTitleEn.trim()} digital service at Aditya Online Center, Kateya.`;
    const resolvedDescHi =
      formDescHi.trim() ||
      resolvedDescEn;
    const resolvedEtaHi = formEtaHi.trim() || formEtaEn.trim();
    const customFieldsJson = JSON.stringify(formCustomFields);

    const documentRequirementsJson = serializeServiceDocumentRequirements(
      formDocRequirements
    );
    const syncedLegacy = syncLegacyRequiredDocsFromRequirements(
      formDocRequirements
    );
    const resolvedRequiredDocs = syncedLegacy.requiredDocsPipe;

    const minP =
      formMinPriceInr.trim() !== '' ? Number(formMinPriceInr) : undefined;
    const maxP =
      formMaxPriceInr.trim() !== '' ? Number(formMaxPriceInr) : undefined;

    const validation = validateDigitalServiceInput({
      id: resolvedId,
      category: formCategory,
      titleEn: formTitleEn,
      titleHi: resolvedTitleHi,
      descEn: resolvedDescEn,
      descHi: resolvedDescHi,
      priceInr: Number(formPriceInr),
      minPriceInr: minP,
      maxPriceInr: maxP,
      instructionsEn: formInstructionsEn,
      instructionsHi: formInstructionsHi,
      estimatedTimeEn: formEtaEn,
      estimatedTimeHi: resolvedEtaHi,
      requiredDocs: resolvedRequiredDocs,
      documentRequirementsJson,
      customFieldsJson,
    });

    if (!validation.valid) {
      setServiceFormError(
        lang === 'en' ? validation.errorEn! : validation.errorHi!
      );
      return;
    }

    if (
      serviceEditorMode === 'create' &&
      services.some((s) => s.id === resolvedId)
    ) {
      setServiceFormError(
        lang === 'en'
          ? `A service with ID "${resolvedId}" already exists. Please choose a unique Service ID.`
          : `"${resolvedId}" आईडी वाली सेवा पहले से मौजूद है।`
      );
      return;
    }

    const existingService = services.find((s) => s.id === resolvedId);
    const serviceRecord: DigitalService = {
      id: resolvedId,
      category: formCategory,
      titleEn: sanitizeString(formTitleEn, 120),
      titleHi: sanitizeString(resolvedTitleHi, 120),
      descEn: sanitizeString(resolvedDescEn, 600),
      descHi: sanitizeString(resolvedDescHi, 600),
      priceInr: Math.max(0, Number(formPriceInr) || 0),
      minPriceInr: minP !== undefined && minP > 0 ? minP : 0,
      maxPriceInr: maxP !== undefined && maxP > 0 ? maxP : 0,
      instructionsEn: sanitizeString(formInstructionsEn, 1000),
      instructionsHi: sanitizeString(
        formInstructionsHi || formInstructionsEn,
        1000
      ),
      estimatedTimeEn: sanitizeString(formEtaEn, 80),
      estimatedTimeHi: sanitizeString(resolvedEtaHi, 80),
      requiredDocs: sanitizeString(resolvedRequiredDocs, 500),
      documentRequirementsJson,
      customFieldsJson,
      appearanceConfigJson: existingService?.appearanceConfigJson,
      isActive: formIsActive,
      featured: formFeatured,
      updatedAt: new Date().toISOString(),
    };

    setIsSavingService(true);
    try {
      await onAdminSaveService(serviceRecord);
      setServiceEditorOpen(false);
      setStatusMessage({
        type: 'success',
        text:
          serviceEditorMode === 'create'
            ? lang === 'en'
              ? `Created new service "${serviceRecord.titleEn}" (${serviceRecord.id}).`
              : `नई सेवा "${serviceRecord.titleHi}" सफलतापूर्वक जोड़ी गई।`
            : lang === 'en'
            ? `Updated service "${serviceRecord.titleEn}" (${serviceRecord.id}).`
            : `सेवा "${serviceRecord.titleHi}" सफलतापूर्वक अपडेट की गई।`,
      });
    } catch (err) {
      setServiceFormError(
        err instanceof Error
          ? err.message
          : 'Failed to save service to database.'
      );
    } finally {
      setIsSavingService(false);
    }
  };

  const handleDuplicateServiceAction = async (srv: DigitalService) => {
    const existingIds = services.map((s) => s.id);
    const duplicated = createDuplicateService(
      srv,
      existingIds,
      new Date().toISOString()
    );
    await onAdminSaveService(duplicated);
    setStatusMessage({
      type: 'success',
      text:
        lang === 'en'
          ? `Duplicated "${srv.titleEn}" as "${duplicated.titleEn}" (${duplicated.id}).`
          : `"${srv.titleHi}" की प्रतिलिपि "${duplicated.titleHi}" बनाई गई।`,
    });
  };

  const handleToggleServiceActive = async (srv: DigitalService) => {
    const updated: DigitalService = {
      ...srv,
      isActive: !srv.isActive,
      updatedAt: new Date().toISOString(),
    };
    await onAdminSaveService(updated);
    setStatusMessage({
      type: 'success',
      text:
        lang === 'en'
          ? `Service "${srv.titleEn}" is now ${
              updated.isActive ? 'Active (visible to customers)' : 'Inactive (hidden from catalog)'
            }.`
          : `सेवा "${srv.titleHi}" अब ${
              updated.isActive ? 'सक्रिय (Active)' : 'निष्क्रिय (Inactive)'
            } है।`,
    });
  };

  const handleConfirmDeleteService = async () => {
    if (!serviceToDelete) return;
    const target = serviceToDelete;
    setServiceToDelete(null);
    if (inspectedService?.id === target.id) {
      setInspectedService(null);
    }
    await onAdminDeleteService(target.id);
    setStatusMessage({
      type: 'success',
      text:
        lang === 'en'
          ? `Deleted service "${target.titleEn}" (${target.id}) from catalog.`
          : `सेवा "${target.titleHi}" कैटलॉग से हटा दी गई है।`,
    });
  };

  // ============================================================================
  // 2. ORDERS, CUSTOMERS, PAYMENTS & SETTINGS STATE
  // ============================================================================
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [orderSearchQuery, setOrderSearchQuery] = React.useState('');
  const [selectedOrderId, setSelectedOrderId] = React.useState<string>(
    orders[0]?.id || ''
  );

  // Customer directory search
  const [customerSearch, setCustomerSearch] = React.useState('');

  // Payments filter
  const [paymentStatusFilter, setPaymentStatusFilter] =
    React.useState<string>('ALL');

  // Contact messages filter
  const [messageFilter, setMessageFilter] = React.useState<
    'ALL' | 'New' | 'Replied'
  >('ALL');
  const [messageSearch, setMessageSearch] = React.useState('');

  const selectedOrder = React.useMemo(
    () =>
      orders.find((o) => o.id === selectedOrderId) ||
      orders.find((o) => o.orderNumber === selectedOrderId) ||
      orders[0] ||
      null,
    [orders, selectedOrderId]
  );

  const [editPrice, setEditPrice] = React.useState<number>(
    selectedOrder?.priceInr || 80
  );
  const [editEta, setEditEta] = React.useState<string>(
    selectedOrder?.estimatedCompletion || '2 to 4 Hours'
  );
  const [editStatus, setEditStatus] = React.useState<OrderStatus>(
    selectedOrder?.status || 'Submitted'
  );
  const [editAdminNote, setEditAdminNote] = React.useState<string>(
    selectedOrder?.adminNote || ''
  );
  const [editMissingPrompt, setEditMissingPrompt] = React.useState<string>(
    selectedOrder?.missingInfoRequest || ''
  );
  const [deliverableUrlInput, setDeliverableUrlInput] =
    React.useState<string>('');

  // Exam Radar Admin Editor State (Upgrade 6c)
  const [radarEditId, setRadarEditId] = React.useState<string>('');
  const [radarTitleEn, setRadarTitleEn] = React.useState<string>('');
  const [radarTitleHi, setRadarTitleHi] = React.useState<string>('');
  const [radarAuthorityEn, setRadarAuthorityEn] = React.useState<string>(
    'Bihar Government Portal'
  );
  const [radarAuthorityHi, setRadarAuthorityHi] = React.useState<string>(
    'बिहार सरकार पोर्टल'
  );
  const [radarCategory, setRadarCategory] =
    React.useState<Exclude<ExamRadarCategoryKey, 'all'>>('job_exam');
  const [radarStartDate, setRadarStartDate] =
    React.useState<string>('2026-10-01');
  const [radarLastDate, setRadarLastDate] =
    React.useState<string>('2026-12-15');
  const [radarFeeInr, setRadarFeeInr] = React.useState<number>(80);
  const [radarServiceId, setRadarServiceId] = React.useState<string>(
    services[0]?.id || 'srv-job-exam-form'
  );
  const [radarDocsInput, setRadarDocsInput] = React.useState<string>(
    'Aadhaar Card, 10th/12th Marksheet, Passport Photo & Signature'
  );
  const [radarBadgeEn, setRadarBadgeEn] =
    React.useState<string>('LIVE PORTAL OPEN');

  const handleSaveRadarItemForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!radarTitleEn.trim()) return;
    const docsEn = radarDocsInput
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
    const id =
      radarEditId ||
      `radar-${radarTitleEn
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 24)}-${Date.now().toString().slice(-4)}`;
    const newItem: ExamRadarItemConfig = {
      id,
      category: radarCategory,
      portalBadgeEn: sanitizeString(radarBadgeEn || radarAuthorityEn || 'LIVE PORTAL', 60),
      portalBadgeHi: sanitizeString(radarAuthorityHi || radarBadgeEn || 'लाइव पोर्टल', 60),
      titleEn: sanitizeString(radarTitleEn, 120),
      titleHi: sanitizeString(radarTitleHi || radarTitleEn, 120),
      authorityEn: sanitizeString(radarAuthorityEn, 100),
      authorityHi: sanitizeString(radarAuthorityHi || radarAuthorityEn, 100),
      startDate: radarStartDate || '2026-10-01',
      lastDate: radarLastDate || '2026-12-15',
      requiredDocsEn: docsEn.length > 0 ? docsEn : ['Aadhaar Card', 'Photo'],
      requiredDocsHi: docsEn.length > 0 ? docsEn : ['आधार कार्ड', 'फोटो'],
      feeInr: Math.max(0, Number(radarFeeInr) || 60),
      linkedServiceId: radarServiceId || 'srv-govt-job-form',
      matchedServiceId: radarServiceId || 'srv-govt-job-form',
      badgeEn: sanitizeString(radarBadgeEn || 'LIVE PORTAL', 40),
      badgeHi: sanitizeString(radarBadgeEn || 'लाइव पोर्टल', 40),
      isActive: true,
    };

    const nextList = radarEditId
      ? examRadarItems.map((it) => (it.id === radarEditId ? newItem : it))
      : [newItem, ...examRadarItems];

    if (onSaveExamRadarItems) {
      onSaveExamRadarItems(nextList);
    }
    setRadarEditId('');
    setRadarTitleEn('');
    setRadarTitleHi('');
    setStatusMessage({
      type: 'success',
      text:
        lang === 'en'
          ? `Saved "${newItem.titleEn}" to Section 01.B Live Exam & Scholarship Radar.`
          : `"${newItem.titleHi}" को सेक्शन 01.B लाइव परीक्षा रडार में सहेजा गया।`,
    });
  };

  React.useEffect(() => {
    if (selectedOrder) {
      setEditPrice(selectedOrder.priceInr);
      setEditEta(selectedOrder.estimatedCompletion);
      setEditStatus(selectedOrder.status);
      setEditAdminNote(selectedOrder.adminNote);
      setEditMissingPrompt(selectedOrder.missingInfoRequest);
    }
  }, [selectedOrder?.id, selectedOrder?.status, selectedOrder?.paymentStatus]);

  // UPI Settings State
  const [upiId, setUpiId] = React.useState(settings.upiId);
  const [payeeName, setPayeeName] = React.useState(settings.payeeName);
  const [qrDataUrl, setQrDataUrl] = React.useState(settings.qrCodeDataUrl);
  const [isUpiEnabled, setIsUpiEnabled] = React.useState(
    settings.isUpiConfigured
  );
  const [shopPhone, setShopPhone] = React.useState(settings.shopPhone);
  const [payInstrEn, setPayInstrEn] = React.useState(
    settings.paymentInstructionsEn
  );
  const [payInstrHi, setPayInstrHi] = React.useState(
    settings.paymentInstructionsHi
  );

  React.useEffect(() => {
    setUpiId(settings.upiId);
    setPayeeName(settings.payeeName);
    setQrDataUrl(settings.qrCodeDataUrl);
    setIsUpiEnabled(settings.isUpiConfigured);
    setShopPhone(settings.shopPhone);
    setPayInstrEn(settings.paymentInstructionsEn);
    setPayInstrHi(settings.paymentInstructionsHi);
  }, [settings]);

  // ============================================================================
  // 3. DERIVED METRICS & FILTERED COLLECTIONS
  // ============================================================================
  const orderMetrics = React.useMemo(
    () => calculateOrderMetrics(orders),
    [orders]
  );
  const serviceMetrics = React.useMemo(
    () => calculateServiceMetrics(services),
    [services]
  );
  const customerSummaries = React.useMemo(
    () => deriveCustomerSummaries(orders),
    [orders]
  );

  const filteredAndSortedServices = React.useMemo(
    () =>
      filterAndSortServices(services, {
        searchQuery: srvSearch,
        category: srvCategoryFilter,
        statusFilter: srvStatusFilter,
        sortBy: srvSortBy,
        sortDir: srvSortDir,
      }),
    [
      services,
      srvSearch,
      srvCategoryFilter,
      srvStatusFilter,
      srvSortBy,
      srvSortDir,
    ]
  );

  const totalSrvPages = Math.max(
    1,
    Math.ceil(filteredAndSortedServices.length / SERVICES_PER_PAGE)
  );
  const paginatedServices = React.useMemo(() => {
    const start = (srvPage - 1) * SERVICES_PER_PAGE;
    return filteredAndSortedServices.slice(start, start + SERVICES_PER_PAGE);
  }, [filteredAndSortedServices, srvPage]);

  const filteredOrders = React.useMemo(() => {
    const q = orderSearchQuery.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.toLowerCase().includes(q) ||
        o.serviceTitleEn.toLowerCase().includes(q) ||
        o.paymentUtr.toLowerCase().includes(q)
      );
    });
  }, [orders, statusFilter, orderSearchQuery]);

  const filteredCustomers = React.useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customerSummaries;
    return customerSummaries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q)
    );
  }, [customerSummaries, customerSearch]);

  const filteredPayments = React.useMemo(() => {
    return orders.filter((o) => {
      if (paymentStatusFilter === 'ALL') return true;
      return o.paymentStatus === paymentStatusFilter;
    });
  }, [orders, paymentStatusFilter]);

  const filteredMessages = React.useMemo(() => {
    const q = messageSearch.trim().toLowerCase();
    return contactMessages.filter((m) => {
      if (messageFilter !== 'ALL' && m.status !== messageFilter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q) ||
        m.orderId.toLowerCase().includes(q)
      );
    });
  }, [contactMessages, messageFilter, messageSearch]);

  const recentActivityFeed = React.useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      timestamp: string;
      kind: 'order' | 'service' | 'message';
    }> = [];

    for (const ord of orders.slice(0, 6)) {
      items.push({
        id: `act-ord-${ord.id}`,
        title: `${ord.orderNumber} · ${ord.status}`,
        subtitle: `${ord.customerName} — ${ord.serviceTitleEn} (₹${ord.priceInr})`,
        timestamp: ord.updatedAt || ord.createdAt,
        kind: 'order',
      });
    }

    for (const srv of services.slice(0, 4)) {
      items.push({
        id: `act-srv-${srv.id}`,
        title: `${srv.titleEn} (${srv.isActive ? 'Active' : 'Inactive'})`,
        subtitle: `Catalog Service · ₹${srv.priceInr} · ${srv.estimatedTimeEn}`,
        timestamp: srv.updatedAt,
        kind: 'service',
      });
    }

    for (const msg of contactMessages.slice(0, 3)) {
      items.push({
        id: `act-msg-${msg.id}`,
        title: `Inquiry: ${msg.subject} (${msg.status})`,
        subtitle: `${msg.name} (${msg.phone})`,
        timestamp: msg.createdAt,
        kind: 'message',
      });
    }

    return items
      .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
      .slice(0, 8);
  }, [orders, services, contactMessages]);

  const getCategoryLabel = (catKey: ServiceCategoryKey) => {
    const found = categoriesList.find((c) => c.key === catKey);
    if (!found) return catKey;
    return lang === 'en' ? found.labelEn : found.labelHi;
  };

  // ============================================================================
  // UNAUTHORIZED GATE
  // ============================================================================
  if (!isAuthorizedAdmin) {
    return (
      <div className="bg-[#F7F3EA] min-h-screen">
        <section className="editorial-dark-grid text-[#F7F3EA] border-b border-[#272732] py-14 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="glass-obsidian-panel p-6 sm:p-10 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <BrandLogo variant="badge" lang={lang} showSubtitle={false} />
                <div className="inline-flex items-center gap-2 font-mono-tabular text-xs font-bold uppercase tracking-[0.2em] text-[#FF5C35]">
                  <Lock className="w-4 h-4 text-[#FFB547]" />
                  <span>
                    {lang === 'en'
                      ? '04. ROLE-BASED SECURITY ENFORCEMENT'
                      : '04. सुरक्षित एडमिन नियंत्रण'}
                  </span>
                </div>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F7F3EA] tracking-tight leading-[1.06]">
                {lang === 'en'
                  ? 'Protected Admin Panel — Authorized Access Only.'
                  : 'सुरक्षित एडमिन पैनल — केवल अधिकृत प्रवेश।'}
              </h1>

              <p className="text-sm sm:text-base text-[#D8D3C8] max-w-2xl leading-relaxed">
                {lang === 'en'
                  ? 'Admin access is strictly restricted to the verified Aditya Online Center administrator account enforced by Firestore Security Rules.'
                  : 'एडमिन पैनल केवल आदित्य ऑनलाइन सेंटर के अधिकृत व्यवस्थापक (Admin) खाते के लिए सुरक्षित है।'}
              </p>

              {userEmail && (
                <div className="max-w-xl p-4 bg-[#18181F] border-l-4 border-[#FFB547] text-xs text-[#FFB547] font-mono-tabular">
                  {lang === 'en'
                    ? `SIGNED IN AS: ${userEmail} (Customer Role). Please sign in with the authorized administrator Google account.`
                    : `वर्तमान में ${userEmail} (ग्राहक खाता) से लॉगिन है। कृपया अधिकृत एडमिन गूगल खाते से लॉगिन करें।`}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="min-h-[48px] px-6 py-3.5 bg-[#FF5C35] hover:bg-[#E54922] text-white text-sm font-bold transition-colors shadow-lg shadow-[#FF5C35]/25"
                >
                  {lang === 'en'
                    ? 'Sign In with Authorized Admin Account (adityakty77@gmail.com)'
                    : 'अधिकृत एडमिन खाते (adityakty77@gmail.com) से लॉगिन करें'}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  const handleDeliverableUploadChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!selectedOrder) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const check = validateUploadedFile({
      name: file.name,
      type: file.type,
      size: file.size,
    });
    if (!check.valid) {
      setStatusMessage({
        type: 'error',
        text: lang === 'en' ? check.errorEn! : check.errorHi!,
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      await onAdminUploadDeliverable(selectedOrder, {
        fileName: sanitizeString(file.name, 140),
        mimeType: file.type,
        sizeBytes: file.size,
        dataUrl: String(reader.result || ''),
      });
      setStatusMessage({
        type: 'success',
        text:
          lang === 'en'
            ? `Uploaded final deliverable "${file.name}" and marked order Completed.`
            : `फाइनल दस्तावेज़ "${file.name}" अपलोड कर दिया गया है।`,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleQuickDeliverSamplePdf = async () => {
    if (!selectedOrder) return;
    const fileName = `${selectedOrder.orderNumber}_Completed_Document.pdf`;
    await onAdminUploadDeliverable(selectedOrder, {
      fileName,
      mimeType: 'application/pdf',
      sizeBytes: 98304,
      dataUrl: SAMPLE_DELIVERABLE_DATA_URL,
    });
    setStatusMessage({
      type: 'success',
      text:
        lang === 'en'
          ? `Attached completed deliverable "${fileName}" and updated status to Completed.`
          : `तैयार PDF "${fileName}" जोड़ दिया गया है और स्थिति Completed कर दी गई है।`,
    });
  };

  const sidebarItems: Array<{
    id: AdminSection;
    labelEn: string;
    labelHi: string;
    count?: number;
    icon: React.ReactNode;
  }> = [
    {
      id: 'dashboard',
      labelEn: 'Dashboard',
      labelHi: 'डैशबोर्ड',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'services',
      labelEn: 'Services',
      labelHi: 'सेवाएं',
      count: serviceMetrics.totalServices,
      icon: <Layers className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'appearance',
      labelEn: 'Service Appearance & 3D Images',
      labelHi: 'सेवा दिखावट व 3D इमेज',
      count: services.length,
      icon: <Sparkles className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'categories',
      labelEn: 'Categories',
      labelHi: 'श्रेणियां',
      count: categoriesList.filter((c) => c.key !== 'all').length,
      icon: <FolderPlus className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'documents',
      labelEn: 'Document Library',
      labelHi: 'दस्तावेज़ लाइब्रेरी',
      count: documentLibrary.length,
      icon: <FileText className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'orders',
      labelEn: 'Orders',
      labelHi: 'ऑर्डर',
      count: orderMetrics.total,
      icon: <ClipboardList className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'exam_radar',
      labelEn: 'Exam Radar (01.B)',
      labelHi: 'परीक्षा रडार (01.B)',
      count: examRadarItems.length,
      icon: <Star className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'customers',
      labelEn: 'Customers',
      labelHi: 'ग्राहक',
      count: customerSummaries.length,
      icon: <Users className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'payments',
      labelEn: 'Payments',
      labelHi: 'भुगतान',
      count: orderMetrics.pendingVerificationCount,
      icon: <CreditCard className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'messages',
      labelEn: 'Contact Messages',
      labelHi: 'संपर्क संदेश',
      count: contactMessages.length,
      icon: <MessageSquare className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'settings',
      labelEn: 'Settings',
      labelHi: 'सेटिंग्स',
      icon: <Settings className="w-4 h-4 shrink-0" />,
    },
  ];

  return (
    <section
      aria-label="Admin Service Management Dashboard"
      className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-8"
    >
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* =================================================================== */}
        {/* LEFT SIDEBAR NAVIGATION (Desktop) & TOP SCROLLABLE NAV (Mobile)     */}
        {/* =================================================================== */}
        <aside
          aria-label="Admin Workspace Navigation"
          className="w-full lg:w-64 shrink-0 bg-[#101014] border border-[#272732] rounded-2xl shadow-xl text-[#F7F3EA] p-4 lg:sticky lg:top-20 space-y-4"
        >
          <div className="pb-3.5 border-b border-white/10 flex items-center justify-between lg:block">
            <div className="space-y-2">
              <BrandLogo
                variant="sidebar"
                lang={lang}
                subtitleText={
                  isLiveAdmin ? 'LIVE FIRESTORE ADMIN' : 'KATEYA · ADMIN DESK'
                }
              />
              <div>
                <h1 className="text-sm font-extrabold text-[#F7F3EA] tracking-tight font-display">
                  {lang === 'en' ? 'Admin Control Center' : 'एडमिन कंट्रोल पैनल'}
                </h1>
                <p className="font-mono-tabular text-[10px] text-[#D8D3C8]">
                  {lang === 'en' ? 'KATEYA · OPERATIONS' : 'कटेया डिजिटल संचालन'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openCreateServiceModal}
              className="lg:hidden min-h-[40px] px-3 py-1.5 bg-[#FF5C35] hover:bg-[#E04823] text-white text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Add Service' : 'नई सेवा'}</span>
            </button>
          </div>

          {/* Navigation Links — Responsive wrap on mobile, vertical stack on desktop */}
          <nav
            aria-label="Admin Sections"
            className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-col gap-1"
          >
            {sidebarItems.map((item, idx) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`admin-tab-${item.id}`}
                  onClick={() => setActiveSection(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`min-h-[42px] px-3 py-2 text-xs sm:text-sm font-semibold transition-all flex items-center justify-between gap-2 whitespace-nowrap border-l-2 ${
                    isActive
                      ? 'bg-[#FF5C35] text-white border-l-[#FFB547]'
                      : 'text-[#D6D1C7] border-l-transparent bg-[#18181F]/60 lg:bg-transparent hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="font-mono-tabular text-[10px] opacity-75">
                      0{idx + 1}
                    </span>
                    <span className="truncate">
                      {lang === 'en' ? item.labelEn : item.labelHi}
                    </span>
                  </span>
                  {item.count !== undefined && (
                    <span
                      className={`font-mono-tabular text-[11px] font-bold px-1.5 py-0.5 shrink-0 ${
                        isActive
                          ? 'bg-black/25 text-white'
                          : 'bg-[#18181F] text-[#FFB547]'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="hidden lg:block pt-3.5 border-t border-[#272732]">
            <button
              type="button"
              onClick={openCreateServiceModal}
              className="w-full min-h-[44px] px-4 py-2.5 bg-[#FF5C35] hover:bg-[#E04823] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>
                {lang === 'en' ? 'Add New Service' : 'नई सेवा जोड़ें'}
              </span>
            </button>
          </div>
        </aside>

        {/* =================================================================== */}
        {/* MAIN WORKSPACE CONTENT AREA                                         */}
        {/* =================================================================== */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Global Admin Status Banner */}
          {statusMessage && (
            <div
              role="status"
              aria-live="polite"
              className={`p-4 border-l-4 text-sm flex items-center justify-between gap-4 ${
                statusMessage.type === 'error'
                  ? 'bg-red-50 border-red-600 text-red-900'
                  : 'bg-emerald-50 border-emerald-700 text-emerald-950'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {statusMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                )}
                <span className="font-medium">{statusMessage.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-xs font-semibold underline shrink-0"
              >
                {lang === 'en' ? 'Dismiss' : 'बंद करें'}
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* SECTION 1: DASHBOARD OVERVIEW                                     */}
          {/* ================================================================= */}
          {activeSection === 'dashboard' && (
            <div className="space-y-6">
              {/* Top Executive Glassmorphic Context Bar */}
              <div className="glass-bento-flagship text-[#F7F3EA] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.18em] text-[#FF5C35]">
                    {lang === 'en'
                      ? '01. ADMIN WORKSPACE · EXECUTIVE OVERVIEW'
                      : '01. एडमिन कार्यक्षेत्र · अवलोकन'}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#F7F3EA] mt-1 tracking-tight font-display">
                    {lang === 'en'
                      ? 'Aditya Online Center — Operations Hub'
                      : 'आदित्य ऑनलाइन सेंटर — मुख्य डैशबोर्ड'}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  {onOpenBackupModal && (
                    <button
                      type="button"
                      onClick={onOpenBackupModal}
                      className="min-h-[42px] px-3.5 py-2 bg-gradient-to-r from-emerald-600/30 to-blue-600/30 hover:from-emerald-600/50 hover:to-blue-600/50 border border-emerald-400/40 text-[#F7F3EA] text-xs font-mono-tabular font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
                    >
                      <CloudUpload className="w-4 h-4 text-emerald-400" />
                      <span>{lang === 'en' ? 'Project ZIP & Drive' : 'प्रोजेक्ट ZIP व ड्राइव'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    data-testid="dashboard-open-appearance-btn"
                    onClick={() => setActiveSection('appearance')}
                    className="min-h-[42px] px-4 py-2 bg-[#FFB547]/15 hover:bg-[#FFB547]/30 border border-[#FFB547]/50 text-[#FFB547] text-xs font-mono-tabular font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'en'
                        ? 'Service Appearance & 3D Images'
                        : 'सेवा दिखावट व 3D इमेज'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveSection('services')}
                    className="min-h-[42px] px-4 py-2 bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-[#F7F3EA] text-xs font-mono-tabular font-semibold uppercase tracking-wider transition-colors whitespace-nowrap"
                  >
                    {lang === 'en' ? 'Manage Services' : 'सेवा प्रबंधन'}
                  </button>
                  <button
                    type="button"
                    onClick={openCreateServiceModal}
                    className="min-h-[42px] px-4 py-2 bg-[#FF5C35] hover:bg-[#E04823] text-white text-xs font-bold transition-colors flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    <span>
                      {lang === 'en' ? 'Add New Service' : 'नई सेवा जोड़ें'}
                    </span>
                  </button>
                </div>
              </div>

              {/* 7 Overview Metric Ledger (Glassmorphic Cream Grid) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 border-t border-l border-[#101014] glass-cream-panel">
                <div className="border-r border-b border-[#101014] p-4">
                  <div className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#787166]">
                    {lang === 'en' ? 'Total Services' : 'कुल सेवाएं'}
                  </div>
                  <div
                    data-testid="metric-total-services"
                    className="text-2xl font-extrabold text-[#101014] font-mono-tabular mt-1.5"
                  >
                    {serviceMetrics.totalServices}
                  </div>
                  <div className="text-[11px] text-[#787166] mt-1">
                    {lang === 'en' ? 'Catalog items' : 'कैटलॉग सेवाएं'}
                  </div>
                </div>

                <div className="border-r border-b border-[#101014] p-4">
                  <div className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#787166]">
                    {lang === 'en' ? 'Active Services' : 'सक्रिय सेवाएं'}
                  </div>
                  <div
                    data-testid="metric-active-services"
                    className="text-2xl font-extrabold text-emerald-700 font-mono-tabular mt-1.5"
                  >
                    {serviceMetrics.activeServices}
                  </div>
                  <div className="text-[11px] text-[#787166] mt-1">
                    {lang === 'en' ? 'Live for orders' : 'ग्राहकों के लिए उपलब्ध'}
                  </div>
                </div>

                <div className="border-r border-b border-[#101014] p-4">
                  <div className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#787166]">
                    {lang === 'en' ? 'Inactive Services' : 'निष्क्रिय सेवाएं'}
                  </div>
                  <div
                    data-testid="metric-inactive-services"
                    className="text-2xl font-extrabold text-[#4A463E] font-mono-tabular mt-1.5"
                  >
                    {serviceMetrics.inactiveServices}
                  </div>
                  <div className="text-[11px] text-[#787166] mt-1">
                    {lang === 'en' ? 'Paused / hidden' : 'रोकी गई सेवाएं'}
                  </div>
                </div>

                <div className="border-r border-b border-[#101014] p-4">
                  <div className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#787166]">
                    {lang === 'en' ? 'Total Orders' : 'कुल ऑर्डर'}
                  </div>
                  <div
                    data-testid="metric-total-orders"
                    className="text-2xl font-extrabold text-[#101014] font-mono-tabular mt-1.5"
                  >
                    {orderMetrics.total}
                  </div>
                  <div className="text-[11px] text-[#787166] mt-1">
                    {lang === 'en' ? 'All submissions' : 'सभी प्राप्त ऑर्डर'}
                  </div>
                </div>

                <div className="border-r border-b border-[#101014] p-4">
                  <div className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#787166]">
                    {lang === 'en' ? 'Pending Orders' : 'लंबित ऑर्डर'}
                  </div>
                  <div
                    data-testid="metric-pending-orders"
                    className="text-2xl font-extrabold text-amber-700 font-mono-tabular mt-1.5"
                  >
                    {orderMetrics.pendingAction}
                  </div>
                  <div className="text-[11px] text-[#787166] mt-1">
                    {lang === 'en' ? 'Awaiting review/pay' : 'समीक्षा/भुगतान लंबित'}
                  </div>
                </div>

                <div className="border-r border-b border-[#101014] p-4">
                  <div className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#787166]">
                    {lang === 'en' ? 'Completed Orders' : 'पूर्ण ऑर्डर'}
                  </div>
                  <div
                    data-testid="metric-completed-orders"
                    className="text-2xl font-extrabold text-[#C83713] font-mono-tabular mt-1.5"
                  >
                    {orderMetrics.completedDelivered}
                  </div>
                  <div className="text-[11px] text-[#787166] mt-1">
                    {lang === 'en' ? 'Ready / delivered' : 'तैयार / वितरित'}
                  </div>
                </div>

                <div className="border-r border-b border-[#101014] p-4 col-span-2 sm:col-span-2 xl:col-span-1">
                  <div className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#787166]">
                    {lang === 'en' ? 'Verified Revenue' : 'सत्यापित आय'}
                  </div>
                  <div
                    data-testid="metric-verified-revenue"
                    className="text-2xl font-extrabold text-emerald-700 font-mono-tabular mt-1.5"
                  >
                    ₹{orderMetrics.verifiedRevenueInr}
                  </div>
                  <div className="text-[11px] text-[#787166] mt-1">
                    {lang === 'en' ? 'Confirmed UPI' : 'सत्यापित UPI भुगतान'}
                  </div>
                </div>
              </div>

              {/* Recent Orders & Recent Activity Split */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Recent Orders Table */}
                <div className="lg:col-span-7 bg-[#FFFDF9] border border-[#101014] p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#DCD4C6]">
                    <div>
                      <div className="text-[10px] font-mono-tabular uppercase tracking-[0.2em] text-[#C83713] font-bold">
                        01.A — INCOMING DOSSIERS
                      </div>
                      <h3 className="text-base font-extrabold text-[#101014] font-display mt-0.5">
                        {lang === 'en' ? 'Recent Customer Orders' : 'हाल के ग्राहक ऑर्डर'}
                      </h3>
                      <p className="text-xs text-[#787166]">
                        {lang === 'en'
                          ? 'Latest orders submitted by customers in Kateya & nearby areas'
                          : 'ग्राहकों द्वारा हाल ही में भेजे गए ऑर्डर'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveSection('orders')}
                      className="text-xs font-mono-tabular font-bold uppercase tracking-[0.14em] text-[#C83713] hover:text-[#101014] whitespace-nowrap"
                    >
                      {lang === 'en' ? 'View All Orders →' : 'सभी ऑर्डर देखें →'}
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-[#DCD4C6]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#101014] text-[#F7F3EA] font-mono-tabular text-[10px] uppercase tracking-[0.14em]">
                          <th className="py-2.5 px-3 font-semibold">Order ID</th>
                          <th className="py-2.5 px-3 font-semibold">Customer & Service</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Fee</th>
                          <th className="py-2.5 px-3 font-semibold">Status</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCD4C6]">
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 px-4 text-center text-xs text-[#787166]">
                              {lang === 'en'
                                ? 'No orders in current queue. Submit an order or open Orders tab.'
                                : 'वर्तमान कतार में कोई ऑर्डर नहीं है।'}
                            </td>
                          </tr>
                        ) : (
                          orders.slice(0, 5).map((ord) => (
                            <tr key={ord.id} className="hover:bg-[#F7F3EA]/70">
                              <td className="py-3 px-3 font-mono-tabular font-bold text-[#C83713] whitespace-nowrap">
                                {ord.orderNumber}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-semibold text-[#101014]">
                                  {ord.customerName}
                                </div>
                                <div className="text-[#4A463E] truncate max-w-[180px]">
                                  {ord.serviceTitleEn}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right font-mono-tabular font-semibold text-[#101014] whitespace-nowrap">
                                ₹{ord.priceInr}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-semibold text-[#101014]">
                                  {ord.status}
                                </div>
                                <div className="text-[#787166]">
                                  {ord.paymentStatus}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-right whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrderId(ord.id);
                                    setActiveSection('orders');
                                  }}
                                  className="px-2.5 py-1 bg-[#101014] hover:bg-[#FF5C35] text-[#F7F3EA] hover:text-[#101014] font-mono-tabular text-[10px] font-bold uppercase tracking-[0.12em] transition-colors"
                                >
                                  {lang === 'en' ? 'Inspect' : 'जांचें'}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Activity Log */}
                <div className="lg:col-span-5 bg-[#FFFDF9] border border-[#101014] p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#DCD4C6]">
                    <div>
                      <div className="text-[10px] font-mono-tabular uppercase tracking-[0.2em] text-[#C83713] font-bold">
                        01.B — AUDIT TELEMETRY
                      </div>
                      <h3 className="text-base font-extrabold text-[#101014] font-display mt-0.5">
                        {lang === 'en' ? 'Recent Activity' : 'हाल की गतिविधि'}
                      </h3>
                      <p className="text-xs text-[#787166]">
                        {lang === 'en'
                          ? 'Latest order transitions, catalog updates, and inquiries'
                          : 'ऑर्डर, सेवा और संदेश अपडेट'}
                      </p>
                    </div>
                  </div>

                  <ul className="divide-y divide-[#DCD4C6] text-xs">
                    {recentActivityFeed.map((act) => (
                      <li key={act.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-[#101014]">
                            {act.title}
                          </span>
                          <span className="font-mono-tabular text-[11px] text-[#787166] shrink-0">
                            {new Date(act.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-[#4A463E] mt-0.5 truncate">
                          {act.subtitle}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SECTION 2: COMPLETE SERVICE MANAGEMENT (CRUD)                     */}
          {/* ================================================================= */}
          {activeSection === 'services' && (
            <div className="space-y-6">
              {/* Section Header */}
              <div className="bg-[#101014] text-[#F7F3EA] border border-[#272732] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.18em] text-[#FF5C35]">
                    {lang === 'en'
                      ? `02. SERVICE CATALOG (${serviceMetrics.activeServices} ACTIVE · ${serviceMetrics.inactiveServices} INACTIVE)`
                      : `02. सेवा प्रबंधन (${serviceMetrics.activeServices} सक्रिय · ${serviceMetrics.inactiveServices} निष्क्रिय)`}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#F7F3EA] mt-1 font-display">
                    {lang === 'en'
                      ? 'Service Catalog & Pricing Management'
                      : 'डिजिटल सेवा और मूल्य प्रबंधन'}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={openCreateServiceModal}
                  className="min-h-[44px] px-5 py-2.5 bg-[#FF5C35] hover:bg-[#E04823] text-white text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {lang === 'en' ? 'Add New Service' : 'नई सेवा जोड़ें'}
                  </span>
                </button>
              </div>

              {/* Search, Category Filter, Status Filter & Sorting Bar */}
              <div className="bg-[#FFFDF9] border border-[#101014] p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  {/* Search Input */}
                  <div className="md:col-span-5 relative">
                    <label htmlFor="admin-service-search" className="sr-only">
                      {lang === 'en' ? 'Search services' : 'सेवाएं खोजें'}
                    </label>
                    <Search className="w-4 h-4 text-[#787166] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="admin-service-search"
                      type="search"
                      value={srvSearch}
                      onChange={(e) => setSrvSearch(e.target.value)}
                      placeholder={
                        lang === 'en'
                          ? 'Search by name, Hindi title, ID, or required docs...'
                          : 'सेवा का नाम, आईडी या आवश्यक दस्तावेज़ खोजें...'
                      }
                      className="w-full min-h-[42px] pl-10 pr-4 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs sm:text-sm text-[#101014]"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="md:col-span-3">
                    <label htmlFor="admin-service-category-filter" className="sr-only">
                      Filter by Category
                    </label>
                    <select
                      id="admin-service-category-filter"
                      value={srvCategoryFilter}
                      onChange={(e) =>
                        setSrvCategoryFilter(
                          e.target.value as ServiceCategoryKey | 'all'
                        )
                      }
                      className="w-full min-h-[42px] px-3 py-2 border border-[#D4CCBE] rounded-xl text-xs sm:text-sm bg-[#F7F3EA] text-[#101014]"
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat.key} value={cat.key}>
                          {lang === 'en' ? cat.labelEn : cat.labelHi}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Field */}
                  <div className="md:col-span-3">
                    <label htmlFor="admin-service-sort-by" className="sr-only">
                      Sort Services By
                    </label>
                    <select
                      id="admin-service-sort-by"
                      value={srvSortBy}
                      onChange={(e) =>
                        setSrvSortBy(e.target.value as ServiceSortField)
                      }
                      className="w-full min-h-[42px] px-3 py-2 border border-[#D4CCBE] rounded-xl text-xs sm:text-sm bg-[#F7F3EA] text-[#101014]"
                    >
                      <option value="updatedAt">
                        {lang === 'en'
                          ? 'Sort: Last Updated'
                          : 'क्रम: अंतिम अपडेट'}
                      </option>
                      <option value="name">
                        {lang === 'en' ? 'Sort: Name (A–Z)' : 'क्रम: नाम (A–Z)'}
                      </option>
                      <option value="category">
                        {lang === 'en' ? 'Sort: Category' : 'क्रम: श्रेणी'}
                      </option>
                      <option value="price">
                        {lang === 'en' ? 'Sort: Price (₹)' : 'क्रम: शुल्क (₹)'}
                      </option>
                      <option value="status">
                        {lang === 'en'
                          ? 'Sort: Status (Active/Inactive)'
                          : 'क्रम: स्थिति'}
                      </option>
                    </select>
                  </div>

                  {/* Sort Direction Button */}
                  <div className="md:col-span-1">
                    <button
                      type="button"
                      aria-label={`Sort direction ${
                        srvSortDir === 'asc' ? 'Ascending' : 'Descending'
                      }`}
                      onClick={() =>
                        setSrvSortDir((prev) =>
                          prev === 'asc' ? 'desc' : 'asc'
                        )
                      }
                      className="w-full min-h-[42px] px-3 py-2 border border-[#D4CCBE] bg-[#F7F3EA] hover:bg-[#EFE9DC] rounded-xl text-xs font-semibold flex items-center justify-center gap-1 text-[#101014]"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5" />
                      <span>{srvSortDir === 'asc' ? 'Asc' : 'Desc'}</span>
                    </button>
                  </div>
                </div>

                {/* Status Filter Segmented Controls + Result Summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E6DFD3]">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {(
                      [
                        {
                          key: 'all',
                          labelEn: `All (${services.length})`,
                          labelHi: `सभी (${services.length})`,
                        },
                        {
                          key: 'active',
                          labelEn: `Active (${serviceMetrics.activeServices})`,
                          labelHi: `सक्रिय (${serviceMetrics.activeServices})`,
                        },
                        {
                          key: 'inactive',
                          labelEn: `Inactive (${serviceMetrics.inactiveServices})`,
                          labelHi: `निष्क्रिय (${serviceMetrics.inactiveServices})`,
                        },
                        {
                          key: 'featured',
                          labelEn: `Featured (${serviceMetrics.featuredServices})`,
                          labelHi: `प्रमुख (${serviceMetrics.featuredServices})`,
                        },
                      ] as const
                    ).map((st) => (
                      <button
                        key={st.key}
                        type="button"
                        onClick={() => setSrvStatusFilter(st.key)}
                        className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          srvStatusFilter === st.key
                            ? 'bg-[#101014] text-white'
                            : 'bg-[#F7F3EA] text-[#4A463E] hover:bg-[#EFE9DC]'
                        }`}
                      >
                        {lang === 'en' ? st.labelEn : st.labelHi}
                      </button>
                    ))}
                  </div>

                  <div className="text-xs text-[#787166] font-mono-tabular">
                    {lang === 'en'
                      ? `Showing ${paginatedServices.length} of ${filteredAndSortedServices.length} matching services`
                      : `${filteredAndSortedServices.length} में से ${paginatedServices.length} सेवाएं दिख रही हैं`}
                  </div>
                </div>

                {/* Services Table / Empty State */}
                {filteredAndSortedServices.length === 0 ? (
                  <div className="p-10 text-center bg-[#F7F3EA] border border-[#E6DFD3] rounded-xl space-y-3">
                    <div className="text-base font-bold text-[#101014]">
                      {lang === 'en'
                        ? 'No services match your current filters'
                        : 'आपकी खोज या फ़िल्टर से कोई सेवा मेल नहीं खाती'}
                    </div>
                    <p className="text-xs text-[#4A463E] max-w-md mx-auto">
                      {lang === 'en'
                        ? 'Try clearing your search query or add a new digital service to the catalog.'
                        : 'खोज शब्दों को बदलें या कैटलॉग में एक नई डिजिटल सेवा जोड़ें।'}
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSrvSearch('');
                          setSrvCategoryFilter('all');
                          setSrvStatusFilter('all');
                        }}
                        className="min-h-[40px] px-4 py-2 bg-[#FFFDF9] border border-[#D4CCBE] text-xs font-semibold rounded-xl text-[#101014]"
                      >
                        {lang === 'en' ? 'Reset Filters' : 'फ़िल्टर रीसेट करें'}
                      </button>
                      <button
                        type="button"
                        onClick={openCreateServiceModal}
                        className="min-h-[40px] px-4 py-2 bg-[#FF5C35] hover:bg-[#E04823] text-white text-xs font-semibold rounded-xl"
                      >
                        {lang === 'en' ? '+ Add New Service' : '+ नई सेवा जोड़ें'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-[#101014]">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-[#101014] text-[#F7F3EA] font-mono-tabular text-[11px] uppercase tracking-wider">
                          <th className="py-3 px-4 font-semibold">
                            {lang === 'en' ? 'Service & ID' : 'सेवा और आईडी'}
                          </th>
                          <th className="py-3 px-3.5 font-semibold">
                            {lang === 'en' ? 'Category' : 'श्रेणी'}
                          </th>
                          <th className="py-3 px-3.5 font-semibold text-right">
                            {lang === 'en' ? 'Pricing (₹)' : 'शुल्क (₹)'}
                          </th>
                          <th className="py-3 px-3.5 font-semibold">
                            {lang === 'en' ? 'Turnaround' : 'अनुमानित समय'}
                          </th>
                          <th className="py-3 px-3.5 font-semibold">
                            {lang === 'en' ? 'Status · Updated' : 'स्थिति · अपडेट'}
                          </th>
                          <th className="py-3 px-4 font-semibold text-right">
                            {lang === 'en' ? 'Actions (CRUD)' : 'कार्यवाही'}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCD4C6]">
                        {paginatedServices.map((srv) => {
                          let customCount = 0;
                          try {
                            const parsed = JSON.parse(
                              srv.customFieldsJson || '[]'
                            );
                            if (Array.isArray(parsed))
                              customCount = parsed.length;
                          } catch {
                            customCount = 0;
                          }

                          return (
                            <tr
                              key={srv.id}
                              className="hover:bg-[#F7F3EA]/70 transition-colors"
                            >
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-[#101014]">
                                  {srv.titleEn}
                                </div>
                                <div className="text-xs text-[#4A463E] mt-0.5">
                                  {srv.titleHi}
                                </div>
                                <div className="text-[11px] text-[#787166] font-mono-tabular mt-1">
                                  {srv.id}
                                  {srv.featured ? ' · Featured' : ''}
                                  {` · ${customCount} form field(s)`}
                                </div>
                              </td>

                              <td className="py-3.5 px-3.5 text-xs text-[#4A463E] whitespace-nowrap">
                                {getCategoryLabel(srv.category)}
                              </td>

                              <td className="py-3.5 px-3.5 text-right font-mono-tabular whitespace-nowrap">
                                <div className="text-sm font-bold text-[#101014]">
                                  ₹{srv.priceInr}
                                </div>
                                {Boolean(
                                  srv.minPriceInr &&
                                    srv.maxPriceInr &&
                                    srv.maxPriceInr >= srv.minPriceInr
                                ) && (
                                  <div className="text-[11px] text-[#787166]">
                                    ₹{srv.minPriceInr}–₹{srv.maxPriceInr}
                                  </div>
                                )}
                              </td>

                              <td className="py-3.5 px-3.5 text-xs text-[#4A463E] whitespace-nowrap">
                                <div>{srv.estimatedTimeEn}</div>
                                <div className="text-[#787166]">
                                  {srv.estimatedTimeHi}
                                </div>
                              </td>

                              <td className="py-3.5 px-3.5 text-xs whitespace-nowrap">
                                <div
                                  className={`font-semibold ${
                                    srv.isActive
                                      ? 'text-emerald-700'
                                      : 'text-[#787166]'
                                  }`}
                                >
                                  {srv.isActive
                                    ? lang === 'en'
                                      ? 'Active'
                                      : 'सक्रिय'
                                    : lang === 'en'
                                    ? 'Inactive'
                                    : 'निष्क्रिय'}
                                </div>
                                <div className="text-[11px] text-[#787166] font-mono-tabular">
                                  {new Date(srv.updatedAt).toLocaleDateString()}
                                </div>
                              </td>

                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    aria-label={`View details for ${srv.titleEn}`}
                                    onClick={() => setInspectedService(srv)}
                                    className="min-h-[36px] px-2.5 py-1.5 bg-[#F7F3EA] hover:bg-[#EFE9DC] text-[#101014] text-xs font-semibold rounded-lg flex items-center gap-1 border border-[#D4CCBE]"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>
                                      {lang === 'en' ? 'View' : 'देखें'}
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    aria-label={`Customize 3D image for ${srv.titleEn}`}
                                    data-testid={`service-row-appearance-${srv.id}`}
                                    onClick={() => {
                                      setAppearanceServiceId(srv.id);
                                      setActiveSection('appearance');
                                    }}
                                    className="min-h-[36px] px-2.5 py-1.5 bg-[#101014] hover:bg-[#272732] text-[#FFB547] border border-[#FF5C35]/40 text-xs font-semibold rounded-lg flex items-center gap-1"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-[#FF5C35]" />
                                    <span>
                                      {lang === 'en' ? '3D Image' : '3D इमेज'}
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    aria-label={`Edit ${srv.titleEn}`}
                                    onClick={() => openEditServiceModal(srv)}
                                    className="min-h-[36px] px-2.5 py-1.5 bg-[#FFF2ED] hover:bg-[#FFE3D8] text-[#C83E1B] border border-[#FF5C35]/30 text-xs font-semibold rounded-lg flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>
                                      {lang === 'en' ? 'Edit' : 'संपादित'}
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    aria-label={`Duplicate ${srv.titleEn}`}
                                    onClick={() =>
                                      handleDuplicateServiceAction(srv)
                                    }
                                    className="min-h-[36px] px-2.5 py-1.5 bg-[#F7F3EA] hover:bg-[#EFE9DC] text-[#101014] border border-[#D4CCBE] text-xs font-semibold rounded-lg flex items-center gap-1"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>
                                      {lang === 'en' ? 'Duplicate' : 'प्रतिलिपि'}
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    aria-label={`${
                                      srv.isActive ? 'Deactivate' : 'Activate'
                                    } ${srv.titleEn}`}
                                    onClick={() =>
                                      handleToggleServiceActive(srv)
                                    }
                                    className={`min-h-[36px] px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 ${
                                      srv.isActive
                                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
                                    }`}
                                  >
                                    <Power className="w-3.5 h-3.5" />
                                    <span>
                                      {srv.isActive
                                        ? lang === 'en'
                                          ? 'Deactivate'
                                          : 'रोकें'
                                        : lang === 'en'
                                        ? 'Activate'
                                        : 'सक्रिय करें'}
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    aria-label={`Delete ${srv.titleEn}`}
                                    onClick={() => setServiceToDelete(srv)}
                                    className="min-h-[36px] px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-xs font-semibold rounded-lg flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>
                                      {lang === 'en' ? 'Delete' : 'हटाएं'}
                                    </span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination Bar */}
                {totalSrvPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-[#4A463E] font-mono-tabular">
                      Page {srvPage} of {totalSrvPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={srvPage <= 1}
                        onClick={() => setSrvPage((p) => Math.max(1, p - 1))}
                        className="min-h-[38px] px-3 py-1.5 bg-[#F7F3EA] hover:bg-[#EFE9DC] border border-[#D4CCBE] disabled:opacity-50 rounded-lg text-xs font-semibold flex items-center gap-1 text-[#101014]"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>
                      <button
                        type="button"
                        disabled={srvPage >= totalSrvPages}
                        onClick={() =>
                          setSrvPage((p) => Math.min(totalSrvPages, p + 1))
                        }
                        className="min-h-[38px] px-3 py-1.5 bg-[#F7F3EA] hover:bg-[#EFE9DC] border border-[#D4CCBE] disabled:opacity-50 rounded-lg text-xs font-semibold flex items-center gap-1 text-[#101014]"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SECTION: SERVICE APPEARANCE & 3D IMAGES STUDIO                    */}
          {/* ================================================================= */}
          {activeSection === 'appearance' && (
            <ServiceAppearanceManager
              lang={lang}
              services={services}
              categories={categoriesList}
              isLiveAdmin={isLiveAdmin}
              initialSelectedServiceId={appearanceServiceId}
              onSaveService={onAdminSaveService}
              onNotify={(msg) => setStatusMessage(msg)}
            />
          )}

          {/* ================================================================= */}
          {/* SECTION: SERVICE CATEGORIES MANAGEMENT                            */}
          {/* ================================================================= */}
          {activeSection === 'categories' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-[#101014] text-[#F7F3EA] border border-[#272732] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.18em] text-[#FF5C35]">
                    {lang === 'en'
                      ? '03. CATEGORY ARCHITECTURE'
                      : '03. सेवा श्रेणी प्रबंधन'}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#F7F3EA] mt-1 font-display">
                    {lang === 'en'
                      ? `Service Categories (${categoriesList.filter((c) => c.key !== 'all').length})`
                      : `सेवा श्रेणियाँ (${categoriesList.filter((c) => c.key !== 'all').length})`}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#D8D3C8] mt-1 max-w-2xl leading-relaxed">
                    {lang === 'en'
                      ? 'Add, edit, and organize digital service categories. Newly added categories immediately appear in customer catalog filters, home page highlights, and the service editor.'
                      : 'कस्टम सेवा श्रेणियां बनाएं और प्रबंधित करें। नयी श्रेणी जोड़ते ही ग्राहक पोर्टल, मुख्य पृष्ठ और सेवा फॉर्म में दिखने लगेगी।'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openCreateCategoryModal()}
                  className="min-h-[44px] px-5 py-2.5 bg-[#FF5C35] hover:bg-[#E04823] text-white text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap self-start sm:self-auto shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {lang === 'en' ? 'Add New Category' : 'नयी श्रेणी जोड़ें'}
                  </span>
                </button>
              </div>

              {/* Search & Metrics Summary */}
              <div className="bg-[#FFFDF9] border border-[#101014] p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-[#787166] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      aria-label="Search categories"
                      value={catSearchQuery}
                      onChange={(e) => setCatSearchQuery(e.target.value)}
                      placeholder={
                        lang === 'en'
                          ? 'Search categories by name, Hindi label, or slug...'
                          : 'श्रेणी का नाम, हिंदी लेबल या Slug खोजें...'
                      }
                      className="w-full min-h-[42px] pl-10 pr-4 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs sm:text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs text-[#5C5852]">
                    <span className="bg-[#F7F3EA] px-3 py-1.5 rounded-lg font-semibold">
                      {lang === 'en' ? 'Total' : 'कुल'}:{' '}
                      <strong className="text-[#101014] font-mono-tabular">
                        {categoriesList.filter((c) => c.key !== 'all').length}
                      </strong>
                    </span>
                    <span className="bg-[#FFF2ED] text-[#C83713] border border-[#FF5C35]/20 px-3 py-1.5 rounded-lg font-semibold">
                      {lang === 'en' ? 'Custom' : 'कस्टम'}:{' '}
                      <strong className="font-mono-tabular">
                        {categoriesList.filter((c) => c.key !== 'all' && c.isCustom).length}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Categories Grid */}
                {categoriesList
                  .filter((c) => c.key !== 'all')
                  .filter((c) => {
                    if (!catSearchQuery.trim()) return true;
                    const q = catSearchQuery.toLowerCase();
                    return (
                      c.labelEn.toLowerCase().includes(q) ||
                      c.labelHi.toLowerCase().includes(q) ||
                      c.key.toLowerCase().includes(q) ||
                      c.summaryEn.toLowerCase().includes(q) ||
                      c.summaryHi.toLowerCase().includes(q)
                    );
                  }).length === 0 ? (
                  <div className="p-10 bg-[#F7F3EA] border border-dashed border-[#DCD4C6] rounded-xl text-center space-y-3">
                    <FolderPlus className="w-8 h-8 text-[#A09D96] mx-auto" />
                    <p className="text-sm font-semibold text-[#101014]">
                      {lang === 'en'
                        ? 'No categories matched your search.'
                        : 'कोई श्रेणी नहीं मिली।'}
                    </p>
                    <button
                      type="button"
                      onClick={() => openCreateCategoryModal(catSearchQuery)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF5C35] text-white text-xs font-bold rounded-xl"
                    >
                      <Plus className="w-4 h-4" />
                      <span>
                        {lang === 'en'
                          ? `Create Category "${catSearchQuery}"`
                          : `नयी श्रेणी "${catSearchQuery}" बनाएं`}
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoriesList
                      .filter((c) => c.key !== 'all')
                      .filter((c) => {
                        if (!catSearchQuery.trim()) return true;
                        const q = catSearchQuery.toLowerCase();
                        return (
                          c.labelEn.toLowerCase().includes(q) ||
                          c.labelHi.toLowerCase().includes(q) ||
                          c.key.toLowerCase().includes(q) ||
                          c.summaryEn.toLowerCase().includes(q) ||
                          c.summaryHi.toLowerCase().includes(q)
                        );
                      })
                      .map((cat) => {
                        const assignedServices = services.filter(
                          (s) => s.category === cat.key
                        );
                        return (
                          <div
                            key={cat.key}
                            className="p-5 bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl flex flex-col justify-between gap-4 shadow-2xs hover:border-[#FF5C35]/50 transition-colors"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="w-10 h-10 rounded-xl bg-[#101014] text-[#F7F3EA] flex items-center justify-center shrink-0">
                                  <FolderPlus className="w-5 h-5 text-[#FF5C35]" />
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                  {cat.isCustom ? (
                                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FFECE8] text-[#C83713] border border-[#FF5C35]/30">
                                      {lang === 'en' ? 'Custom' : 'कस्टम'}
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F7F3EA] text-[#5C5852] border border-[#DCD4C6]">
                                      {lang === 'en' ? 'Built-in' : 'डिफ़ॉल्ट'}
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono-tabular">
                                    {assignedServices.length}{' '}
                                    {lang === 'en' ? 'Services' : 'सेवाएं'}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <h3 className="font-bold text-base text-[#101014]">
                                  {cat.labelEn}
                                </h3>
                                <div className="text-xs text-[#787166]">
                                  {cat.labelHi}
                                </div>
                                <div className="text-[11px] font-mono-tabular text-[#A09D96] mt-0.5">
                                  Slug: <code className="bg-[#F7F3EA] px-1.5 py-0.5 rounded text-[#101014]">{cat.key}</code>
                                </div>
                              </div>

                              {(cat.summaryEn || cat.summaryHi) && (
                                <p className="text-xs text-[#52504C] bg-[#F7F3EA] p-2.5 rounded-xl leading-relaxed">
                                  {lang === 'en' ? cat.summaryEn : cat.summaryHi}
                                </p>
                              )}
                            </div>

                            <div className="pt-3 border-t border-[#F0EAE0] flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSrvCategoryFilter(cat.key);
                                  setActiveSection('services');
                                }}
                                className="min-h-[34px] px-3 py-1 bg-[#F7F3EA] hover:bg-[#ECE5D8] border border-[#DCD4C6] text-[#101014] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                              >
                                <Layers className="w-3.5 h-3.5 text-[#FF5C35]" />
                                <span>{lang === 'en' ? 'View Services' : 'सेवाएं देखें'}</span>
                              </button>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditCategoryModal(cat)}
                                  className="min-h-[34px] px-2.5 py-1 text-[#5C5852] hover:text-[#101014] hover:bg-[#F7F3EA] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>{lang === 'en' ? 'Edit' : 'बदलें'}</span>
                                </button>

                                {cat.isCustom && onDeleteCategory && (
                                  <button
                                    type="button"
                                    aria-label={`Delete category ${cat.labelEn}`}
                                    onClick={() => handleDeleteCategoryAction(cat)}
                                    className="min-h-[34px] min-w-[34px] flex items-center justify-center text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SECTION: REUSABLE DOCUMENT LIBRARY MANAGEMENT                     */}
          {/* ================================================================= */}
          {activeSection === 'documents' && (
            <div className="space-y-6">
              {/* Header Banner */}
              <div className="bg-[#101014] text-[#F7F3EA] border border-[#272732] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.18em] text-[#FF5C35]">
                    {lang === 'en'
                      ? '04. DOCUMENT CHECKLIST REPOSITORY'
                      : '04. केंद्रीय दस्तावेज़ रिपॉजिटरी'}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-[#F7F3EA] mt-1 font-display">
                    {lang === 'en'
                      ? `Reusable Document Library (${documentLibrary.length})`
                      : `पुनः प्रयोज्य दस्तावेज़ लाइब्रेरी (${documentLibrary.length})`}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#D8D3C8] mt-1 max-w-2xl leading-relaxed">
                    {lang === 'en'
                      ? 'Manage standard document requirements (Aadhaar, PAN, marksheets, certificates, photos) with stable IDs. Select these when configuring services instead of manually typing document names.'
                      : 'आधार, पैन, मार्कशीट, जाति/आय प्रमाण पत्र और फोटो की लाइब्रेरी। नई सेवा बनाते समय इन्हें सीधे चेकलिस्ट में चुनें।'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openCreateCustomDocModal}
                  className="min-h-[44px] px-5 py-2.5 bg-[#FF5C35] hover:bg-[#E04823] text-white text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap self-start sm:self-auto shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {lang === 'en'
                      ? 'Add Custom Document Type'
                      : 'नया दस्तावेज़ प्रकार जोड़ें'}
                  </span>
                </button>
              </div>

              {/* Search, Filter Bar & Stats */}
              <div className="bg-[#FFFDF9] border border-[#101014] p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-[#787166] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      aria-label="Search document library"
                      value={libSearchQuery}
                      onChange={(e) => setLibSearchQuery(e.target.value)}
                      placeholder={
                        lang === 'en'
                          ? 'Search by document name, Hindi label, or ID...'
                          : 'दस्तावेज़ का नाम, हिंदी लेबल या ID खोजें...'
                      }
                      className="w-full min-h-[42px] pl-10 pr-4 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs sm:text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    {[
                      { key: 'all', labelEn: 'All Documents', labelHi: 'सभी' },
                      { key: 'identity', labelEn: 'Identity Proof', labelHi: 'पहचान पत्र' },
                      { key: 'academic', labelEn: 'Academic / Marksheet', labelHi: 'मार्कशीट' },
                      { key: 'certificate', labelEn: 'Certificates', labelHi: 'प्रमाण पत्र' },
                      { key: 'financial', labelEn: 'Banking / Finance', labelHi: 'बैंक विवरण' },
                      { key: 'photo_sign', labelEn: 'Photo & Signature', labelHi: 'फोटो व हस्ताक्षर' },
                      { key: 'other', labelEn: 'Other Supporting', labelHi: 'अन्य' },
                    ].map((tab) => {
                      const count =
                        tab.key === 'all'
                          ? documentLibrary.length
                          : documentLibrary.filter((d) => d.categoryTag === tab.key)
                              .length;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setLibCategoryFilter(tab.key)}
                          className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                            libCategoryFilter === tab.key
                              ? 'bg-[#101014] text-white shadow-xs'
                              : 'bg-[#F7F3EA] text-[#5C5852] hover:bg-[#EFE9DC]'
                          }`}
                        >
                          <span>{lang === 'en' ? tab.labelEn : tab.labelHi}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-mono-tabular text-[10px] ${
                              libCategoryFilter === tab.key
                                ? 'bg-white/20 text-white'
                                : 'bg-[#E6DFD3] text-[#5C5852]'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Document Cards Grid */}
                {documentLibrary.filter((item) => {
                  if (
                    libCategoryFilter !== 'all' &&
                    item.categoryTag !== libCategoryFilter
                  )
                    return false;
                  if (!libSearchQuery.trim()) return true;
                  const q = libSearchQuery.toLowerCase();
                  return (
                    item.labelEn.toLowerCase().includes(q) ||
                    item.labelHi.toLowerCase().includes(q) ||
                    item.id.toLowerCase().includes(q) ||
                    item.categoryTag.toLowerCase().includes(q)
                  );
                }).length === 0 ? (
                  <div className="p-10 bg-[#F7F3EA] border border-dashed border-[#DCD4C6] rounded-xl text-center space-y-3">
                    <FileText className="w-8 h-8 text-[#A09D96] mx-auto" />
                    <p className="text-sm font-semibold text-[#101014]">
                      {lang === 'en'
                        ? 'No documents matched your search filter.'
                        : 'खोजे गए फ़िल्टर के लिए कोई दस्तावेज़ नहीं मिला।'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setLibSearchQuery('');
                        setLibCategoryFilter('all');
                      }}
                      className="min-h-[38px] px-4 py-1.5 bg-[#101014] text-white text-xs font-semibold rounded-lg"
                    >
                      {lang === 'en' ? 'Reset Filters' : 'फ़िल्टर हटाएं'}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                    {documentLibrary
                      .filter((item) => {
                        if (
                          libCategoryFilter !== 'all' &&
                          item.categoryTag !== libCategoryFilter
                        )
                          return false;
                        if (!libSearchQuery.trim()) return true;
                        const q = libSearchQuery.toLowerCase();
                        return (
                          item.labelEn.toLowerCase().includes(q) ||
                          item.labelHi.toLowerCase().includes(q) ||
                          item.id.toLowerCase().includes(q) ||
                          item.categoryTag.toLowerCase().includes(q)
                        );
                      })
                      .map((item) => {
                        return (
                          <div
                            key={item.id}
                            className="p-4 bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl flex flex-col justify-between gap-3 shadow-2xs hover:border-[#FF5C35]/50 transition-colors"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <h3 className="font-bold text-sm text-[#101014]">
                                    {item.labelEn}
                                  </h3>
                                  <div className="text-xs text-[#787166]">
                                    {item.labelHi}
                                  </div>
                                </div>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                    item.isCustom
                                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                      : 'bg-[#F7F3EA] text-[#5C5852] border border-[#E6DFD3]'
                                  }`}
                                >
                                  {item.isCustom ? 'Custom' : 'Predefined'}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5 text-[11px] font-mono-tabular text-[#A09D96]">
                                <span>ID:</span>
                                <span className="bg-[#F7F3EA] px-2 py-0.5 rounded text-[#101014] truncate">
                                  {item.id}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                <span className="bg-[#F7F3EA] px-2 py-0.5 rounded text-[#5C5852] font-semibold">
                                  {item.categoryTag.toUpperCase()}
                                </span>
                                <span className="bg-[#F7F3EA] px-2 py-0.5 rounded text-[#5C5852] font-mono-tabular">
                                  Max: {item.maxSizeKb} KB
                                </span>
                                {item.defaultRequired ? (
                                  <span className="bg-[#FFECE8] text-[#C83713] px-2 py-0.5 rounded font-bold">
                                    Req Default
                                  </span>
                                ) : (
                                  <span className="bg-[#F7F3EA] text-[#787166] px-2 py-0.5 rounded">
                                    Opt Default
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1 text-[11px] text-[#5C5852]">
                                <span className="font-semibold">Formats:</span>
                                {item.acceptedFormats.map((f) => (
                                  <span
                                    key={f}
                                    className="px-1.5 py-0.2 bg-[#101014] text-[#F7F3EA] rounded text-[10px] uppercase font-bold"
                                  >
                                    {f}
                                  </span>
                                ))}
                              </div>

                              {(item.defaultInstructionsEn ||
                                item.defaultInstructionsHi) && (
                                <p className="text-[11px] text-[#52504C] bg-[#F7F3EA] p-2 rounded-lg leading-relaxed">
                                  {item.defaultInstructionsEn ||
                                    item.defaultInstructionsHi}
                                </p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-[#F0EAE0] flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEditCustomDocModal(item)}
                                className="min-h-[32px] px-3 py-1 bg-[#F7F3EA] hover:bg-[#ECE5D8] border border-[#DCD4C6] text-[#101014] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>{lang === 'en' ? 'Edit' : 'संपादित करें'}</span>
                              </button>

                              {item.isCustom && onDeleteDocumentLibraryItem && (
                                <button
                                  type="button"
                                  aria-label={`Delete custom document ${item.labelEn}`}
                                  onClick={async () => {
                                    if (
                                      window.confirm?.(
                                        `Delete custom document type "${item.labelEn}" from library?`
                                      ) ?? true
                                    ) {
                                      await onDeleteDocumentLibraryItem(item.id);
                                      setStatusMessage({
                                        type: 'success',
                                        text: `Removed custom document "${item.labelEn}".`,
                                      });
                                    }
                                  }}
                                  className="min-h-[32px] px-2.5 py-1 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SECTION 3: ORDERS & DELIVERABLE DELIVERY                          */}
          {/* ================================================================= */}
          {activeSection === 'orders' && (
            <div className="space-y-6">
              <div className="bg-[#FFFDF9] border border-[#101014] p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#DCD4C6]">
                  <div>
                    <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.18em] text-[#C83713]">
                      {lang === 'en'
                        ? '05. ORDER DOSSIERS & DELIVERABLES'
                        : '05. ग्राहक ऑर्डर और डिलीवरी'}
                    </div>
                    <h2 className="text-xl font-extrabold text-[#101014] font-display mt-0.5">
                      {lang === 'en'
                        ? 'Customer Orders & Document Delivery'
                        : 'ग्राहक ऑर्डर और दस्तावेज़ डिलीवरी'}
                    </h2>
                    <p className="text-xs text-[#787166] mt-0.5">
                      {lang === 'en'
                        ? 'Inspect submitted forms, verify UPI UTRs, update workflow status, and deliver final PDFs'
                        : 'प्राप्त फॉर्म जांचें, UPI सत्यापित करें और तैयार PDF अपलोड करें'}
                    </p>
                  </div>

                  <div className="relative flex-1 max-w-md">
                    <label htmlFor="admin-order-search" className="sr-only">
                      Search orders by ID, customer name, mobile, or UTR
                    </label>
                    <Search className="w-4 h-4 text-[#787166] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="admin-order-search"
                      type="search"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder={
                        lang === 'en'
                          ? 'Search Order ID, Customer Name, Phone, or UTR...'
                          : 'ऑर्डर आईडी, ग्राहक नाम, फोन या UTR खोजें...'
                      }
                      className="w-full min-h-[42px] pl-10 pr-4 py-2 bg-[#F7F3EA] border border-[#101014] text-xs sm:text-sm text-[#101014]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {[
                    'ALL',
                    'Submitted',
                    'Under Review',
                    'Awaiting Payment',
                    'Payment Verification',
                    'In Progress',
                    'Needs Customer Information',
                    'Completed',
                    'Delivered',
                    'Cancelled',
                  ].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        statusFilter === st
                          ? 'bg-[#101014] text-white'
                          : 'bg-[#F7F3EA] text-[#4A463E] hover:bg-[#EFE9DC]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Master-Detail Split */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                  <div className="lg:col-span-7 overflow-x-auto border border-[#101014]">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="bg-[#101014] text-[#F7F3EA] font-mono-tabular text-[11px] uppercase tracking-wider">
                          <th className="py-3 px-3.5 font-semibold">Order ID</th>
                          <th className="py-3 px-3.5 font-semibold">
                            Customer & Service
                          </th>
                          <th className="py-3 px-3.5 font-semibold text-right">
                            Fee
                          </th>
                          <th className="py-3 px-3.5 font-semibold">
                            Status · Payment
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#DCD4C6]">
                        {filteredOrders.map((ord) => {
                          const isSelected = selectedOrder?.id === ord.id;
                          return (
                            <tr
                              key={ord.id}
                              onClick={() => setSelectedOrderId(ord.id)}
                              className={`cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-[#FFF2ED]'
                                  : 'hover:bg-[#F7F3EA]/70'
                              }`}
                            >
                              <td className="py-3.5 px-3.5 font-mono-tabular font-bold text-[#C83E1B] whitespace-nowrap">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderId(ord.id)}
                                  className="text-left hover:underline focus:outline-none"
                                >
                                  {ord.orderNumber}
                                </button>
                              </td>
                              <td className="py-3.5 px-3.5">
                                <div className="font-semibold text-[#101014]">
                                  {ord.customerName}
                                </div>
                                <div className="text-xs text-[#4A463E] truncate max-w-[210px]">
                                  {ord.serviceTitleEn}
                                </div>
                              </td>
                              <td className="py-3.5 px-3.5 text-right font-mono-tabular font-semibold text-[#101014] whitespace-nowrap">
                                ₹{ord.priceInr}
                              </td>
                              <td className="py-3.5 px-3.5 text-xs">
                                <div className="font-semibold text-[#101014]">
                                  {ord.status}
                                </div>
                                <div className="text-[#787166]">
                                  {ord.paymentStatus}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Right Column: Selected Order Management Inspector */}
                  <div className="lg:col-span-5">
                    {selectedOrder ? (
                      <div className="bg-[#F7F3EA] border border-[#E6DFD3] rounded-xl p-5 space-y-5">
                        <div className="pb-4 border-b border-[#E6DFD3]">
                          <div className="text-xs font-mono-tabular font-bold text-[#C83E1B]">
                            {selectedOrder.orderNumber}
                          </div>
                          <h3 className="text-base font-bold text-[#101014] mt-0.5">
                            {selectedOrder.customerName} (
                            {selectedOrder.customerPhone})
                          </h3>
                          <p className="text-xs text-[#4A463E] mt-1">
                            {selectedOrder.customerLocation} ·{' '}
                            {selectedOrder.serviceTitleEn}
                          </p>
                        </div>

                        {/* Customer Submitted Form Data */}
                        <div className="text-xs space-y-1.5 bg-[#FFFDF9] p-3.5 rounded-xl border border-[#E6DFD3]">
                          <div className="font-semibold text-[#101014]">
                            Submitted Form Responses:
                          </div>
                          <div className="text-[#4A463E]">
                            {selectedOrder.formResponsesSummary}
                          </div>
                          {selectedOrder.customerNotes && (
                            <div className="text-[#4A463E] pt-1 border-t border-[#E6DFD3]">
                              <strong>Notes:</strong>{' '}
                              {selectedOrder.customerNotes}
                            </div>
                          )}
                          {selectedOrder.customerInfoReply && (
                            <div className="text-emerald-800 pt-1 border-t border-[#E6DFD3]">
                              <strong>Customer Reply:</strong>{' '}
                              {selectedOrder.customerInfoReply}
                            </div>
                          )}
                        </div>

                        {/* 1. Manual UPI Payment Verification Controls */}
                        <div className="bg-[#FFFDF9] p-4 rounded-xl border border-[#E6DFD3] space-y-3">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#101014]">
                              Manual UPI Verification
                            </span>
                            <span className="font-mono-tabular font-semibold text-[#4A463E]">
                              {selectedOrder.paymentStatus}
                            </span>
                          </div>
                          <div className="text-xs text-[#4A463E] font-mono-tabular">
                            Submitted UTR:{' '}
                            <strong>
                              {selectedOrder.paymentUtr || 'None submitted yet'}
                            </strong>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                await onAdminUpdateOrder(
                                  selectedOrder,
                                  {
                                    paymentStatus: 'Verified',
                                    status:
                                      selectedOrder.status ===
                                        'Payment Verification' ||
                                      selectedOrder.status ===
                                        'Awaiting Payment'
                                        ? 'In Progress'
                                        : selectedOrder.status,
                                  },
                                  `Admin manually verified UPI payment (UTR: ${
                                    selectedOrder.paymentUtr || 'Confirmed'
                                  })`
                                );
                                setStatusMessage({
                                  type: 'success',
                                  text: `Payment verified for ${selectedOrder.orderNumber}.`,
                                });
                              }}
                              className="min-h-[38px] px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Verify Payment</span>
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                await onAdminUpdateOrder(
                                  selectedOrder,
                                  {
                                    paymentStatus: 'Rejected',
                                    status: 'Awaiting Payment',
                                  },
                                  'Admin marked UPI reference as unverified/rejected; awaiting valid payment.'
                                );
                                setStatusMessage({
                                  type: 'error',
                                  text: `Payment marked Rejected for ${selectedOrder.orderNumber}.`,
                                });
                              }}
                              className="min-h-[38px] px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-lg flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Reject UTR</span>
                            </button>
                          </div>
                        </div>

                        {/* 2. Update Status, Price & Estimated Completion */}
                        <div className="bg-[#FFFDF9] p-4 rounded-xl border border-[#E6DFD3] space-y-3">
                          <div className="text-xs font-bold text-[#101014]">
                            Update Order Status, Price & Turnaround
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label
                                htmlFor="admin-edit-price"
                                className="block text-[11px] font-semibold text-[#4A463E] mb-1"
                              >
                                Price (₹ INR)
                              </label>
                              <input
                                id="admin-edit-price"
                                type="number"
                                value={editPrice}
                                onChange={(e) =>
                                  setEditPrice(Number(e.target.value))
                                }
                                className="w-full min-h-[40px] px-3 py-1.5 bg-[#F7F3EA] border border-[#D4CCBE] rounded-lg text-xs font-mono-tabular text-[#101014]"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="admin-edit-eta"
                                className="block text-[11px] font-semibold text-[#4A463E] mb-1"
                              >
                                Estimated Time
                              </label>
                              <input
                                id="admin-edit-eta"
                                type="text"
                                value={editEta}
                                onChange={(e) => setEditEta(e.target.value)}
                                className="w-full min-h-[40px] px-3 py-1.5 bg-[#F7F3EA] border border-[#D4CCBE] rounded-lg text-xs text-[#101014]"
                              />
                            </div>
                          </div>

                           <div>
                            <label
                              htmlFor="admin-edit-status"
                              className="block text-[11px] font-semibold text-[#4A463E] mb-1"
                            >
                              8-Stage Workflow Status (Real-Time Sync to Section 02)
                            </label>
                            <select
                              id="admin-edit-status"
                              data-testid="admin-edit-status-select"
                              value={editStatus}
                              onChange={(e) =>
                                setEditStatus(e.target.value as OrderStatus)
                              }
                              className="w-full min-h-[40px] px-3 py-1.5 border border-[#D4CCBE] rounded-lg text-xs bg-[#F7F3EA] text-[#101014]"
                            >
                              {[...ORDER_WORKFLOW_STEPS, 'Cancelled'].map(
                                (st) => (
                                  <option key={st} value={st}>
                                    {st}
                                  </option>
                                )
                              )}
                            </select>

                            {/* 1-Click 8-Stage Instant Switcher Pills */}
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {ORDER_WORKFLOW_STEPS.map((st, sIdx) => (
                                <button
                                  key={st}
                                  type="button"
                                  data-testid={`admin-quick-stage-${sIdx + 1}`}
                                  onClick={async () => {
                                    setEditStatus(st);
                                    await onAdminUpdateOrder(
                                      selectedOrder,
                                      { status: st },
                                      `Admin updated workflow stage to ${st}`
                                    );
                                    setStatusMessage({
                                      type: 'success',
                                      text: `Order ${selectedOrder.orderNumber} stage updated to "${st}" (Live in Section 02).`,
                                    });
                                  }}
                                  className={`px-2 py-1 rounded text-[10px] font-mono-tabular font-bold border transition-colors ${
                                    selectedOrder.status === st
                                      ? 'bg-[#FF5C35] text-white border-[#FF5C35]'
                                      : 'bg-[#F7F3EA] text-[#4A463E] border-[#D4CCBE] hover:border-[#101014]'
                                  }`}
                                >
                                  0{sIdx + 1}. {st}
                                </button>
                              ))}
                            </div>
                          </div>

                          {editStatus === 'Needs Customer Information' && (
                            <div>
                              <label
                                htmlFor="admin-missing-info-prompt"
                                className="block text-[11px] font-semibold text-amber-800 mb-1"
                              >
                                What missing information should the customer
                                provide?
                              </label>
                              <textarea
                                id="admin-missing-info-prompt"
                                rows={2}
                                value={editMissingPrompt}
                                onChange={(e) =>
                                  setEditMissingPrompt(e.target.value)
                                }
                                placeholder="Specify exact certificate number, spelling, or clear scan needed..."
                                className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-xs bg-[#FFFDF9]"
                              />
                            </div>
                          )}

                          <div>
                            <label
                              htmlFor="admin-note-input"
                              className="block text-[11px] font-semibold text-[#4A463E] mb-1"
                            >
                              Admin Note to Customer
                            </label>
                            <input
                              id="admin-note-input"
                              type="text"
                              value={editAdminNote}
                              onChange={(e) => setEditAdminNote(e.target.value)}
                              placeholder="Status update note..."
                              className="w-full min-h-[40px] px-3 py-1.5 bg-[#F7F3EA] border border-[#D4CCBE] rounded-lg text-xs text-[#101014]"
                            />
                          </div>

                          <button
                            type="button"
                            data-testid="admin-save-order-status-btn"
                            onClick={async () => {
                              await onAdminUpdateOrder(
                                selectedOrder,
                                {
                                  priceInr: editPrice,
                                  estimatedCompletion: sanitizeString(
                                    editEta,
                                    80
                                  ),
                                  status: editStatus,
                                  adminNote: sanitizeString(editAdminNote, 950),
                                  missingInfoRequest: sanitizeString(
                                    editMissingPrompt,
                                    950
                                  ),
                                },
                                `Admin updated status to ${editStatus}`
                              );
                              setStatusMessage({
                                type: 'success',
                                text: `Updated order ${selectedOrder.orderNumber} to ${editStatus}.`,
                              });
                            }}
                            className="w-full min-h-[42px] px-4 py-2 bg-[#FF5C35] hover:bg-[#E04823] text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            Save Order Status & Pricing
                          </button>
                        </div>

                        {/* 3. Authorized Customer Files & Final Deliverable Upload / URL */}
                        <div className="bg-[#FFFDF9] p-4 rounded-xl border border-[#E6DFD3] space-y-3">
                          <div className="text-xs font-bold text-[#101014]">
                            Order Files & Final Deliverable PDF (File or URL)
                          </div>

                          <ul className="space-y-1.5 text-xs">
                            {(
                              orderFiles[selectedOrder.orderNumber] ||
                              orderFiles[selectedOrder.id] ||
                              []
                            ).map((f) => (
                              <li
                                key={f.fileId}
                                className="p-2 bg-[#F7F3EA] border border-[#E6DFD3] rounded-lg flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <FileText className="w-3.5 h-3.5 text-[#C83E1B] shrink-0" />
                                  <span className="truncate font-medium text-[#101014]">
                                    {f.fileName}
                                  </span>
                                  <span className="text-[10px] text-[#787166]">
                                    ({f.fileCategory})
                                  </span>
                                </div>
                                {(isSafeDataUrl(f.dataUrl) ||
                                  /^https?:\/\//i.test(f.dataUrl) ||
                                  f.dataUrl.startsWith('/')) && (
                                  <a
                                    href={f.dataUrl}
                                    download={f.fileName}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#C83E1B] font-semibold hover:underline flex items-center gap-1 shrink-0"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Download</span>
                                  </a>
                                )}
                              </li>
                            ))}
                          </ul>

                          {/* Attach Deliverable PDF URL */}
                          <div className="pt-1 space-y-2">
                            <label
                              htmlFor="admin-deliverable-url-input"
                              className="block text-[11px] font-semibold text-[#4A463E]"
                            >
                              Attach / Update Final Deliverable PDF URL
                            </label>
                            <div className="flex gap-2">
                              <input
                                id="admin-deliverable-url-input"
                                data-testid="admin-deliverable-url-input"
                                type="url"
                                value={deliverableUrlInput}
                                onChange={(e) =>
                                  setDeliverableUrlInput(e.target.value)
                                }
                                placeholder="https://example.com/completed-receipt.pdf"
                                className="flex-1 min-h-[38px] px-3 py-1.5 bg-[#F7F3EA] border border-[#D4CCBE] rounded-lg text-xs font-mono-tabular text-[#101014]"
                              />
                              <button
                                type="button"
                                data-testid="admin-attach-deliverable-url-btn"
                                onClick={async () => {
                                  const cleanUrl = deliverableUrlInput.trim();
                                  if (!cleanUrl) return;
                                  const fileName = `${selectedOrder.orderNumber}_Final_Deliverable.pdf`;
                                  await onAdminUploadDeliverable(selectedOrder, {
                                    fileName,
                                    mimeType: 'application/pdf',
                                    sizeBytes: 102400,
                                    dataUrl: cleanUrl,
                                  });
                                  setDeliverableUrlInput('');
                                  setStatusMessage({
                                    type: 'success',
                                    text: `Attached deliverable PDF URL for ${selectedOrder.orderNumber} and marked Completed.`,
                                  });
                                }}
                                className="min-h-[38px] px-3 py-1.5 bg-[#101014] hover:bg-[#FF5C35] text-white text-xs font-bold rounded-lg whitespace-nowrap transition-colors"
                              >
                                Attach URL
                              </button>
                            </div>
                          </div>

                          <div className="pt-2 flex flex-wrap gap-2">
                            <label className="min-h-[40px] px-3 py-2 bg-[#F7F3EA] hover:bg-[#EFE9DC] border border-[#D4CCBE] text-[#101014] text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1.5">
                              <Upload className="w-3.5 h-3.5" />
                              <span>Upload Deliverable File</span>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.docx"
                                onChange={handleDeliverableUploadChange}
                                className="sr-only"
                              />
                            </label>

                            <button
                              type="button"
                              data-testid="admin-quick-deliver-pdf-btn"
                              onClick={handleQuickDeliverSamplePdf}
                              className="min-h-[40px] px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg transition-colors"
                            >
                              + Generate & Deliver Final PDF
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-sm text-[#787166] border border-[#E6DFD3] rounded-xl bg-[#F7F3EA]">
                        Select an order from the table to inspect details.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SECTION 3.B: LIVE BIHAR EXAM, SCHOLARSHIP & JOB FORM RADAR ADMIN  */}
          {/* ================================================================= */}
          {activeSection === 'exam_radar' && (
            <div
              data-testid="admin-exam-radar-section"
              className="bg-[#FFFDF9] border border-[#101014] p-5 sm:p-6 space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCD4C6]">
                <div>
                  <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.18em] text-[#C83713]">
                    {lang === 'en'
                      ? '05.B // SECTION 01.B LIVE EXAM & SCHOLARSHIP RADAR MANAGER'
                      : '05.B // सेक्शन 01.B लाइव परीक्षा और छात्रवृत्ति रडार प्रबंधन'}
                  </div>
                  <h2 className="text-xl font-extrabold text-[#101014] font-display mt-0.5">
                    {lang === 'en'
                      ? `Manage Active Exams, Scholarships & Portal Deadlines (${examRadarItems.length})`
                      : `सक्रिय परीक्षा, छात्रवृत्ति और अंतिम तिथि प्रबंधन (${examRadarItems.length})`}
                  </h2>
                  <p className="text-xs text-[#787166] mt-0.5">
                    {lang === 'en'
                      ? 'Add or edit active Bihar & Central portals shown in Section 01.B on the homepage.'
                      : 'होमपेज के सेक्शन 01.B में दिखने वाले सक्रिय बिहार और केंद्रीय फॉर्म जोड़ें या संपादित करें।'}
                  </p>
                </div>
              </div>

              {/* Add / Edit Exam Radar Form */}
              <form
                onSubmit={handleSaveRadarItemForm}
                className="p-5 bg-[#F7F3EA] border border-[#101014] space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-sm font-extrabold text-[#101014]">
                    {radarEditId
                      ? lang === 'en'
                        ? 'Edit Exam / Scholarship Radar Card'
                        : 'परीक्षा / छात्रवृत्ति कार्ड संपादित करें'
                      : lang === 'en'
                      ? '+ Add New Active Exam / Scholarship to Section 01.B'
                      : '+ सेक्शन 01.B में नया परीक्षा / छात्रवृत्ति फॉर्म जोड़ें'}
                  </h3>
                  {radarEditId && (
                    <button
                      type="button"
                      onClick={() => {
                        setRadarEditId('');
                        setRadarTitleEn('');
                        setRadarTitleHi('');
                      }}
                      className="text-xs font-bold text-[#C83713] underline"
                    >
                      {lang === 'en' ? 'Cancel Edit' : 'संपादन रद्द करें'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="radar-title-en"
                      className="block font-mono-tabular text-xs font-bold text-[#101014] mb-1"
                    >
                      Exam / Portal Title (English) *
                    </label>
                    <input
                      id="radar-title-en"
                      data-testid="admin-radar-title-en-input"
                      type="text"
                      required
                      value={radarTitleEn}
                      onChange={(e) => setRadarTitleEn(e.target.value)}
                      placeholder="e.g., Bihar Police Sub-Inspector (SI) Form"
                      className="w-full min-h-[40px] px-3 py-1.5 bg-[#FFFDF9] border border-[#101014] text-xs text-[#101014]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="radar-title-hi"
                      className="block font-mono-tabular text-xs font-bold text-[#101014] mb-1"
                    >
                      Title (Hindi / हिन्दी)
                    </label>
                    <input
                      id="radar-title-hi"
                      data-testid="admin-radar-title-hi-input"
                      type="text"
                      value={radarTitleHi}
                      onChange={(e) => setRadarTitleHi(e.target.value)}
                      placeholder="जैसे: बिहार पुलिस दारोगा भर्ती फॉर्म"
                      className="w-full min-h-[40px] px-3 py-1.5 bg-[#FFFDF9] border border-[#101014] text-xs text-[#101014]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="radar-category-select"
                      className="block font-mono-tabular text-xs font-bold text-[#101014] mb-1"
                    >
                      Portal Category
                    </label>
                    <select
                      id="radar-category-select"
                      value={radarCategory}
                      onChange={(e) =>
                        setRadarCategory(
                          e.target.value as Exclude<ExamRadarCategoryKey, 'all'>
                        )
                      }
                      className="w-full min-h-[40px] px-3 py-1.5 bg-[#FFFDF9] border border-[#101014] text-xs text-[#101014]"
                    >
                      {EXAM_RADAR_CATEGORY_PILLS.filter(
                        (c) => c.key !== 'all'
                      ).map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.labelEn}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label
                      htmlFor="radar-start-date"
                      className="block font-mono-tabular text-xs font-bold text-[#101014] mb-1"
                    >
                      Official Start Date
                    </label>
                    <input
                      id="radar-start-date"
                      type="date"
                      value={radarStartDate}
                      onChange={(e) => setRadarStartDate(e.target.value)}
                      className="w-full min-h-[40px] px-3 py-1.5 bg-[#FFFDF9] border border-[#101014] text-xs font-mono-tabular text-[#101014]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="radar-last-date"
                      className="block font-mono-tabular text-xs font-bold text-[#101014] mb-1"
                    >
                      Last Date (Countdown)
                    </label>
                    <input
                      id="radar-last-date"
                      data-testid="admin-radar-last-date-input"
                      type="date"
                      value={radarLastDate}
                      onChange={(e) => setRadarLastDate(e.target.value)}
                      className="w-full min-h-[40px] px-3 py-1.5 bg-[#FFFDF9] border border-[#101014] text-xs font-mono-tabular text-[#101014]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="radar-fee-input"
                      className="block font-mono-tabular text-xs font-bold text-[#101014] mb-1"
                    >
                      Center Assistance Fee (₹)
                    </label>
                    <input
                      id="radar-fee-input"
                      data-testid="admin-radar-fee-input"
                      type="number"
                      value={radarFeeInr}
                      onChange={(e) => setRadarFeeInr(Number(e.target.value))}
                      className="w-full min-h-[40px] px-3 py-1.5 bg-[#FFFDF9] border border-[#101014] text-xs font-mono-tabular text-[#101014]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="radar-service-link"
                      className="block font-mono-tabular text-xs font-bold text-[#101014] mb-1"
                    >
                      Pre-Selected Order Service
                    </label>
                    <select
                      id="radar-service-link"
                      value={radarServiceId}
                      onChange={(e) => setRadarServiceId(e.target.value)}
                      className="w-full min-h-[40px] px-3 py-1.5 bg-[#FFFDF9] border border-[#101014] text-xs text-[#101014]"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.titleEn} (₹{s.priceInr})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="radar-docs-input"
                    className="block font-mono-tabular text-xs font-bold text-[#101014] mb-1"
                  >
                    Required Documents (Comma-separated)
                  </label>
                  <input
                    id="radar-docs-input"
                    type="text"
                    value={radarDocsInput}
                    onChange={(e) => setRadarDocsInput(e.target.value)}
                    className="w-full min-h-[40px] px-3 py-1.5 bg-[#FFFDF9] border border-[#101014] text-xs text-[#101014]"
                  />
                </div>

                <button
                  type="submit"
                  data-testid="admin-save-radar-item-btn"
                  className="min-h-[42px] px-5 py-2 bg-[#FF5C35] hover:bg-[#E04823] text-white text-xs font-bold transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {radarEditId
                      ? lang === 'en'
                        ? 'Update Radar Item'
                        : 'रडार आइटम अपडेट करें'
                      : lang === 'en'
                      ? 'Publish to Section 01.B Exam Radar'
                      : 'सेक्शन 01.B परीक्षा रडार में जोड़ें'}
                  </span>
                </button>
              </form>

              {/* Existing Exam Radar Items Table */}
              <div className="overflow-x-auto border border-[#101014]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#101014] text-[#F7F3EA] font-mono-tabular text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">Exam / Scholarship Title</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Dates (Start → Last)</th>
                      <th className="py-3 px-3 text-right">Center Fee</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCD4C6]">
                    {examRadarItems.map((item) => (
                      <tr key={item.id} className="hover:bg-[#F7F3EA]/70">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#101014]">
                            {lang === 'en' ? item.titleEn : item.titleHi}
                          </div>
                          <div className="text-[11px] text-[#787166]">
                            {item.authorityEn || item.portalBadgeEn}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono-tabular uppercase text-[11px] text-[#C83713] font-bold">
                          {item.category}
                        </td>
                        <td className="py-3 px-3 font-mono-tabular">
                          {item.startDate} → <strong>{item.lastDate}</strong>
                        </td>
                        <td className="py-3 px-3 text-right font-mono-tabular font-bold text-[#101014]">
                          ₹{item.feeInr}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setRadarEditId(item.id);
                              setRadarTitleEn(item.titleEn);
                              setRadarTitleHi(item.titleHi);
                              setRadarAuthorityEn(item.authorityEn || item.portalBadgeEn);
                              setRadarAuthorityHi(item.authorityHi || item.portalBadgeHi);
                              setRadarCategory(item.category);
                              setRadarStartDate(item.startDate);
                              setRadarLastDate(item.lastDate);
                              setRadarFeeInr(item.feeInr);
                              setRadarServiceId(item.linkedServiceId || item.matchedServiceId || 'srv-govt-job-form');
                              setRadarDocsInput(item.requiredDocsEn.join(', '));
                              setRadarBadgeEn(item.badgeEn || item.portalBadgeEn);
                            }}
                            className="px-2.5 py-1 bg-[#F7F3EA] hover:bg-[#EFE9DC] border border-[#101014] text-xs font-bold"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (!onSaveExamRadarItems) return;
                              onSaveExamRadarItems(
                                examRadarItems.filter((x) => x.id !== item.id)
                              );
                            }}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SECTION 4: CUSTOMERS DIRECTORY                                    */}
          {/* ================================================================= */}
          {activeSection === 'customers' && (
            <div className="bg-[#FFFDF9] border border-[#101014] p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCD4C6]">
                <div>
                  <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.18em] text-[#C83713]">
                    {lang === 'en'
                      ? '06. CITIZEN DIRECTORY'
                      : '06. ग्राहक सूची'}
                  </div>
                  <h2 className="text-xl font-extrabold text-[#101014] font-display mt-0.5">
                    {lang === 'en'
                      ? `Registered Customers & Order Directory (${customerSummaries.length})`
                      : `ग्राहक सूची और ऑर्डर विवरण (${customerSummaries.length})`}
                  </h2>
                  <p className="text-xs text-[#787166] mt-0.5">
                    {lang === 'en'
                      ? 'Customers who have placed digital service orders with Aditya Online Center'
                      : 'आदित्य ऑनलाइन सेंटर में ऑर्डर करने वाले ग्राहक'}
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <label htmlFor="admin-customer-search" className="sr-only">
                    Search customers
                  </label>
                  <Search className="w-4 h-4 text-[#787166] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-customer-search"
                    type="search"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder={
                      lang === 'en'
                        ? 'Search name, mobile, village...'
                        : 'नाम, मोबाइल या गाँव खोजें...'
                    }
                    className="w-full min-h-[42px] pl-10 pr-4 py-2 bg-[#F7F3EA] border border-[#101014] text-xs sm:text-sm text-[#101014]"
                  />
                </div>
              </div>

              <div className="overflow-x-auto border border-[#101014]">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#101014] text-[#F7F3EA] font-mono-tabular text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">Customer Name</th>
                      <th className="py-3 px-3.5 font-semibold">
                        Mobile & Email
                      </th>
                      <th className="py-3 px-3.5 font-semibold">
                        Village / Town
                      </th>
                      <th className="py-3 px-3.5 font-semibold text-right">
                        Orders (Total / Active)
                      </th>
                      <th className="py-3 px-3.5 font-semibold text-right">
                        Verified Spend
                      </th>
                      <th className="py-3 px-4 font-semibold text-right">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCD4C6]">
                    {filteredCustomers.map((cust) => (
                      <tr
                        key={`${cust.customerId}-${cust.phone}`}
                        className="hover:bg-[#F7F3EA]/70"
                      >
                        <td className="py-3.5 px-4 font-bold text-[#101014]">
                          {cust.name}
                        </td>
                        <td className="py-3.5 px-3.5 font-mono-tabular text-xs">
                          <div className="font-semibold text-[#101014]">
                            {cust.phone}
                          </div>
                          <div className="text-[#787166]">
                            {cust.email || '—'}
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 text-xs text-[#4A463E]">
                          {cust.location}
                        </td>
                        <td className="py-3.5 px-3.5 text-right font-mono-tabular text-xs">
                          <span className="font-bold text-[#101014]">
                            {cust.totalOrders}
                          </span>{' '}
                          <span className="text-[#787166]">
                            ({cust.activeOrders} active)
                          </span>
                        </td>
                        <td className="py-3.5 px-3.5 text-right font-mono-tabular font-bold text-emerald-700">
                          ₹{cust.verifiedSpentInr}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setOrderSearchQuery(cust.phone);
                              setStatusFilter('ALL');
                              setActiveSection('orders');
                            }}
                            className="px-3 py-1.5 bg-[#F7F3EA] hover:bg-[#EFE9DC] border border-[#D4CCBE] text-[#101014] text-xs font-semibold rounded-lg"
                          >
                            {lang === 'en' ? 'View Orders' : 'ऑर्डर देखें'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SECTION 5: PAYMENTS & MANUAL UPI VERIFICATION LEDGER              */}
          {/* ================================================================= */}
          {activeSection === 'payments' && (
            <div className="bg-[#FFFDF9] border border-[#101014] p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCD4C6]">
                <div>
                  <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.18em] text-[#C83713]">
                    {lang === 'en'
                      ? '07. UPI VERIFICATION LEDGER'
                      : '07. मैनुअल UPI भुगतान सत्यापन'}
                  </div>
                  <h2 className="text-xl font-extrabold text-[#101014] font-display mt-0.5">
                    {lang === 'en'
                      ? 'Manual UPI Payment Verification & Ledger'
                      : 'मैनुअल UPI भुगतान सत्यापन और खाता'}
                  </h2>
                  <p className="text-xs text-[#787166] mt-0.5">
                    {lang === 'en'
                      ? 'Verify 12-digit UTR references against your business bank/UPI app before marking payment Verified.'
                      : 'भुगतान को सत्यापित (Verified) करने से पहले अपने UPI ऐप में 12-अंकीय UTR नंबर का मिलान करें।'}
                  </p>
                </div>

                <div className="text-right font-mono-tabular">
                  <div className="text-xs text-[#787166]">
                    {lang === 'en'
                      ? 'Total Verified Revenue'
                      : 'कुल सत्यापित आय'}
                  </div>
                  <div className="text-2xl font-bold text-emerald-700">
                    ₹{orderMetrics.verifiedRevenueInr}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  'ALL',
                  'Pending Verification',
                  'Verified',
                  'Unpaid',
                  'Rejected',
                ].map((pst) => (
                  <button
                    key={pst}
                    type="button"
                    onClick={() => setPaymentStatusFilter(pst)}
                    className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 border ${
                      paymentStatusFilter === pst
                        ? 'bg-[#101014] text-white border-[#101014]'
                        : 'bg-[#F7F3EA] text-[#4A463E] border-[#DCD4C6] hover:bg-[#EFE9DC]'
                    }`}
                  >
                    {pst}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto border border-[#101014]">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-[#101014] text-[#F7F3EA] font-mono-tabular text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold">Order ID</th>
                      <th className="py-3 px-3.5 font-semibold">Customer</th>
                      <th className="py-3 px-3.5 font-semibold text-right">
                        Amount
                      </th>
                      <th className="py-3 px-3.5 font-semibold">
                        UTR / Reference
                      </th>
                      <th className="py-3 px-3.5 font-semibold">
                        Payment Status
                      </th>
                      <th className="py-3 px-4 font-semibold text-right">
                        Verification Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCD4C6]">
                    {filteredPayments.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#F7F3EA]/70">
                        <td className="py-3.5 px-4 font-mono-tabular font-bold text-[#C83E1B] whitespace-nowrap">
                          {ord.orderNumber}
                        </td>
                        <td className="py-3.5 px-3.5">
                          <div className="font-semibold text-[#101014]">
                            {ord.customerName}
                          </div>
                          <div className="text-xs text-[#787166] font-mono-tabular">
                            {ord.customerPhone}
                          </div>
                        </td>
                        <td className="py-3.5 px-3.5 text-right font-mono-tabular font-bold text-[#101014]">
                          ₹{ord.priceInr}
                        </td>
                        <td className="py-3.5 px-3.5 font-mono-tabular text-xs">
                          {ord.paymentUtr ? (
                            <span className="font-bold text-[#101014]">
                              {ord.paymentUtr}
                            </span>
                          ) : (
                            <span className="text-[#787166]">Not submitted</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3.5 text-xs font-semibold">
                          <span
                            className={
                              ord.paymentStatus === 'Verified'
                                ? 'text-emerald-700'
                                : ord.paymentStatus === 'Pending Verification'
                                ? 'text-amber-700'
                                : ord.paymentStatus === 'Rejected'
                                ? 'text-red-700'
                                : 'text-[#787166]'
                            }
                          >
                            {ord.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                await onAdminUpdateOrder(
                                  ord,
                                  {
                                    paymentStatus: 'Verified',
                                    status:
                                      ord.status === 'Payment Verification' ||
                                      ord.status === 'Awaiting Payment'
                                        ? 'In Progress'
                                        : ord.status,
                                  },
                                  `Admin manually verified UPI payment (UTR: ${
                                    ord.paymentUtr || 'Confirmed'
                                  })`
                                );
                                setStatusMessage({
                                  type: 'success',
                                  text: `Verified ₹${ord.priceInr} payment for ${ord.orderNumber}.`,
                                });
                              }}
                              className="min-h-[34px] px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg"
                            >
                              Verify
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await onAdminUpdateOrder(
                                  ord,
                                  {
                                    paymentStatus: 'Rejected',
                                    status: 'Awaiting Payment',
                                  },
                                  'Admin rejected unverified UTR.'
                                );
                                setStatusMessage({
                                  type: 'error',
                                  text: `Rejected payment for ${ord.orderNumber}.`,
                                });
                              }}
                              className="min-h-[34px] px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold rounded-lg"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SECTION 6: CONTACT MESSAGES                                       */}
          {/* ================================================================= */}
          {activeSection === 'messages' && (
            <div className="bg-[#FFFDF9] border border-[#101014] p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DCD4C6]">
                <div>
                  <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.18em] text-[#C83713]">
                    {lang === 'en'
                      ? '08. CITIZEN INQUIRIES'
                      : '08. ग्राहक संपर्क संदेश'}
                  </div>
                  <h2 className="text-xl font-extrabold text-[#101014] font-display mt-0.5">
                    {lang === 'en'
                      ? `Customer Contact Form Inquiries (${contactMessages.length})`
                      : `ग्राहक संपर्क फॉर्म संदेश (${contactMessages.length})`}
                  </h2>
                  <p className="text-xs text-[#4A463E] mt-0.5">
                    {lang === 'en'
                      ? 'Private inquiries submitted from the Contact Us page. Readable and manageable strictly by authorized admins.'
                      : 'संपर्क पेज से भेजे गए निजी संदेश। केवल अधिकृत एडमिन इन्हें देख या प्रबंधित कर सकते हैं।'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {(['ALL', 'New', 'Replied'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setMessageFilter(st)}
                      className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold border ${
                        messageFilter === st
                          ? 'bg-[#101014] text-white border-[#101014]'
                          : 'bg-[#F7F3EA] text-[#4A463E] border-[#DCD4C6] hover:bg-[#EFE9DC]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {filteredMessages.length === 0 ? (
                <div className="p-8 bg-[#F7F3EA] border border-[#DCD4C6] text-center text-sm text-[#4A463E]">
                  {lang === 'en'
                    ? 'No contact messages match the selected filter.'
                    : 'कोई संपर्क संदेश उपलब्ध नहीं है।'}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMessages.map((msg) => (
                    <article
                      key={msg.id}
                      className="p-5 bg-[#F7F3EA] border border-[#101014] space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#DCD4C6]">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-[#101014]">
                              {msg.subject}
                            </h3>
                            <span
                              className={`text-xs font-semibold ${
                                msg.status === 'Replied'
                                  ? 'text-emerald-700'
                                  : 'text-[#C83E1B]'
                              }`}
                            >
                              · {msg.status}
                            </span>
                          </div>
                          <div className="text-xs text-[#787166] font-mono-tabular mt-0.5">
                            {msg.id} ·{' '}
                            {new Date(msg.createdAt).toLocaleString()}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              const next =
                                msg.status === 'New' ? 'Replied' : 'New';
                              await onAdminUpdateContactMessageStatus(
                                msg,
                                next
                              );
                              setStatusMessage({
                                type: 'success',
                                text: `Updated message ${msg.id} status to ${next}.`,
                              });
                            }}
                            className="min-h-[38px] px-3 py-1.5 bg-[#FFFDF9] border border-[#101014] hover:bg-[#EFE9DC] text-xs font-semibold text-[#101014]"
                          >
                            {msg.status === 'New'
                              ? lang === 'en'
                                ? 'Mark as Replied'
                                : 'उत्तर दिया गया चिह्नित करें'
                              : lang === 'en'
                              ? 'Mark as New'
                              : 'नया चिह्नित करें'}
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete message ${msg.id}`}
                            onClick={async () => {
                              await onAdminDeleteContactMessage(msg.id);
                              setStatusMessage({
                                type: 'success',
                                text: `Deleted message ${msg.id}.`,
                              });
                            }}
                            className="min-h-[38px] px-3 py-1.5 bg-red-50 border border-red-200 hover:bg-red-100 text-xs font-semibold text-red-800 flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{lang === 'en' ? 'Delete' : 'हटाएं'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-[#4A463E]">
                        <div>
                          <span className="font-semibold text-[#101014]">
                            {lang === 'en' ? 'Sender: ' : 'नाम: '}
                          </span>
                          {msg.name}
                        </div>
                        <div>
                          <span className="font-semibold text-[#101014]">
                            {lang === 'en' ? 'Phone: ' : 'फ़ोन: '}
                          </span>
                          <span className="font-mono-tabular">{msg.phone}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-[#101014]">
                            {lang === 'en' ? 'Email: ' : 'ईमेल: '}
                          </span>
                          <span className="font-mono-tabular">
                            {msg.email || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold text-[#101014]">
                            {lang === 'en'
                              ? 'Order ID / Lang: '
                              : 'ऑर्डर आईडी / भाषा: '}
                          </span>
                          <span className="font-mono-tabular">
                            {msg.orderId || '—'} (
                            {msg.preferredLanguage.toUpperCase()})
                          </span>
                        </div>
                      </div>

                      <p className="text-sm text-[#101014] bg-[#FFFDF9] border border-[#DCD4C6] p-3 leading-relaxed">
                        {msg.message}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================= */}
          {/* SECTION 7: UPI & CENTER SETTINGS                                  */}
          {/* ================================================================= */}
          {activeSection === 'settings' && (
            <div className="bg-[#FFFDF9] border border-[#101014] p-6 sm:p-8 space-y-6">
              <div className="pb-4 border-b border-[#DCD4C6]">
                <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.18em] text-[#C83713]">
                  {lang === 'en'
                    ? '09. CENTER CONFIGURATION & UPI'
                    : '09. केंद्र सेटिंग्स और आधिकारिक UPI'}
                </div>
                <h2 className="text-xl font-extrabold text-[#101014] font-display mt-0.5">
                  {lang === 'en'
                    ? 'Configure Official Business UPI & Center Settings'
                    : 'आधिकारिक व्यावसायिक UPI और केंद्र सेटिंग्स'}
                </h2>
                <p className="text-sm text-[#4A463E] mt-1">
                  {lang === 'en'
                    ? 'Customers will only see a UPI ID and QR code after you configure and enable them here. No fake payment details are shown by default.'
                    : 'यहाँ कॉन्फ़िगर और सक्रिय करने के बाद ही ग्राहकों को आपका आधिकारिक UPI आईडी और QR कोड दिखाई देगा।'}
                </p>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await onAdminSaveSettings({
                    ...settings,
                    upiId: sanitizeString(upiId, 100),
                    payeeName: sanitizeString(payeeName, 100),
                    qrCodeDataUrl: qrDataUrl,
                    paymentInstructionsEn: sanitizeString(payInstrEn, 600),
                    paymentInstructionsHi: sanitizeString(payInstrHi, 600),
                    isUpiConfigured: isUpiEnabled && Boolean(upiId.trim()),
                    shopPhone: sanitizeString(shopPhone, 30),
                    updatedAt: new Date().toISOString(),
                  });
                  setStatusMessage({
                    type: 'success',
                    text:
                      lang === 'en'
                        ? 'Business UPI & Center settings saved to Firestore successfully.'
                        : 'UPI और केंद्र सेटिंग्स सफलतापूर्वक सुरक्षित कर ली गईं।',
                  });
                }}
                className="space-y-4 max-w-3xl"
              >
                <div className="flex items-center gap-3 p-4 bg-[#F7F3EA] border border-[#E6DFD3] rounded-xl">
                  <input
                    id="enable-upi-checkbox"
                    type="checkbox"
                    checked={isUpiEnabled}
                    onChange={(e) => setIsUpiEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-[#D4CCBE] accent-[#FF5C35]"
                  />
                  <label
                    htmlFor="enable-upi-checkbox"
                    className="text-sm font-semibold text-[#101014]"
                  >
                    {lang === 'en'
                      ? 'Display Official UPI Payment Details to Customers'
                      : 'ग्राहकों को आधिकारिक UPI भुगतान विवरण दिखाएं'}
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="admin-upi-id"
                      className="block text-xs font-semibold text-[#101014] mb-1"
                    >
                      Official Business UPI ID (VPA)
                    </label>
                    <input
                      id="admin-upi-id"
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="Enter your real business UPI ID"
                      className="w-full min-h-[44px] px-3.5 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-sm font-mono-tabular text-[#101014]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="admin-payee-name"
                      className="block text-xs font-semibold text-[#101014] mb-1"
                    >
                      Merchant / Payee Name
                    </label>
                    <input
                      id="admin-payee-name"
                      type="text"
                      value={payeeName}
                      onChange={(e) => setPayeeName(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-sm text-[#101014]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-shop-phone"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Center Contact / WhatsApp Helpdesk Number
                  </label>
                  <input
                    id="admin-shop-phone"
                    type="text"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-sm font-mono-tabular text-[#101014]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="admin-pay-instr-en"
                      className="block text-xs font-semibold text-[#101014] mb-1"
                    >
                      Payment Instructions (English)
                    </label>
                    <textarea
                      id="admin-pay-instr-en"
                      rows={3}
                      value={payInstrEn}
                      onChange={(e) => setPayInstrEn(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs text-[#101014]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="admin-pay-instr-hi"
                      className="block text-xs font-semibold text-[#101014] mb-1"
                    >
                      Payment Instructions (Hindi / हिन्दी)
                    </label>
                    <textarea
                      id="admin-pay-instr-hi"
                      rows={3}
                      value={payInstrHi}
                      onChange={(e) => setPayInstrHi(e.target.value)}
                      className="w-full px-3.5 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs text-[#101014]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101014] mb-1.5">
                    Upload Official Merchant UPI QR Code Image (PNG / JPG)
                  </label>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () =>
                        setQrDataUrl(String(reader.result || ''));
                      reader.readAsDataURL(file);
                    }}
                    className="block w-full text-xs text-[#4A463E] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#FFF2ED] file:text-[#C83E1B] hover:file:bg-[#FFE3D8]"
                  />
                </div>

                <button
                  type="submit"
                  className="min-h-[48px] px-6 py-2.5 bg-[#FF5C35] hover:bg-[#E04823] text-white text-sm font-bold rounded-xl transition-colors"
                >
                  Save UPI & Center Configuration
                </button>
              </form>

              {/* Project Source & Google Drive Cloud Backup Card */}
              <div className="mt-8 pt-6 border-t border-[#DCD4C6]">
                <div className="p-5 bg-[#181822] text-[#F7F3EA] border border-white/10 rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <FolderArchive className="w-5 h-5 text-[#FFB547]" />
                      <div>
                        <h3 className="font-bold text-sm text-[#F7F3EA]">
                          {lang === 'en'
                            ? 'Complete Project Backup & Google Drive Export'
                            : 'प्रोजेक्ट बैकअप एवं गूगल ड्राइव एक्सपोर्ट'}
                        </h3>
                        <p className="text-xs text-[#A39E93]">
                          {lang === 'en'
                            ? 'Source archive: aditya-online-center.zip (~8.5 MB)'
                            : 'सोर्स कोड आर्काइव: aditya-online-center.zip (~8.5 MB)'}
                        </p>
                      </div>
                    </div>
                    {onOpenBackupModal && (
                      <button
                        type="button"
                        onClick={onOpenBackupModal}
                        className="px-4 py-2 bg-[#FF5C35] hover:bg-[#E04823] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm rounded-lg"
                      >
                        <CloudUpload className="w-4 h-4" />
                        <span>
                          {lang === 'en' ? 'Open Backup Hub' : 'बैकअप हब खोलें'}
                        </span>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <a
                      href="/downloads/aditya-online-center.zip"
                      download="aditya-online-center.zip"
                      className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-between text-[#F7F3EA] transition-colors"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <Download className="w-4 h-4 text-[#38BDF8]" />
                        <span>{lang === 'en' ? 'Direct ZIP Download' : 'डायरेक्ट ZIP डाउनलोड'}</span>
                      </span>
                      <span className="font-mono-tabular text-[11px] text-[#A39E93]">8.5 MB</span>
                    </a>
                    <div className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center gap-2 text-[#A39E93]">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-[11px]">
                        {lang === 'en'
                          ? 'Clean archive excluding node_modules'
                          : 'बिना node_modules के सुरक्षित आर्काइव'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: VIEW SERVICE DETAILS INSPECTOR                               */}
      {/* ===================================================================== */}
      {inspectedService && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="view-service-modal-title"
          className="fixed inset-0 z-50 bg-[#101014]/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl max-w-2xl w-full p-6 space-y-5 my-8">
            <div className="flex items-start justify-between gap-4 border-b border-[#E6DFD3] pb-4">
              <div>
                <div className="text-xs font-mono-tabular text-[#C83E1B] font-semibold">
                  {inspectedService.id} ·{' '}
                  {getCategoryLabel(inspectedService.category)} ·{' '}
                  {inspectedService.isActive ? 'Active' : 'Inactive'}
                </div>
                <h2
                  id="view-service-modal-title"
                  className="text-xl font-bold text-[#101014] mt-1 font-display"
                >
                  {inspectedService.titleEn}
                </h2>
                <div className="text-sm text-[#4A463E] mt-0.5">
                  {inspectedService.titleHi}
                </div>
              </div>
              <button
                type="button"
                aria-label="Close service details modal"
                onClick={() => setInspectedService(null)}
                className="p-2 text-[#787166] hover:bg-[#F7F3EA] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F7F3EA] border border-[#E6DFD3] rounded-xl p-4 text-xs">
              <div>
                <div className="text-[#787166]">Base Price</div>
                <div className="text-base font-bold text-[#101014] font-mono-tabular mt-0.5">
                  ₹{inspectedService.priceInr}
                </div>
              </div>
              <div>
                <div className="text-[#787166]">Min / Max Price</div>
                <div className="text-sm font-semibold text-[#101014] font-mono-tabular mt-0.5">
                  {inspectedService.minPriceInr || inspectedService.maxPriceInr
                    ? `₹${inspectedService.minPriceInr || 0} – ₹${
                        inspectedService.maxPriceInr || 0
                      }`
                    : 'Fixed Rate'}
                </div>
              </div>
              <div>
                <div className="text-[#787166]">Turnaround</div>
                <div className="text-sm font-semibold text-[#101014] mt-0.5">
                  {inspectedService.estimatedTimeEn}
                </div>
              </div>
              <div>
                <div className="text-[#787166]">Featured</div>
                <div className="text-sm font-semibold text-[#101014] mt-0.5">
                  {inspectedService.featured ? 'Yes (Home Featured)' : 'Standard'}
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <div className="font-bold text-[#101014]">
                  Description (English & Hindi):
                </div>
                <p className="text-[#4A463E] mt-1">
                  {inspectedService.descEn}
                </p>
                <p className="text-[#787166] mt-1">
                  {inspectedService.descHi}
                </p>
              </div>

              <div>
                <div className="font-bold text-[#101014] mb-2">
                  Configured Document Checklist:
                </div>
                <div className="flex flex-wrap gap-2">
                  {getServiceDocumentRequirements(inspectedService, documentLibrary).map(
                    (req) => (
                      <span
                        key={req.docId}
                        className="inline-flex items-center gap-1.5 text-xs bg-[#F7F3EA] border border-[#E6DFD3] px-3 py-1.5 rounded-lg text-[#101014]"
                      >
                        <span className="font-semibold">
                          {cleanDocumentLabel(req.labelEn)}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            req.required
                              ? 'bg-[#FFECE8] text-[#C83713]'
                              : 'bg-[#E6DFD3] text-[#4A463E]'
                          }`}
                        >
                          {req.required ? 'Required' : 'Optional'}
                        </span>
                      </span>
                    )
                  )}
                </div>
              </div>

              {(inspectedService.instructionsEn ||
                inspectedService.instructionsHi) && (
                <div>
                  <div className="font-bold text-[#101014]">
                    Detailed Instructions & Customer Notes:
                  </div>
                  {inspectedService.instructionsEn && (
                    <p className="text-[#4A463E] mt-1">
                      {inspectedService.instructionsEn}
                    </p>
                  )}
                  {inspectedService.instructionsHi && (
                    <p className="text-[#787166] mt-1">
                      {inspectedService.instructionsHi}
                    </p>
                  )}
                </div>
              )}

              <div>
                <div className="font-bold text-[#101014] mb-1.5">
                  Custom Order Form Fields:
                </div>
                {(() => {
                  try {
                    const fields: ServiceCustomField[] = JSON.parse(
                      inspectedService.customFieldsJson || '[]'
                    );
                    if (!Array.isArray(fields) || fields.length === 0) {
                      return (
                        <p className="text-xs text-[#787166]">
                          No custom fields configured (uses standard customer
                          contact and upload fields).
                        </p>
                      );
                    }
                    return (
                      <ul className="divide-y divide-[#E6DFD3] border border-[#E6DFD3] rounded-xl bg-[#F7F3EA]">
                        {fields.map((f) => (
                          <li
                            key={f.id}
                            className="p-2.5 text-xs flex items-center justify-between gap-2"
                          >
                            <div>
                              <span className="font-semibold text-[#101014]">
                                {f.labelEn}
                              </span>{' '}
                              <span className="text-[#4A463E]">
                                ({f.labelHi})
                              </span>
                            </div>
                            <span className="font-mono-tabular text-[#787166]">
                              {f.type} · {f.required ? 'Required' : 'Optional'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    );
                  } catch {
                    return null;
                  }
                })()}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-[#E6DFD3]">
              <button
                type="button"
                onClick={() => {
                  const target = inspectedService;
                  setInspectedService(null);
                  handleDuplicateServiceAction(target);
                }}
                className="min-h-[40px] px-4 py-2 bg-[#F7F3EA] hover:bg-[#EFE9DC] border border-[#D4CCBE] text-[#101014] text-xs font-semibold rounded-xl flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate Service</span>
              </button>
              <button
                type="button"
                onClick={() => openEditServiceModal(inspectedService)}
                className="min-h-[40px] px-4 py-2 bg-[#FF5C35] hover:bg-[#E04823] text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Service</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: ADD / EDIT SERVICE FULL CRUD EDITOR                          */}
      {/* ===================================================================== */}
      {serviceEditorOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-editor-modal-title"
          className="fixed inset-0 z-50 bg-[#101014]/70 backdrop-blur-xs flex items-start justify-center p-4 overflow-y-auto"
        >
          <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 my-6">
            <div className="flex items-center justify-between gap-4 border-b border-[#E6DFD3] pb-4">
              <div>
                <div className="text-xs font-semibold text-[#C83E1B]">
                  {serviceEditorMode === 'create'
                    ? 'Create Catalog Service'
                    : `Editing Service · ${formId}`}
                </div>
                <h2
                  id="service-editor-modal-title"
                  className="text-xl font-bold text-[#101014] mt-0.5 font-display"
                >
                  {serviceEditorMode === 'create'
                    ? lang === 'en'
                      ? 'Add New Digital Service'
                      : 'नई डिजिटल सेवा जोड़ें'
                    : lang === 'en'
                    ? 'Edit Digital Service'
                    : 'डिजिटल सेवा संपादित करें'}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close service editor"
                onClick={() => setServiceEditorOpen(false)}
                className="p-2 text-[#787166] hover:bg-[#F7F3EA] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {serviceFormError && (
              <div
                role="alert"
                className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs sm:text-sm text-red-800 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                <span>{serviceFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveServiceForm} className="space-y-5">
              {/* Row 1: Category & Optional Custom Service ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="srv-form-category"
                      className="block text-xs font-semibold text-[#101014]"
                    >
                      Service Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => openCreateCategoryModal()}
                      className="text-xs font-semibold text-[#FF5C35] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'en' ? '+ New Category' : '+ नयी श्रेणी'}
                      </span>
                    </button>
                  </div>
                  <select
                    id="srv-form-category"
                    value={formCategory}
                    onChange={(e) =>
                      setFormCategory(e.target.value as ServiceCategoryKey)
                    }
                    className="w-full min-h-[42px] px-3 py-2 border border-[#D4CCBE] rounded-xl text-sm bg-[#F7F3EA] text-[#101014]"
                  >
                    {categoriesList
                      .filter((c) => c.key !== 'all')
                      .map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.labelEn} ({c.labelHi})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="srv-form-id"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Unique Service ID (Auto-generated if blank)
                  </label>
                  <input
                    id="srv-form-id"
                    type="text"
                    disabled={serviceEditorMode === 'edit'}
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="e.g., srv-pan-card-update"
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] disabled:opacity-60 rounded-xl text-sm font-mono-tabular text-[#101014]"
                  />
                </div>
              </div>

              {/* Row 2: Bilingual Service Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="srv-form-title-en"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Service Name (English) *
                  </label>
                  <input
                    id="srv-form-title-en"
                    type="text"
                    required
                    value={formTitleEn}
                    onChange={(e) => setFormTitleEn(e.target.value)}
                    placeholder="e.g., Passport Size Photo Sheet Preparation"
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-sm text-[#101014]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="srv-form-title-hi"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Service Name (Hindi / हिन्दी) *
                  </label>
                  <input
                    id="srv-form-title-hi"
                    type="text"
                    value={formTitleHi}
                    onChange={(e) => setFormTitleHi(e.target.value)}
                    placeholder="जैसे: पासपोर्ट साइज फोटो शीट"
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-sm text-[#101014]"
                  />
                </div>
              </div>

              {/* Row 3: Bilingual Short Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="srv-form-desc-en"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Short Description (English) *
                  </label>
                  <textarea
                    id="srv-form-desc-en"
                    rows={3}
                    value={formDescEn}
                    onChange={(e) => setFormDescEn(e.target.value)}
                    placeholder="Describe what is included in this service..."
                    className="w-full px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs sm:text-sm text-[#101014]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="srv-form-desc-hi"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Short Description (Hindi / हिन्दी) *
                  </label>
                  <textarea
                    id="srv-form-desc-hi"
                    rows={3}
                    value={formDescHi}
                    onChange={(e) => setFormDescHi(e.target.value)}
                    placeholder="हिंदी में सेवा का संक्षिप्त विवरण लिखें..."
                    className="w-full px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs sm:text-sm text-[#101014]"
                  />
                </div>
              </div>

              {/* Row 4: Base Price, Optional Min/Max Price, and Turnaround Times */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label
                    htmlFor="srv-form-price"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Base Price (₹) *
                  </label>
                  <input
                    id="srv-form-price"
                    type="number"
                    min={0}
                    required
                    value={formPriceInr}
                    onChange={(e) => setFormPriceInr(Number(e.target.value))}
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-sm font-mono-tabular text-[#101014]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="srv-form-min-price"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Min Price (₹ Opt)
                  </label>
                  <input
                    id="srv-form-min-price"
                    type="number"
                    min={0}
                    value={formMinPriceInr}
                    onChange={(e) => setFormMinPriceInr(e.target.value)}
                    placeholder="50"
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-sm font-mono-tabular text-[#101014]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="srv-form-max-price"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Max Price (₹ Opt)
                  </label>
                  <input
                    id="srv-form-max-price"
                    type="number"
                    min={0}
                    value={formMaxPriceInr}
                    onChange={(e) => setFormMaxPriceInr(e.target.value)}
                    placeholder="120"
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-sm font-mono-tabular text-[#101014]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="srv-form-eta-en"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Turnaround (EN) *
                  </label>
                  <input
                    id="srv-form-eta-en"
                    type="text"
                    required
                    value={formEtaEn}
                    onChange={(e) => setFormEtaEn(e.target.value)}
                    placeholder="2 to 4 Hours"
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs sm:text-sm text-[#101014]"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label
                    htmlFor="srv-form-eta-hi"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Turnaround (HI)
                  </label>
                  <input
                    id="srv-form-eta-hi"
                    type="text"
                    value={formEtaHi}
                    onChange={(e) => setFormEtaHi(e.target.value)}
                    placeholder="2 से 4 घंटे"
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs sm:text-sm text-[#101014]"
                  />
                </div>
              </div>

              {/* Row 5: Visual Document Checklist Builder (Replaces manual typing) */}
              <div className="p-4 sm:p-5 bg-[#F7F3EA] border border-[#E6DFD3] rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-[#101014] font-display">
                        {lang === 'en'
                          ? `Document Requirements Checklist (${formDocRequirements.length})`
                          : `दस्तावेज़ आवश्यकता चेकलिस्ट (${formDocRequirements.length})`}
                      </h3>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#101014] text-[#F7F3EA] font-mono-tabular">
                        {formDocRequirements.filter((r) => r.required).length}{' '}
                        {lang === 'en' ? 'Required' : 'अनिवार्य'} ·{' '}
                        {formDocRequirements.filter((r) => !r.required).length}{' '}
                        {lang === 'en' ? 'Optional' : 'वैकल्पिक'}
                      </span>
                    </div>
                    <p className="text-xs text-[#5C5852] mt-0.5">
                      {lang === 'en'
                        ? 'Select and configure separate document slots that the customer must upload when ordering this service.'
                        : 'इस सेवा के लिए आवश्यक दस्तावेज़ चुनें। ग्राहक को प्रत्येक दस्तावेज़ के लिए अलग अपलोड फ़ील्ड दिखेगा।'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openCreateCustomDocModal}
                    className="min-h-[38px] px-3.5 py-1.5 bg-[#101014] hover:bg-[#272732] text-[#F7F3EA] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#FF5C35]" />
                    <span>
                      {lang === 'en'
                        ? 'Create Custom Document'
                        : 'नया दस्तावेज़ बनाएं'}
                    </span>
                  </button>
                </div>

                {/* Searchable Predefined Document Library with Selectable Checkbox Cards */}
                <div className="p-3.5 bg-[#FFFDF9] border border-[#E6DFD3] rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-[#101014] block">
                        {lang === 'en'
                          ? '1. Select Documents from Predefined Library (Check to Include):'
                          : '1. पूर्व-निर्धारित लाइब्रेरी से दस्तावेज़ चुनें (चेकबॉक्स चुनें):'}
                      </span>
                      <span className="text-[11px] text-[#787166]">
                        {lang === 'en'
                          ? 'Check or uncheck any document card below to add or remove it from this service.'
                          : 'इस सेवा में दस्तावेज़ जोड़ने या हटाने के लिए नीचे किसी भी कार्ड को चेक/अनचेक करें।'}
                      </span>
                    </div>
                    <div className="relative w-full sm:w-64">
                      <Search className="w-3.5 h-3.5 text-[#787166] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="search"
                        aria-label="Filter reusable document library"
                        value={docBuilderSearch}
                        onChange={(e) => setDocBuilderSearch(e.target.value)}
                        placeholder={
                          lang === 'en'
                            ? 'Search library (Aadhaar, PAN, Photo)...'
                            : 'लाइब्रेरी खोजें (आधार, पैन, फोटो)...'
                        }
                        className="w-full min-h-[36px] pl-8 pr-2.5 py-1 bg-[#F7F3EA] border border-[#DCD4C6] rounded-lg text-xs text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div
                    data-testid="admin-doc-library-picker"
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1"
                  >
                    {documentLibrary
                      .filter((lib) => {
                        if (!docBuilderSearch.trim()) return true;
                        const q = docBuilderSearch.toLowerCase();
                        return (
                          lib.labelEn.toLowerCase().includes(q) ||
                          lib.labelHi.toLowerCase().includes(q) ||
                          lib.id.toLowerCase().includes(q) ||
                          lib.categoryTag.toLowerCase().includes(q)
                        );
                      })
                      .map((lib) => {
                        const isAdded = formDocRequirements.some(
                          (r) => r.docId === lib.id
                        );
                        return (
                          <label
                            key={lib.id}
                            data-testid={`lib-checkbox-card-${lib.id}`}
                            className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 cursor-pointer transition-all select-none ${
                              isAdded
                                ? 'bg-[#FFF3EE] border-[#FF5C35] shadow-2xs'
                                : 'bg-[#F7F3EA]/70 border-[#E6DFD3] hover:border-[#101014]/40'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isAdded}
                              onChange={() => {
                                if (isAdded) {
                                  handleRemoveDocRequirement(lib.id);
                                } else {
                                  handleAddLibraryItemToService(lib);
                                }
                              }}
                              className="mt-0.5 w-4 h-4 rounded border-[#D4CCBE] accent-[#FF5C35] shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-[#101014] truncate">
                                {cleanDocumentLabel(lib.labelEn)}
                              </div>
                              <div className="text-[11px] text-[#5C5852] truncate">
                                {cleanDocumentLabel(lib.labelHi)}
                              </div>
                              <div className="text-[10px] font-mono-tabular text-[#787166] mt-0.5">
                                {lib.acceptedFormats.map((f) => f.toUpperCase()).join('/')} · {Math.min(500, lib.maxSizeKb)}KB
                              </div>
                            </div>
                          </label>
                        );
                      })}
                  </div>
                </div>

                {/* Selected Requirements Configuration List */}
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-[#101014]">
                    {lang === 'en'
                      ? `2. Configure Selected Service Documents (${formDocRequirements.length}):`
                      : `2. चयनित दस्तावेज़ों की सेटिंग्स (${formDocRequirements.length}):`}
                  </div>

                  {formDocRequirements.length === 0 ? (
                    <div className="p-6 bg-[#FFFDF9] border border-dashed border-[#DCD4C6] rounded-xl text-center space-y-2">
                      <p className="text-xs font-semibold text-[#101014]">
                        {lang === 'en'
                          ? 'No documents selected yet for this service.'
                          : 'इस सेवा के लिए अभी कोई दस्तावेज़ नहीं चुना गया है।'}
                      </p>
                      <p className="text-[11px] text-[#787166]">
                        {lang === 'en'
                          ? 'Check any document from the library above or click "Create Custom Document".'
                          : 'ऊपर लाइब्रेरी से किसी भी दस्तावेज़ को चेक करें या नया दस्तावेज़ बनाएं।'}
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-3" data-testid="admin-selected-docs-list">
                      {formDocRequirements.map((req, idx) => {
                        const cleanEn = cleanDocumentLabel(req.labelEn);
                        const cleanHi = cleanDocumentLabel(req.labelHi || req.labelEn);
                        return (
                          <li
                            key={req.docId}
                            data-testid={`selected-doc-row-${req.docId}`}
                            className="p-3.5 bg-[#FFFDF9] border border-[#E6DFD3] rounded-xl space-y-3 shadow-2xs"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {/* Reorder Buttons */}
                                <div className="flex items-center gap-0.5 shrink-0 bg-[#F7F3EA] border border-[#DCD4C6] rounded-lg p-0.5">
                                  <button
                                    type="button"
                                    aria-label={`Move ${cleanEn} up`}
                                    disabled={idx === 0}
                                    onClick={() =>
                                      handleReorderDocRequirement(idx, 'up')
                                    }
                                    className="p-1 text-[#5C5852] hover:text-[#101014] disabled:opacity-30 disabled:hover:text-[#5C5852]"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`Move ${cleanEn} down`}
                                    disabled={idx === formDocRequirements.length - 1}
                                    onClick={() =>
                                      handleReorderDocRequirement(idx, 'down')
                                    }
                                    className="p-1 text-[#5C5852] hover:text-[#101014] disabled:opacity-30 disabled:hover:text-[#5C5852]"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <span className="font-mono-tabular text-xs font-bold text-[#787166]">
                                  #{String(idx + 1).padStart(2, '0')}
                                </span>

                                <div className="min-w-0">
                                  <div className="font-bold text-xs sm:text-sm text-[#101014] truncate">
                                    {cleanEn}
                                    {cleanHi && cleanHi !== cleanEn && (
                                      <span className="text-[#787166] font-normal">
                                        {' '}({cleanHi})
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-mono-tabular text-[#A09D96]">
                                    ID: {req.docId}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {/* Segmented Required / Optional Switch */}
                                <div
                                  role="group"
                                  aria-label={`Status for ${cleanEn}`}
                                  className="inline-flex rounded-lg bg-[#F7F3EA] p-0.5 border border-[#DCD4C6]"
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!req.required) handleToggleDocRequired(req.docId);
                                    }}
                                    className={`min-h-[30px] px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                                      req.required
                                        ? 'bg-[#FF5C35] text-white shadow-2xs'
                                        : 'text-[#5C5852] hover:text-[#101014]'
                                    }`}
                                  >
                                    {lang === 'en' ? 'Required' : 'अनिवार्य'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (req.required) handleToggleDocRequired(req.docId);
                                    }}
                                    className={`min-h-[30px] px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                                      !req.required
                                        ? 'bg-[#101014] text-[#F7F3EA] shadow-2xs'
                                        : 'text-[#5C5852] hover:text-[#101014]'
                                    }`}
                                  >
                                    {lang === 'en' ? 'Optional' : 'वैकल्पिक'}
                                  </button>
                                </div>

                                {/* Remove from Service Button */}
                                <button
                                  type="button"
                                  aria-label={`Remove ${cleanEn} from service`}
                                  onClick={() =>
                                    handleRemoveDocRequirement(req.docId)
                                  }
                                  className="min-h-[32px] min-w-[32px] flex items-center justify-center text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Format, Max Size & Instructions Controls */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2.5 border-t border-[#F0EAE0] text-xs">
                              {/* Allowed Formats */}
                              <div className="sm:col-span-5 space-y-1">
                                <span className="block text-[11px] font-semibold text-[#5C5852]">
                                  {lang === 'en'
                                    ? 'Allowed Formats:'
                                    : 'अनुमत प्रारूप:'}
                                </span>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {(['pdf', 'jpg', 'png', 'docx'] as AllowedDocFormat[]).map(
                                    (fmt) => {
                                      const checked = req.allowedFormats.includes(fmt);
                                      return (
                                        <button
                                          key={fmt}
                                          type="button"
                                          onClick={() =>
                                            handleToggleFormatForRequirement(
                                              req.docId,
                                              fmt
                                            )
                                          }
                                          className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase transition-colors ${
                                            checked
                                              ? 'bg-[#101014] text-[#F7F3EA]'
                                              : 'bg-[#F7F3EA] text-[#A09D96] border border-[#E6DFD3]'
                                          }`}
                                        >
                                          {fmt}
                                        </button>
                                      );
                                    }
                                  )}
                                </div>
                              </div>

                              {/* Max Size Selector (capped at 500 KB per Firestore security rules) */}
                              <div className="sm:col-span-3 space-y-1">
                                <label
                                  htmlFor={`size-select-${req.docId}`}
                                  className="block text-[11px] font-semibold text-[#5C5852]"
                                >
                                  {lang === 'en' ? 'Max Size:' : 'अधिकतम साइज:'}
                                </label>
                                <select
                                  id={`size-select-${req.docId}`}
                                  value={Math.min(500, req.maxSizeKb)}
                                  onChange={(e) =>
                                    handleUpdateDocMaxSize(
                                      req.docId,
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-full min-h-[32px] px-2 py-1 bg-white border border-[#DCD4C6] rounded-lg text-xs font-mono-tabular text-[#101014]"
                                >
                                  <option value={100}>100 KB</option>
                                  <option value={200}>200 KB</option>
                                  <option value={300}>300 KB</option>
                                  <option value={400}>400 KB</option>
                                  <option value={500}>500 KB (Max)</option>
                                </select>
                              </div>

                              {/* Per-Document Instruction Note (EN) */}
                              <div className="sm:col-span-4 space-y-1">
                                <label
                                  htmlFor={`instr-en-${req.docId}`}
                                  className="block text-[11px] font-semibold text-[#5C5852]"
                                >
                                  {lang === 'en'
                                    ? 'Upload Note for Customer:'
                                    : 'अपलोड निर्देश:'}
                                </label>
                                <input
                                  id={`instr-en-${req.docId}`}
                                  type="text"
                                  value={req.instructionsEn || ''}
                                  onChange={(e) =>
                                    handleUpdateDocInstructions(
                                      req.docId,
                                      'instructionsEn',
                                      e.target.value
                                    )
                                  }
                                  placeholder={
                                    lang === 'en'
                                      ? 'e.g. Front & Back in single file'
                                      : 'जैसे: दोनों तरफ एक ही फाइल में'
                                  }
                                  className="w-full min-h-[32px] px-2 py-1 bg-white border border-[#DCD4C6] rounded-lg text-xs text-[#101014]"
                                />
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="srv-form-instr-en"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Detailed Instructions / Customer Notes (English)
                  </label>
                  <textarea
                    id="srv-form-instr-en"
                    rows={2}
                    value={formInstructionsEn}
                    onChange={(e) => setFormInstructionsEn(e.target.value)}
                    placeholder="Special instructions shown on service detail page..."
                    className="w-full px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs text-[#101014]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="srv-form-instr-hi"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Detailed Instructions / Customer Notes (Hindi)
                  </label>
                  <textarea
                    id="srv-form-instr-hi"
                    rows={2}
                    value={formInstructionsHi}
                    onChange={(e) => setFormInstructionsHi(e.target.value)}
                    placeholder="ग्राहकों के लिए विशेष निर्देश..."
                    className="w-full px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs text-[#101014]"
                  />
                </div>
              </div>

              {/* Row 6: Active & Featured Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[#F7F3EA] border border-[#E6DFD3] rounded-xl">
                <label className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#101014] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-[#D4CCBE] accent-[#FF5C35]"
                  />
                  <span>
                    Active Service (Immediately visible in customer catalog)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#101014] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="w-4 h-4 rounded border-[#D4CCBE] accent-[#FF5C35]"
                  />
                  <span>Featured Service (Highlight on Home page)</span>
                </label>
              </div>

              {/* Row 7: Dynamic Custom Order Form Fields Builder */}
              <div className="p-4 bg-[#F7F3EA] border border-[#E6DFD3] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-[#101014]">
                      Custom Order Form Fields ({formCustomFields.length})
                    </div>
                    <p className="text-[11px] text-[#787166]">
                      Configure service-specific questions asked when a customer
                      orders this service
                    </p>
                  </div>
                </div>

                {formCustomFields.length > 0 && (
                  <ul className="space-y-2">
                    {formCustomFields.map((cf, idx) => (
                      <li
                        key={cf.id}
                        className="p-2.5 bg-[#FFFDF9] border border-[#E6DFD3] rounded-lg text-xs flex items-center justify-between gap-2"
                      >
                        <div>
                          <span className="font-semibold text-[#101014]">
                            {idx + 1}. {cf.labelEn}
                          </span>{' '}
                          <span className="text-[#787166]">({cf.labelHi})</span>{' '}
                          <span className="font-mono-tabular text-[#C83E1B]">
                            [{cf.type} · {cf.required ? 'Required' : 'Optional'}
                            ]
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setFormCustomFields((prev) =>
                              prev.filter((item) => item.id !== cf.id)
                            )
                          }
                          className="text-red-700 hover:underline font-semibold"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-[#E6DFD3]">
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      aria-label="Custom field English label"
                      value={newFieldLabelEn}
                      onChange={(e) => setNewFieldLabelEn(e.target.value)}
                      placeholder="Field Label (EN) e.g. Exam Name"
                      className="w-full min-h-[38px] px-2.5 py-1.5 bg-[#FFFDF9] border border-[#D4CCBE] rounded-lg text-xs text-[#101014]"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      aria-label="Custom field Hindi label"
                      value={newFieldLabelHi}
                      onChange={(e) => setNewFieldLabelHi(e.target.value)}
                      placeholder="Field Label (HI) जैसे परीक्षा का नाम"
                      className="w-full min-h-[38px] px-2.5 py-1.5 bg-[#FFFDF9] border border-[#D4CCBE] rounded-lg text-xs text-[#101014]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <select
                      aria-label="Custom field input type"
                      value={newFieldType}
                      onChange={(e) =>
                        setNewFieldType(
                          e.target.value as 'text' | 'textarea' | 'select'
                        )
                      }
                      className="w-full min-h-[38px] px-2 py-1.5 bg-[#FFFDF9] border border-[#D4CCBE] rounded-lg text-xs text-[#101014]"
                    >
                      <option value="text">Text</option>
                      <option value="textarea">Textarea</option>
                      <option value="select">Dropdown</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddCustomFieldToDraft}
                      className="w-full min-h-[38px] px-3 py-1.5 bg-[#101014] hover:bg-[#24242C] text-white text-xs font-semibold rounded-lg"
                    >
                      + Add Field
                    </button>
                  </div>
                  {newFieldType === 'select' && (
                    <div className="sm:col-span-12">
                      <input
                        type="text"
                        value={newFieldOptions}
                        onChange={(e) => setNewFieldOptions(e.target.value)}
                        placeholder="Dropdown options (comma-separated): e.g., English, Hindi, Bilingual"
                        className="w-full min-h-[38px] px-2.5 py-1.5 bg-[#FFFDF9] border border-[#D4CCBE] rounded-lg text-xs text-[#101014]"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit / Cancel Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6DFD3]">
                <button
                  type="button"
                  onClick={() => setServiceEditorOpen(false)}
                  className="min-h-[44px] px-5 py-2 bg-[#F7F3EA] hover:bg-[#EFE9DC] border border-[#D4CCBE] text-[#101014] text-xs sm:text-sm font-semibold rounded-xl"
                >
                  {lang === 'en' ? 'Cancel' : 'रद्द करें'}
                </button>
                <button
                  type="submit"
                  disabled={isSavingService}
                  className="min-h-[44px] px-6 py-2 bg-[#FF5C35] hover:bg-[#E04823] disabled:opacity-60 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isSavingService
                      ? 'Saving...'
                      : serviceEditorMode === 'create'
                      ? lang === 'en'
                        ? 'Save New Service'
                        : 'नई सेवा सहेजें'
                      : lang === 'en'
                      ? 'Save Service Changes'
                      : 'परिवर्तन सहेजें'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: DELETE SERVICE CONFIRMATION DIALOG                           */}
      {/* ===================================================================== */}
      {serviceToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-service-modal-title"
          className="fixed inset-0 z-50 bg-[#101014]/70 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl max-w-md w-full p-6 space-y-4">
            <h2
              id="delete-service-modal-title"
              className="text-lg font-bold text-[#101014] font-display"
            >
              {lang === 'en'
                ? 'Confirm Service Deletion'
                : 'सेवा हटाने की पुष्टि करें'}
            </h2>
            <p className="text-xs sm:text-sm text-[#4A463E] leading-relaxed">
              {lang === 'en'
                ? `Are you sure you want to delete "${serviceToDelete.titleEn}" (${serviceToDelete.id}) from the active catalog? Existing customer orders for this service will remain safely preserved in Order History.`
                : `क्या आप वाकई "${serviceToDelete.titleHi}" (${serviceToDelete.id}) को कैटलॉग से हटाना चाहते हैं? इस सेवा के पुराने ऑर्डर सुरक्षित रहेंगे।`}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setServiceToDelete(null)}
                className="min-h-[42px] px-4 py-2 bg-[#F7F3EA] hover:bg-[#EFE9DC] border border-[#D4CCBE] text-[#101014] text-xs font-semibold rounded-xl"
              >
                {lang === 'en' ? 'Cancel' : 'रद्द करें'}
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteService}
                className="min-h-[42px] px-5 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {lang === 'en' ? 'Confirm Delete' : 'हां, सेवा हटाएं'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: ADD / EDIT REUSABLE DOCUMENT LIBRARY ITEM                    */}
      {/* ===================================================================== */}
      {isAddCustomDocOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-doc-modal-title"
          className="fixed inset-0 z-50 bg-[#101014]/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl max-w-xl w-full p-6 sm:p-7 space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E6DFD3] pb-3.5">
              <div>
                <h2
                  id="custom-doc-modal-title"
                  className="text-lg font-bold text-[#101014] font-display"
                >
                  {editingCustomDocItem
                    ? lang === 'en'
                      ? 'Edit Document Definition'
                      : 'दस्तावेज़ परिभाषा संपादित करें'
                    : lang === 'en'
                    ? 'Add New Document Type to Library'
                    : 'लाइब्रेरी में नया दस्तावेज़ प्रकार जोड़ें'}
                </h2>
                <p className="text-xs text-[#5C5852] mt-0.5">
                  {lang === 'en'
                    ? 'This document will be saved into your reusable Document Library and can be attached to any digital service.'
                    : 'यह दस्तावेज़ आपकी केंद्रीय लाइब्रेरी में सहेजा जाएगा और किसी भी सेवा में जोड़ा जा सकेगा।'}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close document modal"
                onClick={() => setIsAddCustomDocOpen(false)}
                className="p-1.5 text-[#5C5852] hover:bg-[#F7F3EA] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {customDocError && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{customDocError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustomDocModal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="custom-doc-name-en"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Document Name (English) *
                  </label>
                  <input
                    id="custom-doc-name-en"
                    type="text"
                    required
                    value={customDocLabelEn}
                    onChange={(e) => setCustomDocLabelEn(e.target.value)}
                    placeholder="e.g. Migration Certificate"
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs sm:text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="custom-doc-name-hi"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Document Name (Hindi / हिन्दी)
                  </label>
                  <input
                    id="custom-doc-name-hi"
                    type="text"
                    value={customDocLabelHi}
                    onChange={(e) => setCustomDocLabelHi(e.target.value)}
                    placeholder="जैसे: माइग्रेशन प्रमाण पत्र"
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs sm:text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="custom-doc-category"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Category Group *
                  </label>
                  <select
                    id="custom-doc-category"
                    value={customDocCategory}
                    onChange={(e) =>
                      setCustomDocCategory(e.target.value as DocumentCategoryTag)
                    }
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs sm:text-sm text-[#101014]"
                  >
                    <option value="identity">Identity Proof (पहचान पत्र)</option>
                    <option value="academic">Academic / Marksheet (शैक्षणिक मार्कशीट)</option>
                    <option value="certificate">Certificate (जाति / आय / निवास)</option>
                    <option value="financial">Banking / Finance (बैंक पासबुक / विवरण)</option>
                    <option value="photo_sign">Photo & Signature (फोटो व हस्ताक्षर)</option>
                    <option value="other">Other Supporting (अन्य सहायक)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="custom-doc-max-size"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Default Max Size Limit *
                  </label>
                  <select
                    id="custom-doc-max-size"
                    value={Math.min(500, customDocMaxSizeKb)}
                    onChange={(e) =>
                      setCustomDocMaxSizeKb(Number(e.target.value))
                    }
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs sm:text-sm text-[#101014] font-mono-tabular"
                  >
                    <option value={100}>100 KB</option>
                    <option value={200}>200 KB</option>
                    <option value={300}>300 KB</option>
                    <option value={400}>400 KB</option>
                    <option value={500}>500 KB (Recommended Max)</option>
                  </select>
                </div>
              </div>

              {/* Accepted Formats Checkboxes */}
              <div className="space-y-1.5 p-3.5 bg-[#F7F3EA] border border-[#E6DFD3] rounded-xl">
                <span className="block text-xs font-semibold text-[#101014]">
                  Accepted File Formats *
                </span>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {(['pdf', 'jpg', 'png', 'docx'] as AllowedDocFormat[]).map(
                    (fmt) => {
                      const isChecked = customDocFormats.includes(fmt);
                      return (
                        <label
                          key={fmt}
                          className="flex items-center gap-1.5 text-xs font-semibold text-[#101014] cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setCustomDocFormats((prev) => {
                                const exists = prev.includes(fmt);
                                if (exists && prev.length === 1) return prev; // Keep at least one
                                return exists
                                  ? prev.filter((f) => f !== fmt)
                                  : [...prev, fmt];
                              });
                            }}
                            className="w-4 h-4 rounded border-[#D4CCBE] accent-[#FF5C35]"
                          />
                          <span className="uppercase">{fmt}</span>
                        </label>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="custom-doc-instr-en"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Default Customer Instructions (English)
                  </label>
                  <input
                    id="custom-doc-instr-en"
                    type="text"
                    value={customDocInstructionsEn}
                    onChange={(e) => setCustomDocInstructionsEn(e.target.value)}
                    placeholder="e.g. Upload clear scan with both sides"
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs sm:text-sm text-[#101014]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="custom-doc-instr-hi"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Default Customer Instructions (Hindi)
                  </label>
                  <input
                    id="custom-doc-instr-hi"
                    type="text"
                    value={customDocInstructionsHi}
                    onChange={(e) => setCustomDocInstructionsHi(e.target.value)}
                    placeholder="जैसे: दोनों तरफ की साफ कॉपी अपलोड करें"
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs sm:text-sm text-[#101014]"
                  />
                </div>
              </div>

              {/* Default Required Checkbox */}
              <label className="flex items-center gap-2 text-xs font-semibold text-[#101014] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={customDocDefaultReq}
                  onChange={(e) => setCustomDocDefaultReq(e.target.checked)}
                  className="w-4 h-4 rounded border-[#D4CCBE] accent-[#FF5C35]"
                />
                <span>
                  Mark as Required by default when added to services
                </span>
              </label>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DFD3]">
                <button
                  type="button"
                  onClick={() => setIsAddCustomDocOpen(false)}
                  className="min-h-[42px] px-4 py-2 bg-[#F7F3EA] hover:bg-[#EFE9DC] border border-[#D4CCBE] text-[#101014] text-xs font-semibold rounded-xl"
                >
                  {lang === 'en' ? 'Cancel' : 'रद्द करें'}
                </button>
                <button
                  type="submit"
                  className="min-h-[42px] px-5 py-2 bg-[#FF5C35] hover:bg-[#E04823] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {editingCustomDocItem
                      ? lang === 'en'
                        ? 'Save Changes'
                        : 'परिवर्तन सहेजें'
                      : lang === 'en'
                      ? 'Add to Library'
                      : 'लाइब्रेरी में जोड़ें'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: ADD / EDIT SERVICE CATEGORY MODAL                            */}
      {/* ===================================================================== */}
      {isCategoryModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-modal-title"
          className="fixed inset-0 z-50 bg-[#101014]/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 my-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#E6DFD3] pb-3">
              <div>
                <div className="text-xs font-semibold text-[#FF5C35] uppercase tracking-wider">
                  {lang === 'en'
                    ? 'Category Manager'
                    : 'श्रेणी प्रबंधक'}
                </div>
                <h2
                  id="category-modal-title"
                  className="text-lg sm:text-xl font-bold text-[#101014] font-display"
                >
                  {categoryModalMode === 'create'
                    ? lang === 'en'
                      ? 'Add New Service Category'
                      : 'नयी सेवा श्रेणी जोड़ें'
                    : lang === 'en'
                    ? 'Edit Service Category'
                    : 'सेवा श्रेणी संपादित करें'}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close category modal"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 text-[#5C5852] hover:bg-[#F7F3EA] rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {catFormError && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{catFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategoryModal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="cat-name-en"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Category Name (English) *
                  </label>
                  <input
                    id="cat-name-en"
                    type="text"
                    required
                    value={catFormLabelEn}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCatFormLabelEn(val);
                      if (!catKeyManuallyEdited && categoryModalMode === 'create') {
                        const existingKeys = categoriesList.map((c) => c.key);
                        setCatFormKey(generateCategoryKey(val, existingKeys));
                      }
                    }}
                    placeholder="e.g. PAN & Voter Cards"
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs sm:text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cat-name-hi"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Category Name (Hindi / हिन्दी) *
                  </label>
                  <input
                    id="cat-name-hi"
                    type="text"
                    required
                    value={catFormLabelHi}
                    onChange={(e) => setCatFormLabelHi(e.target.value)}
                    placeholder="जैसे: पैन व वोटर कार्ड सेवाएं"
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs sm:text-sm text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="cat-slug-key"
                  className="block text-xs font-semibold text-[#101014] mb-1"
                >
                  Category Key / Slug (lowercase, digits, underscores) *
                </label>
                <input
                  id="cat-slug-key"
                  type="text"
                  required
                  disabled={categoryModalMode === 'edit'}
                  value={catFormKey}
                  onChange={(e) => {
                    setCatKeyManuallyEdited(true);
                    setCatFormKey(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_\-]/g, '_')
                    );
                  }}
                  placeholder="e.g. pan_voter_services"
                  className="w-full min-h-[42px] px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] disabled:opacity-60 rounded-xl text-xs sm:text-sm font-mono-tabular text-[#101014] focus:border-[#FF5C35] focus:outline-none"
                />
                <p className="text-[11px] text-[#787166] mt-1">
                  Used as the permanent identifier for filtering and database association.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="cat-summary-en"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Short Summary (English) *
                  </label>
                  <input
                    id="cat-summary-en"
                    type="text"
                    required
                    value={catFormSummaryEn}
                    onChange={(e) => setCatFormSummaryEn(e.target.value)}
                    placeholder="e.g. New application, corrections, linking, and reprints"
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs sm:text-sm text-[#101014]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="cat-summary-hi"
                    className="block text-xs font-semibold text-[#101014] mb-1"
                  >
                    Short Summary (Hindi) *
                  </label>
                  <input
                    id="cat-summary-hi"
                    type="text"
                    required
                    value={catFormSummaryHi}
                    onChange={(e) => setCatFormSummaryHi(e.target.value)}
                    placeholder="जैसे: नया आवेदन, संशोधन, लिंकिंग और रिप्रिंट"
                    className="w-full min-h-[42px] px-3 py-2 bg-[#F7F3EA] border border-[#D4CCBE] rounded-xl text-xs sm:text-sm text-[#101014]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6DFD3]">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="min-h-[42px] px-4 py-2 bg-[#F7F3EA] hover:bg-[#EFE9DC] border border-[#D4CCBE] text-[#101014] text-xs font-semibold rounded-xl"
                >
                  {lang === 'en' ? 'Cancel' : 'रद्द करें'}
                </button>
                <button
                  type="submit"
                  disabled={catFormSaving}
                  className="min-h-[42px] px-5 py-2 bg-[#FF5C35] hover:bg-[#E04823] disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {catFormSaving
                      ? lang === 'en'
                        ? 'Saving...'
                        : 'सहेजा जा रहा है...'
                      : categoryModalMode === 'create'
                      ? lang === 'en'
                        ? 'Create Category'
                        : 'श्रेणी बनाएं'
                      : lang === 'en'
                      ? 'Save Changes'
                      : 'परिवर्तन सहेजें'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
