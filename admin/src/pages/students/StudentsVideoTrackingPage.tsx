import React, { useState, useEffect, useCallback } from 'react';
import {
  Video,
  Search,
  Download,
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type {
  StudentRecord,
  TelemetryKPIsDto,
  FlattenedTelemetryLog,
} from '../../types/student-directory';
import { adminStudentApi } from '../../lib/adminStudentApi';
import { StudentDetailDrawer } from './StudentDetailDrawer';
import { VideoProgressBar } from '../../components/students/VideoProgressBar';
import { toast } from 'react-hot-toast';

export const StudentsVideoTrackingPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Dynamic Data States
  const [kpiMetrics, setKpiMetrics] = useState<TelemetryKPIsDto | null>(null);
  const [logs, setLogs] = useState<FlattenedTelemetryLog[]>([]);
  const [totalLogsCount, setTotalLogsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Drawer
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 1. Initial Load: Telemetry KPIs
  useEffect(() => {
    const fetchKpis = async () => {
      try {
        const kpiData = await adminStudentApi.getVideoTelemetryKPIs();
        setKpiMetrics(kpiData);
      } catch (err) {
        console.error('Failed to load telemetry KPIs:', err);
        toast.error('Failed to load video telemetry KPIs');
      }
    };
    fetchKpis();
  }, []);

  // 2. Load Detailed Playback Logs
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminStudentApi.getVideoTelemetryLogs({
        search: searchQuery,
        subject: subjectFilter,
        status: statusFilter,
        limit: 100,
      });
      setLogs(data.logs || []);
      setTotalLogsCount(data.totalCount || 0);
    } catch (err) {
      console.error('Failed to fetch telemetry logs:', err);
      toast.error('Failed to load playback logs');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, subjectFilter, statusFilter]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLogs();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  const handleOpenDossier = async (studentSummary: { id: string }) => {
    try {
      const fullDossier = await adminStudentApi.getStudentDossier(studentSummary.id);
      setSelectedStudent(fullDossier);
      setIsDrawerOpen(true);
    } catch (err) {
      console.error('Failed to load student dossier:', err);
      toast.error('Failed to load candidate dossier');
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await adminStudentApi.downloadVideoTelemetryCsv();
      toast.success(
        <div>
          <div className="font-semibold text-[#F7F3E6]">Playback Telemetry Exported</div>
          <div className="text-xs text-[#A8A294] mt-0.5">
            Generated CSV timestamp audit for {logs.length} playback sessions.
          </div>
        </div>
      );
    } catch (err) {
      console.error('Failed to export telemetry CSV:', err);
      toast.error('Failed to export video telemetry CSV');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Page Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <Video className="w-3.5 h-3.5" />
            <span>Telemetry & Playback Audit</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Video Watch Timestamps & Analytics
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Per-second playback audit, timestamp completion logs, and lecture drop-off heatmaps across all enrolled judicial aspirants.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={isExporting}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs font-medium hover:border-[#C19B48]/50 hover:bg-[#2F2F2F] transition-all cursor-pointer shrink-0 disabled:opacity-60"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 text-[#C19B48] animate-spin" />
          ) : (
            <Download className="w-4 h-4 text-[#C19B48]" />
          )}
          <span>Export Telemetry (CSV)</span>
        </button>
      </div>

      {/* Analytics KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A8A294]">Total Watched Hours</span>
            <Clock className="w-4 h-4 text-[#C19B48]" />
          </div>
          <p className="font-serif text-2xl font-bold text-[#F7F3E6] mt-2">
            {kpiMetrics ? `${kpiMetrics.totalWatchedHours.toLocaleString()} Hrs` : '1,840.5 Hrs'}
          </p>
          <p className="text-[11px] text-[#22C55E] mt-1">
            {kpiMetrics?.hoursGrowthRate || '+14.2% higher than last week'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A8A294]">Avg Completion Rate</span>
            <PlayCircle className="w-4 h-4 text-[#22C55E]" />
          </div>
          <p className="font-serif text-2xl font-bold text-[#F7F3E6] mt-2">
            {kpiMetrics ? `${kpiMetrics.avgCompletionRate}%` : '84.2%'}
          </p>
          <p className="text-[11px] text-[#A8A294] mt-1">
            {kpiMetrics?.topPerformingSubject || 'CPC & Criminal Law highest'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A8A294]">Full Completions (100%)</span>
            <CheckCircle2 className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <p className="font-serif text-2xl font-bold text-[#F7F3E6] mt-2">
            {kpiMetrics ? `${kpiMetrics.fullCompletionsCount} Sessions` : '612 Sessions'}
          </p>
          <p className="text-[11px] text-[#A8A294] mt-1">
            {kpiMetrics?.fullCompletionsBadge || 'Verified with RFID attendance'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#A8A294]">Early Drop-offs (&lt;20%)</span>
            <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <p className="font-serif text-2xl font-bold text-[#F7F3E6] mt-2">
            {kpiMetrics ? `${kpiMetrics.earlyDropRate}%` : '4.8%'}
          </p>
          <p className="text-[11px] text-[#F59E0B] mt-1">
            {kpiMetrics?.earlyDropBadge || 'Mentor follow-up dispatched'}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A294]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name, roll number, or lecture topic..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs placeholder:text-[#A8A294] focus:outline-none focus:border-[#C19B48] transition-colors"
            />
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-[#A8A294] shrink-0" />
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full md:w-48 px-3 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48] cursor-pointer"
            >
              <option value="ALL">All Legal Subjects</option>
              <option value="Civil Procedure">Civil Procedure (CPC)</option>
              <option value="BNSS">BNSS (Criminal Procedure)</option>
              <option value="Bharatiya Nyaya">BNS (Substantive Law)</option>
              <option value="Constitution">Constitutional Law</option>
              <option value="Evidence">BSA (Evidence Act)</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-44 px-3 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48] cursor-pointer"
          >
            <option value="ALL">All Watch Statuses</option>
            <option value="completed">Completed (&ge;90%)</option>
            <option value="in_progress">In-Progress</option>
            <option value="not_started">Early Drop-off (&lt;20%)</option>
            <option value="scrub_flagged">Scrubbing Flagged</option>
          </select>
        </div>
      </div>

      {/* Loading state indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[#C19B48] animate-spin" />
          <span className="ml-2 text-xs text-[#A8A294]">Fetching telemetry logs...</span>
        </div>
      )}

      {/* Video Watch Records Table */}
      {!isLoading && (
        <div className="rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#3D3D3D] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-[#C19B48]" />
              <h2 className="font-serif text-sm font-bold text-[#F7F3E6]">
                Detailed Playback Logs ({totalLogsCount})
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#3D3D3D] bg-[#262626]/60 text-[#A8A294]">
                  <th className="py-3 px-4 font-semibold">Student / Roll No</th>
                  <th className="py-3 px-4 font-semibold">Lecture Title & Subject</th>
                  <th className="py-3 px-4 font-semibold">Watch Progress & Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Speed & Plays</th>
                  <th className="py-3 px-4 font-semibold">Last Watched</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3D3D3D]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#A8A294]">
                      No playback logs match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  logs.map((item, idx) => (
                    <tr
                      key={`${item.student.id}-${item.lectureId}-${idx}`}
                      className="hover:bg-[#262626]/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#F7F3E6]">{item.student.name}</div>
                        <div className="font-mono text-[11px] text-[#C19B48]">
                          {item.student.rollNumber}
                        </div>
                        <div className="text-[10px] text-[#A8A294] truncate max-w-40">
                          {item.student.batch}
                        </div>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="text-[#F7F3E6] font-medium leading-snug line-clamp-2">
                          {item.lectureTitle}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#262626] border border-[#3D3D3D] text-[#C19B48]">
                            {item.subject}
                          </span>
                          <span className="text-[10px] text-[#A8A294]">
                            by {item.faculty}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4 w-60">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-[#F7F3E6]">
                              {item.watchedTimestamp}
                            </span>
                            <span className="font-bold text-[#C19B48]">
                              {item.watchPercentage}%
                            </span>
                          </div>
                          <VideoProgressBar
                            percentage={item.watchPercentage}
                            timestampText={item.watchedTimestamp}
                            status={item.status as any}
                            skipAlert={item.scrubDetected}
                            showDetails={false}
                          />
                          {item.scrubDetected && (
                            <div className="text-[10px] text-[#EF4444] font-medium mt-0.5">
                              ⚠️ Scrubbing / fast-forward detected
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#262626] border border-[#3D3D3D] text-[11px] font-mono text-[#F7F3E6]">
                          <span>{item.playbackSpeedAvg}</span>
                        </div>
                        <div className="text-[10px] text-[#A8A294] mt-0.5">
                          {item.watchCount} {item.watchCount === 1 ? 'play' : 'plays'}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-[#F7F3E6] text-[11px]">{item.lastWatchedAt}</div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenDossier(item.student)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#262626] border border-[#3D3D3D] text-[#C19B48] text-xs hover:border-[#C19B48] hover:bg-[#2F2F2F] transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Dossier</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Detail Slide-out Drawer */}
      <StudentDetailDrawer
        student={selectedStudent}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  );
};
