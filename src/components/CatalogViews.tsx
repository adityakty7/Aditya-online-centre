import React from 'react';
import {
  AppView,
  CategoryMeta,
  CenterSettings,
  DigitalService,
  DocumentLibraryItem,
  Language,
  ServiceCategoryKey,
  ServiceCustomField,
  VisualTheme,
} from '../types';
import { SERVICE_CATEGORIES } from '../data/initialCatalog';
import { BUSINESS_INFO } from '../config/businessInfo';
import {
  BEFORE_AFTER_SHOWCASE_TABS,
  HERO_CINEMATIC_MEDIA,
  calculateBundleEstimate,
  clampComparisonSlider,
  cleanDocumentLabel,
  getServiceDocumentRequirements,
} from '../utils/rules';
import {
  Search,
  Clock,
  FileText,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Shield,
  ShieldCheck,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronDown,
  Lock,
  PhoneCall,
  HelpCircle,
  SlidersHorizontal,
  ArrowLeft,
  IndianRupee,
  FileBadge,
  HeartHandshake,
  Keyboard,
  Files,
  ClipboardCheck,
  GraduationCap,
  Landmark,
  Fingerprint,
  Zap,
  Plus,
} from 'lucide-react';

interface CatalogViewsProps {
  mode: 'home' | 'services' | 'service-detail';
  lang: Language;
  theme?: VisualTheme;
  services: DigitalService[];
  selectedCategory: ServiceCategoryKey | 'all';
  onSelectCategory: (cat: ServiceCategoryKey | 'all') => void;
  searchQuery: string;
  onChangeSearch: (q: string) => void;
  selectedService: DigitalService | null;
  onInspectService: (service: DigitalService) => void;
  onStartOrder: (service: DigitalService) => void;
  onNavigate: (view: AppView) => void;
  onQuickTrackOrder?: (orderNumber: string) => void;
  settings: CenterSettings;
  categories?: CategoryMeta[];
  documentLibrary?: DocumentLibraryItem[];
}

function formatCatalogDocLabel(raw: string): string {
  const cleaned = cleanDocumentLabel(raw);
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Cinematic 3D Animated Hero Backdrop — Genuine Local Muted Looping Video + Live 3D Canvas Grid
 * Decorative-only (aria-hidden="true"), hardware-accelerated, pauses automatically when tab is hidden
 * or when prefers-reduced-motion is active, with static SVG poster fallback.
 */
const CinematicHeroBackdrop: React.FC<{ isPaused?: boolean }> = ({
  isPaused = false,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);
  const [videoFailed, setVideoFailed] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  React.useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (prefersReducedMotion || isPaused) {
      vid.pause();
    } else {
      vid.play().catch(() => {
        // Autoplay blocked or unsupported — fallback poster/canvas remains active
      });
    }
  }, [prefersReducedMotion, isPaused]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = canvas.offsetWidth || 1280);
    let height = (canvas.height = canvas.offsetHeight || 720);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || 1280;
      height = canvas.height = canvas.offsetHeight || 720;
    };
    window.addEventListener('resize', handleResize);

    // Fewer particles on narrow mobile screens for fast 60fps performance
    const isMobileViewport = width < 640;
    const particleCount = isMobileViewport ? 12 : 24;
    const particles = Array.from({ length: particleCount }, (_, i) => ({
      x: ((i * 97) % 100) / 100,
      y: ((i * 53) % 100) / 100,
      r: 1.4 + (i % 4) * 0.85,
      speedY: 0.0003 + (i % 5) * 0.0001,
      speedX: (i % 2 === 0 ? 1 : -1) * 0.00014,
      isAmber: i % 3 === 0,
      phase: i * 0.7,
    }));

    let tick = 0;

    const renderFrame = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Subtle 3D Horizon Glow
      const horizonY = height * 0.56;
      const horizonGrad = ctx.createRadialGradient(
        width * 0.62,
        horizonY,
        10,
        width * 0.62,
        horizonY,
        Math.max(width, height) * 0.65
      );
      horizonGrad.addColorStop(0, 'rgba(255, 92, 53, 0.2)');
      horizonGrad.addColorStop(0.45, 'rgba(255, 181, 71, 0.08)');
      horizonGrad.addColorStop(1, 'rgba(7, 7, 11, 0)');
      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. 3D Perspective Floor Grid receding to Vanishing Point
      const vpX = width * 0.58;
      const vpY = height * 0.38;
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 92, 53, 0.15)';
      ctx.lineWidth = 1;

      const numRays = isMobileViewport ? 10 : 16;
      for (let i = -numRays; i <= numRays; i++) {
        const bottomX = vpX + i * (width / 7.5);
        ctx.beginPath();
        ctx.moveTo(vpX, vpY);
        ctx.lineTo(bottomX, height * 1.15);
        ctx.stroke();
      }

      // Moving horizontal perspective lines
      const numRows = isMobileViewport ? 7 : 10;
      const offset = (tick * 0.4) % 1;
      for (let r = 0; r < numRows; r++) {
        const progress = (r + offset) / numRows;
        const curved = Math.pow(progress, 2.1);
        const y = vpY + curved * (height - vpY);
        const alpha = Math.min(0.26, curved * 0.32);
        ctx.strokeStyle = `rgba(255, 181, 71, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Rising 3D Bokeh Ember & Amber Nodes
      for (const p of particles) {
        if (!prefersReducedMotion && !isPaused) {
          p.y -= p.speedY;
          p.x += p.speedX * Math.sin(tick * 0.02 + p.phase);
          if (p.y < -0.05) p.y = 1.05;
          if (p.x < -0.05) p.x = 1.05;
          if (p.x > 1.05) p.x = -0.05;
        }
        const px = p.x * width;
        const py = p.y * height;
        const pulse = 0.55 + 0.45 * Math.sin(tick * 0.03 + p.phase);

        ctx.beginPath();
        ctx.arc(px, py, p.r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = p.isAmber
          ? `rgba(255, 181, 71, ${(0.14 * pulse).toFixed(3)})`
          : `rgba(255, 92, 53, ${(0.16 * pulse).toFixed(3)})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(px, py, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.isAmber
          ? `rgba(255, 224, 158, ${(0.72 * pulse).toFixed(3)})`
          : `rgba(255, 122, 89, ${(0.78 * pulse).toFixed(3)})`;
        ctx.fill();
      }

      if (!prefersReducedMotion && !isPaused) {
        tick += 0.022;
        animId = window.requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animId) window.cancelAnimationFrame(animId);
    };
  }, [isPaused, prefersReducedMotion]);

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
    >
      {/* Static Fallback Base & Poster Layer */}
      <div
        className="absolute inset-0 bg-[#07070B] bg-cover bg-center"
        style={{ backgroundImage: `url('${HERO_CINEMATIC_MEDIA.posterSrc}')` }}
      />

      {/* Genuine Optimized Local Looping Video (Muted, Decorative, Reduced-Motion Aware) */}
      {!prefersReducedMotion && !videoFailed && (
        <video
          ref={videoRef}
          data-testid="hero-cinematic-video"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={HERO_CINEMATIC_MEDIA.posterSrc}
          tabIndex={-1}
          onError={() => setVideoFailed(true)}
          className="absolute inset-0 w-full h-full object-cover opacity-65 mix-blend-screen"
        >
          <source src={HERO_CINEMATIC_MEDIA.webmSrc} type="video/webm" />
          <source src={HERO_CINEMATIC_MEDIA.mp4Src} type="video/mp4" />
        </video>
      )}

      {/* Subtle Volumetric Light Plumes + Electric Indigo, Cyan & Emerald Orbs */}
      <div className="absolute -top-24 right-[6%] w-[24rem] h-[24rem] sm:w-[36rem] sm:h-[36rem] rounded-full bg-[#FF5C35]/22 blur-[110px] animate-ember-plume" />
      <div className="absolute -bottom-28 left-[4%] w-[22rem] h-[22rem] sm:w-[32rem] sm:h-[32rem] rounded-full bg-indigo-500/20 blur-[110px] animate-amber-plume" />
      <div className="absolute top-[18%] left-[36%] w-[18rem] h-[18rem] sm:w-[26rem] sm:h-[26rem] rounded-full bg-cyan-400/14 blur-[95px] animate-float-slow" />
      <div className="absolute bottom-[10%] right-[22%] w-[16rem] h-[16rem] sm:w-[24rem] sm:h-[24rem] rounded-full bg-emerald-400/12 blur-[95px] animate-ember-plume" />

      {/* Live 3D Perspective Grid & Particle Wave Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-90"
      />
    </div>
  );
};

/**
 * 3D Multi-Layered Isometric Hologram & Floating Glass Telemetry Cards
 * Replaces flat 2D artwork with genuine CSS 3D depth layers (translateZ),
 * interactive pointer parallax, extruded isometric crystal core, and glassmorphic Quick-Track bar.
 */
const EditorialEmberSculpture: React.FC<{
  lang: Language;
  heroTrackId: string;
  onChangeHeroTrackId: (val: string) => void;
  onSubmitTrack: (e: React.FormEvent) => void;
  onSampleTrackClick?: (sampleOrderId: string) => void;
}> = ({
  lang,
  heroTrackId,
  onChangeHeroTrackId,
  onSubmitTrack,
  onSampleTrackClick,
}) => {
  const [tilt, setTilt] = React.useState<{ rx: number; ry: number }>({
    rx: 2.5,
    ry: -3.5,
  });
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || e.pointerType === 'touch') return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const normX = (e.clientX - rect.left) / rect.width - 0.5;
    const normY = (e.clientY - rect.top) / rect.height - 0.5;
    // Restrained perspective tilt for smooth, non-distracting 3D depth
    setTilt({
      rx: Number((-normY * 7).toFixed(2)),
      ry: Number((normX * 8).toFixed(2)),
    });
  };

  const handlePointerLeave = () => {
    setTilt({ rx: 2.5, ry: -3.5 });
  };

  const stageTransform = prefersReducedMotion
    ? undefined
    : `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`;

  return (
    <div className="relative w-full h-full flex flex-col justify-between gap-4">
      {/* Open 3D Holographic Glass Stage */}
      <div
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="perspective-stage relative w-full min-h-[340px] sm:min-h-[410px] lg:min-h-[440px] rounded-3xl glass-obsidian-panel overflow-hidden select-none flex flex-col justify-between p-4 sm:p-5"
      >
        {/* Ambient Volumetric Core Spotlight */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-gradient-to-tr from-[#FF5C35]/40 via-[#FFB547]/25 to-transparent blur-3xl pointer-events-none"
        />

        {/* Top Translucent Glass Telemetry Bar */}
        <div className="relative z-20 flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/15 backdrop-blur-xl text-[10px] font-mono-tabular uppercase tracking-[0.14em] text-[#F7F3EA]">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF5C35] shadow-[0_0_10px_#FF5C35]" />
            <span>3D HOLOGRAPHIC CORE · KATEYA</span>
          </span>
          <span className="text-[#FFB547] font-bold">26.54° N · 84.01° E</span>
        </div>

        {/* Interactive 3D Multi-Plane Stage */}
        <div
          style={{
            transform: stageTransform,
            transition: 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="preserve-3d relative flex-1 flex items-center justify-center my-2"
        >
          {/* Central 3D Isometric Crystal & Extruded Glass Planes SVG */}
          <svg
            viewBox="0 0 560 380"
            fill="none"
            aria-hidden="true"
            className="w-full h-full max-h-[320px] drop-shadow-[0_24px_48px_rgba(255,92,53,0.3)]"
          >
            <defs>
              <linearGradient id="isoTopFace" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFDF9" />
                <stop offset="45%" stopColor="#FFB547" />
                <stop offset="100%" stopColor="#FF5C35" />
              </linearGradient>
              <linearGradient id="isoLeftFace" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF7A59" />
                <stop offset="55%" stopColor="#FF5C35" />
                <stop offset="100%" stopColor="#9E1F04" />
              </linearGradient>
              <linearGradient id="isoRightFace" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFB547" stopOpacity="0.88" />
                <stop offset="50%" stopColor="#C83713" />
                <stop offset="100%" stopColor="#2A0B08" />
              </linearGradient>
              <linearGradient id="glassSlabGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
                <stop offset="50%" stopColor="#FFB547" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#FF5C35" stopOpacity="0.05" />
              </linearGradient>
              <radialGradient id="holoPlatformGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FF5C35" stopOpacity="0.65" />
                <stop offset="55%" stopColor="#FFB547" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#FF5C35" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* 3D Isometric Glowing Base Platform Pedestal */}
            <ellipse
              cx="280"
              cy="305"
              rx="170"
              ry="48"
              fill="url(#holoPlatformGlow)"
            />
            <ellipse
              cx="280"
              cy="302"
              rx="145"
              ry="38"
              stroke="#FFB547"
              strokeOpacity="0.5"
              strokeWidth="1.5"
              strokeDasharray="6 6"
            />
            <ellipse
              cx="280"
              cy="302"
              rx="105"
              ry="26"
              fill="#12121D"
              fillOpacity="0.8"
              stroke="#FF5C35"
              strokeOpacity="0.85"
              strokeWidth="2"
            />

            {/* Lower Isometric Translucent Glass Platform */}
            <polygon
              points="280,236 410,282 280,328 150,282"
              fill="url(#glassSlabGrad)"
              stroke="#FFFDF9"
              strokeOpacity="0.45"
              strokeWidth="1.5"
            />
            {/* Platform 3D Extruded Rim */}
            <polygon
              points="150,282 280,328 280,340 150,294"
              fill="#FF5C35"
              fillOpacity="0.45"
            />
            <polygon
              points="410,282 280,328 280,340 410,294"
              fill="#9E2205"
              fillOpacity="0.65"
            />

            {/* Outer Gyroscopic 3D Orbit Rings */}
            <ellipse
              cx="280"
              cy="185"
              rx="195"
              ry="74"
              stroke="#FF5C35"
              strokeOpacity="0.75"
              strokeWidth="2.2"
              className="animate-sculpture-orbit"
            />
            <ellipse
              cx="280"
              cy="185"
              rx="168"
              ry="58"
              transform="rotate(24 280 185)"
              stroke="#FFB547"
              strokeOpacity="0.55"
              strokeWidth="1.5"
              strokeDasharray="8 6"
            />

            {/* Floating Mid-Plane Translucent Glass Dossier Card (3D Isometric) */}
            <g className="animate-float-slow">
              <polygon
                points="280,178 395,220 280,262 165,220"
                fill="url(#glassSlabGrad)"
                stroke="#FFB547"
                strokeOpacity="0.75"
                strokeWidth="1.6"
              />
              {/* Central Hologram Cube / Octahedron Core */}
              {/* Top Left Illuminated Facet */}
              <polygon
                points="280,52 192,158 280,196"
                fill="url(#isoTopFace)"
                stroke="#FFFDF9"
                strokeWidth="1.4"
              />
              {/* Top Right Illuminated Facet */}
              <polygon
                points="280,52 368,158 280,196"
                fill="url(#isoLeftFace)"
                stroke="#FFB547"
                strokeWidth="1.4"
              />
              {/* Lower Left Extruded Facet */}
              <polygon
                points="192,158 280,268 280,196"
                fill="url(#isoLeftFace)"
                stroke="#FF5C35"
                strokeWidth="1.2"
              />
              {/* Lower Right Shaded Facet */}
              <polygon
                points="368,158 280,268 280,196"
                fill="url(#isoRightFace)"
                stroke="#FFB547"
                strokeOpacity="0.6"
                strokeWidth="1.2"
              />

              {/* Floating Satellite 3D Mini-Cubes */}
              <polygon
                points="132,112 162,126 132,140 102,126"
                fill="url(#isoTopFace)"
              />
              <polygon
                points="102,126 132,140 132,168 102,154"
                fill="url(#isoLeftFace)"
              />
              <polygon
                points="162,126 132,140 132,168 162,154"
                fill="url(#isoRightFace)"
              />

              <polygon
                points="428,96 456,108 428,120 400,108"
                fill="url(#isoTopFace)"
              />
              <polygon
                points="400,108 428,120 428,146 400,134"
                fill="url(#isoLeftFace)"
              />
              <polygon
                points="456,108 428,120 428,146 456,134"
                fill="url(#isoRightFace)"
              />
            </g>

            {/* Specular Apex Highlight Node */}
            <circle cx="280" cy="52" r="5" fill="#FFFDF9" />
            <circle
              cx="280"
              cy="196"
              r="7"
              fill="#FFFDF9"
              stroke="#FF5C35"
              strokeWidth="3"
            />
          </svg>

          {/* 3D Floating Glassmorphic Telemetry Cards (Translated in Z-Space) */}
          <div
            aria-hidden="true"
            className="hidden sm:flex flex-col gap-1 glass-telemetry-card rounded-2xl px-3.5 py-2.5 absolute top-3 left-2 animate-float-card-3d pointer-events-none"
          >
            <div className="flex items-center gap-1.5 font-mono-tabular text-[10px] text-[#FFB547] font-bold">
              <Sparkles className="w-3 h-3 text-[#FF5C35]" />
              <span>01 · ATS RESUME & BIODATA</span>
            </div>
            <div className="text-xs font-display font-bold text-white">
              {lang === 'en' ? '₹49–₹99 · Same-Day PDF' : '₹49–₹99 · त्वरित PDF डिलीवरी'}
            </div>
          </div>

          <div
            aria-hidden="true"
            className="hidden sm:flex flex-col gap-1 glass-telemetry-card rounded-2xl px-3.5 py-2.5 absolute top-8 right-2 animate-float-card-3d-rev pointer-events-none"
          >
            <div className="flex items-center gap-1.5 font-mono-tabular text-[10px] text-[#FF5C35] font-bold">
              <CheckCircle2 className="w-3 h-3 text-[#FFB547]" />
              <span>02 · MANUAL UPI VERIFIED</span>
            </div>
            <div className="text-xs font-display font-bold text-white">
              {lang === 'en' ? '12-Digit UTR Audit' : '12-अंकों का UTR सत्यापन'}
            </div>
          </div>

          <div
            aria-hidden="true"
            className="hidden sm:flex flex-col gap-1 glass-telemetry-card rounded-2xl px-3.5 py-2.5 absolute bottom-3 left-3 animate-float-card-3d pointer-events-none"
          >
            <div className="flex items-center gap-1.5 font-mono-tabular text-[10px] text-[#FFB547] font-bold">
              <Lock className="w-3 h-3 text-[#FF5C35]" />
              <span>03 · USER-ISOLATED VAULT</span>
            </div>
            <div className="text-xs font-display font-bold text-white">
              {lang === 'en' ? '100% Private Document Rules' : '100% सुरक्षित निजी फ़ाइलें'}
            </div>
          </div>
        </div>

        {/* Bottom Glassmorphic Caption Bar inside 3D Stage */}
        <div className="relative z-20 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-xl px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <div className="font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-[#FFB547] font-bold">
              {lang === 'en' ? 'DIGITAL ATELIER · KATEYA' : 'डिजिटल प्रणाली · कटेया'}
            </div>
            <div className="font-display text-xs sm:text-sm font-bold text-white mt-0.5">
              {lang === 'en'
                ? 'Interactive 3D Document & Form Studio'
                : 'सटीक दस्तावेज़ और ऑनलाइन फॉर्म सेवा'}
            </div>
          </div>
          <div className="text-right font-mono-tabular text-[10px] sm:text-[11px] text-[#F7F3EA] shrink-0">
            <div className="text-[#FF5C35] font-bold">LIVE TRACKING</div>
            <div className="text-[#FFB547]">8 WORKFLOW STAGES</div>
          </div>
        </div>
      </div>

      {/* Frosted-Glass Quick-Track Search Panel (Docked below 3D Stage) */}
      <form
        data-testid="hero-glass-track-panel"
        onSubmit={onSubmitTrack}
        aria-label={lang === 'en' ? 'Quick Order Tracker' : 'त्वरित ऑर्डर ट्रैकर'}
        className="glass-ember-search rounded-2xl p-3.5 sm:p-4 flex flex-col gap-2.5 relative z-20"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34D399] shrink-0" />
            <label
              htmlFor="hero-track-order-input"
              className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#FFB547] shrink-0"
            >
              {lang === 'en' ? 'TRACK ID:' : 'ऑर्डर आईडी:'}
            </label>
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 text-[#FFB547] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="hero-track-order-input"
                type="text"
                value={heroTrackId}
                onChange={(e) => onChangeHeroTrackId(e.target.value)}
                placeholder="AOC-20261018-D101"
                className="w-full min-h-[44px] pl-9 pr-3.5 py-1.5 rounded-xl bg-black/55 border border-white/20 text-xs font-mono-tabular text-white placeholder:text-[#A09D96] focus:border-[#FFB547] focus:ring-2 focus:ring-[#FF5C35]/50 focus:outline-none transition-all"
              />
            </div>
          </div>
          <button
            type="submit"
            className="min-h-[44px] px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF5C35] to-[#E54922] hover:from-[#FF6B47] hover:to-[#FF5C35] text-white text-xs font-mono-tabular font-bold uppercase tracking-wider shadow-[0_4px_20px_rgba(255,92,53,0.4)] transition-all shrink-0 flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFB547]"
          >
            <span>{lang === 'en' ? 'Locate Order' : 'ट्रैक करें'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1-Click Instant Demo Sample Order ID Chip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/10 text-[11px]">
          <span className="font-mono-tabular text-[#D8D3C8]">
            {lang === 'en'
              ? 'Instant 1-Click Live Tracker Demo:'
              : '1-क्लिक लाइव ट्रैकर डेमो:'}
          </span>
          <button
            type="button"
            data-testid="sample-order-chip"
            onClick={() => {
              onChangeHeroTrackId('AOC-20261018-D101');
              if (onSampleTrackClick) {
                onSampleTrackClick('AOC-20261018-D101');
              }
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-[#FF5C35]/25 border border-[#FFB547]/45 hover:border-[#FFB547] font-mono-tabular text-[11px] font-bold text-[#FFB547] hover:text-white transition-all shadow-[0_0_12px_rgba(255,181,71,0.2)]"
          >
            <Sparkles className="w-3 h-3 text-[#FF5C35]" />
            <span>AOC-20261018-D101</span>
            <span className="text-[10px] text-emerald-300 font-normal">
              ({lang === 'en' ? 'Try Demo →' : 'डेमो देखें →'})
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * 01.C — INTERACTIVE BEFORE & AFTER DOCUMENT TRANSFORMATION STUDIO
 * Showcases both Job Resume (ATS-Ready) and Marriage Biodata tabs with an interactive
 * comparison slider (0% to 100%) and direct 1-click Order action.
 */
const BeforeAfterTransformationStudio: React.FC<{
  lang: Language;
  services: DigitalService[];
  onStartOrder: (service: DigitalService) => void;
  onInspectService: (service: DigitalService) => void;
}> = ({ lang, services, onStartOrder, onInspectService }) => {
  const [activeTab, setActiveTab] = React.useState<'resume' | 'biodata'>('resume');
  const [sliderPos, setSliderPos] = React.useState<number>(62);

  const tabMeta =
    BEFORE_AFTER_SHOWCASE_TABS.find((t) => t.key === activeTab) ||
    BEFORE_AFTER_SHOWCASE_TABS[0];

  const matchedService =
    services.find((s) => s.id === tabMeta.serviceId) || services[0];

  return (
    <section
      data-testid="before-after-studio"
      className="editorial-dark-grid text-[#F7F3EA] border-t border-white/15 py-14 sm:py-20 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8 relative z-10">
        {/* Header & Dual-Tab Switcher (Job Resume vs Marriage Biodata) */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/15 pb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5C35]/15 border border-[#FF5C35]/40 font-mono-tabular text-xs font-bold uppercase tracking-[0.16em] text-[#FFB547]">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF5C35]" />
              <span>01.C — INTERACTIVE BEFORE & AFTER STUDIO</span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-[1.08]">
              {lang === 'en'
                ? 'From Rough Handwritten Notes to Print-Ready Studio PDF.'
                : 'सादे कागज़ के नोट्स से प्रीमियम प्रिंट-रेडी PDF तक का अंतर देखें।'}
            </h2>
            <p className="text-xs sm:text-sm text-[#D8D3C8] max-w-2xl">
              {lang === 'en'
                ? 'Slide to compare what customers photograph on their phone (Before) versus the formatted deliverable prepared at Aditya Online Center (After).'
                : 'स्लाइडर को बाएं-दाएं खिसकाकर देखें कि ग्राहक द्वारा भेजे गए साधारण नोट्स (Before) को हम कैसे आकर्षक PDF (After) में बदलते हैं।'}
            </p>
          </div>

          {/* Tab Switcher: Job Resume & Marriage Biodata */}
          <div
            role="tablist"
            aria-label={
              lang === 'en'
                ? 'Before and After Document Type Tabs'
                : 'दस्तावेज़ प्रकार टैब'
            }
            className="flex flex-wrap items-center gap-2 bg-white/[0.05] p-1.5 rounded-2xl border border-white/15 shrink-0"
          >
            {BEFORE_AFTER_SHOWCASE_TABS.map((tab) => {
              const isSelected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  data-testid={`before-after-tab-${tab.key}`}
                  aria-selected={isSelected}
                  onClick={() => setActiveTab(tab.key)}
                  className={`min-h-[42px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#FF5C35] to-[#E54922] text-white shadow-[0_6px_20px_rgba(255,92,53,0.4)]'
                      : 'text-[#D8D3C8] hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <span>{lang === 'en' ? tab.labelEn : tab.labelHi}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Split Comparison Stage with Restrained 3D Perspective */}
        <div className="perspective-stage grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left 8 Columns: Interactive 3D Comparison Viewport */}
          <div className="lg:col-span-8 rounded-3xl glass-obsidian-panel stage-3d-card p-4 sm:p-6 flex flex-col justify-between space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tabular">
              <span className="text-[#FFB547] font-bold">
                {lang === 'en' ? tabMeta.badgeEn : tabMeta.badgeHi}
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSliderPos(clampComparisonSlider(15))}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/15 text-[11px] text-[#D8D3C8] transition-colors"
                >
                  {lang === 'en' ? 'Raw Input' : 'कच्चा ड्राफ्ट'}
                </button>
                <button
                  type="button"
                  onClick={() => setSliderPos(clampComparisonSlider(50))}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/15 text-[11px] text-[#FFB547] font-bold transition-colors"
                >
                  50 / 50
                </button>
                <button
                  type="button"
                  onClick={() => setSliderPos(clampComparisonSlider(88))}
                  className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] border border-white/15 text-[11px] text-white font-bold transition-colors"
                >
                  {lang === 'en' ? 'Final Studio PDF' : 'तैयार PDF'}
                </button>
              </div>
            </div>

            {/* Layered Visual Comparison Box (Clip-Path Based — Zero Mobile Horizontal Clipping) */}
            <div className="relative w-full min-h-[330px] sm:min-h-[350px] rounded-2xl overflow-hidden border border-white/20 bg-[#14141D] select-none shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)]">
              {/* BASE LAYER (RIGHT / AFTER): Final Formatted Studio Deliverable */}
              <div className="absolute inset-0 bg-[#FFFDF9] text-[#101014] p-4 sm:p-7 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-2 border-b-2 border-[#101014] pb-3">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#101014] text-[#FFB547] font-mono-tabular text-[10px] font-bold uppercase">
                      {lang === 'en'
                        ? 'AFTER · STUDIO DELIVERABLE PDF'
                        : 'बाद में · तैयार स्टूडियो PDF'}
                    </div>
                    <h3 className="font-display text-base sm:text-2xl font-extrabold text-[#101014] mt-1.5 truncate">
                      {activeTab === 'resume'
                        ? 'RAHUL KUMAR SHARMA'
                        : lang === 'en'
                          ? 'MATRIMONIAL BIODATA · KUNWAR ADITYA RAJ'
                          : 'विवाह बायोडाटा · कुंवर आदित्य राज'}
                    </h3>
                    <p className="text-xs font-sans font-medium text-[#4A463E] line-clamp-2">
                      {activeTab === 'resume'
                        ? 'Computer Operator & Tally Executive · Kateya, Gopalganj (Bihar) · +91 98765 XXXXX'
                        : lang === 'en'
                          ? 'DOB: 14/08/1999 · Height: 5 ft 9 in · Gotra: Kashyap · Native: Kateya, Dist. Gopalganj (Bihar)'
                          : 'जन्म तिथि: 14/08/1999 · कद: 5 फुट 9 इंच · गोत्र: कश्यप · ग्राम/पोस्ट: कटेया, जिला: गोपालगंज'}
                    </p>
                  </div>
                  <div className="w-11 h-13 sm:w-12 sm:h-14 rounded-lg bg-[#F7F3EA] border-2 border-[#FF5C35] flex flex-col items-center justify-center text-[9px] font-mono-tabular font-bold text-[#C83713] shrink-0">
                    <span>PHOTO</span>
                    <span>300 DPI</span>
                  </div>
                </div>

                {activeTab === 'resume' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 my-2.5 text-xs">
                    <div className="p-2.5 sm:p-3 rounded-xl bg-[#F7F3EA] border border-[#DCD4C6] space-y-1">
                      <div className="font-mono-tabular text-[10px] font-bold uppercase text-[#C83713]">
                        01. ACADEMIC QUALIFICATION
                      </div>
                      <div className="font-bold text-[#101014]">
                        B.Com Honours (JPU Chapra · 2024) — 68.4%
                      </div>
                      <div className="text-[#4A463E]">
                        12th BSEB Patna (2021) · 10th BSEB (2019)
                      </div>
                    </div>
                    <div className="p-2.5 sm:p-3 rounded-xl bg-[#F7F3EA] border border-[#DCD4C6] space-y-1">
                      <div className="font-mono-tabular text-[10px] font-bold uppercase text-[#C83713]">
                        02. TECHNICAL SKILLS (ATS KEYWORDS)
                      </div>
                      <div className="font-bold text-[#101014]">
                        ADCA Diploma · Tally Prime with GST
                      </div>
                      <div className="text-[#4A463E]">
                        Hindi/English Typing (40 WPM) · MS Excel
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 my-2.5 text-xs">
                    <div className="p-2.5 sm:p-3 rounded-xl bg-[#F7F3EA] border border-[#DCD4C6] space-y-1">
                      <div className="font-mono-tabular text-[10px] font-bold uppercase text-[#C83713]">
                        {lang === 'en'
                          ? '01. EDUCATION & PROFESSION'
                          : '01. शैक्षणिक और व्यावसायिक विवरण'}
                      </div>
                      <div className="font-bold text-[#101014]">
                        {lang === 'en'
                          ? 'B.Tech (Civil Engineering) · First Class Honours'
                          : 'बी.टेक (सिविल इंजीनियरिंग) · प्रथम श्रेणी'}
                      </div>
                      <div className="text-[#4A463E]">
                        {lang === 'en'
                          ? 'Role: Site Engineer · Private Infrastructure Corp, Noida'
                          : 'कार्यरत: प्राइवेट कंस्ट्रक्शन कंपनी, नोएडा'}
                      </div>
                    </div>
                    <div className="p-2.5 sm:p-3 rounded-xl bg-[#F7F3EA] border border-[#DCD4C6] space-y-1">
                      <div className="font-mono-tabular text-[10px] font-bold uppercase text-[#C83713]">
                        {lang === 'en'
                          ? '02. FAMILY BACKGROUND (KATEYA, GOPALGANJ)'
                          : '02. पारिवारिक विवरण (कटेया, गोपालगंज)'}
                      </div>
                      <div className="font-bold text-[#101014]">
                        {lang === 'en'
                          ? 'Father: Shri Surendra Prasad (Govt. Teacher)'
                          : 'पिता: श्री सुरेन्द्र प्रसाद (शिक्षक)'}
                      </div>
                      <div className="text-[#4A463E]">
                        {lang === 'en'
                          ? 'Mother: Smt. Meena Devi · Brother: 1 (Married)'
                          : 'माता: श्रीमती मीना देवी · भाई: 1 (विवाहित)'}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#DCD4C6] pt-2 text-[10px] sm:text-[11px] font-mono-tabular text-[#4A463E]">
                  <span className="font-bold text-[#16A34A]">
                    ✓ A4 PRINT-READY + WHATSAPP PDF
                  </span>
                  <span>PREPARED BY ADITYA ONLINE CENTER</span>
                </div>
              </div>

              {/* FOREGROUND CLIPPED LAYER (LEFT / BEFORE): Uses clipPath so mobile & desktop widths match 100% without text clipping */}
              <div
                style={{
                  clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
                  transition: 'clip-path 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="absolute inset-0 bg-[#1C1B18] text-[#D8D3C8]"
              >
                <div className="w-full h-full p-4 sm:p-7 flex flex-col justify-between bg-[radial-gradient(#35322B_1px,transparent_1px)] [background-size:16px_16px]">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#FF5C35]/20 border border-[#FF5C35]/50 text-[#FFB547] font-mono-tabular text-[10px] font-bold uppercase">
                      {lang === 'en'
                        ? 'BEFORE · RAW PHONE PHOTO / NOTES'
                        : 'पहले · सादे कागज़ पर लिखे नोट्स'}
                    </div>
                    <div className="font-sans text-xs sm:text-base text-[#E5E0D5] leading-relaxed space-y-1.5 pt-1.5">
                      {activeTab === 'resume' ? (
                        <>
                          <p className="line-through decoration-[#FF5C35]/60 text-[#A09B90]">
                            Name - rahul kr sharma (vill kateya)
                          </p>
                          <p>mob: 98765xxxxx, dob - 12-5-2003</p>
                          <p>
                            matric pass 2019 bseb 1st div, inter 2021, bcom pass
                            2024
                          </p>
                          <p>
                            computer knowledge: tally gst, adca course, hindi
                            typing
                          </p>
                          <p className="text-xs text-[#FFB547] pt-1.5">
                            * Uneven phone camera shadow, no ATS headings,
                            informal layout
                          </p>
                        </>
                      ) : (
                        <>
                          <p>
                            {lang === 'en'
                              ? "Name - Aditya Raj, DOB - 14/8/99, Height 5'9\""
                              : 'नाम - आदित्य राज, जन्म - 14/8/99, कद 5\'9"'}
                          </p>
                          <p>
                            {lang === 'en'
                              ? 'Education - B.Tech Civil, Job - Site Engg Noida'
                              : 'पढ़ाई - B.Tech Civil, नौकरी - Noida'}
                          </p>
                          <p>
                            {lang === 'en'
                              ? 'Father - Surendra Prasad (Vill. Kateya, Gopalganj)'
                              : 'पिता का नाम - सुरेन्द्र प्रसाद (ग्राम कटेया)'}
                          </p>
                          <p>
                            {lang === 'en'
                              ? 'Gotra - Kashyap, Brother - 1, Sister - 1'
                              : 'गोत्र - कश्यप, भाई - 1, बहन - 1'}
                          </p>
                          <p className="text-xs text-[#FFB547] pt-1.5">
                            {lang === 'en'
                              ? '* Plain notebook photo, no traditional border, unaligned text'
                              : '* सादे कागज़ की धुंधली फोटो, बिना बॉर्डर और अव्यवस्थित क्रम'}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-[10px] sm:text-[11px] font-mono-tabular text-[#FFB547] border-t border-white/10 pt-2">
                    {lang === 'en'
                      ? '← DRAG SLIDER TO TRANSFORM INTO STUDIO PDF →'
                      : '← स्लाइडर खिसकाकर तैयार PDF देखें →'}
                  </div>
                </div>
              </div>

              {/* 3D Dimensional Split Divider Line & Tactile Handle */}
              <div
                data-testid="before-after-divider"
                aria-hidden="true"
                style={{
                  left: `${sliderPos}%`,
                  transition: 'left 180ms cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="absolute inset-y-0 -translate-x-1/2 w-0.5 bg-gradient-to-b from-[#FFB547] via-[#FF5C35] to-[#FFB547] shadow-[0_0_16px_rgba(255,92,53,0.9)] pointer-events-none z-20 flex items-center justify-center"
              >
                <div className="w-8 h-8 rounded-full bg-[#101014] border-2 border-[#FF5C35] shadow-[0_4px_16px_rgba(0,0,0,0.85)] flex items-center justify-center text-[#FFB547]">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Accessible Range Control for Comparison Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono-tabular text-[#D8D3C8]">
                <label htmlFor="before-after-range">
                  {lang === 'en'
                    ? 'INTERACTIVE COMPARISON SLIDER'
                    : 'तुलना स्लाइडर (बाएं-दाएं खिसकाएं)'}
                </label>
                <span className="text-[#FFB547] font-bold">
                  {sliderPos}% {lang === 'en' ? 'REVEAL' : 'दृश्य'}
                </span>
              </div>
              <input
                id="before-after-range"
                type="range"
                min={5}
                max={95}
                value={sliderPos}
                onChange={(e) =>
                  setSliderPos(clampComparisonSlider(e.target.value))
                }
                aria-label={
                  lang === 'en'
                    ? 'Before and after document transformation slider'
                    : 'दस्तावेज़ परिवर्तन तुलना स्लाइडर'
                }
                className="w-full h-3 rounded-lg accent-[#FF5C35] bg-white/15 cursor-pointer"
              />
            </div>
          </div>

          {/* Right 4 Columns: Direct Service Conversion Panel */}
          <div className="lg:col-span-4 rounded-3xl glass-obsidian-panel p-6 sm:p-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="font-mono-tabular text-xs font-bold uppercase tracking-wider text-[#FFB547]">
                {activeTab === 'resume'
                  ? lang === 'en'
                    ? 'FEATURED STUDIO SERVICE · 01'
                    : 'प्रमुख स्टूडियो सेवा · 01'
                  : lang === 'en'
                  ? 'FEATURED STUDIO SERVICE · 02'
                  : 'प्रमुख स्टूडियो सेवा · 02'}
              </div>
              <h3 className="font-display text-2xl font-extrabold text-white leading-tight">
                {lang === 'en'
                  ? matchedService.titleEn
                  : matchedService.titleHi}
              </h3>
              <p className="text-xs sm:text-sm text-[#D8D3C8] leading-relaxed">
                {lang === 'en' ? matchedService.descEn : matchedService.descHi}
              </p>

              <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/15 flex items-center justify-between">
                <div>
                  <div className="font-mono-tabular text-[10px] uppercase text-[#D8D3C8]">
                    {lang === 'en' ? 'STANDARD STUDIO FEE' : 'निर्धारित शुल्क'}
                  </div>
                  <div className="font-mono-tabular text-3xl font-extrabold text-[#FFB547]">
                    ₹{matchedService.priceInr}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono-tabular text-[10px] uppercase text-[#D8D3C8]">
                    {lang === 'en' ? 'DELIVERY' : 'वितरण समय'}
                  </div>
                  <div className="font-mono-tabular text-xs font-bold text-white mt-1">
                    {lang === 'en'
                      ? matchedService.estimatedTimeEn
                      : matchedService.estimatedTimeHi}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => onStartOrder(matchedService)}
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF5C35] to-[#E54922] hover:from-[#FF6B47] hover:to-[#FF5C35] text-white font-bold text-sm shadow-[0_8px_28px_rgba(255,92,53,0.4)] transition-all flex items-center justify-center gap-2"
              >
                <span>
                  {lang === 'en'
                    ? `Order ${tabMeta.labelEn} (₹${matchedService.priceInr})`
                    : `${tabMeta.labelHi} ऑर्डर करें (₹${matchedService.priceInr})`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onInspectService(matchedService)}
                className="w-full min-h-[42px] px-4 py-2 rounded-xl border border-white/20 hover:border-white text-xs font-mono-tabular uppercase tracking-wider text-[#E5E0D5] hover:text-white transition-colors"
              >
                {lang === 'en'
                  ? 'View Required Document Checklist'
                  : 'आवश्यक दस्तावेज़ सूची देखें'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/**
 * 01.D — INTERACTIVE MULTI-SERVICE FEE & CHECKLIST ESTIMATOR
 * Allows customers to toggle multiple services and immediately see the combined fee
 * and deduplicated required documents list.
 */
const InteractiveBundleEstimator: React.FC<{
  lang: Language;
  services: DigitalService[];
  onStartOrder: (service: DigitalService) => void;
}> = ({ lang, services, onStartOrder }) => {
  const [selectedIds, setSelectedIds] = React.useState<string[]>(() =>
    services.length > 0 ? [services[0].id] : []
  );

  const toggleServiceId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const estimate = React.useMemo(
    () => calculateBundleEstimate(selectedIds, services),
    [selectedIds, services]
  );

  const primarySelectedService =
    services.find((s) => selectedIds.includes(s.id)) || services[0];

  return (
    <section
      data-testid="bundle-estimator-section"
      className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16"
    >
      <div className="rounded-3xl glass-cream-panel p-6 sm:p-8 lg:p-10 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#DCD4C6] pb-5">
          <div>
            <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.18em] text-[#C83713]">
              01.D — INSTANT FEE & DOCUMENT CHECKLIST ESTIMATOR
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#101014] mt-1 tracking-tight">
              {lang === 'en'
                ? 'Calculate Your Total Fee & Required Documents'
                : 'अपना कुल शुल्क और आवश्यक दस्तावेज़ तुरंत जानें'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#4A463E] max-w-md">
            {lang === 'en'
              ? 'Select one or more services below to see the combined studio tariff and merged document checklist.'
              : 'नीचे दी गई सेवाओं को चुनें और कुल शुल्क व आवश्यक दस्तावेज़ों की संयुक्त सूची देखें।'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left 7 Cols: Selectable Service Pills */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {services.slice(0, 6).map((srv) => {
              const isChecked = selectedIds.includes(srv.id);
              return (
                <button
                  key={srv.id}
                  type="button"
                  onClick={() => toggleServiceId(srv.id)}
                  aria-pressed={isChecked}
                  className={`p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
                    isChecked
                      ? 'bg-[#101014] text-white border-[#FF5C35] shadow-md'
                      : 'bg-white/80 text-[#101014] border-[#DCD4C6] hover:border-[#FF5C35]'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="font-display text-sm font-bold leading-snug">
                      {lang === 'en' ? srv.titleEn : srv.titleHi}
                    </div>
                    <div
                      className={`font-mono-tabular text-[11px] ${
                        isChecked ? 'text-[#D8D3C8]' : 'text-[#5C5852]'
                      }`}
                    >
                      {lang === 'en' ? srv.estimatedTimeEn : srv.estimatedTimeHi}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div
                      className={`font-mono-tabular text-base font-extrabold ${
                        isChecked ? 'text-[#FFB547]' : 'text-[#101014]'
                      }`}
                    >
                      ₹{srv.priceInr}
                    </div>
                    <span
                      className={`inline-block font-mono-tabular text-[10px] uppercase px-2 py-0.5 rounded mt-1 ${
                        isChecked
                          ? 'bg-[#FF5C35] text-white font-bold'
                          : 'bg-[#EFE9DC] text-[#5C5852]'
                      }`}
                    >
                      {isChecked
                        ? lang === 'en'
                          ? 'Selected'
                          : 'चयनित'
                        : lang === 'en'
                        ? '+ Select'
                        : '+ चुनें'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right 5 Cols: Live Combined Estimate Summary */}
          <div className="lg:col-span-5 rounded-2xl bg-[#101014] text-[#F7F3EA] p-6 space-y-4">
            <div className="flex items-baseline justify-between border-b border-white/15 pb-3">
              <div>
                <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#D8D3C8]">
                  {lang === 'en'
                    ? `ESTIMATED TOTAL (${estimate.serviceCount} SERVICE${
                        estimate.serviceCount === 1 ? '' : 'S'
                      })`
                    : `अनुमानित कुल शुल्क (${estimate.serviceCount} सेवाएं)`}
                </div>
                <div className="font-mono-tabular text-3xl font-extrabold text-[#FFB547] mt-1">
                  ₹{estimate.totalFeeInr}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#D8D3C8]">
                  {lang === 'en' ? 'TURNAROUND' : 'अनुमानित समय'}
                </div>
                <div className="font-mono-tabular text-xs font-bold text-white mt-1">
                  {lang === 'en'
                    ? estimate.estimatedTurnaroundEn
                    : estimate.estimatedTurnaroundHi}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#FF5C35]">
                {lang === 'en'
                  ? `COMBINED REQUIRED DOCUMENTS (${estimate.uniqueRequiredDocsEn.length})`
                  : `संयुक्त आवश्यक दस्तावेज़ (${estimate.uniqueRequiredDocsHi.length})`}
              </div>
              {estimate.uniqueRequiredDocsEn.length === 0 ? (
                <p className="text-xs text-[#D8D3C8]">
                  {lang === 'en'
                    ? 'Select at least one service on the left to view required documents.'
                    : 'आवश्यक दस्तावेज़ देखने के लिए बाईं ओर से कोई सेवा चुनें।'}
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(lang === 'en'
                    ? estimate.uniqueRequiredDocsEn
                    : estimate.uniqueRequiredDocsHi
                  ).map((docLabel) => (
                    <span
                      key={docLabel}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.08] border border-white/15 text-xs text-white"
                    >
                      {docLabel}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {primarySelectedService && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onStartOrder(primarySelectedService)}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#FF5C35] hover:bg-[#E54922] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <span>
                    {lang === 'en'
                      ? `Start Order with ${primarySelectedService.titleEn}`
                      : `${primarySelectedService.titleHi} का ऑर्डर शुरू करें`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

function getServiceCardVisuals(srv: DigitalService, lang: Language) {
  const id = srv.id.toLowerCase();
  const title = srv.titleEn.toLowerCase();

  if (id.includes('resume') || title.includes('resume')) {
    return {
      Icon: FileBadge,
      iconBg:
        'bg-gradient-to-br from-[#FF5C35]/25 to-[#FFB547]/20 border-[#FF5C35]/50 text-[#FF5C35] shadow-[0_0_18px_rgba(255,92,53,0.35)]',
      ribbonText: lang === 'en' ? 'POPULAR' : 'लोकप्रिय',
      ribbonStyle:
        'bg-gradient-to-r from-[#FF5C35] to-[#FFB547] text-white shadow-[0_4px_14px_rgba(255,92,53,0.45)]',
      isFlagshipDark: true,
    };
  }
  if (id.includes('biodata') || title.includes('biodata')) {
    return {
      Icon: HeartHandshake,
      iconBg:
        'bg-gradient-to-br from-rose-500/20 to-amber-500/20 border-rose-500/40 text-rose-600 shadow-[0_0_16px_rgba(244,63,94,0.25)]',
      ribbonText: null,
      ribbonStyle: '',
      isFlagshipDark: false,
    };
  }
  if (id.includes('typing') || title.includes('typing')) {
    return {
      Icon: Keyboard,
      iconBg:
        'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500/40 text-cyan-700 shadow-[0_0_16px_rgba(6,182,212,0.25)]',
      ribbonText: null,
      ribbonStyle: '',
      isFlagshipDark: false,
    };
  }
  if (id.includes('pdf') || title.includes('pdf')) {
    return {
      Icon: Files,
      iconBg:
        'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-700 shadow-[0_0_16px_rgba(16,185,129,0.25)]',
      ribbonText: null,
      ribbonStyle: '',
      isFlagshipDark: false,
    };
  }
  if (id.includes('scholarship') || title.includes('scholarship')) {
    return {
      Icon: GraduationCap,
      iconBg:
        'bg-gradient-to-br from-indigo-500/25 to-cyan-400/20 border-indigo-400/50 text-indigo-300 shadow-[0_0_18px_rgba(99,102,241,0.4)]',
      ribbonText: lang === 'en' ? 'FAST-TRACK' : 'फास्ट-ट्रैक',
      ribbonStyle:
        'bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400 text-white shadow-[0_4px_14px_rgba(99,102,241,0.45)]',
      isFlagshipDark: true,
    };
  }
  if (id.includes('exam') || id.includes('govt') || title.includes('exam')) {
    return {
      Icon: ClipboardCheck,
      iconBg:
        'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/40 text-[#C83713] shadow-[0_0_16px_rgba(245,158,11,0.25)]',
      ribbonText: null,
      ribbonStyle: '',
      isFlagshipDark: false,
    };
  }
  if (
    id.includes('caste') ||
    id.includes('income') ||
    title.includes('certificate')
  ) {
    return {
      Icon: Landmark,
      iconBg:
        'bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border-emerald-600/40 text-emerald-800 shadow-[0_0_16px_rgba(16,185,129,0.22)]',
      ribbonText: null,
      ribbonStyle: '',
      isFlagshipDark: false,
    };
  }
  return {
    Icon: Fingerprint,
    iconBg:
      'bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border-indigo-500/40 text-indigo-700 shadow-[0_0_16px_rgba(99,102,241,0.25)]',
    ribbonText: null,
    ribbonStyle: '',
    isFlagshipDark: false,
  };
}

export const CatalogViews: React.FC<CatalogViewsProps> = ({
  mode,
  lang,
  services,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onChangeSearch,
  selectedService,
  onInspectService,
  onStartOrder,
  onNavigate,
  onQuickTrackOrder,
  categories = SERVICE_CATEGORIES,
  documentLibrary = [],
}) => {
  const [heroTrackId, setHeroTrackId] = React.useState('AOC-20261018-D101');
  const [isPageHidden, setIsPageHidden] = React.useState(false);
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(0);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibility = () => {
      setIsPageHidden(document.visibilityState === 'hidden');
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const activeServices = React.useMemo(
    () => services.filter((s) => s.isActive),
    [services]
  );

  const categoriesToDisplay = React.useMemo(() => {
    return categories && categories.length > 0 ? categories : SERVICE_CATEGORIES;
  }, [categories]);

  const filteredServices = React.useMemo(() => {
    return activeServices.filter((srv) => {
      const matchesCat =
        selectedCategory === 'all' || srv.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesCat;
      return (
        matchesCat &&
        (srv.titleEn.toLowerCase().includes(q) ||
          srv.titleHi.toLowerCase().includes(q) ||
          srv.descEn.toLowerCase().includes(q) ||
          srv.requiredDocs.toLowerCase().includes(q))
      );
    });
  }, [activeServices, selectedCategory, searchQuery]);

  const heroStats = React.useMemo(() => {
    const count = activeServices.length || 8;
    const formattedCount = count < 10 ? `0${count}` : `${count}`;
    const prices = activeServices
      .map((s) => s.priceInr)
      .filter((p) => typeof p === 'number' && p > 0);
    const min = prices.length ? Math.min(...prices) : 40;
    const max = prices.length ? Math.max(...prices) : 100;
    return {
      countText: formattedCount,
      tariffText: `₹${min}–${max}`,
      turnaroundText: '1–8 HRS',
    };
  }, [activeServices]);

  // ============================================================================
  // MODE: SERVICE DETAIL MONOGRAPH VIEW
  // ============================================================================
  if (mode === 'service-detail' && selectedService) {
    const customFields: ServiceCustomField[] = (() => {
      try {
        return JSON.parse(selectedService.customFieldsJson || '[]');
      } catch {
        return [];
      }
    })();

    const structuredDocs = getServiceDocumentRequirements(
      selectedService,
      documentLibrary
    );

    const categoryMeta = categoriesToDisplay.find(
      (c) => c.key === selectedService.category
    );

    return (
      <div className="editorial-cream-grid min-h-screen">
        {/* Dramatic Dark 3D Glass Monograph Header */}
        <section className="editorial-dark-grid text-[#F7F3EA] border-b border-white/15 relative overflow-hidden">
          <CinematicHeroBackdrop isPaused={isPageHidden} />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
            {/* Top Navigation & Editorial Index */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/15">
              <button
                type="button"
                onClick={() => onNavigate('services')}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-white/20 hover:border-[#FF5C35] bg-white/[0.06] backdrop-blur-xl text-xs font-mono-tabular uppercase tracking-wider text-[#F7F3EA] flex items-center gap-2 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#FF5C35]" />
                <span>
                  {lang === 'en' ? '00. All Services' : 'सभी सेवाओं पर वापस जाएं'}
                </span>
              </button>

              <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/15 font-mono-tabular text-xs text-[#D8D3C8]">
                <span className="text-[#FFB547] font-bold">
                  {selectedService.id.toUpperCase()}
                </span>
                <span aria-hidden="true">·</span>
                <span>
                  {lang === 'en'
                    ? categoryMeta?.labelEn || selectedService.category
                    : categoryMeta?.labelHi || selectedService.category}
                </span>
              </div>
            </div>

            {/* Asymmetric Monograph Title & Glass Price Block */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 items-end">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-[#FF5C35]/15 border border-[#FF5C35]/40 text-xs font-mono-tabular uppercase tracking-[0.16em] text-[#FFB547]">
                  <span>01. SERVICE SPECIFICATION</span>
                  {selectedService.featured && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-white font-bold">
                        {lang === 'en' ? 'FLAGSHIP SERVICE' : 'प्रमुख सेवा'}
                      </span>
                    </>
                  )}
                </div>

                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.06]">
                  {lang === 'en'
                    ? selectedService.titleEn
                    : selectedService.titleHi}
                </h1>

                <p className="text-sm sm:text-base text-[#E5E0D5] leading-relaxed max-w-2xl">
                  {lang === 'en'
                    ? selectedService.descEn
                    : selectedService.descHi}
                </p>
              </div>

              {/* Price & Turnaround 3D Frosted Glass Block */}
              <div className="lg:col-span-4 rounded-3xl glass-obsidian-panel p-6 flex flex-col justify-between space-y-5">
                <div className="flex items-baseline justify-between border-b border-white/15 pb-4">
                  <div>
                    <div className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#D8D3C8]">
                      {lang === 'en' ? 'STANDARD FEE' : 'निर्धारित शुल्क'}
                    </div>
                    <div className="font-mono-tabular text-3xl sm:text-4xl font-extrabold text-[#FFB547] mt-1">
                      ₹{selectedService.priceInr}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#D8D3C8]">
                      {lang === 'en' ? 'TURNAROUND' : 'अनुमानित समय'}
                    </div>
                    <div className="font-mono-tabular text-xs sm:text-sm font-bold text-white mt-1 flex items-center justify-end gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#FF5C35]" />
                      <span>
                        {lang === 'en'
                          ? selectedService.estimatedTimeEn
                          : selectedService.estimatedTimeHi}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onStartOrder(selectedService)}
                  className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF5C35] to-[#E54922] hover:from-[#FF6B47] hover:to-[#FF5C35] text-white font-bold text-sm shadow-[0_8px_28px_rgba(255,92,53,0.4)] transition-all flex items-center justify-center gap-2"
                >
                  <span>
                    {lang === 'en'
                      ? 'Start Service Order & Upload'
                      : 'ऑर्डर शुरू करें और दस्तावेज़ जोड़ें'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Asymmetric 12-Column Glassmorphic Specification Ledger */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left 7 Columns: Structured Document Requirements & Form Preview */}
            <div className="lg:col-span-7 space-y-10">
              {/* 01. Document Requirements Ledger */}
              <div className="glass-cream-panel rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-baseline justify-between border-b border-[#DCD4C6] pb-3">
                  <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#101014] flex items-center gap-2.5">
                    <span className="font-mono-tabular text-xs text-[#C83713]">
                      01.
                    </span>
                    <span>
                      {lang === 'en'
                        ? 'Document Checklist & Upload Specifications'
                        : 'आवश्यक दस्तावेज़ और अपलोड विवरण'}
                    </span>
                  </h2>
                  <span className="font-mono-tabular text-xs text-[#5C5852]">
                    {structuredDocs.length}{' '}
                    {lang === 'en' ? 'ITEMS' : 'दस्तावेज़'}
                  </span>
                </div>

                <div className="divide-y divide-[#DCD4C6]">
                  {structuredDocs.map((docItem, idx) => {
                    const cleanName = formatCatalogDocLabel(
                      lang === 'en'
                        ? docItem.labelEn
                        : docItem.labelHi || docItem.labelEn
                    );
                    return (
                      <div
                        key={docItem.docId}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-mono-tabular text-xs font-bold text-[#C83713] pt-0.5">
                            {String(idx + 1).padStart(2, '0')}.
                          </span>
                          <div>
                            <div className="font-semibold text-sm sm:text-base text-[#101014] flex flex-wrap items-center gap-2">
                              <span>{cleanName}</span>
                              <span aria-hidden="true" className="text-[#8C857B]">
                                ·
                              </span>
                              <span
                                className={`font-mono-tabular text-xs uppercase tracking-wider ${
                                  docItem.required
                                    ? 'text-[#C83713] font-bold'
                                    : 'text-[#5C5852]'
                                }`}
                              >
                                {docItem.required
                                  ? lang === 'en'
                                    ? 'Required'
                                    : 'अनिवार्य'
                                  : lang === 'en'
                                  ? 'Optional'
                                  : 'वैकल्पिक'}
                              </span>
                            </div>
                            {(docItem.instructionsEn || docItem.instructionsHi) && (
                              <p className="text-xs text-[#5C5852] mt-1">
                                {lang === 'en'
                                  ? docItem.instructionsEn
                                  : docItem.instructionsHi}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="sm:text-right font-mono-tabular text-xs text-[#5C5852] pl-7 sm:pl-0 shrink-0">
                          <div>
                            {docItem.allowedFormats
                              .map((f) => f.toUpperCase())
                              .join(' / ')}
                          </div>
                          <div className="text-[11px] text-[#787166]">
                            MAX {docItem.maxSizeKb} KB
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 02. Dynamic Form Fields Preview */}
              {customFields.length > 0 && (
                <div className="glass-cream-panel rounded-3xl p-6 sm:p-8 space-y-4">
                  <div className="flex items-baseline justify-between border-b border-[#DCD4C6] pb-3">
                    <h2 className="font-display text-lg sm:text-xl font-extrabold text-[#101014] flex items-center gap-2.5">
                      <span className="font-mono-tabular text-xs text-[#C83713]">
                        02.
                      </span>
                      <span>
                        {lang === 'en'
                          ? 'Information Collected During Order'
                          : 'ऑर्डर फॉर्म में पूछी जाने वाली जानकारी'}
                      </span>
                    </h2>
                  </div>

                  <div className="divide-y divide-[#DCD4C6]">
                    {customFields.map((field, idx) => (
                      <div
                        key={field.id}
                        className="py-3.5 flex items-center justify-between gap-4 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono-tabular text-xs text-[#787166]">
                            0{idx + 1}.
                          </span>
                          <span className="font-semibold text-[#101014]">
                            {lang === 'en' ? field.labelEn : field.labelHi}
                          </span>
                        </div>
                        <span className="font-mono-tabular text-xs text-[#5C5852] uppercase">
                          {field.required
                            ? lang === 'en'
                              ? 'Mandatory'
                              : 'अनिवार्य'
                            : lang === 'en'
                            ? 'Optional'
                            : 'वैकल्पिक'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right 5 Columns: Execution & Security Dossier */}
            <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
              <div className="glass-bento-flagship rounded-3xl text-[#F7F3EA] p-6 sm:p-8 space-y-6">
                <div className="space-y-2 border-b border-white/15 pb-5">
                  <div className="font-mono-tabular text-[11px] uppercase tracking-[0.18em] text-[#FFB547]">
                    03. EXECUTION PROTOCOL · KATEYA
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#F7F3EA]">
                    {lang === 'en'
                      ? 'How Your Order Is Processed'
                      : 'आपका ऑर्डर कैसे तैयार किया जाता है'}
                  </h3>
                </div>

                <ol className="space-y-4 text-xs sm:text-sm text-[#D8D3C8]">
                  <li className="flex items-start gap-3">
                    <span className="font-mono-tabular text-xs font-bold text-[#FF5C35] pt-0.5">
                      01.
                    </span>
                    <span>
                      {lang === 'en'
                        ? 'Upload each required document in its dedicated slot and receive a unique Order ID (AOC-YYYYMMDD-XXXX).'
                        : 'प्रत्येक आवश्यक दस्तावेज़ को उसके निर्धारित स्थान पर अपलोड करें और यूनिक ऑर्डर आईडी प्राप्त करें।'}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-mono-tabular text-xs font-bold text-[#FF5C35] pt-0.5">
                      02.
                    </span>
                    <span>
                      {lang === 'en'
                        ? 'Pay via UPI and submit your 12-digit UTR number. An admin manually verifies bank credit before marking paid.'
                        : 'UPI द्वारा शुल्क का भुगतान करें और सत्यापन के लिए 12-अंकों का UTR नंबर दर्ज करें।'}
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="font-mono-tabular text-xs font-bold text-[#FF5C35] pt-0.5">
                      03.
                    </span>
                    <span>
                      {lang === 'en'
                        ? 'Download your finalized PDF, resume, or application acknowledgment directly from your private portal.'
                        : 'तैयार होने पर अपना फाइनल PDF, रिज़्यूमे या रसीद सीधे पोर्टल से डाउनलोड करें।'}
                    </span>
                  </li>
                </ol>

                <div className="pt-2 space-y-3">
                  <button
                    type="button"
                    onClick={() => onStartOrder(selectedService)}
                    className="w-full min-h-[48px] px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#FF5C35] to-[#E54922] hover:from-[#FF6B47] hover:to-[#FF5C35] text-white font-bold text-sm shadow-[0_8px_28px_rgba(255,92,53,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    <span>
                      {lang === 'en'
                        ? 'Proceed to Order Form'
                        : 'ऑर्डर फॉर्म पर आगे बढ़ें'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <p className="text-[11px] font-mono-tabular text-[#D8D3C8] text-center">
                    {lang === 'en'
                      ? 'ZERO BANKING PINS OR OTPS EVER REQUESTED'
                      : 'बैंक पासवर्ड, पिन या OTP कभी नहीं मांगा जाता'}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="editorial-cream-grid relative">
      {/* ===================================================================== */}
      {/* 00. OPEN 3D & GLASSMORPHIC SPLIT HERO STAGE                           */}
      {/* ===================================================================== */}
      {mode === 'home' && (
        <section
          className={`editorial-dark-grid text-[#F7F3EA] border-b border-white/15 relative overflow-hidden ${
            isPageHidden ? 'cinematic-paused' : ''
          }`}
        >
          {/* Live 3D Canvas Perspective Grid & Volumetric Ember Plumes */}
          <CinematicHeroBackdrop isPaused={isPageHidden} />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 relative z-10">
            {/* Open Two-Column Floating 3D Glassmorphic Stage */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
              {/* Left Column (6 Cols on Desktop): Floating Translucent Glass Command Monolith */}
              <div className="lg:col-span-6 rounded-3xl glass-obsidian-panel p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-7 relative overflow-hidden animate-hero-reveal">
                {/* Ambient Internal Specular Glow (Ember + Electric Indigo + Cyan) */}
                <div
                  aria-hidden="true"
                  className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-[#FF5C35]/20 blur-3xl pointer-events-none"
                />
                <div
                  aria-hidden="true"
                  className="absolute -bottom-20 right-4 w-56 h-56 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"
                />

                <div className="space-y-6 relative z-10">
                  {/* Glowing Glass Issue Capsule */}
                  <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.07] border border-white/20 backdrop-blur-xl">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399]" />
                    <span className="font-mono-tabular text-[11px] font-bold uppercase tracking-[0.16em] text-[#FFB547]">
                      00. KATEYA 3D DIGITAL STUDIO
                    </span>
                    <span aria-hidden="true" className="text-white/30">
                      ·
                    </span>
                    <span className="font-mono-tabular text-[11px] text-white">
                      {lang === 'en'
                        ? 'GOPALGANJ, BIHAR'
                        : 'कटेया, गोपालगंज (बिहार)'}
                    </span>
                  </div>

                  {/* Required Split Hero Headline with Luminous Multi-Stop Gradient */}
                  <h1 className="font-display text-[2.25rem] sm:text-5xl lg:text-[3.7rem] font-extrabold tracking-tight leading-[1.03] text-white">
                    {lang === 'en' ? (
                      <>
                        Your Digital World,{' '}
                        <span className="bg-gradient-to-r from-[#FF5C35] via-[#FFB547] to-[#38BDF8] bg-clip-text text-transparent block sm:inline">
                          Simplified.
                        </span>
                      </>
                    ) : (
                      <>
                        आपकी डिजिटल दुनिया,{' '}
                        <span className="bg-gradient-to-r from-[#FFB547] via-[#FF5C35] to-[#38BDF8] bg-clip-text text-transparent block sm:inline">
                          अब और सरल।
                        </span>
                      </>
                    )}
                  </h1>

                  {/* Concise Supporting Copy — Crisp White/Cream on Frosted Glass */}
                  <p className="text-sm sm:text-base lg:text-lg text-[#EAE5DA] leading-relaxed max-w-xl font-normal">
                    {lang === 'en'
                      ? 'ATS resumes, marriage biodata, government & scholarship form submissions, and PDF formatting for Kateya and Gopalganj—delivered online with user-isolated document security.'
                      : 'कटेया और गोपालगंज के नागरिकों के लिए घर बैठे ATS रिज़्यूमे, शादी बायोडाटा, सरकारी व छात्रवृत्ति फॉर्म सहायता और PDF सुधार—सुरक्षित दस्तावेज़ अपलोड और पारदर्शी शुल्क के साथ।'}
                  </p>

                  {/* Primary & Secondary Glassmorphic Actions */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(
                          'service-catalog-section'
                        );
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth' });
                        } else {
                          onNavigate('services');
                        }
                      }}
                      className="min-h-[48px] px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF5C35] to-[#E54922] hover:from-[#FF6B47] hover:to-[#FF5C35] text-white font-bold text-sm transition-all flex items-center gap-2.5 shadow-[0_8px_28px_rgba(255,92,53,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFB547]"
                    >
                      <span>
                        {lang === 'en' ? 'Explore Services' : 'सेवाएं देखें'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onNavigate('track-order')}
                      className="min-h-[48px] px-6 py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/25 hover:border-[#FFB547] font-semibold text-sm transition-all flex items-center gap-2 backdrop-blur-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C35]"
                    >
                      <span>
                        {lang === 'en' ? 'Track Order' : 'ऑर्डर ट्रैक करें'}
                      </span>
                      <ArrowUpRight className="w-4 h-4 text-[#FFB547]" />
                    </button>
                  </div>

                  {/* Selective Glassmorphic Hero Service Search Panel */}
                  <form
                    data-testid="hero-glass-search-panel"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(
                        'service-catalog-section'
                      );
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        onNavigate('services');
                      }
                    }}
                    className="glass-ember-search rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                  >
                    <div className="relative flex-1 flex items-center">
                      <Search className="w-4 h-4 text-[#FFB547] absolute left-3.5 pointer-events-none" />
                      <label htmlFor="hero-service-search-input" className="sr-only">
                        {lang === 'en'
                          ? 'Search digital services'
                          : 'डिजिटल सेवाएं खोजें'}
                      </label>
                      <input
                        id="hero-service-search-input"
                        type="search"
                        value={searchQuery}
                        onChange={(e) => onChangeSearch(e.target.value)}
                        placeholder={
                          lang === 'en'
                            ? 'Search resume, biodata, scholarship, PAN, PDF...'
                            : 'रिज़्यूमे, बायोडाटा, छात्रवृत्ति, पैन, PDF खोजें...'
                        }
                        className="w-full min-h-[44px] pl-10 pr-3 py-1.5 rounded-xl bg-black/45 border border-white/15 text-xs sm:text-sm text-white placeholder:text-[#B8B2A6] focus:border-[#FFB547] focus:ring-2 focus:ring-[#FF5C35]/40 focus:outline-none transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-white/[0.1] hover:bg-[#FF5C35] text-white border border-white/20 hover:border-[#FF5C35] text-xs font-mono-tabular font-bold uppercase tracking-wider transition-colors shrink-0 flex items-center justify-center gap-1.5"
                    >
                      <span>{lang === 'en' ? 'Find Service' : 'सेवा खोजें'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                {/* 4 3D Glassmorphic Hero Metric Cards with Lucide Icons & -4px Hover Lift */}
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 relative z-10">
                  <div
                    data-testid="hero-metric-services"
                    className="hero-metric-card-3d rounded-2xl p-3.5 flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-lg bg-[#FF5C35]/20 border border-[#FF5C35]/40 flex items-center justify-center text-[#FF5C35]">
                        <Layers className="w-3.5 h-3.5" />
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <div>
                      <div className="font-mono-tabular text-xl sm:text-2xl font-extrabold text-white">
                        {heroStats.countText}
                      </div>
                      <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#D8D3C8] mt-0.5">
                        {lang === 'en' ? 'Active Services' : 'सक्रिय सेवाएं'}
                      </div>
                    </div>
                  </div>

                  <div
                    data-testid="hero-metric-tariff"
                    className="hero-metric-card-3d rounded-2xl p-3.5 flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-lg bg-[#FFB547]/20 border border-[#FFB547]/40 flex items-center justify-center text-[#FFB547]">
                        <IndianRupee className="w-3.5 h-3.5" />
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FFB547]" />
                    </div>
                    <div>
                      <div className="font-mono-tabular text-xl sm:text-2xl font-extrabold text-[#FFB547]">
                        {heroStats.tariffText}
                      </div>
                      <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#D8D3C8] mt-0.5">
                        {lang === 'en' ? 'Standard Tariff' : 'स्पष्ट शुल्क'}
                      </div>
                    </div>
                  </div>

                  <div
                    data-testid="hero-metric-turnaround"
                    className="hero-metric-card-3d rounded-2xl p-3.5 flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-lg bg-cyan-400/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                        <Clock className="w-3.5 h-3.5" />
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    </div>
                    <div>
                      <div className="font-mono-tabular text-xl sm:text-2xl font-extrabold text-white">
                        {heroStats.turnaroundText}
                      </div>
                      <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#D8D3C8] mt-0.5">
                        {lang === 'en' ? 'Turnaround' : 'वितरण समय'}
                      </div>
                    </div>
                  </div>

                  <div
                    data-testid="hero-metric-vault"
                    className="hero-metric-card-3d rounded-2xl p-3.5 flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-7 h-7 rounded-lg bg-emerald-400/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                        <ShieldCheck className="w-3.5 h-3.5" />
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <div>
                      <div className="font-mono-tabular text-xl sm:text-2xl font-extrabold text-emerald-400">
                        100%
                      </div>
                      <div className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#D8D3C8] mt-0.5">
                        {lang === 'en' ? 'Private Vault' : 'निजी दस्तावेज़'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (6 Cols on Desktop): 3D Isometric Hologram + Floating Glass Cards + Quick-Track */}
              <div className="lg:col-span-6 flex flex-col justify-between animate-hero-reveal-delayed">
                <EditorialEmberSculpture
                  lang={lang}
                  heroTrackId={heroTrackId}
                  onChangeHeroTrackId={setHeroTrackId}
                  onSampleTrackClick={(sampleId) => {
                    if (onQuickTrackOrder) {
                      onQuickTrackOrder(sampleId);
                    } else {
                      onNavigate('track-order');
                    }
                  }}
                  onSubmitTrack={(e) => {
                    e.preventDefault();
                    const clean = heroTrackId.trim();
                    if (clean && onQuickTrackOrder) {
                      onQuickTrackOrder(clean);
                    } else {
                      onNavigate('track-order');
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* 01. CURATED 3D SERVICE INDEX — 8 3D GLASSMORPHIC SERVICE CARDS        */}
      {/* ===================================================================== */}
      <section
        id="service-catalog-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 lg:py-20 space-y-8 sm:space-y-10 relative z-10"
      >
        {/* Editorial Section Header + Frosted Glass Search Command Bar */}
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-[#101014]/20 pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5C35]/12 border border-[#FF5C35]/30 font-mono-tabular text-xs font-bold uppercase tracking-[0.16em] text-[#C83713]">
                <Sparkles className="w-3.5 h-3.5 text-[#FF5C35]" />
                <span>
                  {mode === 'services'
                    ? '00. COMPLETE SERVICE DIRECTORY'
                    : '01. CURATED 3D SERVICE INDEX'}
                </span>
              </div>
              <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold text-[#101014] tracking-tight leading-[1.06]">
                {lang === 'en'
                  ? 'Digital Documentation & Form Studio'
                  : 'डिजिटल दस्तावेज़ और ऑनलाइन फॉर्म सूची'}
              </h2>
            </div>

            {/* Integrated Search Input — Frosted Glass Command Bar */}
            <div className="w-full lg:w-96 shrink-0">
              <label
                htmlFor="catalog-search-input"
                className="block font-mono-tabular text-[11px] font-semibold uppercase tracking-wider text-[#5C5852] mb-1.5"
              >
                {lang === 'en'
                  ? 'FILTER BY KEYWORD OR DOCUMENT'
                  : 'सेवा या दस्तावेज़ के नाम से खोजें'}
              </label>
              <div className="relative flex items-center glass-cream-panel rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#FF5C35]/50">
                <Search className="w-4 h-4 text-[#FF5C35] absolute left-3.5 pointer-events-none" />
                <input
                  id="catalog-search-input"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onChangeSearch(e.target.value)}
                  placeholder={
                    lang === 'en'
                      ? 'Search resume, scholarship, PAN, PDF...'
                      : 'रिज्यूमे, छात्रवृत्ति, पैन, PDF खोजें...'
                  }
                  className="w-full min-h-[46px] pl-10 pr-20 py-2 bg-transparent text-sm text-[#101014] placeholder:text-[#787166] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onChangeSearch('')}
                    className="absolute right-2 min-h-[36px] px-2.5 py-1 text-xs font-mono-tabular font-bold text-[#C83713] hover:underline"
                  >
                    {lang === 'en' ? 'CLEAR' : 'हटाएं'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sleek Category Filter Pills with Active Gradient Fill & Item Count Badges */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div
              role="tablist"
              aria-label={
                lang === 'en' ? 'Service Categories' : 'सेवा श्रेणियां'
              }
              className="flex flex-wrap items-center gap-2.5"
            >
              {categoriesToDisplay.map((cat, idx) => {
                const isSelected = selectedCategory === cat.key;
                const count =
                  cat.key === 'all'
                    ? activeServices.length
                    : activeServices.filter((s) => s.category === cat.key)
                        .length;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => onSelectCategory(cat.key)}
                    className={`min-h-[42px] px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 border focus-visible:outline-2 focus-visible:outline-[#FF5C35] ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#FF5C35] via-[#E54922] to-[#C83713] text-white border-[#FF5C35] shadow-[0_8px_24px_rgba(255,92,53,0.35)] -translate-y-0.5'
                        : 'glass-cream-panel text-[#101014] border-[#DCD4C6] hover:border-[#FF5C35]/60 hover:bg-white'
                    }`}
                  >
                    <span
                      className={`font-mono-tabular text-[10px] ${
                        isSelected ? 'text-[#FFB547] font-bold' : 'text-[#C83713]'
                      }`}
                    >
                      0{idx}.
                    </span>
                    <span>{lang === 'en' ? cat.labelEn : cat.labelHi}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-mono-tabular text-[10px] font-extrabold ${
                        isSelected
                          ? 'bg-black/25 text-white border border-white/25'
                          : 'bg-[#101014]/8 text-[#101014]'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="font-mono-tabular text-xs text-[#5C5852] shrink-0">
              {lang === 'en'
                ? `SHOWING ${filteredServices.length} OF ${activeServices.length} SERVICES`
                : `कुल ${activeServices.length} में से ${filteredServices.length} सेवाएं`}
            </div>
          </div>
        </div>

        {/* Empty Filter State */}
        {filteredServices.length === 0 ? (
          <div className="glass-cream-panel rounded-3xl p-10 text-center space-y-4">
            <p className="font-display text-lg font-bold text-[#101014]">
              {lang === 'en'
                ? 'No digital services matched your current filter.'
                : 'आपकी खोज से मेल खाती कोई सेवा नहीं मिली।'}
            </p>
            <button
              type="button"
              onClick={() => {
                onSelectCategory('all');
                onChangeSearch('');
              }}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#FF5C35] text-white text-xs font-mono-tabular font-bold uppercase tracking-wider"
            >
              {lang === 'en' ? 'Reset All Filters' : 'फ़िल्टर रीसेट करें'}
            </button>
          </div>
        ) : (
          /* 8 3D Glassmorphic Service Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 items-stretch">
            {filteredServices.map((srv, idx) => {
              const docs = getServiceDocumentRequirements(srv, documentLibrary);
              const reqCount = docs.filter((d) => d.required).length;
              const catMeta = categoriesToDisplay.find(
                (c) => c.key === srv.category
              );
              const visuals = getServiceCardVisuals(srv, lang);
              const ServiceIcon = visuals.Icon;
              const isDarkTile = visuals.isFlagshipDark;
              const indexLabel = `0${idx + 1}`;

              return (
                <article
                  key={srv.id}
                  data-testid={`service-card-${srv.id}`}
                  className={`rounded-3xl p-5 sm:p-6 flex flex-col justify-between gap-5 service-card-3d ${
                    isDarkTile
                      ? 'glass-bento-flagship text-[#F7F3EA]'
                      : 'glass-cream-panel text-[#101014]'
                  }`}
                >
                  {/* Top Highlight Ribbon ("POPULAR" / "FAST-TRACK") */}
                  {visuals.ribbonText && (
                    <div className="flex items-center justify-between gap-2 -mb-1 relative z-10">
                      <span
                        data-testid={`service-ribbon-${srv.id}`}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono-tabular text-[10px] font-extrabold uppercase tracking-wider ${visuals.ribbonStyle}`}
                      >
                        <Zap className="w-3 h-3" />
                        <span>{visuals.ribbonText}</span>
                      </span>
                      <span className="font-mono-tabular text-[10px] uppercase tracking-wider text-[#FFB547]">
                        #{indexLabel}
                      </span>
                    </div>
                  )}

                  <div className="space-y-4 relative z-10">
                    {/* Top Row: Glowing Service Icon Badge + Prominent Top-Right Price Pill */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 ${visuals.iconBg}`}
                        >
                          <ServiceIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <div
                            className={`font-mono-tabular text-[10px] font-bold uppercase tracking-wider ${
                              isDarkTile ? 'text-[#FFB547]' : 'text-[#C83713]'
                            }`}
                          >
                            {indexLabel} ·{' '}
                            {lang === 'en'
                              ? catMeta?.labelEn || srv.category
                              : catMeta?.labelHi || srv.category}
                          </div>
                          {/* Turnaround Clock Badge */}
                          <div
                            className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full font-mono-tabular text-[11px] ${
                              isDarkTile
                                ? 'bg-white/[0.08] border border-white/15 text-[#EAE5DA]'
                                : 'bg-[#101014]/[0.06] border border-[#101014]/15 text-[#4A463E]'
                            }`}
                          >
                            <Clock className="w-3 h-3 text-[#FF5C35]" />
                            <span>
                              {lang === 'en'
                                ? srv.estimatedTimeEn
                                : srv.estimatedTimeHi}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Prominent Price Pill Badge (₹40 to ₹100) in Top-Right Corner */}
                      <div
                        className={`shrink-0 px-3.5 py-1.5 rounded-2xl border text-right shadow-sm ${
                          isDarkTile
                            ? 'bg-gradient-to-br from-[#FF5C35] to-[#C83713] border-[#FFB547]/50 text-white'
                            : 'bg-[#101014] border-[#101014] text-white'
                        }`}
                      >
                        <span className="block font-mono-tabular text-[9px] uppercase tracking-wider text-[#FFB547]">
                          {lang === 'en' ? 'TARIFF' : 'शुल्क'}
                        </span>
                        <span className="font-mono-tabular text-lg sm:text-xl font-extrabold leading-none">
                          ₹{srv.priceInr}
                        </span>
                      </div>
                    </div>

                    {/* Service Title & Description */}
                    <div className="space-y-1.5">
                      <h3
                        className={`font-display text-lg sm:text-xl font-extrabold tracking-tight leading-snug ${
                          isDarkTile ? 'text-white' : 'text-[#101014]'
                        }`}
                      >
                        {lang === 'en' ? srv.titleEn : srv.titleHi}
                      </h3>
                      <p
                        className={`text-xs sm:text-sm leading-relaxed line-clamp-2 ${
                          isDarkTile ? 'text-[#D8D3C8]' : 'text-[#4A463E]'
                        }`}
                      >
                        {lang === 'en' ? srv.descEn : srv.descHi}
                      </p>
                    </div>

                    {/* Required Documents Compact Preview */}
                    <div
                      className={`pt-3 border-t text-xs space-y-1.5 ${
                        isDarkTile ? 'border-white/15' : 'border-[#DCD4C6]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono-tabular text-[10px] uppercase tracking-wider">
                        <span
                          className={
                            isDarkTile
                              ? 'text-[#FFB547] font-bold'
                              : 'text-[#C83713] font-bold'
                          }
                        >
                          {lang === 'en'
                            ? `${reqCount} REQUIRED DOCS`
                            : `${reqCount} आवश्यक दस्तावेज़`}
                        </span>
                        <span
                          className={
                            isDarkTile ? 'text-[#D8D3C8]' : 'text-[#5C5852]'
                          }
                        >
                          PDF / JPG
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {docs.slice(0, 3).map((d) => {
                          const label = formatCatalogDocLabel(
                            lang === 'en'
                              ? d.labelEn
                              : d.labelHi || d.labelEn
                          );
                          return (
                            <span
                              key={d.docId}
                              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium truncate max-w-full ${
                                isDarkTile
                                  ? 'bg-white/[0.08] border border-white/15 text-white'
                                  : 'bg-[#F7F3EA] border border-[#DCD4C6] text-[#101014]'
                              }`}
                            >
                              {label}
                            </span>
                          );
                        })}
                        {docs.length > 3 && (
                          <span
                            className={`px-2 py-0.5 rounded-lg font-mono-tabular text-[10px] ${
                              isDarkTile
                                ? 'bg-white/[0.06] text-[#FFB547]'
                                : 'bg-[#EFE9DC] text-[#5C5852]'
                            }`}
                          >
                            +{docs.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Full-Width Gradient CTA Button ("Start Application →") + Details */}
                  <div className="pt-2 space-y-2 relative z-10">
                    <button
                      type="button"
                      onClick={() => onStartOrder(srv)}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5C35] via-[#E54922] to-[#C83713] hover:from-[#FF6B47] hover:to-[#FF5C35] text-white text-xs sm:text-sm font-bold shadow-[0_6px_20px_rgba(255,92,53,0.35)] transition-all flex items-center justify-center gap-2"
                    >
                      <span>
                        {lang === 'en'
                          ? 'Start Application →'
                          : 'आवेदन शुरू करें →'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onInspectService(srv)}
                      className={`w-full min-h-[36px] px-3 py-1.5 rounded-xl text-[11px] font-mono-tabular font-semibold uppercase tracking-wider border transition-colors ${
                        isDarkTile
                          ? 'border-white/20 text-[#D8D3C8] hover:text-white hover:bg-white/[0.08]'
                          : 'border-[#101014]/20 text-[#4A463E] hover:text-[#101014] hover:bg-white'
                      }`}
                    >
                      {lang === 'en'
                        ? 'View Checklist & Details'
                        : 'दस्तावेज़ सूची और विवरण देखें'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ===================================================================== */}
      {/* HOME-ONLY EDITORIAL SECTIONS: BEFORE/AFTER STUDIO, DISCIPLINES, FAQ   */}
      {/* ===================================================================== */}
      {mode === 'home' && (
        <>
          {/* 01.C — INTERACTIVE BEFORE & AFTER DOCUMENT TRANSFORMATION STUDIO */}
          <BeforeAfterTransformationStudio
            lang={lang}
            services={activeServices}
            onStartOrder={onStartOrder}
            onInspectService={onInspectService}
          />

          {/* 01.D — INTERACTIVE MULTI-SERVICE FEE & CHECKLIST ESTIMATOR */}
          <InteractiveBundleEstimator
            lang={lang}
            services={activeServices}
            onStartOrder={onStartOrder}
          />

          {/* 02. 3D GLASSMORPHIC DISCIPLINE MATRIX */}
          <section className="border-t border-[#DCD4C6] bg-[#EFE9DC]/65 py-12 sm:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.2em] text-[#C83713]">
                    02. PRACTICE AREAS & DISCIPLINES
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#101014] mt-1 tracking-tight">
                    {lang === 'en'
                      ? 'Browse by Service Discipline'
                      : 'सेवा श्रेणी के अनुसार चुनें'}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-[#4A463E] max-w-md">
                  {lang === 'en'
                    ? 'Select any discipline below to filter the service ledger above.'
                    : 'किसी भी सेवा श्रेणी पर क्लिक करके संबंधित सेवाएं देखें।'}
                </p>
              </div>

              {/* 3D Glassmorphic Discipline Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {categoriesToDisplay
                  .filter((c) => c.key !== 'all')
                  .map((cat, idx) => {
                    const count = activeServices.filter(
                      (s) => s.category === cat.key
                    ).length;
                    const isSelected = selectedCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => {
                          onSelectCategory(cat.key);
                          const el = document.getElementById(
                            'service-catalog-section'
                          );
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className={`group p-6 sm:p-7 rounded-3xl text-left editorial-lift flex flex-col justify-between gap-5 ${
                          isSelected
                            ? 'glass-bento-flagship text-[#F7F3EA]'
                            : 'glass-cream-panel text-[#101014]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full font-mono-tabular text-xs">
                          <span
                            className={
                              isSelected
                                ? 'text-[#FF5C35] font-bold'
                                : 'text-[#C83713] font-bold'
                            }
                          >
                            0{idx + 1}. DISCIPLINE
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] ${
                              isSelected
                                ? 'bg-white/10 text-[#FFB547]'
                                : 'bg-[#101014]/8 text-[#5C5852]'
                            }`}
                          >
                            {count} {lang === 'en' ? 'SERVICES' : 'सेवाएं'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <h3 className="font-display text-xl font-extrabold tracking-tight flex items-center justify-between gap-2">
                            <span>
                              {lang === 'en' ? cat.labelEn : cat.labelHi}
                            </span>
                            <ArrowUpRight
                              className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                                isSelected
                                  ? 'text-[#FF5C35]'
                                  : 'text-[#101014] group-hover:text-[#FF5C35]'
                              }`}
                            />
                          </h3>
                          <p
                            className={`text-xs sm:text-sm leading-relaxed ${
                              isSelected ? 'text-[#D8D3C8]' : 'text-[#4A463E]'
                            }`}
                          >
                            {lang === 'en' ? cat.summaryEn : cat.summaryHi}
                          </p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          </section>

          {/* 03. VISUAL 3-STEP EXECUTION TIMELINE WITH GLOWING PROGRESS LINE */}
          <section
            data-testid="execution-protocol-section"
            className="editorial-dark-grid text-[#F7F3EA] border-t border-b border-white/15 py-14 sm:py-24 relative overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-10">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/15 pb-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.2em] text-[#FF5C35]">
                    {lang === 'en'
                      ? '03. EXECUTION PROTOCOL'
                      : '03. कार्यप्रणाली एवं चरण'}
                  </div>
                  <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-[1.06]">
                    {lang === 'en'
                      ? 'Three Stages from Upload to Delivery.'
                      : 'अपलोड से डिलीवरी तक 3 स्पष्ट चरण।'}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-[#D8D3C8] max-w-md leading-relaxed">
                  {lang === 'en'
                    ? 'No queues, no unverified payment screenshots, and no shared public folders. Every order follows an auditable 3-stage workflow.'
                    : 'बिना कतार में लगे घर बैठे अपने दस्तावेज़ सुरक्षित रूप से अपलोड करें और तैयार पीडीएफ डाउनलोड करें।'}
                </p>
              </div>

              {/* Connected 3-Step Visual Timeline (Horizontal Glowing Line on Desktop, Vertical on Mobile) */}
              <div className="relative">
                {/* Desktop Horizontal Glowing Progress Line */}
                <div
                  aria-hidden="true"
                  className="hidden md:block absolute top-11 left-[14%] right-[14%] h-1 rounded-full bg-gradient-to-r from-[#FF5C35] via-[#FFB547] to-emerald-400 shadow-[0_0_20px_rgba(255,92,53,0.65)] z-0"
                />
                {/* Mobile Vertical Glowing Progress Line */}
                <div
                  aria-hidden="true"
                  className="md:hidden absolute left-9 top-10 bottom-10 w-1 rounded-full bg-gradient-to-b from-[#FF5C35] via-[#FFB547] to-emerald-400 shadow-[0_0_16px_rgba(255,92,53,0.6)] z-0"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                  {/* Step 01 */}
                  <div className="rounded-3xl glass-obsidian-panel p-6 sm:p-7 space-y-4 editorial-lift border border-[#FF5C35]/40">
                    <div className="flex items-center justify-between gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF5C35] to-[#C83713] border border-[#FFB547]/60 shadow-[0_0_22px_rgba(255,92,53,0.55)] flex items-center justify-center font-mono-tabular text-base font-extrabold text-white">
                        01
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#FF5C35]/15 border border-[#FF5C35]/40 font-mono-tabular text-[10px] font-bold uppercase tracking-wider text-[#FFB547]">
                        {lang === 'en' ? 'STAGE 01 · DOSSIER' : 'चरण 01 · अपलोड'}
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-white">
                      {lang === 'en'
                        ? 'Select & Attach Dossier'
                        : 'सेवा चुनें और दस्तावेज़ जोड़ें'}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#D8D3C8] leading-relaxed">
                      {lang === 'en'
                        ? 'Choose your service, fill in the required parameters, and upload each required document in its dedicated checklist slot.'
                        : 'अपनी सेवा चुनें, विवरण भरें और प्रत्येक आवश्यक दस्तावेज़ को उसके निर्धारित स्थान पर अपलोड करें।'}
                    </p>
                  </div>

                  {/* Step 02 */}
                  <div className="rounded-3xl glass-obsidian-panel p-6 sm:p-7 space-y-4 editorial-lift border border-[#FFB547]/40">
                    <div className="flex items-center justify-between gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFB547] to-[#FF5C35] border border-white/50 shadow-[0_0_22px_rgba(255,181,71,0.5)] flex items-center justify-center font-mono-tabular text-base font-extrabold text-[#101014]">
                        02
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-[#FFB547]/15 border border-[#FFB547]/40 font-mono-tabular text-[10px] font-bold uppercase tracking-wider text-[#FFB547]">
                        {lang === 'en' ? 'STAGE 02 · UTR AUDIT' : 'चरण 02 · भुगतान'}
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-white">
                      {lang === 'en'
                        ? 'Manual UPI Verification'
                        : 'मैनुअल UPI भुगतान सत्यापन'}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#D8D3C8] leading-relaxed">
                      {lang === 'en'
                        ? 'Receive your Order ID (AOC-YYYYMMDD-XXXX). Pay via UPI and submit your 12-digit UTR for manual admin bank verification.'
                        : 'अपनी ऑर्डर आईडी प्राप्त करें, UPI से भुगतान करें और एडमिन सत्यापन के लिए 12-अंकों का UTR नंबर दर्ज करें।'}
                    </p>
                  </div>

                  {/* Step 03 */}
                  <div className="rounded-3xl glass-obsidian-panel p-6 sm:p-7 space-y-4 editorial-lift border border-emerald-400/40">
                    <div className="flex items-center justify-between gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 border border-white/50 shadow-[0_0_22px_rgba(52,211,153,0.5)] flex items-center justify-center font-mono-tabular text-base font-extrabold text-[#07110E]">
                        03
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/40 font-mono-tabular text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                        {lang === 'en' ? 'STAGE 03 · VAULT PDF' : 'चरण 03 · डिलीवरी'}
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-white">
                      {lang === 'en'
                        ? 'Encrypted Portal Delivery'
                        : 'तैयार PDF सुरक्षित डाउनलोड करें'}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#D8D3C8] leading-relaxed">
                      {lang === 'en'
                        ? 'Track 8 real-time workflow stages and download your finished resume, biodata, or form receipt directly from your portal.'
                        : 'ऑर्डर की प्रगति ट्रैक करें और तैयार होने पर अपना फाइनल दस्तावेज़ सीधे पोर्टल से डाउनलोड करें।'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 04 & 05. ASYMMETRIC PRIVACY ARCHITECTURE & INTERACTIVE FAQ ACCORDION */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Left 5 Columns: Privacy & Security Manifesto */}
              <div className="lg:col-span-5 rounded-3xl glass-cream-panel p-6 sm:p-8 space-y-6">
                <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.2em] text-[#C83713]">
                  04. SECURITY & DATA ISOLATION
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#101014] tracking-tight leading-[1.08]">
                  {lang === 'en'
                    ? 'Engineered for Citizen Document Privacy.'
                    : 'ग्राहक के निजी दस्तावेज़ों की पूर्ण सुरक्षा।'}
                </h2>
                <p className="text-sm text-[#4A463E] leading-relaxed">
                  {lang === 'en'
                    ? 'Unlike informal cyber cafes where files linger on shared desktops, Aditya Online Center isolates every order under strict Firestore ownership rules.'
                    : 'आदित्य ऑनलाइन सेंटर में आपके आधार, मार्कशीट और फोटो सख्त सुरक्षा नियमों के तहत केवल आपके खाते और अधिकृत एडमिन तक ही सीमित रहते हैं।'}
                </p>

                <div className="border-t border-[#DCD4C6] divide-y divide-[#DCD4C6]">
                  <div className="py-4 flex items-start gap-3">
                    <Lock className="w-4 h-4 text-[#FF5C35] shrink-0 mt-1" />
                    <div>
                      <h3 className="text-sm font-bold text-[#101014]">
                        {lang === 'en'
                          ? 'Strict Per-Customer File Isolation'
                          : 'केवल स्वयं के ऑर्डर और फ़ाइलों तक पहुँच'}
                      </h3>
                      <p className="text-xs text-[#4A463E] mt-0.5 leading-relaxed">
                        {lang === 'en'
                          ? 'Customers can only read or download files linked to their own authenticated account.'
                          : 'कोई भी अन्य उपयोगकर्ता आपके द्वारा अपलोड किए गए दस्तावेज़ नहीं देख सकता।'}
                      </p>
                    </div>
                  </div>

                  <div className="py-4 flex items-start gap-3">
                    <Shield className="w-4 h-4 text-[#FF5C35] shrink-0 mt-1" />
                    <div>
                      <h3 className="text-sm font-bold text-[#101014]">
                        {lang === 'en'
                          ? 'Zero Passwords, PINs, or OTP Storage'
                          : 'बैंक पासवर्ड, पिन या OTP कभी नहीं मांगा जाता'}
                      </h3>
                      <p className="text-xs text-[#4A463E] mt-0.5 leading-relaxed">
                        {lang === 'en'
                          ? 'We never ask for or store banking passwords, UPI PINs, or sensitive OTPs.'
                          : 'हम कभी भी आपका बैंक पासवर्ड, UPI पिन या संवेदनशील OTP संग्रहीत नहीं करते हैं।'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('privacy')}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#101014] hover:bg-[#FF5C35] text-white text-xs font-mono-tabular uppercase tracking-wider font-bold transition-colors"
                  >
                    {lang === 'en' ? 'Read Privacy Policy' : 'गोपनीयता नीति पढ़ें'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('contact')}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#101014]/30 text-[#101014] hover:bg-[#EFE9DC] text-xs font-mono-tabular uppercase tracking-wider font-bold transition-colors"
                  >
                    {lang === 'en' ? 'Contact Center Desk' : 'सहायता केंद्र संपर्क'}
                  </button>
                </div>
              </div>

              {/* Right 7 Columns: Smooth Animated Glassmorphic FAQ Accordion */}
              <div className="lg:col-span-7 rounded-3xl glass-cream-panel p-6 sm:p-8 space-y-6">
                <div className="flex items-baseline justify-between border-b border-[#DCD4C6] pb-3">
                  <div>
                    <div className="font-mono-tabular text-xs font-bold uppercase tracking-[0.2em] text-[#C83713]">
                      {lang === 'en'
                        ? '05. FREQUENT INQUIRIES (FAQ)'
                        : '05. सामान्य प्रश्नोत्तरी (FAQ)'}
                    </div>
                    <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#101014] mt-1">
                      {lang === 'en'
                        ? 'Operational Questions & Answers'
                        : 'अक्सर पूछे जाने वाले प्रश्न (FAQ)'}
                    </h2>
                  </div>
                </div>

                <div className="space-y-3" data-testid="faq-accordion-list">
                  {[
                    {
                      num: '01.',
                      qEn: 'How do I submit documents from my phone in Kateya?',
                      qHi: 'मैं कटेया में अपने मोबाइल से दस्तावेज़ कैसे भेजूं?',
                      aEn: 'Select any service above and open the Order Form. You will see one dedicated upload button for each required document (PDF, JPG, PNG, or DOCX up to 2 MB).',
                      aHi: 'कोई भी सेवा चुनें और "आवेदन शुरू करें" पर क्लिक करें। आपको प्रत्येक आवश्यक दस्तावेज़ के लिए अलग अपलोड बटन मिलेगा जहाँ आप साफ फोटो या PDF जोड़ सकते हैं।',
                    },
                    {
                      num: '02.',
                      qEn: 'Does uploading a payment screenshot mark my order as paid?',
                      qHi: 'क्या भुगतान का स्क्रीनशॉट अपलोड करने से भुगतान तुरंत सफल मान लिया जाता है?',
                      aEn: 'No. For security, submitting a 12-digit UPI UTR or receipt sets your payment status to "Pending Verification". Only an authorized administrator can mark it "Verified" after checking the bank statement.',
                      aHi: 'नहीं। सुरक्षा नियमों के अनुसार, UTR या स्क्रीनशॉट भेजने पर भुगतान "सत्यापन लंबित" रहता है। एडमिन द्वारा बैंक स्टेटमेंट की जांच के बाद ही इसे सत्यापित किया जाता है।',
                    },
                    {
                      num: '03.',
                      qEn: 'Where do I download my completed resume, biodata, or PDF?',
                      qHi: 'मेरा तैयार रिज़्यूमे, बायोडाटा या फॉर्म रसीद कहाँ से डाउनलोड होगा?',
                      aEn: 'Open Track Order or Customer Portal, select your Order ID, and click "Download PDF" inside the Completed Deliverables section.',
                      aHi: '"ऑर्डर ट्रैक करें" या "ग्राहक पोर्टल" में जाकर अपना ऑर्डर नंबर चुनें और सीधे तैयार PDF डाउनलोड करें।',
                    },
                    {
                      num: '04.',
                      qEn: 'What if the center needs an extra certificate or correction?',
                      qHi: 'यदि फॉर्म भरते समय किसी अतिरिक्त जानकारी की आवश्यकता हो तो क्या होगा?',
                      aEn: 'The administrator will set your order status to "Needs Customer Information" with a specific note. You can reply directly inside the Track Order screen.',
                      aHi: 'एडमिन आपके ऑर्डर की स्थिति को "अतिरिक्त जानकारी आवश्यक" पर अपडेट करेंगे और आप सीधे ऑर्डर ट्रैकिंग पेज से अपना उत्तर भेज सकेंगे।',
                    },
                  ].map((faq, idx) => {
                    const isOpen = openFaqIndex === idx;
                    return (
                      <div
                        key={faq.num}
                        className={`rounded-2xl border transition-all duration-300 ${
                          isOpen
                            ? 'bg-white border-[#FF5C35] shadow-[0_12px_28px_-10px_rgba(255,92,53,0.18)]'
                            : 'bg-[#FFFDF9]/80 border-[#DCD4C6] hover:border-[#FF5C35]/50'
                        }`}
                      >
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          data-testid={`faq-toggle-${idx}`}
                          onClick={() =>
                            setOpenFaqIndex((prev) =>
                              prev === idx ? null : idx
                            )
                          }
                          className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-display text-base sm:text-lg font-bold text-[#101014]"
                        >
                          <span className="flex items-baseline gap-3">
                            <span className="font-mono-tabular text-xs font-bold text-[#C83713]">
                              {faq.num}
                            </span>
                            <span>{lang === 'en' ? faq.qEn : faq.qHi}</span>
                          </span>
                          <span
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                              isOpen
                                ? 'bg-[#FF5C35] text-white rotate-180'
                                : 'bg-[#F7F3EA] text-[#101014] border border-[#DCD4C6]'
                            }`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </span>
                        </button>
                        <div
                          className={`grid transition-all duration-300 ease-in-out ${
                            isOpen
                              ? 'grid-rows-[1fr] opacity-100'
                              : 'grid-rows-[0fr] opacity-0'
                          }`}
                        >
                          <div className="overflow-hidden">
                            <p className="px-4 sm:px-5 pb-4 sm:pb-5 pl-11 sm:pl-12 text-xs sm:text-sm text-[#4A463E] leading-relaxed border-t border-[#DCD4C6]/60 pt-3">
                              {lang === 'en' ? faq.aEn : faq.aHi}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

