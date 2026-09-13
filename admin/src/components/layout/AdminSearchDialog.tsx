import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  FileCheck,
  UserPlus,
  QrCode,
  CheckSquare,
  MessageSquare,
  CreditCard,
  BookOpen,
  Video,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface AdminSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  category: 'Admissions' | 'Academic' | 'Exams' | 'Institutional';
  icon: React.ElementType;
  badge?: string;
}

const QUICK_NAV: QuickAction[] = [
  {
    id: 'mains-eval',
    title: 'Mains Evaluation Desk',
    subtitle: '14 Pending answer sheets awaiting mentor scoring',
    url: '/mains-evaluation',
    category: 'Exams',
    icon: FileCheck,
    badge: '14 Pending',
  },
  {
    id: 'leads-inbox',
    title: 'Admissions & Leads Pipeline',
    subtitle: 'Kanban view of 57 new judicial inquiries and demos',
    url: '/leads',
    category: 'Admissions',
    icon: UserPlus,
    badge: '18 Hot Leads',
  },
  {
    id: 'student-roster',
    title: 'Student Roster & Turnstiles',
    subtitle: 'Search 428 active enrolled students and RFID gate logs',
    url: '/students',
    category: 'Institutional',
    icon: QrCode,
  },
  {
    id: 'prelims-bank',
    title: 'MCQ Test Series Builder',
    subtitle: 'Manage Bare Act question bank and all-India mock tests',
    url: '/tests',
    category: 'Exams',
    icon: CheckSquare,
  },
  {
    id: 'doubts-desk',
    title: 'Faculty Doubt Desk',
    subtitle: 'Review student legal queries on CPC, CrPC, and BNS',
    url: '/doubts',
    category: 'Institutional',
    icon: MessageSquare,
    badge: '5 New',
  },
  {
    id: 'fee-receipts',
    title: 'Fee Installments & Receipts',
    subtitle: 'Generate GST tax receipts and check overdue accounts',
    url: '/fees',
    category: 'Institutional',
    icon: CreditCard,
  },
  {
    id: 'courses-hub',
    title: 'Course & Batch Manager',
    subtitle: 'PCS-J Foundation, Minor Acts, and recorded lectures',
    url: '/courses',
    category: 'Academic',
    icon: BookOpen,
  },
  {
    id: 'live-studio',
    title: 'Live Classroom Studio',
    subtitle: 'Launch today\'s 5:00 PM Civil Procedure Code live class',
    url: '/live-classes',
    category: 'Academic',
    icon: Video,
    badge: 'LIVE at 5 PM',
  },
  {
    id: 'timetable-planner',
    title: 'Timetable & Shift Planner',
    subtitle: 'Morning, Evening, and Weekend classroom shift allocations',
    url: '/timetable',
    category: 'Academic',
    icon: Calendar,
  },
  {
    id: 'staff-roles',
    title: 'Staff & Faculty Management',
    subtitle: 'Manage permissions for Academic Mentors and Evaluators',
    url: '/staff',
    category: 'Institutional',
    icon: ShieldCheck,
  },
];

export const AdminSearchDialog: React.FC<AdminSearchDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  // Handle ESC key and Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return QUICK_NAV;
    return QUICK_NAV.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    navigate(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 select-none">
      <div
        className="w-full max-w-2xl bg-[#1E1E1E] border border-[#3D3D3D] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#3D3D3D] bg-[#262626] gap-3">
          <Search className="w-5 h-5 text-[#C19B48] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search students, leads, pending copies, batches, modules..."
            autoFocus
            className="flex-1 bg-transparent text-[#F7F3E6] placeholder-[#A8A294] text-sm focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#A8A294] hover:text-[#F7F3E6] p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono font-semibold text-[#A8A294] bg-[#1E1E1E] border border-[#3D3D3D] rounded-md">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-[#A8A294] uppercase tracking-wider flex items-center justify-between">
            <span>Administrative Navigation & Quick Jumps</span>
            <span className="text-[10px] lowercase text-[#C19B48]">
              {filteredResults.length} matches
            </span>
          </div>

          {filteredResults.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#A8A294]">
              No administrative modules or records match "{query}"
            </div>
          ) : (
            filteredResults.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.url)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#2F2F2F] text-left transition-colors border border-transparent hover:border-[#3D3D3D] group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#262626] border border-[#3D3D3D] group-hover:border-[#C19B48]/50 flex items-center justify-center shrink-0 transition-colors">
                      <Icon className="w-4 h-4 text-[#C19B48]" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#F7F3E6] group-hover:text-[#E8CF8D] truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#E8CF8D]">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#A8A294] truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3 text-[#A8A294] group-hover:text-[#F7F3E6]">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#262626] border border-[#3D3D3D]">
                      {item.category}
                    </span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-[#C19B48]" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 border-t border-[#3D3D3D] bg-[#262626] flex items-center justify-between text-[11px] text-[#A8A294]">
          <div className="flex items-center gap-3">
            <span>Press <kbd className="font-mono bg-[#1E1E1E] px-1.5 py-0.5 rounded border border-[#3D3D3D]">↑</kbd> <kbd className="font-mono bg-[#1E1E1E] px-1.5 py-0.5 rounded border border-[#3D3D3D]">↓</kbd> to navigate</span>
            <span><kbd className="font-mono bg-[#1E1E1E] px-1.5 py-0.5 rounded border border-[#3D3D3D]">↵</kbd> to select</span>
          </div>
          <span className="flex items-center gap-1 text-[#C19B48]">
            <Sparkles className="w-3 h-3" />
            Executive Chamber Search
          </span>
        </div>
      </div>
    </div>
  );
};
