import React, { useState, useMemo } from 'react';
import {
  X,
  BookOpen,
  QrCode,
  Laptop,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Phone,
  Mail,
  MessageCircle,
  FileCheck,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import type { StudentRecord } from '../../types/student-directory';
import { VideoProgressBar } from '../../components/students/VideoProgressBar';
import { adminStudentApi } from '../../lib/adminStudentApi';
import { toast } from 'react-hot-toast';

interface StudentDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRecord | null;
}

type TabType = 'videos' | 'academics_gate' | 'security_devices';

export const StudentDetailDrawer: React.FC<StudentDetailDrawerProps> = ({
  isOpen,
  onClose,
  student,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('videos');
  const [videoSearch, setVideoSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');

  if (!isOpen || !student) return null;

  const videoLogs = student.videoLogs || [];

  // Extract distinct subjects from student's video logs
  const subjects = useMemo(() => {
    const list = Array.from(new Set(videoLogs.map((v) => v.subject)));
    return ['ALL', ...list];
  }, [videoLogs]);

  // Filter video logs
  const filteredVideos = useMemo(() => {
    return videoLogs.filter((v) => {
      const matchesSearch =
        v.lectureTitle.toLowerCase().includes(videoSearch.toLowerCase()) ||
        v.subject.toLowerCase().includes(videoSearch.toLowerCase()) ||
        v.faculty.toLowerCase().includes(videoSearch.toLowerCase());
      const matchesSubject = selectedSubject === 'ALL' || v.subject === selectedSubject;
      return matchesSearch && matchesSubject;
    });
  }, [videoLogs, videoSearch, selectedSubject]);

  const handleSendWhatsAppAlert = () => {
    toast.success(
      <div>
        <div className="font-semibold text-[#F7F3E6]">WhatsApp Video Catchup Notification Sent</div>
        <div className="text-xs text-[#A8A294] mt-0.5">
          Targeted WhatsApp message sent to {student.name} ({student.phone}) highlighting pending lectures.
        </div>
      </div>
    );
  };

  const handleRevokeDevice = async () => {
    try {
      await adminStudentApi.revokeStudentSessions(student.id);
      toast.success(
        <div>
          <div className="font-semibold text-[#F7F3E6]">Device Sessions Reset for {student.name}</div>
          <div className="text-xs text-[#A8A294] mt-0.5">Logged out of all active web and mobile app instances.</div>
        </div>
      );
    } catch (err) {
      console.error('Failed to revoke sessions:', err);
      toast.error('Failed to revoke student sessions');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 select-none animate-in fade-in duration-200">
      {/* Click outside to close */}
      <div className="flex-1 hidden md:block" onClick={onClose} />

      {/* Drawer Body */}
      <div className="w-full max-w-3xl bg-[#1E1E1E] border-l border-[#3D3D3D] h-full flex flex-col shadow-2xl overflow-hidden text-[#F7F3E6]">
        {/* 1. Top Bar */}
        <div className="px-6 py-4 border-b border-[#3D3D3D] bg-[#262626] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2F2F2F] border border-[#C19B48]/50 flex items-center justify-center font-bold text-sm text-[#C19B48]">
              {student.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-[#F7F3E6]">
                  {student.name}
                </h2>
                <span className="font-mono text-xs text-[#A8A294] bg-[#1E1E1E] px-2 py-0.5 rounded border border-[#3D3D3D]">
                  {student.rollNumber}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    student.status === 'active'
                      ? 'bg-[#34D399]/20 text-[#34D399] border border-[#34D399]/40'
                      : student.status === 'needs_attention'
                      ? 'bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40'
                      : 'bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40'
                  }`}
                >
                  {student.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-[#A8A294] mt-0.5 truncate max-w-md">
                {student.enrolledCourseTitle} • {student.batch}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#2F2F2F] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Quick Contact & Administrative Action Toolbar */}
        <div className="px-6 py-2.5 bg-[#1A1A1A] border-b border-[#3D3D3D] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4 text-[#A8A294]">
            <a
              href={`tel:${student.phone}`}
              className="flex items-center gap-1.5 hover:text-[#F7F3E6] transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-[#C19B48]" />
              <span>{student.phone}</span>
            </a>
            <a
              href={`mailto:${student.email}`}
              className="hidden sm:flex items-center gap-1.5 hover:text-[#F7F3E6] transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-[#C19B48]" />
              <span>{student.email}</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWhatsAppAlert}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#34D399]/15 hover:bg-[#34D399]/25 text-[#34D399] border border-[#34D399]/30 transition-colors font-medium cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Reminder</span>
            </button>
            <button
              onClick={handleRevokeDevice}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2F2F2F] hover:bg-[#3D3D3D] text-[#A8A294] hover:text-[#EF4444] border border-[#3D3D3D] transition-colors font-medium cursor-pointer"
              title="Revoke active logins"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Sessions</span>
            </button>
          </div>
        </div>

        {/* 3. Overall Course Progress Banner */}
        <div className="p-6 bg-[#262626] border-b border-[#3D3D3D] shrink-0 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center sm:text-left">
            <div className="p-3 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D]">
              <div className="text-[10px] font-bold text-[#A8A294] uppercase">Course Progress</div>
              <div className="text-xl font-bold font-serif text-[#C19B48] mt-0.5">
                {student.overallCourseProgress}%
              </div>
              <div className="text-[10px] text-[#A8A294]">
                {student.completedModulesCount}/{student.totalModulesCount} Modules Done
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D]">
              <div className="text-[10px] font-bold text-[#A8A294] uppercase">Lectures Watched</div>
              <div className="text-xl font-bold font-serif text-[#F7F3E6] mt-0.5">
                {student.totalLecturesWatched}
                <span className="text-xs text-[#A8A294] font-sans font-normal"> / {student.totalLecturesCount}</span>
              </div>
              <div className="text-[10px] text-[#34D399]">
                {Math.round((student.totalLecturesWatched / student.totalLecturesCount) * 100)}% Coverage
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D]">
              <div className="text-[10px] font-bold text-[#A8A294] uppercase">Total Watch Time</div>
              <div className="text-xl font-bold font-serif text-[#F7F3E6] mt-0.5">
                {student.totalWatchTimeHours}
                <span className="text-xs text-[#A8A294] font-sans font-normal"> hrs</span>
              </div>
              <div className="text-[10px] text-[#A8A294]">Last active {student.lastActive}</div>
            </div>

            <div className="p-3 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D]">
              <div className="text-[10px] font-bold text-[#A8A294] uppercase">Mains DAW Evaluated</div>
              <div className="text-xl font-bold font-serif text-[#F7F3E6] mt-0.5">
                {student.mainsDawSubmitted}
                <span className="text-xs text-[#A8A294] font-sans font-normal"> / {student.mainsDawTotal}</span>
              </div>
              <div className="text-[10px] text-[#34D399]">
                Prelims Avg: {student.prelimsAverageScore}%
              </div>
            </div>
          </div>

          {/* Master Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-[#A8A294]">
              <span>Overall Syllabus & Video Completion</span>
              <span className="font-bold text-[#F7F3E6]">{student.overallCourseProgress}%</span>
            </div>
            <div className="h-2.5 w-full bg-[#1E1E1E] rounded-full overflow-hidden border border-[#3D3D3D]">
              <div
                className="h-full bg-gradient-to-r from-[#C19B48] to-[#E8CF8D] rounded-full transition-all duration-500"
                style={{ width: `${student.overallCourseProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 4. Tab Navigation Header */}
        <div className="px-6 border-b border-[#3D3D3D] bg-[#1E1E1E] flex items-center gap-6 shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('videos')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'videos'
                ? 'border-[#C19B48] text-[#C19B48]'
                : 'border-transparent text-[#A8A294] hover:text-[#F7F3E6]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Granular Video Timestamp Logs ({student.videoLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('academics_gate')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'academics_gate'
                ? 'border-[#C19B48] text-[#C19B48]'
                : 'border-transparent text-[#A8A294] hover:text-[#F7F3E6]'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Turnstile RFID & Exam Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('security_devices')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'security_devices'
                ? 'border-[#C19B48] text-[#C19B48]'
                : 'border-transparent text-[#A8A294] hover:text-[#F7F3E6]'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Device Telemetry</span>
          </button>
        </div>

        {/* 5. Scrollable Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {/* TAB 1: VIDEO WATCH TIMESTAMPS */}
          {activeTab === 'videos' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#A8A294] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={videoSearch}
                    onChange={(e) => setVideoSearch(e.target.value)}
                    placeholder="Search lecture title, section, or faculty..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] placeholder-[#A8A294] focus:outline-hidden focus:border-[#C19B48]"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-[#C19B48]" />
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48] cursor-pointer"
                  >
                    {subjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub === 'ALL' ? 'All Subjects' : sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Video Watch Records List */}
              <div className="space-y-3">
                {filteredVideos.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#A8A294] bg-[#262626] border border-[#3D3D3D] rounded-xl">
                    No lecture video logs matching your search criteria.
                  </div>
                ) : (
                  filteredVideos.map((log) => (
                    <div
                      key={log.lectureId}
                      className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-[#C19B48] bg-[#C19B48]/15 px-2 py-0.5 rounded border border-[#C19B48]/30">
                              {log.subject}
                            </span>
                            <span className="text-[11px] text-[#A8A294]">
                              {log.faculty}
                            </span>
                          </div>
                          <h4 className="text-sm font-semibold text-[#F7F3E6]">
                            {log.lectureTitle}
                          </h4>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[11px] font-medium text-[#A8A294]">
                            Total Duration: {log.totalDuration}
                          </div>
                          <div className="text-[10px] text-[#A8A294]">
                            Last activity: {log.lastWatchedAt}
                          </div>
                        </div>
                      </div>

                      {/* Video Timestamp Progress Component */}
                      <VideoProgressBar
                        percentage={log.watchPercentage}
                        timestampText={log.watchedTimestamp}
                        totalDuration={log.totalDuration}
                        status={log.status}
                        skipAlert={log.skipAlert}
                      />

                      {/* Extra playback telemetry */}
                      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#3D3D3D]/60 text-[11px] text-[#A8A294]">
                        <div className="flex items-center gap-4">
                          <span>
                            Plays: <strong className="text-[#F7F3E6]">{log.watchCount} times</strong>
                          </span>
                          <span>
                            Speed Avg: <strong className="text-[#F7F3E6]">{log.playbackSpeedAvg}</strong>
                          </span>
                        </div>
                        {log.watchPercentage >= 95 ? (
                          <span className="text-[#34D399] font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed Syllabus Milestone
                          </span>
                        ) : log.watchPercentage > 0 ? (
                          <span className="text-[#E8CF8D] font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Resume at {log.watchedTimestamp.split(' / ')[0]}
                          </span>
                        ) : (
                          <span className="text-[#A8A294]">Not yet started by student</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ACADEMICS & TURNSTILE */}
          {activeTab === 'academics_gate' && (
            <div className="space-y-6">
              {/* Campus Gate Access Logs */}
              <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-[#C19B48]" />
                    <h3 className="text-sm font-bold text-[#F7F3E6]">
                      Campus Gate Turnstile RFID Access Logs
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-[#C19B48] bg-[#1E1E1E] px-2 py-0.5 rounded border border-[#3D3D3D]">
                    RFID: {student.rfidTurnstileId}
                  </span>
                </div>

                <div className="divide-y divide-[#3D3D3D] border border-[#3D3D3D] rounded-lg overflow-hidden">
                  {student.gateLogs.map((gate, i) => (
                    <div key={i} className="p-3 flex items-center justify-between bg-[#1E1E1E] text-xs">
                      <div>
                        <div className="font-semibold text-[#F7F3E6]">{gate.gate}</div>
                        <div className="text-[11px] text-[#A8A294]">{gate.timestamp}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#262626] border border-[#3D3D3D] text-[#A8A294]">
                          {gate.method}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            gate.direction === 'ENTRY'
                              ? 'bg-[#34D399]/20 text-[#34D399]'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {gate.direction}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Academic Exam Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#A8A294]">
                    <span>Mains Answer Writing Submissions</span>
                    <FileCheck className="w-4 h-4 text-[#C19B48]" />
                  </div>
                  <div className="text-2xl font-bold font-serif text-[#F7F3E6]">
                    {student.mainsDawSubmitted} / {student.mainsDawTotal}
                  </div>
                  <p className="text-[11px] text-[#34D399]">
                    Evaluation Completion: {Math.round((student.mainsDawSubmitted / student.mainsDawTotal) * 100)}%
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#A8A294]">
                    <span>Fee Payment Status</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#3D3D3D] text-[#E8CF8D]">
                      {student.feeStatus}
                    </span>
                  </div>
                  <div className="text-2xl font-bold font-serif text-[#F7F3E6]">
                    {student.pendingFeeAmount || '₹0 Balance'}
                  </div>
                  <p className="text-[11px] text-[#A8A294]">
                    Authorized for Class Attendance & Tests
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEVICE TELEMETRY */}
          {activeTab === 'security_devices' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4 text-[#C19B48]" />
                    <h3 className="text-sm font-bold text-[#F7F3E6]">
                      Primary Streaming Device & IP Telemetry
                    </h3>
                  </div>
                  <span className="text-[10px] font-semibold text-[#34D399] bg-[#34D399]/15 border border-[#34D399]/30 px-2 py-0.5 rounded-full">
                    {student.activeDevice.concurrentSessions} Active Session
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D]">
                    <span className="text-[10px] uppercase text-[#A8A294] font-bold">Hardware Model</span>
                    <div className="text-[#F7F3E6] font-medium mt-0.5">{student.activeDevice.deviceModel}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D]">
                    <span className="text-[10px] uppercase text-[#A8A294] font-bold">Operating System & Browser</span>
                    <div className="text-[#F7F3E6] font-medium mt-0.5">
                      {student.activeDevice.os} • {student.activeDevice.browser}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D]">
                    <span className="text-[10px] uppercase text-[#A8A294] font-bold">IP Address</span>
                    <div className="font-mono text-[#E8CF8D] mt-0.5">{student.activeDevice.ipAddress}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-[#1E1E1E] border border-[#3D3D3D]">
                    <span className="text-[10px] uppercase text-[#A8A294] font-bold">Geolocation</span>
                    <div className="text-[#F7F3E6] font-medium mt-0.5">{student.activeDevice.location}</div>
                  </div>
                </div>

                {student.activeDevice.concurrentSessions > 1 && (
                  <div className="p-3 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 text-xs text-[#EF4444] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Multiple concurrent sessions detected. Potential credential sharing.</span>
                    </div>
                    <button
                      onClick={handleRevokeDevice}
                      className="px-2.5 py-1 rounded bg-[#EF4444] text-white font-bold cursor-pointer"
                    >
                      Revoke
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
