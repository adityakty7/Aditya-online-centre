import React from 'react';
import { AppView, Language, VisualTheme } from '../types';
import { BUSINESS_INFO } from '../config/businessInfo';
import {
  Globe,
  Menu,
  X,
  PhoneCall,
  ShieldCheck,
  ArrowUpRight,
  Type,
  Clock,
} from 'lucide-react';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  lang: Language;
  onToggleLang: (lang: Language) => void;
  theme?: VisualTheme;
  onToggleTheme?: () => void;
  userEmail: string | null;
  userName: string | null;
  isLiveAdmin: boolean;
  sandboxRole: 'none' | 'customer' | 'admin';
  onSetSandboxRole: (role: 'none' | 'customer' | 'admin') => void;
  onOpenAuthModal: () => void;
  onOpenBackupModal?: () => void;
}

/**
 * 3D-Faceted Brand Symbol for Aditya Online Center
 * Adapts between Cyber Obsidian 3D (Neon Ember) and Royal Blue Studio.
 */
export const AdityaBrandMark: React.FC<{
  className?: string;
  theme?: VisualTheme;
}> = ({ className = 'w-8 h-8', theme = 'obsidian' }) => {
  const isRoyal = theme === 'royal';
  const primaryHex = isRoyal ? '#2563EB' : '#FF5C35';
  const secondaryHex = isRoyal ? '#38BDF8' : '#FFB547';
  const deepHex = isRoyal ? '#1E3A8A' : '#9E2205';

  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
      className={`shrink-0 ${
        isRoyal
          ? 'drop-shadow-[0_0_12px_rgba(37,99,235,0.45)]'
          : 'drop-shadow-[0_0_12px_rgba(255,92,53,0.45)]'
      } ${className}`}
    >
      <defs>
        <linearGradient id="brandBg3D" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isRoyal ? '#102447' : '#232334'} />
          <stop offset="100%" stopColor={isRoyal ? '#061024' : '#0B0B12'} />
        </linearGradient>
        <linearGradient id="brandPrismLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={secondaryHex} />
          <stop offset="100%" stopColor={primaryHex} />
        </linearGradient>
        <linearGradient id="brandPrismRight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={primaryHex} />
          <stop offset="100%" stopColor={deepHex} />
        </linearGradient>
      </defs>
      <rect
        x="1"
        y="1"
        width="34"
        height="34"
        rx="10"
        fill="url(#brandBg3D)"
        stroke={primaryHex}
        strokeOpacity="0.55"
        strokeWidth="1.4"
      />
      <ellipse
        cx="18"
        cy="18"
        rx="13"
        ry="7"
        transform="rotate(-24 18 18)"
        stroke={secondaryHex}
        strokeOpacity="0.45"
        strokeWidth="1"
      />
      <polygon
        points="18,5.5 7,26.5 14.5,26.5 18,16.5"
        fill="url(#brandPrismLeft)"
      />
      <polygon
        points="18,5.5 29,26.5 21.5,26.5 18,16.5"
        fill="url(#brandPrismRight)"
      />
      <polygon points="18,18.5 21.8,26.5 14.2,26.5" fill="#F7F3EA" />
      <rect
        x="16.4"
        y="11.4"
        width="3.2"
        height="3.2"
        transform="rotate(45 18 13)"
        fill="#FFFDF9"
      />
    </svg>
  );
};

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  lang,
  onToggleLang,
  theme = 'obsidian',
  userEmail,
  userName,
  isLiveAdmin,
  onOpenAuthModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [largeTextMode, setLargeTextMode] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem('aoc_a11y_large_text') === '1';
    } catch {
      return false;
    }
  });
  const isRoyal = theme === 'royal';

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('a11y-large-text', largeTextMode);
    }
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('aoc_a11y_large_text', largeTextMode ? '1' : '0');
      } catch {
        // Ignore storage errors
      }
    }
  }, [largeTextMode]);

  const isAuthorizedEmail =
    isLiveAdmin || userEmail?.toLowerCase() === 'adityakty77@gmail.com';

  const navItems: Array<{
    index: string;
    view: AppView;
    labelEn: string;
    labelHi: string;
  }> = [
    { index: '01', view: 'services', labelEn: 'Services', labelHi: 'सेवाएं' },
    {
      index: '02',
      view: 'track-order',
      labelEn: 'Track Order',
      labelHi: 'ऑर्डर ट्रैक करें',
    },
    {
      index: '03',
      view: 'dashboard',
      labelEn: 'Customer Portal',
      labelHi: 'ग्राहक पोर्टल',
    },
    { index: '04', view: 'contact', labelEn: 'Contact', labelHi: 'संपर्क करें' },
    ...(isAuthorizedEmail
      ? [
          {
            index: '05',
            view: 'admin' as AppView,
            labelEn: 'Admin Panel',
            labelHi: 'एडमिन पैनल',
          },
        ]
      : []),
  ];

  const handleNavClick = (view: AppView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Floating Frosted-Glass Command Bar */}
      <header className="sticky top-0 z-30 glass-nav-header text-[#F7F3EA]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4 lg:gap-6 px-2.5 sm:px-6 h-16">
          {/* Zone 1: 3D Faceted Brand Symbol + Clean Wordmark Lockup */}
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="group min-h-[44px] flex items-center gap-2 sm:gap-3 text-left shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C35]"
          >
            <AdityaBrandMark
              theme={theme}
              className="w-7 h-7 sm:w-9 sm:h-9 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3"
            />
            <span className="block font-display text-[13px] sm:text-lg font-extrabold tracking-tight text-[#F7F3EA] group-hover:text-[#FFB547] transition-colors whitespace-nowrap leading-none">
              {lang === 'en' ? 'Aditya Online Center' : 'आदित्य ऑनलाइन सेंटर'}
            </span>
          </button>

          {/* Zone 2: Glassmorphic Pill Navigation Capsule */}
          <nav
            aria-label={lang === 'en' ? 'Primary Navigation' : 'मुख्य नेविगेशन'}
            className="hidden lg:flex items-center gap-1.5 p-1 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl text-sm"
          >
            {navItems.map((item) => {
              const isActive =
                currentView === item.view ||
                (item.view === 'services' && currentView === 'service-detail');
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => handleNavClick(item.view)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group min-h-[38px] px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 flex items-baseline gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C35] ${
                    isActive
                      ? isRoyal
                        ? 'bg-gradient-to-r from-[#2563EB]/35 to-[#38BDF8]/20 border border-[#38BDF8]/60 text-white font-bold shadow-[0_0_20px_rgba(37,99,235,0.32)]'
                        : 'bg-gradient-to-r from-[#FF5C35]/25 to-[#FFB547]/15 border border-[#FF5C35]/60 text-white font-bold shadow-[0_0_20px_rgba(255,92,53,0.28)]'
                      : 'border border-transparent text-[#D8D3C8] hover:text-white hover:bg-white/[0.06] font-medium'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`font-mono-tabular text-[10px] tracking-tight transition-colors ${
                      isActive
                        ? isRoyal
                          ? 'text-[#38BDF8] font-bold'
                          : 'text-[#FFB547] font-bold'
                        : isRoyal
                        ? 'text-[#38BDF8]/80 group-hover:text-white'
                        : 'text-[#FF5C35]/80 group-hover:text-[#FFB547]'
                    }`}
                  >
                    {item.index}
                  </span>
                  <span>{lang === 'en' ? item.labelEn : item.labelHi}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Accessibility Font Toggle + Language Switcher + Account Action + Mobile Menu Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Accessibility Font Size / Screen Readability Toggle */}
            <button
              type="button"
              onClick={() => setLargeTextMode((prev) => !prev)}
              data-testid="accessibility-font-toggle"
              aria-pressed={largeTextMode}
              aria-label={
                lang === 'en'
                  ? largeTextMode
                    ? 'Switch to standard font size'
                    : 'Enable large readable font size for accessibility'
                  : largeTextMode
                  ? 'सामान्य अक्षर आकार चुनें'
                  : 'बड़े और स्पष्ट अक्षर आकार चालू करें'
              }
              title={
                lang === 'en'
                  ? 'Accessibility: Toggle Larger Font & Enhanced Readability'
                  : 'पठनीयता: बड़े और स्पष्ट अक्षर चालू/बंद करें'
              }
              className={`min-h-[34px] sm:min-h-[38px] px-2.5 sm:px-3 py-1 rounded-lg sm:rounded-xl border text-[10px] sm:text-xs font-mono-tabular font-bold flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#FF5C35] ${
                largeTextMode
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.35)]'
                  : 'bg-white/[0.06] border-white/15 text-[#F7F3EA] hover:bg-white/[0.12] hover:border-[#FFB547]/50'
              }`}
            >
              <Type className="w-3.5 h-3.5 text-[#FFB547]" />
              <span>
                {largeTextMode
                  ? lang === 'en'
                    ? 'A+ Large Text ON'
                    : 'A+ बड़े अक्षर चालू'
                  : lang === 'en'
                  ? 'A+ Readability'
                  : 'A+ बड़े अक्षर'}
              </span>
            </button>

            {/* Compact Mobile Language Switcher */}
            <div
              role="group"
              aria-label={
                lang === 'en' ? 'Mobile Language Switcher' : 'मोबाइल भाषा चयन'
              }
              className="flex md:hidden items-center bg-white/[0.06] p-0.5 rounded-lg border border-white/15 backdrop-blur-md"
            >
              <button
                type="button"
                onClick={() => onToggleLang('en')}
                aria-pressed={lang === 'en'}
                className={`min-h-[30px] min-w-[26px] px-1.5 py-0.5 rounded-md text-[10px] font-mono-tabular font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#FF5C35] ${
                  lang === 'en'
                    ? isRoyal
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-[#FF5C35] text-white shadow-[0_0_10px_rgba(255,92,53,0.5)]'
                    : 'text-[#D8D3C8] hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => onToggleLang('hi')}
                aria-pressed={lang === 'hi'}
                className={`min-h-[30px] min-w-[26px] px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-[#FF5C35] ${
                  lang === 'hi'
                    ? isRoyal
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-[#FF5C35] text-white shadow-[0_0_10px_rgba(255,92,53,0.5)]'
                    : 'text-[#D8D3C8] hover:text-white'
                }`}
              >
                हिं
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenAuthModal}
              className={`hidden sm:flex min-h-[40px] sm:min-h-[42px] px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold text-white rounded-xl transition-all whitespace-nowrap shrink-0 items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                isRoyal
                  ? 'bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#3B82F6] hover:to-[#2563EB] border border-[#38BDF8]/40 shadow-[0_4px_20px_rgba(37,99,235,0.4)]'
                  : 'bg-gradient-to-r from-[#FF5C35] to-[#E0431D] hover:from-[#FF6B47] hover:to-[#FF5C35] border border-[#FFB547]/40 shadow-[0_4px_20px_rgba(255,92,53,0.35)]'
              }`}
            >
              {userEmail ? (
                <span className="max-w-[110px] sm:max-w-[160px] truncate">
                  {userName || userEmail.split('@')[0]}
                </span>
              ) : (
                <span>
                  {lang === 'en' ? 'Sign In / Account' : 'लॉगिन / खाता'}
                </span>
              )}
              <ArrowUpRight className="w-3.5 h-3.5 text-white/90 shrink-0" />
            </button>

            <button
              type="button"
              aria-label={
                mobileMenuOpen
                  ? lang === 'en'
                    ? 'Close navigation menu'
                    : 'मेनू बंद करें'
                  : lang === 'en'
                  ? 'Open navigation menu'
                  : 'मेनू खोलें'
              }
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden min-h-[38px] min-w-[38px] sm:min-h-[42px] sm:min-w-[42px] flex items-center justify-center rounded-xl border border-white/20 bg-white/[0.06] text-[#F7F3EA] hover:bg-white/[0.12] focus-visible:outline-2 focus-visible:outline-[#FF5C35]"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Glassmorphic Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-white/15 bg-[#0D0D15]/95 backdrop-blur-2xl px-4 py-4 space-y-3 shadow-2xl">
            <div className="space-y-1.5">
              {navItems.map((item) => {
                const isActive = currentView === item.view;
                return (
                  <button
                    key={item.view}
                    type="button"
                    onClick={() => handleNavClick(item.view)}
                    className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold flex items-center justify-between transition-all ${
                      isActive
                        ? isRoyal
                          ? 'bg-gradient-to-r from-[#2563EB]/30 to-[#38BDF8]/15 border border-[#38BDF8]/60 text-white'
                          : 'bg-gradient-to-r from-[#FF5C35]/25 to-[#FFB547]/10 border border-[#FF5C35]/60 text-white'
                        : 'text-[#E5E0D5] hover:bg-white/[0.06] border border-transparent'
                    }`}
                  >
                    <span className="flex items-baseline gap-2.5">
                      <span
                        className={`font-mono-tabular text-xs ${
                          isActive
                            ? isRoyal
                              ? 'text-[#38BDF8]'
                              : 'text-[#FFB547]'
                            : isRoyal
                            ? 'text-[#38BDF8]'
                            : 'text-[#FF5C35]'
                        }`}
                      >
                        {item.index}
                      </span>
                      <span>{lang === 'en' ? item.labelEn : item.labelHi}</span>
                    </span>
                    <ArrowUpRight
                      className={`w-4 h-4 ${
                        isActive ? 'text-white' : 'text-[#8C857B]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
              <span className="text-xs text-[#D8D3C8]">
                {lang === 'en' ? 'Text Readability:' : 'अक्षर आकार (पठनीयता):'}
              </span>
              <button
                type="button"
                onClick={() => setLargeTextMode((prev) => !prev)}
                aria-pressed={largeTextMode}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white/[0.08] border border-white/15 text-xs font-mono-tabular font-bold text-white flex items-center gap-2"
              >
                <Type className="w-3.5 h-3.5 text-[#FFB547]" />
                <span>
                  {largeTextMode
                    ? lang === 'en'
                      ? 'Large Text Enabled (Tap for Standard)'
                      : 'बड़े अक्षर चालू हैं'
                    : lang === 'en'
                    ? 'Enable Large Text (A+)'
                    : 'बड़े अक्षर चालू करें (A+)'}
                </span>
              </button>
            </div>

            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-[#D8D3C8]">
              <span className="font-mono-tabular text-[11px]">
                {lang === 'en'
                  ? BUSINESS_INFO.addressEn
                  : BUSINESS_INFO.addressHi}
              </span>
              <a
                href={BUSINESS_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-white/[0.08] border border-white/15 text-[#FFB547] font-mono-tabular font-semibold inline-flex items-center gap-1.5 shrink-0"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#FF5C35]" />
                <span>{BUSINESS_INFO.whatsappNumber}</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* Desktop & Tablet Translucent Sub-Bar (Top Info Bar) */}
      <div className="hidden md:block bg-[#08080D]/95 text-[#D8D3C8] border-b border-white/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-[#D8D3C8] truncate">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-mono-tabular text-[10px] uppercase tracking-wider ${
                isRoyal
                  ? 'bg-[#2563EB]/20 border border-[#38BDF8]/40 text-[#38BDF8]'
                  : 'bg-[#FF5C35]/15 border border-[#FF5C35]/40 text-[#FFB547]'
              }`}
            >
              <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-[0_0_8px_#34D399]" />
              </span>
              <span>LIVE · KATEYA 841437</span>
            </span>
            <span className="inline-flex items-center gap-2 font-medium text-[#F7F3EA]">
              <span
                data-testid="live-studio-status-dot"
                className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399] shrink-0"
                aria-hidden="true"
              />
              <span>
                {lang === 'en'
                  ? 'Ward No. 08, Near G.A. High School, Kateya, Gopalganj (PIN 841437)'
                  : 'वार्ड नं. 08, जी.ए. हाई स्कूल के पास, कटेया, गोपालगंज (पिन 841437)'}
              </span>
            </span>
            <span aria-hidden="true" className="text-white/25">
              ·
            </span>
            <span
              data-testid="top-bar-working-hours"
              className="inline-flex items-center gap-1.5 text-[#FFB547] font-semibold truncate"
            >
              <Clock className="w-3.5 h-3.5 text-[#FF5C35] shrink-0" />
              <span>
                {lang === 'en'
                  ? BUSINESS_INFO.workingDaysEn
                  : BUSINESS_INFO.workingDaysHi}
              </span>
            </span>
            {userEmail && (
              <>
                <span aria-hidden="true" className="text-white/25">
                  ·
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-300 truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 inline" />
                  {isLiveAdmin
                    ? lang === 'en'
                      ? `Verified Admin (${userEmail})`
                      : `प्रमाणित एडमिन (${userEmail})`
                    : lang === 'en'
                    ? `Signed in (${userEmail})`
                    : `लॉगिन खाता (${userEmail})`}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <a
              href={BUSINESS_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[#F7F3EA] hover:text-[#FFB547] font-mono-tabular transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#FF5C35]" />
              <span>WhatsApp: {BUSINESS_INFO.whatsappNumber}</span>
            </a>

            {/* Bilingual Switcher (English / Hindi) */}
            <div
              role="group"
              aria-label={lang === 'en' ? 'Language Switcher' : 'भाषा चयन'}
              className="flex items-center gap-1 bg-white/[0.06] p-0.5 rounded-lg border border-white/15"
            >
              <Globe className="w-3.5 h-3.5 text-[#FFB547] ml-2 mr-1" />
              <button
                type="button"
                onClick={() => onToggleLang('en')}
                aria-pressed={lang === 'en'}
                className={`min-h-[26px] px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#FF5C35] ${
                  lang === 'en'
                    ? isRoyal
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-[#FF5C35] text-white shadow-[0_0_12px_rgba(255,92,53,0.45)]'
                    : 'text-[#D8D3C8] hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => onToggleLang('hi')}
                aria-pressed={lang === 'hi'}
                className={`min-h-[26px] px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#FF5C35] ${
                  lang === 'hi'
                    ? isRoyal
                      ? 'bg-[#2563EB] text-white'
                      : 'bg-[#FF5C35] text-white shadow-[0_0_12px_rgba(255,92,53,0.45)]'
                    : 'text-[#D8D3C8] hover:text-white'
                }`}
              >
                हिन्दी
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

