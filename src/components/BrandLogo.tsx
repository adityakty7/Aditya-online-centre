import React from 'react';
import { BRAND_IDENTITY } from '../config/businessInfo';
import { Language } from '../types';

export interface AdityaSymbolIconProps {
  className?: string;
  size?: number;
}

/**
 * Simplified square A-symbol vector mark inspired directly by the official
 * Aditya Online Center 3D metallic silver + neon ember orange logo.
 * Used at ultra-small sizes or alongside the official transparent PNG.
 */
export const AdityaSymbolIcon: React.FC<AdityaSymbolIconProps> = ({
  className = 'w-8 h-8',
}) => {
  const uid = React.useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#161822" />
          <stop offset="100%" stopColor="#101014" />
        </linearGradient>
        <linearGradient id={`sil-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="48%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <linearGradient id={`emb-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFB547" />
          <stop offset="50%" stopColor="#FF5C35" />
          <stop offset="100%" stopColor="#C83713" />
        </linearGradient>
        <linearGradient id={`sw-${uid}`} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="45%" stopColor="#FF5C35" />
          <stop offset="100%" stopColor="#FFB547" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="60"
        height="60"
        rx="14"
        fill={`url(#bg-${uid})`}
        stroke="#FF5C35"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
      <circle cx="32" cy="30" r="20" fill="#FF5C35" fillOpacity="0.14" />
      <rect x="44" y="10" width="4.5" height="4.5" rx="0.8" fill="#FF5C35" />
      <rect x="50" y="13" width="3.5" height="3.5" rx="0.6" fill="#FFB547" />
      <rect x="47" y="16.5" width="3" height="3" rx="0.6" fill="#CBD5E1" />
      <rect
        x="12"
        y="15"
        width="3.5"
        height="3.5"
        rx="0.6"
        fill="#CBD5E1"
        fillOpacity="0.85"
      />
      <path
        d="M31.5 11L14.5 50H23.5L32.5 27.5L31.5 11Z"
        fill={`url(#sil-${uid})`}
      />
      <path
        d="M31.5 11L32.5 27.5L40.5 50H49.5L31.5 11Z"
        fill={`url(#emb-${uid})`}
      />
      <polygon
        points="32,20 35.5,29 28.5,29"
        fill="#FFFDF9"
        fillOpacity="0.9"
      />
      <path
        d="M9 39C15 44.5 29 45.5 44 37.5C51 33.8 55.5 29 56.5 25.5C54 30.5 46.5 36.2 33.5 39.2C21.5 42 13 40.8 9 39Z"
        fill={`url(#sw-${uid})`}
      />
    </svg>
  );
};

export interface BrandLogoProps {
  variant?: 'header' | 'hero' | 'footer' | 'modal' | 'sidebar' | 'badge';
  lang?: Language;
  showTagline?: boolean;
  showSubtitle?: boolean;
  subtitleText?: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}

/**
 * Official Reusable Brand Logo Lockup for Aditya Online Center.
 * Uses the uploaded transparent PNG (`/assets/aistudio/Aditya_Online_Center_Logo_Transparent_59adeda5.png`)
 * while preserving its aspect ratio, transparency, and crisp contrast on dark/cream surfaces.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'header',
  lang = 'en',
  showTagline = false,
  showSubtitle = true,
  subtitleText,
  className = '',
  imgClassName = '',
  priority = false,
}) => {
  const defaultSubtitle =
    subtitleText ??
    (lang === 'en'
      ? BRAND_IDENTITY.taglineEn
      : BRAND_IDENTITY.taglineHi);

  if (variant === 'hero') {
    return (
      <div
        data-testid="brand-logo-hero"
        className={`inline-flex items-center gap-3.5 px-3.5 py-2 rounded-2xl bg-[#101014]/85 border border-white/15 shadow-[0_12px_32px_-8px_rgba(255,92,53,0.32)] backdrop-blur-xl animate-logo-reveal ${className}`}
      >
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-[#0A0D12] border border-[#FF5C35]/40 flex items-center justify-center p-1 shrink-0 overflow-hidden">
          <img
            src={BRAND_IDENTITY.logoUrl}
            alt="Aditya Online Center Official Logo"
            width={56}
            height={56}
            loading="eager"
            decoding="async"
            className={`w-full h-full object-contain brand-logo-glow ${imgClassName}`}
          />
        </div>
        <div className="text-left min-w-0 pr-1">
          <div className="flex items-center gap-2">
            <span className="font-display text-xs sm:text-sm font-extrabold tracking-wider uppercase text-[#F7F3EA] truncate">
              {BRAND_IDENTITY.brandName}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34D399] shrink-0" />
          </div>
          <div className="font-mono-tabular text-[10px] sm:text-[11px] font-semibold text-[#FFB547] tracking-wide truncate">
            {lang === 'en'
              ? BRAND_IDENTITY.taglineEn
              : BRAND_IDENTITY.taglineHi}
          </div>
          <div className="font-mono-tabular text-[9px] uppercase tracking-[0.14em] text-[#D4D8E2]/80 mt-0.5">
            {lang === 'en'
              ? 'KATEYA · GOPALGANJ · BIHAR'
              : 'कटेया · गोपालगंज · बिहार'}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div
        data-testid="brand-logo-footer"
        className={`flex items-center gap-3.5 ${className}`}
      >
        <div className="w-14 h-14 rounded-2xl bg-[#161822] border border-white/15 flex items-center justify-center p-1.5 shrink-0 shadow-[0_8px_24px_rgba(255,92,53,0.2)]">
          <img
            src={BRAND_IDENTITY.logoUrl}
            alt="Aditya Online Center Logo"
            width={52}
            height={52}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-contain brand-logo-glow ${imgClassName}`}
          />
        </div>
        <div className="min-w-0">
          <div className="text-base sm:text-lg font-extrabold text-[#F7F3EA] tracking-tight font-display">
            {lang === 'en'
              ? BRAND_IDENTITY.brandName
              : BRAND_IDENTITY.displayNameHi}
          </div>
          <div className="text-xs font-semibold text-[#FFB547]">
            {lang === 'en'
              ? BRAND_IDENTITY.taglineEn
              : BRAND_IDENTITY.taglineHi}
          </div>
          {showSubtitle && (
            <div className="text-[11px] text-[#9E988E] mt-0.5">
              {lang === 'en'
                ? 'Kateya, Gopalganj, Bihar (841437)'
                : 'कटेया, गोपालगंज, बिहार (841437)'}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'modal' || variant === 'sidebar' || variant === 'badge') {
    const isDarkSurface = variant === 'sidebar' || variant === 'badge';
    return (
      <div
        data-testid={`brand-logo-${variant}`}
        className={`inline-flex items-center gap-2.5 ${className}`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center p-1 shrink-0 border ${
            isDarkSurface
              ? 'bg-[#0A0D12] border-[#FF5C35]/40 shadow-[0_4px_14px_rgba(255,92,53,0.22)]'
              : 'bg-[#101014] border-[#101014] shadow-sm'
          }`}
        >
          <img
            src={BRAND_IDENTITY.logoUrl}
            alt="Aditya Online Center Logo"
            width={36}
            height={36}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className={`w-full h-full object-contain brand-logo-glow ${imgClassName}`}
          />
        </div>
        {showSubtitle && (
          <div className="min-w-0 text-left">
            <div
              className={`font-display text-xs sm:text-sm font-extrabold tracking-tight leading-tight truncate ${
                isDarkSurface ? 'text-[#F7F3EA]' : 'text-[#101014]'
              }`}
            >
              {lang === 'en'
                ? BRAND_IDENTITY.brandName
                : BRAND_IDENTITY.displayNameHi}
            </div>
            <div
              className={`font-mono-tabular text-[10px] truncate ${
                isDarkSurface ? 'text-[#FFB547]' : 'text-[#C83713]'
              }`}
            >
              {defaultSubtitle}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default: 'header' variant — compact responsive logo lockup for desktop & mobile navbar
  return (
    <div
      data-testid="brand-logo-header"
      className={`flex items-center gap-2.5 sm:gap-3 min-w-0 ${className}`}
    >
      <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#14161F] border border-[#FF5C35]/40 group-hover:border-[#FFB547] flex items-center justify-center p-1 shrink-0 shadow-[0_4px_16px_rgba(255,92,53,0.25)] transition-all">
        <img
          src={BRAND_IDENTITY.logoUrl}
          alt="Aditya Online Center Logo"
          width={40}
          height={40}
          loading="eager"
          decoding="async"
          className={`w-full h-full object-contain brand-logo-glow transition-transform duration-200 group-hover:scale-105 ${imgClassName}`}
        />
      </div>
      <div className="leading-tight min-w-0">
        <div className="font-display font-extrabold text-[13px] sm:text-base tracking-tight text-[#F7F3EA] truncate">
          {lang === 'en'
            ? 'ADITYA ONLINE CENTER'
            : BRAND_IDENTITY.displayNameHi}
        </div>
        <div className="font-mono-tabular text-[9.5px] sm:text-[10px] tracking-[0.12em] uppercase text-[#FFB547] truncate">
          {showTagline
            ? lang === 'en'
              ? BRAND_IDENTITY.taglineEn
              : BRAND_IDENTITY.taglineHi
            : lang === 'en'
            ? 'Your Digital World, Simplified.'
            : 'कटेया · गोपालगंज (बिहार)'}
        </div>
      </div>
    </div>
  );
};
