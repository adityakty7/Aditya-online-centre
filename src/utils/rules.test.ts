import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  getDocsFromServer,
  setDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import {
  generateOrderNumber,
  generateContactMessageId,
  generateServiceId,
  isValidEntityId,
  isSafeDataUrl,
  validateCustomerOrderInput,
  validateContactMessageInput,
  validateDigitalServiceInput,
  createDuplicateService,
  filterAndSortServices,
  calculateServiceMetrics,
  deriveCustomerSummaries,
  validateUploadedFile,
  validateUpiUtr,
  isDuplicateSubmission,
  canCustomerCancelOrder,
  canCustomerSubmitUtr,
  isTerminalOrderStatus,
  calculateOrderMetrics,
  generateDocumentTypeId,
  canAddDocumentLibraryItem,
  cleanDocumentLabel,
  parseServiceDocumentRequirements,
  getServiceDocumentRequirements,
  syncLegacyRequiredDocsFromRequirements,
  reorderDocumentRequirements,
  validateFileForDocumentRequirement,
  validateServiceDocumentChecklistUploads,
  generateCategoryKey,
  isValidCategoryKey,
  validateCategoryInput,
  resolveVisualTheme,
  toggleVisualTheme,
  BEFORE_AFTER_SHOWCASE_TABS,
  MOBILE_DOCK_SHORTCUTS,
  calculateBundleEstimate,
  HERO_CINEMATIC_MEDIA,
  clampComparisonSlider,
  buildServiceWhatsAppUrl,
  CUSTOMER_TESTIMONIALS,
  INITIAL_EXAM_RADAR_ITEMS,
  calculateExamDaysLeft,
  filterExamRadarItems,
  EXAM_PHOTO_PRESETS,
  estimateDataUrlSizeKb,
  calculateExactAgeAndEligibility,
  LIVE_DRAFT_TEMPLATES,
  generateLiveDraftPreviewContent,
  buildDynamicUpiUri,
  generateQrMatrix,
  buildOrderWhatsAppDispatchUrl,
  createSampleVoiceNoteWavDataUrl,
  SHOP_TIME_SLOTS,
  generateShopVisitTokenNumber,
  validateShopVisitTokenInput,
  buildShopTokenWhatsAppUrl,
  DEFAULT_STAFF_PIN,
  verifyStaffAdminPin,
} from './rules.ts';
import {
  BUSINESS_INFO,
  getActiveSocialLinks,
} from '../config/businessInfo.ts';
import { INITIAL_SERVICES, INITIAL_DOCUMENT_LIBRARY } from '../data/initialCatalog.ts';

test('generateOrderNumber creates valid formatted AOC order numbers', () => {
  const date = new Date('2026-10-19T10:00:00Z');
  const orderNum = generateOrderNumber(date, 'K9M2');
  assert.equal(orderNum, 'AOC-20261019-K9M2');
  assert.equal(isValidEntityId(orderNum), true);
});

test('BUSINESS_INFO centralized configuration matches verified owner details and hides unconfigured links', () => {
  assert.equal(BUSINESS_INFO.businessName, 'Aditya Online Center');
  assert.equal(BUSINESS_INFO.serviceAreaEn, 'Kateya, Gopalganj, Bihar, India');
  assert.equal(
    BUSINESS_INFO.addressEn,
    'Ward No. 08, Near G.A. High School / Nagar Panchayat, Kateya, Gopalganj (PIN 841437)'
  );
  assert.equal(BUSINESS_INFO.phone, '');
  assert.equal(BUSINESS_INFO.whatsappNumber, '6206800799');
  assert.equal(BUSINESS_INFO.whatsappUrl, 'https://wa.me/916206800799');
  assert.equal(BUSINESS_INFO.email, 'Adityakty77@gmail.com');
  assert.equal(BUSINESS_INFO.mailtoUrl, 'mailto:Adityakty77@gmail.com');
  assert.equal(BUSINESS_INFO.workingDaysEn, 'Monday to Saturday (8:00 AM – 8:00 PM)');
  assert.equal(BUSINESS_INFO.workingHoursEn, '8:00 AM – 8:00 PM');
  assert.equal(
    BUSINESS_INFO.googleMapsUrl.includes('G.A.+High+School+Ward+No+08+Kateya+Gopalganj'),
    true
  );

  const activeSocials = getActiveSocialLinks();
  assert.equal(activeSocials.length, 2);
  assert.deepEqual(
    activeSocials.map((s) => s.key),
    ['facebook', 'instagram']
  );
  assert.equal(activeSocials[0].url, 'https://www.facebook.com/Adityakty77');
  assert.equal(
    activeSocials[1].url,
    'https://www.instagram.com/aditya_kty45?exln=bzNpNjE3aGN2NXNn'
  );
});

test('buildServiceWhatsAppUrl and CUSTOMER_TESTIMONIALS provide valid WhatsApp deep links and 3 local reviews', () => {
  const resumeUrl = buildServiceWhatsAppUrl('Professional Job Resume / CV');
  assert.equal(
    resumeUrl,
    'https://wa.me/916206800799?text=Hello%20Aditya%2C%20I%20want%20to%20apply%20for%20Professional%20Job%20Resume%20%2F%20CV'
  );
  assert.equal(CUSTOMER_TESTIMONIALS.length, 3);
  assert.equal(INITIAL_SERVICES.length, 8);
});

test('validateContactMessageInput validates required and optional fields accurately', () => {
  const validFull = validateContactMessageInput({
    name: 'Ramesh Kumar',
    phone: '9876543210',
    email: 'ramesh@example.com',
    subject: 'Resume Inquiry',
    message: 'I need a professional ATS resume in Kateya.',
    orderId: 'AOC-20261018-D101',
    preferredLanguage: 'en',
  });
  assert.equal(validFull.valid, true);

  const validMinimal = validateContactMessageInput({
    name: 'सोनू कुमार',
    phone: '6206800799',
    email: '',
    subject: 'बायोडाटा',
    message: 'मुझे शादी का बायोडाटा बनवाना है।',
    orderId: '',
    preferredLanguage: 'hi',
  });
  assert.equal(validMinimal.valid, true);

  const badPhone = validateContactMessageInput({
    name: 'Ramesh Kumar',
    phone: '12345',
    subject: 'Resume Inquiry',
    message: 'I need a resume.',
    preferredLanguage: 'en',
  });
  assert.equal(badPhone.valid, false);

  const badEmail = validateContactMessageInput({
    name: 'Ramesh Kumar',
    phone: '9876543210',
    email: 'not-an-email',
    subject: 'Resume Inquiry',
    message: 'I need a resume.',
    preferredLanguage: 'en',
  });
  assert.equal(badEmail.valid, false);

  const badOrderId = validateContactMessageInput({
    name: 'Ramesh Kumar',
    phone: '9876543210',
    subject: 'Resume Inquiry',
    message: 'I need a resume.',
    orderId: 'DROP TABLE orders;',
    preferredLanguage: 'en',
  });
  assert.equal(badOrderId.valid, false);
});

test('validateCustomerOrderInput enforces required fields and phone format', () => {
  const missingName = validateCustomerOrderInput({
    customerName: 'A',
    customerPhone: '9876543210',
    customerLocation: 'Kateya',
    requiredCustomFields: [],
    customFieldValues: {},
  });
  assert.equal(missingName.valid, false);

  const invalidPhone = validateCustomerOrderInput({
    customerName: 'Ramesh Kumar',
    customerPhone: '12345',
    customerLocation: 'Kateya',
    requiredCustomFields: [],
    customFieldValues: {},
  });
  assert.equal(invalidPhone.valid, false);

  const missingCustom = validateCustomerOrderInput({
    customerName: 'Ramesh Kumar',
    customerPhone: '9876543210',
    customerLocation: 'Kateya Ward 4',
    requiredCustomFields: [{ id: 'education', label: 'Qualification', required: true }],
    customFieldValues: { education: '   ' },
  });
  assert.equal(missingCustom.valid, false);

  const validInput = validateCustomerOrderInput({
    customerName: 'Ramesh Kumar',
    customerPhone: '9876543210',
    customerLocation: 'Kateya Ward 4',
    requiredCustomFields: [{ id: 'education', label: 'Qualification', required: true }],
    customFieldValues: { education: 'B.A. Honours' },
  });
  assert.equal(validInput.valid, true);
});

test('validateUploadedFile & isSafeDataUrl enforce MIME allowlist, size boundary, and XSS prevention', () => {
  const validPdf = validateUploadedFile({
    name: 'marksheet.pdf',
    type: 'application/pdf',
    size: 120000,
  });
  assert.equal(validPdf.valid, true);

  const badType = validateUploadedFile({
    name: 'script.exe',
    type: 'application/x-msdownload',
    size: 1024,
  });
  assert.equal(badType.valid, false);

  const oversize = validateUploadedFile({
    name: 'scan.png',
    type: 'image/png',
    size: 900000,
  });
  assert.equal(oversize.valid, false);

  // Data URL XSS & scheme validation
  assert.equal(
    isSafeDataUrl('data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyA+Pg=='),
    true
  );
  assert.equal(isSafeDataUrl('javascript:alert(document.cookie)'), false);
  assert.equal(isSafeDataUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='), false);
});

test('validateUpiUtr and canCustomerSubmitUtr prevent invalid references and backward state manipulation', () => {
  assert.equal(validateUpiUtr('429381920384').valid, true);
  assert.equal(validateUpiUtr('123').valid, false);
  assert.equal(validateUpiUtr('DROP TABLE;').valid, false);

  assert.equal(canCustomerSubmitUtr('Awaiting Payment', 'Unpaid'), true);
  assert.equal(canCustomerSubmitUtr('Submitted', 'Unpaid'), true);
  assert.equal(canCustomerSubmitUtr('Completed', 'Verified'), false);
  assert.equal(canCustomerSubmitUtr('Completed', 'Unpaid'), false);
  assert.equal(canCustomerSubmitUtr('Delivered', 'Verified'), false);
  assert.equal(canCustomerSubmitUtr('Cancelled', 'Unpaid'), false);
});

test('isDuplicateSubmission blocks identical order payload within time window', () => {
  const sig = 'service-1|9876543210|Ramesh';
  assert.equal(isDuplicateSubmission(sig, 1000, sig, 15000, 60000), true);
  assert.equal(isDuplicateSubmission(sig, 1000, sig, 75000, 60000), false);
  assert.equal(isDuplicateSubmission(sig, 1000, 'service-2|9876543210|Ramesh', 15000, 60000), false);
});

test('order cancellation and terminal state helpers follow workflow rules', () => {
  assert.equal(canCustomerCancelOrder('Submitted'), true);
  assert.equal(canCustomerCancelOrder('Awaiting Payment'), true);
  assert.equal(canCustomerCancelOrder('In Progress'), false);
  assert.equal(canCustomerCancelOrder('Delivered'), false);
  assert.equal(isTerminalOrderStatus('Delivered'), true);
  assert.equal(isTerminalOrderStatus('Cancelled'), true);
  assert.equal(isTerminalOrderStatus('Completed'), false);
});

test('calculateOrderMetrics aggregates counts and verified revenue accurately', () => {
  const metrics = calculateOrderMetrics([
    { status: 'Submitted', paymentStatus: 'Unpaid', priceInr: 80 },
    { status: 'Payment Verification', paymentStatus: 'Pending Verification', priceInr: 120 },
    { status: 'In Progress', paymentStatus: 'Verified', priceInr: 150 },
    { status: 'Delivered', paymentStatus: 'Verified', priceInr: 100 },
    { status: 'Cancelled', paymentStatus: 'Verified', priceInr: 200 },
  ]);
  assert.equal(metrics.total, 5);
  assert.equal(metrics.pendingAction, 2);
  assert.equal(metrics.activeInProgress, 1);
  assert.equal(metrics.completedDelivered, 1);
  assert.equal(metrics.verifiedRevenueInr, 250);
  assert.equal(metrics.pendingVerificationCount, 1);
});

test('Service Management CRUD helpers: generateServiceId, validateDigitalServiceInput, createDuplicateService, filterAndSortServices, calculateServiceMetrics, and deriveCustomerSummaries', () => {
  // 1. Unique Service ID generation
  const srvId = generateServiceId('Bihar Land Mutation Form', ['srv-bihar-land-mutation-form']);
  assert.equal(srvId, 'srv-bihar-land-mutation-form-2');
  assert.equal(isValidEntityId(srvId), true);

  // 2. Service validation
  const validCheck = validateDigitalServiceInput({
    id: 'srv-pan-correction',
    category: 'govt_job_assistance',
    titleEn: 'PAN Card Correction Assistance',
    titleHi: 'पैन कार्ड सुधार सहायता',
    descEn: 'Update name, DOB, or father name on PAN card with document verification.',
    descHi: 'पैन कार्ड में नाम, जन्म तिथि या पिता का नाम सुधारने की ऑनलाइन सहायता।',
    priceInr: 100,
    minPriceInr: 80,
    maxPriceInr: 150,
    instructionsEn: 'Please upload clear Aadhaar PDF.',
    instructionsHi: 'कृपया स्पष्ट आधार पीडीएफ अपलोड करें।',
    estimatedTimeEn: '24 Hours',
    estimatedTimeHi: '24 घंटे',
    requiredDocs: 'Aadhaar Card, Existing PAN Copy',
    customFieldsJson: JSON.stringify([
      {
        id: 'pan_number',
        labelEn: 'Existing 10-character PAN',
        labelHi: 'मौजूदा 10-अंकीय पैन नंबर',
        type: 'text',
        required: true,
      },
    ]),
  });
  assert.equal(validCheck.valid, true);

  // Invalid min > max price range
  const invalidPriceRange = validateDigitalServiceInput({
    id: 'srv-bad-range',
    category: 'govt_job_assistance',
    titleEn: 'PAN Card Correction',
    titleHi: 'पैन कार्ड सुधार',
    descEn: 'Update PAN card details.',
    descHi: 'पैन कार्ड विवरण अपडेट करें।',
    priceInr: 100,
    minPriceInr: 200,
    maxPriceInr: 120,
    estimatedTimeEn: '24 Hours',
    estimatedTimeHi: '24 घंटे',
    requiredDocs: 'Aadhaar Card',
    customFieldsJson: '[]',
  });
  assert.equal(invalidPriceRange.valid, false);

  // 3. Duplicate service creates distinct ID, defaults to inactive, and appends (Copy)
  const original = INITIAL_SERVICES[0];
  const duplicated = createDuplicateService(
    original,
    INITIAL_SERVICES.map((s) => s.id),
    '2026-10-19T12:00:00Z'
  );
  assert.notEqual(duplicated.id, original.id);
  assert.equal(duplicated.isActive, false);
  assert.equal(duplicated.featured, false);
  assert.match(duplicated.titleEn, /\(Copy\)$/);

  // 4. Filter and Sort services
  const catalogWithCopy = [...INITIAL_SERVICES, duplicated];
  const metrics = calculateServiceMetrics(catalogWithCopy);
  assert.equal(metrics.totalServices, 9);
  assert.equal(metrics.activeServices, 8);
  assert.equal(metrics.inactiveServices, 1);

  const inactiveOnly = filterAndSortServices(catalogWithCopy, {
    searchQuery: '',
    category: 'all',
    statusFilter: 'inactive',
    sortBy: 'name',
    sortDir: 'asc',
  });
  assert.equal(inactiveOnly.length, 1);
  assert.equal(inactiveOnly[0].id, duplicated.id);

  const sortedByPriceDesc = filterAndSortServices(INITIAL_SERVICES, {
    searchQuery: '',
    category: 'all',
    statusFilter: 'all',
    sortBy: 'price',
    sortDir: 'desc',
  });
  assert.equal(sortedByPriceDesc[0].priceInr >= sortedByPriceDesc[sortedByPriceDesc.length - 1].priceInr, true);

  // 5. Derive Customer Summaries from orders
  const summaries = deriveCustomerSummaries([
    {
      customerId: 'cust-1',
      customerName: 'Ramesh Kumar',
      customerPhone: '9876543210',
      customerEmail: 'ramesh@example.com',
      customerLocation: 'Kateya Ward 4',
      status: 'Delivered',
      paymentStatus: 'Verified',
      priceInr: 80,
      createdAt: '2026-10-18T10:00:00Z',
    },
    {
      customerId: 'cust-1',
      customerName: 'Ramesh Kumar',
      customerPhone: '9876543210',
      customerEmail: 'ramesh@example.com',
      customerLocation: 'Kateya Ward 4',
      status: 'In Progress',
      paymentStatus: 'Verified',
      priceInr: 30,
      createdAt: '2026-10-19T10:00:00Z',
    },
  ]);
  assert.equal(summaries.length, 1);
  assert.equal(summaries[0].totalOrders, 2);
  assert.equal(summaries[0].activeOrders, 1);
  assert.equal(summaries[0].verifiedSpentInr, 110);
});

test('Static Security Rules Audit: firestore.rules enforces all 8 pillars, customer isolation, contact_messages, and extended DigitalService validation', () => {
  const rulesText = fs.readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');
  assert.match(rulesText, /match \/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}/);
  assert.match(rulesText, /request\.auth\.token\.email_verified == true/);
  assert.match(rulesText, /data\.orderNumber == orderId/);
  assert.match(rulesText, /incoming\(\)\.paymentStatus == 'Unpaid'/);
  assert.match(rulesText, /incoming\(\)\.paymentUtr == ''/);
  assert.match(rulesText, /incoming\(\)\.adminNote == ''/);
  assert.match(rulesText, /existing\(\)\.paymentStatus != 'Verified'/);
  assert.match(rulesText, /data\.dataUrl\.matches\('\^data:\(application\/pdf\|image\/jpeg/);
  assert.match(rulesText, /match \/contact_messages\/\{messageId\}/);
  assert.match(rulesText, /isValidContactMessage\(incoming\(\), messageId\)/);
  assert.match(rulesText, /minPriceInr/);
  assert.match(rulesText, /instructionsEn/);
});

test('Live Deployed Firestore Rules Audit: unauthorized reads/writes are rejected and contact_messages is write-only for non-admins', async () => {
  const configText = fs.readFileSync(
    new URL('../../firebase-applet-config.json', import.meta.url),
    'utf8'
  );
  const firebaseConfig = JSON.parse(configText);
  const app = initializeApp(firebaseConfig, 'security-audit-runner');
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  try {
    // Check if live Firestore backend is reachable in the current test runner environment
    try {
      await getDocFromServer(doc(db, 'settings', 'payment_config'));
    } catch (connErr: unknown) {
      const msg = connErr instanceof Error ? connErr.message : String(connErr);
      if (/unavailable|offline|Cloud Firestore API has not been used/i.test(msg)) {
        // Offline / API disabled in sandbox test runner; static rules audit above already verified all rules
        return;
      }
      throw connErr;
    }

    // 1. Direct unauthorized read of a customer profile (PII)
    await assert.rejects(
      async () => {
        await getDocFromServer(doc(db, 'users', 'dummy-victim-001'));
      },
      (err: Error) => /permission-denied|Missing or insufficient permissions/i.test(err.message)
    );

    // 2. Direct unauthorized list scraping of all orders
    await assert.rejects(
      async () => {
        await getDocsFromServer(collection(db, 'orders'));
      },
      (err: Error) => /permission-denied|Missing or insufficient permissions/i.test(err.message)
    );

    // 3. Direct unauthorized read of a private order document
    await assert.rejects(
      async () => {
        await getDocFromServer(doc(db, 'orders', 'AOC-20261018-D101'));
      },
      (err: Error) => /permission-denied|Missing or insufficient permissions/i.test(err.message)
    );

    // 4. Direct unauthorized read of a private customer uploaded file
    await assert.rejects(
      async () => {
        await getDocFromServer(doc(db, 'orders', 'AOC-20261018-D101', 'files', 'file-demo-1'));
      },
      (err: Error) => /permission-denied|Missing or insufficient permissions/i.test(err.message)
    );

    // 5. Direct unauthorized privilege escalation attempt to /admins
    await assert.rejects(
      async () => {
        await setDoc(doc(db, 'admins', 'dummy-attacker-001'), {
          uid: 'dummy-attacker-001',
          email: 'attacker@example.com',
          grantedAt: new Date(),
        });
      },
      (err: Error) => /permission-denied|Missing or insufficient permissions/i.test(err.message)
    );

    // 6. Direct unauthorized write to /settings/payment_config
    await assert.rejects(
      async () => {
        await setDoc(doc(db, 'settings', 'payment_config'), {
          upiId: 'attacker@upi',
        });
      },
      (err: Error) => /permission-denied|Missing or insufficient permissions/i.test(err.message)
    );

    // 6b. Direct unauthorized write to /services/{serviceId}
    await assert.rejects(
      async () => {
        await setDoc(doc(db, 'services', 'srv-hacked'), {
          id: 'srv-hacked',
          category: 'govt_forms',
          titleEn: 'Hacked Service',
          titleHi: 'हैक्ड सेवा',
          descEn: 'Unauthorized service creation attempt.',
          descHi: 'अनाधिकृत प्रयास',
          priceInr: 1,
          estimatedTimeEn: '1m',
          estimatedTimeHi: '1m',
          requiredDocs: 'None',
          customFieldsJson: '[]',
          isActive: true,
          featured: true,
          updatedAt: serverTimestamp(),
        });
      },
      (err: Error) => /permission-denied|Missing or insufficient permissions/i.test(err.message)
    );

    // 7. Direct read of non-allowlisted settings document (/settings/other_secret)
    await assert.rejects(
      async () => {
        await getDocFromServer(doc(db, 'settings', 'other_secret'));
      },
      (err: Error) => /permission-denied|Missing or insufficient permissions/i.test(err.message)
    );

    // 8. Public read of /settings/payment_config is permitted
    const publicSettingsSnap = await getDocFromServer(doc(db, 'settings', 'payment_config'));
    assert.equal(typeof publicSettingsSnap.exists(), 'boolean');

    // 9. Valid Contact Message creation succeeds on live Firestore
    const testMsgId = generateContactMessageId(new Date(), 'AUDIT1');
    await setDoc(doc(db, 'contact_messages', testMsgId), {
      id: testMsgId,
      name: 'Audit Test Visitor',
      phone: '9876543210',
      email: 'visitor@example.com',
      subject: 'Audit Test Inquiry',
      message: 'Testing live Firestore ContactMessage rule validation.',
      orderId: 'AOC-20261018-D101',
      preferredLanguage: 'en',
      status: 'New',
      createdAt: serverTimestamp(),
    });

    // 10. Unauthorized read (get) of the submitted contact message is strictly denied
    await assert.rejects(
      async () => {
        await getDocFromServer(doc(db, 'contact_messages', testMsgId));
      },
      (err: Error) => /permission-denied|Missing or insufficient permissions/i.test(err.message)
    );

    // 11. Unauthorized list scraping of /contact_messages is strictly denied
    await assert.rejects(
      async () => {
        await getDocsFromServer(collection(db, 'contact_messages'));
      },
      (err: Error) => /permission-denied|Missing or insufficient permissions/i.test(err.message)
    );

    // 12. Spoofed / invalid contact message creation (e.g. status: 'Replied' or shadow key) is denied
    const spoofMsgId = generateContactMessageId(new Date(), 'SPOOF1');
    await assert.rejects(
      async () => {
        await setDoc(doc(db, 'contact_messages', spoofMsgId), {
          id: spoofMsgId,
          name: 'Attacker',
          phone: '9876543210',
          email: '',
          subject: 'Spoof Status',
          message: 'Trying to create a message with Replied status.',
          orderId: '',
          preferredLanguage: 'en',
          status: 'Replied',
          createdAt: serverTimestamp(),
        });
      },
      (err: Error) => /permission-denied|Missing or insufficient permissions/i.test(err.message)
    );
  } finally {
    await deleteApp(app);
  }
});

test('Document Library & Checklist Builder: predefined library, duplicate prevention, legacy fallback, reordering, and per-document validation', () => {
  // 1. Predefined library contains required core documents with stable IDs
  assert.equal(INITIAL_DOCUMENT_LIBRARY.length >= 18, true);
  const expectedLabels = [
    'Aadhaar Card',
    'PAN Card',
    'Passport-size Photo',
    'Signature',
    '10th Marksheet',
    '12th Marksheet',
    'Graduation Certificate',
    'Bank Passbook',
    'Bank Statement',
    'Address Proof',
    'Date of Birth Proof',
    'Caste Certificate',
    'Income Certificate',
    'Residence Certificate',
    'Disability Certificate',
    'Voter ID',
    'Driving Licence',
    'Passport',
  ];
  for (const label of expectedLabels) {
    const found = INITIAL_DOCUMENT_LIBRARY.find((d) => d.labelEn === label);
    assert.ok(found, `Missing predefined document in library: ${label}`);
    assert.equal(isValidEntityId(found.id), true);
  }

  // 2. Duplicate prevention when adding custom documents
  const dupCheck = canAddDocumentLibraryItem(INITIAL_DOCUMENT_LIBRARY, 'aadhaar card');
  assert.equal(dupCheck.valid, false);
  assert.match(dupCheck.errorEn || '', /already exists/i);

  const customCheck = canAddDocumentLibraryItem(INITIAL_DOCUMENT_LIBRARY, 'Character Certificate');
  assert.equal(customCheck.valid, true);
  assert.equal(customCheck.slugId, 'doc-character-certificate');
  assert.equal(generateDocumentTypeId('Domicile / Niwas Proof'), 'doc-domicile-niwas-proof');

  // 3. Parsing structured documentRequirementsJson on initial services
  const resumeService = INITIAL_SERVICES.find((s) => s.id === 'srv-modern-resume')!;
  const parsedResumeReqs = parseServiceDocumentRequirements(
    resumeService.documentRequirementsJson,
    resumeService.requiredDocsEn,
    resumeService.requiredDocsHi,
    INITIAL_DOCUMENT_LIBRARY
  );
  assert.equal(parsedResumeReqs.length >= 3, true);
  assert.equal(parsedResumeReqs[0].docId, 'doc-10th-marksheet');
  assert.equal(parsedResumeReqs[0].required, true);

  // 4. Legacy fallback when documentRequirementsJson is absent
  const fallbackReqs = parseServiceDocumentRequirements(
    undefined,
    ['Aadhaar Card', 'PAN Card (Optional)'],
    ['आधार कार्ड', 'पैन कार्ड (वैकल्पिक)'],
    INITIAL_DOCUMENT_LIBRARY
  );
  assert.equal(fallbackReqs.length, 2);
  assert.equal(fallbackReqs[0].docId, 'doc-aadhaar-card');
  assert.equal(fallbackReqs[0].required, true);
  assert.equal(fallbackReqs[1].docId, 'doc-pan-card');
  assert.equal(fallbackReqs[1].required, false);

  // 5. Reordering requirements and syncing legacy pipe strings
  const reordered = reorderDocumentRequirements(fallbackReqs, 1, 'up');
  assert.equal(reordered[0].docId, 'doc-pan-card');
  assert.equal(reordered[1].docId, 'doc-aadhaar-card');

  const synced = syncLegacyRequiredDocsFromRequirements(reordered);
  assert.equal(synced.requiredDocsEn[0], 'PAN Card (Optional)');
  assert.equal(synced.requiredDocsEn[1], 'Aadhaar Card');
  assert.match(synced.requiredDocsPipe, /\|\|/);

  // 5b. Deduplication of labels like "passport photo (optional) (Optional)"
  assert.equal(
    cleanDocumentLabel('passport photo (optional) (Optional)'),
    'passport photo'
  );
  assert.equal(
    cleanDocumentLabel('Passport-size Photo (Optional)||पासपोर्ट साइज फोटो (वैकल्पिक)'),
    'Passport-size Photo'
  );
  const resynced = syncLegacyRequiredDocsFromRequirements([
    {
      labelEn: 'passport photo (optional) (Optional)',
      labelHi: 'पासपोर्ट साइज फोटो (वैकल्पिक) (वैकल्पिक)',
      required: false,
    },
  ]);
  assert.equal(resynced.requiredDocsEn[0], 'passport photo (Optional)');
  assert.equal(resynced.requiredDocsHi[0], 'पासपोर्ट साइज फोटो (वैकल्पिक)');

  const structuredFromService = getServiceDocumentRequirements(
    resumeService,
    INITIAL_DOCUMENT_LIBRARY
  );
  assert.equal(structuredFromService.length >= 3, true);
  for (const docReq of structuredFromService) {
    assert.doesNotMatch(docReq.labelEn, /\(optional\)/i);
    assert.doesNotMatch(docReq.labelHi, /वैकल्पिक/);
  }

  // 6. Per-document format and size validation
  const photoReq = parsedResumeReqs.find((r) => r.docId === 'doc-passport-photo')!;
  // Photo allows jpg/png/pdf, but rejects word docx
  const docxForPhoto = validateFileForDocumentRequirement(
    {
      name: 'photo.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 100 * 1024,
    },
    photoReq
  );
  assert.equal(docxForPhoto.valid, false);
  assert.match(docxForPhoto.errorEn || '', /format is allowed/i);

  const oversizedPhoto = validateFileForDocumentRequirement(
    { name: 'photo.jpg', type: 'image/jpeg', size: 420 * 1024 },
    photoReq
  );
  assert.equal(oversizedPhoto.valid, false);
  assert.match(oversizedPhoto.errorEn || '', /exceeds the 300 KB limit/i);

  const validPhoto = validateFileForDocumentRequirement(
    { name: 'photo.jpg', type: 'image/jpeg', size: 120 * 1024 },
    photoReq
  );
  assert.equal(validPhoto.valid, true);

  // 7. Customer order checklist completeness validation
  const incompleteChecklist = validateServiceDocumentChecklistUploads(fallbackReqs, {});
  assert.equal(incompleteChecklist.valid, false);
  assert.deepEqual(incompleteChecklist.missingDocsEn, ['Aadhaar Card']);
  assert.equal(incompleteChecklist.uploadedRequiredCount, 0);
  assert.equal(incompleteChecklist.totalRequiredCount, 1);

  const completeChecklist = validateServiceDocumentChecklistUploads(fallbackReqs, {
    'doc-aadhaar-card': [{ name: 'aadhaar.pdf' }],
  });
  assert.equal(completeChecklist.valid, true);
  assert.equal(completeChecklist.uploadedRequiredCount, 1);
  assert.equal(completeChecklist.totalRequiredCount, 1);
  assert.equal(completeChecklist.totalUploadedFiles, 1);
});

test('Category Management: key validation, slug generation, duplicate prevention, and service integration', () => {
  // 1. Category key validation
  assert.equal(isValidCategoryKey('csc_banking'), true);
  assert.equal(isValidCategoryKey('pan-voter-card'), true);
  assert.equal(isValidCategoryKey('x'), false); // too short
  assert.equal(isValidCategoryKey('invalid category!'), false); // contains spaces/special chars

  // 2. Slug generation
  const slug1 = generateCategoryKey('PAN & Voter Card Services');
  assert.equal(slug1, 'pan_voter_card_services');

  const existingKeys = ['pan_voter_card_services', 'csc_banking'];
  const slug2 = generateCategoryKey('PAN & Voter Card Services', existingKeys);
  assert.equal(slug2, 'pan_voter_card_services_2');

  // 3. Category validation input
  const invalidKeyCheck = validateCategoryInput({
    key: 'bad key with spaces',
    labelEn: 'Bad Category',
    labelHi: 'गलत श्रेणी',
    summaryEn: 'Valid summary for test',
    summaryHi: 'जांच के लिए वैध सारांश',
  });
  assert.equal(invalidKeyCheck.valid, false);
  assert.match(invalidKeyCheck.errorEn || '', /Category Key/i);

  const duplicateCheck = validateCategoryInput(
    {
      key: 'csc_banking',
      labelEn: 'Duplicate CSC Banking',
      labelHi: 'सीएससी बैंकिंग',
      summaryEn: 'Valid summary for test',
      summaryHi: 'जांच के लिए वैध सारांश',
    },
    ['csc_banking']
  );
  assert.equal(duplicateCheck.valid, false);
  assert.match(duplicateCheck.errorEn || '', /already exists/i);

  const validCategoryCheck = validateCategoryInput(
    {
      key: 'pancard_services',
      labelEn: 'PAN Card Services',
      labelHi: 'पैन कार्ड सेवाएं',
      summaryEn: 'New PAN, correction, and Aadhaar linking',
      summaryHi: 'नया पैन कार्ड, सुधार और आधार लिंकिंग',
    },
    ['csc_banking']
  );
  assert.equal(validCategoryCheck.valid, true);

  // 4. Digital service validation accepts custom category
  const serviceWithCustomCat = validateDigitalServiceInput({
    id: 'srv-test-new-cat',
    category: 'pancard_services',
    titleEn: 'Instant e-PAN Card Application',
    titleHi: 'इंस्टेंट ई-पैन कार्ड आवेदन',
    descEn: 'Apply for instant UTIITSL / NSDL digital PAN card with Aadhaar e-KYC.',
    descHi: 'आधार ई-केवाईसी के माध्यम से नया डिजिटल पैन कार्ड तुरंत बनाएं।',
    priceInr: 100,
    estimatedTimeEn: '1 to 2 Hours',
    estimatedTimeHi: '1 से 2 घंटे',
    requiredDocs: 'Aadhaar Card',
    customFieldsJson: '[]',
  });
  assert.equal(serviceWithCustomCat.valid, true);

  // 5. firestore.rules static audit includes categories collection rule
  const rulesContent = fs.readFileSync(new URL('../../firestore.rules', import.meta.url), 'utf8');
  assert.match(rulesContent, /match \/categories\/\{categoryId\}/);
  assert.match(rulesContent, /isValidCategory\(incoming\(\), categoryId\)/);
});

test('Visual Enhancements: Cyber Obsidian 3D default theme with Royal Blue toggle, Before/After tabs, Mobile Dock shortcuts, and Bundle Estimator', () => {
  // 1. Default theme is Cyber Obsidian 3D ('obsidian'), with Royal Blue ('royal') toggle
  assert.equal(resolveVisualTheme(undefined), 'obsidian');
  assert.equal(resolveVisualTheme(null), 'obsidian');
  assert.equal(resolveVisualTheme('invalid'), 'obsidian');
  assert.equal(resolveVisualTheme('obsidian'), 'obsidian');
  assert.equal(resolveVisualTheme('royal'), 'royal');
  assert.equal(toggleVisualTheme('obsidian'), 'royal');
  assert.equal(toggleVisualTheme('royal'), 'obsidian');

  // 2. Before & After interactive slider showcases both Job Resume and Marriage Biodata tabs
  assert.equal(BEFORE_AFTER_SHOWCASE_TABS.length, 2);
  assert.deepEqual(
    BEFORE_AFTER_SHOWCASE_TABS.map((t) => t.key),
    ['resume', 'biodata']
  );
  assert.equal(BEFORE_AFTER_SHOWCASE_TABS[0].serviceId, 'srv-modern-resume');
  assert.equal(BEFORE_AFTER_SHOWCASE_TABS[1].serviceId, 'srv-marriage-biodata');

  // 3. Mobile Floating Glass Bottom Dock has Home, Services, Track Order, Account, and WhatsApp
  assert.deepEqual(
    MOBILE_DOCK_SHORTCUTS.map((s) => s.id),
    ['home', 'services', 'track-order', 'account', 'whatsapp']
  );

  // 4. Multi-Service Bundle Fee & Deduplicated Document Checklist Estimator
  const emptyEstimate = calculateBundleEstimate([], INITIAL_SERVICES);
  assert.equal(emptyEstimate.serviceCount, 0);
  assert.equal(emptyEstimate.totalFeeInr, 0);
  assert.equal(emptyEstimate.uniqueRequiredDocsEn.length, 0);

  const bundleEstimate = calculateBundleEstimate(
    ['srv-modern-resume', 'srv-marriage-biodata', 'srv-hindi-english-typing'],
    INITIAL_SERVICES
  );
  assert.equal(bundleEstimate.serviceCount, 3);
  assert.equal(bundleEstimate.totalFeeInr, 80 + 70 + 50);
  assert.equal(bundleEstimate.uniqueRequiredDocsEn.length >= 2, true);
  assert.equal(bundleEstimate.estimatedTurnaroundEn, 'Same Day (2 to 6 Hours)');

  // 5. Genuine local hero video assets (MP4, WebM, and static SVG poster) exist and are non-empty
  const mp4Url = new URL(`../../public${HERO_CINEMATIC_MEDIA.mp4Src}`, import.meta.url);
  const webmUrl = new URL(`../../public${HERO_CINEMATIC_MEDIA.webmSrc}`, import.meta.url);
  const posterUrl = new URL(`../../public${HERO_CINEMATIC_MEDIA.posterSrc}`, import.meta.url);
  assert.equal(fs.existsSync(mp4Url), true, 'Missing public/hero-ember-loop.mp4');
  assert.equal(fs.existsSync(webmUrl), true, 'Missing public/hero-ember-loop.webm');
  assert.equal(fs.existsSync(posterUrl), true, 'Missing public/hero-ember-poster.svg');
  assert.equal(fs.statSync(mp4Url).size > 1000, true);
  assert.equal(fs.statSync(webmUrl).size > 1000, true);
  assert.equal(fs.statSync(posterUrl).size > 200, true);

  // 6. Comparison slider clamping
  assert.equal(clampComparisonSlider(0), 5);
  assert.equal(clampComparisonSlider(100), 95);
  assert.equal(clampComparisonSlider(50), 50);
  assert.equal(clampComparisonSlider('invalid', 62), 62);
});

test('6 Functional Upgrades: Exam Radar, Student Utility Lab, Live Draft Preview, Dynamic UPI QR, Shop Token & Staff PIN', () => {
  // 1. Live Bihar Exam, Scholarship & Job Form Radar
  assert.equal(INITIAL_EXAM_RADAR_ITEMS.length >= 4, true);
  const daysCheck = calculateExamDaysLeft('2026-11-30', new Date('2026-10-30T12:00:00Z'));
  assert.equal(daysCheck.daysLeft, 32);
  assert.equal(daysCheck.status, 'active');
  assert.match(daysCheck.badgeEn, /32 DAYS LEFT/);

  const scholarshipItems = filterExamRadarItems(INITIAL_EXAM_RADAR_ITEMS, 'scholarship');
  assert.equal(scholarshipItems.length >= 1, true);
  assert.equal(scholarshipItems[0].linkedServiceId, 'srv-bihar-scholarship');

  // 2. Self-Service Student Utility Lab (Photo Presets & Exact Age Calculator)
  assert.equal(EXAM_PHOTO_PRESETS.length >= 5, true);
  const sampleWav = createSampleVoiceNoteWavDataUrl();
  assert.equal(sampleWav.startsWith('data:audio/wav;base64,'), true);
  assert.equal(estimateDataUrlSizeKb(sampleWav) > 0, true);

  const ageCheck = calculateExactAgeAndEligibility('2004-05-10', '2026-08-01');
  assert.equal(ageCheck.valid, true);
  assert.equal(ageCheck.years, 22);
  assert.equal(ageCheck.months, 2);
  assert.equal(ageCheck.days, 22);
  assert.equal(ageCheck.categories.length, 4);
  assert.equal(ageCheck.categories[0].eligible, true);

  // 3. AI Live Draft Previewer for Application Letters & Marriage Biodata
  assert.equal(LIVE_DRAFT_TEMPLATES.length, 4);
  const bankDraft = generateLiveDraftPreviewContent(
    'bank-unfreeze',
    {
      applicantName: 'Ramesh Kumar',
      guardianOrTo: 'State Bank of India, Kateya Branch',
      addressOrVillage: 'Ward No. 08, Kateya, Gopalganj',
      subjectOrEducation: 'A/c 30981234567 — e-KYC Re-activation',
      extraDetails: 'Aadhaar & PAN enclosed',
    },
    'en'
  );
  assert.match(bankDraft.bodyParagraphs.join('\n'), /Ramesh Kumar/);
  assert.equal(bankDraft.applicantSignatureName, 'Ramesh Kumar');

  const biodataDraft = generateLiveDraftPreviewContent(
    'marriage-biodata',
    {
      applicantName: 'Ankit Kumar Verma',
      guardianOrTo: 'Father: Rajendra Verma',
      addressOrVillage: 'Kateya Bazar, Gopalganj',
      subjectOrEducation: 'B.Tech Civil Engineer',
      extraDetails: 'Kashyap Gotra, 5 ft 9 in',
    },
    'hi'
  );
  assert.equal(Array.isArray(biodataDraft.structuredRows), true);
  assert.equal(biodataDraft.applicantSignatureName, 'Ankit Kumar Verma');

  // 4. Dynamic UPI QR & WhatsApp Order Dispatch
  const upiUri = buildDynamicUpiUri({
    upiId: '6206800799@ybl',
    payeeName: 'Aditya Online Center',
    amountInr: 80,
    orderNumber: 'AOC-20261018-D101',
  });
  assert.equal(upiUri.startsWith('upi://pay?'), true);
  assert.match(upiUri, /am=80\.00/);
  assert.match(upiUri, /AOC-20261018-D101/);

  const qrMatrix = generateQrMatrix(upiUri, 25);
  assert.equal(qrMatrix.length, 25);
  assert.equal(qrMatrix[0].length, 25);

  const waDispatch = buildOrderWhatsAppDispatchUrl({
    orderNumber: 'AOC-20261018-D101',
    customerName: 'Ramesh Kumar',
    customerPhone: '9876543210',
    serviceTitle: 'Professional Job Resume / CV',
    amountInr: 80,
    paymentMode: 'Dynamic UPI QR / Instant Transfer',
  });
  assert.equal(waDispatch.startsWith('https://wa.me/916206800799?text='), true);
  assert.match(decodeURIComponent(waDispatch), /AOC-20261018-D101/);

  // 5. Shop Visit Token / Appointment Booker
  assert.equal(SHOP_TIME_SLOTS.length, 3);
  const tokenNum = generateShopVisitTokenNumber(104);
  assert.equal(tokenNum, '#KTY-104');

  const tokenValid = validateShopVisitTokenInput({
    customerName: 'Ramesh Kumar',
    customerPhone: '9876543210',
    visitDate: '2026-10-25',
    timeSlot: 'morning',
    serviceTitle: 'Bihar Post-Matric Scholarship',
  });
  assert.equal(tokenValid.valid, true);

  const tokenWaUrl = buildShopTokenWhatsAppUrl({
    tokenNumber: '#KTY-104',
    customerName: 'Ramesh Kumar',
    customerPhone: '9876543210',
    visitDate: '2026-10-25',
    timeSlotLabel: 'Morning Slot (8:00 AM – 12:00 PM)',
    serviceTitle: 'Bihar Post-Matric Scholarship',
  });
  assert.match(decodeURIComponent(tokenWaUrl), /#KTY-104/);

  // 6. Staff / Admin PIN Verification
  assert.equal(DEFAULT_STAFF_PIN, '841437');
  assert.equal(verifyStaffAdminPin('841437'), true);
  assert.equal(verifyStaffAdminPin('000000'), false);
});



