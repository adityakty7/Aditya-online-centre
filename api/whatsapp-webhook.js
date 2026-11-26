// Aditya Online Center — WhatsApp Cloud API webhook (Vercel serverless function).
// Receives customer messages, runs the bot core (./_botcore.js), stores sessions
// and orders in the website's Firestore database, and replies via the Graph API.
//
// Required Vercel env vars:
//   WHATSAPP_TOKEN            permanent system-user token (never expires)
//   WHATSAPP_PHONE_NUMBER_ID  e.g. the Meta test number id
//   WHATSAPP_VERIFY_TOKEN     any secret string; must match the Meta webhook config
//   FIREBASE_SERVICE_ACCOUNT  service-account JSON (single line) for Admin SDK
// Optional:
//   WHATSAPP_APP_SECRET       enables X-Hub-Signature-256 verification
import { createHmac, timingSafeEqual } from 'node:crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { CATALOG, OPERATOR_WA, handleCustomer, handleOperator } from './_botcore.js';

export const config = { api: { bodyParser: false } };

const DATABASE_ID = 'ai-studio-adityaonlinecent-66ac6c85-22d9-4621-97c1-ac4ad93118d4';
const GRAPH = 'https://graph.facebook.com/v22.0';

let dbInstance = null;
function db() {
  if (!dbInstance) {
    if (!getApps().length) {
      // Prefer the base64 form: it survives dashboard copy/paste intact, while
      // raw JSON can lose its \n escapes and fail to parse.
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT_B64
        ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_B64, 'base64').toString('utf8')
        : process.env.FIREBASE_SERVICE_ACCOUNT || '{}';
      const sa = JSON.parse(raw);
      initializeApp({ credential: cert(sa) });
    }
    dbInstance = getFirestore(getApps()[0], DATABASE_ID);
  }
  return dbInstance;
}

async function sendWhatsApp(to, text) {
  const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    }),
  });
  if (!res.ok) {
    console.error('WhatsApp send failed', res.status, await res.text().catch(() => ''));
  }
}

// Store implementation over Firestore (Admin SDK bypasses security rules).
function makeStore(database) {
  return {
    async getOrder(ref) {
      const snap = await database.doc(`orders/${ref}`).get();
      if (!snap.exists) return null;
      const idx = await database.doc(`whatsappOrders/${ref}`).get();
      return { ...snap.data(), customerWa: idx.exists ? idx.data().customerWa : null };
    },
    async createOrder(ref, { service, customerWa, customerName, docsReceived, docsRequired }) {
      const orderFields = {
        orderNumber: ref,
        customerId: `whatsapp-${customerWa}`,
        customerName: String(customerName || 'WhatsApp Customer').slice(0, 100),
        customerPhone: customerWa,
        customerEmail: '',
        customerLocation: '',
        serviceId: service.id,
        serviceTitleEn: service.titleEn,
        serviceTitleHi: service.titleHi,
        serviceCategory: service.category,
        priceInr: service.priceInr,
        estimatedCompletion: service.estimatedTimeEn,
        formResponsesSummary: `WhatsApp bot order. Documents received: ${docsReceived}/${docsRequired} (counted by bot; files arrive in the WhatsApp chat).`,
        customerNotes: 'Order placed via WhatsApp bot',
        status: 'Submitted',
        paymentStatus: 'Unpaid',
        paymentUtr: '',
        adminNote: '',
        missingInfoRequest: '',
        customerInfoReply: '',
        uploadedFileCount: docsReceived,
        hasDeliverable: false,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      await database.doc(`orders/${ref}`).set(orderFields);
      await database.doc(`whatsappOrders/${ref}`).set({
        ref, customerWa, serviceId: service.id, createdAt: FieldValue.serverTimestamp(),
      });
    },
    async setOrderStatus(ref, status) {
      await database.doc(`orders/${ref}`).update({
        status, updatedAt: FieldValue.serverTimestamp(),
      });
    },
  };
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function signatureValid(rawBody, header) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true; // check skipped until the secret is configured
  if (!header || !header.startsWith('sha256=')) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const given = header.slice('sha256='.length);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(given));
  } catch {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send('verification failed');
    }
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).send('method not allowed');
    return;
  }

  const raw = await readRawBody(req);
  if (!signatureValid(raw, req.headers['x-hub-signature-256'])) {
    res.status(401).send('bad signature');
    return;
  }

  try {
    const payload = JSON.parse(raw.toString('utf8'));
    const database = db();
    const store = makeStore(database);

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value || {};
        const contacts = value.contacts || [];
        for (const msg of value.messages || []) {
          const from = msg.from;
          if (!from) continue;
          const profileName = (contacts.find(c => c.wa_id === from) || {}).profile?.name || '';
          const input = msg.type === 'text'
            ? { text: msg.text?.body || '' }
            : ['image', 'document', 'video', 'audio'].includes(msg.type)
              ? { document: true }
              : { text: '' };

          // Operator commands only when the message matches the exact command
          // format; anything else from the operator number is treated as a
          // normal customer message (lets the owner test the bot himself).
          if (from === OPERATOR_WA && input.text) {
            const r = await handleOperator(store, input.text);
            if (r.matched) {
              if (r.notify) await sendWhatsApp(r.notify.to, r.notify.text);
              if (r.ack) await sendWhatsApp(from, r.ack);
              continue;
            }
          }

          const sessionRef = database.doc(`whatsappSessions/${from}`);
          const snap = await sessionRef.get();
          const session = snap.exists
            ? snap.data()
            : { stage: 'menu', serviceId: null, docsReceived: 0, ref: null, name: '' };
          const { replies, operatorNotices } = await handleCustomer(store, session, input, from, profileName);
          await sessionRef.set({ ...session, updatedAt: FieldValue.serverTimestamp() });
          for (const text of replies) await sendWhatsApp(from, text);
          for (const notice of operatorNotices) await sendWhatsApp(OPERATOR_WA, notice);
        }
      }
    }
  } catch (err) {
    console.error('webhook error', err);
  }
  res.status(200).json({ ok: true });
}
