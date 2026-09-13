import React, { useState } from 'react';
import {
  Video,
  Upload,
  FileText,
  Clock,
  Search,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RecordingItem {
  id: string;
  title: string;
  subject: string;
  faculty: string;
  duration: string;
  uploadDate: string;
  viewsCount: number;
  quality: string;
  hasHandout: boolean;
}

const RECORDINGS: RecordingItem[] = [
  {
    id: 'rec-01',
    title: 'CPC Sec 11: Res Judicata & Constructive Res Judicata (Part II)',
    subject: 'Civil Procedure Code',
    faculty: 'Adv. Rajinder Sir',
    duration: '01:15:00',
    uploadDate: 'Yesterday at 06:45 PM',
    viewsCount: 382,
    quality: '1080p 60fps HD',
    hasHandout: true,
  },
  {
    id: 'rec-02',
    title: 'CPC Sec 10: Res Sub Judice & Stay of Suit Principles',
    subject: 'Civil Procedure Code',
    faculty: 'Adv. Rajinder Sir',
    duration: '01:05:00',
    uploadDate: '11 Sep 2026',
    viewsCount: 412,
    quality: '1080p 60fps HD',
    hasHandout: true,
  },
  {
    id: 'rec-03',
    title: 'BNSS Sec 35 & Sec 482: Mandatory Notice & Anticipatory Bail',
    subject: 'BNSS (Criminal Procedure)',
    faculty: 'Adv. Sharma',
    duration: '01:30:00',
    uploadDate: '10 Sep 2026',
    viewsCount: 295,
    quality: '1080p 60fps HD',
    hasHandout: true,
  },
  {
    id: 'rec-04',
    title: 'BNS Sec 100 vs 101: Murder vs Culpable Homicide Distinction',
    subject: 'Bharatiya Nyaya Sanhita',
    faculty: 'Adv. Rajinder Sir',
    duration: '01:20:00',
    uploadDate: '08 Sep 2026',
    viewsCount: 520,
    quality: '1080p 60fps HD',
    hasHandout: true,
  },
  {
    id: 'rec-05',
    title: 'BSA Sec 22–27: Relevancy of Confessions to Police Officers',
    subject: 'Bharatiya Sakshya Adhiniyam',
    faculty: 'Adv. Gupta',
    duration: '00:58:00',
    uploadDate: '06 Sep 2026',
    viewsCount: 340,
    quality: '1080p 60fps HD',
    hasHandout: false,
  },
];

export const CoursesRecordingsPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const filtered = RECORDINGS.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.subject.toLowerCase().includes(search.toLowerCase()) ||
      r.faculty.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <Video className="w-3.5 h-3.5" />
            <span>Digital Classroom Vault</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Recorded Lecture Archive CMS
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Upload HD video captures, attach Bare Act annotations and commentary handouts, and monitor student streaming views.
          </p>
        </div>

        <button
          onClick={() => toast('Video Upload Dialog (Supports 4K MP4 / WebM)', { icon: 'ℹ️' })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New Lecture</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#A8A294] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recorded lecture title, subject, faculty..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] placeholder-[#A8A294] focus:outline-hidden focus:border-[#C19B48]"
          />
        </div>
        <div className="text-xs text-[#A8A294]">
          Total Archived Lectures: <strong className="text-[#F7F3E6]">{RECORDINGS.length}</strong>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#3D3D3D] bg-[#262626] text-[#A8A294] uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3.5 px-4">Lecture Title & Subject</th>
                <th className="py-3.5 px-4">Duration & Resolution</th>
                <th className="py-3.5 px-4">Faculty In Charge</th>
                <th className="py-3.5 px-4">Upload Timestamp</th>
                <th className="py-3.5 px-4">Student Plays</th>
                <th className="py-3.5 px-4">Handout PDF</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3D3D3D]/60 text-[#F7F3E6]">
              {filtered.map((rec) => (
                <tr key={rec.id} className="hover:bg-[#2F2F2F]/50 transition-colors">
                  <td className="py-3.5 px-4 max-w-[280px]">
                    <div className="font-semibold text-sm text-[#F7F3E6] truncate">{rec.title}</div>
                    <div className="text-[11px] text-[#C19B48]">{rec.subject}</div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-mono text-xs font-bold text-[#F7F3E6] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#C19B48]" />
                      <span>{rec.duration}</span>
                    </div>
                    <div className="text-[10px] text-[#A8A294]">{rec.quality}</div>
                  </td>

                  <td className="py-3.5 px-4 font-medium text-[#F7F3E6]">{rec.faculty}</td>

                  <td className="py-3.5 px-4 text-[11px] text-[#A8A294]">{rec.uploadDate}</td>

                  <td className="py-3.5 px-4 font-bold text-xs text-[#34D399]">{rec.viewsCount} views</td>

                  <td className="py-3.5 px-4">
                    {rec.hasHandout ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#C19B48] bg-[#C19B48]/15 px-2 py-0.5 rounded border border-[#C19B48]/30">
                        <FileText className="w-3 h-3" />
                        PDF Attached
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#A8A294]">No Handout</span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => toast.success(`Playing preview: ${rec.title}`)}
                      className="px-2.5 py-1 rounded-lg bg-[#262626] hover:bg-[#C19B48] text-[#F7F3E6] hover:text-[#1E1E1E] border border-[#3D3D3D] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Preview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
