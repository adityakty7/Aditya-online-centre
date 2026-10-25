import React from 'react';
import {
  DigitalService,
  Language,
  ServiceAppearanceConfig,
} from '../types';
import {
  BUILTIN_3D_MEDIA_LIBRARY,
  clampFocalPoint,
  clampImageScale,
  getServiceAppearanceConfig,
  resolveDefaultPresetIdForService,
} from '../utils/serviceVisuals';

interface Service3DVisualStageProps {
  service: DigitalService;
  lang: Language;
  /** Optional draft override used inside the Admin live preview before saving */
  overrideConfig?: ServiceAppearanceConfig;
  /** Optional global override when the user disables 3D animations */
  globalDisableAnimation?: boolean;
  /** Visual variant: 'card' for catalog grid, 'detail' for service detail header, 'preview' for admin manager */
  variant?: 'card' | 'detail' | 'preview';
  isDarkCard?: boolean;
}

/**
 * Renders 12 distinct, high-craft 3D isometric vector sculptures in the
 * Aditya Online Center brand palette (#101014, #FF5C35, #FFB547, #D4D8E2, #F7F3EA).
 * Uses illustrative, non-misleading iconography (no official government seals).
 */
const Builtin3DIllustrationSvg: React.FC<{
  presetKey: string;
  uidPrefix: string;
}> = ({ presetKey, uidPrefix }) => {
  const gradEmber = `${uidPrefix}-ember`;
  const gradObsidian = `${uidPrefix}-obsidian`;
  const gradSilver = `${uidPrefix}-silver`;
  const gradCream = `${uidPrefix}-cream`;
  const glowFilter = `${uidPrefix}-glow`;

  return (
    <svg
      viewBox="0 0 280 168"
      className="w-full h-full select-none pointer-events-none"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradEmber} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF7A59" />
          <stop offset="55%" stopColor="#FF5C35" />
          <stop offset="100%" stopColor="#C83713" />
        </linearGradient>
        <linearGradient id={gradObsidian} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#262633" />
          <stop offset="100%" stopColor="#101014" />
        </linearGradient>
        <linearGradient id={gradSilver} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#D4D8E2" />
          <stop offset="100%" stopColor="#949BA8" />
        </linearGradient>
        <linearGradient id={gradCream} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFDF9" />
          <stop offset="100%" stopColor="#EAE2D3" />
        </linearGradient>
        <filter id={glowFilter} x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow
            dx="0"
            dy="8"
            stdDeviation="7"
            floodColor="#FF5C35"
            floodOpacity="0.32"
          />
        </filter>
      </defs>

      {/* Isometric 3D Pedestal Base & Ambient Floor Reflection */}
      <ellipse
        cx="140"
        cy="144"
        rx="82"
        ry="15"
        fill="#FF5C35"
        fillOpacity="0.16"
      />
      <ellipse
        cx="140"
        cy="142"
        rx="62"
        ry="10"
        fill="#FFB547"
        fillOpacity="0.18"
      />
      <polygon
        points="140,122 214,137 140,152 66,137"
        fill={`url(#${gradObsidian})`}
        stroke="#FFB547"
        strokeOpacity="0.45"
        strokeWidth="1.2"
      />

      {/* 1. ATS RESUME & CV 3D SCULPTURE */}
      {presetKey === 'resume_3d' && (
        <g filter={`url(#${glowFilter})`}>
          {/* Back Layered Sheet */}
          <rect
            x="92"
            y="24"
            width="86"
            height="108"
            rx="10"
            transform="rotate(-6 135 78)"
            fill={`url(#${gradObsidian})`}
            stroke="#FF5C35"
            strokeWidth="1.4"
          />
          {/* Main Isometric Resume Sheet */}
          <rect
            x="100"
            y="20"
            width="88"
            height="110"
            rx="10"
            transform="rotate(4 144 75)"
            fill={`url(#${gradCream})`}
            stroke="#101014"
            strokeWidth="1.5"
          />
          {/* Profile Avatar & Header Bars */}
          <circle cx="123" cy="44" r="11" fill={`url(#${gradEmber})`} />
          <circle cx="123" cy="41" r="4" fill="#FFFDF9" />
          <path
            d="M116,50 C118,46 128,46 130,50"
            stroke="#FFFDF9"
            strokeWidth="2"
            fill="none"
          />
          <rect x="140" y="36" width="34" height="6" rx="3" fill="#101014" />
          <rect x="140" y="46" width="24" height="4" rx="2" fill="#FF5C35" />
          {/* Skill & Experience Bars */}
          <rect x="112" y="64" width="62" height="5" rx="2.5" fill="#101014" fillOpacity="0.8" />
          <rect x="112" y="74" width="52" height="4" rx="2" fill="#787166" />
          <rect x="112" y="84" width="58" height="4" rx="2" fill="#787166" />
          <rect x="112" y="96" width="40" height="6" rx="3" fill={`url(#${gradEmber})`} />
          {/* Floating 3D Star Verification Badge */}
          <circle
            cx="184"
            cy="98"
            r="16"
            fill={`url(#${gradEmber})`}
            stroke="#FFFDF9"
            strokeWidth="2"
          />
          <polygon
            points="184,88 187,94 194,95 189,99 190,106 184,102 178,106 179,99 174,95 181,94"
            fill="#FFB547"
          />
        </g>
      )}

      {/* 2. MARRIAGE BIODATA 3D SCULPTURE */}
      {presetKey === 'biodata_3d' && (
        <g filter={`url(#${glowFilter})`}>
          {/* Ornate Amber Frame Card */}
          <rect
            x="92"
            y="18"
            width="96"
            height="114"
            rx="12"
            fill={`url(#${gradObsidian})`}
            stroke="#FFB547"
            strokeWidth="2"
          />
          <rect
            x="98"
            y="24"
            width="84"
            height="102"
            rx="8"
            fill={`url(#${gradCream})`}
            stroke="#FF5C35"
            strokeWidth="1.2"
          />
          {/* Decorative Arch & Crest */}
          <circle
            cx="140"
            cy="46"
            r="13"
            fill={`url(#${gradEmber})`}
            stroke="#FFB547"
            strokeWidth="2"
          />
          <path
            d="M135,46 L140,39 L145,46 L140,53 Z"
            fill="#FFFDF9"
          />
          <rect x="114" y="66" width="52" height="5" rx="2.5" fill="#101014" />
          <rect x="120" y="76" width="40" height="4" rx="2" fill="#C83713" />
          <rect x="110" y="88" width="60" height="3.5" rx="1.75" fill="#787166" />
          <rect x="110" y="96" width="50" height="3.5" rx="1.75" fill="#787166" />
          <rect x="110" y="104" width="56" height="3.5" rx="1.75" fill="#787166" />
          {/* Corner Amber Ornaments */}
          <circle cx="105" cy="31" r="3" fill="#FFB547" />
          <circle cx="175" cy="31" r="3" fill="#FFB547" />
          <circle cx="105" cy="119" r="3" fill="#FFB547" />
          <circle cx="175" cy="119" r="3" fill="#FFB547" />
        </g>
      )}

      {/* 3. AADHAAR & BIOMETRIC SMART CARD (Illustrative) */}
      {presetKey === 'aadhaar_3d' && (
        <g filter={`url(#${glowFilter})`}>
          <rect
            x="68"
            y="34"
            width="144"
            height="88"
            rx="12"
            transform="rotate(-3 140 78)"
            fill={`url(#${gradCream})`}
            stroke="#101014"
            strokeWidth="1.8"
          />
          {/* Top Accent Header Band */}
          <path
            d="M70,44 Q140,38 210,42 L210,54 L68,56 Z"
            fill={`url(#${gradEmber})`}
          />
          {/* Avatar Placeholder */}
          <rect
            x="80"
            y="64"
            width="30"
            height="36"
            rx="6"
            fill={`url(#${gradObsidian})`}
            stroke="#FFB547"
            strokeWidth="1.2"
          />
          <circle cx="95" cy="76" r="6" fill="#FFB547" />
          <path d="M86,93 C88,86 102,86 104,93" stroke="#FFFDF9" strokeWidth="2.2" fill="none" />
          {/* Illustrative Data Lines & QR Matrix */}
          <rect x="118" y="66" width="52" height="5" rx="2.5" fill="#101014" />
          <rect x="118" y="76" width="42" height="4" rx="2" fill="#787166" />
          <rect x="118" y="88" width="60" height="6" rx="3" fill="#FF5C35" fillOpacity="0.2" />
          <text
            x="122"
            y="94"
            fill="#C83713"
            fontSize="7"
            fontWeight="bold"
            fontFamily="monospace"
          >
            XXXX-XXXX-8492
          </text>
          {/* Floating Biometric Fingerprint Orb */}
          <circle
            cx="192"
            cy="82"
            r="16"
            fill={`url(#${gradObsidian})`}
            stroke="#FF5C35"
            strokeWidth="1.6"
          />
          <path
            d="M186,82 C186,76 198,76 198,82 M183,85 C183,73 201,73 201,85 M189,86 L189,79 C189,77 195,77 195,79 L195,87"
            stroke="#FFB547"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      )}

      {/* 4. PAN CARD & TAX ID 3D SCULPTURE (Illustrative) */}
      {presetKey === 'pan_3d' && (
        <g filter={`url(#${glowFilter})`}>
          <rect
            x="66"
            y="34"
            width="148"
            height="90"
            rx="12"
            transform="rotate(2 140 79)"
            fill={`url(#${gradObsidian})`}
            stroke="#FFB547"
            strokeWidth="1.8"
          />
          {/* Holographic Top Strip */}
          <rect
            x="76"
            y="44"
            width="128"
            height="12"
            rx="4"
            fill={`url(#${gradEmber})`}
          />
          {/* Metallic EMV/Hologram Chip */}
          <rect
            x="80"
            y="66"
            width="28"
            height="22"
            rx="4"
            fill="#FFB547"
            stroke="#FFFDF9"
            strokeWidth="1"
          />
          <line x1="80" y1="77" x2="108" y2="77" stroke="#101014" strokeWidth="1" />
          <line x1="94" y1="66" x2="94" y2="88" stroke="#101014" strokeWidth="1" />
          {/* Alphanumeric Tax Format Pill */}
          <rect x="118" y="66" width="76" height="12" rx="4" fill="#181822" stroke="#FF5C35" strokeWidth="1" />
          <text
            x="125"
            y="75"
            fill="#FFB547"
            fontSize="8"
            fontWeight="bold"
            fontFamily="monospace"
          >
            ABCDE1234F
          </text>
          <rect x="118" y="84" width="64" height="4" rx="2" fill="#D4D8E2" />
          <rect x="80" y="98" width="90" height="5" rx="2.5" fill="#D4D8E2" fillOpacity="0.6" />
          <circle cx="192" cy="100" r="9" fill="#FF5C35" />
          <path d="M188,100 L191,103 L197,97" stroke="#FFFDF9" strokeWidth="2" fill="none" />
        </g>
      )}

      {/* 5. PASSPORT & TRAVEL DOCUMENT 3D SCULPTURE */}
      {presetKey === 'passport_3d' && (
        <g filter={`url(#${glowFilter})`}>
          {/* Boarding Pass / Travel Ticket Behind */}
          <rect
            x="126"
            y="26"
            width="86"
            height="54"
            rx="8"
            transform="rotate(14 169 53)"
            fill={`url(#${gradCream})`}
            stroke="#FF5C35"
            strokeWidth="1.5"
          />
          {/* Deep Navy/Obsidian Passport Booklet */}
          <rect
            x="84"
            y="22"
            width="82"
            height="108"
            rx="10"
            transform="rotate(-5 125 76)"
            fill={`url(#${gradObsidian})`}
            stroke="#FFB547"
            strokeWidth="2"
          />
          {/* Illustrative Globe Grid on Cover */}
          <circle
            cx="125"
            cy="68"
            r="22"
            fill="none"
            stroke="#FFB547"
            strokeWidth="1.6"
          />
          <ellipse
            cx="125"
            cy="68"
            rx="11"
            ry="22"
            fill="none"
            stroke="#FFB547"
            strokeWidth="1.2"
          />
          <line x1="103" y1="68" x2="147" y2="68" stroke="#FFB547" strokeWidth="1.2" />
          <line x1="107" y1="56" x2="143" y2="56" stroke="#FFB547" strokeWidth="1" />
          <line x1="107" y1="80" x2="143" y2="80" stroke="#FFB547" strokeWidth="1" />
          <rect x="103" y="102" width="44" height="5" rx="2.5" fill="#FF5C35" />
        </g>
      )}

      {/* 6. RAILWAY TICKET & IRCTC TRAVEL 3D SCULPTURE */}
      {presetKey === 'railway_3d' && (
        <g filter={`url(#${glowFilter})`}>
          {/* Express Ticket Card Back */}
          <rect
            x="70"
            y="30"
            width="140"
            height="72"
            rx="10"
            fill={`url(#${gradCream})`}
            stroke="#101014"
            strokeWidth="1.5"
          />
          <rect x="70" y="30" width="140" height="16" rx="6" fill={`url(#${gradEmber})`} />
          {/* Isometric High-Speed Locomotive Front */}
          <path
            d="M92,118 L110,64 L174,64 L192,118 Z"
            fill={`url(#${gradObsidian})`}
            stroke="#FFB547"
            strokeWidth="1.8"
          />
          {/* Windshield */}
          <polygon
            points="116,74 168,74 174,92 110,92"
            fill="#38BDF8"
            fillOpacity="0.85"
          />
          {/* Headlights */}
          <circle cx="116" cy="106" r="5" fill="#FFB547" />
          <circle cx="168" cy="106" r="5" fill="#FFB547" />
          <rect x="128" y="103" width="28" height="6" rx="3" fill="#FF5C35" />
          {/* Track Rails */}
          <line x1="74" y1="126" x2="206" y2="126" stroke="#FFB547" strokeWidth="2.5" />
        </g>
      )}

      {/* 7. ONLINE JOB & EXAM PORTAL FORM 3D SCULPTURE */}
      {presetKey === 'exam_form_3d' && (
        <g filter={`url(#${glowFilter})`}>
          {/* Isometric Portal Browser Window */}
          <rect
            x="66"
            y="24"
            width="148"
            height="102"
            rx="12"
            fill={`url(#${gradObsidian})`}
            stroke="#FF5C35"
            strokeWidth="1.8"
          />
          {/* Window Top Bar */}
          <circle cx="80" cy="36" r="3.5" fill="#FF5C35" />
          <circle cx="91" cy="36" r="3.5" fill="#FFB547" />
          <circle cx="102" cy="36" r="3.5" fill="#34D399" />
          <rect x="76" y="46" width="128" height="70" rx="6" fill={`url(#${gradCream})`} />
          {/* Form Checkboxes & Fields */}
          <rect x="86" y="56" width="12" height="12" rx="3" fill="#FF5C35" />
          <path d="M89,62 L91.5,64.5 L95.5,59.5" stroke="#FFFDF9" strokeWidth="1.8" fill="none" />
          <rect x="104" y="58" width="76" height="6" rx="3" fill="#101014" />
          <rect x="86" y="74" width="12" height="12" rx="3" fill="#FF5C35" />
          <path d="M89,80 L91.5,82.5 L95.5,77.5" stroke="#FFFDF9" strokeWidth="1.8" fill="none" />
          <rect x="104" y="76" width="64" height="6" rx="3" fill="#101014" />
          {/* Submit CTA Pill */}
          <rect x="86" y="94" width="62" height="14" rx="5" fill={`url(#${gradEmber})`} />
          <circle cx="184" cy="96" r="14" fill="#10B981" stroke="#FFFDF9" strokeWidth="2" />
          <path d="M178,96 L182,100 L190,92" stroke="#FFFDF9" strokeWidth="2.2" fill="none" />
        </g>
      )}

      {/* 8. SCHOLARSHIP & STUDENT GRANT 3D SCULPTURE */}
      {presetKey === 'scholarship_3d' && (
        <g filter={`url(#${glowFilter})`}>
          {/* Rolled Diploma Scroll Behind */}
          <rect
            x="84"
            y="88"
            width="112"
            height="22"
            rx="10"
            fill={`url(#${gradCream})`}
            stroke="#101014"
            strokeWidth="1.6"
          />
          <rect x="132" y="88" width="16" height="22" fill={`url(#${gradEmber})`} />
          {/* 3D Mortarboard Graduation Cap */}
          <polygon
            points="140,24 212,52 140,80 68,52"
            fill={`url(#${gradObsidian})`}
            stroke="#FFB547"
            strokeWidth="2"
          />
          <path
            d="M104,66 L104,84 C104,94 176,94 176,84 L176,66"
            fill={`url(#${gradObsidian})`}
            stroke="#FF5C35"
            strokeWidth="1.6"
          />
          {/* Gold Tassel */}
          <path
            d="M140,52 L188,64 L188,92"
            stroke="#FFB547"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="188" cy="94" r="5" fill="#FF5C35" />
        </g>
      )}

      {/* 9. CERTIFICATES & OFFICIAL ATTESTATION 3D SCULPTURE */}
      {presetKey === 'certificate_3d' && (
        <g filter={`url(#${glowFilter})`}>
          <rect
            x="74"
            y="22"
            width="132"
            height="98"
            rx="10"
            fill={`url(#${gradCream})`}
            stroke="#101014"
            strokeWidth="1.8"
          />
          <rect
            x="82"
            y="30"
            width="116"
            height="82"
            rx="6"
            fill="none"
            stroke="#FF5C35"
            strokeWidth="1.2"
            strokeDasharray="4 2"
          />
          <rect x="106" y="42" width="68" height="7" rx="3.5" fill="#101014" />
          <rect x="96" y="56" width="88" height="4" rx="2" fill="#787166" />
          <rect x="102" y="66" width="76" height="4" rx="2" fill="#787166" />
          {/* 3D Gold & Ember Ribbon Rosette Seal */}
          <polygon
            points="166,102 158,132 168,125 176,134 176,102"
            fill={`url(#${gradEmber})`}
          />
          <circle
            cx="168"
            cy="96"
            r="16"
            fill={`url(#${gradObsidian})`}
            stroke="#FFB547"
            strokeWidth="2.5"
          />
          <path d="M162,96 L166,100 L175,91" stroke="#FFB547" strokeWidth="2.4" fill="none" />
        </g>
      )}

      {/* 10. PDF MERGE, SPLIT & COMPRESSION 3D SCULPTURE */}
      {presetKey === 'pdf_3d' && (
        <g filter={`url(#${glowFilter})`}>
          {/* Left Page */}
          <rect
            x="68"
            y="34"
            width="64"
            height="84"
            rx="8"
            transform="rotate(-8 100 76)"
            fill={`url(#${gradCream})`}
            stroke="#101014"
            strokeWidth="1.5"
          />
          {/* Right Page */}
          <rect
            x="148"
            y="34"
            width="64"
            height="84"
            rx="8"
            transform="rotate(8 180 76)"
            fill={`url(#${gradCream})`}
            stroke="#101014"
            strokeWidth="1.5"
          />
          {/* Center 3D PDF Cube Monolith */}
          <rect
            x="104"
            y="30"
            width="72"
            height="92"
            rx="12"
            fill={`url(#${gradObsidian})`}
            stroke="#FF5C35"
            strokeWidth="2"
          />
          <rect
            x="116"
            y="48"
            width="48"
            height="24"
            rx="6"
            fill={`url(#${gradEmber})`}
          />
          <text
            x="124"
            y="64"
            fill="#FFFDF9"
            fontSize="13"
            fontWeight="900"
            fontFamily="monospace"
          >
            PDF
          </text>
          <path
            d="M126,92 L140,104 L154,92 M140,80 L140,102"
            stroke="#FFB547"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      )}

      {/* 11. BILINGUAL HINDI & ENGLISH TYPING 3D SCULPTURE */}
      {presetKey === 'typing_3d' && (
        <g filter={`url(#${glowFilter})`}>
          {/* Document Page Behind */}
          <rect
            x="96"
            y="18"
            width="88"
            height="74"
            rx="8"
            fill={`url(#${gradCream})`}
            stroke="#101014"
            strokeWidth="1.5"
          />
          <rect x="108" y="30" width="64" height="5" rx="2.5" fill="#101014" />
          <rect x="108" y="40" width="52" height="4" rx="2" fill="#787166" />
          {/* 3D Tactile Keycap Left (Hindi 'अ') */}
          <rect
            x="74"
            y="66"
            width="58"
            height="54"
            rx="12"
            fill={`url(#${gradObsidian})`}
            stroke="#FFB547"
            strokeWidth="2"
          />
          <text
            x="91"
            y="101"
            fill="#FFB547"
            fontSize="24"
            fontWeight="bold"
          >
            अ
          </text>
          {/* 3D Tactile Keycap Right (English 'A') */}
          <rect
            x="148"
            y="66"
            width="58"
            height="54"
            rx="12"
            fill={`url(#${gradEmber})`}
            stroke="#FFFDF9"
            strokeWidth="2"
          />
          <text
            x="167"
            y="101"
            fill="#FFFDF9"
            fontSize="24"
            fontWeight="900"
            fontFamily="sans-serif"
          >
            A
          </text>
        </g>
      )}

      {/* 12. BILL PAYMENTS & DIGITAL RECEIPT 3D SCULPTURE */}
      {presetKey === 'bill_pay_3d' && (
        <g filter={`url(#${glowFilter})`}>
          {/* Receipt Slip */}
          <rect
            x="88"
            y="20"
            width="88"
            height="106"
            rx="10"
            fill={`url(#${gradCream})`}
            stroke="#101014"
            strokeWidth="1.6"
          />
          <rect x="100" y="32" width="64" height="14" rx="4" fill={`url(#${gradObsidian})`} />
          <text
            x="114"
            y="42"
            fill="#FFB547"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
          >
            UPI PAID
          </text>
          <rect x="100" y="56" width="64" height="4" rx="2" fill="#101014" />
          <rect x="100" y="66" width="48" height="4" rx="2" fill="#787166" />
          <rect x="100" y="76" width="56" height="4" rx="2" fill="#787166" />
          {/* 3D Lightning & Verified Coin */}
          <circle
            cx="182"
            cy="84"
            r="22"
            fill={`url(#${gradEmber})`}
            stroke="#FFB547"
            strokeWidth="2.2"
          />
          <polygon
            points="184,68 172,86 181,86 178,100 192,82 183,82"
            fill="#FFFDF9"
          />
        </g>
      )}
    </svg>
  );
};

export const Service3DVisualStage: React.FC<Service3DVisualStageProps> = ({
  service,
  lang,
  overrideConfig,
  globalDisableAnimation = false,
  variant = 'card',
  isDarkCard = false,
}) => {
  const uid = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const resolvedConfig = React.useMemo(
    () => overrideConfig || getServiceAppearanceConfig(service),
    [overrideConfig, service]
  );

  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  const [tilt, setTilt] = React.useState<{ rx: number; ry: number; active: boolean }>({
    rx: 0,
    ry: 0,
    active: false,
  });
  const [imgError, setImgError] = React.useState(false);

  // Reset image error whenever the image URL changes
  React.useEffect(() => {
    setImgError(false);
  }, [resolvedConfig.customImageUrl, resolvedConfig.visualMode, resolvedConfig.mediaLibraryId]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener?.('change', listener);
    return () => mq.removeEventListener?.('change', listener);
  }, []);

  const motionAllowed =
    resolvedConfig.enable3DAnimation &&
    resolvedConfig.animationStyle !== 'static' &&
    !prefersReducedMotion &&
    !globalDisableAnimation;

  // Determine which preset or custom image to display
  const activePreset = React.useMemo(() => {
    if (resolvedConfig.visualMode === 'media_library') {
      return (
        BUILTIN_3D_MEDIA_LIBRARY.find(
          (p) => p.id === resolvedConfig.mediaLibraryId
        ) ||
        BUILTIN_3D_MEDIA_LIBRARY.find(
          (p) => p.id === resolveDefaultPresetIdForService(service)
        ) ||
        BUILTIN_3D_MEDIA_LIBRARY[0]
      );
    }
    return (
      BUILTIN_3D_MEDIA_LIBRARY.find(
        (p) => p.id === resolveDefaultPresetIdForService(service)
      ) || BUILTIN_3D_MEDIA_LIBRARY[0]
    );
  }, [resolvedConfig.visualMode, resolvedConfig.mediaLibraryId, service]);

  const showCustomImage =
    resolvedConfig.visualMode === 'custom_upload' &&
    Boolean(resolvedConfig.customImageUrl?.trim()) &&
    !imgError;

  const safeScale = clampImageScale(resolvedConfig.imageScale);
  const safeFocalX = clampFocalPoint(resolvedConfig.focalPointX);
  const safeFocalY = clampFocalPoint(resolvedConfig.focalPointY);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!motionAllowed || resolvedConfig.animationStyle === 'gentle_float') return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const xNorm = (e.clientX - rect.left) / rect.width - 0.5;
    const yNorm = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rx: Number((-yNorm * 10).toFixed(2)),
      ry: Number((xNorm * 12).toFixed(2)),
      active: true,
    });
  };

  const handlePointerLeave = () => {
    if (tilt.active) {
      setTilt({ rx: 0, ry: 0, active: false });
    }
  };

  const handleTouchStart = () => {
    if (!motionAllowed) return;
    setTilt({ rx: -3.5, ry: 3.5, active: true });
  };

  const handleTouchEnd = () => {
    if (tilt.active) {
      setTilt({ rx: 0, ry: 0, active: false });
    }
  };

  const stageHeightClass =
    variant === 'detail'
      ? 'h-44 sm:h-48'
      : variant === 'preview'
      ? 'h-48 sm:h-52'
      : 'h-36 sm:h-40';

  const glowOpacityClass =
    resolvedConfig.glowIntensity === 'ember'
      ? 'opacity-95'
      : resolvedConfig.glowIntensity === 'subtle'
      ? 'opacity-45'
      : 'opacity-75';

  const floatAnimClass =
    motionAllowed &&
    (resolvedConfig.animationStyle === 'float_tilt' ||
      resolvedConfig.animationStyle === 'gentle_float')
      ? 'service-3d-float-stage'
      : '';

  return (
    <div
      data-testid={`service-3d-stage-${service.id}`}
      data-visual-mode={showCustomImage ? 'custom_upload' : resolvedConfig.visualMode}
      data-animation-enabled={motionAllowed ? 'true' : 'false'}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        perspective: '900px',
      }}
      className={`relative w-full ${stageHeightClass} rounded-2xl overflow-hidden select-none transition-all duration-300 border ${
        isDarkCard
          ? 'bg-gradient-to-br from-[#16161F] via-[#101014] to-[#1D1615] border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
          : 'bg-gradient-to-br from-[#14141B] via-[#101014] to-[#231917] border-[#101014]/20 shadow-[0_10px_24px_-12px_rgba(16,16,20,0.45)]'
      }`}
    >
      {/* Subtle 3D Perspective Grid & Ambient Ember/Amber Light Accents */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${glowOpacityClass}`}
        style={{
          backgroundImage: `
            radial-gradient(circle at ${safeFocalX}% ${safeFocalY}%, rgba(255, 92, 53, 0.28) 0%, rgba(255, 181, 71, 0.12) 38%, rgba(16, 16, 20, 0) 72%),
            linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 24px 24px, 24px 24px',
        }}
      />

      {/* Top Glass Specular Rim */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FFB547]/50 to-transparent pointer-events-none"
      />

      {/* 3D Interactive Transform Container */}
      <div
        className={`relative w-full h-full flex items-center justify-center p-2.5 transition-transform duration-300 ease-out ${floatAnimClass}`}
        style={{
          transform: tilt.active
            ? `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(8px) scale(${safeScale})`
            : `rotateX(0deg) rotateY(0deg) scale(${safeScale})`,
          transformOrigin: `${safeFocalX}% ${safeFocalY}%`,
          transformStyle: 'preserve-3d',
        }}
      >
        {showCustomImage ? (
          <img
            data-testid={`service-custom-img-${service.id}`}
            src={resolvedConfig.customImageUrl}
            alt={lang === 'en' ? service.titleEn : service.titleHi}
            loading="lazy"
            onError={() => setImgError(true)}
            style={{
              objectFit: resolvedConfig.imageFit || 'contain',
              objectPosition: `${safeFocalX}% ${safeFocalY}%`,
            }}
            className="w-full h-full max-w-full max-h-full transition-all duration-300 drop-shadow-[0_12px_20px_rgba(0,0,0,0.55)]"
          />
        ) : (
          <div
            data-testid={`service-preset-svg-${service.id}`}
            data-preset-id={activePreset.id}
            className="w-full h-full flex items-center justify-center"
          >
            <Builtin3DIllustrationSvg
              presetKey={activePreset.svgPresetKey}
              uidPrefix={`srv3d-${uid}`}
            />
          </div>
        )}
      </div>

      {/* Subtle Bottom Edge Reflection Line */}
      <div
        aria-hidden="true"
        className="absolute inset-x-6 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF5C35]/55 to-transparent pointer-events-none"
      />
    </div>
  );
};
