import React from 'react';
import {
  Download,
  CloudUpload,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FolderArchive,
  RefreshCw,
  X,
  ShieldCheck,
  FileCode,
  HardDrive,
} from 'lucide-react';
import { Language } from '../types';
import {
  uploadProjectArchiveToGoogleDrive,
  DriveUploadResult,
  getCachedDriveToken,
} from '../utils/googleDrive';

interface ProjectBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  userEmail: string | null;
}

export const ProjectBackupModal: React.FC<ProjectBackupModalProps> = ({
  isOpen,
  onClose,
  lang,
  userEmail,
}) => {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadStatusText, setUploadStatusText] = React.useState('');
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] =
    React.useState<DriveUploadResult | null>(null);
  const [confirmDriveModal, setConfirmDriveModal] = React.useState(false);

  if (!isOpen) return null;

  const handleStartDriveUpload = async () => {
    setConfirmDriveModal(false);
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const cachedToken = getCachedDriveToken();
      const result = await uploadProjectArchiveToGoogleDrive(
        cachedToken || undefined,
        (status) => setUploadStatusText(status)
      );
      setUploadSuccess(result);
    } catch (err) {
      console.error('Google Drive upload error:', err);
      setUploadError(
        err instanceof Error
          ? err.message
          : 'Failed to upload project backup to Google Drive. Please ensure popup permissions are allowed.'
      );
    } finally {
      setIsUploading(false);
      setUploadStatusText('');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="backup-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl bg-[#0F0F14] border border-[#272732] shadow-2xl overflow-hidden text-[#F7F3EA]">
        {/* Header Bar */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#16161F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF5C35]/10 border border-[#FF5C35]/30 flex items-center justify-center text-[#FF5C35]">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="font-mono-tabular text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFB547]">
                {lang === 'en'
                  ? 'PROJECT ARCHIVE & CLOUD BACKUP'
                  : 'प्रोजेक्ट बैकअप एवं गूगल ड्राइव'}
              </div>
              <h2
                id="backup-modal-title"
                className="text-lg font-extrabold text-[#F7F3EA] tracking-tight font-display"
              >
                {lang === 'en'
                  ? 'Export Codebase & Google Drive'
                  : 'सोर्स कोड ZIP डाउनलोड व गूगल ड्राइव अपलोड'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close backup modal"
            className="p-2 text-[#A39E93] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Archive Metadata Bento Card */}
          <div className="p-4 bg-[#181822] border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono-tabular">
              <span className="text-[#A39E93]">
                {lang === 'en' ? 'Archive Name:' : 'फ़ाइल नाम:'}
              </span>
              <span className="font-bold text-[#FFB547]">
                aditya-online-center.zip
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono-tabular">
              <span className="text-[#A39E93]">
                {lang === 'en' ? 'Package Size:' : 'फ़ाइल साइज़:'}
              </span>
              <span className="font-bold text-[#F7F3EA]">~8.5 MB</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono-tabular">
              <span className="text-[#A39E93]">
                {lang === 'en' ? 'Contents Included:' : 'शामिल सामग्री:'}
              </span>
              <span className="text-[#38BDF8]">
                React, Vite, TypeScript, Tailwind, Firestore, Icons, Assets
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono-tabular">
              <span className="text-[#A39E93]">
                {lang === 'en' ? 'Excluded:' : 'हटाए गए फ़ाइलें:'}
              </span>
              <span className="text-emerald-400">
                node_modules, .git, cache (Clean Distribution Archive)
              </span>
            </div>
          </div>

          {/* Feedback Messages */}
          {uploadError && (
            <div
              role="alert"
              className="p-4 bg-red-950/50 border-l-4 border-red-500 text-red-200 text-xs flex items-start gap-3"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              <div>
                <p className="font-bold">
                  {lang === 'en' ? 'Upload Failed' : 'अपलोड विफल रहा'}
                </p>
                <p className="mt-0.5">{uploadError}</p>
              </div>
            </div>
          )}

          {uploadSuccess && (
            <div
              role="status"
              className="p-4 bg-emerald-950/60 border-l-4 border-emerald-500 text-emerald-100 text-xs space-y-2.5"
            >
              <div className="flex items-center gap-2 font-bold text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {lang === 'en'
                    ? 'Uploaded successfully to Google Drive!'
                    : 'गूगल ड्राइव पर सफलतापूर्वक अपलोड हो गया!'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200/90 font-mono-tabular">
                File: {uploadSuccess.name} (ID: {uploadSuccess.id})
              </p>
              <div className="pt-1">
                <a
                  href={
                    uploadSuccess.webViewLink ||
                    `https://drive.google.com/file/d/${uploadSuccess.id}/view`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded transition-colors shadow-sm"
                >
                  <span>
                    {lang === 'en'
                      ? 'Open in Google Drive'
                      : 'गूगल ड्राइव में देखें'}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* Action Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Direct Browser Download */}
            <div className="p-4 bg-[#14141C] border border-white/10 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-[#F7F3EA]">
                  <Download className="w-4 h-4 text-[#FF5C35]" />
                  <span>
                    {lang === 'en'
                      ? 'Direct ZIP Download'
                      : 'डायरेक्ट ZIP डाउनलोड'}
                  </span>
                </div>
                <p className="text-xs text-[#A39E93] mt-1.5 leading-relaxed">
                  {lang === 'en'
                    ? 'Instantly download the complete source code ZIP (8.5 MB) directly to your device storage.'
                    : 'बिना किसी लॉगिन के पूरे प्रोजेक्ट की ZIP फ़ाइल (8.5 MB) तुरंत अपने कंप्यूटर या फ़ोन पर डाउनलोड करें।'}
                </p>
              </div>

              <a
                href="/downloads/aditya-online-center.zip"
                download="aditya-online-center.zip"
                className="w-full min-h-[42px] px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-[#F7F3EA] text-xs font-bold transition-all flex items-center justify-center gap-2 text-center"
              >
                <Download className="w-4 h-4" />
                <span>
                  {lang === 'en'
                    ? 'Download ZIP (8.5 MB)'
                    : 'डाउनलोड ZIP (8.5 MB)'}
                </span>
              </a>
            </div>

            {/* 2. Upload to Google Drive */}
            <div className="p-4 bg-[#14141C] border border-[#FF5C35]/30 flex flex-col justify-between space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF5C35]/5 rounded-bl-full pointer-events-none" />
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-[#FFB547]">
                  <CloudUpload className="w-4 h-4 text-[#FFB547]" />
                  <span>
                    {lang === 'en'
                      ? 'Upload to Google Drive'
                      : 'गूगल ड्राइव में अपलोड करें'}
                  </span>
                </div>
                <p className="text-xs text-[#A39E93] mt-1.5 leading-relaxed">
                  {lang === 'en'
                    ? 'Save the project directly into your personal Google Drive with official Drive API authentication.'
                    : 'गूगल ड्राइव API के ज़रिए प्रोजेक्ट बैकअप को सीधे अपने Google Drive खाते में सुरक्षित स्टोर करें।'}
                </p>
                {userEmail && (
                  <p className="text-[11px] font-mono-tabular text-[#787166] mt-2">
                    {lang === 'en' ? 'Active account: ' : 'सक्रिय खाता: '}
                    <span className="text-[#F7F3EA]">{userEmail}</span>
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={isUploading}
                onClick={() => setConfirmDriveModal(true)}
                className="w-full min-h-[42px] px-4 py-2.5 bg-[#FF5C35] hover:bg-[#E04823] disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#FF5C35]/20"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{uploadStatusText || 'Uploading to Drive...'}</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4" />
                    <span>
                      {lang === 'en'
                        ? 'Upload to Google Drive'
                        : 'गूगल ड्राइव में अपलोड करें'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Security & Integrity Note */}
          <div className="p-3.5 bg-black/40 border border-white/5 text-[11px] text-[#A39E93] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <p>
              {lang === 'en'
                ? 'Security notice: This ZIP package contains client-side source code, database security rules, and public assets. No sensitive server credentials or API secrets are stored inside.'
                : 'सुरक्षा सूचना: इस ZIP में सभी सोर्स कोड और सुरक्षा नियम मौजूद हैं। किसी भी निजी पासवर्ड या गुप्त क्रेडेंशियल्स को इसमें शामिल नहीं किया गया है।'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#14141C] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-xs font-semibold text-[#F7F3EA] transition-colors"
          >
            {lang === 'en' ? 'Close' : 'बंद करें'}
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Destructive / Mutating Google Drive Upload */}
      {confirmDriveModal && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
        >
          <div className="w-full max-w-md bg-[#161622] border border-[#FF5C35]/40 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-[#FF5C35]/20 text-[#FF5C35] flex items-center justify-center shrink-0">
                <CloudUpload className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#F7F3EA]">
                {lang === 'en'
                  ? 'Confirm Google Drive Upload'
                  : 'गूगल ड्राइव अपलोड की पुष्टि करें'}
              </h3>
            </div>
            <p className="text-xs text-[#C8C3B8] leading-relaxed">
              {lang === 'en'
                ? 'Are you sure you want to upload "aditya-online-center.zip" (8.5 MB) to your Google Drive account? A new archive file will be created in your Drive root folder.'
                : 'क्या आप "aditya-online-center.zip" (8.5 MB) को अपने गूगल ड्राइव खाते में अपलोड करना चाहते हैं? आपकी ड्राइव में एक नई बैकअप फ़ाइल बनाई जाएगी।'}
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDriveModal(false)}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-xs font-medium text-[#F7F3EA] transition-colors"
              >
                {lang === 'en' ? 'Cancel' : 'रद्द करें'}
              </button>
              <button
                type="button"
                onClick={handleStartDriveUpload}
                className="px-4 py-2 bg-[#FF5C35] hover:bg-[#E04823] text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <CloudUpload className="w-4 h-4" />
                <span>
                  {lang === 'en' ? 'Confirm & Upload' : 'स्वीकारें व अपलोड करें'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
