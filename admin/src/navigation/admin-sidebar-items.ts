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
  Users,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavSubItem {
  id: string;
  title: string;
  url: string;
  badge?: string;
  permission?: string;
}

export interface AdminNavMainItem {
  id: string;
  title: string;
  url?: string;
  icon: LucideIcon;
  badge?: string;
  badgeColor?: string;
  permission?: string;
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
        permission: 'overview:view',
      },
      {
        id: 'leads',
        title: 'Admissions & Leads CRM',
        url: '/leads',
        icon: UserPlus,
        badge: '18 Hot',
        badgeColor: 'bg-[#C19B48]/20 text-[#E8CF8D] border border-[#C19B48]/40',
        permission: 'leads:view',
        subItems: [
          {
            id: 'leads-pipeline',
            title: 'Inquiry Pipeline & Kanban',
            url: '/leads/pipeline',
            permission: 'leads:view',
          },
          {
            id: 'leads-demos',
            title: 'Trial & Demo Registrations',
            url: '/leads/demos',
            badge: 'Today: 4',
            permission: 'leads:view',
          },
          {
            id: 'leads-enroll',
            title: 'Direct Admission Form',
            url: '/leads/new-enrollment',
            permission: 'leads:create',
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
        permission: 'courses:view',
        subItems: [
          {
            id: 'courses-all',
            title: 'Course Offerings & Curricula',
            url: '/courses/all',
            permission: 'courses:view',
          },
          {
            id: 'courses-batches',
            title: 'Active Batches & Shifts',
            url: '/courses/batches',
            permission: 'courses:view',
          },
          {
            id: 'courses-recordings',
            title: 'Recorded Lecture Archive',
            url: '/courses/recordings',
            permission: 'courses:view',
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
        permission: 'live_classes:view',
      },
      {
        id: 'timetable',
        title: 'Timetable & Shift Planner',
        url: '/timetable',
        icon: Calendar,
        permission: 'timetable:view',
      },
      {
        id: 'daily-digest',
        title: 'Daily Legal Digest CMS',
        url: '/daily-digest',
        icon: Newspaper,
        badge: "Today's Brief",
        badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
        permission: 'daily_digest:view',
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
        permission: 'mains_evaluation:view',
        subItems: [
          {
            id: 'mains-inbox',
            title: 'Pending Answer Sheets (PDF)',
            url: '/mains-evaluation/inbox',
            badge: '14',
            permission: 'mains_evaluation:view',
          },
          {
            id: 'mains-evaluated',
            title: 'Graded Copies & Feedback',
            url: '/mains-evaluation/graded',
            permission: 'mains_evaluation:view',
          },
          {
            id: 'mains-questions',
            title: 'Daily Mains Question Bank',
            url: '/mains-evaluation/questions',
            permission: 'mains_evaluation:view',
          },
        ],
      },
      {
        id: 'tests',
        title: 'Prelims Test Series Builder',
        url: '/tests',
        icon: CheckSquare,
        permission: 'tests:view',
        subItems: [
          {
            id: 'tests-all',
            title: 'Mock Test Papers & Exams',
            url: '/tests/all',
            permission: 'tests:view',
          },
          {
            id: 'tests-question-bank',
            title: 'Bare Act MCQ Question Bank',
            url: '/tests/bank',
            permission: 'tests:view',
          },
          {
            id: 'tests-ranks',
            title: 'All-India Rank Computation',
            url: '/tests/rankings',
            permission: 'tests:view',
          },
        ],
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
        permission: 'vault:view',
      },
      {
        id: 'judgments',
        title: 'Landmark Judgments CMS',
        url: '/judgments',
        icon: Gavel,
        permission: 'vault:view',
      },
      {
        id: 'pyqs',
        title: 'Solved PYQ Archive',
        url: '/pyqs',
        icon: FolderArchive,
        permission: 'vault:view',
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
        permission: 'students:view',
        subItems: [
          {
            id: 'students-all',
            title: 'Enrolled Student Roster',
            url: '/students/roster',
            permission: 'students:view',
          },
          {
            id: 'students-telemetry',
            title: 'Video Watch Timestamps',
            url: '/students/video-tracking',
            badge: 'Live',
            permission: 'students:view',
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
        permission: 'doubts:view',
      },
      {
        id: 'fees',
        title: 'Fee Installments & Receipts',
        url: '/fees',
        icon: CreditCard,
        permission: 'fees:view',
      },
      {
        id: 'notices',
        title: 'Notice Board Broadcasts',
        url: '/notices',
        icon: BellRing,
        permission: 'notices:view',
      },
      {
        id: 'staff',
        title: 'Staff & Role Management',
        url: '/staff',
        icon: ShieldCheck,
        permission: 'staff:view',
      },
      {
        id: 'settings',
        title: 'System Settings & Banner',
        url: '/settings',
        icon: Settings,
        permission: 'settings:view',
      },
    ],
  },
];
