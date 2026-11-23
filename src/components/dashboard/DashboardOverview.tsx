import { ArrowRight, ExternalLink, Video, X } from 'lucide-react';
import { useState } from 'react';
import {
  buildAnalyticsOverviewSeries,
  buildCourseProgressSummary,
  buildFuturisticKpiCards,
  buildLiveSpotlight,
  buildRecentActivityFeed,
  buildTopStudents,
  buildUpcomingClassRows,
  type DashboardSourceData,
  type FuturisticKpiCard,
  type LiveSpotlightItem,
  type OverviewRange,
} from '../../lib/dashboardAnalytics';
import { DEFAULT_DASHBOARD_CONFIG, normalizeDashboardConfig, type PortalSection } from '../../lib/domain';
import type { AuditLogEntry, DashboardCustomizationConfig } from '../../types';
import {
  AnalyticsOverviewCard,
  CourseProgressCard,
  FuturisticKpiGrid,
  LiveClassSpotlightCard,
} from './DashboardCharts';
import type { OverviewSubView, SidebarSubIntent } from './DashboardSidebar';
import {
  QuickActionsCard,
  RecentActivitiesCard,
  TopStudentsProgressCard,
  UpcomingClassesCard,
  type QuickActionType,
} from './DashboardWidgets';
import { SystemActivityLogsPanel } from './SystemActivityLogsPanel';

interface DashboardOverviewProps {
  data: DashboardSourceData;
  viewerName?: string;
  auditLogs?: AuditLogEntry[];
  searchQuery: string;
  overviewSubView: OverviewSubView;
  lang: 'en' | 'bn';
  darkMode?: boolean;
  canCustomize?: boolean;
  dashboardConfig?: DashboardCustomizationConfig;
  onSelectSection: (section: PortalSection, intent?: SidebarSubIntent) => void;
  onQuickAction: (action: QuickActionType) => void;
  onNavigate: (path: string) => void;
}

export function DashboardOverview({
  data,
  viewerName,
  auditLogs = [],
  searchQuery,
  lang,
  darkMode = false,
  canCustomize = false,
  dashboardConfig = DEFAULT_DASHBOARD_CONFIG,
  onSelectSection,
  onQuickAction,
  onNavigate,
}: DashboardOverviewProps) {
  const [range, setRange] = useState<OverviewRange>('Last 6 Months');
  const [liveModal, setLiveModal] = useState<LiveSpotlightItem | null>(null);

  const cfg = normalizeDashboardConfig(dashboardConfig);
  const kpiCards = buildFuturisticKpiCards(data);
  const analyticsOverview = buildAnalyticsOverviewSeries(data, range);
  const courseProgress = buildCourseProgressSummary(data);
  const liveSpotlight = buildLiveSpotlight(data);
  const recentActivities = buildRecentActivityFeed(data, searchQuery);
  const upcomingClasses = buildUpcomingClassRows(data, searchQuery);
  const topStudents = buildTopStudents(data);

  const handleKpiClick = (id: FuturisticKpiCard['id']) => {
    if (id === 'students') {
      onSelectSection(data.role === 'student' ? 'my_learning' : 'enrollments');
    } else if (id === 'teachers') {
      onSelectSection(data.role === 'admin' ? 'users' : 'courses');
    } else if (id === 'courses') {
      onSelectSection('courses', 'courses');
    } else if (id === 'batches') {
      onSelectSection('courses', 'batches');
    }
  };

  return (
    <div className="space-y-5">
      {/* ROW 0: FUTURISTIC WELCOME HERO BANNER */}
      {cfg.widgets.heroBanner && (
        <div
          style={{
            backgroundImage: `linear-gradient(to right, ${cfg.colors.heroStart}, ${cfg.colors.heroMid}, ${cfg.colors.heroEnd})`,
          }}
          className="relative overflow-hidden rounded-3xl p-5 text-white shadow-xl sm:px-7 sm:py-5"
        >
          {/* Glowing electric ribbon */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-cyan-300/25 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-28 w-72 rounded-full bg-blue-400/20 blur-2xl" />

          {/* Right Campus Building Silhouette */}
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-72 overflow-hidden lg:block">
            <img
              src={cfg.images.heroBannerBgUrl}
              alt="Campus Banner Backdrop"
              className="h-full w-full object-cover opacity-75"
              referrerPolicy="no-referrer"
            />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `linear-gradient(to right, ${cfg.colors.heroEnd}, ${cfg.colors.heroEnd}88, transparent)`,
              }}
            />
          </div>

          <div className="relative flex flex-col items-center justify-between gap-5 lg:flex-row">
            {/* Left Student Portrait + Hero Copy */}
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-cyan-300/70 bg-blue-900 shadow-lg sm:h-28 sm:w-28">
                <img
                  src={cfg.images.heroAvatarUrl}
                  alt="Dashboard Welcome Avatar"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  {data.role !== 'admin' && cfg.heroTitle === DEFAULT_DASHBOARD_CONFIG.heroTitle
                    ? `Welcome Back, ${viewerName?.split(' ')[0] || 'Member'}!`
                    : cfg.heroTitle}
                </h1>
                <p className="mt-0.5 text-sm font-bold text-cyan-100">{cfg.heroSubtitle}</p>
                <p className="mt-1 text-xs italic text-blue-100/90">{cfg.heroQuote}</p>
                <button
                  type="button"
                  onClick={() =>
                    onSelectSection(
                      data.role === 'teacher'
                        ? 'enrollments'
                        : data.role === 'student'
                          ? 'my_learning'
                          : data.role === 'guardian'
                            ? 'guardian_monitor'
                            : cfg.heroCtaSection
                    )
                  }
                  style={{
                    backgroundColor: cfg.colors.heroButtonBg,
                    color: cfg.colors.heroButtonText,
                  }}
                  className="mt-3.5 inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-extrabold shadow-md transition-transform hover:-translate-y-0.5 hover:opacity-95"
                >
                  <span>
                    {data.role === 'teacher'
                      ? 'Open Student Roster'
                      : data.role === 'student'
                        ? 'My Learning Hub'
                        : cfg.heroCtaLabel}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Right Golden Motto Callout */}
            <div className="relative hidden pr-44 text-right lg:block">
              <p
                style={{ color: cfg.colors.heroMottoColor }}
                className="text-xl font-extrabold italic leading-snug drop-shadow-xs"
              >
                &ldquo;{cfg.heroMottoTop}
                <br />
                {cfg.heroMottoBottom}&rdquo;
              </p>
              <div
                className="mt-1.5 ml-auto h-1 w-28 rounded-full"
                style={{
                  backgroundImage: `linear-gradient(to right, ${cfg.colors.heroMottoColor}, #67E8F9)`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ROW 1: 4 VIVID GRADIENT KPI CARDS */}
      {cfg.widgets.kpiRow && (
        <FuturisticKpiGrid
          items={kpiCards}
          lang={lang}
          colors={cfg.colors}
          kpiLabels={cfg.kpiLabels}
          onCardClick={handleKpiClick}
        />
      )}

      {/* ROW 2: ANALYTICS OVERVIEW + COURSE PROGRESS DONUT + LIVE CLASS NOW */}
      {(cfg.widgets.analyticsOverview || cfg.widgets.courseProgress || cfg.widgets.liveClassNow) && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {cfg.widgets.analyticsOverview && (
            <div className="lg:col-span-5">
              <AnalyticsOverviewCard
                overview={analyticsOverview}
                range={range}
                onRangeChange={setRange}
                colors={cfg.colors}
                darkMode={darkMode}
              />
            </div>
          )}

          {cfg.widgets.courseProgress && (
            <div className="lg:col-span-4">
              <CourseProgressCard
                progress={courseProgress}
                colors={cfg.colors}
                darkMode={darkMode}
                onViewDetails={() =>
                  onSelectSection(data.role === 'student' ? 'my_learning' : 'enrollments')
                }
              />
            </div>
          )}

          {cfg.widgets.liveClassNow && (
            <div className="lg:col-span-3">
              <LiveClassSpotlightCard
                spotlight={liveSpotlight}
                colors={cfg.colors}
                bannerOverride={cfg.images.liveClassBannerUrl}
                onJoinClass={(item) => setLiveModal(item)}
              />
            </div>
          )}
        </div>
      )}

      {/* ROW 3: RECENT ACTIVITIES + UPCOMING CLASSES + TOP STUDENTS + QUICK ACTIONS */}
      {(cfg.widgets.recentActivities ||
        cfg.widgets.upcomingClasses ||
        cfg.widgets.topStudents ||
        cfg.widgets.quickActions) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
          {cfg.widgets.recentActivities && (
            <div className="xl:col-span-3">
              <RecentActivitiesCard
                items={recentActivities}
                darkMode={darkMode}
                onViewAll={() =>
                  onSelectSection(data.role === 'admin' ? 'attendance_finance' : 'enrollments')
                }
              />
            </div>
          )}

          {cfg.widgets.upcomingClasses && (
            <div className="xl:col-span-3">
              <UpcomingClassesCard
                rows={upcomingClasses}
                darkMode={darkMode}
                onViewCalendar={() => onSelectSection('lessons')}
              />
            </div>
          )}

          {cfg.widgets.topStudents && (
            <div className="xl:col-span-3">
              <TopStudentsProgressCard
                students={topStudents}
                darkMode={darkMode}
                onViewAll={() =>
                  onSelectSection(data.role === 'student' ? 'my_learning' : 'enrollments')
                }
              />
            </div>
          )}

          {cfg.widgets.quickActions && (
            <div className="xl:col-span-3">
              <QuickActionsCard
                onTrigger={onQuickAction}
                canCustomize={canCustomize}
                darkMode={darkMode}
              />
            </div>
          )}
        </div>
      )}

      {/* ROW 4: ADMIN REAL-TIME SYSTEM ACTIVITY LOGS */}
      {data.role === 'admin' && cfg.widgets.systemActivityLogs !== false && (
        <SystemActivityLogsPanel
          compact
          darkMode={darkMode}
          initialLogs={auditLogs}
          onOpenFullView={() => onSelectSection('activity_logs')}
        />
      )}

      {/* Live Classroom Launch Modal */}
      {liveModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Live Class Classroom"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={liveModal.bannerImage}
                  alt={liveModal.title}
                  referrerPolicy="no-referrer"
                  className="h-12 w-16 rounded-xl object-cover"
                />
                <div>
                  <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-rose-700">
                    Live Classroom Ready
                  </span>
                  <h3 className="mt-1 text-base font-extrabold">{liveModal.title}</h3>
                  <p className="text-xs text-slate-500">
                    {liveModal.instructorName} · {liveModal.timeRange}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLiveModal(null)}
                aria-label="Close live classroom modal"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-600">
              Launch the interactive Alom&apos;s English Center live stream &amp; lesson player, or manage your batch lessons and live links directly.
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setLiveModal(null);
                  onNavigate('/learn');
                }}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700"
              >
                <Video className="h-4 w-4" />
                <span>Enter Live Class</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLiveModal(null);
                  onSelectSection('lessons');
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Manage Lessons</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
