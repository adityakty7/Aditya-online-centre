import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

const resolvedFirebaseConfig = {
  ...firebaseConfig,
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId:
    env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
};

export const ACTIVE_FIREBASE_PROJECT_ID = resolvedFirebaseConfig.projectId;

const app = initializeApp(resolvedFirebaseConfig);
export const db = getFirestore(
  app,
  env.VITE_FIREBASE_DATABASE_ID ||
    (firebaseConfig as Record<string, any>).firestoreDatabaseId
);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const BOOTSTRAPPED_ADMIN_EMAIL = 'adityakty77@gmail.com';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Optimizes an uploaded service image in the browser using HTML5 Canvas
 * while strictly preserving transparency (PNG / WebP) and aspect ratio.
 */
async function optimizeServiceImageClientSide(
  file: File
): Promise<{ dataUrl: string; blob: Blob; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const rawDataUrl = String(reader.result || '');
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid or corrupted image file.'));
      img.onload = () => {
        const maxWidth = 760;
        const maxHeight = 520;
        let targetW = img.naturalWidth || img.width || 600;
        let targetH = img.naturalHeight || img.height || 400;

        if (targetW > maxWidth || targetH > maxHeight) {
          const ratio = Math.min(maxWidth / targetW, maxHeight / targetH);
          targetW = Math.max(1, Math.round(targetW * ratio));
          targetH = Math.max(1, Math.round(targetH * ratio));
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: rawDataUrl,
            blob: file,
            mimeType: file.type || 'image/png',
          });
          return;
        }

        // Clear canvas transparently so PNG/WebP alpha channels remain untouched
        ctx.clearRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const isTransparentCapable =
          file.type === 'image/png' || file.type === 'image/webp';
        const outputMime = isTransparentCapable ? 'image/webp' : 'image/jpeg';
        const quality = isTransparentCapable ? 0.88 : 0.85;

        let optimizedDataUrl = canvas.toDataURL(outputMime, quality);
        // Fallback to PNG if browser does not support WebP encoding or if size exceeds Firestore limit
        if (
          isTransparentCapable &&
          !optimizedDataUrl.startsWith('data:image/webp')
        ) {
          optimizedDataUrl = canvas.toDataURL('image/png');
        }

        // If still large (> 290 KB base64), scale down slightly so it always fits safely in Firestore & fast loads
        if (optimizedDataUrl.length > 290000) {
          const smallerCanvas = document.createElement('canvas');
          smallerCanvas.width = Math.max(1, Math.round(targetW * 0.68));
          smallerCanvas.height = Math.max(1, Math.round(targetH * 0.68));
          const sCtx = smallerCanvas.getContext('2d');
          if (sCtx) {
            sCtx.clearRect(0, 0, smallerCanvas.width, smallerCanvas.height);
            sCtx.drawImage(
              img,
              0,
              0,
              smallerCanvas.width,
              smallerCanvas.height
            );
            optimizedDataUrl = smallerCanvas.toDataURL(outputMime, 0.8);
          }
        }

        canvas.toBlob(
          (blob) => {
            resolve({
              dataUrl: optimizedDataUrl,
              blob: blob || file,
              mimeType: outputMime,
            });
          },
          outputMime,
          quality
        );
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a service visual asset to the isolated `/service_media/{serviceId}/` path
 * in Firebase Storage when live admin storage is active, and seamlessly falls back
 * to client-side optimized storage so uploads work reliably even on the Spark free tier.
 */
export async function uploadOrOptimizeServiceImage(
  serviceId: string,
  file: File,
  isLiveAdmin: boolean,
  onProgress?: (percent: number) => void
): Promise<{
  imageUrl: string;
  storageType: 'firebase_storage' | 'optimized_inline';
}> {
  onProgress?.(20);
  const optimized = await optimizeServiceImageClientSide(file);
  onProgress?.(60);

  const safeServiceId = serviceId.replace(/[^a-zA-Z0-9_-]/g, '') || 'service';
  const safeFileName =
    file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 60) || 'visual.webp';

  if (
    isLiveAdmin &&
    auth.currentUser &&
    auth.currentUser.emailVerified &&
    resolvedFirebaseConfig.storageBucket
  ) {
    try {
      const objectPath = `service_media/${safeServiceId}/${Date.now()}_${safeFileName}`;
      const fileRef = storageRef(storage, objectPath);

      const uploadPromise = (async () => {
        await uploadBytes(fileRef, optimized.blob, {
          contentType: optimized.mimeType,
          customMetadata: {
            serviceId: safeServiceId,
            uploadedBy: auth.currentUser?.email || 'admin',
          },
        });
        return await getDownloadURL(fileRef);
      })();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Storage upload timeout')), 4500)
      );

      const downloadUrl = await Promise.race([uploadPromise, timeoutPromise]);
      onProgress?.(100);
      return {
        imageUrl: downloadUrl,
        storageType: 'firebase_storage',
      };
    } catch {
      // Firebase Storage bucket may not be initialized on Spark plan yet;
      // fall back cleanly to optimized inline Data URL persisted in Firestore/localStorage.
    }
  }

  onProgress?.(100);
  return {
    imageUrl: optimized.dataUrl,
    storageType: 'optimized_inline',
  };
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

testConnection();
