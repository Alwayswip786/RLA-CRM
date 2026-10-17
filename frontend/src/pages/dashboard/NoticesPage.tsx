import React, { useState, useEffect } from 'react';
import {
  Download,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import { apiClient } from '../../lib/apiClient';
import { generateNoticePdf } from '../../utils/noticePdfGenerator';
import { useNoticeStore } from '../../store/useNoticeStore';
import { NoticeCardSkeleton } from '../../components/ui/skeleton';
import { BottomSheet } from '../../components/ui/BottomSheet';

export interface NoticeItem {
  _id: string;
  circularNo: string;
  title: string;
  category: 'all' | 'examination' | 'timetable' | 'mock-tests' | 'admissions' | 'general' | 'urgent';
  priority: 'urgent' | 'normal';
  targetCohorts: string;
  publishedAt: string;
  content: string;
  issuedBy?: string;
  authorName?: string;
  gazetteFile?: {
    fileName: string;
    fileSize: string;
    fileUrl?: string;
  };
}

const MOCK_NOTICES: NoticeItem[] = [
  {
    _id: 'n1',
    circularNo: 'RLA/CIR/2026/048',
    title: 'Delhi Judicial Service (DJS) 2026 Notification Released - 124 Vacancies',
    category: 'examination',
    priority: 'urgent',
    targetCohorts: 'All Enrolled Batches',
    publishedAt: '2026-09-23T10:00:00.000Z',
    content:
      'The High Court of Delhi has officially published the competitive examination notification for 124 vacancies in the Delhi Judicial Service (DJS) 2026. Aspirants are advised to register immediately on the official High Court portal before the deadline.\n\nRajinder Law Academy will conduct intensive Prelims Mock Drills every Saturday at 10:00 AM, accompanied by Daily Answer Writing (DAW) sessions for Civil & Criminal Law in Chamber Hall A. Attendance is strictly compulsory for all registered aspirants.',
    issuedBy: 'Director Office, Rajinder Law Academy',
    gazetteFile: {
      fileName: 'Official Gazette',
      fileSize: '124 Vacancies • 2.4 MB',
    },
  },
  {
    _id: 'n2',
    circularNo: 'RLA-CIR-2026-018',
    title: 'PCS-J Mock Test 4 rescheduled to Sunday 10:00 AM',
    category: 'examination',
    priority: 'urgent',
    targetCohorts: 'PCS-J 2026 Foundation',
    publishedAt: '2026-09-23T09:30:00.000Z',
    content:
      'Candidates are informed that Mock Test 4 (Procedural Laws - CPC & CrPC) has been rescheduled to Sunday at 10:00 AM in the Main Chamber Hall and online portal. Please arrive 15 minutes before reporting time with your Student ID card.',
    issuedBy: 'Office of the Director & Academic Council',
  },
  {
    _id: 'n3',
    circularNo: 'RLA/CIR/2026/047',
    title: 'Evening Shift CPC & Evidence Act Timing Adjusted for Live Interactive Bare Act Workshop',
    category: 'timetable',
    priority: 'normal',
    targetCohorts: 'Evening Shift (Cohort B)',
    publishedAt: '2026-09-23T08:15:00.000Z',
    content:
      'Please note that today’s lecture on the Code of Civil Procedure (CPC) and Indian Evidence Act will commence at 05:00 PM sharp in Chamber Hall A. Adv. Rajinder Sir will conduct an interactive cross-examination dissection.',
    issuedBy: 'Academic Department',
  },
  {
    _id: 'n4',
    circularNo: 'RLA/MT/2026/012',
    title: 'Weekly Mains Answer Writing (DAW) Schedule - September 2026',
    category: 'mock-tests',
    priority: 'normal',
    targetCohorts: 'All Batches',
    publishedAt: '2026-09-22T11:00:00.000Z',
    content:
      'The weekly Mains Answer Writing (DAW) schedule for September 2026 has been released. Aspirants are advised to follow the updated topics and submission deadlines to receive personalized mentor feedback from Adv. Rajinder Sir.',
    issuedBy: 'Mains Coordination Team',
  },
  {
    _id: 'n5',
    circularNo: 'RLA/ADM/2026/006',
    title: 'Judicial Services Foundation Batch 2026 - Admissions Closing Soon',
    category: 'admissions',
    priority: 'normal',
    targetCohorts: 'New Admissions 2026',
    publishedAt: '2026-09-21T14:00:00.000Z',
    content:
      'Admissions for the Judicial Services Foundation Batch 2026 will close on 30th September 2026. Interested aspirants are advised to complete the registration process at the earliest to secure access to offline chamber seats and digital vaults.',
    issuedBy: 'Admissions Office',
  },
];

export const NoticesPage: React.FC = () => {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMobileNotice, setSelectedMobileNotice] = useState<NoticeItem | null>(null);

  const markAllAsRead = useNoticeStore((state) => state.markAllAsRead);
  const syncStoreNotices = useNoticeStore((state) => state.fetchNotices);

  // Fetch notices from backend or fallback to mock notices
  const fetchNotices = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/notices');
      if (res.data?.notices && res.data.notices.length > 0) {
        setNotices(res.data.notices);
      } else {
        setNotices(MOCK_NOTICES);
      }
      await syncStoreNotices();
      markAllAsRead();
    } catch (err) {
      console.error('Failed to fetch notices:', err);
      // Fallback to reference notices
      setNotices(MOCK_NOTICES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
    markAllAsRead();
  }, []);

  // Handle PDF Download
  const handleDownloadPdf = (item: NoticeItem) => {
    try {
      generateNoticePdf({
        circularNo: item.circularNo,
        title: item.title,
        content: item.content,
        category: item.category,
        priority: item.priority,
        targetCohorts: item.targetCohorts,
        publishedAt: item.publishedAt,
        issuedBy: item.issuedBy,
      });
      toast.success(`Official Circular ${item.circularNo} downloaded as PDF`, {
        description: 'Certified digital circular saved to your device.',
      });
    } catch (err) {
      console.error('PDF Generation failed:', err);
      toast.error('Failed to generate circular PDF.');
    }
  };

  // Date parsing helper
  const parseNoticeDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return { day: '23', monthYear: 'Sept 2026', weekday: 'Tuesday', shortWeekday: 'Tue' };
    }
    const day = d.toLocaleDateString('en-IN', { day: '2-digit' });
    const month = d.toLocaleDateString('en-IN', { month: 'short' });
    const year = d.getFullYear();
    const weekday = d.toLocaleDateString('en-IN', { weekday: 'long' });
    const shortWeekday = d.toLocaleDateString('en-IN', { weekday: 'short' });
    return {
      day,
      monthYear: `${month} ${year}`,
      weekday,
      shortWeekday,
    };
  };

  // Category badge styles
  const getCategoryBadgeClass = (category: string) => {
    switch (category.toLowerCase()) {
      case 'examination':
        return 'border-blue-500/40 text-blue-700 dark:text-blue-300 bg-blue-50/70 dark:bg-blue-950/30';
      case 'timetable':
      case 'classroom timetable':
        return 'border-sky-500/40 text-sky-700 dark:text-sky-300 bg-sky-50/70 dark:bg-sky-950/30';
      case 'mock-tests':
      case 'mock tests':
      case 'mock test':
        return 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30';
      case 'admissions':
        return 'border-purple-500/40 text-purple-700 dark:text-purple-300 bg-purple-50/70 dark:bg-purple-950/30';
      case 'urgent':
        return 'border-red-500/40 text-red-700 dark:text-red-300 bg-red-50/70 dark:bg-red-950/30';
      default:
        return 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-in fade-in duration-200 select-none pb-8">
      {/* NOTICES FEED */}
      {isLoading && notices.length === 0 ? (
        <NoticeCardSkeleton count={4} />
      ) : notices.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="font-serif text-base font-bold text-slate-800 dark:text-slate-200">
            No Circulars Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            There are currently no active announcements on the notice board.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* DESKTOP & TABLET CARDS (Hidden on Mobile) */}
          <div className="hidden md:flex flex-col gap-4">
            {notices.map((item) => {
              const { day, monthYear, weekday } = parseNoticeDate(item.publishedAt);
              const isUrgent = item.priority === 'urgent';
              const badgeClass = getCategoryBadgeClass(item.category);

              return (
                <div
                  key={item._id}
                  className={`p-5 lg:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border transition-all shadow-xs flex gap-5 lg:gap-6 ${
                    isUrgent
                      ? 'border-[#c19b48]/70 dark:border-[#c19b48]/60 shadow-md ring-1 ring-[#c19b48]/15'
                      : 'border-slate-200 dark:border-[#143564]'
                  }`}
                >
                  {/* Left Date Pillar */}
                  <div className="w-20 lg:w-24 shrink-0 flex flex-col items-center justify-start text-center border-r-2 border-[#c19b48]/40 pr-4 lg:pr-5 select-none">
                    <span className="text-3xl lg:text-4xl font-serif font-bold text-slate-900 dark:text-white leading-none">
                      {day}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 mt-1">
                      {monthYear}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">{weekday}</span>
                  </div>

                  {/* Main Notice Content Area */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3">
                    {/* Header Badges & Reference Number */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Category Badge */}
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${badgeClass}`}
                        >
                          {item.category}
                        </span>

                        {/* Priority Badge */}
                        {isUrgent && (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 font-bold border border-red-500/30 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span>PRIORITY CIRCULAR</span>
                          </span>
                        )}

                        {/* Cohort Badge */}
                        {item.targetCohorts && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            Cohort:{' '}
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {item.targetCohorts}
                            </span>
                          </span>
                        )}
                      </div>

                      {/* Circular Reference Number */}
                      <span className="font-mono text-xs font-semibold text-[#c19b48]">
                        {item.circularNo}
                      </span>
                    </div>

                    {/* Circular Title */}
                    <h3 className="text-base lg:text-lg font-serif font-bold text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h3>

                    {/* Circular Body Description & Optional Attachment Preview */}
                    <div className="flex flex-col lg:flex-row gap-4 items-start justify-between">
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line flex-1">
                        {item.content}
                      </p>

                      {/* Official Gazette PDF Thumbnail Box (if available) */}
                      {item.gazetteFile && (
                        <div className="shrink-0 p-3 rounded-xl border border-slate-200 dark:border-[#143564] bg-slate-50 dark:bg-[#061120] flex items-center gap-3 select-none">
                          <div className="w-8 h-9 rounded-md bg-red-500/10 text-red-600 flex items-center justify-center font-bold text-[9px] border border-red-500/30">
                            PDF
                          </div>
                          <div className="text-left text-xs pr-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                              {item.gazetteFile.fileName}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {item.gazetteFile.fileSize}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Authority Line & Download Button */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-[#143564]/80 text-xs">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Issued by:{' '}
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {item.issuedBy || 'Director Office, Rajinder Law Academy'}
                        </span>
                      </span>

                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(item)}
                        className="inline-flex items-center gap-1.5 text-xs text-[#c19b48] dark:text-[#e8cf8d] font-semibold hover:text-[#8b6b25] dark:hover:text-white transition-colors cursor-pointer self-start sm:self-auto bg-[#c19b48]/10 dark:bg-[#c19b48]/15 px-3 py-1.5 rounded-lg border border-[#c19b48]/30 hover:border-[#c19b48]/60 shadow-2xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>
                          {item.gazetteFile
                            ? 'Download Official Gazette (PDF)'
                            : item.category === 'timetable'
                            ? 'Download Timetable (PDF)'
                            : item.category === 'mock-tests'
                            ? 'Download Schedule (PDF)'
                            : item.category === 'admissions'
                            ? 'Download Brochure (PDF)'
                            : 'Download Notice (PDF)'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* MOBILE COMPACT LIST VIEW (Matching reference mobile 9:16 layout) */}
          <div className="md:hidden flex flex-col gap-2.5">
            {notices.map((item) => {
              const { day, monthYear, shortWeekday } = parseNoticeDate(item.publishedAt);
              const isUrgent = item.priority === 'urgent';
              const badgeClass = getCategoryBadgeClass(item.category);

              return (
                <div
                  key={item._id}
                  onClick={() => setSelectedMobileNotice(item)}
                  className={`min-w-0 p-3.5 rounded-2xl bg-white dark:bg-[#0a1c36] border shadow-xs flex items-start justify-between gap-3 cursor-pointer transition-all active:scale-[0.99] ${
                    isUrgent
                      ? 'border-[#c19b48]/60 shadow-xs ring-1 ring-[#c19b48]/20'
                      : 'border-slate-200 dark:border-[#143564]'
                  }`}
                >
                  {/* Left Date Block */}
                  <div className="w-14 shrink-0 flex flex-col items-center justify-center text-center border-r border-slate-200 dark:border-[#143564] pr-2.5">
                    <span className="text-xl font-serif font-bold text-slate-900 dark:text-white leading-none">
                      {day}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                      {monthYear.split(' ')[0]}
                    </span>
                    <span className="text-[9px] text-slate-400">{shortWeekday}</span>
                  </div>

                  {/* Middle Content */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <span className={`inline-flex max-w-full items-center text-[9px] leading-none px-1.5 py-1 rounded font-bold uppercase border whitespace-normal break-words ${badgeClass}`}>
                        {item.category}
                      </span>
                      {isUrgent && (
                        <span className="inline-flex shrink-0 items-center gap-1 text-[9px] leading-none px-1.5 py-1 rounded bg-red-500/15 text-red-600 font-bold border border-red-500/30 whitespace-nowrap">
                          ● PRIORITY
                        </span>
                      )}
                    </div>

                    <h4 className="text-[13px] font-bold text-slate-900 dark:text-white leading-snug break-words [overflow-wrap:anywhere]">
                      {item.title}
                    </h4>

                    <span className="text-[10px] text-slate-400 block break-words [overflow-wrap:anywhere] font-mono">
                      {item.circularNo}
                    </span>
                  </div>

                  {/* Right Chevron */}
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 ml-1 self-center" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. MOBILE DETAIL BOTTOM SHEET DRAWER */}
      {selectedMobileNotice && (
        <BottomSheet
          isOpen={true}
          onClose={() => setSelectedMobileNotice(null)}
          title={selectedMobileNotice.title}
          subtitle={`Circular ${selectedMobileNotice.circularNo} • ${parseNoticeDate(selectedMobileNotice.publishedAt).day} ${parseNoticeDate(selectedMobileNotice.publishedAt).monthYear}`}
        >
          <div className="space-y-4 text-xs pb-4">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${getCategoryBadgeClass(
                  selectedMobileNotice.category
                )}`}
              >
                {selectedMobileNotice.category}
              </span>

              {selectedMobileNotice.priority === 'urgent' && (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-600 font-bold border border-red-500/30">
                  ● PRIORITY CIRCULAR
                </span>
              )}

              {selectedMobileNotice.targetCohorts && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Cohort: <strong className="text-slate-700 dark:text-slate-300">{selectedMobileNotice.targetCohorts}</strong>
                </span>
              )}
            </div>

            {/* Circular Full Content */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line text-xs">
              {selectedMobileNotice.content}
            </div>

            {/* Issuer Information */}
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Issued by:{' '}
              <strong className="text-slate-700 dark:text-slate-300">
                {selectedMobileNotice.issuedBy || 'Director Office, Rajinder Law Academy'}
              </strong>
            </div>

            {/* Download Button */}
            <button
              type="button"
              onClick={() => {
                handleDownloadPdf(selectedMobileNotice);
                setSelectedMobileNotice(null);
              }}
              className="w-full py-3 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Official Notice (PDF)</span>
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};

export default NoticesPage;
