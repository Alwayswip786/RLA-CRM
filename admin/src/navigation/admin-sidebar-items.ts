import {
  LayoutDashboard,
  UserPlus,
  BookOpen,
  Video,
  Calendar,
  Newspaper,
  FileCheck,
  CheckSquare,
  Scale,
  Gavel,
  FolderArchive,
  MessageSquare,
  CreditCard,
  BellRing,
  ShieldCheck,
  Award,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavSubItem {
  id: string;
  title: string;
  url: string;
  badge?: string;
}

export interface AdminNavMainItem {
  id: string;
  title: string;
  url?: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
  subItems?: AdminNavSubItem[];
}

export interface AdminNavGroup {
  id: number;
  label: string;
  items: AdminNavMainItem[];
}

export const adminSidebarItems: AdminNavGroup[] = [
  {
    id: 1,
    label: 'Executive Operations',
    items: [
      {
        id: 'overview',
        title: 'Command Center',
        url: '/',
        icon: LayoutDashboard,
      },
      {
        id: 'leads',
        title: 'Admissions & Leads CRM',
        url: '/leads',
        icon: UserPlus,
        badge: '18 Hot',
        badgeColor: 'bg-[#C19B48]/20 text-[#E8CF8D] border border-[#C19B48]/40',
        subItems: [
          {
            id: 'leads-pipeline',
            title: 'Inquiry Pipeline & Kanban',
            url: '/leads/pipeline',
          },
          {
            id: 'leads-demos',
            title: 'Trial & Demo Registrations',
            url: '/leads/demos',
            badge: 'Today: 4',
          },
          {
            id: 'leads-enroll',
            title: 'Direct Admission Form',
            url: '/leads/new-enrollment',
          },
        ],
      },
    ],
  },
  {
    id: 2,
    label: 'Academic & Classroom CMS',
    items: [
      {
        id: 'courses',
        title: 'Course & Batch Manager',
        url: '/courses',
        icon: BookOpen,
        subItems: [
          {
            id: 'courses-all',
            title: 'Course Offerings & Curricula',
            url: '/courses/all',
          },
          {
            id: 'courses-batches',
            title: 'Active Batches & Shifts',
            url: '/courses/batches',
          },
          {
            id: 'courses-recordings',
            title: 'Recorded Lecture Archive',
            url: '/courses/recordings',
          },
        ],
      },
      {
        id: 'live-classes',
        title: 'Live Classroom & Streams',
        url: '/live-classes',
        icon: Video,
        badge: 'LIVE',
        badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse',
      },
      {
        id: 'timetable',
        title: 'Timetable & Shift Planner',
        url: '/timetable',
        icon: Calendar,
      },
      {
        id: 'daily-digest',
        title: 'Daily Legal Digest CMS',
        url: '/daily-digest',
        icon: Newspaper,
        badge: "Today's Brief",
        badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      },
    ],
  },
  {
    id: 3,
    label: 'Exams & Evaluation Center',
    items: [
      {
        id: 'mains-evaluation',
        title: 'Mains Evaluation Desk',
        url: '/mains-evaluation',
        icon: FileCheck,
        badge: '14 Pending',
        badgeColor: 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40',
        subItems: [
          {
            id: 'mains-inbox',
            title: 'Pending Answer Sheets (PDF)',
            url: '/mains-evaluation/inbox',
            badge: '14',
          },
          {
            id: 'mains-evaluated',
            title: 'Graded Copies & Feedback',
            url: '/mains-evaluation/graded',
          },
          {
            id: 'mains-questions',
            title: 'Daily Mains Question Bank',
            url: '/mains-evaluation/questions',
          },
        ],
      },
      {
        id: 'tests',
        title: 'Prelims Test Series Builder',
        url: '/tests',
        icon: CheckSquare,
        subItems: [
          {
            id: 'tests-all',
            title: 'Mock Test Papers & Exams',
            url: '/tests/all',
          },
          {
            id: 'tests-question-bank',
            title: 'Bare Act MCQ Question Bank',
            url: '/tests/bank',
          },
          {
            id: 'tests-ranks',
            title: 'All-India Rank Computation',
            url: '/tests/rankings',
          },
        ],
      },
      {
        id: 'interviews',
        title: 'Mock Interview Board',
        url: '/interviews',
        icon: Award,
        badge: '3 Slots',
        badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
      },
    ],
  },
  {
    id: 4,
    label: 'Legal Knowledge Vault',
    items: [
      {
        id: 'bare-acts',
        title: 'Bare Act Notes & Charts',
        url: '/bare-acts',
        icon: Scale,
      },
      {
        id: 'judgments',
        title: 'Landmark Judgments CMS',
        url: '/judgments',
        icon: Gavel,
      },
      {
        id: 'pyqs',
        title: 'Solved PYQ Archive',
        url: '/pyqs',
        icon: FolderArchive,
      },
    ],
  },
  {
    id: 5,
    label: 'Campus & Institutional CRM',
    items: [
      {
        id: 'students',
        title: 'Student Directory & Progress',
        url: '/students',
        icon: Users,
        badge: 'Analytics',
        badgeColor: 'bg-[#C19B48]/20 text-[#E8CF8D] border border-[#C19B48]/40',
        subItems: [
          {
            id: 'students-all',
            title: 'Enrolled Student Roster',
            url: '/students/roster',
          },
          {
            id: 'students-telemetry',
            title: 'Video Watch Timestamps',
            url: '/students/video-tracking',
            badge: 'Live',
          },
        ],
      },
      {
        id: 'doubts',
        title: 'Faculty Doubt Desk',
        url: '/doubts',
        icon: MessageSquare,
        badge: '5 New',
        badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
      },
      {
        id: 'fees',
        title: 'Fee Installments & Receipts',
        url: '/fees',
        icon: CreditCard,
      },
      {
        id: 'notices',
        title: 'Notice Board Broadcasts',
        url: '/notices',
        icon: BellRing,
      },
      {
        id: 'staff',
        title: 'Staff & Role Management',
        url: '/staff',
        icon: ShieldCheck,
      },
    ],
  },
];
