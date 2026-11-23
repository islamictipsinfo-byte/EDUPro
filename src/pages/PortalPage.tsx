import {
  Activity,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Award,
  BookOpen,
  Bot,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Flame,
  GraduationCap,
  Heart,
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Package,
  Pencil,
  Play,
  Plus,
  Power,
  Radio,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Tag,
  Trash2,
  UserCheck,
  Users,
  Video,
  Wallet,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AdminBatchModal } from '../components/AdminBatchModal';
import { AdminCourseModal } from '../components/AdminCourseModal';
import { AdminLessonModal } from '../components/AdminLessonModal';
import { DashboardCustomizerModal } from '../components/dashboard/DashboardCustomizerModal';
import { DashboardOverview } from '../components/dashboard/DashboardOverview';
import {
  DashboardSidebar,
  type OverviewSubView,
  type SidebarSubIntent,
} from '../components/dashboard/DashboardSidebar';
import { DashboardTopbar } from '../components/dashboard/DashboardTopbar';
import { type QuickActionType } from '../components/dashboard/DashboardWidgets';
import { EnrollmentsFeePanel } from '../components/dashboard/EnrollmentsFeePanel';
import { SystemActivityLogsPanel } from '../components/dashboard/SystemActivityLogsPanel';
import { HomepageCmsStudio } from '../components/HomepageCmsStudio';
import { PaymentSystemPanel } from '../components/PaymentSystemPanel';
import {
  AiEcosystemSecurityPanel,
  AttendanceFinancePanel,
  CatalogContentPanel,
  ExamBankPanel,
  SecurityBackupPanel,
} from '../components/PortalOpsStudio';
import { ScormPlayerModal } from '../components/ScormPlayerModal';
import { useAuth } from '../context/AuthContext';
import {
  calculateDiscountedPrice,
  calculateStudentProgress,
  computeBatchSeatUsage,
  DEFAULT_DASHBOARD_CONFIG,
  filterLessonsByTypeAndBatch,
  getAllowedPortalSections,
  normalizeDashboardConfig,
  type PortalSection,
} from '../lib/domain';
import type {
  ApiPlugin,
  AttendanceRecord,
  AuditLogEntry,
  Branch,
  BroadcastCampaign,
  CategoryItem,
  CommunityPost,
  Coupon,
  Course,
  CourseBatch,
  CourseLesson,
  DashboardCustomizationConfig,
  Ebook,
  Enrollment,
  Exam,
  ExamAttempt,
  FinancialRecord,
  Instructor,
  LearnerRewardProfile,
  LessonType,
  LiveClassStatus,
  Order,
  PaymentGatewayConfig,
  PaymentTransaction,
  PayrollRecord,
  Product,
  QuestionBankItem,
  Review,
  ScormPackage,
  SiteSettings,
  User,
  UserRole,
  WebhookConfig,
} from '../types';

interface PortalPageProps {
  navigate: (path: string) => void;
}

interface GuardianChildData {
  student: User;
  enrollments: Enrollment[];
  examAttempts: ExamAttempt[];
  lessonsCountByCourse: Record<string, number>;
}

interface PortalPayload {
  role: UserRole;
  branch?: Branch;
  metrics: Record<string, number>;
  courses?: Course[];
  batches?: CourseBatch[];
  lessons?: CourseLesson[];
  exams?: Exam[];
  examAttempts?: ExamAttempt[];
  branches?: Branch[];
  users?: User[];
  enrollments?: Enrollment[];
  orders?: Order[];
  reviews?: Review[];
  settings?: SiteSettings;
  children?: GuardianChildData[];
  questionBank?: QuestionBankItem[];
  categories?: CategoryItem[];
  posts?: CommunityPost[];
  scormPackages?: ScormPackage[];
  attendance?: AttendanceRecord[];
  payrolls?: PayrollRecord[];
  financialRecords?: FinancialRecord[];
  paymentGateways?: PaymentGatewayConfig[];
  transactions?: PaymentTransaction[];
  coupons?: Coupon[];
  campaigns?: BroadcastCampaign[];
  plugins?: ApiPlugin[];
  webhooks?: WebhookConfig[];
  instructors?: Instructor[];
  products?: Product[];
  ebooks?: Ebook[];
  rewards?: LearnerRewardProfile | null;
  auditLogs?: AuditLogEntry[];
}

const SECTION_META: Record<PortalSection, { label: string; icon: typeof LayoutDashboard }> = {
  overview: { label: 'Overview', icon: LayoutDashboard },
  courses: { label: 'Courses & Batches', icon: BookOpen },
  lessons: { label: 'Video Lessons', icon: Video },
  homepage_cms: { label: 'Homepage Studio', icon: LayoutTemplate },
  catalog_cms: { label: 'Catalog, Posts & Coupons', icon: Tag },
  exams: { label: 'Exams & Question Bank', icon: ClipboardList },
  payments: { label: 'Payments & Gateways', icon: CreditCard },
  attendance_finance: { label: 'Attendance, Payroll & P&L', icon: Wallet },
  enrollments: { label: 'Enrollments & Fees', icon: UserCheck },
  branches: { label: 'Branches', icon: Building2 },
  users: { label: 'Users & Roles', icon: Users },
  orders: { label: 'Shop Orders', icon: Package },
  ai_ecosystem: { label: 'AI, SCORM & Security', icon: Bot },
  activity_logs: { label: 'System Activity Logs', icon: Activity },
  guardian_monitor: { label: 'Child Progress', icon: GraduationCap },
  my_learning: { label: 'My Courses & Rewards', icon: BookOpen },
  settings: { label: 'Settings, Backups & Export', icon: Settings },
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  branch_manager: 'Branch Manager',
  teacher: 'Instructor',
  student: 'Student',
  guardian: 'Guardian',
};

const QUICK_DEMO_ACCOUNTS: { role: string; email: string; desc: string }[] = [
  { role: 'Admin', email: 'admin@alomsenglish.com', desc: 'Full LMS & CMS Console' },
  { role: 'Branch Manager', email: 'manager@alomsenglish.com', desc: 'Campus & Fee Ops' },
  { role: 'Teacher', email: 'teacher@alomsenglish.com', desc: 'Classes, Exams & Live' },
  { role: 'Student', email: 'student@alomsenglish.com', desc: 'Courses, SCORM & XP' },
  { role: 'Guardian', email: 'guardian@alomsenglish.com', desc: 'Child Progress Monitor' },
];

export function PortalPage({ navigate }: PortalPageProps) {
  const { user, bootstrap, login, logout, apiFetch, refreshBootstrap } = useAuth();
  const [data, setData] = useState<PortalPayload | null>(null);
  const [activeSection, setActiveSection] = useState<PortalSection>('overview');
  const [activeSidebarIntent, setActiveSidebarIntent] = useState<SidebarSubIntent>(undefined);
  const [overviewSubView, setOverviewSubView] = useState<OverviewSubView>('lms');
  const [dashboardConfig, setDashboardConfig] = useState<DashboardCustomizationConfig>(
    () => normalizeDashboardConfig(bootstrap?.settings?.dashboardConfig ?? DEFAULT_DASHBOARD_CONFIG)
  );
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => (bootstrap?.settings?.dashboardConfig?.themeMode ?? 'futuristic_light') === 'midnight_dark'
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [dashLang, setDashLang] = useState<'en' | 'bn'>('en');
  const [quickSigningEmail, setQuickSigningEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Admin / Teacher: Advanced Course & Batch Studio state
  const [courseSubTab, setCourseSubTab] = useState<'courses' | 'batches'>('courses');
  const [catalogInitialTab, setCatalogInitialTab] = useState<
    'ebooks' | 'products' | 'instructors' | 'categories' | 'posts' | 'coupons'
  >('ebooks');
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseSearch, setCourseSearch] = useState('');
  const [courseStatusFilter, setCourseStatusFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [courseCatFilter, setCourseCatFilter] = useState<string>('all');
  const [confirmCourseDeleteId, setConfirmCourseDeleteId] = useState<string | null>(null);

  // Batch Studio state
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<CourseBatch | null>(null);
  const [batchCourseFilter, setBatchCourseFilter] = useState<string>('all');
  const [batchSearch, setBatchSearch] = useState('');
  const [confirmBatchDeleteId, setConfirmBatchDeleteId] = useState<string | null>(null);

  // Teacher / Admin: Lecture, Live Class & Recorded Video Studio state
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const [lessonCourseFilter, setLessonCourseFilter] = useState<string>('all');
  const [lessonBatchFilter, setLessonBatchFilter] = useState<string>('all');
  const [lessonTypeFilter, setLessonTypeFilter] = useState<'all' | LessonType>('all');
  const [lessonSearch, setLessonSearch] = useState('');
  const [confirmLessonDeleteId, setConfirmLessonDeleteId] = useState<string | null>(null);

  // Teacher/Admin: New Exam form
  const [examTitle, setExamTitle] = useState('');
  const [examCategory, setExamCategory] = useState('HSC English');
  const [examQPrompt, setExamQPrompt] = useState('');
  const [examOptA, setExamOptA] = useState('');
  const [examOptB, setExamOptB] = useState('');
  const [examOptC, setExamOptC] = useState('');
  const [examOptD, setExamOptD] = useState('');
  const [examCorrect, setExamCorrect] = useState(0);

  // Admin: Branch Create / Edit / Delete state
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [brName, setBrName] = useState('');
  const [brCode, setBrCode] = useState('');
  const [brCity, setBrCity] = useState('');
  const [brAddress, setBrAddress] = useState('');
  const [brPhone, setBrPhone] = useState('');
  const [brManager, setBrManager] = useState('');
  const [brStudents, setBrStudents] = useState('0');
  const [brStatus, setBrStatus] = useState<'active' | 'inactive'>('active');
  const [brError, setBrError] = useState<string | null>(null);
  const [confirmBranchDeleteId, setConfirmBranchDeleteId] = useState<string | null>(null);

  // Admin: New User form
  const [uName, setUName] = useState('');
  const [uEmail, setUEmail] = useState('');
  const [uPhone, setUPhone] = useState('');
  const [uRole, setURole] = useState<UserRole>('teacher');
  const [uBranchId, setUBranchId] = useState('br-mirpur');

  // Admin: Settings & Menu shortcut state
  const [setPhone, setSetPhone] = useState('');
  const [setEmail, setSetEmail] = useState('');
  const [setAddress, setSetAddress] = useState('');
  const [activeStudentScorm, setActiveStudentScorm] = useState<ScormPackage | null>(null);
  const [confirmExamDeleteId, setConfirmExamDeleteId] = useState<string | null>(null);
  const [cmsInitialTab, setCmsInitialTab] = useState<'slides' | 'highlights' | 'stats' | 'reviews' | 'branding'>('slides');

  const loadPortal = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await apiFetch<PortalPayload>('/api/portal/overview');
      setData(res);
      if (res.settings) {
        setSetPhone(res.settings.phone);
        setSetEmail(res.settings.email);
        setSetAddress(res.settings.address);
        if (res.settings.dashboardConfig) {
          const normalized = normalizeDashboardConfig(res.settings.dashboardConfig);
          setDashboardConfig(normalized);
          setDarkMode(normalized.themeMode === 'midnight_dark');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user, apiFetch]);

  useEffect(() => {
    void loadPortal();
  }, [loadPortal]);

  if (!user) {
    return (
      <div className="dark flex min-h-screen items-center justify-center bg-[#19212B] px-4 py-12 text-slate-100">
        <div className="w-full max-w-lg rounded-2xl border border-[#2F3B4D] bg-[#232D3B] p-8 shadow-2xl">
          <div className="flex items-center justify-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#1FA894] text-white">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-white">
              EduDash · Aloms EDUPro
            </span>
          </div>
          <h1 className="mt-5 text-center text-2xl font-extrabold text-white">
            Sign In to LMS Dashboard
          </h1>
          <p className="mt-1.5 text-center text-xs text-slate-400">
            Launch instantly with a role demo account or sign in with your credentials.
          </p>

          <div className="mt-6 space-y-2">
            {QUICK_DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                disabled={quickSigningEmail !== null}
                onClick={async () => {
                  setQuickSigningEmail(acc.email);
                  await login(acc.email, 'Aloms@2026');
                  setQuickSigningEmail(null);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-[#2F3B4D] bg-[#1E2632] px-4 py-3 text-left transition-colors hover:border-[#1FA894] disabled:opacity-60"
              >
                <div>
                  <p className="text-xs font-bold text-white">
                    {quickSigningEmail === acc.email ? `Signing in as ${acc.role}...` : `Enter as ${acc.role}`}
                  </p>
                  <p className="text-[11px] text-slate-400">{acc.desc}</p>
                </div>
                <span className="rounded-lg bg-[#1FA894] px-3 py-1 text-[11px] font-bold text-white">
                  Launch
                </span>
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#2F3B4D] pt-5">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-xl border border-[#344155] px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-[#2C3748]"
            >
              Back to Website
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-slate-900 hover:bg-slate-200"
            >
              <Shield className="h-3.5 w-3.5 text-[#1FA894]" />
              <span>Full Login Page</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const allowedSections = getAllowedPortalSections(user.role);
  const currentSection = allowedSections.includes(activeSection)
    ? activeSection
    : allowedSections[0];

  const notify = (msg: string) => {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(null), 4000);
  };

  const handleToggleCourseStatus = async (course: Course) => {
    const nextStatus = course.status === 'active' ? 'draft' : 'active';
    await apiFetch(`/api/portal/courses/${course.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    });
    await Promise.all([loadPortal(), refreshBootstrap()]);
    notify(`"${course.title}" status updated to ${nextStatus}.`);
  };

  const handleDuplicateCourse = async (course: Course) => {
    await apiFetch(`/api/portal/courses/${course.id}/duplicate`, {
      method: 'POST',
    });
    await Promise.all([loadPortal(), refreshBootstrap()]);
    notify(`Draft copy created for "${course.title}".`);
  };

  const handleDeleteCourse = async (id: string) => {
    if (confirmCourseDeleteId !== id) {
      setConfirmCourseDeleteId(id);
      return;
    }
    await apiFetch(`/api/portal/courses/${id}`, { method: 'DELETE' });
    setConfirmCourseDeleteId(null);
    await Promise.all([loadPortal(), refreshBootstrap()]);
    notify('Course and its syllabus lessons deleted.');
  };

  const handleBatchStatusChange = async (batch: CourseBatch, status: CourseBatch['status']) => {
    await apiFetch(`/api/portal/batches/${batch.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await Promise.all([loadPortal(), refreshBootstrap()]);
    notify(`Batch "${batch.name}" marked as ${status}.`);
  };

  const handleDeleteBatch = async (id: string) => {
    if (confirmBatchDeleteId !== id) {
      setConfirmBatchDeleteId(id);
      return;
    }
    await apiFetch(`/api/portal/batches/${id}`, { method: 'DELETE' });
    setConfirmBatchDeleteId(null);
    await Promise.all([loadPortal(), refreshBootstrap()]);
    notify('Course batch deleted.');
  };

  const handleToggleLiveStatus = async (lesson: CourseLesson, liveStatus: LiveClassStatus) => {
    await apiFetch(`/api/portal/lessons/${lesson.id}/live-status`, {
      method: 'PATCH',
      body: JSON.stringify({ liveStatus }),
    });
    await loadPortal();
    notify(
      liveStatus === 'live_now'
        ? `"${lesson.title}" is now LIVE NOW.`
        : `"${lesson.title}" live status changed to ${liveStatus}.`
    );
  };

  const handleReorderLesson = async (id: string, direction: 'up' | 'down') => {
    await apiFetch(`/api/portal/lessons/${id}/reorder`, {
      method: 'POST',
      body: JSON.stringify({ direction }),
    });
    await loadPortal();
    notify(`Lecture order moved ${direction}.`);
  };

  const handleDuplicateLesson = async (lesson: CourseLesson) => {
    await apiFetch(`/api/portal/lessons/${lesson.id}/duplicate`, {
      method: 'POST',
    });
    await loadPortal();
    notify(`Cloned "${lesson.title}".`);
  };

  const handleDeleteLesson = async (id: string) => {
    if (confirmLessonDeleteId !== id) {
      setConfirmLessonDeleteId(id);
      return;
    }
    await apiFetch(`/api/portal/lessons/${id}`, { method: 'DELETE' });
    setConfirmLessonDeleteId(null);
    await loadPortal();
    notify('Lecture / Video removed.');
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/portal/exams', {
      method: 'POST',
      body: JSON.stringify({
        title: examTitle,
        category: examCategory,
        durationMinutes: 15,
        visibility: 'public',
        questions: [
          {
            prompt: examQPrompt,
            options: [examOptA, examOptB, examOptC, examOptD],
            correctIndex: examCorrect,
            marks: 2,
          },
        ],
      }),
    });
    setExamTitle('');
    setExamQPrompt('');
    setExamOptA('');
    setExamOptB('');
    setExamOptC('');
    setExamOptD('');
    await loadPortal();
    notify('MCQ Exam created and live.');
  };

  const handleOrderStatus = async (id: string, status: Order['status']) => {
    await apiFetch(`/api/portal/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await loadPortal();
    notify(`Order updated to ${status}.`);
  };

  const resetBranchForm = () => {
    setEditingBranchId(null);
    setBrName('');
    setBrCode('');
    setBrCity('');
    setBrAddress('');
    setBrPhone('');
    setBrManager('');
    setBrStudents('0');
    setBrStatus('active');
    setBrError(null);
  };

  const startEditBranch = (b: Branch) => {
    setEditingBranchId(b.id);
    setBrName(b.name);
    setBrCode(b.code);
    setBrCity(b.city);
    setBrAddress(b.address);
    setBrPhone(b.phone);
    setBrManager(b.managerName);
    setBrStudents(String(b.activeStudents));
    setBrStatus(b.status);
    setBrError(null);
  };

  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrError(null);
    try {
      const payload = {
        name: brName.trim(),
        code: brCode.trim().toUpperCase(),
        city: brCity.trim(),
        address: brAddress.trim(),
        phone: brPhone.trim(),
        managerName: brManager.trim(),
        activeStudents: Number(brStudents) || 0,
        status: brStatus,
      };
      if (editingBranchId) {
        await apiFetch(`/api/portal/branches/${editingBranchId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        notify(`Branch "${payload.name}" updated.`);
      } else {
        await apiFetch('/api/portal/branches', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        notify('Branch added.');
      }
      resetBranchForm();
      await Promise.all([loadPortal(), refreshBootstrap()]);
    } catch (err) {
      setBrError(err instanceof Error ? err.message : 'Failed to save branch.');
    }
  };

  const handleToggleBranchStatus = async (b: Branch) => {
    await apiFetch(`/api/portal/branches/${b.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: b.status === 'active' ? 'inactive' : 'active' }),
    });
    await Promise.all([loadPortal(), refreshBootstrap()]);
    notify(`Branch "${b.name}" ${b.status === 'active' ? 'deactivated' : 'activated'}.`);
  };

  const handleDeleteBranch = async (b: Branch) => {
    if (confirmBranchDeleteId !== b.id) {
      setConfirmBranchDeleteId(b.id);
      return;
    }
    setConfirmBranchDeleteId(null);
    await apiFetch(`/api/portal/branches/${b.id}`, { method: 'DELETE' });
    if (editingBranchId === b.id) resetBranchForm();
    await Promise.all([loadPortal(), refreshBootstrap()]);
    notify(`Branch "${b.name}" moved to Recycle Bin.`);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/portal/users', {
      method: 'POST',
      body: JSON.stringify({
        name: uName,
        email: uEmail,
        phone: uPhone,
        role: uRole,
        branchId: uRole === 'admin' ? null : uBranchId,
      }),
    });
    setUName('');
    setUEmail('');
    setUPhone('');
    await loadPortal();
    notify('User created with assigned role.');
  };

  const handleRoleUpdate = async (userId: string, role: UserRole) => {
    await apiFetch(`/api/portal/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    await loadPortal();
    notify('User role updated.');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/portal/settings', {
      method: 'PATCH',
      body: JSON.stringify({ phone: setPhone, email: setEmail, address: setAddress }),
    });
    await Promise.all([loadPortal(), refreshBootstrap()]);
    notify('Center settings saved.');
  };

  const pendingApprovalsCount = (data?.enrollments ?? []).filter((e) => e.status === 'pending').length;
  const liveClassesCount = (data?.lessons ?? []).filter((l) => l.liveStatus === 'live_now').length;
  const portalNotifications = [
    ...(pendingApprovalsCount > 0
      ? [
          {
            id: 'notif-pending-enr',
            title: `${pendingApprovalsCount} Pending Enrollment(s)`,
            subtitle: 'Review and approve student payment requests',
            section: 'enrollments' as PortalSection,
          },
        ]
      : []),
    ...(liveClassesCount > 0
      ? [
          {
            id: 'notif-live-classes',
            title: `${liveClassesCount} Live Class(es) Active`,
            subtitle: 'Monitor or launch live video classroom sessions',
            section: 'lessons' as PortalSection,
          },
        ]
      : []),
    {
      id: 'notif-lms-ready',
      title: 'LMS Analytics Synchronized',
      subtitle: 'All branch metrics and recent enrollments are up to date',
      section: 'overview' as PortalSection,
    },
  ];

  const handleSelectOverviewSubView = (subView: OverviewSubView) => {
    setOverviewSubView(subView);
    setActiveSection('overview');
  };

  const handleSectionRoute = (sec: PortalSection, intent?: SidebarSubIntent) => {
    setActiveSection(sec);
    setActiveSidebarIntent(intent);
    if (sec === 'courses' && (intent === 'courses' || intent === 'batches')) {
      setCourseSubTab(intent);
    }
    if (
      sec === 'catalog_cms' &&
      (intent === 'ebooks' ||
        intent === 'products' ||
        intent === 'posts' ||
        intent === 'categories' ||
        intent === 'coupons')
    ) {
      setCatalogInitialTab(intent);
    }
  };

  const handleQuickAction = (action: QuickActionType) => {
    switch (action) {
      case 'add_student':
        setURole('student');
        handleSectionRoute('users');
        break;
      case 'add_teacher':
        setURole('teacher');
        handleSectionRoute('users');
        break;
      case 'create_batch':
        setEditingBatch(null);
        setBatchModalOpen(true);
        break;
      case 'add_course':
        setEditingCourse(null);
        setCourseModalOpen(true);
        break;
      case 'add_post':
        handleSectionRoute('catalog_cms', 'posts');
        break;
      case 'create_category':
        handleSectionRoute('catalog_cms', 'categories');
        break;
      case 'course_from_post':
        handleSectionRoute('catalog_cms', 'posts');
        break;
      case 'add_ebook':
        handleSectionRoute('catalog_cms', 'ebooks');
        break;
      case 'add_product':
        handleSectionRoute('catalog_cms', 'products');
        break;
      case 'take_exam':
        handleSectionRoute('exams');
        break;
      case 'customize':
        setCustomizerOpen(true);
        break;
    }
  };

  const handleSaveDashboardConfig = async (nextConfig: DashboardCustomizationConfig) => {
    await apiFetch('/api/portal/settings', {
      method: 'PATCH',
      body: JSON.stringify({ dashboardConfig: nextConfig }),
    });
    setDashboardConfig(nextConfig);
    setDarkMode(nextConfig.themeMode === 'midnight_dark');
    await Promise.all([loadPortal(), refreshBootstrap()]);
    notify('Custom Admin Dashboard layout saved!');
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div
        style={
          darkMode
            ? { backgroundColor: dashboardConfig.colors.workspaceDarkBg }
            : {
                backgroundImage: `linear-gradient(to bottom right, ${dashboardConfig.colors.workspaceLightBg}, ${dashboardConfig.colors.workspaceLightBgEnd}, ${dashboardConfig.colors.workspaceLightBg})`,
              }
        }
        className={`flex min-h-screen transition-colors ${
          darkMode ? 'text-slate-100' : 'text-slate-900'
        }`}
      >
        {/* Left Navigation Sidebar */}
        <DashboardSidebar
          user={user}
          brandName={bootstrap?.settings.brandName || "Alom's English Center"}
          roleLabel={ROLE_LABELS[user.role]}
          allowedSections={allowedSections}
          currentSection={currentSection}
          activeSubIntent={activeSidebarIntent}
          overviewSubView={overviewSubView}
          accentPreset={dashboardConfig.accentPreset}
          dashboardConfig={dashboardConfig}
          collapsed={sidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          lang={dashLang}
          unreadMessagesCount={pendingApprovalsCount}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          onCloseMobile={() => setMobileMenuOpen(false)}
          onSelectSection={handleSectionRoute}
          onSelectOverviewSubView={handleSelectOverviewSubView}
          onNavigatePublic={(path) => navigate(path)}
          onLogout={() => {
            logout();
            navigate('/');
          }}
        />

        {/* Right Main Column: Topbar + Workspace + Footer */}
        <div className="flex min-w-0 flex-1 flex-col">
          <DashboardTopbar
            user={user}
            roleLabel={ROLE_LABELS[user.role]}
            searchQuery={dashboardSearch}
            onSearchChange={setDashboardSearch}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((v) => !v)}
            lang={dashLang}
            onToggleLang={() => setDashLang((l) => (l === 'en' ? 'bn' : 'en'))}
            canCustomize={user.role === 'admin'}
            dashboardConfig={dashboardConfig}
            onOpenCustomizer={() => setCustomizerOpen(true)}
            unreadMessagesCount={pendingApprovalsCount}
            notifications={portalNotifications}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onSelectSection={(sec) => handleSectionRoute(sec)}
          />

          <section
            aria-label="Portal Workspace"
            className="min-w-0 flex-1 space-y-6 px-4 py-5 sm:px-6"
          >
            {feedback && (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-xs font-bold text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{feedback}</span>
              </div>
            )}

            {currentSection !== 'overview' && (
              <div
                className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-3.5 shadow-xs ${
                  darkMode
                    ? 'border-[#1E2E52] bg-[#0F1B3B] text-white'
                    : 'border-white/80 bg-white/90 text-slate-900 backdrop-blur-md'
                }`}
              >
                <div>
                  <h1 className="text-base font-extrabold">{SECTION_META[currentSection].label}</h1>
                  <p className="text-xs opacity-70">
                    {ROLE_LABELS[user.role]} Workspace · {bootstrap?.settings.brandName || "Alom's English Center"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    handleSectionRoute('overview');
                    setOverviewSubView('lms');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#6366F1] px-4 py-2 text-xs font-bold text-white shadow-xs hover:opacity-95"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to LMS Dashboard</span>
                </button>
              </div>
            )}

            {loading && !data ? (
              <div className="rounded-2xl border border-white/60 bg-white/85 p-12 text-center text-sm text-slate-600">
                Loading LMS dashboard workspace...
              </div>
            ) : (
              <>
                {/* OVERVIEW (Futuristic Alom's English Center LMS Dashboard) */}
                {currentSection === 'overview' && data && (
                  <DashboardOverview
                    data={{
                      ...data,
                      instructors: data.instructors ?? bootstrap?.instructors ?? [],
                      reviews: data.reviews ?? bootstrap?.reviews ?? [],
                      posts: data.posts ?? [],
                    }}
                    auditLogs={data.auditLogs}
                    searchQuery={dashboardSearch}
                    overviewSubView={overviewSubView}
                    lang={dashLang}
                    darkMode={darkMode}
                    canCustomize={user.role === 'admin'}
                    dashboardConfig={dashboardConfig}
                    onSelectSection={handleSectionRoute}
                    onQuickAction={handleQuickAction}
                    onNavigate={navigate}
                  />
                )}

                {/* ADMIN REAL-TIME SYSTEM ACTIVITY LOGS CONSOLE */}
                {currentSection === 'activity_logs' && user.role === 'admin' && data && (
                  <SystemActivityLogsPanel
                    initialLogs={data.auditLogs}
                    darkMode={darkMode}
                  />
                )}

              {/* COURSES & BATCHES MANAGEMENT (Advanced Studio) */}
              {currentSection === 'courses' && data && (() => {
                const allCourses = data.courses ?? [];
                const allBatches = data.batches ?? [];
                const branchesList = data.branches ?? bootstrap?.branches ?? [];
                const instructorsList = bootstrap?.instructors ?? [];

                const q = courseSearch.trim().toLowerCase();
                const filteredCourses = allCourses.filter((c) => {
                  if (courseStatusFilter !== 'all' && c.status !== courseStatusFilter) return false;
                  if (courseCatFilter !== 'all') {
                    if (courseCatFilter === 'combos' && !c.isCombo) return false;
                    if (courseCatFilter !== 'combos' && c.category !== courseCatFilter) return false;
                  }
                  if (!q) return true;
                  return (
                    c.title.toLowerCase().includes(q) ||
                    c.levelTag.toLowerCase().includes(q) ||
                    c.category.toLowerCase().includes(q)
                  );
                });

                const bq = batchSearch.trim().toLowerCase();
                const filteredBatches = allBatches.filter((b) => {
                  if (batchCourseFilter !== 'all' && b.courseId !== batchCourseFilter) return false;
                  if (!bq) return true;
                  return (
                    b.name.toLowerCase().includes(bq) ||
                    b.code.toLowerCase().includes(bq) ||
                    b.schedule.toLowerCase().includes(bq)
                  );
                });

                const activeCount = allCourses.filter((c) => c.status === 'active').length;
                const draftCount = allCourses.filter((c) => c.status === 'draft').length;
                const comboCount = allCourses.filter((c) => c.isCombo).length;
                const openBatchCount = allBatches.filter((b) => b.status === 'open').length;

                return (
                  <div className="space-y-6">
                    {/* Sub-Tab Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setCourseSubTab('courses')}
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                            courseSubTab === 'courses'
                              ? 'bg-[#062436] text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <BookOpen className="h-4 w-4" />
                          <span>Courses & Combos ({allCourses.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCourseSubTab('batches')}
                          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                            courseSubTab === 'batches'
                              ? 'bg-[#062436] text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Layers className="h-4 w-4" />
                          <span>Course Batches & Schedules ({allBatches.length})</span>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('/courses')}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>View Live /courses</span>
                      </button>
                    </div>

                    {courseSubTab === 'courses' ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <h2 className="text-lg font-extrabold text-slate-900">
                              Course & Combo Management Studio
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500">
                              <span className="font-mono-tabular font-bold text-slate-700">{activeCount}</span> Active ·{' '}
                              <span className="font-mono-tabular font-bold text-amber-700">{draftCount}</span> Drafts ·{' '}
                              <span className="font-mono-tabular font-bold text-indigo-700">{comboCount}</span> Combo Bundles
                            </p>
                          </div>
                          {user.role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCourse(null);
                                setCourseModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                            >
                              <Plus className="h-4 w-4" />
                              <span>Add New Course / Combo</span>
                            </button>
                          )}
                        </div>

                        {/* Search & Filters */}
                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-12">
                          <div className="relative sm:col-span-6">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="search"
                              value={courseSearch}
                              onChange={(e) => setCourseSearch(e.target.value)}
                              placeholder="Filter courses by title, batch tag, or category..."
                              aria-label="Filter admin courses"
                              className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                          <select
                            value={courseCatFilter}
                            onChange={(e) => setCourseCatFilter(e.target.value)}
                            aria-label="Filter by category"
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold sm:col-span-3"
                          >
                            <option value="all">All Categories</option>
                            <option value="combos">Combos Only</option>
                            <option value="SSC English">SSC English</option>
                            <option value="HSC English">HSC English</option>
                            <option value="IELTS & Spoken">IELTS & Spoken</option>
                            <option value="Grammar Pro">Grammar Pro</option>
                            <option value="Admission">Admission</option>
                            <option value="Combo Packs">Combo Packs</option>
                          </select>
                          <select
                            value={courseStatusFilter}
                            onChange={(e) =>
                              setCourseStatusFilter(e.target.value as 'all' | 'active' | 'draft')
                            }
                            aria-label="Filter by publish status"
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold sm:col-span-3"
                          >
                            <option value="all">All Statuses</option>
                            <option value="active">Active Only</option>
                            <option value="draft">Drafts Only</option>
                          </select>
                        </div>

                        {/* Courses Table */}
                        <div className="mt-5 overflow-x-auto">
                          {filteredCourses.length === 0 ? (
                            <p className="py-8 text-center text-xs text-slate-500">
                              No courses match your search/filter.
                            </p>
                          ) : (
                            <table className="w-full text-left text-sm">
                              <thead>
                                <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                                  <th className="py-2.5 pr-4">Course / Batch</th>
                                  <th className="py-2.5 pr-4">Category & Tag</th>
                                  <th className="py-2.5 pr-4">Price</th>
                                  <th className="py-2.5 pr-4">Enrolled</th>
                                  <th className="py-2.5 pr-4">Status</th>
                                  {user.role === 'admin' && <th className="py-2.5">Manage</th>}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {filteredCourses.map((c) => {
                                  const pricing = calculateDiscountedPrice(c.price, c.originalPrice);
                                  const isConfirming = confirmCourseDeleteId === c.id;
                                  const courseBatchesCount = allBatches.filter(
                                    (b) => b.courseId === c.id
                                  ).length;
                                  return (
                                    <tr key={c.id} className="hover:bg-slate-50/80">
                                      <td className="py-3 pr-4">
                                        <div className="flex items-center gap-3">
                                          <img
                                            src={c.thumbnail}
                                            alt={c.title}
                                            className="h-11 w-16 shrink-0 rounded-lg border border-slate-200 object-cover"
                                            referrerPolicy="no-referrer"
                                          />
                                          <div className="min-w-0">
                                            <p className="line-clamp-1 font-bold text-slate-900">
                                              {c.title}
                                            </p>
                                            <p className="text-[11px] text-slate-500">
                                              {c.isCombo
                                                ? `Combo (${c.includedCourses?.length ?? 0} modules)`
                                                : `${courseBatchesCount} batch${courseBatchesCount === 1 ? '' : 'es'}`}{' '}
                                              · {c.branchIds.length} branches
                                            </p>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="py-3 pr-4 text-xs">
                                        <p className="font-semibold text-slate-800">{c.category}</p>
                                        <p className="text-[11px] text-indigo-700">{c.levelTag}</p>
                                      </td>
                                      <td className="font-mono-tabular py-3 pr-4 text-xs">
                                        <p className="font-extrabold text-slate-900">
                                          {c.price === 0 ? 'Free' : `৳${c.price}`}
                                        </p>
                                        {pricing.baseDiscountPercent > 0 && (
                                          <p className="text-[11px] text-emerald-700">
                                            -{pricing.baseDiscountPercent}% (৳{c.originalPrice})
                                          </p>
                                        )}
                                      </td>
                                      <td className="font-mono-tabular py-3 pr-4 text-xs font-semibold">
                                        {c.enrolledCount.toLocaleString()}
                                      </td>
                                      <td className="py-3 pr-4">
                                        {user.role === 'admin' ? (
                                          <button
                                            type="button"
                                            onClick={() => handleToggleCourseStatus(c)}
                                            aria-label={`Toggle status for ${c.title}`}
                                            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase ${
                                              c.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                            }`}
                                          >
                                            {c.status === 'active' ? (
                                              <Eye className="h-3 w-3" />
                                            ) : (
                                              <EyeOff className="h-3 w-3" />
                                            )}
                                            <span>{c.status}</span>
                                          </button>
                                        ) : (
                                          <span className="text-xs font-bold uppercase text-emerald-700">
                                            {c.status}
                                          </span>
                                        )}
                                      </td>
                                      {user.role === 'admin' && (
                                        <td className="py-3">
                                          <div className="flex items-center gap-1.5">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingCourse(c);
                                                setCourseModalOpen(true);
                                              }}
                                              aria-label={`Edit ${c.title}`}
                                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:border-indigo-400 hover:text-indigo-700"
                                            >
                                              <Pencil className="h-3.5 w-3.5" />
                                              <span>Edit</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDuplicateCourse(c)}
                                              aria-label={`Duplicate ${c.title}`}
                                              title="Duplicate as Draft"
                                              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:text-indigo-700"
                                            >
                                              <Copy className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteCourse(c.id)}
                                              aria-label={
                                                isConfirming
                                                  ? `Confirm delete ${c.title}`
                                                  : `Delete ${c.title}`
                                              }
                                              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold ${
                                                isConfirming
                                                  ? 'bg-rose-600 text-white'
                                                  : 'p-1.5 text-rose-600 hover:bg-rose-50'
                                              }`}
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                              {isConfirming && <span>Confirm</span>}
                                            </button>
                                          </div>
                                        </td>
                                      )}
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* COURSE BATCHES & SCHEDULES STUDIO */
                      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                          <div>
                            <h2 className="text-lg font-extrabold text-slate-900">
                              Course Batches & Class Routine Studio
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500">
                              <span className="font-mono-tabular font-bold text-slate-700">{allBatches.length}</span> Total Batches ·{' '}
                              <span className="font-mono-tabular font-bold text-emerald-700">{openBatchCount}</span> Open for Admission
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBatch(null);
                              setBatchModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Create New Batch</span>
                          </button>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-12">
                          <div className="relative sm:col-span-6">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="search"
                              value={batchSearch}
                              onChange={(e) => setBatchSearch(e.target.value)}
                              placeholder="Search batches by name, code, or schedule..."
                              aria-label="Search course batches"
                              className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                          <select
                            value={batchCourseFilter}
                            onChange={(e) => setBatchCourseFilter(e.target.value)}
                            aria-label="Filter batches by course"
                            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold sm:col-span-6"
                          >
                            <option value="all">All Courses</option>
                            {allCourses.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.title}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                          {filteredBatches.length === 0 ? (
                            <p className="col-span-full py-8 text-center text-xs text-slate-500">
                              No course batches match your filter.
                            </p>
                          ) : (
                            filteredBatches.map((bat) => {
                              const parentCourse = allCourses.find((c) => c.id === bat.courseId);
                              const branchObj = branchesList.find((b) => b.id === bat.branchId);
                              const instObj = instructorsList.find((i) => i.id === bat.instructorId);
                              const seats = computeBatchSeatUsage(bat);
                              const isConfirming = confirmBatchDeleteId === bat.id;

                              return (
                                <div
                                  key={bat.id}
                                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-4"
                                >
                                  <div>
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                      <span className="font-mono-tabular rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                                        {bat.code}
                                      </span>
                                      <select
                                        aria-label={`Status for ${bat.name}`}
                                        value={bat.status}
                                        onChange={(e) =>
                                          handleBatchStatusChange(
                                            bat,
                                            e.target.value as CourseBatch['status']
                                          )
                                        }
                                        className={`rounded-lg border px-2 py-1 text-[11px] font-bold uppercase ${
                                          bat.status === 'open'
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                            : bat.status === 'running'
                                              ? 'border-sky-200 bg-sky-50 text-sky-700'
                                              : 'border-slate-200 bg-slate-100 text-slate-600'
                                        }`}
                                      >
                                        <option value="open">Open</option>
                                        <option value="running">Running</option>
                                        <option value="closed">Closed</option>
                                      </select>
                                    </div>
                                    <h3 className="mt-2.5 text-sm font-extrabold text-slate-900">
                                      {bat.name}
                                    </h3>
                                    <p className="line-clamp-1 text-xs font-semibold text-indigo-700">
                                      {parentCourse?.title || 'Course Batch'}
                                    </p>
                                    <div className="mt-2.5 space-y-1 text-xs text-slate-600">
                                      <p className="flex items-center gap-1.5">
                                        <CalendarClock className="h-3.5 w-3.5 text-slate-400" />
                                        <span>{bat.schedule}</span>
                                      </p>
                                      <p>
                                        Mode: <strong className="text-slate-800">{bat.mode}</strong> · Starts{' '}
                                        <span className="font-mono-tabular">{bat.startDate}</span>
                                      </p>
                                      <p>
                                        Branch: {branchObj?.name || 'Online'} · Lead:{' '}
                                        {instObj?.name || 'Faculty'}
                                      </p>
                                    </div>

                                    <div className="mt-3">
                                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                                        <span>
                                          Seats: {bat.enrolledSeats}/{bat.seatLimit}
                                        </span>
                                        <span>{seats.remainingSeats} left</span>
                                      </div>
                                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-200">
                                        <div
                                          className="h-full bg-indigo-600"
                                          style={{ width: `${seats.fillPercent}%` }}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingBatch(bat);
                                        setBatchModalOpen(true);
                                      }}
                                      aria-label={`Edit batch ${bat.name}`}
                                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:border-indigo-400 hover:text-indigo-700"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                      <span>Edit Batch</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteBatch(bat.id)}
                                      aria-label={
                                        isConfirming
                                          ? `Confirm delete batch ${bat.name}`
                                          : `Delete batch ${bat.name}`
                                      }
                                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                                        isConfirming
                                          ? 'bg-rose-600 text-white'
                                          : 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                      }`}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span>{isConfirming ? 'Confirm Delete' : 'Delete'}</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* LECTURE, LIVE & RECORDED VIDEO STUDIO (Admin & Teacher) */}
              {currentSection === 'lessons' && data && (() => {
                const allCourses = data.courses ?? [];
                const allBatches = data.batches ?? [];
                const allLessons = data.lessons ?? [];

                const courseScopedLessons =
                  lessonCourseFilter === 'all'
                    ? allLessons
                    : allLessons.filter((l) => l.courseId === lessonCourseFilter);

                const filteredLessons = filterLessonsByTypeAndBatch(
                  courseScopedLessons,
                  lessonTypeFilter,
                  lessonBatchFilter,
                  lessonSearch
                );

                const availableBatches =
                  lessonCourseFilter === 'all'
                    ? allBatches
                    : allBatches.filter((b) => b.courseId === lessonCourseFilter);

                const recordedCount = allLessons.filter(
                  (l) => (l.lessonType ?? 'recorded') === 'recorded'
                ).length;
                const liveCount = allLessons.filter((l) => l.lessonType === 'live').length;
                const liveNowCount = allLessons.filter(
                  (l) => l.lessonType === 'live' && l.liveStatus === 'live_now'
                ).length;
                const sheetCount = allLessons.filter(
                  (l) => l.lessonType === 'lecture_sheet'
                ).length;

                return (
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-extrabold text-slate-900">
                            Lecture, Live Class & Recorded Video Studio
                          </h2>
                          <p className="mt-0.5 text-xs text-slate-500">
                            <span className="font-mono-tabular font-bold text-sky-700">{recordedCount}</span> Recorded Videos ·{' '}
                            <span className="font-mono-tabular font-bold text-rose-700">
                              {liveCount}
                            </span>{' '}
                            Live Classes ({liveNowCount} LIVE NOW) ·{' '}
                            <span className="font-mono-tabular font-bold text-amber-700">{sheetCount}</span> Lecture Sheets
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => navigate('/learn')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Open /learn Classroom</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLesson(null);
                              setLessonModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                          >
                            <Plus className="h-4 w-4" />
                            <span>Add Lecture / Live / Video</span>
                          </button>
                        </div>
                      </div>

                      {/* Format Filter Pills */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {[
                          { id: 'all' as const, label: `All (${allLessons.length})` },
                          { id: 'recorded' as const, label: `Recorded Videos (${recordedCount})` },
                          { id: 'live' as const, label: `Live Classes (${liveCount})` },
                          { id: 'lecture_sheet' as const, label: `Lecture Sheets (${sheetCount})` },
                        ].map((tabItem) => (
                          <button
                            key={tabItem.id}
                            type="button"
                            onClick={() => setLessonTypeFilter(tabItem.id)}
                            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-colors ${
                              lessonTypeFilter === tabItem.id
                                ? 'bg-[#062436] text-white'
                                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            {tabItem.label}
                          </button>
                        ))}
                      </div>

                      {/* Filter Controls */}
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-12">
                        <div className="relative sm:col-span-4">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <input
                            type="search"
                            value={lessonSearch}
                            onChange={(e) => setLessonSearch(e.target.value)}
                            placeholder="Search title, module or batch..."
                            aria-label="Search lectures and videos"
                            className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <select
                          value={lessonCourseFilter}
                          onChange={(e) => {
                            setLessonCourseFilter(e.target.value);
                            setLessonBatchFilter('all');
                          }}
                          aria-label="Filter lessons by course"
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold sm:col-span-4"
                        >
                          <option value="all">All Courses</option>
                          {allCourses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                        </select>
                        <select
                          value={lessonBatchFilter}
                          onChange={(e) => setLessonBatchFilter(e.target.value)}
                          aria-label="Filter lessons by batch"
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold sm:col-span-4"
                        >
                          <option value="all">All Batches</option>
                          {availableBatches.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Lessons List */}
                      <div className="mt-5 space-y-2.5">
                        {filteredLessons.length === 0 ? (
                          <p className="py-8 text-center text-xs text-slate-500">
                            No lectures, live sessions, or recorded videos match your filters.
                          </p>
                        ) : (
                          filteredLessons.map((les) => {
                            const lType = les.lessonType ?? 'recorded';
                            const parentCourse = allCourses.find((c) => c.id === les.courseId);
                            const isConfirming = confirmLessonDeleteId === les.id;

                            return (
                              <div
                                key={les.id}
                                className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 p-4 transition-colors hover:bg-slate-50/70 sm:flex-row sm:items-center"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-extrabold uppercase ${
                                        lType === 'live'
                                          ? les.liveStatus === 'live_now'
                                            ? 'bg-rose-600 text-white'
                                            : 'bg-rose-50 text-rose-700'
                                          : lType === 'lecture_sheet'
                                            ? 'bg-amber-50 text-amber-800'
                                            : 'bg-sky-50 text-sky-700'
                                      }`}
                                    >
                                      {lType === 'live' ? (
                                        <Radio className="h-3 w-3" />
                                      ) : lType === 'lecture_sheet' ? (
                                        <FileText className="h-3 w-3" />
                                      ) : (
                                        <Video className="h-3 w-3" />
                                      )}
                                      <span>
                                        {lType === 'live'
                                          ? les.liveStatus === 'live_now'
                                            ? 'Live Now'
                                            : les.liveStatus === 'ended'
                                              ? 'Live Ended'
                                              : 'Live Scheduled'
                                          : lType === 'lecture_sheet'
                                            ? 'Lecture Sheet'
                                            : 'Recorded Video'}
                                      </span>
                                    </span>

                                    {les.batchName && (
                                      <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                                        {les.batchName}
                                      </span>
                                    )}

                                    {les.isFreePreview && (
                                      <span className="rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                        Free Preview
                                      </span>
                                    )}
                                  </div>

                                  <p className="mt-1.5 text-sm font-extrabold text-slate-900">
                                    <span className="font-mono-tabular mr-1.5 text-slate-400">
                                      #{les.orderIndex}
                                    </span>
                                    {les.title}
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {parentCourse?.title || 'Course'} · {les.moduleName} ·{' '}
                                    <span className="font-mono-tabular font-semibold">
                                      {les.duration}
                                    </span>
                                    {lType === 'live' && les.scheduledAt
                                      ? ` · Schedule: ${les.scheduledAt}`
                                      : ''}
                                  </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                  {lType === 'live' && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleToggleLiveStatus(
                                          les,
                                          les.liveStatus === 'live_now' ? 'ended' : 'live_now'
                                        )
                                      }
                                      className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${
                                        les.liveStatus === 'live_now'
                                          ? 'bg-slate-900 text-white hover:bg-slate-700'
                                          : 'bg-rose-600 text-white hover:bg-rose-700'
                                      }`}
                                    >
                                      {les.liveStatus === 'live_now' ? 'End Live' : 'Go Live'}
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleReorderLesson(les.id, 'up')}
                                    aria-label={`Move up ${les.title}`}
                                    title="Move Up"
                                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:text-indigo-700"
                                  >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReorderLesson(les.id, 'down')}
                                    aria-label={`Move down ${les.title}`}
                                    title="Move Down"
                                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:text-indigo-700"
                                  >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingLesson(les);
                                      setLessonModalOpen(true);
                                    }}
                                    aria-label={`Edit lesson ${les.title}`}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:border-indigo-400 hover:text-indigo-700"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                    <span>Edit</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateLesson(les)}
                                    aria-label={`Duplicate lesson ${les.title}`}
                                    title="Duplicate Lecture"
                                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:text-indigo-700"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteLesson(les.id)}
                                    aria-label={
                                      isConfirming
                                        ? `Confirm delete lesson ${les.title}`
                                        : `Delete lesson ${les.title}`
                                    }
                                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold ${
                                      isConfirming
                                        ? 'bg-rose-600 text-white'
                                        : 'p-1.5 text-rose-600 hover:bg-rose-50'
                                    }`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {isConfirming && <span>Confirm</span>}
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* EXAMS & QUESTION BANK BUILDER (Admin & Teacher) */}
              {currentSection === 'exams' && data && (
                <div className="space-y-6">
                  <ExamBankPanel
                    questionBank={data.questionBank ?? []}
                    courses={data.courses ?? []}
                    onRefresh={async () => {
                      await Promise.all([loadPortal(), refreshBootstrap()]);
                    }}
                    onNotify={notify}
                  />

                  <form
                    onSubmit={handleCreateExam}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
                  >
                    <h2 className="text-lg font-extrabold text-slate-900">Quick Single-Question Exam</h2>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        required
                        placeholder="Exam Title"
                        value={examTitle}
                        onChange={(e) => setExamTitle(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Category (e.g. HSC English)"
                        value={examCategory}
                        onChange={(e) => setExamCategory(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                      />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Question 1 Prompt"
                      value={examQPrompt}
                      onChange={(e) => setExamQPrompt(e.target.value)}
                      className="mt-3 w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                    />
                    <div className="mt-3 grid grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        required
                        placeholder="Option A"
                        value={examOptA}
                        onChange={(e) => setExamOptA(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Option B"
                        value={examOptB}
                        onChange={(e) => setExamOptB(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Option C"
                        value={examOptC}
                        onChange={(e) => setExamOptC(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Option D"
                        value={examOptD}
                        onChange={(e) => setExamOptD(e.target.value)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs"
                      />
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <label htmlFor="correct-opt" className="text-xs font-bold text-slate-700">
                        Correct Option:
                      </label>
                      <select
                        id="correct-opt"
                        value={examCorrect}
                        onChange={(e) => setExamCorrect(Number(e.target.value))}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                      >
                        <option value={0}>Option A</option>
                        <option value={1}>Option B</option>
                        <option value={2}>Option C</option>
                        <option value={3}>Option D</option>
                      </select>
                      <button
                        type="submit"
                        className="ml-auto rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white"
                      >
                        Publish Exam
                      </button>
                    </div>
                  </form>

                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Published Exams ({data.exams?.length ?? 0})
                    </h2>
                    <div className="mt-4 space-y-2.5">
                      {(data.exams ?? []).map((ex) => {
                        const confirming = confirmExamDeleteId === ex.id;
                        return (
                          <div
                            key={ex.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{ex.title}</p>
                              <p className="text-xs text-slate-500">
                                {ex.category} · {ex.questions.length} MCQs · {ex.durationMinutes} min
                                {ex.negativeMarkPerWrong ? ` · -${ex.negativeMarkPerWrong} neg` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold uppercase text-emerald-700">
                                {ex.visibility}
                              </span>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!confirming) {
                                    setConfirmExamDeleteId(ex.id);
                                    return;
                                  }
                                  await apiFetch(`/api/portal/exams/${ex.id}`, { method: 'DELETE' });
                                  setConfirmExamDeleteId(null);
                                  await Promise.all([loadPortal(), refreshBootstrap()]);
                                  notify(`Exam "${ex.title}" moved to Recycle Bin.`);
                                }}
                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                                  confirming
                                    ? 'bg-rose-600 text-white'
                                    : 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                }`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>{confirming ? 'Confirm' : 'Delete'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* CATALOG, POSTS & COUPONS STUDIO (Admin) */}
              {currentSection === 'catalog_cms' && user.role === 'admin' && data && (
                <CatalogContentPanel
                  ebooks={data.ebooks ?? bootstrap?.ebooks ?? []}
                  products={data.products ?? bootstrap?.products ?? []}
                  instructors={data.instructors ?? bootstrap?.instructors ?? []}
                  categories={data.categories ?? bootstrap?.categories ?? []}
                  posts={data.posts ?? []}
                  coupons={data.coupons ?? []}
                  branches={data.branches ?? bootstrap?.branches ?? []}
                  transactions={data.transactions ?? []}
                  initialSubTab={catalogInitialTab}
                  onOpenCoursesSection={() => handleSectionRoute('courses', 'courses')}
                  onRefresh={async () => {
                    await Promise.all([loadPortal(), refreshBootstrap()]);
                  }}
                  onNotify={notify}
                />
              )}

              {/* ATTENDANCE, PAYROLL & FINANCE P&L */}
              {currentSection === 'attendance_finance' && data && (
                <AttendanceFinancePanel
                  role={user.role}
                  users={data.users ?? []}
                  attendance={data.attendance ?? []}
                  payrolls={data.payrolls ?? []}
                  financialRecords={data.financialRecords ?? []}
                  transactions={data.transactions ?? []}
                  onRefresh={async () => {
                    await Promise.all([loadPortal(), refreshBootstrap()]);
                  }}
                  onNotify={notify}
                />
              )}

              {/* AI AGENTS, SCORM 1.2, BROADCASTS, PLUGINS & SECURITY */}
              {currentSection === 'ai_ecosystem' && data && (
                <AiEcosystemSecurityPanel
                  role={user.role}
                  scormPackages={data.scormPackages ?? []}
                  campaigns={data.campaigns ?? []}
                  plugins={data.plugins ?? []}
                  webhooks={data.webhooks ?? []}
                  courses={data.courses ?? []}
                  onRefresh={async () => {
                    await Promise.all([loadPortal(), refreshBootstrap()]);
                  }}
                  onNotify={notify}
                />
              )}

              {/* ENROLLMENTS & FEES */}
              {currentSection === 'enrollments' && data && (
                <EnrollmentsFeePanel
                  role={user.role}
                  userBranchId={user.branchId}
                  enrollments={data.enrollments ?? []}
                  courses={data.courses ?? bootstrap?.courses ?? []}
                  branches={data.branches ?? bootstrap?.branches ?? []}
                  users={data.users ?? []}
                  paymentGateways={data.paymentGateways ?? []}
                  darkMode={darkMode}
                  onRefresh={async () => {
                    await Promise.all([loadPortal(), refreshBootstrap()]);
                  }}
                  onNotify={notify}
                />
              )}

              {/* DEDICATED PAYMENT SYSTEM & GATEWAYS */}
              {currentSection === 'payments' && data && (
                <PaymentSystemPanel
                  role={user.role}
                  paymentGateways={data.paymentGateways ?? []}
                  transactions={data.transactions ?? []}
                  onRefresh={async () => {
                    await Promise.all([loadPortal(), refreshBootstrap()]);
                  }}
                  onNotify={notify}
                />
              )}

              {/* BRANCHES (FULL EDIT, UPDATE, ACTIVE/DEACTIVE, SOFT-DELETE) */}
              {currentSection === 'branches' && data && (
                <div className="space-y-6">
                  {user.role === 'admin' && (
                    <form
                      onSubmit={handleSaveBranch}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h2 className="text-lg font-extrabold text-slate-900">
                            {editingBranchId ? 'Edit Campus Branch' : 'Add New Campus Branch'}
                          </h2>
                          <p className="text-xs text-slate-500">
                            Manage physical &amp; hybrid branch campuses, activate/deactivate visibility on checkout, or soft-delete to Recycle Bin.
                          </p>
                        </div>
                        {editingBranchId && (
                          <button
                            type="button"
                            onClick={resetBranchForm}
                            className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50"
                          >
                            Cancel Edit
                          </button>
                        )}
                      </div>
                      {brError && (
                        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                          {brError}
                        </p>
                      )}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <input
                          type="text"
                          required
                          placeholder="Branch Name"
                          value={brName}
                          onChange={(e) => setBrName(e.target.value)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                        <input
                          type="text"
                          required
                          placeholder="Code (e.g. AEC-DMD)"
                          value={brCode}
                          onChange={(e) => setBrCode(e.target.value)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm uppercase"
                        />
                        <input
                          type="text"
                          required
                          placeholder="City"
                          value={brCity}
                          onChange={(e) => setBrCity(e.target.value)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <input
                          type="text"
                          required
                          placeholder="Full Address"
                          value={brAddress}
                          onChange={(e) => setBrAddress(e.target.value)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
                        />
                        <input
                          type="text"
                          placeholder="Hotline Phone"
                          value={brPhone}
                          onChange={(e) => setBrPhone(e.target.value)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <input
                          type="text"
                          placeholder="Branch Manager Name"
                          value={brManager}
                          onChange={(e) => setBrManager(e.target.value)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                        <input
                          type="number"
                          min={0}
                          placeholder="Active Students"
                          value={brStudents}
                          onChange={(e) => setBrStudents(e.target.value)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                        <select
                          value={brStatus}
                          onChange={(e) => setBrStatus(e.target.value as 'active' | 'inactive')}
                          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold"
                        >
                          <option value="active">Status: Active</option>
                          <option value="inactive">Status: Inactive</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="rounded-xl bg-[#062436] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0b3854]"
                      >
                        {editingBranchId ? 'Update Branch' : 'Create Branch'}
                      </button>
                    </form>
                  )}

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {(data.branches ?? []).map((b) => {
                      const confirming = confirmBranchDeleteId === b.id;
                      const isActive = b.status === 'active';
                      return (
                        <div
                          key={b.id}
                          className={`flex flex-col justify-between rounded-2xl border p-5 shadow-xs ${
                            isActive
                              ? 'border-slate-200 bg-white'
                              : 'border-slate-200 bg-slate-50/85 opacity-85'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono-tabular text-xs font-bold text-sky-700">
                                {b.code} · {b.city}
                              </span>
                              <span
                                className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                                  isActive
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {b.status}
                              </span>
                            </div>
                            <h3 className="mt-1 text-base font-extrabold text-slate-900">{b.name}</h3>
                            <p className="mt-1 text-xs text-slate-600">{b.address}</p>
                            <p className="mt-2 text-xs font-semibold text-slate-700">
                              Manager: {b.managerName} · Phone: {b.phone} · Students:{' '}
                              <span className="font-mono-tabular">{b.activeStudents}</span>
                            </p>
                          </div>

                          {user.role === 'admin' && (
                            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                              <button
                                type="button"
                                onClick={() => void handleToggleBranchStatus(b)}
                                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold ${
                                  isActive
                                    ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                }`}
                              >
                                <Power className="h-3.5 w-3.5" />
                                <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                              </button>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEditBranch(b)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteBranch(b)}
                                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold ${
                                    confirming
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  }`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>{confirming ? 'Confirm' : 'Delete'}</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* USERS & ROLES */}
              {currentSection === 'users' && data && (
                <div className="space-y-6">
                  {user.role === 'admin' && (
                    <form
                      onSubmit={handleCreateUser}
                      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
                    >
                      <h2 className="text-lg font-extrabold text-slate-900">
                        Create Staff / Student / Guardian User
                      </h2>
                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <input
                          type="text"
                          required
                          placeholder="Full Name"
                          value={uName}
                          onChange={(e) => setUName(e.target.value)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                        <input
                          type="email"
                          required
                          placeholder="Email"
                          value={uEmail}
                          onChange={(e) => setUEmail(e.target.value)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={uPhone}
                          onChange={(e) => setUPhone(e.target.value)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        />
                        <select
                          value={uRole}
                          onChange={(e) => setURole(e.target.value as UserRole)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        >
                          <option value="teacher">Teacher</option>
                          <option value="branch_manager">Branch Manager</option>
                          <option value="student">Student</option>
                          <option value="guardian">Guardian</option>
                          <option value="admin">Admin</option>
                        </select>
                        <select
                          value={uBranchId}
                          onChange={(e) => setUBranchId(e.target.value)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
                        >
                          {(data.branches ?? []).map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white"
                        >
                          Create User
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Users Directory ({data.users?.length ?? 0})
                    </h2>
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                            <th className="py-2.5 pr-4">Name</th>
                            <th className="py-2.5 pr-4">Email</th>
                            <th className="py-2.5 pr-4">Roll / Phone</th>
                            <th className="py-2.5 pr-4">Role</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(data.users ?? []).map((u) => (
                            <tr key={u.id}>
                              <td className="py-3 pr-4 font-bold text-slate-900">{u.name}</td>
                              <td className="py-3 pr-4 text-xs text-slate-600">{u.email}</td>
                              <td className="font-mono-tabular py-3 pr-4 text-xs text-slate-600">
                                {u.rollNumber || u.phone}
                              </td>
                              <td className="py-3 pr-4">
                                {user.role === 'admin' ? (
                                  <select
                                    aria-label={`Change role for ${u.name}`}
                                    value={u.role}
                                    onChange={(e) =>
                                      handleRoleUpdate(u.id, e.target.value as UserRole)
                                    }
                                    className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-bold"
                                  >
                                    <option value="admin">Admin</option>
                                    <option value="branch_manager">Branch Manager</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="student">Student</option>
                                    <option value="guardian">Guardian</option>
                                  </select>
                                ) : (
                                  <span className="text-xs font-bold text-slate-700">
                                    {ROLE_LABELS[u.role]}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ORDERS */}
              {currentSection === 'orders' && data && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Study Material & Book Orders ({data.orders?.length ?? 0})
                  </h2>
                  <div className="mt-4 space-y-3">
                    {(data.orders ?? []).length === 0 ? (
                      <p className="text-sm text-slate-500">No orders placed yet.</p>
                    ) : (
                      (data.orders ?? []).map((ord) => (
                        <div
                          key={ord.id}
                          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 p-4"
                        >
                          <div>
                            <p className="font-mono-tabular text-xs font-bold text-indigo-700">
                              {ord.id}
                            </p>
                            <p className="text-sm font-bold text-slate-900">
                              {ord.customerName} · {ord.deliveryAddress}
                            </p>
                            <p className="text-xs text-slate-500">
                              {ord.items.map((i) => `${i.title} (x${i.quantity})`).join(', ')}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono-tabular text-base font-extrabold text-slate-900">
                              ৳{ord.totalAmount}
                            </span>
                            {user.role === 'admin' || user.role === 'branch_manager' ? (
                              <select
                                aria-label={`Order status for ${ord.id}`}
                                value={ord.status}
                                onChange={(e) =>
                                  handleOrderStatus(ord.id, e.target.value as Order['status'])
                                }
                                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold"
                              >
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            ) : (
                              <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-700">
                                {ord.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* STUDENT MY LEARNING, REWARDS, SCORM & INVOICES */}
              {currentSection === 'my_learning' && data && (
                <div className="space-y-6">
                  {data.rewards && (
                    <div className="rounded-2xl border border-amber-200 bg-linear-to-r from-amber-50 to-indigo-50 p-6 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-700">
                            <Award className="h-6 w-6" />
                          </span>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                              Learning Rewards & Streak
                            </p>
                            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                              <span>{data.rewards.xp} XP</span>
                              <span className="inline-flex items-center gap-1 rounded-lg bg-orange-100 px-2 py-0.5 text-xs text-orange-800">
                                <Flame className="h-3.5 w-3.5" /> {data.rewards.streakDays}d streak
                              </span>
                            </h2>
                            <p className="mt-1 text-xs text-slate-600">
                              Badges: {data.rewards.badges.join(' · ') || 'Active Learner'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            await apiFetch('/api/rewards/privacy', {
                              method: 'PATCH',
                              body: JSON.stringify({
                                showOnLeaderboard: !data.rewards?.showOnLeaderboard,
                              }),
                            });
                            await Promise.all([loadPortal(), refreshBootstrap()]);
                            notify(
                              !data.rewards?.showOnLeaderboard
                                ? 'Your full name is now visible on Leaderboards.'
                                : 'Leaderboard privacy ON: Your name is now masked.'
                            );
                          }}
                          className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                            data.rewards.showOnLeaderboard
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-slate-800 text-white hover:bg-slate-700'
                          }`}
                        >
                          {data.rewards.showOnLeaderboard
                            ? 'Leaderboard Name: Public (Click to Mask)'
                            : 'Leaderboard Name: Private/Masked (Click to Show)'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-extrabold text-slate-900">My Enrolled Courses</h2>
                      <button
                        type="button"
                        onClick={() => navigate('/learn')}
                        className="rounded-xl bg-[#062436] px-4 py-2 text-xs font-bold text-white"
                      >
                        Continue Watching
                      </button>
                    </div>
                    <div className="mt-4 space-y-3">
                      {(data.enrollments ?? []).length === 0 ? (
                        <p className="text-sm text-slate-500">
                          You have not enrolled in any courses yet.
                        </p>
                      ) : (
                        (data.enrollments ?? []).map((enr) => {
                          const totalLes = (data.lessons ?? []).filter(
                            (l) => l.courseId === enr.courseId
                          ).length;
                          const pct = calculateStudentProgress(totalLes, enr.completedLessonIds);
                          return (
                            <div
                              key={enr.id}
                              className="rounded-xl border border-slate-200 p-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h3 className="text-sm font-extrabold text-slate-900">
                                  {enr.courseTitle}
                                </h3>
                                <span
                                  className={`text-xs font-bold uppercase ${
                                    enr.status === 'approved'
                                      ? 'text-emerald-700'
                                      : 'text-amber-700'
                                  }`}
                                >
                                  {enr.status}
                                </span>
                              </div>
                              <div className="mt-3 flex items-center gap-3">
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                                  <div
                                    className="h-full bg-emerald-500"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <span className="font-mono-tabular text-xs font-bold text-slate-700">
                                  {pct}%
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {(data.scormPackages ?? []).length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                      <h3 className="text-base font-extrabold text-slate-900">
                        Interactive SCORM 1.2 Modules
                      </h3>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {(data.scormPackages ?? []).map((pkg) => (
                          <div
                            key={pkg.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5 text-xs"
                          >
                            <div>
                              <p className="font-bold text-slate-900">{pkg.title}</p>
                              <p className="text-slate-500">+{pkg.xpReward} XP · {pkg.identifier}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveStudentScorm(pkg)}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white"
                            >
                              <Play className="h-3 w-3" /> Launch
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(data.transactions ?? []).length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                      <h3 className="text-base font-extrabold text-slate-900">
                        Official Payment Invoices
                      </h3>
                      <div className="mt-3 space-y-2 text-xs">
                        {(data.transactions ?? []).map((tx) => (
                          <div
                            key={tx.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5"
                          >
                            <span>
                              <strong className="font-mono-tabular text-indigo-700">{tx.invoiceNo}</strong>{' '}
                              · {tx.gateway} ({tx.trxId})
                            </span>
                            <span className="font-mono-tabular font-bold text-slate-900">
                              ৳{tx.totalAmount} · {tx.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* GUARDIAN CHILD MONITOR */}
              {currentSection === 'guardian_monitor' && data && (
                <div className="space-y-6">
                  {(data.children ?? []).length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                      No linked students found for this guardian account.
                    </div>
                  ) : (
                    (data.children ?? []).map((child) => (
                      <div
                        key={child.student.id}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                          <div>
                            <h2 className="text-xl font-extrabold text-slate-900">
                              {child.student.name}
                            </h2>
                            <p className="font-mono-tabular text-xs font-semibold text-sky-700">
                              Roll: {child.student.rollNumber || child.student.id} ·{' '}
                              {child.student.email}
                            </p>
                          </div>
                          <span className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                            Active Student
                          </span>
                        </div>

                        <h3 className="mt-5 text-sm font-extrabold text-slate-900">
                          Course Progress & Fee Status
                        </h3>
                        <div className="mt-2 space-y-2.5">
                          {child.enrollments.map((enr) => {
                            const totalLes = child.lessonsCountByCourse[enr.courseId] || 1;
                            const pct = calculateStudentProgress(
                              totalLes,
                              enr.completedLessonIds
                            );
                            return (
                              <div
                                key={enr.id}
                                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3.5 text-xs"
                              >
                                <div>
                                  <p className="font-bold text-slate-900">{enr.courseTitle}</p>
                                  <p className="text-slate-500">
                                    Payment: {enr.paymentMethod} · ৳{enr.amountPaid} ({enr.status})
                                  </p>
                                </div>
                                <span className="font-mono-tabular font-bold text-emerald-700">
                                  {pct}% Completed
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        <h3 className="mt-6 text-sm font-extrabold text-slate-900">
                          Exam Performance History
                        </h3>
                        <div className="mt-2 space-y-2">
                          {child.examAttempts.map((att) => (
                            <div
                              key={att.id}
                              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs"
                            >
                              <span className="font-bold text-slate-900">{att.examTitle}</span>
                              <span className="font-mono-tabular font-bold text-indigo-700">
                                {att.score}/{att.totalMarks} ({att.grade})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* HOMEPAGE VISUAL CMS STUDIO (Admin) */}
              {currentSection === 'homepage_cms' && user.role === 'admin' && data && data.settings && (
                <HomepageCmsStudio
                  settings={data.settings}
                  courses={data.courses ?? []}
                  reviews={data.reviews ?? bootstrap?.reviews ?? []}
                  initialTab={cmsInitialTab}
                  liveStats={{
                    students:
                      (data.branches ?? []).reduce((s, b) => s + b.activeStudents, 0) +
                      (data.courses ?? []).reduce((s, c) => s + c.enrolledCount, 0),
                    courses: (data.courses ?? []).filter((c) => c.status === 'active').length,
                    teachers: (bootstrap?.instructors ?? []).length,
                    videos: (data.lessons ?? []).length * 140 + 480,
                  }}
                  onNavigateHome={() => navigate('/')}
                  onSaved={async (msg) => {
                    await Promise.all([loadPortal(), refreshBootstrap()]);
                    notify(msg);
                  }}
                />
              )}

              {/* ADMIN SETTINGS & LARAVEL EXPORT */}
              {currentSection === 'settings' && data && (
                <div className="space-y-6">
                  <form
                    onSubmit={handleSaveSettings}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
                  >
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Aloms English Center Contact & Branding Settings
                    </h2>
                    <div className="mt-4 space-y-3">
                      <div>
                        <label
                          htmlFor="set-phone"
                          className="mb-1 block text-xs font-bold text-slate-700"
                        >
                          Helpline Phone
                        </label>
                        <input
                          id="set-phone"
                          type="text"
                          value={setPhone}
                          onChange={(e) => setSetPhone(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="set-email"
                          className="mb-1 block text-xs font-bold text-slate-700"
                        >
                          Official Email
                        </label>
                        <input
                          id="set-email"
                          type="email"
                          value={setEmail}
                          onChange={(e) => setSetEmail(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="set-address"
                          className="mb-1 block text-xs font-bold text-slate-700"
                        >
                          Head Office Address
                        </label>
                        <input
                          id="set-address"
                          type="text"
                          value={setAddress}
                          onChange={(e) => setSetAddress(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="mt-4 rounded-xl bg-[#062436] px-5 py-2.5 text-xs font-bold text-white"
                    >
                      Save Settings
                    </button>
                  </form>

                  {user.role === 'admin' && (
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-extrabold text-slate-900">
                          Custom Header Navigation Menu &amp; Footer Builder
                        </h2>
                        <p className="mt-1 text-xs text-slate-600">
                          Add custom top navbar links, badges, visibility toggles, footer links, and Page Builder (/page/:slug) pages.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCmsInitialTab('branding');
                          setActiveSection('homepage_cms');
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#062436] px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-600"
                      >
                        <LayoutTemplate className="h-4 w-4" />
                        <span>Open Custom Menu Builder</span>
                      </button>
                    </div>
                  )}

                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Ready-to-Install Laravel 11 Codebase
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Download the standalone Laravel 11 project archive containing the Web Installer
                      (/install), database migrations, 5-role RBAC middleware, and Blade UI with
                      zero workspace hidden folders.
                    </p>
                    <a
                      href="/downloads/aloms-english-center-laravel.zip"
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download aloms-english-center-laravel.zip</span>
                    </a>
                  </div>

                  {user.role === 'admin' && (
                    <SecurityBackupPanel
                      onRefresh={async () => {
                        await Promise.all([loadPortal(), refreshBootstrap()]);
                      }}
                      onNotify={notify}
                    />
                  )}
                </div>
              )}
            </>
          )}
          </section>

          {/* Centered Dashboard Footer */}
          <footer
            className={`mt-auto border-t py-3.5 text-center text-xs ${
              darkMode
                ? 'border-[#1E2E52] bg-[#0B142C] text-slate-400'
                : 'border-white/70 bg-white/70 text-slate-600 backdrop-blur-md'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <span>© 2026</span>
              <Heart className="h-3.5 w-3.5 fill-rose-500 text-rose-500" />
              <span>{bootstrap?.settings.brandName || "Alom's English Center"} · LMS v3.0</span>
            </span>
          </footer>
        </div>
      </div>

      {user.role === 'admin' && (
        <DashboardCustomizerModal
          open={customizerOpen}
          config={dashboardConfig}
          onClose={() => setCustomizerOpen(false)}
          onSave={handleSaveDashboardConfig}
        />
      )}

      {user.role === 'admin' && data && (
        <AdminCourseModal
          open={courseModalOpen}
          course={editingCourse}
          allCourses={data.courses ?? []}
          branches={data.branches ?? bootstrap?.branches ?? []}
          instructors={bootstrap?.instructors ?? []}
          lessons={data.lessons ?? []}
          onClose={() => setCourseModalOpen(false)}
          onSaved={async (msg) => {
            await Promise.all([loadPortal(), refreshBootstrap()]);
            notify(msg);
          }}
        />
      )}

      {(user.role === 'admin' || user.role === 'teacher' || user.role === 'branch_manager') &&
        data && (
          <AdminBatchModal
            open={batchModalOpen}
            batch={editingBatch}
            courses={data.courses ?? []}
            branches={data.branches ?? bootstrap?.branches ?? []}
            instructors={bootstrap?.instructors ?? []}
            defaultCourseId={batchCourseFilter !== 'all' ? batchCourseFilter : undefined}
            onClose={() => setBatchModalOpen(false)}
            onSaved={async (msg) => {
              await Promise.all([loadPortal(), refreshBootstrap()]);
              notify(msg);
            }}
          />
        )}

      {(user.role === 'admin' || user.role === 'teacher') && data && (
        <AdminLessonModal
          open={lessonModalOpen}
          lesson={editingLesson}
          courses={data.courses ?? []}
          batches={data.batches ?? []}
          defaultCourseId={lessonCourseFilter !== 'all' ? lessonCourseFilter : undefined}
          onClose={() => setLessonModalOpen(false)}
          onSaved={async (msg) => {
            await Promise.all([loadPortal(), refreshBootstrap()]);
            notify(msg);
          }}
        />
      )}

      <ScormPlayerModal
        pkg={activeStudentScorm}
        onClose={() => setActiveStudentScorm(null)}
        onCompleted={() => {
          void Promise.all([loadPortal(), refreshBootstrap()]);
          notify('SCORM 1.2 module score & XP recorded!');
        }}
      />
    </div>
  );
}
