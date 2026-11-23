export type UserRole = 'admin' | 'branch_manager' | 'teacher' | 'student' | 'guardian';

export interface Branch {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  phone: string;
  managerName: string;
  activeStudents: number;
  status: 'active' | 'inactive';
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  branchId: string | null;
  rollNumber?: string;
  guardianLinkedStudentIds?: string[];
  avatar?: string;
  createdAt: string;
}

export interface Instructor {
  id: string;
  name: string;
  subject: string;
  roleTitle: string;
  education: string;
  panel: 'Head Faculty' | 'Branch Faculty';
  branchId: string;
  bio: string;
  avatar: string;
}

export type LessonType = 'recorded' | 'live' | 'lecture_sheet';
export type LiveClassStatus = 'scheduled' | 'live_now' | 'ended';

export interface CourseBatch {
  id: string;
  courseId: string;
  name: string;
  code: string;
  branchId: string;
  instructorId: string;
  schedule: string;
  startDate: string;
  seatLimit: number;
  enrolledSeats: number;
  mode: 'Online Live' | 'Offline Branch' | 'Hybrid';
  status: 'open' | 'running' | 'closed';
}

export interface CourseLesson {
  id: string;
  courseId: string;
  batchId?: string | null;
  batchName?: string;
  lessonType: LessonType;
  title: string;
  moduleName: string;
  duration: string;
  videoPreviewTitle: string;
  videoUrl: string;
  lectureSheetUrl?: string;
  liveJoinUrl?: string;
  liveStatus?: LiveClassStatus;
  scheduledAt?: string;
  sheetSummary: string;
  isFreePreview: boolean;
  orderIndex: number;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: 'HSC English' | 'SSC English' | 'IELTS & Spoken' | 'Grammar Pro' | 'Admission' | 'Combo Packs';
  levelTag: string;
  isCombo: boolean;
  includedCourses?: string[];
  price: number;
  originalPrice: number;
  enrolledCount: number;
  examSystemIncluded: boolean;
  branchIds: string[];
  instructorIds: string[];
  thumbnail: string;
  description: string;
  highlights: string[];
  demoVideoTitle: string;
  demoYoutubeUrl: string;
  status: 'active' | 'draft';
}

export interface ExamQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  marks: number;
  subject?: string;
  chapter?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  type?: 'mcq' | 'true_false' | 'written';
}

export interface QuestionBankItem extends ExamQuestion {
  subject: string;
  chapter: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'mcq' | 'true_false' | 'written';
  createdAt: string;
}

export interface Exam {
  id: string;
  title: string;
  courseId: string | null;
  category: string;
  durationMinutes: number;
  passPercentage: number;
  negativeMarkPerWrong?: number;
  examType?: 'mcq' | 'written' | 'mixed';
  visibility: 'public' | 'course';
  teacherId: string;
  questions: ExamQuestion[];
  createdAt: string;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  userId: string;
  studentName: string;
  rollNumber: string;
  branchId: string | null;
  score: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  passed: boolean;
  answers: Record<string, number>;
  submittedAt: string;
}

export interface Product {
  id: string;
  title: string;
  category: 'Books' | 'Merchandise' | 'Study Kits' | string;
  price: number;
  originalPrice: number;
  stock: number;
  image: string;
  description: string;
}

export interface Ebook {
  id: string;
  title: string;
  level: 'HSC 27' | 'HSC 28' | 'SSC 26' | 'SSC 27' | 'IELTS' | 'Class 9' | string;
  isFree: boolean;
  price: number;
  originalPrice: number;
  author: string;
  pagesCount: number;
  coverImage?: string;
  summary: string;
  sampleContent: string[];
}

export type PaymentGatewayType =
  | 'bKash'
  | 'Nagad'
  | 'Rocket'
  | 'SSLCommerz Card'
  | 'Manual Bank Transfer'
  | 'Branch Cash';

export type PaymentProviderType =
  | 'mobile_wallet'
  | 'card_gateway'
  | 'bank_transfer'
  | 'cash_desk';

export interface PaymentGatewayConfig {
  id: string;
  code: PaymentGatewayType | string;
  name: string;
  subtitle: string;
  providerType: PaymentProviderType;
  merchantAccount: string;
  instructions: string;
  mode: 'sandbox' | 'live';
  feePercent: number;
  apiKeyMasked: string;
  webhookSecretMasked: string;
  active: boolean;
  sortOrder: number;
}

export interface PublicPaymentGateway {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  providerType: PaymentProviderType;
  merchantAccount: string;
  instructions: string;
  mode: 'sandbox' | 'live';
  feePercent: number;
  active: boolean;
  sortOrder: number;
}

export interface Enrollment {
  id: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  branchId: string;
  paymentMethod: PaymentGatewayType | 'Card';
  trxId?: string;
  invoiceNo?: string;
  amountPaid: number;
  couponUsed?: string;
  status: 'approved' | 'pending' | 'rejected';
  completedLessonIds: string[];
  enrolledAt: string;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  phone: string;
  deliveryAddress: string;
  branchPickupId: string | null;
  items: { productId: string; title: string; quantity: number; unitPrice: number }[];
  deliveryFee: number;
  discountAmount?: number;
  couponUsed?: string;
  paymentMethod?: PaymentGatewayType;
  trxId?: string;
  invoiceNo?: string;
  totalAmount: number;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  active: boolean;
  appliesTo?: 'all' | 'courses' | 'products';
  description: string;
}

export interface Review {
  id: string;
  name: string;
  roleLabel: string;
  text: string;
  rating: number;
  row: 1 | 2;
  status?: 'approved' | 'pending' | 'hidden';
  featured?: boolean;
  courseTag?: string;
  avatar?: string;
  verified?: boolean;
  createdAt?: string;
}

export interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  courseSlug: string;
  image: string;
  gradient: string;
  active?: boolean;
}

export type HighlightIconKey =
  | 'book'
  | 'briefcase'
  | 'award'
  | 'graduation'
  | 'languages'
  | 'layers'
  | 'landmark';

export type HighlightAccentKey = 'emerald' | 'amber' | 'sky' | 'indigo' | 'purple' | 'teal';

export interface FeaturedHighlightItem {
  id: string;
  title: string;
  desc: string;
  categoryLink: string;
  iconKey: HighlightIconKey;
  accentColor: HighlightAccentKey;
}

export interface LearningPathHighlight {
  id: string;
  title: string;
  desc: string;
  category: string;
  iconKey: HighlightIconKey;
  accentKey: HighlightAccentKey;
  image?: string;
}

export interface HomepageConfig {
  featuredCard: {
    badge: string;
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    highlights: FeaturedHighlightItem[];
  };
  statsCard: {
    mode: 'auto' | 'custom';
    badge: string;
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    customValues: {
      students: number;
      courses: number;
      teachers: number;
      videos: number;
    };
    labels: {
      students: string;
      courses: string;
      teachers: string;
      videos: string;
    };
  };
  learningPathsSection: {
    heading: string;
    subheading: string;
    items: LearningPathHighlight[];
  };
  reviewsSection: {
    kicker: string;
    heading: string;
    subheading: string;
  };
}

export interface CenterResultRecord {
  rollNumber: string;
  studentName: string;
  batchName: string;
  branchName: string;
  examName: string;
  mcqScore: number;
  writtenScore: number;
  totalScore: number;
  maxScore: number;
  gpaOrGrade: string;
  meritPosition: number;
  status: 'Passed' | 'Distinction';
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  type: 'course' | 'product' | 'ebook' | 'post';
  description: string;
  image?: string;
  active: boolean;
}

export interface CommunityComment {
  id: string;
  authorName: string;
  authorRole: UserRole;
  text: string;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  title: string;
  category: string;
  content: string;
  image?: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  likes: number;
  likedByUserIds: string[];
  comments: CommunityComment[];
  status: 'published' | 'draft';
  createdAt: string;
}

export interface ScormPackage {
  id: string;
  courseId: string;
  title: string;
  version: '1.2';
  identifier: string;
  launchFile: string;
  manifestXml: string;
  htmlContent: string;
  maxScore: number;
  xpReward: number;
  createdAt: string;
}

export interface ScormAttempt {
  id: string;
  packageId: string;
  userId: string;
  lessonStatus: 'not attempted' | 'incomplete' | 'completed' | 'passed' | 'failed';
  scoreRaw: number;
  sessionTime: string;
  suspendData: string;
  updatedAt: string;
}

export interface LearnerRewardProfile {
  userId: string;
  studentName: string;
  branchId: string | null;
  xp: number;
  streakDays: number;
  badges: string[];
  showOnLeaderboard: boolean;
  completedScormIds: string[];
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  targetType: 'student' | 'teacher' | 'staff';
  targetId: string;
  targetName: string;
  branchId: string | null;
  batchId?: string | null;
  date: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  checkInTime?: string;
  checkOutTime?: string;
  recordedBy: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  role: UserRole;
  branchId: string | null;
  monthKey: string;
  baseSalary: number;
  allowances: number;
  bonuses: number;
  deductions: number;
  advance: number;
  netSalary: number;
  status: 'pending' | 'approved' | 'paid';
  paidAt?: string;
}

export interface FinancialRecord {
  id: string;
  type: 'income' | 'expense' | 'refund';
  category: string;
  title: string;
  amount: number;
  branchId: string | null;
  date: string;
  recordedBy: string;
}

export interface PaymentTransaction {
  id: string;
  invoiceNo: string;
  referenceType: 'course' | 'order';
  referenceId: string;
  userId: string;
  payerName: string;
  gateway: PaymentGatewayType;
  walletOrLast4: string;
  trxId: string;
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  deliveryFee: number;
  totalAmount: number;
  status: 'completed' | 'pending_verification' | 'refunded';
  createdAt: string;
}

export interface BackupSnapshot {
  id: string;
  label: string;
  reason: 'manual' | 'pre_reset' | 'pre_restore';
  checksumSha256: string;
  verified: boolean;
  createdBy: string;
  createdAt: string;
  summary: {
    courses: number;
    users: number;
    exams: number;
    enrollments: number;
    reviews: number;
  };
  payloadJson?: string;
}

export interface RecycleBinItem {
  id: string;
  entityType:
    | 'course'
    | 'batch'
    | 'lesson'
    | 'exam'
    | 'product'
    | 'ebook'
    | 'review'
    | 'post'
    | 'question'
    | 'instructor'
    | 'category'
    | 'coupon'
    | 'branch'
    | 'payment_gateway'
    | 'plugin';
  originalId: string;
  label: string;
  deletedBy: string;
  deletedAt: string;
  snapshot: unknown;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  target: string;
  details: string;
  createdAt: string;
}

export interface BroadcastCampaign {
  id: string;
  title: string;
  channel: 'SMS' | 'Email' | 'WhatsApp' | 'Notice';
  audience: string;
  message: string;
  sentCount: number;
  status: 'sent' | 'scheduled' | 'draft';
  createdAt: string;
}

export interface ApiPlugin {
  id: string;
  name: string;
  category: 'Payment' | 'Live Video' | 'AI' | 'Marketing' | 'LMS Widget' | 'SMS & Messaging';
  version: string;
  active: boolean;
  description: string;
  scopes: string[];
  endpointUrl?: string;
  apiKeyMasked?: string;
  environment?: 'sandbox' | 'production';
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  event: string;
  active: boolean;
  lastStatus?: string;
  secretMasked: string;
}

export interface CustomPage {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  body: string;
  coverImage?: string;
  published: boolean;
}

export interface FooterLinkItem {
  label: string;
  path: string;
}

export interface HeaderMenuItem {
  id: string;
  label: string;
  path: string;
  badge?: string;
  visible: boolean;
  openInNewTab?: boolean;
}

export type AiAgentRole = 'student' | 'teacher' | 'admin' | 'support' | 'learning';

export interface SiteSettings {
  brandName: string;
  tagline: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  whiteLabelDomain?: string;
  language?: 'en' | 'bn';
  phone: string;
  email: string;
  whatsappNumber: string;
  address: string;
  licenseNo: string;
  aboutMission: string;
  footerCopyright?: string;
  footerLinks?: FooterLinkItem[];
  headerMenu?: HeaderMenuItem[];
  socialLinks?: {
    youtube: string;
    facebook: string;
    linkedin?: string;
  };
  customPages?: CustomPage[];
  heroSlides: HeroSlide[];
  homepageConfig?: HomepageConfig;
}

