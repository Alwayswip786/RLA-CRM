import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, BookOpen, Video, CheckSquare, FileText, ArrowRight } from 'lucide-react';

interface SearchItem {
  id: string;
  title: string;
  category: 'Classroom' | 'Bare Act' | 'Test Series' | 'Study Material';
  url: string;
  icon: React.ReactNode;
}

const searchableData: SearchItem[] = [
  {
    id: 'cpc-live',
    title: 'Code of Civil Procedure (CPC) - Section 9 to 14 Live Class',
    category: 'Classroom',
    url: '/dashboard/live-classes',
    icon: <Video className="w-4 h-4 text-red-400" />,
  },
  {
    id: 'bns-mock-4',
    title: 'Bhartiya Nyaya Sanhita (BNS) Prelims Mock 4 (100 MCQs)',
    category: 'Test Series',
    url: '/dashboard/tests/mock-series',
    icon: <CheckSquare className="w-4 h-4 text-[#c19b48]" />,
  },
  {
    id: 'crpc-notes',
    title: 'Criminal Procedure Code (CrPC vs BNSS) Comparative Chart',
    category: 'Bare Act',
    url: '/dashboard/bare-acts',
    icon: <BookOpen className="w-4 h-4 text-blue-400" />,
  },
  {
    id: 'constitution-cases',
    title: 'Landmark Supreme Court Judgments (2024-25 Digest)',
    category: 'Study Material',
    url: '/dashboard/judgments',
    icon: <FileText className="w-4 h-4 text-emerald-400" />,
  },
  {
    id: 'djs-pyq',
    title: 'Delhi Judicial Services (DJS) 2023 Solved Paper with Analysis',
    category: 'Study Material',
    url: '/dashboard/pyqs',
    icon: <FileText className="w-4 h-4 text-amber-400" />,
  },
];

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchDialog: React.FC<SearchDialogProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent can toggle
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = searchableData.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (url: string) => {
    navigate(url);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-[#0a1c36] border border-[#143564] rounded-2xl shadow-2xl overflow-hidden z-10 text-slate-100">
        {/* Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#143564]">
          <Search className="w-5 h-5 text-[#c19b48] mr-3 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Bare Acts, live lectures, mock tests, case laws..."
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item.url)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#143564]/50 transition-colors text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#061120] border border-[#143564]">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white group-hover:text-[#e8cf8d] transition-colors line-clamp-1">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-slate-400">{item.category}</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#c19b48] transition-colors shrink-0" />
              </button>
            ))
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching classroom materials found for "{query}".
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-[#061120] border-t border-[#143564] flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigation Quick Jump</span>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-[#0a1c36] border border-[#143564] text-[10px] font-mono">
              ESC
            </kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
};
