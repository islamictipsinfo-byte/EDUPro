import type {
  Coupon,
  Course,
  CourseBatch,
  CourseLesson,
  ExamQuestion,
  HeaderMenuItem,
  HomepageConfig,
  LessonType,
  QuestionBankItem,
  UserRole,
} from '../types';

export type PortalSection =
  | 'overview'
  | 'courses'
  | 'lessons'
  | 'homepage_cms'
  | 'catalog_cms'
  | 'exams'
  | 'payments'
  | 'attendance_finance'
  | 'enrollments'
  | 'branches'
  | 'users'
  | 'orders'
  | 'ai_ecosystem'
  | 'guardian_monitor'
  | 'my_learning'
  | 'settings';

const ROLE_PORTAL_MATRIX: Record<UserRole, PortalSection[]> = {
  admin: [
    'overview',
    'courses',
    'lessons',
    'homepage_cms',
    'catalog_cms',
    'exams',
    'payments',
    'attendance_finance',
    'enrollments',
    'branches',
    'users',
    'orders',
    'ai_ecosystem',
    'settings',
  ],
  branch_manager: [
    'overview',
    'payments',
    'attendance_finance',
    'enrollments',
    'branches',
    'users',
    'orders',
  ],
  teacher: [
    'overview',
    'courses',
    'lessons',
    'exams',
    'attendance_finance',
    'ai_ecosystem',
  ],
  student: [
    'overview',
    'my_learning',
    'ai_ecosystem',
    'enrollments',
    'orders',
  ],
  guardian: [
    'overview',
    'guardian_monitor',
  ],
};

export function getAllowedPortalSections(role: UserRole): PortalSection[] {
  return ROLE_PORTAL_MATRIX[role] ?? ['overview'];
}

export function canRoleAccessPortalSection(role: UserRole, section: PortalSection): boolean {
  return getAllowedPortalSections(role).includes(section);
}

export interface PriceBreakdown {
  originalPrice: number;
  basePrice: number;
  baseDiscountPercent: number;
  couponDiscountAmount: number;
  finalPrice: number;
  appliedCouponCode: string | null;
}

export function calculateDiscountedPrice(
  price: number,
  originalPrice: number,
  coupon?: Coupon | null
): PriceBreakdown {
  const safeBase = Math.max(0, Math.round(price));
  const safeOriginal = Math.max(safeBase, Math.round(originalPrice));
  const baseDiscountPercent =
    safeOriginal > 0 ? Math.round(((safeOriginal - safeBase) / safeOriginal) * 100) : 0;

  let couponDiscountAmount = 0;
  let appliedCouponCode: string | null = null;

  if (coupon && coupon.active && coupon.discountPercent > 0) {
    const pct = Math.min(90, Math.max(1, coupon.discountPercent));
    couponDiscountAmount = Math.round((safeBase * pct) / 100);
    appliedCouponCode = coupon.code.toUpperCase();
  }

  return {
    originalPrice: safeOriginal,
    basePrice: safeBase,
    baseDiscountPercent,
    couponDiscountAmount,
    finalPrice: Math.max(0, safeBase - couponDiscountAmount),
    appliedCouponCode,
  };
}

export interface ExamGradingResult {
  score: number;
  totalMarks: number;
  correctCount: number;
  totalQuestions: number;
  percentage: number;
  grade: string;
  passed: boolean;
  questionResults: {
    questionId: string;
    selectedIndex: number | null;
    correctIndex: number;
    isCorrect: boolean;
    earnedMarks: number;
  }[];
}

export function gradeExamSubmission(
  questions: ExamQuestion[],
  answers: Record<string, number>,
  passPercentage = 40
): ExamGradingResult {
  let score = 0;
  let totalMarks = 0;
  let correctCount = 0;

  const questionResults = questions.map((q) => {
    const marks = Math.max(1, q.marks || 1);
    totalMarks += marks;
    const rawSelection = answers[q.id];
    const selectedIndex = typeof rawSelection === 'number' ? rawSelection : null;
    const isCorrect = selectedIndex !== null && selectedIndex === q.correctIndex;
    if (isCorrect) {
      score += marks;
      correctCount += 1;
    }
    return {
      questionId: q.id,
      selectedIndex,
      correctIndex: q.correctIndex,
      isCorrect,
      earnedMarks: isCorrect ? marks : 0,
    };
  });

  const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 100) : 0;
  const passed = percentage >= passPercentage;

  let grade = 'F';
  if (percentage >= 80) grade = 'A+';
  else if (percentage >= 70) grade = 'A';
  else if (percentage >= 60) grade = 'A-';
  else if (percentage >= 50) grade = 'B';
  else if (percentage >= 40) grade = 'C';
  else if (percentage >= 33) grade = 'D';

  return {
    score,
    totalMarks,
    correctCount,
    totalQuestions: questions.length,
    percentage,
    grade,
    passed,
    questionResults,
  };
}

export type CourseSortOption = 'featured' | 'price_asc' | 'price_desc' | 'popular';

export interface FilterCoursesOptions {
  includeDrafts?: boolean;
  sortBy?: CourseSortOption;
}

export function sanitizeSafeUrl(input: string, fallback = ''): string {
  const trimmed = input.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function filterCourses(
  courses: Course[],
  category: string,
  searchQuery = '',
  options: FilterCoursesOptions = {}
): Course[] {
  const { includeDrafts = false, sortBy = 'featured' } = options;
  const q = searchQuery.trim().toLowerCase();
  const catLower = category.trim().toLowerCase();

  const filtered = courses.filter((course) => {
    if (!includeDrafts && course.status !== 'active') return false;
    const matchesCategory =
      category === 'All' ||
      category === 'All Courses' ||
      (category === 'Combos'
        ? course.isCombo
        : course.category === category ||
          course.levelTag.toLowerCase() === catLower ||
          course.title.toLowerCase().includes(catLower));
    if (!matchesCategory) return false;
    if (!q) return true;
    return (
      course.title.toLowerCase().includes(q) ||
      course.subtitle.toLowerCase().includes(q) ||
      course.levelTag.toLowerCase().includes(q) ||
      course.category.toLowerCase().includes(q) ||
      (course.includedCourses ?? []).some((sub) => sub.toLowerCase().includes(q))
    );
  });

  if (sortBy === 'price_asc') {
    return [...filtered].sort((a, b) => a.price - b.price);
  }
  if (sortBy === 'price_desc') {
    return [...filtered].sort((a, b) => b.price - a.price);
  }
  if (sortBy === 'popular') {
    return [...filtered].sort((a, b) => b.enrolledCount - a.enrolledCount);
  }
  return filtered;
}

export function splitCoursesIntoSections(courses: Course[]): {
  combos: Course[];
  regular: Course[];
} {
  const combos: Course[] = [];
  const regular: Course[] = [];
  for (const c of courses) {
    if (c.isCombo) combos.push(c);
    else regular.push(c);
  }
  return { combos, regular };
}

export function calculateOrderTotal(
  items: { unitPrice: number; quantity: number }[],
  deliveryMode: 'home' | 'branch_pickup'
): { subtotal: number; deliveryFee: number; totalAmount: number } {
  const subtotal = items.reduce(
    (sum, item) => sum + Math.max(0, item.unitPrice) * Math.max(1, item.quantity),
    0
  );
  const deliveryFee = subtotal === 0 || deliveryMode === 'branch_pickup' ? 0 : 80;
  return {
    subtotal,
    deliveryFee,
    totalAmount: subtotal + deliveryFee,
  };
}

export function calculateStudentProgress(
  totalLessons: number,
  completedLessonIds: string[]
): number {
  if (totalLessons <= 0) return 0;
  const uniqueCompleted = new Set(completedLessonIds).size;
  return Math.min(100, Math.round((uniqueCompleted / totalLessons) * 100));
}

export function toSafeVideoEmbedUrl(input: string): string {
  const safe = sanitizeSafeUrl(input, '');
  if (!safe) return '';
  try {
    const parsed = new URL(safe);
    const host = parsed.hostname.toLowerCase();
    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : '';
    }
    if (host.endsWith('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        return safe;
      }
      const v = parsed.searchParams.get('v');
      if (v) {
        return `https://www.youtube.com/embed/${encodeURIComponent(v)}`;
      }
      if (parsed.pathname.startsWith('/live/')) {
        const id = parsed.pathname.replace('/live/', '').split('/')[0];
        return id ? `https://www.youtube.com/embed/${encodeURIComponent(id)}` : '';
      }
    }
    return safe;
  } catch {
    return safe;
  }
}

export function filterLessonsByTypeAndBatch(
  lessons: CourseLesson[],
  typeFilter: 'all' | LessonType = 'all',
  batchId = 'all',
  searchQuery = ''
): CourseLesson[] {
  const q = searchQuery.trim().toLowerCase();
  return [...lessons]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .filter((les) => {
      const lesType = les.lessonType ?? 'recorded';
      if (typeFilter !== 'all' && lesType !== typeFilter) return false;
      if (batchId !== 'all' && les.batchId && les.batchId !== batchId) return false;
      if (batchId !== 'all' && !les.batchId && batchId !== 'unassigned') return false;
      if (!q) return true;
      return (
        les.title.toLowerCase().includes(q) ||
        les.moduleName.toLowerCase().includes(q) ||
        (les.batchName ?? '').toLowerCase().includes(q)
      );
    });
}

export function computeBatchSeatUsage(batch: CourseBatch): {
  remainingSeats: number;
  fillPercent: number;
  isFull: boolean;
} {
  const limit = Math.max(1, batch.seatLimit || 1);
  const enrolled = Math.max(0, batch.enrolledSeats || 0);
  const remainingSeats = Math.max(0, limit - enrolled);
  const fillPercent = Math.min(100, Math.round((enrolled / limit) * 100));
  return {
    remainingSeats,
    fillPercent,
    isFull: enrolled >= limit,
  };
}

export interface PlatformStats {
  students: number;
  courses: number;
  teachers: number;
  videos: number;
}

export function computeHomepageStats(
  liveStats: PlatformStats,
  statsCard?: HomepageConfig['statsCard']
): PlatformStats {
  if (statsCard && statsCard.mode === 'custom') {
    return {
      students: Math.max(0, Math.round(statsCard.customValues.students || 0)),
      courses: Math.max(0, Math.round(statsCard.customValues.courses || 0)),
      teachers: Math.max(0, Math.round(statsCard.customValues.teachers || 0)),
      videos: Math.max(0, Math.round(statsCard.customValues.videos || 0)),
    };
  }
  return liveStats;
}

export function computeAverageRating(reviews: { rating: number }[]): string {
  if (!reviews.length) return '5.0';
  const sum = reviews.reduce((acc, r) => acc + Math.min(5, Math.max(1, r.rating || 5)), 0);
  return (sum / reviews.length).toFixed(1);
}

export function reorderListItem<T>(items: T[], index: number, direction: 'up' | 'down'): T[] {
  const targetIdx = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || index >= items.length || targetIdx < 0 || targetIdx >= items.length) {
    return items;
  }
  const copy = [...items];
  const [moved] = copy.splice(index, 1);
  copy.splice(targetIdx, 0, moved);
  return copy;
}

export interface ParsedImageUpload {
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  extension: 'png' | 'jpg' | 'webp' | 'gif';
  base64Data: string;
  estimatedBytes: number;
}

const MIME_TO_EXT: Record<string, ParsedImageUpload['extension']> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export function parseImageUploadDataUrl(
  dataUrl: string,
  maxBytes = 5 * 1024 * 1024
): { ok: true; value: ParsedImageUpload } | { ok: false; error: string } {
  const trimmed = dataUrl.trim();
  const match = /^data:(image\/[a-zA-Z0-9+.-]+);base64,([A-Za-z0-9+/=]+)$/.exec(trimmed);
  if (!match) {
    return {
      ok: false,
      error: 'Invalid image payload. Please upload a PNG, JPG, WEBP, or GIF image.',
    };
  }
  const rawMime = match[1].toLowerCase();
  const extension = MIME_TO_EXT[rawMime];
  if (!extension) {
    return {
      ok: false,
      error: 'Unsupported image format. Allowed formats: PNG, JPG, WEBP, or GIF.',
    };
  }
  const mimeType: ParsedImageUpload['mimeType'] =
    rawMime === 'image/jpg' ? 'image/jpeg' : (rawMime as ParsedImageUpload['mimeType']);
  const base64Data = match[2];
  const padding = base64Data.endsWith('==') ? 2 : base64Data.endsWith('=') ? 1 : 0;
  const estimatedBytes = Math.floor((base64Data.length * 3) / 4) - padding;
  if (estimatedBytes <= 0 || estimatedBytes > maxBytes) {
    return {
      ok: false,
      error: `Image size must be within ${Math.max(1, Math.round(maxBytes / (1024 * 1024)))} MB.`,
    };
  }
  return {
    ok: true,
    value: {
      mimeType,
      extension,
      base64Data,
      estimatedBytes,
    },
  };
}

export function calculateOrderTotalWithCoupon(
  items: { unitPrice: number; quantity: number }[],
  deliveryMode: 'home' | 'branch_pickup',
  coupon?: Coupon | null
): {
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;
  appliedCouponCode: string | null;
} {
  const base = calculateOrderTotal(items, deliveryMode);
  let discountAmount = 0;
  let appliedCouponCode: string | null = null;
  if (
    coupon &&
    coupon.active &&
    coupon.discountPercent > 0 &&
    (!coupon.appliesTo || coupon.appliesTo === 'all' || coupon.appliesTo === 'products')
  ) {
    const pct = Math.min(90, Math.max(1, coupon.discountPercent));
    discountAmount = Math.round((base.subtotal * pct) / 100);
    appliedCouponCode = coupon.code.toUpperCase();
  }
  return {
    subtotal: base.subtotal,
    discountAmount,
    deliveryFee: base.deliveryFee,
    totalAmount: Math.max(0, base.subtotal - discountAmount + base.deliveryFee),
    appliedCouponCode,
  };
}

export function parseBulkQuestionBank(
  rawInput: string,
  defaultSubject = 'English Grammar',
  defaultChapter = 'General',
  defaultDifficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium'
): { items: QuestionBankItem[]; errors: string[] } {
  const trimmed = rawInput.trim();
  const items: QuestionBankItem[] = [];
  const errors: string[] = [];
  if (!trimmed) {
    return { items, errors: ['Input cannot be empty.'] };
  }

  const normalizeAnswerIndex = (rawAns: unknown): number => {
    const str = String(rawAns ?? '0').trim().toUpperCase();
    if (str === 'A' || str === '0' || str === '1') {
      if (str === '1' && Number(rawAns) === 1) return 1;
      return str === 'A' || str === '0' ? 0 : 1;
    }
    if (str === 'B') return 1;
    if (str === 'C' || str === '2') return 2;
    if (str === 'D' || str === '3') return 3;
    const num = Number(str);
    return Number.isFinite(num) && num >= 0 && num <= 3 ? Math.floor(num) : 0;
  };

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed) as Array<Record<string, unknown>>;
      if (!Array.isArray(parsed)) {
        return { items, errors: ['JSON input must be an array of question objects.'] };
      }
      parsed.forEach((row, idx) => {
        const prompt = String(row.prompt ?? row.question ?? '').trim();
        const opts = Array.isArray(row.options)
          ? row.options.map((o) => String(o).trim()).filter(Boolean)
          : [];
        if (!prompt || opts.length < 2) {
          errors.push(`JSON item #${idx + 1}: missing prompt or at least 2 options.`);
          return;
        }
        items.push({
          id: `qb-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
          subject: String(row.subject ?? defaultSubject).trim() || defaultSubject,
          chapter: String(row.chapter ?? defaultChapter).trim() || defaultChapter,
          difficulty:
            row.difficulty === 'Easy' || row.difficulty === 'Hard' ? row.difficulty : defaultDifficulty,
          type:
            row.type === 'true_false' || row.type === 'written' ? row.type : 'mcq',
          prompt,
          options: opts.slice(0, 4),
          correctIndex: normalizeAnswerIndex(row.correctIndex ?? row.correct),
          explanation: String(row.explanation ?? 'Verified by Question Bank import.').trim(),
          marks: Math.max(1, Number(row.marks) || 1),
          createdAt: new Date().toISOString(),
        });
      });
      return { items, errors };
    } catch {
      return { items, errors: ['Malformed JSON array in bulk question import.'] };
    }
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  lines.forEach((line, idx) => {
    const parts = line.includes('|') ? line.split('|').map((p) => p.trim()) : line.split('\t').map((p) => p.trim());
    if (parts.length < 6) {
      errors.push(
        `Line ${idx + 1}: expected "Question | OptA | OptB | OptC | OptD | CorrectLetter(A-D) | [Explanation] | [Marks]"`
      );
      return;
    }
    const [prompt, optA, optB, optC, optD, correctRaw, explanationRaw, marksRaw] = parts;
    const options = [optA, optB, optC, optD].filter(Boolean);
    if (!prompt || options.length < 2) {
      errors.push(`Line ${idx + 1}: prompt and options cannot be empty.`);
      return;
    }
    const letter = correctRaw.toUpperCase();
    const correctIndex =
      letter === 'A'
        ? 0
        : letter === 'B'
          ? 1
          : letter === 'C'
            ? 2
            : letter === 'D'
              ? 3
              : normalizeAnswerIndex(correctRaw);

    items.push({
      id: `qb-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      subject: defaultSubject,
      chapter: defaultChapter,
      difficulty: defaultDifficulty,
      type: 'mcq',
      prompt,
      options,
      correctIndex: Math.min(options.length - 1, Math.max(0, correctIndex)),
      explanation: explanationRaw || 'Standard curriculum solution.',
      marks: Math.max(1, Number(marksRaw) || 1),
      createdAt: new Date().toISOString(),
    });
  });

  return { items, errors };
}

export function validateScormManifest(xmlContent: string): {
  ok: boolean;
  identifier: string;
  title: string;
  launchFile: string;
  error?: string;
} {
  const xml = xmlContent.trim();
  if (!xml || !/<manifest\b/i.test(xml)) {
    return {
      ok: false,
      identifier: '',
      title: '',
      launchFile: '',
      error: 'Missing <manifest> root element for SCORM 1.2 package.',
    };
  }
  const hasScormVersion =
    /1\.2/.test(xml) || /ADL SCORM/i.test(xml) || /adlcp/i.test(xml);
  if (!hasScormVersion) {
    return {
      ok: false,
      identifier: '',
      title: '',
      launchFile: '',
      error: 'Manifest does not declare SCORM 1.2 schema compatibility.',
    };
  }
  if (!/<organizations\b/i.test(xml) || !/<resources\b/i.test(xml)) {
    return {
      ok: false,
      identifier: '',
      title: '',
      launchFile: '',
      error: 'SCORM 1.2 manifest requires both <organizations> and <resources> nodes.',
    };
  }
  const idMatch = /<manifest[^>]*\bidentifier=["']([^"']+)["']/i.exec(xml);
  const titleMatch = /<title>([^<]+)<\/title>/i.exec(xml);
  const hrefMatch = /<resource[^>]*\bhref=["']([^"']+)["']/i.exec(xml);
  const launchFile = hrefMatch?.[1]?.trim() || 'index.html';

  if (launchFile.includes('..') || /^[a-z]+:/i.test(launchFile)) {
    return {
      ok: false,
      identifier: '',
      title: '',
      launchFile: '',
      error: 'Unsafe launch path inside SCORM 1.2 manifest.',
    };
  }

  return {
    ok: true,
    identifier: idMatch?.[1]?.trim() || `scorm-${Date.now()}`,
    title: titleMatch?.[1]?.trim() || 'Interactive SCORM 1.2 Module',
    launchFile,
  };
}

export function calculateXpAndBadges(input: {
  lessonsCompleted: number;
  examsPassed: number;
  scormCompleted: number;
  attendancePresent: number;
}): { xp: number; level: number; streakDays: number; badges: string[] } {
  const lessons = Math.max(0, input.lessonsCompleted);
  const exams = Math.max(0, input.examsPassed);
  const scorms = Math.max(0, input.scormCompleted);
  const attendance = Math.max(0, input.attendancePresent);

  const xp = lessons * 40 + exams * 120 + scorms * 150 + attendance * 25;
  const level = Math.max(1, Math.floor(xp / 250) + 1);
  const streakDays = Math.min(90, attendance + (scorms > 0 ? 1 : 0));

  const badges: string[] = [];
  if (lessons >= 1) badges.push('First Step Learner');
  if (lessons >= 5) badges.push('Consistent Scholar');
  if (exams >= 1) badges.push('Quiz Challenger');
  if (exams >= 3) badges.push('Merit Topper');
  if (scorms >= 1) badges.push('SCORM 1.2 Achiever');
  if (streakDays >= 5) badges.push('5-Day Streak');

  return { xp, level, streakDays, badges };
}

export function maskLeaderboardName(name: string, showOnLeaderboard = true): string {
  const clean = name.trim() || 'Learner';
  if (showOnLeaderboard) return clean;
  const parts = clean.split(/\s+/);
  return parts
    .map((p) => (p.length <= 2 ? `${p[0]}*` : `${p[0]}${'*'.repeat(Math.min(4, p.length - 2))}${p[p.length - 1]}`))
    .join(' ');
}

export function calculateNetPayroll(
  baseSalary: number,
  allowances: number,
  bonuses: number,
  deductions: number,
  advance: number
): number {
  return Math.max(
    0,
    Math.round((baseSalary || 0) + (allowances || 0) + (bonuses || 0) - (deductions || 0) - (advance || 0))
  );
}

export const DEFAULT_HEADER_MENU: HeaderMenuItem[] = [
  { id: 'menu-home', label: 'Home', path: '/', visible: true },
  { id: 'menu-courses', label: 'Courses', path: '/courses', visible: true },
  { id: 'menu-learn', label: 'Learn', path: '/learn', visible: true },
  { id: 'menu-instructors', label: 'Instructors', path: '/instructors', visible: true },
  { id: 'menu-exams', label: 'Exams', path: '/exams', visible: true },
  { id: 'menu-products', label: 'Products', path: '/products', visible: true },
  { id: 'menu-ebooks', label: 'E-Books', path: '/ebooks', visible: true },
  { id: 'menu-community', label: 'Community', path: '/community', visible: true },
  { id: 'menu-result', label: 'Result', path: '/board-result', visible: true },
];

export function normalizeHeaderMenu(
  items: unknown,
  fallback: HeaderMenuItem[] = DEFAULT_HEADER_MENU
): HeaderMenuItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    return fallback.map((m) => ({ ...m }));
  }
  const normalized: HeaderMenuItem[] = [];
  for (let i = 0; i < items.length; i += 1) {
    const raw = items[i] as Partial<HeaderMenuItem> | null;
    if (!raw || typeof raw !== 'object') continue;
    const label = String(raw.label ?? '').trim();
    const safePath = sanitizeSafeUrl(String(raw.path ?? '/'), '');
    if (!label || !safePath) continue;
    const badge = String(raw.badge ?? '').trim().slice(0, 12);
    normalized.push({
      id: String(raw.id ?? `menu-${i + 1}`),
      label: label.slice(0, 40),
      path: safePath,
      badge: badge || undefined,
      visible: raw.visible !== false,
      openInNewTab: Boolean(raw.openInNewTab),
    });
  }
  return normalized.length > 0 ? normalized : fallback.map((m) => ({ ...m }));
}

export function maskSecretValue(raw: string, fallbackMasked = 'Not Configured'): string {
  const clean = String(raw ?? '').trim();
  if (!clean) return fallbackMasked;
  if (clean.includes('••••')) return clean;
  if (clean.length <= 4) return '••••' + clean;
  const prefix = clean.length >= 8 ? clean.slice(0, 4) : '';
  return `${prefix}••••••••${clean.slice(-4)}`;
}

export function filterActivePaymentGateways<T extends { active?: boolean; sortOrder?: number }>(
  gateways: T[] | undefined | null
): T[] {
  if (!Array.isArray(gateways)) return [];
  return [...gateways]
    .filter((g) => g && g.active !== false)
    .sort((a, b) => (Number(a.sortOrder) || 99) - (Number(b.sortOrder) || 99));
}



