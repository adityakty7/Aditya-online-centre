import React from 'react';
import { DigitalService, Language } from '../types';
import {
  EXAM_RADAR_CATEGORY_PILLS,
  ExamRadarCategoryKey,
  ExamRadarItemConfig,
  calculateExamDaysLeft,
  filterExamRadarItems,
} from '../utils/rules';
import {
  Radio,
  Calendar,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileCheck2,
  IndianRupee,
} from 'lucide-react';

interface ExamRadarSectionProps {
  lang: Language;
  items: ExamRadarItemConfig[];
  services: DigitalService[];
  onBookSlot: (service: DigitalService) => void;
}

export const ExamRadarSection: React.FC<ExamRadarSectionProps> = ({
  lang,
  items,
  services,
  onBookSlot,
}) => {
  const [selectedCat, setSelectedCat] =
    React.useState<ExamRadarCategoryKey>('all');

  const filteredItems = React.useMemo(() => {
    return filterExamRadarItems(items, selectedCat);
  }, [items, selectedCat]);

  const handleBookExamSlot = (item: ExamRadarItemConfig) => {
    const matched =
      services.find((s) => s.id === item.linkedServiceId) ||
      services.find((s) => s.category === 'govt_job_assistance') ||
      services[0];
    if (matched) {
      onBookSlot(matched);
    }
  };

  return (
    <section
      id="bihar-exam-radar-section"
      data-testid="bihar-exam-radar-section"
      className="editorial-dark-grid text-[#F7F3EA] border-t border-b border-white/15 py-12 sm:py-20 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-8">
        {/* Live Glowing Portal Ticker Bar */}
        <div
          data-testid="exam-radar-live-ticker"
          className="rounded-2xl bg-[#10131C]/90 border border-[#FF5C35]/45 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_0_28px_rgba(255,92,53,0.22)]"
        >
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <Radio className="w-4 h-4 text-[#FF5C35]" />
            <span className="font-mono-tabular text-xs font-extrabold uppercase tracking-wider text-[#FFB547]">
              {lang === 'en'
                ? 'LIVE BIHAR & CENTRAL PORTAL RADAR'
                : 'लाइव बिहार एवं केंद्रीय पोर्टल अलर्ट'}
            </span>
          </div>

          <div className="text-xs sm:text-sm text-[#EAE5DA] font-medium truncate">
            {lang === 'en'
              ? 'Active Portals: Bihar Post-Matric Scholarship · Bihar Police / BSSC / SSC GD · Bihar Board (BSEB) 11th/12th · Service Plus RTPS'
              : 'सक्रिय फॉर्म: बिहार पोस्ट-मैट्रिक छात्रवृत्ति · बिहार पुलिस / BSSC / SSC · बिहार बोर्ड 11वीं/12वीं · RTPS जाति/आय/निवास'}
          </div>
        </div>

        {/* Section Heading & Category Filter Pills */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/15 pb-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF5C35]/15 border border-[#FF5C35]/40 font-mono-tabular text-xs font-bold uppercase tracking-[0.16em] text-[#FFB547]">
              <Sparkles className="w-3.5 h-3.5 text-[#FF5C35]" />
              <span>
                {lang === 'en'
                  ? '01.B · LIVE BIHAR EXAM, SCHOLARSHIP & JOB FORM RADAR'
                  : '01.B · लाइव बिहार परीक्षा, छात्रवृत्ति एवं नौकरी फॉर्म रडार'}
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-[1.06]">
              {lang === 'en'
                ? 'Active Deadlines, Required Documents & Instant Slot Booking'
                : 'सक्रिय फॉर्म की अंतिम तिथि, आवश्यक दस्तावेज़ और तुरंत स्लॉट बुकिंग'}
            </h2>
          </div>

          {/* Filter Pills */}
          <div
            role="tablist"
            aria-label={
              lang === 'en' ? 'Exam Radar Categories' : 'फॉर्म रडार श्रेणियां'
            }
            className="flex flex-wrap items-center gap-2"
          >
            {EXAM_RADAR_CATEGORY_PILLS.map((pill) => {
              const isSelected = selectedCat === pill.key;
              return (
                <button
                  key={pill.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  data-testid={`exam-radar-filter-${pill.key}`}
                  onClick={() => setSelectedCat(pill.key)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#FF5C35] to-[#E54922] text-white border-[#FFB547]/60 shadow-[0_4px_16px_rgba(255,92,53,0.4)]'
                      : 'bg-white/[0.06] text-[#D8D3C8] border-white/15 hover:text-white hover:border-white/30'
                  }`}
                >
                  {lang === 'en' ? pill.labelEn : pill.labelHi}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filterable Radar Card Grid */}
        <div
          data-testid="exam-radar-card-grid"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {filteredItems.map((item) => {
            const countdown = calculateExamDaysLeft(
              item.lastDate,
              new Date(),
              item.isRolling
            );
            const docs =
              lang === 'en' ? item.requiredDocsEn : item.requiredDocsHi;

            return (
              <article
                key={item.id}
                data-testid={`exam-radar-card-${item.id}`}
                className="rounded-3xl glass-obsidian-panel p-6 sm:p-7 flex flex-col justify-between gap-5 border border-white/15 hover:border-[#FF5C35]/60 transition-all editorial-lift"
              >
                <div className="space-y-4">
                  {/* Top Row: Portal Badge + Live Countdown Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-white/[0.08] border border-white/15 font-mono-tabular text-[11px] font-bold uppercase tracking-wider text-[#FFB547]">
                      {lang === 'en' ? item.portalBadgeEn : item.portalBadgeHi}
                    </span>

                    <span
                      data-testid={`exam-radar-countdown-${item.id}`}
                      className={`px-3 py-1 rounded-full font-mono-tabular text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                        countdown.status === 'closing_soon'
                          ? 'bg-red-500/20 border border-red-400/50 text-red-300'
                          : countdown.status === 'open_rolling'
                          ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300'
                          : 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'en' ? countdown.badgeEn : countdown.badgeHi}
                      </span>
                    </span>
                  </div>

                  {/* Form Title */}
                  <h3 className="font-display text-lg sm:text-xl font-extrabold text-white leading-snug">
                    {lang === 'en' ? item.titleEn : item.titleHi}
                  </h3>

                  {/* Official Start Date, Last Date & Center Assistance Fee */}
                  <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-black/45 border border-white/10 font-mono-tabular text-xs">
                    <div>
                      <div className="text-[10px] uppercase text-[#A09D96]">
                        {lang === 'en' ? 'START DATE' : 'प्रारंभ तिथि'}
                      </div>
                      <div className="text-white font-bold mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{item.startDate}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase text-[#A09D96]">
                        {lang === 'en' ? 'LAST DATE' : 'अंतिम तिथि'}
                      </div>
                      <div className="text-[#FFB547] font-bold mt-0.5">
                        {item.isRolling
                          ? lang === 'en'
                            ? 'Open 24×7'
                            : 'सदैव चालू'
                          : item.lastDate}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase text-[#A09D96]">
                        {lang === 'en' ? 'CENTER FEE' : 'सहायता शुल्क'}
                      </div>
                      <div className="text-emerald-400 font-extrabold mt-0.5 flex items-center">
                        <IndianRupee className="w-3 h-3" />
                        <span>{item.feeInr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Required Documents List */}
                  <div className="space-y-2">
                    <div className="font-mono-tabular text-[11px] uppercase tracking-wider text-[#D8D3C8] flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5 text-[#FF5C35]" />
                      <span>
                        {lang === 'en'
                          ? 'Required Documents Checklist:'
                          : 'आवश्यक दस्तावेज़ सूची:'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {docs.map((docLabel, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] border border-white/12 text-xs text-[#EAE5DA]"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{docLabel}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Book Slot Now CTA */}
                <button
                  type="button"
                  data-testid={`exam-radar-book-${item.id}`}
                  onClick={() => handleBookExamSlot(item)}
                  className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF5C35] via-[#E54922] to-[#C83713] hover:from-[#FF6B47] hover:to-[#FF5C35] text-white font-bold text-xs sm:text-sm shadow-[0_6px_20px_rgba(255,92,53,0.35)] transition-all flex items-center justify-center gap-2"
                >
                  <span>
                    {lang === 'en'
                      ? `Book Slot Now (₹${item.feeInr}) →`
                      : `अभी स्लॉट बुक करें (₹${item.feeInr}) →`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
