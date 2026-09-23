import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  GraduationCap,
  FileCheck,
  CreditCard,
  Video,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  BellRing,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  adminDashboardApi,
  type DashboardOverviewData,
  type DashboardMainsSubmission,
  type DashboardFacultyDoubt,
} from '../lib/adminDashboardApi';
import { QuickGradeModal } from '../components/dashboard/QuickGradeModal';
import { QuickDoubtReplyModal } from '../components/dashboard/QuickDoubtReplyModal';
import { QuickNoticeModal } from '../components/dashboard/QuickNoticeModal';
import { ShiftPlanModal } from '../components/dashboard/ShiftPlanModal';
import { EvaluatedScorecardModal } from '../components/dashboard/EvaluatedScorecardModal';

interface AdminSession {
  name: string;
  email: string;
  role: string;
  title: string;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminSession>({
    name: 'Adv. Rajinder Sir',
    email: 'rajinder@rajinderlawacademy.com',
    role: 'director',
    title: 'Director & Academic Dean',
  });

  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d'>('7d');
  const [overview, setOverview] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Modals state
  const [gradingSubmission, setGradingSubmission] = useState<DashboardMainsSubmission | null>(null);
  const [viewingScorecardSubmission, setViewingScorecardSubmission] = useState<DashboardMainsSubmission | null>(null);
  const [replyingDoubt, setReplyingDoubt] = useState<DashboardFacultyDoubt | null>(null);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState<boolean>(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState<boolean>(false);

  const fetchOverviewData = async (isManualRefresh = false, activeTimeframe = timeframe) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      const data = await adminDashboardApi.getOverview({
        timeframe: activeTimeframe,
        refresh: isManualRefresh,
      });
      setOverview(data);
      if (data.adminProfile) {
        setAdmin((prev) => ({
          ...prev,
          name: data.adminProfile.name || prev.name,
          role: data.adminProfile.role || prev.role,
          title: data.adminProfile.title || prev.title,
        }));
      }
      if (isManualRefresh) {
        toast.success('Dashboard metrics refreshed');
      }
    } catch (err: any) {
      console.error('Failed to load dashboard overview:', err);
      if (isManualRefresh) {
        toast.error('Failed to refresh dashboard data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem('rla_admin_session');
    if (raw) {
      try {
        setAdmin(JSON.parse(raw));
      } catch {
        // fallback
      }
    }
  }, []);

  useEffect(() => {
    fetchOverviewData(false, timeframe);
  }, [timeframe]);

  const handleStartStream = async (lectureId: string) => {
    try {
      await adminDashboardApi.startLiveStream(lectureId);
      toast.success('Live Classroom session initiated. Transmitting to student portals...');
      fetchOverviewData(true);
      navigate('/live-classes');
    } catch (err: any) {
      toast.error('Could not activate stream. Redirecting to Live Classroom...');
      navigate('/live-classes');
    }
  };

  // Fallbacks in case initial aggregation is fetching
  const kpis = overview?.kpis || {
    enrolledStudents: {
      count: 428,
      growthText: '+24 this week',
      primaryCohort: 'PCS-J Foundation',
      drillDownUrl: '/students',
    },
    pendingMainsCopies: {
      count: 14,
      challengeLabel: 'Challenge #48',
      statusLabel: 'Needs Grading',
      drillDownUrl: '/mains-evaluation',
    },
    admissionsInquiries: {
      count: 57,
      demosTodayText: '4 Demos today',
      hotPipelineText: '18 Hot Pipeline',
      drillDownUrl: '/leads',
    },
    feeInstallmentsDue: {
      amountFormatted: '₹3.4L',
      rawAmount: 340000,
      overdueCount: 7,
      overdueText: '7 Overdue',
      statusLabel: 'Auto-reminders sent',
      drillDownUrl: '/fees',
    },
  };

  const mainsSubmissions = overview?.mainsSubmissions?.recentSubmissions || [
    {
      id: 'sub-1',
      challengeNumber: 48,
      studentName: 'Pooja Sharma',
      rollNumber: 'RLA-2026-042',
      topicTitle: 'CPC Sec 11 - Res Judicata & Constructive Res Judicata (PDF 4.2 MB)',
      pdfUrl: '',
      pdfSizeFormatted: '4.2 MB',
      status: 'pending',
      isEvaluated: false,
      submittedAt: new Date().toISOString(),
    },
    {
      id: 'sub-2',
      challengeNumber: 48,
      studentName: 'Rohan Verma',
      rollNumber: 'RLA-2026-089',
      topicTitle: 'CPC Sec 9 - Courts to try all civil suits unless barred (PDF 3.8 MB)',
      pdfUrl: '',
      pdfSizeFormatted: '3.8 MB',
      status: 'pending',
      isEvaluated: false,
      submittedAt: new Date().toISOString(),
    },
    {
      id: 'sub-3',
      challengeNumber: 48,
      studentName: 'Ananya Sen',
      rollNumber: 'RLA-2026-015',
      topicTitle: 'Evaluated by Rajinder Sir • Score: 18.5/25',
      pdfUrl: '',
      pdfSizeFormatted: '2.5 MB',
      status: 'evaluated',
      isEvaluated: true,
      score: 18.5,
      maxScore: 25,
      evaluatedBy: 'Adv. Rajinder Sir',
      submittedAt: new Date().toISOString(),
    },
  ];

  const facultyDoubts = overview?.facultyDoubts?.recentQueries || [
    {
      id: 'd-1',
      studentName: 'Vikram Mehta',
      rollNumber: 'RLA-2026-108',
      timeAgo: '20 mins ago',
      questionSnippet:
        'Sir, can a subsequent suit be barred under constructive res judicata if the cause of action is distinct?',
      subject: 'CPC',
      sectionTag: 'CPC • Section 11',
      status: 'pending',
      priority: 'urgent',
    },
    {
      id: 'd-2',
      studentName: 'Sneha Kapoor',
      rollNumber: 'RLA-2026-077',
      timeAgo: '1 hour ago',
      questionSnippet:
        'Regarding BNSS arrest guidelines, is section 35 notice mandatory for bailable offences?',
      subject: 'BNSS',
      sectionTag: 'BNSS • Criminal Procedure',
      status: 'pending',
      priority: 'normal',
    },
  ];

  const todayLectures = overview?.todayLectures || [
    {
      id: 'cls-1',
      title: 'Civil Procedure Code (Part XVI)',
      subject: 'Civil Procedure Code',
      facultyName: 'Adv. Rajinder Sir',
      roomName: 'Chamber Hall A',
      timeBadge: 'LIVE AT 5:00 PM',
      durationFormatted: '5:00 PM - 7:00 PM',
      isLive: true,
      status: 'live',
      liveStreamUrl: '/live-classes',
      batchName: 'Foundation Batch (Morning & Evening)',
    },
    {
      id: 'cls-2',
      title: 'Bharatiya Nagarik Suraksha Sanhita (BNSS)',
      subject: 'BNSS',
      facultyName: 'Adv. Sharma • Evening Batch',
      roomName: 'Virtual Room 2',
      timeBadge: '7:00 PM - 8:30 PM',
      durationFormatted: '7:00 PM - 8:30 PM',
      isLive: false,
      status: 'scheduled',
      liveStreamUrl: '/timetable',
      batchName: 'Evening Batch',
    },
  ];

  return (
    <div className="space-y-6 select-none">
      {/* 1. Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            <span>{overview?.adminProfile?.chamberBadge || 'Chamber Executive Command Active'}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Welcome back, {overview?.adminProfile?.salutation ? `${overview.adminProfile.salutation} ` : ''}{overview?.adminProfile?.name || admin.name}
          </h1>
          <p className="text-xs text-[#A8A294] leading-relaxed">
            Signed in with <strong className="text-[#F7F3E6] capitalize">{overview?.adminProfile?.title || overview?.adminProfile?.role || admin.role}</strong> authority.
            Your academic timetable, Mains DAW copy submissions, student admissions pipeline, and faculty doubts are synchronized with the Student Classroom Portal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Timeframe Switcher */}
          <div className="flex items-center bg-[#262626] border border-[#3D3D3D] rounded-xl p-1 text-xs">
            <button
              type="button"
              onClick={() => setTimeframe('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                timeframe === 'today'
                  ? 'bg-[#C19B48] text-[#1E1E1E] font-bold shadow-sm'
                  : 'text-[#A8A294] hover:text-[#F7F3E6]'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('7d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                timeframe === '7d'
                  ? 'bg-[#C19B48] text-[#1E1E1E] font-bold shadow-sm'
                  : 'text-[#A8A294] hover:text-[#F7F3E6]'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('30d')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                timeframe === '30d'
                  ? 'bg-[#C19B48] text-[#1E1E1E] font-bold shadow-sm'
                  : 'text-[#A8A294] hover:text-[#F7F3E6]'
              }`}
            >
              30 Days
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchOverviewData(true)}
            disabled={refreshing}
            title="Refresh Dashboard Data (Force Cache Invalidation)"
            className="p-2.5 rounded-xl bg-[#2F2F2F] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] border border-[#3D3D3D] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#C19B48]' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => navigate(kpis.pendingMainsCopies.drillDownUrl || '/mains-evaluation')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-[#C19B48]/10"
          >
            <FileCheck className="w-4 h-4" />
            <span>Evaluate Copies ({kpis.pendingMainsCopies.count})</span>
          </button>
          <button
            type="button"
            onClick={() => navigate(kpis.admissionsInquiries.drillDownUrl || '/leads')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2F2F2F] hover:bg-[#3D3D3D] text-[#F7F3E6] border border-[#3D3D3D] text-xs font-medium transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4 text-[#C19B48]" />
            <span>Admissions CRM</span>
          </button>
        </div>
      </div>

      {/* 2. Operational KPI Ribbon (4 Core Pillars) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Enrolments */}
        <div
          onClick={() => navigate(kpis.enrolledStudents.drillDownUrl || '/students')}
          className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors cursor-pointer flex flex-col justify-between space-y-3 group"
        >
          <div className="flex items-center justify-between text-[#A8A294] text-xs">
            <span className="group-hover:text-[#F7F3E6] transition-colors">Enrolled Students</span>
            <Users className="w-4 h-4 text-[#C19B48]" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="font-serif text-3xl font-bold text-[#F7F3E6]">
              {loading ? '...' : kpis.enrolledStudents.count}
            </div>
            {kpis.enrolledStudents.trend && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  kpis.enrolledStudents.trend.direction === 'up'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : kpis.enrolledStudents.trend.direction === 'down'
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30'
                }`}
                title={`${kpis.enrolledStudents.trend.delta >= 0 ? '+' : ''}${kpis.enrolledStudents.trend.delta} vs prior period`}
              >
                {kpis.enrolledStudents.trend.direction === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>{kpis.enrolledStudents.trend.percent > 0 ? `+${kpis.enrolledStudents.trend.percent}%` : `${kpis.enrolledStudents.trend.percent}%`}</span>
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#34D399] font-medium flex items-center justify-between">
            <span>{kpis.enrolledStudents.growthText}</span>
            <span className="text-[#A8A294]">{kpis.enrolledStudents.primaryCohort}</span>
          </div>
        </div>

        {/* Unchecked Mains Copies */}
        <div
          onClick={() => navigate(kpis.pendingMainsCopies.drillDownUrl || '/mains-evaluation')}
          className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#F59E0B]/50 transition-colors cursor-pointer flex flex-col justify-between space-y-3 group"
        >
          <div className="flex items-center justify-between text-[#A8A294] text-xs">
            <span className="group-hover:text-[#F7F3E6] transition-colors">Pending Mains Copies</span>
            <FileCheck className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="font-serif text-3xl font-bold text-[#F7F3E6]">
              {loading ? '...' : kpis.pendingMainsCopies.count}
            </div>
            {kpis.pendingMainsCopies.isSlaBreached && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>{kpis.pendingMainsCopies.overdueCount || 0} Past SLA</span>
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#F59E0B] font-medium flex items-center justify-between">
            <span>{kpis.pendingMainsCopies.challengeLabel}</span>
            <span className="text-xs">{kpis.pendingMainsCopies.statusLabel}</span>
          </div>
        </div>

        {/* New Admission Leads */}
        <div
          onClick={() => navigate(kpis.admissionsInquiries.drillDownUrl || '/leads')}
          className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#60A5FA]/50 transition-colors cursor-pointer flex flex-col justify-between space-y-3 group"
        >
          <div className="flex items-center justify-between text-[#A8A294] text-xs">
            <span className="group-hover:text-[#F7F3E6] transition-colors">Admissions Inquiries</span>
            <GraduationCap className="w-4 h-4 text-[#60A5FA]" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#F7F3E6]">
            {loading ? '...' : kpis.admissionsInquiries.count}
          </div>
          <div className="text-[11px] text-[#60A5FA] font-medium flex items-center justify-between">
            <span>{kpis.admissionsInquiries.demosTodayText}</span>
            <span className="text-[#A8A294]">{kpis.admissionsInquiries.hotPipelineText}</span>
          </div>
        </div>

        {/* Fee Collections */}
        <div
          onClick={() => navigate(kpis.feeInstallmentsDue.drillDownUrl || '/fees')}
          className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#EF4444]/50 transition-colors cursor-pointer flex flex-col justify-between space-y-3 group"
        >
          <div className="flex items-center justify-between text-[#A8A294] text-xs">
            <span className="group-hover:text-[#F7F3E6] transition-colors">Fee Installments Due</span>
            <CreditCard className="w-4 h-4 text-[#EF4444]" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#F7F3E6]">
            {loading ? '...' : kpis.feeInstallmentsDue.amountFormatted}
          </div>
          <div className="text-[11px] text-[#EF4444] font-medium flex items-center justify-between">
            <span>{kpis.feeInstallmentsDue.overdueText}</span>
            <span className="text-[#A8A294]">{kpis.feeInstallmentsDue.statusLabel}</span>
          </div>
        </div>
      </div>

      {/* 3. Operational Two-Column Chamber Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Mains Evaluation Desk & Today's Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mains Pending Evaluation Action Card */}
          <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-[#F7F3E6]">
                  Mains Answer Writing Submissions
                </h3>
                <p className="text-xs text-[#A8A294]">
                  Recent student answer sheets submitted for Daily Answer Writing (DAW)
                </p>
              </div>
              <button
                onClick={() => navigate('/mains-evaluation/inbox?challenge=48&status=pending')}
                className="text-xs text-[#C19B48] hover:text-[#E8CF8D] font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>View All ({kpis.pendingMainsCopies.count})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#3D3D3D] border border-[#3D3D3D] rounded-xl overflow-hidden bg-[#262626]">
              {mainsSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 flex items-center justify-between hover:bg-[#2F2F2F] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                        sub.isEvaluated
                          ? 'bg-[#34D399]/20 text-[#34D399]'
                          : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                      }`}
                    >
                      {sub.isEvaluated ? '✓' : `#${sub.challengeNumber || 48}`}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[#F7F3E6]">
                        {sub.studentName} • Roll #{sub.rollNumber}
                      </div>
                      <div
                        className={`text-[11px] ${
                          sub.isEvaluated ? 'text-[#34D399]' : 'text-[#A8A294]'
                        }`}
                      >
                        {sub.isEvaluated
                          ? `Evaluated by ${sub.evaluatedBy || 'Rajinder Sir'} • Score: ${sub.score}/${sub.maxScore}`
                          : sub.topicTitle}
                      </div>
                    </div>
                  </div>

                  {sub.isEvaluated ? (
                    <button
                      type="button"
                      onClick={() => setViewingScorecardSubmission(sub)}
                      title="Click to view evaluated scorecard and remarks"
                      className="text-[11px] text-[#34D399] hover:text-[#6EE7B7] px-2.5 py-1 bg-[#1E1E1E] hover:bg-[#2A2A2A] rounded-md border border-[#3D3D3D] hover:border-[#34D399]/40 transition-colors cursor-pointer"
                    >
                      Returned
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setGradingSubmission(sub)}
                      className="px-3 py-1.5 rounded-lg bg-[#C19B48]/15 hover:bg-[#C19B48]/30 border border-[#C19B48]/40 text-[#E8CF8D] text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Grade Copy
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Today's Lectures & Live Streams */}
          <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-[#F7F3E6]">
                  Today's Classroom Lectures & Shifts
                </h3>
                <p className="text-xs text-[#A8A294]">
                  Scheduled live streams and offline batch shifts
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/timetable')}
                className="text-xs text-[#C19B48] hover:text-[#E8CF8D] font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Full Timetable</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {todayLectures.map((lecture) => (
                <div
                  key={lecture.id}
                  className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    {lecture.isLive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        {lecture.timeBadge || 'LIVE AT 5:00 PM'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#3D3D3D] text-[#A8A294]">
                        {lecture.timeBadge || lecture.durationFormatted}
                      </span>
                    )}
                    <span className="text-xs text-[#A8A294]">{lecture.roomName}</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-[#F7F3E6]">
                      {lecture.title}
                    </h4>
                    <p
                      className={`text-[11px] ${
                        lecture.isLive ? 'text-[#C19B48]' : 'text-[#A8A294]'
                      }`}
                    >
                      Faculty: {lecture.facultyName}
                    </p>
                  </div>

                  {lecture.isLive ? (
                    <button
                      type="button"
                      onClick={() => handleStartStream(lecture.id)}
                      className="w-full py-1.5 rounded-lg bg-[#C19B48] text-[#1E1E1E] font-bold text-xs hover:bg-[#D8B862] transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-[#C19B48]/10"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Start Live Stream</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsShiftModalOpen(true)}
                      className="w-full py-1.5 rounded-lg bg-[#2F2F2F] text-[#F7F3E6] border border-[#3D3D3D] hover:bg-[#383838] font-medium text-xs transition-colors cursor-pointer"
                    >
                      <span>View Shift Plan</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Doubt Desk & Quick Actions */}
        <div className="space-y-6">
          {/* Doubt Desk Urgent Queries */}
          <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-[#F7F3E6]">
                  Faculty Doubt Desk
                </h3>
                <span className="text-xs text-[#60A5FA]">
                  {overview?.facultyDoubts?.unresolvedCount ?? 5} Unresolved Queries
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/doubts')}
                className="text-xs text-[#C19B48] hover:text-[#E8CF8D] cursor-pointer font-medium"
              >
                Open Desk
              </button>
            </div>

            <div className="space-y-2.5">
              {facultyDoubts.map((doubt) => (
                <div
                  key={doubt.id}
                  onClick={() => setReplyingDoubt(doubt)}
                  className="p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] hover:border-[#60A5FA]/50 transition-colors cursor-pointer space-y-1.5 group"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[#F7F3E6] group-hover:text-[#60A5FA] transition-colors">
                      {doubt.studentName}
                    </span>
                    <span className="text-[10px] text-[#A8A294]">{doubt.timeAgo}</span>
                  </div>
                  <p className="text-xs text-[#A8A294] line-clamp-2">
                    "{doubt.questionSnippet}"
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5">
                      {doubt.priority === 'urgent' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30">
                          URGENT
                        </span>
                      )}
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-[#60A5FA]/15 text-[#60A5FA]">
                        {doubt.sectionTag}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#C19B48] font-medium flex items-center gap-1 group-hover:underline">
                      <MessageSquare className="w-3 h-3" />
                      Reply
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Notice Broadcast Box */}
          <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-[#F7F3E6]">
                Notice Board Broadcast
              </h3>
              <span className="text-[11px] text-[#A8A294]">
                {overview?.noticesSummary?.totalPublished ?? 3} Published
              </span>
            </div>
            <p className="text-xs text-[#A8A294]">
              Push urgent circulars directly to all enrolled students' Classroom Portals.
            </p>

            {overview?.noticesSummary?.recentNotices && overview.noticesSummary.recentNotices.length > 0 && (
              <div
                onClick={() => navigate('/notices')}
                className="p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-1 text-xs hover:border-[#C19B48]/50 transition-colors cursor-pointer group"
              >
                <div className="text-[10px] text-[#C19B48] font-semibold flex items-center gap-1">
                  <BellRing className="w-3 h-3" />
                  <span>Latest Circular</span>
                </div>
                <div className="text-[#F7F3E6] font-medium text-xs truncate group-hover:text-[#C19B48] transition-colors">
                  {overview.noticesSummary.recentNotices[0].title}
                </div>
                <div className="text-[10px] text-[#A8A294] flex items-center justify-between pt-0.5">
                  <span>{overview.noticesSummary.recentNotices[0].circularNo}</span>
                  <span>{overview.noticesSummary.recentNotices[0].timeAgo}</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsNoticeModalOpen(true)}
              className="w-full py-2.5 rounded-xl bg-[#2F2F2F] hover:bg-[#3D3D3D] text-[#F7F3E6] border border-[#3D3D3D] text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>+ Post New Circular</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Modals */}
      {gradingSubmission && (
        <QuickGradeModal
          submission={gradingSubmission}
          onClose={() => setGradingSubmission(null)}
          onSuccess={() => fetchOverviewData(true)}
        />
      )}

      {viewingScorecardSubmission && (
        <EvaluatedScorecardModal
          submission={viewingScorecardSubmission}
          onClose={() => setViewingScorecardSubmission(null)}
        />
      )}

      {replyingDoubt && (
        <QuickDoubtReplyModal
          doubt={replyingDoubt}
          onClose={() => setReplyingDoubt(null)}
          onSuccess={() => fetchOverviewData(true)}
        />
      )}

      {isNoticeModalOpen && (
        <QuickNoticeModal
          onClose={() => setIsNoticeModalOpen(false)}
          onSuccess={() => fetchOverviewData(true)}
        />
      )}

      {isShiftModalOpen && (
        <ShiftPlanModal
          onClose={() => setIsShiftModalOpen(false)}
        />
      )}
    </div>
  );
};
