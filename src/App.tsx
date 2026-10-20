import React from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  AppView,
  CategoryMeta,
  CenterSettings,
  ContactMessage,
  DigitalService,
  DocumentLibraryItem,
  Language,
  OrderFile,
  OrderStatus,
  OrderStatusEvent,
  PaymentStatus,
  ServiceCategoryKey,
  ServiceOrder,
  UserProfile,
} from './types';
import {
  DEFAULT_CENTER_SETTINGS,
  DEMO_SAMPLE_FILES,
  DEMO_SAMPLE_HISTORY,
  DEMO_SAMPLE_ORDERS,
  INITIAL_DOCUMENT_LIBRARY,
  INITIAL_SERVICES,
  SERVICE_CATEGORIES,
} from './data/initialCatalog';
import { BUSINESS_INFO } from './config/businessInfo';
import {
  generateContactMessageId,
  generateOrderNumber,
  isDuplicateSubmission,
  sanitizeString,
} from './utils/rules';
import { Navbar } from './components/Navbar';
import { CatalogViews } from './components/CatalogViews';
import { OrderFlowViews, PendingUploadItem } from './components/OrderFlowViews';
import { CustomerPortalViews } from './components/CustomerPortalViews';
import { AdminDashboardView } from './components/AdminDashboardView';
import {
  ContactSubmissionPayload,
  InfoPagesView,
} from './components/InfoPagesView';
import { LogIn, LogOut, ShieldCheck, UserCheck, X } from 'lucide-react';

function formatTimestampField(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (val instanceof Timestamp) {
    return val.toDate().toISOString();
  }
  if (typeof val === 'object' && val !== null && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  return String(val);
}

export default function App() {
  const [lang, setLang] = React.useState<Language>('en');
  const [currentView, setCurrentView] = React.useState<AppView>('home');
  const [selectedCategory, setSelectedCategory] = React.useState<
    ServiceCategoryKey | 'all'
  >('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Firebase Auth & Role State
  const [fbUser, setFbUser] = React.useState<FirebaseUser | null>(null);
  const [isDbAdminDoc, setIsDbAdminDoc] = React.useState(false);
  const [authReady, setAuthReady] = React.useState(false);
  const [sandboxRole, setSandboxRole] = React.useState<
    'none' | 'customer' | 'admin'
  >('none');
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  // Application Data State
  const [services, setServices] =
    React.useState<DigitalService[]>(INITIAL_SERVICES);
  const [categories, setCategories] =
    React.useState<CategoryMeta[]>(SERVICE_CATEGORIES);
  const [documentLibrary, setDocumentLibrary] =
    React.useState<DocumentLibraryItem[]>(INITIAL_DOCUMENT_LIBRARY);
  const [settings, setSettings] = React.useState<CenterSettings>(
    DEFAULT_CENTER_SETTINGS
  );
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);
  const [orders, setOrders] = React.useState<ServiceOrder[]>([]);
  const [orderFiles, setOrderFiles] =
    React.useState<Record<string, OrderFile[]>>({});
  const [orderHistory, setOrderHistory] = React.useState<
    Record<string, OrderStatusEvent[]>
  >({});
  const [contactMessages, setContactMessages] = React.useState<
    ContactMessage[]
  >([]);

  // Active Order Flow & Selection State
  const [selectedService, setSelectedService] =
    React.useState<DigitalService | null>(INITIAL_SERVICES[0]);
  const [confirmedOrder, setConfirmedOrder] =
    React.useState<ServiceOrder | null>(null);
  const [selectedOrderNumber, setSelectedOrderNumber] = React.useState<string>('');
  const [isSubmittingOrder, setIsSubmittingOrder] = React.useState(false);

  // Duplicate submission guard state
  const lastSubmissionRef = React.useRef<{
    signature: string | null;
    timestampMs: number | null;
  }>({ signature: null, timestampMs: null });

  const isLiveAdmin = Boolean(
    fbUser &&
      fbUser.emailVerified &&
      (fbUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase() ||
        isDbAdminDoc)
  );

  const isAuthorizedAdmin = isLiveAdmin || sandboxRole === 'admin';

  // 1. Listen to Firebase Auth State & Ensure User Profile Document
  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFbUser(user);
      setAuthReady(true);

      if (user) {
        setSandboxRole('none');
        setOrders([]);
        setOrderFiles({});
        setOrderHistory({});
        setSelectedOrderNumber('');

        try {
          const adminSnap = await getDoc(doc(db, 'admins', user.uid));
          setIsDbAdminDoc(adminSnap.exists());
        } catch {
          setIsDbAdminDoc(false);
        }
        const userRef = doc(db, 'users', user.uid);
        try {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const d = snap.data();
            setUserProfile({
              uid: d.uid,
              displayName: d.displayName,
              email: d.email,
              phone: d.phone,
              villageOrTown: d.villageOrTown,
              preferredLanguage: d.preferredLanguage === 'hi' ? 'hi' : 'en',
              createdAt: formatTimestampField(d.createdAt),
              updatedAt: formatTimestampField(d.updatedAt),
            });
          } else if (user.emailVerified) {
            const newProfilePayload = {
              uid: user.uid,
              displayName: sanitizeString(
                user.displayName || user.email?.split('@')[0] || 'Customer',
                100
              ),
              email: sanitizeString(user.email || 'user@example.com', 150),
              phone: '',
              villageOrTown: 'Kateya, Gopalganj',
              preferredLanguage: lang,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(userRef, newProfilePayload);
            setUserProfile({
              uid: user.uid,
              displayName: newProfilePayload.displayName,
              email: newProfilePayload.email,
              phone: '',
              villageOrTown: 'Kateya, Gopalganj',
              preferredLanguage: lang,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setUserProfile(null);
        setIsDbAdminDoc(false);
        setSandboxRole('none');
      }
    });
    return () => unsub();
  }, []);

  // 2. Load Public Center Settings & Services from Firestore when available
  React.useEffect(() => {
    if (!authReady) return;

    const settingsRef = doc(db, 'settings', 'payment_config');
    getDoc(settingsRef)
      .then((snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setSettings({
            upiId: d.upiId || '',
            payeeName: d.payeeName || 'Aditya Online Center, Kateya',
            qrCodeDataUrl: d.qrCodeDataUrl || '',
            paymentInstructionsEn:
              d.paymentInstructionsEn ||
              DEFAULT_CENTER_SETTINGS.paymentInstructionsEn,
            paymentInstructionsHi:
              d.paymentInstructionsHi ||
              DEFAULT_CENTER_SETTINGS.paymentInstructionsHi,
            isUpiConfigured: Boolean(d.isUpiConfigured),
            shopPhone: d.shopPhone || DEFAULT_CENTER_SETTINGS.shopPhone,
            shopAddressEn:
              d.shopAddressEn || DEFAULT_CENTER_SETTINGS.shopAddressEn,
            shopAddressHi:
              d.shopAddressHi || DEFAULT_CENTER_SETTINGS.shopAddressHi,
            updatedAt: formatTimestampField(d.updatedAt),
          });
        }
      })
      .catch(() => {
        // Fallback to default settings if not yet created by admin
      });

    const servicesQuery = isLiveAdmin
      ? collection(db, 'services')
      : query(collection(db, 'services'), where('isActive', '==', true));
    getDocs(servicesQuery)
      .then((snap) => {
        if (!snap.empty) {
          const initialById = new Map(INITIAL_SERVICES.map((s) => [s.id, s]));
          const loaded: DigitalService[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            const srvId = d.id || docSnap.id;
            const fallback = initialById.get(srvId);
            return {
              id: srvId,
              category: d.category,
              titleEn: d.titleEn,
              titleHi: d.titleHi,
              descEn: d.descEn,
              descHi: d.descHi,
              priceInr: Number(d.priceInr) || 50,
              minPriceInr:
                typeof d.minPriceInr === 'number'
                  ? d.minPriceInr
                  : fallback?.minPriceInr,
              maxPriceInr:
                typeof d.maxPriceInr === 'number'
                  ? d.maxPriceInr
                  : fallback?.maxPriceInr,
              instructionsEn:
                typeof d.instructionsEn === 'string'
                  ? d.instructionsEn
                  : fallback?.instructionsEn,
              instructionsHi:
                typeof d.instructionsHi === 'string'
                  ? d.instructionsHi
                  : fallback?.instructionsHi,
              estimatedTimeEn: d.estimatedTimeEn,
              estimatedTimeHi: d.estimatedTimeHi,
              requiredDocs: d.requiredDocs,
              customFieldsJson: d.customFieldsJson || '[]',
              isActive: Boolean(d.isActive),
              featured: Boolean(d.featured),
              updatedAt: formatTimestampField(d.updatedAt),
            };
          });
          const loadedById = new Map(loaded.map((s) => [s.id, s]));
          const merged: DigitalService[] = [];
          for (const initSrv of INITIAL_SERVICES) {
            const override = loadedById.get(initSrv.id);
            if (override) {
              merged.push(override);
              loadedById.delete(initSrv.id);
            } else {
              merged.push(initSrv);
            }
          }
          for (const customSrv of loadedById.values()) {
            merged.push(customSrv);
          }
          setServices(merged);
        }
      })
      .catch(() => {
        // Keep initial built-in catalog when Firestore collection is empty
      });

    // Load Reusable Document Library from Firestore
    getDocs(collection(db, 'document_library'))
      .then((snap) => {
        if (!snap.empty) {
          const initById = new Map(
            INITIAL_DOCUMENT_LIBRARY.map((d) => [d.id, d])
          );
          const loaded: DocumentLibraryItem[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            const docId = d.id || docSnap.id;
            const fallback = initById.get(docId);
            return {
              id: docId,
              labelEn: d.labelEn || fallback?.labelEn || docId,
              labelHi: d.labelHi || fallback?.labelHi || docId,
              categoryTag: d.category || d.categoryTag || fallback?.categoryTag || 'other',
              defaultRequired:
                d.defaultRequired !== undefined
                  ? Boolean(d.defaultRequired)
                  : fallback?.defaultRequired ?? true,
              acceptedFormats: Array.isArray(d.defaultFormats)
                ? d.defaultFormats
                : Array.isArray(d.acceptedFormats)
                ? d.acceptedFormats
                : fallback?.acceptedFormats || ['pdf', 'jpg', 'png'],
              maxSizeKb:
                Number(d.defaultMaxSizeKb) ||
                Number(d.maxSizeKb) ||
                fallback?.maxSizeKb ||
                500,
              defaultInstructionsEn:
                d.defaultInstructionsEn ||
                fallback?.defaultInstructionsEn ||
                '',
              defaultInstructionsHi:
                d.defaultInstructionsHi ||
                fallback?.defaultInstructionsHi ||
                '',
              isCustom:
                d.isBuiltIn !== undefined
                  ? !d.isBuiltIn
                  : Boolean(d.isCustom),
              updatedAt: formatTimestampField(d.updatedAt),
            };
          });
          const loadedById = new Map(loaded.map((d) => [d.id, d]));
          const merged: DocumentLibraryItem[] = [];
          for (const initDoc of INITIAL_DOCUMENT_LIBRARY) {
            const override = loadedById.get(initDoc.id);
            if (override) {
              merged.push(override);
              loadedById.delete(initDoc.id);
            } else {
              merged.push(initDoc);
            }
          }
          for (const customDoc of loadedById.values()) {
            merged.push(customDoc);
          }
          setDocumentLibrary(merged);
        }
      });

    // Load Service Categories from Firestore
    getDocs(collection(db, 'categories'))
      .then((snap) => {
        if (!snap.empty) {
          const initByKey = new Map(SERVICE_CATEGORIES.map((c) => [c.key, c]));
          const loaded: CategoryMeta[] = snap.docs.map((docSnap) => {
            const d = docSnap.data();
            const key = d.key || docSnap.id;
            const fallback = initByKey.get(key);
            return {
              key,
              labelEn: d.labelEn || fallback?.labelEn || key,
              labelHi: d.labelHi || fallback?.labelHi || key,
              summaryEn: d.summaryEn || fallback?.summaryEn || '',
              summaryHi: d.summaryHi || fallback?.summaryHi || '',
              isCustom: d.isCustom !== undefined ? Boolean(d.isCustom) : true,
              order:
                typeof d.order === 'number'
                  ? d.order
                  : fallback?.order ?? 99,
              updatedAt: formatTimestampField(d.updatedAt),
            };
          });
          const loadedByKey = new Map(loaded.map((c) => [c.key, c]));
          const merged: CategoryMeta[] = [];
          for (const initCat of SERVICE_CATEGORIES) {
            const override = loadedByKey.get(initCat.key);
            if (override) {
              merged.push(override);
              loadedByKey.delete(initCat.key);
            } else {
              merged.push(initCat);
            }
          }
          for (const customCat of loadedByKey.values()) {
            merged.push(customCat);
          }
          setCategories(
            merged.sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
          );
        }
      })
      .catch(() => {
        // Fallback to SERVICE_CATEGORIES
      });
  }, [authReady, isLiveAdmin]);

  // 3. Attach Real-Time Orders Listener for Authenticated Users
  React.useEffect(() => {
    if (!authReady || !fbUser) {
      setOrders([]);
      setOrderFiles({});
      setOrderHistory({});
      return;
    }

    const ordersRef = collection(db, 'orders');
    const q = isLiveAdmin
      ? ordersRef
      : query(ordersRef, where('customerId', '==', fbUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders: ServiceOrder[] = snapshot.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            orderNumber: d.orderNumber,
            customerId: d.customerId,
            customerName: d.customerName,
            customerPhone: d.customerPhone,
            customerEmail: d.customerEmail,
            customerLocation: d.customerLocation,
            serviceId: d.serviceId,
            serviceTitleEn: d.serviceTitleEn,
            serviceTitleHi: d.serviceTitleHi,
            serviceCategory: d.serviceCategory,
            priceInr: Number(d.priceInr) || 0,
            estimatedCompletion: d.estimatedCompletion,
            formResponsesSummary: d.formResponsesSummary,
            customerNotes: d.customerNotes,
            status: d.status,
            paymentStatus: d.paymentStatus,
            paymentUtr: d.paymentUtr,
            adminNote: d.adminNote,
            missingInfoRequest: d.missingInfoRequest,
            customerInfoReply: d.customerInfoReply,
            uploadedFileCount: Number(d.uploadedFileCount) || 0,
            hasDeliverable: Boolean(d.hasDeliverable),
            createdAt: formatTimestampField(d.createdAt),
            updatedAt: formatTimestampField(d.updatedAt),
          };
        });
        fetchedOrders.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setOrders(fetchedOrders);
        if (fetchedOrders.length > 0 && !selectedOrderNumber) {
          setSelectedOrderNumber(fetchedOrders[0].orderNumber);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'orders');
      }
    );

    return () => unsubscribe();
  }, [authReady, fbUser, isLiveAdmin]);

  // 4. Load Subcollection Files & History for Active Order when Authenticated
  React.useEffect(() => {
    if (!authReady || !fbUser || !selectedOrderNumber) return;
    const targetOrder = orders.find(
      (o) => o.orderNumber === selectedOrderNumber || o.id === selectedOrderNumber
    );
    if (!targetOrder) return;

    const filesQuery = isLiveAdmin
      ? collection(db, 'orders', targetOrder.id, 'files')
      : query(
          collection(db, 'orders', targetOrder.id, 'files'),
          where('customerId', '==', fbUser.uid)
        );

    const historyQuery = isLiveAdmin
      ? collection(db, 'orders', targetOrder.id, 'history')
      : query(
          collection(db, 'orders', targetOrder.id, 'history'),
          where('customerId', '==', fbUser.uid)
        );

    const unsubFiles = onSnapshot(
      filesQuery,
      (snap) => {
        const list: OrderFile[] = snap.docs.map((dSnap) => {
          const d = dSnap.data();
          return {
            fileId: d.fileId,
            orderId: d.orderId,
            customerId: d.customerId,
            uploadedByRole: d.uploadedByRole,
            fileCategory: d.fileCategory,
            documentTypeId: d.documentTypeId,
            documentLabelEn: d.documentLabelEn,
            documentLabelHi: d.documentLabelHi,
            fileName: d.fileName,
            mimeType: d.mimeType,
            sizeBytes: Number(d.sizeBytes) || 0,
            dataUrl: d.dataUrl,
            createdAt: formatTimestampField(d.createdAt),
          };
        });
        setOrderFiles((prev) => ({ ...prev, [targetOrder.orderNumber]: list }));
      },
      (err) =>
        handleFirestoreError(
          err,
          OperationType.LIST,
          `orders/${targetOrder.id}/files`
        )
    );

    const unsubHistory = onSnapshot(
      historyQuery,
      (snap) => {
        const list: OrderStatusEvent[] = snap.docs.map((dSnap) => {
          const d = dSnap.data();
          return {
            historyId: d.historyId,
            orderId: d.orderId,
            customerId: d.customerId,
            status: d.status,
            note: d.note,
            actorUid: d.actorUid,
            actorRole: d.actorRole,
            actorName: d.actorName,
            createdAt: formatTimestampField(d.createdAt),
          };
        });
        list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        setOrderHistory((prev) => ({
          ...prev,
          [targetOrder.orderNumber]: list,
        }));
      },
      (err) =>
        handleFirestoreError(
          err,
          OperationType.LIST,
          `orders/${targetOrder.id}/history`
        )
    );

    return () => {
      unsubFiles();
      unsubHistory();
    };
  }, [authReady, fbUser, isLiveAdmin, selectedOrderNumber, orders]);

  // Handlers
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setAuthModalOpen(false);
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : 'Google Sign-In could not be completed in this browser window.'
      );
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setAuthModalOpen(false);
  };

  const handleCreateOrder = async (payload: {
    service: DigitalService;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    customerLocation: string;
    formResponsesSummary: string;
    customerNotes: string;
    uploads: PendingUploadItem[];
  }) => {
    const signature = `${payload.service.id}|${payload.customerPhone}|${payload.customerName}|${payload.formResponsesSummary}`;
    const nowMs = Date.now();

    if (!fbUser || !fbUser.emailVerified) {
      setAuthModalOpen(true);
      throw new Error(
        lang === 'en'
          ? 'Please sign in with your Google account first so your order and private documents are saved securely to your account.'
          : 'कृपया अपना ऑर्डर और दस्तावेज़ सुरक्षित रूप से जमा करने के लिए पहले अपने गूगल (Google) खाते से लॉगिन करें।'
      );
    }

    if (
      isDuplicateSubmission(
        lastSubmissionRef.current.signature,
        lastSubmissionRef.current.timestampMs,
        signature,
        nowMs,
        60000
      )
    ) {
      throw new Error(
        lang === 'en'
          ? 'Duplicate order prevented: You just submitted this exact order within the last minute.'
          : 'डुप्लिकेट ऑर्डर रोका गया: आपने अभी यही ऑर्डर सबमिट किया है।'
      );
    }

    setIsSubmittingOrder(true);
    try {
      const orderNumber = generateOrderNumber(new Date());
      const nowIso = new Date().toISOString();

      // Ensure customer profile exists first for relational rule verification
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: fbUser.uid,
          displayName: sanitizeString(payload.customerName, 100),
          email: sanitizeString(
            fbUser.email || payload.customerEmail || 'user@example.com',
            150
          ),
          phone: sanitizeString(payload.customerPhone, 20),
          villageOrTown: sanitizeString(payload.customerLocation, 120),
          preferredLanguage: lang,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      const orderRef = doc(db, 'orders', orderNumber);
      const firestoreOrderData = {
        orderNumber,
        customerId: fbUser.uid,
        customerName: sanitizeString(payload.customerName, 100),
        customerPhone: sanitizeString(payload.customerPhone, 20),
        customerEmail: sanitizeString(
          fbUser.email || payload.customerEmail || 'customer@example.com',
          150
        ),
        customerLocation: sanitizeString(payload.customerLocation, 120),
        serviceId: payload.service.id,
        serviceTitleEn: sanitizeString(payload.service.titleEn, 120),
        serviceTitleHi: sanitizeString(payload.service.titleHi, 120),
        serviceCategory: payload.service.category,
        priceInr: Number(payload.service.priceInr) || 0,
        estimatedCompletion: sanitizeString(
          payload.service.estimatedTimeEn,
          80
        ),
        formResponsesSummary: sanitizeString(
          payload.formResponsesSummary,
          2500
        ),
        customerNotes: sanitizeString(payload.customerNotes, 1000),
        status: 'Submitted' as OrderStatus,
        paymentStatus: 'Unpaid' as PaymentStatus,
        paymentUtr: '',
        adminNote: '',
        missingInfoRequest: '',
        customerInfoReply: '',
        uploadedFileCount: payload.uploads.length,
        hasDeliverable: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      try {
        await setDoc(orderRef, firestoreOrderData);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `orders/${orderNumber}`);
      }

      // Upload private files to subcollection
      for (const up of payload.uploads) {
        const fileId = up.id.replace(/[^a-zA-Z0-9_\-]/g, '');
        const fileRef = doc(db, 'orders', orderNumber, 'files', fileId);
        try {
          await setDoc(fileRef, {
            fileId,
            orderId: orderNumber,
            customerId: fbUser.uid,
            uploadedByRole: 'customer',
            fileCategory: 'customer_document',
            documentTypeId: up.documentTypeId || 'doc-general',
            documentLabelEn: up.documentLabelEn || 'Supporting Document',
            documentLabelHi: up.documentLabelHi || 'सहायक दस्तावेज़',
            fileName: sanitizeString(up.fileName, 150),
            mimeType: up.mimeType,
            sizeBytes: up.sizeBytes,
            dataUrl: up.dataUrl,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(
            err,
            OperationType.CREATE,
            `orders/${orderNumber}/files/${fileId}`
          );
        }
      }

      // Record initial status event
      const histId = `hist-${Date.now()}`;
      const histRef = doc(db, 'orders', orderNumber, 'history', histId);
      try {
        await setDoc(histRef, {
          historyId: histId,
          orderId: orderNumber,
          customerId: fbUser.uid,
          status: 'Submitted',
          note: 'Order created and submitted by customer.',
          actorUid: fbUser.uid,
          actorRole: 'customer',
          actorName: sanitizeString(payload.customerName, 100),
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.CREATE,
          `orders/${orderNumber}/history/${histId}`
        );
      }

      const createdUiOrder: ServiceOrder = {
        id: orderNumber,
        ...firestoreOrderData,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setConfirmedOrder(createdUiOrder);
      setSelectedOrderNumber(orderNumber);

      lastSubmissionRef.current = { signature, timestampMs: nowMs };
      setCurrentView('order-confirmation');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleSaveProfile = async (updated: {
    displayName: string;
    phone: string;
    villageOrTown: string;
    preferredLanguage: Language;
  }) => {
    if (fbUser && fbUser.emailVerified) {
      const userRef = doc(db, 'users', fbUser.uid);
      try {
        await updateDoc(userRef, {
          displayName: updated.displayName,
          phone: updated.phone,
          villageOrTown: updated.villageOrTown,
          preferredLanguage: updated.preferredLanguage,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${fbUser.uid}`);
      }
    }
    setUserProfile((prev) => ({
      uid: prev?.uid || 'demo-customer-kateya',
      email: prev?.email || 'ramesh.kateya@example.com',
      displayName: updated.displayName,
      phone: updated.phone,
      villageOrTown: updated.villageOrTown,
      preferredLanguage: updated.preferredLanguage,
      createdAt: prev?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSubmitUpiPayment = async (
    order: ServiceOrder,
    utr: string,
    receiptFile?: {
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      dataUrl: string;
    }
  ) => {
    const cleanUtr = sanitizeString(utr, 60);
    const nowIso = new Date().toISOString();

    if (fbUser && fbUser.emailVerified) {
      const orderRef = doc(db, 'orders', order.id);
      try {
        await updateDoc(orderRef, {
          paymentUtr: cleanUtr,
          paymentStatus: 'Pending Verification',
          status: 'Payment Verification',
          updatedAt: serverTimestamp(),
        });

        if (receiptFile) {
          const rId = `rcpt-${Date.now()}`;
          await setDoc(doc(db, 'orders', order.id, 'files', rId), {
            fileId: rId,
            orderId: order.id,
            customerId: fbUser.uid,
            uploadedByRole: 'customer',
            fileCategory: 'payment_receipt',
            fileName: sanitizeString(receiptFile.fileName, 150),
            mimeType: receiptFile.mimeType,
            sizeBytes: receiptFile.sizeBytes,
            dataUrl: receiptFile.dataUrl,
            createdAt: serverTimestamp(),
          });
        }

        const histId = `hist-${Date.now()}`;
        await setDoc(doc(db, 'orders', order.id, 'history', histId), {
          historyId: histId,
          orderId: order.id,
          customerId: fbUser.uid,
          status: 'Payment Verification',
          note: `Customer submitted UPI UTR reference: ${cleanUtr}`,
          actorUid: fbUser.uid,
          actorRole: 'customer',
          actorName: order.customerName,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
      }
    } else {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                paymentUtr: cleanUtr,
                paymentStatus: 'Pending Verification',
                status: 'Payment Verification',
                updatedAt: nowIso,
              }
            : o
        )
      );
      if (receiptFile) {
        const newFile: OrderFile = {
          fileId: `rcpt-${Date.now()}`,
          orderId: order.orderNumber,
          customerId: order.customerId,
          uploadedByRole: 'customer',
          fileCategory: 'payment_receipt',
          fileName: receiptFile.fileName,
          mimeType: receiptFile.mimeType,
          sizeBytes: receiptFile.sizeBytes,
          dataUrl: receiptFile.dataUrl,
          createdAt: nowIso,
        };
        setOrderFiles((prev) => ({
          ...prev,
          [order.orderNumber]: [...(prev[order.orderNumber] || []), newFile],
        }));
      }
      setOrderHistory((prev) => ({
        ...prev,
        [order.orderNumber]: [
          ...(prev[order.orderNumber] || []),
          {
            historyId: `hist-${Date.now()}`,
            orderId: order.orderNumber,
            customerId: order.customerId,
            status: 'Payment Verification',
            note: `Customer submitted UPI UTR reference: ${cleanUtr}`,
            actorUid: order.customerId,
            actorRole: 'customer',
            actorName: order.customerName,
            createdAt: nowIso,
          },
        ],
      }));
    }
  };

  const handleSubmitCustomerInfoReply = async (
    order: ServiceOrder,
    reply: string
  ) => {
    const nowIso = new Date().toISOString();
    if (fbUser && fbUser.emailVerified) {
      const orderRef = doc(db, 'orders', order.id);
      try {
        await updateDoc(orderRef, {
          customerInfoReply: sanitizeString(reply, 1000),
          status: 'In Progress',
          updatedAt: serverTimestamp(),
        });
        const histId = `hist-${Date.now()}`;
        await setDoc(doc(db, 'orders', order.id, 'history', histId), {
          historyId: histId,
          orderId: order.id,
          customerId: fbUser.uid,
          status: 'In Progress',
          note: `Customer provided requested information: ${sanitizeString(
            reply,
            200
          )}`,
          actorUid: fbUser.uid,
          actorRole: 'customer',
          actorName: order.customerName,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
      }
    } else {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                customerInfoReply: reply,
                status: 'In Progress',
                updatedAt: nowIso,
              }
            : o
        )
      );
      setOrderHistory((prev) => ({
        ...prev,
        [order.orderNumber]: [
          ...(prev[order.orderNumber] || []),
          {
            historyId: `hist-${Date.now()}`,
            orderId: order.orderNumber,
            customerId: order.customerId,
            status: 'In Progress',
            note: `Customer provided requested information: ${reply}`,
            actorUid: order.customerId,
            actorRole: 'customer',
            actorName: order.customerName,
            createdAt: nowIso,
          },
        ],
      }));
    }
  };

  const handleCancelOrder = async (order: ServiceOrder) => {
    const nowIso = new Date().toISOString();
    if (fbUser && fbUser.emailVerified) {
      const orderRef = doc(db, 'orders', order.id);
      try {
        await updateDoc(orderRef, {
          status: 'Cancelled',
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
      }
    } else {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? { ...o, status: 'Cancelled', updatedAt: nowIso }
            : o
        )
      );
    }
  };

  const handleAdminUpdateOrder = async (
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
  ) => {
    const nowIso = new Date().toISOString();
    const nextStatus = updates.status ?? order.status;

    if (fbUser && isLiveAdmin) {
      const orderRef = doc(db, 'orders', order.id);
      try {
        await updateDoc(orderRef, {
          status: nextStatus,
          paymentStatus: updates.paymentStatus ?? order.paymentStatus,
          priceInr: updates.priceInr ?? order.priceInr,
          estimatedCompletion:
            updates.estimatedCompletion ?? order.estimatedCompletion,
          adminNote: updates.adminNote ?? order.adminNote,
          missingInfoRequest:
            updates.missingInfoRequest ?? order.missingInfoRequest,
          hasDeliverable: updates.hasDeliverable ?? order.hasDeliverable,
          updatedAt: serverTimestamp(),
        });

        const histId = `hist-${Date.now()}`;
        await setDoc(doc(db, 'orders', order.id, 'history', histId), {
          historyId: histId,
          orderId: order.id,
          customerId: order.customerId,
          status: nextStatus,
          note: sanitizeString(historyNote, 500),
          actorUid: fbUser.uid,
          actorRole: 'admin',
          actorName: 'Aditya Online Center (Admin)',
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `orders/${order.id}`);
      }
    } else {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                status: nextStatus,
                paymentStatus: updates.paymentStatus ?? o.paymentStatus,
                priceInr: updates.priceInr ?? o.priceInr,
                estimatedCompletion:
                  updates.estimatedCompletion ?? o.estimatedCompletion,
                adminNote: updates.adminNote ?? o.adminNote,
                missingInfoRequest:
                  updates.missingInfoRequest ?? o.missingInfoRequest,
                hasDeliverable: updates.hasDeliverable ?? o.hasDeliverable,
                updatedAt: nowIso,
              }
            : o
        )
      );
      setOrderHistory((prev) => ({
        ...prev,
        [order.orderNumber]: [
          ...(prev[order.orderNumber] || []),
          {
            historyId: `hist-${Date.now()}`,
            orderId: order.orderNumber,
            customerId: order.customerId,
            status: nextStatus,
            note: historyNote,
            actorUid: 'admin-aditya',
            actorRole: 'admin',
            actorName: 'Aditya Online Center (Admin)',
            createdAt: nowIso,
          },
        ],
      }));
    }
  };

  const handleAdminUploadDeliverable = async (
    order: ServiceOrder,
    file: {
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      dataUrl: string;
    }
  ) => {
    const fileId = `deliv-${Date.now()}`;
    const nowIso = new Date().toISOString();

    if (fbUser && isLiveAdmin) {
      try {
        await setDoc(doc(db, 'orders', order.id, 'files', fileId), {
          fileId,
          orderId: order.id,
          customerId: order.customerId,
          uploadedByRole: 'admin',
          fileCategory: 'final_deliverable',
          fileName: sanitizeString(file.fileName, 150),
          mimeType: file.mimeType,
          sizeBytes: file.sizeBytes,
          dataUrl: file.dataUrl,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.CREATE,
          `orders/${order.id}/files/${fileId}`
        );
      }
    } else {
      const delivObj: OrderFile = {
        fileId,
        orderId: order.orderNumber,
        customerId: order.customerId,
        uploadedByRole: 'admin',
        fileCategory: 'final_deliverable',
        fileName: file.fileName,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        dataUrl: file.dataUrl,
        createdAt: nowIso,
      };
      setOrderFiles((prev) => ({
        ...prev,
        [order.orderNumber]: [...(prev[order.orderNumber] || []), delivObj],
      }));
    }

    await handleAdminUpdateOrder(
      order,
      { status: 'Completed', hasDeliverable: true },
      `Uploaded completed deliverable document: ${file.fileName}`
    );
  };

  const handleAdminSaveService = async (service: DigitalService) => {
    if (fbUser && isLiveAdmin) {
      try {
        await setDoc(doc(db, 'services', service.id), {
          ...service,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `services/${service.id}`);
      }
    }
    setServices((prev) => {
      const exists = prev.some((s) => s.id === service.id);
      if (exists) {
        return prev.map((s) => (s.id === service.id ? service : s));
      }
      return [...prev, service];
    });
  };

  const handleSaveDocumentLibraryItem = async (item: DocumentLibraryItem) => {
    if (fbUser && isLiveAdmin) {
      try {
        await setDoc(doc(db, 'document_library', item.id), {
          id: item.id,
          labelEn: item.labelEn,
          labelHi: item.labelHi,
          category: item.categoryTag,
          defaultFormats: item.acceptedFormats,
          defaultMaxSizeKb: item.maxSizeKb,
          defaultInstructionsEn: item.defaultInstructionsEn,
          defaultInstructionsHi: item.defaultInstructionsHi,
          allowMultiple: false,
          isBuiltIn: !item.isCustom,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.WRITE,
          `document_library/${item.id}`
        );
      }
    }
    setDocumentLibrary((prev) => {
      const idx = prev.findIndex((d) => d.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = item;
        return next;
      }
      return [...prev, item];
    });
  };

  const handleDeleteDocumentLibraryItem = async (docId: string) => {
    if (fbUser && isLiveAdmin) {
      try {
        await deleteDoc(doc(db, 'document_library', docId));
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.DELETE,
          `document_library/${docId}`
        );
      }
    }
    setDocumentLibrary((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleSaveCategory = async (category: CategoryMeta) => {
    const nowIso = new Date().toISOString();
    const toSave: CategoryMeta = {
      ...category,
      isCustom:
        category.key !== 'all' &&
        !SERVICE_CATEGORIES.some((c) => c.key === category.key && !c.isCustom),
      updatedAt: nowIso,
    };

    if (fbUser && isLiveAdmin) {
      try {
        await setDoc(doc(db, 'categories', category.key), {
          key: toSave.key,
          labelEn: sanitizeString(toSave.labelEn, 100),
          labelHi: sanitizeString(toSave.labelHi, 100),
          summaryEn: sanitizeString(toSave.summaryEn, 300),
          summaryHi: sanitizeString(toSave.summaryHi, 300),
          isCustom: Boolean(toSave.isCustom),
          order: toSave.order ?? 99,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.WRITE,
          `categories/${category.key}`
        );
      }
    }

    setCategories((prev) => {
      const idx = prev.findIndex((c) => c.key === category.key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = toSave;
        return next.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      }
      return [...prev, toSave].sort(
        (a, b) => (a.order ?? 99) - (b.order ?? 99)
      );
    });
  };

  const handleDeleteCategory = async (categoryKey: string) => {
    if (fbUser && isLiveAdmin) {
      try {
        await deleteDoc(doc(db, 'categories', categoryKey));
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.DELETE,
          `categories/${categoryKey}`
        );
      }
    }
    setCategories((prev) => prev.filter((c) => c.key !== categoryKey));
  };

  const handleAdminDeleteService = async (serviceId: string) => {
    if (fbUser && isLiveAdmin) {
      try {
        await deleteDoc(doc(db, 'services', serviceId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `services/${serviceId}`);
      }
    }
    setServices((prev) => prev.filter((s) => s.id !== serviceId));
  };

  const handleAdminSaveSettings = async (newSettings: CenterSettings) => {
    if (fbUser && isLiveAdmin) {
      try {
        await setDoc(doc(db, 'settings', 'payment_config'), {
          ...newSettings,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.WRITE,
          'settings/payment_config'
        );
      }
    }
    setSettings(newSettings);
  };

  // Real-Time Contact Messages Listener strictly for Verified Live Admins
  React.useEffect(() => {
    if (!authReady || !fbUser || !isLiveAdmin) return;

    const msgsRef = collection(db, 'contact_messages');
    const unsub = onSnapshot(
      msgsRef,
      (snap) => {
        const loaded: ContactMessage[] = snap.docs.map((dSnap) => {
          const d = dSnap.data();
          return {
            id: d.id || dSnap.id,
            name: d.name,
            phone: d.phone,
            email: d.email || '',
            subject: d.subject,
            message: d.message,
            orderId: d.orderId || '',
            preferredLanguage: d.preferredLanguage === 'hi' ? 'hi' : 'en',
            status: d.status === 'Replied' ? 'Replied' : 'New',
            createdAt: formatTimestampField(d.createdAt),
          };
        });
        loaded.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setContactMessages(loaded);
      },
      (err) =>
        handleFirestoreError(err, OperationType.LIST, 'contact_messages')
    );

    return () => unsub();
  }, [authReady, fbUser, isLiveAdmin]);

  const handleSubmitContactMessage = async (
    payload: ContactSubmissionPayload
  ): Promise<string> => {
    const msgId = generateContactMessageId(new Date());
    const nowIso = new Date().toISOString();

    const firestorePayload = {
      id: msgId,
      name: sanitizeString(payload.name, 100),
      phone: sanitizeString(payload.phone, 20),
      email: sanitizeString(payload.email, 150),
      subject: sanitizeString(payload.subject, 150),
      message: sanitizeString(payload.message, 1500),
      orderId: sanitizeString(payload.orderId, 40),
      preferredLanguage: payload.preferredLanguage === 'hi' ? 'hi' : 'en',
      status: 'New' as const,
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, 'contact_messages', msgId), firestorePayload);
    } catch (err) {
      handleFirestoreError(
        err,
        OperationType.CREATE,
        `contact_messages/${msgId}`
      );
    }

    if (!isLiveAdmin) {
      const localRecord: ContactMessage = {
        id: msgId,
        name: firestorePayload.name,
        phone: firestorePayload.phone,
        email: firestorePayload.email,
        subject: firestorePayload.subject,
        message: firestorePayload.message,
        orderId: firestorePayload.orderId,
        preferredLanguage: firestorePayload.preferredLanguage as Language,
        status: 'New',
        createdAt: nowIso,
      };
      setContactMessages((prev) => [localRecord, ...prev]);
    }

    return msgId;
  };

  const handleAdminUpdateContactMessageStatus = async (
    message: ContactMessage,
    nextStatus: 'New' | 'Replied'
  ) => {
    if (fbUser && isLiveAdmin) {
      try {
        await updateDoc(doc(db, 'contact_messages', message.id), {
          status: nextStatus,
        });
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.UPDATE,
          `contact_messages/${message.id}`
        );
      }
    } else {
      setContactMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, status: nextStatus } : m))
      );
    }
  };

  const handleAdminDeleteContactMessage = async (messageId: string) => {
    if (fbUser && isLiveAdmin) {
      try {
        await deleteDoc(doc(db, 'contact_messages', messageId));
      } catch (err) {
        handleFirestoreError(
          err,
          OperationType.DELETE,
          `contact_messages/${messageId}`
        );
      }
    } else {
      setContactMessages((prev) => prev.filter((m) => m.id !== messageId));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F3EA] text-[#101014]">
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        lang={lang}
        onToggleLang={setLang}
        userEmail={fbUser?.email || null}
        userName={fbUser?.displayName || userProfile?.displayName || null}
        isLiveAdmin={isLiveAdmin}
        sandboxRole={sandboxRole}
        onSetSandboxRole={setSandboxRole}
        onOpenAuthModal={() => setAuthModalOpen(true)}
      />

      <main className="flex-1">
        {(currentView === 'home' ||
          currentView === 'services' ||
          currentView === 'service-detail') && (
          <CatalogViews
            mode={currentView}
            lang={lang}
            services={services}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              if (currentView === 'service-detail') {
                setCurrentView('services');
              }
            }}
            searchQuery={searchQuery}
            onChangeSearch={setSearchQuery}
            selectedService={selectedService}
            onInspectService={(srv) => {
              setSelectedService(srv);
              setCurrentView('service-detail');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onStartOrder={(srv) => {
              setSelectedService(srv);
              setCurrentView('order-form');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onNavigate={(v) => {
              setCurrentView(v);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onQuickTrackOrder={(ordNum) => {
              setSelectedOrderNumber(ordNum);
              setCurrentView('track-order');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            settings={settings}
            categories={categories}
          />
        )}

        {(currentView === 'order-form' ||
          currentView === 'order-confirmation') && (
          <OrderFlowViews
            mode={currentView}
            lang={lang}
            service={selectedService}
            userProfile={userProfile}
            confirmedOrder={confirmedOrder}
            isSubmitting={isSubmittingOrder}
            onCreateOrder={handleCreateOrder}
            onNavigate={setCurrentView}
            onTrackSpecificOrder={(ordNum) => {
              setSelectedOrderNumber(ordNum);
              setCurrentView('track-order');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {(currentView === 'track-order' || currentView === 'dashboard') && (
          <CustomerPortalViews
            mode={currentView}
            lang={lang}
            orders={orders}
            orderFiles={orderFiles}
            orderHistory={orderHistory}
            selectedOrderNumber={selectedOrderNumber}
            onSelectOrderNumber={setSelectedOrderNumber}
            userProfile={userProfile}
            settings={settings}
            onSaveProfile={handleSaveProfile}
            onSubmitUpiPayment={handleSubmitUpiPayment}
            onSubmitCustomerInfoReply={handleSubmitCustomerInfoReply}
            onCancelOrder={handleCancelOrder}
            onNavigate={setCurrentView}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboardView
            lang={lang}
            isAuthorizedAdmin={isAuthorizedAdmin}
            isLiveAdmin={isLiveAdmin}
            userEmail={fbUser?.email || null}
            onEnableSandboxAdmin={() => setSandboxRole('admin')}
            onOpenAuthModal={() => setAuthModalOpen(true)}
            orders={orders}
            orderFiles={orderFiles}
            services={services}
            settings={settings}
            categories={categories}
            onSaveCategory={handleSaveCategory}
            onDeleteCategory={handleDeleteCategory}
            documentLibrary={documentLibrary}
            onSaveDocumentLibraryItem={handleSaveDocumentLibraryItem}
            onDeleteDocumentLibraryItem={handleDeleteDocumentLibraryItem}
            onAdminUpdateOrder={handleAdminUpdateOrder}
            onAdminUploadDeliverable={handleAdminUploadDeliverable}
            onAdminSaveService={handleAdminSaveService}
            onAdminDeleteService={handleAdminDeleteService}
            onAdminSaveSettings={handleAdminSaveSettings}
            contactMessages={contactMessages}
            onAdminUpdateContactMessageStatus={
              handleAdminUpdateContactMessageStatus
            }
            onAdminDeleteContactMessage={handleAdminDeleteContactMessage}
          />
        )}

        {(currentView === 'contact' ||
          currentView === 'privacy' ||
          currentView === 'terms') && (
          <InfoPagesView
            mode={currentView}
            lang={lang}
            settings={settings}
            onNavigate={setCurrentView}
            onSubmitContactMessage={handleSubmitContactMessage}
          />
        )}
      </main>

      {/* Sign-In & Role Modal Dialog */}
      {authModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          className="fixed inset-0 z-50 bg-[#101014]/75 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-[#FFFDF9] border border-[#E6DFD3] rounded-2xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#E6DFD3] pb-3">
              <h2
                id="auth-modal-title"
                className="text-lg font-bold text-[#101014] font-display"
              >
                {lang === 'en'
                  ? 'Account & Authentication'
                  : 'खाता और प्रमाणीकरण'}
              </h2>
              <button
                type="button"
                aria-label="Close account modal"
                onClick={() => setAuthModalOpen(false)}
                className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-[#4A463E] hover:bg-[#F0EAE0]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {authError && (
              <div
                role="alert"
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800"
              >
                {authError}
              </div>
            )}

            {fbUser ? (
              <div className="space-y-4">
                <div className="p-4 bg-[#F7F3EA] border border-[#E6DFD3] rounded-xl text-xs space-y-1">
                  <div className="text-[#787166]">Signed in with Google:</div>
                  <div className="text-sm font-bold text-[#101014]">
                    {fbUser.displayName || 'Customer'}
                  </div>
                  <div className="font-mono-tabular text-[#4A463E]">
                    {fbUser.email}
                  </div>
                  <div className="pt-1 font-semibold text-[#C83713]">
                    Role: {isLiveAdmin ? 'Verified Center Admin' : 'Verified Customer'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full min-h-[44px] px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{lang === 'en' ? 'Sign Out' : 'लॉग आउट करें'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[#4A463E] leading-relaxed">
                  {lang === 'en'
                    ? 'Sign in with your Google account to save orders and private documents directly to Cloud Firestore. Admin privileges are strictly enforced by server security rules.'
                    : 'क्लाउड डेटाबेस में अपने ऑर्डर और दस्तावेज़ सुरक्षित रखने के लिए गूगल खाते से लॉगिन करें।'}
                </p>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full min-h-[48px] px-5 py-3 bg-[#FF5C35] hover:bg-[#E04823] text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>
                    {lang === 'en'
                      ? 'Sign In with Google'
                      : 'गूगल (Google) खाते से लॉगिन करें'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Professional Multi-Column Enterprise Footer on Charcoal #101014 */}
      <footer className="bg-[#101014] border-t border-white/10 text-[#B8B2A6] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 pb-10 border-b border-white/10">
            {/* Col 1: Brand Identity & Location */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#18181F] border border-white/15 flex items-center justify-center shrink-0">
                  <svg
                    viewBox="0 0 36 36"
                    className="w-6 h-6"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M18 4L31 28H23.5L18 17.5L12.5 28H5L18 4Z"
                      fill="#FF5C35"
                    />
                    <path
                      d="M18 19.5L22.2 28H13.8L18 19.5Z"
                      fill="#FFB547"
                    />
                    <circle cx="18" cy="11.5" r="2" fill="#F7F3EA" />
                  </svg>
                </div>
                <div>
                  <div className="text-base font-extrabold text-[#F7F3EA] tracking-tight font-display">
                    {lang === 'en'
                      ? BUSINESS_INFO.businessName
                      : BUSINESS_INFO.businessNameHi}
                  </div>
                  <div className="text-xs text-[#9E988E]">
                    {lang === 'en'
                      ? BUSINESS_INFO.addressEn
                      : BUSINESS_INFO.addressHi}
                  </div>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-[#B8B2A6] leading-relaxed max-w-sm">
                {lang === 'en'
                  ? 'Trusted digital documentation, resume drafting, PDF formatting, and online government & scholarship form assistance for residents across Kateya and Gopalganj.'
                  : 'कटेया और गोपालगंज के नागरिकों के लिए विश्वसनीय डिजिटल दस्तावेज़, रिज़्यूमे, पीडीएफ सुधार और ऑनलाइन फॉर्म सहायता केंद्र।'}
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#18181F] border border-white/10 text-xs text-[#F7F3EA]">
                <span className="w-2 h-2 rounded-full bg-[#FFB547]" />
                <span>
                  {lang === 'en'
                    ? `Open: ${BUSINESS_INFO.workingDaysEn}`
                    : `कार्य दिवस: ${BUSINESS_INFO.workingDaysHi}`}
                </span>
              </div>
            </div>

            {/* Col 2: Quick Navigation */}
            <div className="lg:col-span-2 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#FFB547]">
                {lang === 'en' ? 'Navigation' : 'नेविगेशन'}
              </div>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('home');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[#D6D1C7] hover:text-[#FF5C35] transition-colors"
                  >
                    {lang === 'en' ? 'Home' : 'होम पेज'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setCurrentView('services');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[#D6D1C7] hover:text-[#FF5C35] transition-colors"
                  >
                    {lang === 'en' ? 'Services Catalog' : 'सभी सेवाएं'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('track-order');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[#D6D1C7] hover:text-[#FF5C35] transition-colors"
                  >
                    {lang === 'en' ? 'Track Order Status' : 'ऑर्डर ट्रैक करें'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('dashboard');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[#D6D1C7] hover:text-[#FF5C35] transition-colors"
                  >
                    {lang === 'en' ? 'Customer Dashboard' : 'ग्राहक डैशबोर्ड'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('admin');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[#D6D1C7] hover:text-[#FF5C35] transition-colors"
                  >
                    {lang === 'en' ? 'Admin Control Panel' : 'एडमिन पैनल'}
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Service Categories */}
            <div className="lg:col-span-3 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#FFB547]">
                {lang === 'en' ? 'Key Digital Services' : 'प्रमुख डिजिटल सेवाएं'}
              </div>
              <ul className="space-y-2 text-xs sm:text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('resume_biodata');
                      setCurrentView('services');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[#D6D1C7] hover:text-[#FF5C35] transition-colors text-left"
                  >
                    {lang === 'en'
                      ? 'ATS Resume, CV & Marriage Biodata'
                      : 'ATS रिज़्यूमे और शादी बायोडाटा'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('govt_job_assistance');
                      setCurrentView('services');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[#D6D1C7] hover:text-[#FF5C35] transition-colors text-left"
                  >
                    {lang === 'en'
                      ? 'Government & Exam Form Assistance'
                      : 'सरकारी नौकरी और परीक्षा फॉर्म सहायता'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('scholarship_admission');
                      setCurrentView('services');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[#D6D1C7] hover:text-[#FF5C35] transition-colors text-left"
                  >
                    {lang === 'en'
                      ? 'Bihar Scholarship & College Admission'
                      : 'बिहार छात्रवृत्ति और कॉलेज नामांकन'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('pdf_tools');
                      setCurrentView('services');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[#D6D1C7] hover:text-[#FF5C35] transition-colors text-left"
                  >
                    {lang === 'en'
                      ? 'PDF Merge, Compress & Photo Resize'
                      : 'पीडीएफ मर्ज, साइज कम करना और फोटो रिसाइज'}
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Direct Support & Legal */}
            <div className="lg:col-span-3 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-[#FFB547]">
                {lang === 'en' ? 'Help Desk & Legal' : 'सहायता और कानूनी जानकारी'}
              </div>
              <div className="space-y-2.5 text-xs sm:text-sm">
                <a
                  href={BUSINESS_INFO.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FF5C35] hover:bg-[#E04823] text-white font-bold transition-colors"
                >
                  <span>WhatsApp: {BUSINESS_INFO.whatsappNumber}</span>
                </a>
                <div className="text-xs text-[#B8B2A6]">
                  Email:{' '}
                  <a
                    href={`mailto:${BUSINESS_INFO.email}`}
                    className="text-[#F7F3EA] hover:text-[#FFB547] underline underline-offset-2"
                  >
                    {BUSINESS_INFO.email}
                  </a>
                </div>
                <div className="pt-2 flex flex-wrap gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('contact');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[#D6D1C7] hover:text-[#FF5C35] underline underline-offset-4"
                  >
                    {lang === 'en' ? 'Contact Us' : 'संपर्क करें'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('privacy');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[#D6D1C7] hover:text-[#FF5C35] underline underline-offset-4"
                  >
                    {lang === 'en' ? 'Privacy Policy' : 'गोपनीयता नीति'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView('terms');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[#D6D1C7] hover:text-[#FF5C35] underline underline-offset-4"
                  >
                    {lang === 'en' ? 'Terms & Android Guide' : 'शर्तें और गाइड'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#9E988E]">
            <div>
              © {new Date().getFullYear()} {BUSINESS_INFO.businessName} (Kateya, Bihar).{' '}
              {lang === 'en'
                ? 'Private user-isolated document workflow.'
                : 'गोपनीय और सुरक्षित दस्तावेज़ प्रणाली।'}
            </div>
            <div className="text-[#787166]">
              {lang === 'en'
                ? 'Independent citizen assistance center · Not affiliated with any government portal'
                : 'स्वतंत्र नागरिक डिजिटल सेवा केंद्र'}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
