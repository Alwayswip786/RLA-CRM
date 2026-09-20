import {
  LayoutDashboard,
  Video,
  Calendar,
  CheckSquare,
  PenTool,
  BookOpen,
  Scale,
  FolderArchive,
  HelpCircle,
  Receipt,
  BellRing,
  Newspaper,
  Users,
  Bookmark,
  QrCode,
  type LucideIcon,
} from 'lucide-react';

export interface NavSubItem {
  id: string;
  title: string;
  url: string;
  badge?: string;
}

export interface NavMainItem {
  id: string;
  title: string;
  url?: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
  subItems?: NavSubItem[];
}

export interface NavGroup {
  id: number;
  label?: string;
  items: NavMainItem[];
}

export const studentSidebarItems: NavGroup[] = [
  {
    id: 1,
    label: 'Chambers & Lectures',
    items: [
      {
        id: 'overview',
        title: 'Classroom Overview',
        url: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        id: 'courses',
        title: 'My Enrolled Courses',
        url: '/dashboard/courses',
        icon: BookOpen,
        badge: 'New Hub',
        badgeColor: 'bg-[#c19b48]/20 text-[#c19b48] dark:text-[#e8cf8d] border border-[#c19b48]/40',
      },
      {
        id: 'live-classes',
        title: 'Live Classroom',
        url: '/dashboard/live-classes',
        icon: Video,
        badge: 'LIVE',
        badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse',
      },
      {
        id: 'timetable',
        title: 'Batch Timetable & Shifts',
        url: '/dashboard/timetable',
        icon: Calendar,
      },
      {
        id: 'daily-digest',
        title: 'Daily Legal Digest',
        url: '/dashboard/daily-digest',
        icon: Newspaper,
        badge: "Today's Brief",
        badgeColor: 'bg-amber-500/20 text-[#c19b48] dark:text-[#e8cf8d] border border-amber-500/30',
      },
    ],
  },
  {
    id: 2,
    label: 'Exams & Test Series',
    items: [
      {
        id: 'prelims-tests',
        title: 'Prelims Mock Tests',
        icon: CheckSquare,
        subItems: [
          {
            id: 'mock-series',
            title: 'All-India Test Series',
            url: '/dashboard/tests/mock-series',
          },
          {
            id: 'subject-quizzes',
            title: 'Bare Act Practice Quizzes',
            url: '/dashboard/tests/practice',
          },
          {
            id: 'test-results',
            title: 'Scorecards & Rank Analysis',
            url: '/dashboard/tests/results',
          },
        ],
      },
      {
        id: 'mains-writing',
        title: 'Mains Answer Writing',
        icon: PenTool,
        badge: 'DAW',
        badgeColor: 'bg-[#c19b48]/20 text-[#c19b48] dark:text-[#e8cf8d] border border-[#c19b48]/30',
        subItems: [
          {
            id: 'daily-questions',
            title: 'Daily Mains Questions',
            url: '/dashboard/mains/questions',
          },
          {
            id: 'submit-pdf',
            title: 'Upload Answer Sheets (PDF)',
            url: '/dashboard/mains/submit',
          },
          {
            id: 'evaluated-copies',
            title: 'Evaluated Copies & Remarks',
            url: '/dashboard/mains/evaluated',
          },
        ],
      },
      {
        id: 'interview-chamber',
        title: 'Mock Interview Chamber',
        url: '/dashboard/interviews',
        icon: Users,
        badge: 'New',
        badgeColor: 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30',
      },
      {
        id: 'bookmarks',
        title: 'Starred Questions & Vault',
        url: '/dashboard/bookmarks',
        icon: Bookmark,
      },
    ],
  },
  {
    id: 3,
    label: 'Knowledge Vault',
    items: [
      {
        id: 'bare-acts',
        title: 'Bare Act Decoding Notes',
        url: '/dashboard/bare-acts',
        icon: BookOpen,
      },
      {
        id: 'judgments',
        title: 'Landmark Judgments Digest',
        url: '/dashboard/judgments',
        icon: Scale,
      },
      {
        id: 'pyq-archive',
        title: 'PYQ Solved Archive',
        url: '/dashboard/pyqs',
        icon: FolderArchive,
      },
    ],
  },
  {
    id: 4,
    label: 'Campus & Student Services',
    items: [
      {
        id: 'student-id',
        title: 'Digital ID & Entry Pass',
        url: '/dashboard/student-id',
        icon: QrCode,
        badge: 'QR Gate',
        badgeColor: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
      },
      {
        id: 'doubts',
        title: 'Ask a Doubt / Mentorship',
        url: '/dashboard/doubts',
        icon: HelpCircle,
      },
      {
        id: 'fees',
        title: 'Fee Installments & Receipts',
        url: '/dashboard/fees',
        icon: Receipt,
      },
      {
        id: 'notices',
        title: 'Notice Board',
        url: '/dashboard/notices',
        icon: BellRing,
      },
    ],
  },
];
