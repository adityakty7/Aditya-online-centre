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

// Sends one bot message. Accepts a plain string (text) or a descriptor from
// the bot core: { kind: 'text' | 'list' | 'buttons', ... }.
async function sendWhatsApp(to, message) {
  let payload;
  if (typeof message === 'string' || message.kind === 'text') {
    payload = {
      messaging_product: 'whatsapp', to, type: 'text',
      text: { body: typeof message === 'string' ? message : message.text },
    };
  } else if (message.kind === 'list') {
    payload = {
      messaging_product: 'whatsapp', to, type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: message.body },
        action: {
          button: message.buttonText,
          sections: [{ title: message.sectionTitle, rows: message.rows }],
        },
      },
    };
  } else if (message.kind === 'buttons') {
    payload = {
      messaging_product: 'whatsapp', to, type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: message.text },
        action: {
          buttons: message.buttons.map(b => ({ type: 'reply', reply: { id: b.id, title: b.title } })),
        },
      },
    };
  } else {
    return;
  }
  const res = await fetch(`${GRAPH}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
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
    async saveProfile(wa, profile) {
      const ref = database.doc(`whatsappCustomers/${wa}`);
      const snap = await ref.get();
      await ref.set({
        name: profile.name, address: profile.address, mobile: profile.mobile, wa,
        updatedAt: FieldValue.serverTimestamp(),
        ...(snap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      }, { merge: true });
    },
    async createOrder(ref, { service, customerWa, customerName, customerPhone, customerLocation, docsReceived, docsRequired }) {
      const orderFields = {
        orderNumber: ref,
        customerId: `whatsapp-${customerWa}`,
        customerName: String(customerName || 'WhatsApp Customer').slice(0, 100),
        customerPhone: customerPhone || customerWa,
        customerEmail: '',
        customerLocation: customerLocation || '',
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
          let input;
          if (msg.type === 'text') {
            input = { text: msg.text?.body || '' };
          } else if (msg.type === 'interactive' && msg.interactive?.list_reply) {
            input = { selectId: msg.interactive.list_reply.id };
          } else if (msg.type === 'interactive' && msg.interactive?.button_reply) {
            input = { buttonId: msg.interactive.button_reply.id };
          } else if (['image', 'document', 'video', 'audio'].includes(msg.type)) {
            input = { document: true };
          } else {
            input = { text: '' };
          }

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
            : { stage: 'register_start', serviceId: null, docsReceived: 0, ref: null, name: '' };
          // First-time customers register (name, address, mobile) before the
          // menu. A saved profile skips registration on later visits.
          if (!session.registered) {
            const profSnap = await database.doc(`whatsappCustomers/${from}`).get();
            if (profSnap.exists) {
              const p = profSnap.data();
              session.registered = true;
              session.profile = { name: p.name, address: p.address, mobile: p.mobile };
              session.name = p.name;
              if (session.stage === 'register_start') session.stage = 'menu';
            } else if (!session.stage || session.stage === 'menu') {
              session.stage = 'register_start';
            }
          }
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
