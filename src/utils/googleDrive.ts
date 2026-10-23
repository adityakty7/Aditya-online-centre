import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

// Ensure the Google Drive file scope is added to the provider
try {
  googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
} catch (e) {
  console.warn('Scope may already be added:', e);
}

// In-memory token cache (never stored in localStorage/sessionStorage per security guidelines)
let inMemoryDriveToken: string | null = null;

export function setCachedDriveToken(token: string | null) {
  inMemoryDriveToken = token;
}

export function getCachedDriveToken(): string | null {
  return inMemoryDriveToken;
}

export interface DriveUploadResult {
  id: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
  size?: string;
}

/**
 * Obtains a fresh or cached Google OAuth access token with Google Drive scope.
 */
export async function getDriveAccessToken(): Promise<string> {
  if (inMemoryDriveToken) {
    return inMemoryDriveToken;
  }

  // Request token interactively via Firebase Auth Google provider
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const token = credential?.accessToken;

  if (!token) {
    throw new Error(
      'Could not retrieve Google Drive OAuth access token from authentication result.'
    );
  }

  inMemoryDriveToken = token;
  return token;
}

/**
 * Uploads the generated project zip archive to the user's Google Drive.
 * Uses the Google Drive v3 multipart upload endpoint.
 */
export async function uploadProjectArchiveToGoogleDrive(
  tokenOverride?: string,
  onProgress?: (statusText: string) => void
): Promise<DriveUploadResult> {
  onProgress?.('Fetching project ZIP archive...');

  // 1. Fetch the pre-built ZIP archive from public assets
  const zipResponse = await fetch('/downloads/aditya-online-center.zip');
  if (!zipResponse.ok) {
    throw new Error(
      `Failed to download local ZIP archive (HTTP ${zipResponse.status}). Make sure it was generated.`
    );
  }
  const zipBlob = await zipResponse.blob();

  // 2. Get Access Token
  onProgress?.('Authenticating with Google Drive...');
  const token = tokenOverride || (await getDriveAccessToken());

  // 3. Prepare multipart/related payload for Google Drive API
  onProgress?.('Uploading to Google Drive...');
  const metadata = {
    name: `aditya-online-center-backup-${new Date().toISOString().slice(0, 10)}.zip`,
    description:
      'Complete project source code and assets archive for Aditya Online Center, Kateya, Bihar.',
    mimeType: 'application/zip',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metadataPart =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: application/zip\r\n' +
    'Content-Transfer-Encoding: binary\r\n\r\n';

  const metadataBlob = new Blob([metadataPart], { type: 'text/plain' });
  const closeBlob = new Blob([closeDelimiter], { type: 'text/plain' });

  const multipartBody = new Blob([metadataBlob, zipBlob, closeBlob], {
    type: `multipart/related; boundary=${boundary}`,
  });

  const uploadResponse = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,size',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: multipartBody,
    }
  );

  if (!uploadResponse.ok) {
    const errorJson = await uploadResponse.json().catch(() => ({}));
    const message =
      errorJson?.error?.message ||
      `Upload failed with HTTP status ${uploadResponse.status}`;
    throw new Error(`Google Drive API error: ${message}`);
  }

  const result = (await uploadResponse.json()) as DriveUploadResult;
  onProgress?.('Upload complete!');
  return result;
}
