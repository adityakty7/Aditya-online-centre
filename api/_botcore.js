// Aditya Online Center — WhatsApp bot core for the Vercel webhook function.
// Customer-facing language: English. The menu is a WhatsApp interactive list
// (tap "Select Service" and choose); numbers/keywords still work as fallback.
// Orders are written to the website's Firestore 'orders' collection by the
// caller via the injected store. Refs use the website format AOC-YYYYMMDD-XXXX.
'use strict';

const CATALOG = {
 "services": [
  {
   "id": "srv-modern-resume",
   "category": "resume_biodata",
   "titleEn": "Professional Job Resume / CV (ATS-Ready)",
   "titleHi": "प्रोफेशनल जॉब रिज्यूमे / सीवी (ATS-रेडी)",
   "priceInr": 80,
   "estimatedTimeEn": "2 to 4 Hours",
   "estimatedTimeHi": "2 से 4 घंटे",
   "docs": [
    {
     "labelEn": "10th Marksheet / Matric Certificate",
     "labelHi": "10वीं (मैट्रिक) मार्कशीट",
     "required": true,
     "maxSizeKb": 500
    },
    {
     "labelEn": "12th / Graduation / Technical Marksheet",
     "labelHi": "12वीं / स्नातक / कंप्यूटर डिप्लोमा मार्कशीट",
     "required": false,
     "maxSizeKb": 500
    },
    {
     "labelEn": "Passport-size Photo",
     "labelHi": "पासपोर्ट साइज फोटो",
     "required": false,
     "maxSizeKb": 300
    }
   ]
  },
  {
   "id": "srv-marriage-biodata",
   "category": "resume_biodata",
   "titleEn": "Traditional & Modern Marriage Biodata",
   "titleHi": "पारंपरिक और आधुनिक विवाह बायोडाटा",
   "priceInr": 70,
   "estimatedTimeEn": "2 to 3 Hours",
   "estimatedTimeHi": "2 से 3 घंटे",
   "docs": [
    {
     "labelEn": "Handwritten Family & Personal Details Sheet",
     "labelHi": "हस्तलिखित पारिवारिक और व्यक्तिगत विवरण पेज",
     "required": false,
     "maxSizeKb": 500
    },
    {
     "labelEn": "Passport-size Photo",
     "labelHi": "पासपोर्ट साइज फोटो",
     "required": false,
     "maxSizeKb": 300
    }
   ]
  },
  {
   "id": "srv-hindi-english-typing",
   "category": "letters_formatting",
   "titleEn": "Official Application Letter & Bilingual Typing",
   "titleHi": "आधिकारिक आवेदन पत्र और हिंदी/अंग्रेजी टाइपिंग",
   "priceInr": 50,
   "estimatedTimeEn": "1 to 3 Hours",
   "estimatedTimeHi": "1 से 3 घंटे",
   "docs": [
    {
     "labelEn": "Handwritten Draft / Supporting Notes",
     "labelHi": "हस्तलिखित आवेदन ड्राफ्ट / मैटर पेज",
     "required": true,
     "maxSizeKb": 500
    },
    {
     "labelEn": "Aadhaar Card / ID Reference",
     "labelHi": "आधार कार्ड / पहचान संदर्भ",
     "required": false,
     "maxSizeKb": 500
    }
   ]
  },
  {
   "id": "srv-pdf-resize-merge",
   "category": "pdf_tools",
   "titleEn": "PDF Merge, Compression & Photo/Signature Resize Pack",
   "titleHi": "PDF मर्ज, साइज कम करना और फोटो/हस्ताक्षर रीसाइज पैक",
   "priceInr": 40,
   "estimatedTimeEn": "1 to 2 Hours",
   "estimatedTimeHi": "1 से 2 घंटे",
   "docs": [
    {
     "labelEn": "Document / Marksheet Scan to Resize or Merge",
     "labelHi": "रीसाइज या मर्ज करने के लिए मुख्य दस्तावेज़",
     "required": true,
     "maxSizeKb": 500
    },
    {
     "labelEn": "Passport-size Photo (For Dimension Resize)",
     "labelHi": "पासपोर्ट साइज फोटो (माप सेट करने हेतु)",
     "required": false,
     "maxSizeKb": 300
    },
    {
     "labelEn": "Signature (Hindi / English)",
     "labelHi": "हस्ताक्षर (हिंदी / अंग्रेजी)",
     "required": false,
     "maxSizeKb": 200
    }
   ]
  },
  {
   "id": "srv-govt-job-form",
   "category": "govt_job_assistance",
   "titleEn": "Recruitment & Competitive Exam Online Form Assistance",
   "titleHi": "सरकारी नौकरी और प्रतियोगी परीक्षा ऑनलाइन फॉर्म सहायता",
   "priceInr": 100,
   "estimatedTimeEn": "3 to 6 Hours",
   "estimatedTimeHi": "3 से 6 घंटे",
   "docs": [
    {
     "labelEn": "Aadhaar Card",
     "labelHi": "आधार कार्ड",
     "required": true,
     "maxSizeKb": 500
    },
    {
     "labelEn": "10th Marksheet / Matric Certificate",
     "labelHi": "10वीं (मैट्रिक) मार्कशीट",
     "required": true,
     "maxSizeKb": 500
    },
    {
     "labelEn": "Passport-size Photo",
     "labelHi": "पासपोर्ट साइज फोटो",
     "required": true,
     "maxSizeKb": 300
    },
    {
     "labelEn": "Signature (Hindi / English)",
     "labelHi": "हस्ताक्षर (हिंदी और अंग्रेजी)",
     "required": true,
     "maxSizeKb": 200
    },
    {
     "labelEn": "12th / Intermediate Marksheet",
     "labelHi": "12वीं (इंटरमीडिएट) मार्कशीट",
     "required": false,
     "maxSizeKb": 500
    },
    {
     "labelEn": "Caste / EWS / OBC Certificate",
     "labelHi": "जाति / EWS / OBC प्रमाणपत्र",
     "required": false,
     "maxSizeKb": 500
    },
    {
     "labelEn": "Residence / Domicile Certificate",
     "labelHi": "निवास प्रमाणपत्र (Domicile)",
     "required": false,
     "maxSizeKb": 500
    }
   ]
  },
  {
   "id": "srv-scholarship-admission",
   "category": "scholarship_admission",
   "titleEn": "Bihar Post-Matric Scholarship & College Admission Assistance",
   "titleHi": "बिहार पोस्ट-मैट्रिक छात्रवृत्ति और कॉलेज नामांकन सहायता",
   "priceInr": 90,
   "estimatedTimeEn": "4 to 8 Hours",
   "estimatedTimeHi": "4 से 8 घंटे",
   "docs": [
    {
     "labelEn": "Bonafide Certificate",
     "labelHi": "बोनाफाइड प्रमाणपत्र",
     "required": true,
     "maxSizeKb": 500
    },
    {
     "labelEn": "Admission / College Fee Receipt",
     "labelHi": "नामांकन / कॉलेज शुल्क रसीद",
     "required": true,
     "maxSizeKb": 500
    },
    {
     "labelEn": "Income Certificate",
     "labelHi": "आय प्रमाणपत्र",
     "required": true,
     "maxSizeKb": 500
    },
    {
     "labelEn": "Residence Certificate",
     "labelHi": "निवास प्रमाणपत्र",
     "required": true,
     "maxSizeKb": 500
    },
    {
     "labelEn": "Caste Certificate",
     "labelHi": "जाति प्रमाणपत्र",
     "required": true,
     "maxSizeKb": 500
    },
    {
     "labelEn": "Aadhaar Card",
     "labelHi": "आधार कार्ड",
     "required": true,
     "maxSizeKb": 500
    },
    {
     "labelEn": "Previous Exam Marksheet (10th / 12th)",
     "labelHi": "पिछली कक्षा की मार्कशीट (10वीं / 12वीं)",
     "required": false,
     "maxSizeKb": 500
    },
    {
     "labelEn": "Bank Passbook",
     "labelHi": "बैंक पासबुक",
     "required": false,
     "maxSizeKb": 500
    }
   ]
  },
  {
   "id": "srv-citizen-form-support",
   "category": "other_online_forms",
   "titleEn": "Citizen Portal Form & Certificate Application Assistance",
   "titleHi": "आरटीपीएस (जाति/आय/निवास) व अन्य ऑनलाइन फॉर्म सहायता",
   "priceInr": 60,
   "estimatedTimeEn": "3 to 6 Hours",
   "estimatedTimeHi": "3 से 6 घंटे",
   "docs": [
    {
     "labelEn": "Aadhaar Card",
     "labelHi": "आधार कार्ड",
     "required": true,
     "maxSizeKb": 500
    },
    {
     "labelEn": "Self-Declaration Form (Shapath Patra)",
     "labelHi": "स्व-घोषणा पत्र (शपथ पत्र)",
     "required": true,
     "maxSizeKb": 500
    },
    {
     "labelEn": "Passport-size Photo",
     "labelHi": "पासपोर्ट साइज फोटो",
     "required": true,
     "maxSizeKb": 300
    },
    {
     "labelEn": "Supporting Family / Land / Address Proof",
     "labelHi": "सहायक पता / खतियान / राशन कार्ड प्रमाण",
     "required": false,
     "maxSizeKb": 500
    }
   ]
  },
  {
   "id": "srv-aadhaar-pan-update",
   "category": "other_online_forms",
   "titleEn": "Aadhaar Demographic & PAN Correction Form Assistance",
   "titleHi": "आधार पता एवं पैन कार्ड सुधार फॉर्म सहायता",
   "priceInr": 70,
   "estimatedTimeEn": "2 to 4 Hours",
   "estimatedTimeHi": "2 से 4 घंटे",
   "docs": [
    {
     "labelEn": "Aadhaar Card (Front & Back)",
     "labelHi": "आधार कार्ड (आगे और पीछे)",
     "required": true,
     "maxSizeKb": 500
    },
    {
     "labelEn": "Valid Address / DOB Proof (Residence Cert / Marksheet)",
     "labelHi": "वैध पता या जन्मतिथि प्रमाण (निवास प्रमाणपत्र / मार्कशीट)",
     "required": true,
     "maxSizeKb": 500
    },
    {
     "labelEn": "Existing PAN Card Copy",
     "labelHi": "मौजूदा पैन कार्ड की प्रति",
     "required": false,
     "maxSizeKb": 500
    }
   ]
  }
 ]
};

const OPERATOR_WA = '916206800799';

// Short names for WhatsApp list rows (row titles are limited to 24 characters).
const SHORT_NAMES = {
  'srv-modern-resume': 'Job Resume / CV',
  'srv-marriage-biodata': 'Marriage Biodata',
  'srv-hindi-english-typing': 'Typing & Letters',
  'srv-pdf-resize-merge': 'PDF Tools',
  'srv-govt-job-form': 'Govt Job Exam Form',
  'srv-scholarship-admission': 'Scholarship & Admission',
  'srv-citizen-form-support': 'Citizen Certificates',
  'srv-aadhaar-pan-update': 'Aadhaar & PAN Update',
};

function menuListMessage() {
  return {
    kind: 'list',
    body: '🙏 Welcome to *Aditya Online Center*!\n\nPlease select the service you need.\n\nTo check your order, type *STATUS*.',
    buttonText: 'Select Service',
    sectionTitle: 'Our Services',
    rows: CATALOG.services.map(s => ({
      id: s.id,
      title: SHORT_NAMES[s.id] || s.titleEn.slice(0, 24),
      description: `₹${s.priceInr} • ${s.estimatedTimeEn}`,
    })),
  };
}

function menuTextFallback() {
  const lines = CATALOG.services.map((s, i) => `${i + 1}. ${s.titleEn} — ₹${s.priceInr}`);
  return `🙏 Welcome to *Aditya Online Center*!\n\nWhich service do you need? Send the number:\n\n${lines.join('\n')}\n\nTo check your order, type *STATUS*.`;
}

function checklistMessage(service) {
  const req = service.docs.filter(d => d.required);
  const opt = service.docs.filter(d => !d.required);
  let t = `✅ *${service.titleEn}*\n💰 Price: ₹${service.priceInr} | ⏱ Time: ${service.estimatedTimeEn}\n\n📋 *Documents needed — please send photos/PDFs here:*\n`;
  t += req.map((d, i) => `${i + 1}. ${d.labelEn}`).join('\n');
  if (opt.length) {
    t += `\n\n📎 *If you have them, also send (optional):*` + opt.map(d => `• ${d.labelEn}`).join('\n');
  }
  t += `\n\nWhen you have sent everything, tap *Done* below (or type DONE).`;
  return { kind: 'buttons', text: t, buttons: [{ id: 'done', title: '✅ Done' }, { id: 'status', title: '📦 My Status' }] };
}

function requiredCount(service) {
  return service.docs.filter(d => d.required).length;
}

function newRef(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase().replace(/[^A-Z0-9]/g, '7');
  return `AOC-${y}${m}${d}-${suffix}`;
}

const STATUS_FRIENDLY = {
  'Submitted': 'Submitted ✅ (received)',
  'In Progress': 'In Process ⏳ (work is going on)',
  'Completed': 'Ready 🎉 (your document is ready)',
  'Delivered': 'Done ✅ (completed)',
  'Under Review': 'Under Review 👀',
  'Cancelled': 'Cancelled ❌',
};

function statusText(ref, order) {
  const st = STATUS_FRIENDLY[order.status] || order.status;
  return `📦 *Ref #${ref}*\nService: ${order.serviceTitleEn}\nStatus: ${st}`;
}

function pickService(session, service) {
  session.stage = 'collecting';
  session.serviceId = service.id;
  session.docsReceived = 0;
  session.ref = null;
  return checklistMessage(service);
}

// store: { getOrder(ref), createOrder(ref, data), setOrderStatus(ref, status) }
// session (mutated): { stage, serviceId, docsReceived, ref, name }
// input: { text } | { document: true } | { selectId } | { buttonId }
// returns { replies: [messageDescriptor], operatorNotices: [text] }
async function handleCustomer(store, session, input, customerWa, profileName) {
  const replies = [];
  const operatorNotices = [];
  const text = (input.text || '').trim();
  if (profileName) session.name = profileName;

  if (input.buttonId === 'status' || /^status$/i.test(text) || /AOC-\d{8}-[A-Z0-9]{4}/i.test(text)) {
    const m = text.match(/AOC-\d{8}-[A-Z0-9]{4}/i);
    const ref = (m ? m[0] : session.ref || '').toUpperCase();
    if (ref) {
      const o = await store.getOrder(ref);
      if (o) { replies.push({ kind: 'text', text: statusText(ref, o) }); return { replies, operatorNotices }; }
    }
    if (session.stage === 'collecting') {
      replies.push({ kind: 'text', text: 'Your order is not confirmed yet — please send your documents and tap Done first.' });
    } else {
      replies.push({ kind: 'text', text: 'No order found yet. Please select a service first, or send the correct Ref number.' });
      replies.push(menuListMessage());
    }
    return { replies, operatorNotices };
  }

  if (input.selectId) {
    const service = CATALOG.services.find(s => s.id === input.selectId);
    if (service) { replies.push(pickService(session, service)); return { replies, operatorNotices }; }
  }

  if (session.stage === 'collecting') {
    const service = CATALOG.services.find(s => s.id === session.serviceId);
    if (!service) { session.stage = 'menu'; replies.push(menuListMessage()); return { replies, operatorNotices }; }
    if (input.document) {
      session.docsReceived += 1;
      const need = requiredCount(service);
      if (session.docsReceived < need) {
        replies.push({ kind: 'text', text: `✅ Document received (${session.docsReceived}/${need}). Please keep sending the rest — tap Done when finished.` });
      } else {
        replies.push({ kind: 'text', text: `✅ ${session.docsReceived} documents received. If that is all, tap Done or type *DONE*.` });
      }
      return { replies, operatorNotices };
    }
    if (input.buttonId === 'done' || /^done$/i.test(text)) {
      const need = requiredCount(service);
      if (session.docsReceived === 0) {
        replies.push({ kind: 'text', text: 'No document received yet. Please send the document photos/PDFs here first, then tap Done.' });
        return { replies, operatorNotices };
      }
      const ref = newRef();
      session.ref = ref;
      session.stage = 'ordered';
      await store.createOrder(ref, {
        service, customerWa, customerName: session.name || 'WhatsApp Customer',
        docsReceived: session.docsReceived, docsRequired: need,
      });
      replies.push({ kind: 'text', text: `🎉 *Application confirmed!*\n\nRef #${ref}\nService: ${service.titleEn}\n💰 Price: ₹${service.priceInr}\nStatus: Submitted ✅\n\nWe will message you here when the status changes. Thank you! 🙏` });
      operatorNotices.push(`🔔 *New WhatsApp order*\nRef: ${ref}\nService: ${service.titleEn} (₹${service.priceInr})\nCustomer: ${session.name || ''} (${customerWa})\nDocuments: ${session.docsReceived}/${need}${session.docsReceived >= need ? '' : ' ⚠️ incomplete'}`);
      return { replies, operatorNotices };
    }
    replies.push({ kind: 'text', text: 'Please keep sending your documents 📎 Tap Done when finished.' });
    return { replies, operatorNotices };
  }

  let idx = -1;
  if (/^\d+$/.test(text)) idx = parseInt(text, 10) - 1;
  if (idx < 0 || idx >= CATALOG.services.length) {
    const low = text.toLowerCase();
    if (low.length >= 4) {
      idx = CATALOG.services.findIndex(s => {
        const words = (s.titleEn.toLowerCase() + ' ' + s.id.replace(/^srv-/, '').replace(/-/g, ' ')).split(/[^a-z]+/);
        return words.some(w => w.length >= 4 && (w === low || w.startsWith(low) || low.startsWith(w)));
      });
    }
  }
  if (idx >= 0 && idx < CATALOG.services.length) {
    replies.push(pickService(session, CATALOG.services[idx]));
    return { replies, operatorNotices };
  }

  replies.push(menuListMessage());
  if (session.stage !== 'ordered') session.stage = 'menu';
  return { replies, operatorNotices };
}

// Operator commands: "<REF> PROCESS" / "<REF> READY" / "<REF> DONE"
async function handleOperator(store, text) {
  const m = (text || '').trim().match(/^(AOC-\d{8}-[A-Z0-9]{4})\s+(PROCESS|READY|DONE)$/i);
  if (!m) return { matched: false, ack: null, notify: null };
  const ref = m[1].toUpperCase();
  const o = await store.getOrder(ref);
  if (!o) return { matched: true, ack: `Ref ${ref} not found.`, notify: null };
  const cmd = m[2].toUpperCase();
  const newStatus = cmd === 'PROCESS' ? 'In Progress' : cmd === 'READY' ? 'Completed' : 'Delivered';
  await store.setOrderStatus(ref, newStatus);
  const msg = cmd === 'PROCESS'
    ? `⏳ *Ref #${ref}* — your work is now in process.`
    : cmd === 'READY'
      ? `🎉 *Ref #${ref}* — your document is ready! It will reach you shortly.`
      : `✅ *Ref #${ref}* — your work is complete. Thank you! 🙏`;
  return { matched: true, ack: `✅ ${ref} → ${newStatus}`, notify: o.customerWa ? { to: o.customerWa, text: msg } : null };
}

export { CATALOG, OPERATOR_WA, menuListMessage, menuTextFallback, checklistMessage, handleCustomer, handleOperator, newRef };
