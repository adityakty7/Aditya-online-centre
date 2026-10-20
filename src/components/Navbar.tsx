import React from 'react';
import { AppView, Language } from '../types';
import { BUSINESS_INFO } from '../config/businessInfo';
import { Globe, Menu, X, PhoneCall } from 'lucide-react';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  lang: Language;
  onToggleLang: (lang: Language) => void;
  userEmail: string | null;
  userName: string | null;
  isLiveAdmin: boolean;
  sandboxRole: 'none' | 'customer' | 'admin';
  onSetSandboxRole: (role: 'none' | 'customer' | 'admin') => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  lang,
  onToggleLang,
  userEmail,
  userName,
  isLiveAdmin,
  onOpenAuthModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems: Array<{ view: AppView; labelEn: string; labelHi: string }> = [
    { view: 'services', labelEn: 'Services', labelHi: 'सेवाएं' },
    { view: 'track-order', labelEn: 'Track Order', labelHi: 'ऑर्डर ट्रैक करें' },
    { view: 'dashboard', labelEn: 'Customer Portal', labelHi: 'ग्राहक पोर्टल' },
    { view: 'admin', labelEn: 'Admin Panel', labelHi: 'एडमिन पैनल' },
    { view: 'contact', labelEn: 'Contact', labelHi: 'संपर्क करें' },
  ];

  const handleNavClick = (view: AppView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Strictly enforced 3-Zone Top Bar Contract on Warm Cream Canvas */}
      <header className="sticky top-0 z-30 bg-[#F7F3EA]/95 backdrop-blur-md border-b border-[#E6DFD3]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-6 lg:gap-8 px-3.5 sm:px-6 h-16">
          {/* Zone 1: Brand Title (Single text element, one line) */}
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="font-display text-base sm:text-xl font-extrabold tracking-tight text-[#101014] hover:text-[#FF5C35] transition-colors whitespace-nowrap shrink-0 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C35]"
          >
            Aditya Online Center
          </button>

          {/* Zone 2: 5 concise single-line navigation links */}
          <nav
            aria-label={lang === 'en' ? 'Primary Navigation' : 'मुख्य नेविगेशन'}
            className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#52504C]"
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
                  className={`min-h-[44px] px-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                    isActive
                      ? 'border-[#FF5C35] text-[#101014] font-bold'
                      : 'border-transparent text-[#52504C] hover:text-[#101014] hover:border-[#CFC7B8]'
                  }`}
                >
                  {lang === 'en' ? item.labelEn : item.labelHi}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="min-h-[40px] px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-[#F7F3EA] bg-[#101014] rounded-xl hover:bg-[#FF5C35] hover:text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C35]"
            >
              {userEmail
                ? `${userName || userEmail.split('@')[0]}`
                : lang === 'en'
                ? 'Sign In / Account'
                : 'लॉगिन / खाता'}
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
              className="lg:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-[#DCD4C6] text-[#101014] hover:bg-[#ECE5D8]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E6DFD3] bg-[#FFFDF9] px-4 py-3 space-y-1 shadow-lg">
            {navItems.map((item) => {
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => handleNavClick(item.view)}
                  className={`w-full min-h-[44px] px-3.5 py-2 text-left text-sm font-medium rounded-xl flex items-center justify-between ${
                    isActive
                      ? 'bg-[#101014] text-[#F7F3EA] font-semibold'
                      : 'text-[#101014] hover:bg-[#F7F3EA]'
                  }`}
                >
                  <span>{lang === 'en' ? item.labelEn : item.labelHi}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Non-sticky Regional Context & Bilingual Switcher Bar on Charcoal (#101014) */}
      <div className="bg-[#101014] text-[#D8D3C8] border-b border-[#272732]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-[#D8D3C8]">
            <span className="font-semibold text-[#F7F3EA]">
              {lang === 'en' ? BUSINESS_INFO.addressEn : BUSINESS_INFO.addressHi}
            </span>
            <span aria-hidden="true" className="text-[#5C5852]">·</span>
            <span>
              {userEmail
                ? isLiveAdmin
                  ? lang === 'en'
                    ? `Verified Admin (${userEmail})`
                    : `प्रमाणित एडमिन (${userEmail})`
                  : lang === 'en'
                  ? `Signed in (${userEmail})`
                  : `लॉगिन खाता (${userEmail})`
                : lang === 'en'
                ? `Digital Services & Form Support · ${BUSINESS_INFO.workingDaysEn}`
                : `डिजिटल सेवाएं और फॉर्म सहायता · ${BUSINESS_INFO.workingDaysHi}`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href={BUSINESS_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-[#D8D3C8] hover:text-[#FFB547] font-mono-tabular transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#FF5C35]" />
              <span>WhatsApp: {BUSINESS_INFO.whatsappNumber}</span>
            </a>

            {/* Visible Bilingual Switcher (English / Hindi) */}
            <div
              role="group"
              aria-label={lang === 'en' ? 'Language Switcher' : 'भाषा चयन'}
              className="flex items-center gap-1 bg-[#18181F] p-0.5 rounded-lg border border-[#272732]"
            >
              <Globe className="w-3.5 h-3.5 text-[#FFB547] ml-2 mr-1" />
              <button
                type="button"
                onClick={() => onToggleLang('en')}
                aria-pressed={lang === 'en'}
                className={`min-h-[30px] px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  lang === 'en'
                    ? 'bg-[#FF5C35] text-white'
                    : 'text-[#D8D3C8] hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => onToggleLang('hi')}
                aria-pressed={lang === 'hi'}
                className={`min-h-[30px] px-2.5 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  lang === 'hi'
                    ? 'bg-[#FF5C35] text-white'
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
