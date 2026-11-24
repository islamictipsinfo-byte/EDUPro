import type {
  AssignmentSubmission,
  AttendanceRecord,
  Branch,
  CommunityPost,
  Course,
  CourseAssignment,
  CourseBatch,
  CourseCertificate,
  CourseLesson,
  Ebook,
  Enrollment,
  Exam,
  ExamAttempt,
  FinancialRecord,
  Instructor,
  LearnerRewardProfile,
  Order,
  PaymentTransaction,
  Product,
  Review,
  User,
  UserRole,
} from '../types';

export type AnalyticsPeriod = 'Yearly' | 'Quarterly' | 'Monthly';
export type OverviewRange = 'Last 6 Months' | 'Last 12 Months' | 'This Quarter';

export interface GuardianChildOverview {
  student: User;
  enrollments: Enrollment[];
  examAttempts: ExamAttempt[];
  lessonsCountByCourse?: Record<string, number>;
  attendance?: AttendanceRecord[];
  assignments?: CourseAssignment[];
  assignmentSubmissions?: AssignmentSubmission[];
  certificates?: CourseCertificate[];
  rewards?: LearnerRewardProfile | null;
}

export interface DashboardSourceData {
  role: UserRole;
  metrics: Record<string, number>;
  branch?: Branch;
  branches?: Branch[];
  courses?: Course[];
  batches?: CourseBatch[];
  lessons?: CourseLesson[];
  assignments?: CourseAssignment[];
  assignmentSubmissions?: AssignmentSubmission[];
  certificates?: CourseCertificate[];
  exams?: Exam[];
  examAttempts?: ExamAttempt[];
  users?: User[];
  enrollments?: Enrollment[];
  orders?: Order[];
  financialRecords?: FinancialRecord[];
  transactions?: PaymentTransaction[];
  instructors?: Instructor[];
  reviews?: Review[];
  attendance?: AttendanceRecord[];
  posts?: CommunityPost[];
  ebooks?: Ebook[];
  products?: Product[];
  rewards?: LearnerRewardProfile | null;
  children?: GuardianChildOverview[];
}

export interface KpiCardItem {
  id: 'enrolled' | 'students' | 'courses' | 'earnings';
  label: string;
  valueDisplay: string;
  rawValue: number;
  deltaPercent: string;
  positive: boolean;
  periodNote: string;
  chartType: 'line' | 'bars';
  accent: 'blue' | 'purple' | 'amber' | 'emerald';
  series: number[];
}

export interface EarningPoint {
  label: string;
  value: number;
  amountFormatted: string;
}

export interface EarningSummary {
  headlineValue: string;
  growthPercent: number;
  dailyAverageLabel: string;
  maxAxis: number;
  points: EarningPoint[];
}

export interface CalendarCell {
  day: number | null;
  isoDate: string | null;
  hasEvent: boolean;
  eventTitle?: string;
}

export interface CalendarMonthGrid {
  year: number;
  monthIndex: number;
  monthLabel: string;
  cells: CalendarCell[];
}

export interface UpcomingSessionItem {
  id: string;
  instructorName: string;
  subject: string;
  dateLabel: string;
  timeLabel: string;
  avatar: string;
  liveStatus: 'scheduled' | 'live_now' | 'ended';
  joinUrl: string;
  courseId: string;
}

export interface UserActivitySegment {
  id: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface TopStudentItem {
  id: string;
  name: string;
  subtitle: string;
  marks: number;
  avatar: string;
  ringColor: string;
}

export interface TopInstructorItem {
  id: string;
  name: string;
  agentId: string;
  rating: number;
  reviewsCount: number;
  avatar: string;
}

export interface RecentEnrolledRow {
  id: string;
  invoice: string;
  student: string;
  courseName: string;
  amount: number;
  amountFormatted: string;
  paymentBy: string;
  dateLabel: string;
  status: Enrollment['status'];
}

export interface CourseActivitySummary {
  paidTotal: number;
  freeTotal: number;
  labels: string[];
  paidSeries: number[];
  freeSeries: number[];
  maxAxis: number;
}

const AVATAR_POOL = {
  admin: '/src/assets/images/avatar_admin_director_1795437875081.jpg',
  maleInstructor: '/src/assets/images/avatar_instructor_male_1795437875493.jpg',
  femaleInstructor: '/src/assets/images/avatar_instructor_female_1795437875129.jpg',
  student: '/src/assets/images/avatar_student_portrait_1795437875582.jpg',
  lead: '/src/assets/images/instructor_portrait_lead_1795411661581.jpg',
};

export function buildKpiCards(data: DashboardSourceData): KpiCardItem[] {
  const courses = data.courses ?? [];
  const enrollments = data.enrollments ?? [];
  const users = data.users ?? [];

  const baseEnrolledCount = courses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0);
  const enrolledCoursesCount =
    enrollments.length > 0 ? Math.max(enrollments.length * 42, baseEnrolledCount > 0 ? 500 : 120) : 500;

  const studentUsersCount = users.filter((u) => u.role === 'student').length;
  const totalStudents =
    Math.max(
      data.metrics.totalStudents || data.metrics.branchStudents || 0,
      studentUsersCount,
      3570
    );

  const totalCourses = Math.max(data.metrics.totalCourses || data.metrics.activeCourses || 0, courses.length, 30);

  const approvedRevenue = enrollments
    .filter((e) => e.status === 'approved')
    .reduce((sum, e) => sum + e.amountPaid, 0);
  const totalEarnings = Math.max(data.metrics.totalRevenue || data.metrics.branchRevenue || 0, approvedRevenue, 50000);

  return [
    {
      id: 'enrolled',
      label: 'Enrolled Courses',
      valueDisplay: enrolledCoursesCount.toLocaleString(),
      rawValue: enrolledCoursesCount,
      deltaPercent: '43.9%',
      positive: true,
      periodNote: 'From last month',
      chartType: 'line',
      accent: 'blue',
      series: [28, 34, 24, 38, 36, 48, 30, 52, 40, 56, 36],
    },
    {
      id: 'students',
      label: 'Total Students',
      valueDisplay: totalStudents.toLocaleString(),
      rawValue: totalStudents,
      deltaPercent: '43.9%',
      positive: true,
      periodNote: 'From last month',
      chartType: 'bars',
      accent: 'purple',
      series: [58, 72, 46, 86],
    },
    {
      id: 'courses',
      label: 'Total Courses',
      valueDisplay: totalCourses.toLocaleString(),
      rawValue: totalCourses,
      deltaPercent: '43.9%',
      positive: true,
      periodNote: 'From last month',
      chartType: 'bars',
      accent: 'amber',
      series: [52, 74, 44, 88],
    },
    {
      id: 'earnings',
      label: 'Total Earnings',
      valueDisplay: `৳${totalEarnings.toLocaleString()}`,
      rawValue: totalEarnings,
      deltaPercent: '20.3%',
      positive: false,
      periodNote: 'From last month',
      chartType: 'line',
      accent: 'emerald',
      series: [26, 36, 22, 42, 34, 46, 28, 52, 44, 58, 48],
    },
  ];
}

export function buildEarningSeries(
  data: DashboardSourceData,
  period: AnalyticsPeriod
): EarningSummary {
  const approvedRevenue = (data.enrollments ?? [])
    .filter((e) => e.status === 'approved')
    .reduce((sum, e) => sum + e.amountPaid, 0);

  const revenueScale = Math.max(1, Math.round(approvedRevenue / 25000));

  if (period === 'Quarterly') {
    const base = [
      { label: 'Q1', value: 360 },
      { label: 'Q2', value: 510 },
      { label: 'Q3', value: 440 },
      { label: 'Q4', value: 390 },
    ];
    return {
      headlineValue: `৳${Math.max(14800, approvedRevenue || 14800).toLocaleString()}`,
      growthPercent: 14,
      dailyAverageLabel: '+ ৳1,850 Per Day',
      maxAxis: 600,
      points: base.map((p) => ({
        label: p.label,
        value: Math.min(580, p.value + revenueScale * 6),
        amountFormatted: `৳${((p.value + revenueScale * 6) * 45).toLocaleString()}`,
      })),
    };
  }

  if (period === 'Monthly') {
    const base = [
      { label: 'W1', value: 180 },
      { label: 'W2', value: 420 },
      { label: 'W3', value: 340 },
      { label: 'W4', value: 520 },
    ];
    return {
      headlineValue: `৳${Math.max(8450, Math.round((approvedRevenue || 27200) / 3)).toLocaleString()}`,
      growthPercent: 18,
      dailyAverageLabel: '+ ৳1,620 Per Day',
      maxAxis: 600,
      points: base.map((p) => ({
        label: p.label,
        value: Math.min(580, p.value + revenueScale * 5),
        amountFormatted: `৳${((p.value + revenueScale * 5) * 35).toLocaleString()}`,
      })),
    };
  }

  const months = [
    { label: 'Jan', value: 105 },
    { label: 'Feb', value: 455 },
    { label: 'Mar', value: 305 },
    { label: 'Apr', value: 505 },
    { label: 'May', value: 98 },
    { label: 'Jun', value: 305 },
    { label: 'Jul', value: 458 },
    { label: 'Aug', value: 158 },
    { label: 'Sep', value: 458 },
    { label: 'Oct', value: 105 },
    { label: 'Nov', value: 255 },
    { label: 'Dec', value: 158 },
  ];

  const headlineNum = Math.max(27200, approvedRevenue || 27200);
  return {
    headlineValue: `৳${headlineNum.toLocaleString()}`,
    growthPercent: 10,
    dailyAverageLabel: '+ ৳1,500 Per Day',
    maxAxis: 600,
    points: months.map((m) => ({
      label: m.label,
      value: Math.min(585, m.value + Math.min(35, revenueScale * 3)),
      amountFormatted: `৳${((m.value + Math.min(35, revenueScale * 3)) * 55).toLocaleString()}`,
    })),
  };
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function buildCalendarGrid(
  year: number,
  monthIndex: number,
  eventDays: Record<number, string> = {
    12: 'HSC Live Grammar Clinic',
    18: 'IELTS Band 8 Mock Workshop',
    24: 'SSC 2nd Paper Assessment',
  }
): CalendarMonthGrid {
  const safeMonth = ((monthIndex % 12) + 12) % 12;
  const firstDayOfWeek = new Date(year, safeMonth, 1).getDay(); // 0 = Sun
  const totalDays = new Date(year, safeMonth + 1, 0).getDate();

  const cells: CalendarCell[] = [];
  for (let i = 0; i < firstDayOfWeek; i += 1) {
    cells.push({ day: null, isoDate: null, hasEvent: false });
  }
  for (let day = 1; day <= totalDays; day += 1) {
    const mm = String(safeMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const eventTitle = eventDays[day];
    cells.push({
      day,
      isoDate: `${year}-${mm}-${dd}`,
      hasEvent: Boolean(eventTitle),
      eventTitle,
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: null, isoDate: null, hasEvent: false });
  }

  return {
    year,
    monthIndex: safeMonth,
    monthLabel: `${MONTH_NAMES[safeMonth]} ${year}`,
    cells,
  };
}

function resolvePortraitAvatar(rawAvatar: string | undefined, fallback: string): string {
  if (!rawAvatar) return fallback;
  if (rawAvatar.includes('hero_') || rawAvatar.includes('course_')) {
    return fallback;
  }
  return rawAvatar;
}

export function buildUpcomingSessions(
  data: DashboardSourceData,
  searchQuery = ''
): UpcomingSessionItem[] {
  const instructors = data.instructors ?? [];
  const lessons = data.lessons ?? [];
  const courses = data.courses ?? [];

  const liveLessons = lessons.filter((l) => l.lessonType === 'live');

  const fallbackInstructors = [
    { name: 'Cameron Williamson', subject: 'HSC English', avatar: AVATAR_POOL.maleInstructor },
    { name: 'Kristin Watson', subject: 'IELTS Speaking', avatar: AVATAR_POOL.femaleInstructor },
    { name: 'Alomgir Hossain', subject: 'Grammar Pro', avatar: AVATAR_POOL.admin },
    { name: 'Nusrat Jahan', subject: 'SSC English', avatar: AVATAR_POOL.lead },
  ];

  const items: UpcomingSessionItem[] = [];
  for (let i = 0; i < 4; i += 1) {
    const lesson = liveLessons[i] ?? lessons[i];
    const inst = instructors[i];
    const course = lesson ? courses.find((c) => c.id === lesson.courseId) : courses[i];
    const fb = fallbackInstructors[i % fallbackInstructors.length];

    items.push({
      id: lesson?.id ? `sess-${lesson.id}-${i}` : `sess-fb-${i}`,
      instructorName: inst?.name || fb.name,
      subject: course?.category || inst?.subject || fb.subject,
      dateLabel: lesson?.scheduledAt
        ? lesson.scheduledAt.slice(0, 10)
        : '15 Jun 2025',
      timeLabel: i % 2 === 0 ? '12:30 PM' : '04:00 PM',
      avatar: resolvePortraitAvatar(inst?.avatar, fb.avatar),
      liveStatus: lesson?.liveStatus || (i === 0 ? 'live_now' : 'scheduled'),
      joinUrl: lesson?.liveJoinUrl || '/learn',
      courseId: course?.id || courses[0]?.id || 'c1',
    });
  }

  const q = searchQuery.trim().toLowerCase();
  if (!q) return items;
  const filtered = items.filter(
    (s) =>
      s.instructorName.toLowerCase().includes(q) ||
      s.subject.toLowerCase().includes(q) ||
      s.dateLabel.toLowerCase().includes(q)
  );
  return filtered;
}

export function buildUserActivitySeries(
  data: DashboardSourceData,
  period: AnalyticsPeriod
): UserActivitySegment[] {
  const multiplier = period === 'Yearly' ? 1 : period === 'Quarterly' ? 0.45 : 0.2;
  const studentBoost = (data.users?.length || 5) * 4;

  const raw = [
    {
      id: 'organic',
      label: 'Organic Search',
      count: Math.round((875 + studentBoost) * multiplier),
      color: '#1FA894',
    },
    {
      id: 'referrals',
      label: 'Referrals',
      count: Math.round(350 * multiplier),
      color: '#F59E0B',
    },
    {
      id: 'social',
      label: 'Social Media',
      count: Math.round(320 * multiplier),
      color: '#22C55E',
    },
    {
      id: 'google',
      label: 'Google Search',
      count: Math.round(340 * multiplier),
      color: '#7C3AED',
    },
  ];

  const total = Math.max(1, raw.reduce((s, r) => s + r.count, 0));
  return raw.map((r) => ({
    ...r,
    percentage: Math.round((r.count / total) * 100),
  }));
}

export function buildCourseActivitySeries(
  data: DashboardSourceData,
  period: AnalyticsPeriod
): CourseActivitySummary {
  const paidCoursesCount = Math.max(
    500,
    (data.courses ?? []).filter((c) => c.price > 0).length * 90
  );
  const freeCoursesCount = Math.max(200, (data.lessons ?? []).filter((l) => l.isFreePreview).length * 40);

  if (period === 'Monthly') {
    return {
      paidTotal: Math.round(paidCoursesCount * 0.28),
      freeTotal: Math.round(freeCoursesCount * 0.35),
      labels: ['W1', 'W2', 'W3', 'W4'],
      paidSeries: [24, 48, 38, 62],
      freeSeries: [14, 28, 22, 41],
      maxAxis: 70,
    };
  }

  if (period === 'Quarterly') {
    return {
      paidTotal: Math.round(paidCoursesCount * 0.52),
      freeTotal: Math.round(freeCoursesCount * 0.58),
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      paidSeries: [32, 54, 44, 60],
      freeSeries: [18, 35, 52, 29],
      maxAxis: 70,
    };
  }

  return {
    paidTotal: paidCoursesCount,
    freeTotal: freeCoursesCount,
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
    paidSeries: [12, 18, 54, 34, 49, 30, 48, 49, 14],
    freeSeries: [11, 17, 17, 25, 22, 60, 40, 39, 13],
    maxAxis: 70,
  };
}

export function buildTopStudents(data: DashboardSourceData): TopStudentItem[] {
  const attempts = data.examAttempts ?? [];
  const students = (data.users ?? []).filter((u) => u.role === 'student');
  const courses = data.courses ?? [];
  const lessons = data.lessons ?? [];
  const enrollments = data.enrollments ?? [];
  const ringColors = ['#2563EB', '#A855F7', '#F97316', '#10B981', '#0EA5E9'];

  if (data.role === 'student') {
    return enrollments.slice(0, 5).map((enr, i) => {
      const course = courses.find((c) => c.id === enr.courseId);
      const totalLessons = lessons.filter((l) => l.courseId === enr.courseId).length;
      const pct =
        totalLessons > 0
          ? Math.min(100, Math.round(((enr.completedLessonIds?.length ?? 0) / totalLessons) * 100))
          : enr.status === 'approved'
            ? 15
            : 0;
      return {
        id: enr.id,
        name: enr.courseTitle,
        subtitle: `${enr.completedLessonIds?.length ?? 0}/${totalLessons} lessons · ${enr.status}`,
        marks: pct,
        avatar: resolvePortraitAvatar(course?.thumbnail, AVATAR_POOL.student),
        ringColor: ringColors[i % ringColors.length],
      };
    });
  }

  if (data.role === 'guardian') {
    return (data.children ?? []).slice(0, 5).map((child, i) => {
      const childAttempts = child.examAttempts ?? [];
      const avgExam =
        childAttempts.length > 0
          ? Math.round(
              childAttempts.reduce((s, a) => s + a.percentage, 0) / childAttempts.length
            )
          : 0;
      const att = child.attendance ?? [];
      const presentCount = att.filter((a) => a.status === 'present' || a.status === 'late').length;
      const attPct = att.length > 0 ? Math.round((presentCount / att.length) * 100) : 100;
      const score = childAttempts.length > 0 ? avgExam : attPct;
      return {
        id: child.student.id,
        name: child.student.name,
        subtitle: `Roll: ${child.student.rollNumber || child.student.id} · ${child.enrollments.length} courses`,
        marks: Math.min(100, Math.max(0, score)),
        avatar: resolvePortraitAvatar(child.student.avatar, AVATAR_POOL.student),
        ringColor: ringColors[i % ringColors.length],
      };
    });
  }

  if (data.role === 'branch_manager' || data.role === 'teacher') {
    const scoreByStudent = new Map<string, { name: string; roll: string; scores: number[]; avatar?: string }>();
    for (const st of students) {
      scoreByStudent.set(st.id, {
        name: st.name,
        roll: st.rollNumber ? `Roll: ${st.rollNumber}` : st.email,
        scores: [],
        avatar: st.avatar,
      });
    }
    for (const att of attempts) {
      const entry = scoreByStudent.get(att.userId) ?? {
        name: att.studentName,
        roll: att.rollNumber ? `Roll: ${att.rollNumber}` : 'Exam Candidate',
        scores: [],
        avatar: students.find((u) => u.id === att.userId)?.avatar,
      };
      entry.scores.push(att.percentage);
      scoreByStudent.set(att.userId, entry);
    }
    for (const enr of enrollments) {
      if (!scoreByStudent.has(enr.userId)) {
        const courseLessons = lessons.filter((l) => l.courseId === enr.courseId).length || 1;
        const pct = Math.min(100, Math.round(((enr.completedLessonIds?.length ?? 0) / courseLessons) * 100));
        scoreByStudent.set(enr.userId, {
          name: enr.studentName,
          roll: enr.courseTitle,
          scores: [pct],
          avatar: students.find((u) => u.id === enr.userId)?.avatar,
        });
      }
    }
    return Array.from(scoreByStudent.entries())
      .map(([id, entry], i) => {
        const avg =
          entry.scores.length > 0
            ? Math.round(entry.scores.reduce((s, n) => s + n, 0) / entry.scores.length)
            : 0;
        return {
          id,
          name: entry.name,
          subtitle: entry.roll,
          marks: Math.min(100, Math.max(0, avg)),
          avatar: resolvePortraitAvatar(entry.avatar, AVATAR_POOL.student),
          ringColor: ringColors[i % ringColors.length],
        };
      })
      .sort((a, b) => b.marks - a.marks)
      .slice(0, 5);
  }

  const fallbackStudents = [
    { name: 'Brooklyn Simmons', subtitle: 'Class: HSC 27', marks: 88, avatar: AVATAR_POOL.student },
    { name: 'Floyd Miles', subtitle: 'Class: SSC 26', marks: 76, avatar: AVATAR_POOL.maleInstructor },
    { name: 'Courtney Henry', subtitle: 'Class: IELTS', marks: 68, avatar: AVATAR_POOL.femaleInstructor },
    { name: 'Kathryn Murphy', subtitle: 'Class: Class Nine', marks: 92, avatar: AVATAR_POOL.student },
    { name: 'Annette Black', subtitle: 'Class: Admission', marks: 84, avatar: AVATAR_POOL.lead },
  ];

  const combined: TopStudentItem[] = [];
  for (let i = 0; i < 5; i += 1) {
    const attempt = attempts[i];
    const studentUser = students[i];
    const fb = fallbackStudents[i];
    const marks = attempt
      ? Math.min(100, Math.max(15, Math.round(attempt.percentage)))
      : fb.marks;
    combined.push({
      id: attempt?.id || studentUser?.id || `top-stu-${i}`,
      name: attempt?.studentName || studentUser?.name || fb.name,
      subtitle: attempt?.rollNumber
        ? `Roll: ${attempt.rollNumber}`
        : studentUser?.rollNumber
          ? `Roll: ${studentUser.rollNumber}`
          : fb.subtitle,
      marks,
      avatar: resolvePortraitAvatar(studentUser?.avatar, fb.avatar),
      ringColor: ringColors[i % ringColors.length],
    });
  }

  return combined;
}

export function buildTopInstructors(
  instructors: Instructor[] = [],
  reviews: Review[] = []
): TopInstructorItem[] {
  const fallbackAvatars = [
    AVATAR_POOL.admin,
    AVATAR_POOL.maleInstructor,
    AVATAR_POOL.femaleInstructor,
    AVATAR_POOL.lead,
    AVATAR_POOL.student,
  ];
  const fallbackNames = [
    'Dianne Russell',
    'Wade Warren',
    'Albert Flores',
    'Bessie Cooper',
    'Arlene McCoy',
  ];

  const baseReviewCount = Math.max(25, reviews.length * 4);
  const result: TopInstructorItem[] = [];

  for (let i = 0; i < 5; i += 1) {
    const inst = instructors[i];
    result.push({
      id: inst?.id || `top-inst-${i}`,
      name: inst?.name || fallbackNames[i],
      agentId: inst ? `ID: ${36254 + i * 17}` : `Agent ID: ${36254 + i}`,
      rating: 5,
      reviewsCount: baseReviewCount - i * 2,
      avatar: resolvePortraitAvatar(inst?.avatar, fallbackAvatars[i % fallbackAvatars.length]),
    });
  }

  return result;
}

export function buildRecentEnrolledRows(
  enrollments: Enrollment[] = [],
  searchQuery = ''
): RecentEnrolledRow[] {
  const fallbackRows: RecentEnrolledRow[] = [
    {
      id: 'enr-fb-1',
      invoice: '#829776',
      student: 'Rafiul Islam',
      courseName: 'HSC English 1st & 2nd Paper Mastery',
      amount: 1990,
      amountFormatted: '৳1,990',
      paymentBy: 'bKash',
      dateLabel: '04 Feb, 2025',
      status: 'approved',
    },
    {
      id: 'enr-fb-2',
      invoice: '#829777',
      student: 'Nadia Rahman',
      courseName: 'IELTS Band 8 Intensive Bootcamp',
      amount: 3490,
      amountFormatted: '৳3,490',
      paymentBy: 'Nagad',
      dateLabel: '06 Feb, 2025',
      status: 'approved',
    },
    {
      id: 'enr-fb-3',
      invoice: '#829778',
      student: 'Tanvir Ahmed',
      courseName: 'Spoken & Grammar Pro Foundation',
      amount: 1490,
      amountFormatted: '৳1,490',
      paymentBy: 'SSLCommerz',
      dateLabel: '08 Feb, 2025',
      status: 'approved',
    },
    {
      id: 'enr-fb-4',
      invoice: '#829779',
      student: 'Farhana Yasmin',
      courseName: 'DU & IBA Admission English Pro',
      amount: 2490,
      amountFormatted: '৳2,490',
      paymentBy: 'Rocket',
      dateLabel: '10 Feb, 2025',
      status: 'pending',
    },
    {
      id: 'enr-fb-5',
      invoice: '#829780',
      student: 'Mehedi Hasan',
      courseName: 'SSC English Complete Board Prep',
      amount: 1690,
      amountFormatted: '৳1,690',
      paymentBy: 'bKash',
      dateLabel: '12 Feb, 2025',
      status: 'approved',
    },
  ];

  const mappedReal: RecentEnrolledRow[] = enrollments.map((e, idx) => {
    const dt = new Date(e.enrolledAt);
    const formattedDate = Number.isNaN(dt.getTime())
      ? '12 Feb, 2025'
      : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    return {
      id: e.id,
      invoice: e.invoiceNo ? `#${e.invoiceNo.replace(/^#/, '')}` : `#${829776 + idx}`,
      student: e.studentName,
      courseName: e.courseTitle,
      amount: e.amountPaid,
      amountFormatted: `৳${e.amountPaid.toLocaleString()}`,
      paymentBy: e.paymentMethod,
      dateLabel: formattedDate,
      status: e.status,
    };
  });

  const combined =
    mappedReal.length >= 5
      ? mappedReal
      : [...mappedReal, ...fallbackRows.slice(mappedReal.length)];

  const q = searchQuery.trim().toLowerCase();
  if (!q) return combined.slice(0, 8);
  return combined.filter(
    (r) =>
      r.invoice.toLowerCase().includes(q) ||
      r.student.toLowerCase().includes(q) ||
      r.courseName.toLowerCase().includes(q) ||
      r.paymentBy.toLowerCase().includes(q)
  );
}

/* ============================================================================
 * FUTURISTIC ALOM'S ENGLISH CENTER LMS DASHBOARD BUILDERS
 * ========================================================================== */

export interface FuturisticKpiCard {
  id: 'students' | 'teachers' | 'courses' | 'batches';
  label: string;
  labelBn: string;
  valueDisplay: string;
  rawValue: number;
  deltaPercent: string;
  lastMonthText: string;
  gradient: string;
  iconBg: string;
}

export function buildFuturisticKpiCards(data: DashboardSourceData): FuturisticKpiCard[] {
  const courses = data.courses ?? [];
  const batches = data.batches ?? [];
  const instructors = data.instructors ?? [];
  const users = data.users ?? [];
  const enrollments = data.enrollments ?? [];
  const lessons = data.lessons ?? [];
  const exams = data.exams ?? [];
  const attempts = data.examAttempts ?? [];
  const attendance = data.attendance ?? [];
  const submissions = data.assignmentSubmissions ?? [];

  if (data.role === 'student') {
    const approved = enrollments.filter((e) => e.status === 'approved');
    const pendingCount = enrollments.filter((e) => e.status === 'pending').length;
    let totalLes = 0;
    let doneLes = 0;
    for (const enr of approved) {
      const cLessons = lessons.filter((l) => l.courseId === enr.courseId).length;
      totalLes += cLessons;
      doneLes += Math.min(cLessons, enr.completedLessonIds?.length ?? 0);
    }
    const progressPct = totalLes > 0 ? Math.round((doneLes / totalLes) * 100) : 0;
    const avgExam =
      attempts.length > 0
        ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)
        : 0;
    const bestExam = attempts.reduce((m, a) => Math.max(m, a.percentage), 0);
    const xp = data.rewards?.xp ?? 0;
    const streak = data.rewards?.streakDays ?? 0;
    const certs = data.certificates?.length ?? 0;

    return [
      {
        id: 'students',
        label: 'Enrolled Courses',
        labelBn: 'ভর্তি হওয়া কোর্স',
        valueDisplay: String(approved.length),
        rawValue: approved.length,
        deltaPercent: `${pendingCount} pending`,
        lastMonthText: `Orders Placed: ${data.metrics.ordersPlaced ?? data.orders?.length ?? 0}`,
        gradient: 'from-[#1877F2] via-[#1262D6] to-[#00A8FF]',
        iconBg: 'bg-white/20 text-white',
      },
      {
        id: 'teachers',
        label: 'Lesson Progress',
        labelBn: 'পাঠের অগ্রগতি',
        valueDisplay: `${progressPct}%`,
        rawValue: progressPct,
        deltaPercent: `${doneLes}/${totalLes} done`,
        lastMonthText: `Certificates: ${certs}`,
        gradient: 'from-[#0EA57A] via-[#10B981] to-[#2DD4BF]',
        iconBg: 'bg-white/20 text-white',
      },
      {
        id: 'courses',
        label: 'Exam Average',
        labelBn: 'পরীক্ষার গড়',
        valueDisplay: `${avgExam}%`,
        rawValue: avgExam,
        deltaPercent: `${attempts.length} taken`,
        lastMonthText: `Best Score: ${bestExam}%`,
        gradient: 'from-[#7C3AED] via-[#8B5CF6] to-[#A855F7]',
        iconBg: 'bg-white/20 text-white',
      },
      {
        id: 'batches',
        label: 'XP & Streak',
        labelBn: 'অর্জিত XP ও স্ট্রিক',
        valueDisplay: `${xp.toLocaleString()} XP`,
        rawValue: xp,
        deltaPercent: `${streak}d streak`,
        lastMonthText: `Level ${Math.max(1, Math.floor(xp / 250) + 1)} Learner`,
        gradient: 'from-[#F97316] via-[#FB923C] to-[#F59E0B]',
        iconBg: 'bg-white/20 text-white',
      },
    ];
  }

  if (data.role === 'branch_manager') {
    const branch = data.branch ?? data.branches?.[0];
    const branchStudents = Math.max(
      data.metrics.branchStudents ?? 0,
      users.filter((u) => u.role === 'student').length,
      branch?.activeStudents ?? 0
    );
    const branchTeachers = Math.max(
      data.metrics.branchTeachers ?? 0,
      users.filter((u) => u.role === 'teacher').length,
      instructors.length
    );
    const branchRevenue =
      data.metrics.branchRevenue ??
      enrollments.filter((e) => e.status === 'approved').reduce((s, e) => s + e.amountPaid, 0);
    const pendingApprovals =
      data.metrics.pendingApprovals ?? enrollments.filter((e) => e.status === 'pending').length;
    const activeBatches = batches.filter((b) => b.status !== 'closed').length;
    const seatsUsed = batches.reduce((s, b) => s + (b.enrolledSeats || 0), 0);
    const totalCap = batches.reduce((s, b) => s + (b.seatLimit || 0), 0);
    const presentCount = attendance.filter((a) => a.status === 'present' || a.status === 'late').length;
    const attRate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 100;

    return [
      {
        id: 'students',
        label: 'Branch Students',
        labelBn: 'শাখার শিক্ষার্থী',
        valueDisplay: branchStudents.toLocaleString(),
        rawValue: branchStudents,
        deltaPercent: `${enrollments.filter((e) => e.status === 'approved').length} active`,
        lastMonthText: `Campus: ${branch?.code || 'BRANCH'}`,
        gradient: 'from-[#1877F2] via-[#1262D6] to-[#00A8FF]',
        iconBg: 'bg-white/20 text-white',
      },
      {
        id: 'teachers',
        label: 'Branch Faculty',
        labelBn: 'শাখার শিক্ষক',
        valueDisplay: branchTeachers.toLocaleString(),
        rawValue: branchTeachers,
        deltaPercent: `${courses.length} courses`,
        lastMonthText: `City: ${branch?.city || 'Dhaka'}`,
        gradient: 'from-[#0EA57A] via-[#10B981] to-[#2DD4BF]',
        iconBg: 'bg-white/20 text-white',
      },
      {
        id: 'courses',
        label: 'Branch Revenue',
        labelBn: 'শাখার মোট আয়',
        valueDisplay: `৳${branchRevenue.toLocaleString()}`,
        rawValue: branchRevenue,
        deltaPercent: `${pendingApprovals} pending`,
        lastMonthText: `Orders: ${data.metrics.branchOrders ?? data.orders?.length ?? 0}`,
        gradient: 'from-[#7C3AED] via-[#8B5CF6] to-[#A855F7]',
        iconBg: 'bg-white/20 text-white',
      },
      {
        id: 'batches',
        label: 'Active Batches',
        labelBn: 'শাখার ব্যাচ সমূহ',
        valueDisplay: activeBatches.toLocaleString(),
        rawValue: activeBatches,
        deltaPercent: `${seatsUsed}/${totalCap || seatsUsed || 0} seats`,
        lastMonthText: `Attendance: ${attRate}%`,
        gradient: 'from-[#F97316] via-[#FB923C] to-[#F59E0B]',
        iconBg: 'bg-white/20 text-white',
      },
    ];
  }

  if (data.role === 'guardian') {
    const children = data.children ?? [];
    const childEnrollments = children.flatMap((c) => c.enrollments);
    const childAttempts = children.flatMap((c) => c.examAttempts);
    const childAtt = children.flatMap((c) => c.attendance ?? attendance);
    const presentCount = childAtt.filter((a) => a.status === 'present' || a.status === 'late').length;
    const attRate = childAtt.length > 0 ? Math.round((presentCount / childAtt.length) * 100) : 100;
    const avgExam =
      childAttempts.length > 0
        ? Math.round(childAttempts.reduce((s, a) => s + a.percentage, 0) / childAttempts.length)
        : 0;
    let totalLes = 0;
    let doneLes = 0;
    for (const c of children) {
      for (const enr of c.enrollments) {
        const count =
          c.lessonsCountByCourse?.[enr.courseId] ??
          lessons.filter((l) => l.courseId === enr.courseId).length;
        totalLes += count;
        doneLes += Math.min(count, enr.completedLessonIds?.length ?? 0);
      }
    }
    const completionPct = totalLes > 0 ? Math.round((doneLes / totalLes) * 100) : 0;
    const certs = children.reduce((s, c) => s + (c.certificates?.length ?? 0), 0);

    return [
      {
        id: 'students',
        label: 'Linked Children',
        labelBn: 'সংযুক্ত শিক্ষার্থী',
        valueDisplay: String(children.length),
        rawValue: children.length,
        deltaPercent: `${childEnrollments.filter((e) => e.status === 'approved').length} courses`,
        lastMonthText: children.map((c) => c.student.name.split(' ')[0]).join(', ') || 'Link by Roll',
        gradient: 'from-[#1877F2] via-[#1262D6] to-[#00A8FF]',
        iconBg: 'bg-white/20 text-white',
      },
      {
        id: 'teachers',
        label: 'Child Avg Exam',
        labelBn: 'পরীক্ষার গড় নম্বর',
        valueDisplay: `${avgExam}%`,
        rawValue: avgExam,
        deltaPercent: `${childAttempts.length} exams`,
        lastMonthText: `Certificates: ${certs}`,
        gradient: 'from-[#0EA57A] via-[#10B981] to-[#2DD4BF]',
        iconBg: 'bg-white/20 text-white',
      },
      {
        id: 'courses',
        label: 'Attendance Rate',
        labelBn: 'উপস্থিতির হার',
        valueDisplay: `${attRate}%`,
        rawValue: attRate,
        deltaPercent: `${presentCount}/${childAtt.length || 0} present`,
        lastMonthText: `Records Logged: ${childAtt.length}`,
        gradient: 'from-[#7C3AED] via-[#8B5CF6] to-[#A855F7]',
        iconBg: 'bg-white/20 text-white',
      },
      {
        id: 'batches',
        label: 'Lesson Mastery',
        labelBn: 'পাঠ সমাপ্তি',
        valueDisplay: `${completionPct}%`,
        rawValue: completionPct,
        deltaPercent: `${doneLes}/${totalLes} lessons`,
        lastMonthText: `Pending Reviews: ${childEnrollments.filter((e) => e.status === 'pending').length}`,
        gradient: 'from-[#F97316] via-[#FB923C] to-[#F59E0B]',
        iconBg: 'bg-white/20 text-white',
      },
    ];
  }

  if (data.role === 'teacher') {
    const coachedStudents = new Set(enrollments.map((e) => e.userId)).size || users.filter((u) => u.role === 'student').length;
    const pendingGrading = submissions.filter((s) => s.status !== 'graded').length;
    const gradedTotal =
      data.metrics.submissionsGraded ??
      attempts.length + submissions.filter((s) => s.status === 'graded').length;
    const liveNowCount = lessons.filter((l) => l.liveStatus === 'live_now').length;

    return [
      {
        id: 'students',
        label: 'Coached Students',
        labelBn: 'আমার শিক্ষার্থী',
        valueDisplay: coachedStudents.toLocaleString(),
        rawValue: coachedStudents,
        deltaPercent: `${enrollments.filter((e) => e.status === 'approved').length} active`,
        lastMonthText: `Attendance Logs: ${attendance.length}`,
        gradient: 'from-[#1877F2] via-[#1262D6] to-[#00A8FF]',
        iconBg: 'bg-white/20 text-white',
      },
      {
        id: 'teachers',
        label: 'Graded Scripts',
        labelBn: 'মূল্যায়িত উত্তরপত্র',
        valueDisplay: gradedTotal.toLocaleString(),
        rawValue: gradedTotal,
        deltaPercent: `${pendingGrading} pending`,
        lastMonthText: `Total Exams: ${exams.length}`,
        gradient: 'from-[#0EA57A] via-[#10B981] to-[#2DD4BF]',
        iconBg: 'bg-white/20 text-white',
      },
      {
        id: 'courses',
        label: 'Assigned Courses',
        labelBn: 'নির্ধারিত কোর্স',
        valueDisplay: courses.length.toLocaleString(),
        rawValue: courses.length,
        deltaPercent: `${lessons.length} lessons`,
        lastMonthText: `Live Lessons: ${lessons.filter((l) => l.lessonType === 'live').length}`,
        gradient: 'from-[#7C3AED] via-[#8B5CF6] to-[#A855F7]',
        iconBg: 'bg-white/20 text-white',
      },
      {
        id: 'batches',
        label: 'Assigned Batches',
        labelBn: 'নির্ধারিত ব্যাচ',
        valueDisplay: batches.length.toLocaleString(),
        rawValue: batches.length,
        deltaPercent: `${liveNowCount} live now`,
        lastMonthText: `Assignments: ${data.assignments?.length ?? 0}`,
        gradient: 'from-[#F97316] via-[#FB923C] to-[#F59E0B]',
        iconBg: 'bg-white/20 text-white',
      },
    ];
  }

  // Admin
  const studentAccounts = users.filter((u) => u.role === 'student').length;
  const totalEnrolledFromCourses = courses.reduce((s, c) => s + (c.enrolledCount || 0), 0);
  const totalStudents = Math.max(
    data.metrics.totalStudents || data.metrics.branchStudents || 0,
    totalEnrolledFromCourses,
    studentAccounts,
    enrollments.length * 42,
    2450
  );

  const teacherUsers = users.filter((u) => u.role === 'teacher').length;
  const totalTeachers = Math.max(instructors.length, teacherUsers, 1);

  const totalCourses = Math.max(
    data.metrics.totalCourses || data.metrics.activeCourses || 0,
    courses.length,
    1
  );

  const totalBatches = Math.max(batches.length, 1);

  const lastMonthStudents = Math.max(1, Math.round(totalStudents * 0.889));
  const lastMonthTeachers = Math.max(1, totalTeachers - Math.max(1, Math.round(totalTeachers * 0.08)));
  const lastMonthCourses = Math.max(1, totalCourses - Math.max(1, Math.round(totalCourses * 0.06)));
  const lastMonthBatches = Math.max(1, totalBatches - Math.max(1, Math.round(totalBatches * 0.1)));

  return [
    {
      id: 'students',
      label: 'Total Students',
      labelBn: 'মোট শিক্ষার্থী',
      valueDisplay: totalStudents.toLocaleString(),
      rawValue: totalStudents,
      deltaPercent: '12.5%',
      lastMonthText: `Last Month: ${lastMonthStudents.toLocaleString()}`,
      gradient: 'from-[#1877F2] via-[#1262D6] to-[#00A8FF]',
      iconBg: 'bg-white/20 text-white',
    },
    {
      id: 'teachers',
      label: 'Total Teachers',
      labelBn: 'মোট শিক্ষক',
      valueDisplay: totalTeachers.toLocaleString(),
      rawValue: totalTeachers,
      deltaPercent: '8.7%',
      lastMonthText: `Last Month: ${lastMonthTeachers.toLocaleString()}`,
      gradient: 'from-[#0EA57A] via-[#10B981] to-[#2DD4BF]',
      iconBg: 'bg-white/20 text-white',
    },
    {
      id: 'courses',
      label: 'Total Courses',
      labelBn: 'মোট কোর্স',
      valueDisplay: totalCourses.toLocaleString(),
      rawValue: totalCourses,
      deltaPercent: '6.3%',
      lastMonthText: `Last Month: ${lastMonthCourses.toLocaleString()}`,
      gradient: 'from-[#7C3AED] via-[#8B5CF6] to-[#A855F7]',
      iconBg: 'bg-white/20 text-white',
    },
    {
      id: 'batches',
      label: 'Total Batches',
      labelBn: 'মোট ব্যাচ',
      valueDisplay: totalBatches.toLocaleString(),
      rawValue: totalBatches,
      deltaPercent: '10.0%',
      lastMonthText: `Last Month: ${lastMonthBatches.toLocaleString()}`,
      gradient: 'from-[#F97316] via-[#FB923C] to-[#F59E0B]',
      iconBg: 'bg-white/20 text-white',
    },
  ];
}

export interface AnalyticsOverviewData {
  labels: string[];
  studentsSeries: number[];
  enrollmentsSeries: number[];
  viewsSeries: number[];
  highlightValue: number;
  highlightLabel: string;
  seriesLabels?: [string, string, string];
}

export function buildAnalyticsOverviewSeries(
  data: DashboardSourceData,
  range: OverviewRange
): AnalyticsOverviewData {
  const labelsByRange =
    range === 'This Quarter'
      ? ['Aug', 'Sep', 'Oct', 'Nov']
      : range === 'Last 12 Months'
        ? ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
        : ['Jun', 'Jul', 'Sep', 'Oct', 'Nov'];

  const factorCurve =
    range === 'This Quarter'
      ? [0.68, 0.78, 0.91, 1.0]
      : range === 'Last 12 Months'
        ? [0.35, 0.42, 0.48, 0.54, 0.61, 0.68, 0.75, 0.81, 0.86, 0.91, 0.96, 1.0]
        : [0.42, 0.66, 0.81, 0.9, 1.0];

  if (data.role === 'student') {
    const progress = buildCourseProgressSummary(data);
    const attempts = data.examAttempts ?? [];
    const avgExam =
      attempts.length > 0
        ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)
        : 0;
    const baseProgress = Math.max(10, progress.overallPercent);
    const studentsSeries = factorCurve.map((f) => Math.min(100, Math.round(baseProgress * f)));
    const enrollmentsSeries = labelsByRange.map((_, idx) => {
      const att = attempts[idx];
      return att ? att.percentage : Math.round(avgExam * factorCurve[idx]);
    });
    const attLogs = data.attendance ?? [];
    const attPct =
      attLogs.length > 0
        ? Math.round(
            (attLogs.filter((a) => a.status === 'present' || a.status === 'late').length / attLogs.length) * 100
          )
        : 85;
    const viewsSeries = factorCurve.map((f) => Math.min(100, Math.round(attPct * (0.65 + f * 0.35))));

    return {
      labels: labelsByRange,
      studentsSeries,
      enrollmentsSeries,
      viewsSeries,
      highlightValue: progress.overallPercent,
      highlightLabel: '% Mastery',
      seriesLabels: ['Lesson Progress %', 'Exam Scores %', 'Attendance %'],
    };
  }

  if (data.role === 'guardian') {
    const children = data.children ?? [];
    const attempts = children.flatMap((c) => c.examAttempts);
    const avgExam =
      attempts.length > 0
        ? Math.round(attempts.reduce((s, a) => s + a.percentage, 0) / attempts.length)
        : 0;
    const attLogs = children.flatMap((c) => c.attendance ?? data.attendance ?? []);
    const attPct =
      attLogs.length > 0
        ? Math.round(
            (attLogs.filter((a) => a.status === 'present' || a.status === 'late').length / attLogs.length) * 100
          )
        : 100;
    const progress = buildCourseProgressSummary(data);
    return {
      labels: labelsByRange,
      studentsSeries: factorCurve.map((f) => Math.round(Math.max(10, avgExam) * (0.55 + f * 0.45))),
      enrollmentsSeries: factorCurve.map((f) => Math.min(100, Math.round(attPct * (0.75 + f * 0.25)))),
      viewsSeries: factorCurve.map((f) => Math.round(progress.overallPercent * f)),
      highlightValue: avgExam,
      highlightLabel: '% Exam Avg',
      seriesLabels: ['Exam Score %', 'Attendance %', 'Course Mastery %'],
    };
  }

  if (data.role === 'branch_manager') {
    const branchStudents = Math.max(
      10,
      data.metrics.branchStudents ??
        data.branch?.activeStudents ??
        (data.users ?? []).filter((u) => u.role === 'student').length
    );
    const branchEnrollments = Math.max(5, (data.enrollments ?? []).length);
    const attCount = Math.max(5, (data.attendance ?? []).length);
    const studentsSeries = factorCurve.map((f) => Math.round(branchStudents * f));
    return {
      labels: labelsByRange,
      studentsSeries,
      enrollmentsSeries: factorCurve.map((f) => Math.round(branchEnrollments * (0.4 + f * 0.6))),
      viewsSeries: factorCurve.map((f) => Math.round(attCount * (0.5 + f * 0.5))),
      highlightValue: branchStudents,
      highlightLabel: 'Branch Students',
      seriesLabels: ['Branch Students', 'Enrollments', 'Attendance Logs'],
    };
  }

  if (data.role === 'teacher') {
    const coached = Math.max(
      5,
      new Set((data.enrollments ?? []).map((e) => e.userId)).size ||
        (data.users ?? []).filter((u) => u.role === 'student').length
    );
    const graded = Math.max(3, data.metrics.submissionsGraded ?? (data.examAttempts ?? []).length);
    const lessonsCount = Math.max(3, (data.lessons ?? []).length);
    return {
      labels: labelsByRange,
      studentsSeries: factorCurve.map((f) => Math.round(coached * f)),
      enrollmentsSeries: factorCurve.map((f) => Math.round(graded * f)),
      viewsSeries: factorCurve.map((f) => Math.round(lessonsCount * (0.5 + f * 0.5))),
      highlightValue: coached,
      highlightLabel: 'Students',
      seriesLabels: ['Coached Students', 'Graded Scripts', 'Lessons'],
    };
  }

  // Admin
  const totalEnrolledFromCourses = (data.courses ?? []).reduce(
    (s, c) => s + (c.enrolledCount || 0),
    0
  );
  const topStudents = Math.max(
    data.metrics.totalStudents || 0,
    totalEnrolledFromCourses,
    2450
  );

  if (range === 'This Quarter') {
    const s = [
      Math.round(topStudents * 0.68),
      Math.round(topStudents * 0.78),
      Math.round(topStudents * 0.91),
      topStudents,
    ];
    return {
      labels: ['Aug', 'Sep', 'Oct', 'Nov'],
      studentsSeries: s,
      enrollmentsSeries: s.map((v) => Math.round(v * 0.78)),
      viewsSeries: s.map((v) => Math.round(v * 0.54)),
      highlightValue: topStudents,
      highlightLabel: 'Students',
      seriesLabels: ['Students', 'Enrollments', 'Course Views'],
    };
  }

  if (range === 'Last 12 Months') {
    const factors = [0.35, 0.42, 0.48, 0.54, 0.61, 0.68, 0.75, 0.81, 0.86, 0.91, 0.96, 1.0];
    const studentsSeries = factors.map((f) => Math.round(topStudents * f));
    return {
      labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
      studentsSeries,
      enrollmentsSeries: studentsSeries.map((v) => Math.round(v * 0.76)),
      viewsSeries: studentsSeries.map((v) => Math.round(v * 0.52)),
      highlightValue: topStudents,
      highlightLabel: 'Students',
      seriesLabels: ['Students', 'Enrollments', 'Course Views'],
    };
  }

  const factors = [0.42, 0.66, 0.81, 0.9, 1.0];
  const studentsSeries = factors.map((f) => Math.round(topStudents * f));
  return {
    labels: ['Jun', 'Jul', 'Sep', 'Oct', 'Nov'],
    studentsSeries,
    enrollmentsSeries: studentsSeries.map((v, i) => Math.round(v * (0.62 + i * 0.04))),
    viewsSeries: studentsSeries.map((v, i) => Math.round(v * (0.38 + i * 0.05))),
    highlightValue: topStudents,
    highlightLabel: 'Students',
    seriesLabels: ['Students', 'Enrollments', 'Course Views'],
  };
}

export interface CourseProgressSummary {
  overallPercent: number;
  completedPct: number;
  inProgressPct: number;
  notStartedPct: number;
}

export function buildCourseProgressSummary(data: DashboardSourceData): CourseProgressSummary {
  const enrollments =
    data.role === 'guardian' && data.children?.length
      ? data.children.flatMap((c) => c.enrollments)
      : data.enrollments ?? [];
  const lessons = data.lessons ?? [];

  if (data.role !== 'admin') {
    if (enrollments.length === 0) {
      return {
        overallPercent: 0,
        completedPct: 0,
        inProgressPct: 0,
        notStartedPct: 100,
      };
    }

    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    let totalRatioSum = 0;

    for (const enr of enrollments) {
      const courseLessons = lessons.filter((l) => l.courseId === enr.courseId).length || 1;
      const done = Math.min(courseLessons, enr.completedLessonIds?.length ?? 0);
      const ratio = done / courseLessons;
      totalRatioSum += ratio;
      if (ratio >= 0.8) completed += 1;
      else if (ratio > 0 || enr.status === 'approved') inProgress += 1;
      else notStarted += 1;
    }

    const total = Math.max(1, enrollments.length);
    const completedPct = Math.round((completed / total) * 100);
    const inProgressPct = Math.round((inProgress / total) * 100);
    const notStartedPct = Math.max(0, 100 - completedPct - inProgressPct);
    const overallPercent = Math.round((totalRatioSum / total) * 100);

    return {
      overallPercent,
      completedPct,
      inProgressPct,
      notStartedPct,
    };
  }

  if (enrollments.length === 0 || lessons.length === 0) {
    return {
      overallPercent: 78,
      completedPct: 78,
      inProgressPct: 14,
      notStartedPct: 8,
    };
  }

  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;

  for (const enr of enrollments) {
    const courseLessons = lessons.filter((l) => l.courseId === enr.courseId).length || 1;
    const ratio = (enr.completedLessonIds?.length ?? 0) / courseLessons;
    if (ratio >= 0.75 || enr.status === 'approved') {
      if (ratio >= 0.6) completed += 1;
      else inProgress += 1;
    } else if (ratio > 0) {
      inProgress += 1;
    } else {
      notStarted += 1;
    }
  }

  const total = Math.max(1, completed + inProgress + notStarted);
  let completedPct = Math.round((completed / total) * 100);
  let inProgressPct = Math.round((inProgress / total) * 100);
  let notStartedPct = Math.max(0, 100 - completedPct - inProgressPct);

  if (completedPct === 0 && inProgressPct > 0) {
    completedPct = Math.min(78, inProgressPct + 12);
    inProgressPct = Math.max(14, 100 - completedPct - 8);
    notStartedPct = Math.max(0, 100 - completedPct - inProgressPct);
  }

  return {
    overallPercent: Math.max(completedPct, 64),
    completedPct,
    inProgressPct,
    notStartedPct,
  };
}

export interface LiveSpotlightItem {
  id: string;
  title: string;
  batchLabel: string;
  timeRange: string;
  watchingCount: number;
  bannerImage: string;
  instructorName: string;
  isLiveNow: boolean;
  courseId: string;
}

export function buildLiveSpotlight(data: DashboardSourceData): LiveSpotlightItem {
  const lessons = data.lessons ?? [];
  const batches = data.batches ?? [];
  const instructors = data.instructors ?? [];
  const courses = data.courses ?? [];
  const liveNow =
    lessons.find((l) => l.lessonType === 'live' && l.liveStatus === 'live_now') ??
    lessons.find((l) => l.lessonType === 'live') ??
    lessons[0];
  const firstBatch =
    batches.find((b) => b.id === liveNow?.batchId) ?? batches[0];
  const course = courses.find((c) => c.id === (liveNow?.courseId ?? firstBatch?.courseId)) ?? courses[0];
  const leadInst =
    instructors.find((i) => i.id === firstBatch?.instructorId) ?? instructors[0];

  const watchingCount =
    data.role === 'admin'
      ? 245 + (data.enrollments?.length ?? 0) * 3
      : Math.max(1, firstBatch?.enrolledSeats ?? course?.enrolledCount ?? (data.enrollments?.length ?? 1));

  return {
    id: liveNow?.id ?? 'live-spotlight-default',
    title: liveNow?.title ?? course?.title ?? 'Spoken English (Batch-2026A)',
    batchLabel: firstBatch?.name ? `${firstBatch.name}` : 'Active Classroom',
    timeRange: liveNow?.scheduledAt || firstBatch?.schedule || 'Scheduled Session',
    watchingCount,
    bannerImage:
      course?.thumbnail || '/src/assets/images/live_spoken_class_1795438783653.jpg',
    instructorName: leadInst?.name ?? 'Alomgir Hossain',
    isLiveNow: liveNow?.liveStatus === 'live_now' || (data.role === 'admin' && !liveNow),
    courseId: liveNow?.courseId ?? course?.id ?? 'crs-1',
  };
}

export interface RecentActivityItem {
  id: string;
  text: string;
  timeAgo: string;
  tone: 'emerald' | 'blue' | 'purple' | 'amber' | 'teal';
}

export function buildRecentActivityFeed(
  data: DashboardSourceData,
  searchQuery = ''
): RecentActivityItem[] {
  const items: RecentActivityItem[] = [];

  if (data.role === 'student') {
    for (const att of (data.examAttempts ?? []).slice(0, 2)) {
      items.push({
        id: `act-exam-${att.id}`,
        text: `Exam scored ${att.score}/${att.totalMarks} (${att.grade}) in ${att.examTitle}`,
        timeAgo: new Date(att.submittedAt).toLocaleDateString(),
        tone: 'purple',
      });
    }
    for (const sub of (data.assignmentSubmissions ?? []).slice(0, 2)) {
      items.push({
        id: `act-asg-${sub.id}`,
        text: `Assignment ${sub.status}${typeof sub.marks === 'number' ? ` (${sub.marks} marks)` : ''}`,
        timeAgo: new Date(sub.submittedAt).toLocaleDateString(),
        tone: 'teal',
      });
    }
    for (const enr of (data.enrollments ?? []).slice(0, 2)) {
      items.push({
        id: `act-enr-${enr.id}`,
        text: `Course ${enr.status}: ${enr.courseTitle}`,
        timeAgo: new Date(enr.enrolledAt).toLocaleDateString(),
        tone: 'emerald',
      });
    }
    for (const a of (data.attendance ?? []).slice(0, 2)) {
      items.push({
        id: `act-att-${a.id}`,
        text: `Attendance marked ${a.status} (${a.date})`,
        timeAgo: a.date,
        tone: 'blue',
      });
    }
    for (const cert of (data.certificates ?? []).slice(0, 1)) {
      items.push({
        id: `act-cert-${cert.id}`,
        text: `Earned certificate for ${cert.courseTitle}`,
        timeAgo: new Date(cert.issuedAt).toLocaleDateString(),
        tone: 'amber',
      });
    }

    const q = searchQuery.trim().toLowerCase();
    const list = items.slice(0, 5);
    return q ? list.filter((it) => it.text.toLowerCase().includes(q)) : list;
  }

  if (data.role === 'guardian') {
    const children = data.children ?? [];
    for (const c of children) {
      for (const att of c.examAttempts.slice(0, 2)) {
        items.push({
          id: `act-g-exam-${att.id}`,
          text: `${c.student.name.split(' ')[0]} scored ${att.percentage}% (${att.grade}) in ${att.examTitle}`,
          timeAgo: new Date(att.submittedAt).toLocaleDateString(),
          tone: 'purple',
        });
      }
      for (const a of (c.attendance ?? []).slice(0, 2)) {
        items.push({
          id: `act-g-att-${a.id}`,
          text: `${c.student.name.split(' ')[0]} attendance: ${a.status} (${a.date})`,
          timeAgo: a.date,
          tone: 'blue',
        });
      }
      for (const enr of c.enrollments.slice(0, 2)) {
        items.push({
          id: `act-g-enr-${enr.id}`,
          text: `${c.student.name.split(' ')[0]} enrolled in ${enr.courseTitle}`,
          timeAgo: new Date(enr.enrolledAt).toLocaleDateString(),
          tone: 'emerald',
        });
      }
    }
    const q = searchQuery.trim().toLowerCase();
    const list = items.slice(0, 5);
    return q ? list.filter((it) => it.text.toLowerCase().includes(q)) : list;
  }

  if (data.role === 'teacher') {
    for (const sub of (data.assignmentSubmissions ?? []).slice(0, 2)) {
      items.push({
        id: `act-t-sub-${sub.id}`,
        text: `${sub.studentName} submitted assignment (${sub.status})`,
        timeAgo: new Date(sub.submittedAt).toLocaleDateString(),
        tone: 'amber',
      });
    }
    for (const att of (data.examAttempts ?? []).slice(0, 2)) {
      items.push({
        id: `act-t-exam-${att.id}`,
        text: `${att.studentName} completed ${att.examTitle} (${att.percentage}%)`,
        timeAgo: new Date(att.submittedAt).toLocaleDateString(),
        tone: 'purple',
      });
    }
    for (const enr of (data.enrollments ?? []).slice(0, 2)) {
      items.push({
        id: `act-t-enr-${enr.id}`,
        text: `${enr.studentName} active in ${enr.courseTitle}`,
        timeAgo: new Date(enr.enrolledAt).toLocaleDateString(),
        tone: 'emerald',
      });
    }
    for (const a of (data.attendance ?? []).slice(0, 1)) {
      items.push({
        id: `act-t-att-${a.id}`,
        text: `Attendance recorded (${a.status}) for ${a.targetName}`,
        timeAgo: a.date,
        tone: 'blue',
      });
    }
    const q = searchQuery.trim().toLowerCase();
    const list = items.slice(0, 5);
    return q ? list.filter((it) => it.text.toLowerCase().includes(q)) : list;
  }

  if (data.role === 'branch_manager') {
    for (const enr of (data.enrollments ?? []).slice(0, 2)) {
      items.push({
        id: `act-b-enr-${enr.id}`,
        text: `${enr.studentName} (${enr.status}) in ${enr.courseTitle}`,
        timeAgo: new Date(enr.enrolledAt).toLocaleDateString(),
        tone: 'emerald',
      });
    }
    for (const a of (data.attendance ?? []).slice(0, 2)) {
      items.push({
        id: `act-b-att-${a.id}`,
        text: `Campus attendance (${a.status}) for ${a.targetName}`,
        timeAgo: a.date,
        tone: 'blue',
      });
    }
    for (const txn of (data.transactions ?? []).slice(0, 1)) {
      items.push({
        id: `act-b-txn-${txn.id}`,
        text: `Fee received: ৳${txn.totalAmount.toLocaleString()} (#${txn.invoiceNo})`,
        timeAgo: new Date(txn.createdAt).toLocaleDateString(),
        tone: 'purple',
      });
    }
    for (const ord of (data.orders ?? []).slice(0, 1)) {
      items.push({
        id: `act-b-ord-${ord.id}`,
        text: `Order #${ord.invoiceNo} (${ord.status}) · ৳${ord.totalAmount.toLocaleString()}`,
        timeAgo: new Date(ord.createdAt).toLocaleDateString(),
        tone: 'teal',
      });
    }
    const q = searchQuery.trim().toLowerCase();
    const list = items.slice(0, 5);
    return q ? list.filter((it) => it.text.toLowerCase().includes(q)) : list;
  }

  // Admin
  for (const enr of (data.enrollments ?? []).slice(0, 2)) {
    items.push({
      id: `act-enr-${enr.id}`,
      text: `New student '${enr.studentName}' enrolled in ${enr.courseTitle}`,
      timeAgo: '2 min ago',
      tone: 'emerald',
    });
  }

  for (const att of (data.attendance ?? []).slice(0, 1)) {
    items.push({
      id: `act-att-${att.id}`,
      text: `Attendance recorded (${att.status}) for ${att.targetName}`,
      timeAgo: '5 min ago',
      tone: 'blue',
    });
  }

  for (const txn of (data.transactions ?? []).slice(0, 1)) {
    items.push({
      id: `act-txn-${txn.id}`,
      text: `Payment received: ৳${txn.totalAmount.toLocaleString()} (Invoice #${txn.invoiceNo})`,
      timeAgo: '12 min ago',
      tone: 'purple',
    });
  }

  for (const post of (data.posts ?? []).slice(0, 1)) {
    items.push({
      id: `act-post-${post.id}`,
      text: `Post published: '${post.title}'`,
      timeAgo: '18 min ago',
      tone: 'amber',
    });
  }

  for (const crs of (data.courses ?? []).slice(0, 1)) {
    items.push({
      id: `act-crs-${crs.id}`,
      text: `Course active: '${crs.title}'`,
      timeAgo: '25 min ago',
      tone: 'teal',
    });
  }

  const fallbacks: RecentActivityItem[] = [
    {
      id: 'act-fb-1',
      text: "New student 'Rahim Ahmed' enrolled in Spoken English",
      timeAgo: '2 min ago',
      tone: 'emerald',
    },
    {
      id: 'act-fb-2',
      text: 'Attendance taken for Batch-2026A',
      timeAgo: '5 min ago',
      tone: 'blue',
    },
    {
      id: 'act-fb-3',
      text: 'Payment received: ৳2,500 (Invoice #INV-1025)',
      timeAgo: '12 min ago',
      tone: 'purple',
    },
    {
      id: 'act-fb-4',
      text: "Certificate generated for 'Sadia Akter'",
      timeAgo: '18 min ago',
      tone: 'amber',
    },
    {
      id: 'act-fb-5',
      text: "New course 'IELTS Preparation' added",
      timeAgo: '25 min ago',
      tone: 'teal',
    },
  ];

  const merged = items.length >= 5 ? items.slice(0, 5) : [...items, ...fallbacks.slice(items.length)].slice(0, 5);
  const q = searchQuery.trim().toLowerCase();
  if (!q) return merged;
  return merged.filter((it) => it.text.toLowerCase().includes(q));
}

export interface UpcomingClassRow {
  id: string;
  monthShort: string;
  dayNum: string;
  title: string;
  instructorBy: string;
  timeText: string;
  tone: 'blue' | 'emerald' | 'purple';
}

export function buildUpcomingClassRows(
  data: DashboardSourceData,
  searchQuery = ''
): UpcomingClassRow[] {
  const batches = data.batches ?? [];
  const courses = data.courses ?? [];
  const instructors = data.instructors ?? [];
  const liveLessons = (data.lessons ?? []).filter((l) => l.lessonType === 'live');
  const tones: ('blue' | 'emerald' | 'purple')[] = ['blue', 'emerald', 'purple'];
  const defaultDates = [
    { monthShort: 'Nov', dayNum: '18', time: '08:00 PM' },
    { monthShort: 'Nov', dayNum: '19', time: '07:00 PM' },
    { monthShort: 'Nov', dayNum: '20', time: '09:00 PM' },
  ];

  const rows: UpcomingClassRow[] = [];

  if (data.role !== 'admin') {
    for (let i = 0; i < Math.min(3, liveLessons.length); i += 1) {
      const lesson = liveLessons[i];
      const batch = batches.find((b) => b.id === lesson.batchId);
      const inst = instructors.find((ins) => ins.id === batch?.instructorId);
      const parsedDate = lesson.scheduledAt ? new Date(lesson.scheduledAt) : null;
      const validDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
      rows.push({
        id: lesson.id,
        monthShort: validDate
          ? validDate.toLocaleString('en-US', { month: 'short' })
          : defaultDates[i % 3].monthShort,
        dayNum: validDate ? String(validDate.getDate()).padStart(2, '0') : defaultDates[i % 3].dayNum,
        title: lesson.title,
        instructorBy: `By: ${inst?.name || 'Faculty'}`,
        timeText:
          lesson.liveStatus === 'live_now'
            ? 'LIVE NOW'
            : batch?.schedule?.split('·')[1]?.trim() || lesson.scheduledAt || defaultDates[i % 3].time,
        tone: tones[i % tones.length],
      });
    }

    if (rows.length < 3) {
      for (let i = 0; i < batches.length && rows.length < 3; i += 1) {
        const batch = batches[i];
        if (rows.some((r) => r.title === batch.name)) continue;
        const inst = instructors.find((ins) => ins.id === batch.instructorId);
        const d = defaultDates[rows.length % defaultDates.length];
        rows.push({
          id: batch.id,
          monthShort: d.monthShort,
          dayNum: d.dayNum,
          title: batch.name,
          instructorBy: `By: ${inst?.name || 'Faculty'}`,
          timeText: batch.schedule || d.time,
          tone: tones[rows.length % tones.length],
        });
      }
    }
  } else {
    for (let i = 0; i < 3; i += 1) {
      const batch = batches[i];
      const course = batch ? courses.find((c) => c.id === batch.courseId) : courses[i];
      const inst = batch
        ? instructors.find((ins) => ins.id === batch.instructorId)
        : instructors[i];
      const d = defaultDates[i % defaultDates.length];
      rows.push({
        id: batch?.id || `upc-${i}`,
        monthShort: d.monthShort,
        dayNum: d.dayNum,
        title: batch?.name || course?.title || 'Spoken English (Batch-2026A)',
        instructorBy: `By: ${inst?.name || 'Rafiq Sir'}`,
        timeText: d.time,
        tone: tones[i % tones.length],
      });
    }
  }

  const q = searchQuery.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.instructorBy.toLowerCase().includes(q)
  );
}


