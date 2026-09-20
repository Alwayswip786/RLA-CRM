import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MessageSquare,
  HelpCircle,
  Send,
  Loader2,
  Search,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Scale,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../lib/apiClient';
import { AdminChatConsole } from '../../components/chat/AdminChatConsole';
import { CannedLegalResponses } from '../../components/chat/CannedLegalResponses';
import type { DoubtQuery } from '../../types/doubt.types';

export const DoubtsPage: React.FC = () => {
  // Navigation Tabs: 'triage' (REST Desk) or 'live_chat' (WebSocket Console)
  const [activeTab, setActiveTab] = useState<'triage' | 'live_chat'>('triage');

  // Triage Queries State
  const [queries, setQueries] = useState<DoubtQuery[]>([]);
  const [stats, setStats] = useState({ pending: 0, underReview: 0, resolved: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQueryId, setExpandedQueryId] = useState<string | null>(null);

  // Reply Draft State
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [isReplyingMap, setIsReplyingMap] = useState<Record<string, boolean>>({});

  // 1. Fetch Queries from API
  const fetchQueries = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/doubts/admin/all');
      if (res.data?.queries) {
        setQueries(res.data.queries);
      }
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch admin doubts:', err);
      toast.error('Unable to fetch student doubts from server.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  // Filter queries
  const filteredQueries = useMemo(() => {
    return queries.filter((q) => {
      const matchesStatus =
        statusFilter === 'all' ? true : q.status === statusFilter;

      const matchesSubject =
        subjectFilter === 'all'
          ? true
          : q.subject.toLowerCase() === subjectFilter.toLowerCase();

      const qSearch = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !qSearch ||
        q.queryNumber.toLowerCase().includes(qSearch) ||
        q.studentName.toLowerCase().includes(qSearch) ||
        q.rollNo.toLowerCase().includes(qSearch) ||
        q.title.toLowerCase().includes(qSearch) ||
        q.initialQuestion.toLowerCase().includes(qSearch);

      return matchesStatus && matchesSubject && matchesSearch;
    });
  }, [queries, statusFilter, subjectFilter, searchQuery]);

  // 2. Post Faculty Reply to Query Thread
  const handleSendReply = async (queryId: string) => {
    const text = replyTextMap[queryId]?.trim();
    if (!text) {
      toast.error('Please enter faculty explanation or citation.');
      return;
    }

    setIsReplyingMap((prev) => ({ ...prev, [queryId]: true }));
    try {
      const res = await apiClient.post(`/doubts/${queryId}/reply`, {
        message: text,
      });

      if (res.data?.query) {
        setQueries((prev) =>
          prev.map((q) => (q._id === queryId ? res.data.query : q))
        );
      }

      toast.success(
        <div>
          <div className="font-semibold text-[#F7F3E6]">Faculty Response Broadcasted</div>
          <div className="text-xs text-[#A8A294] mt-0.5">
            Synchronized to student classroom portal.
          </div>
        </div>
      );

      setReplyTextMap((prev) => ({ ...prev, [queryId]: '' }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send reply.');
    } finally {
      setIsReplyingMap((prev) => ({ ...prev, [queryId]: false }));
    }
  };

  // 3. Mark Query as Resolved
  const handleResolve = async (queryId: string) => {
    try {
      const res = await apiClient.patch(`/doubts/admin/${queryId}/status`, {
        status: 'resolved',
      });

      if (res.data?.query) {
        setQueries((prev) =>
          prev.map((q) => (q._id === queryId ? res.data.query : q))
        );
      }

      toast.success('Doubt marked as resolved.');
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  return (
    <div className="space-y-6 select-none animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold">
            <Scale className="w-3.5 h-3.5 text-[#C19B48]" />
            <span>Academic Mentorship & Doubt Resolution Desk</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Faculty Doubt & Mentorship Command
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Review incoming legal queries across Bare Acts, draft authoritative Supreme Court citations, or converse directly via 1-to-1 live chamber chat.
          </p>
        </div>

        {/* Dual Tab Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-[#262626] border border-[#3D3D3D] self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('triage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'triage'
                ? 'bg-[#1E1E1E] text-[#C19B48] border border-[#C19B48]/40 shadow-sm'
                : 'text-[#A8A294] hover:text-[#F7F3E6]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Academic Query Triage</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#333333] text-[#F7F3E6] font-mono">
              {stats.pending + stats.underReview}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('live_chat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'live_chat'
                ? 'bg-[#1E1E1E] text-[#C19B48] border border-[#C19B48]/40 shadow-sm'
                : 'text-[#A8A294] hover:text-[#F7F3E6]'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Live Student Chat Console</span>
          </button>
        </div>
      </div>

      {/* 2. Content Area */}
      {activeTab === 'live_chat' ? (
        /* DESK 2: LIVE CHAT CONSOLE */
        <AdminChatConsole />
      ) : (
        /* DESK 1: FORMAL QUERY TRIAGE QUEUE */
        <div className="space-y-6">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-1">
              <span className="text-[11px] text-[#A8A294]">Pending Action</span>
              <div className="font-serif text-2xl font-bold text-[#F59E0B] font-mono">
                {stats.pending}
              </div>
              <span className="text-[10px] text-[#A8A294]">Awaiting faculty review</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-1">
              <span className="text-[11px] text-[#A8A294]">Under Faculty Review</span>
              <div className="font-serif text-2xl font-bold text-[#60A5FA] font-mono">
                {stats.underReview}
              </div>
              <span className="text-[10px] text-[#A8A294]">Discussion thread active</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-1">
              <span className="text-[11px] text-[#A8A294]">Resolved Queries</span>
              <div className="font-serif text-2xl font-bold text-[#34D399] font-mono">
                {stats.resolved}
              </div>
              <span className="text-[10px] text-[#A8A294]">Complete legal solutions</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-1">
              <span className="text-[11px] text-[#A8A294]">Total Tickets</span>
              <div className="font-serif text-2xl font-bold text-[#F7F3E6] font-mono">
                {stats.total}
              </div>
              <span className="text-[10px] text-[#C19B48]">Cumulative repository</span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {['all', 'pending', 'under_review', 'resolved'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#C19B48] text-[#1E1E1E]'
                      : 'bg-[#262626] text-[#A8A294] hover:text-[#F7F3E6]'
                  }`}
                >
                  {st === 'pending'
                    ? 'Pending'
                    : st === 'under_review'
                    ? 'Under Review'
                    : st === 'resolved'
                    ? 'Resolved'
                    : 'All Queries'}
                </button>
              ))}

              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
              >
                <option value="all">All Subjects</option>
                <option value="Code of Civil Procedure">Code of Civil Procedure</option>
                <option value="Bhartiya Nyaya Sanhita (BNS)">Bhartiya Nyaya Sanhita (BNS)</option>
                <option value="Bhartiya Nagarik Suraksha Sanhita (BNSS)">BNSS 2023</option>
                <option value="Indian Evidence Act / BSA">Evidence / BSA</option>
                <option value="Constitution of India">Constitution of India</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#A8A294] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search student, roll no, issue..."
                  className="pl-8 pr-3 py-1.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] placeholder:text-[#A8A294]/60 focus:outline-none focus:border-[#C19B48] w-48 sm:w-64"
                />
              </div>

              <button
                type="button"
                onClick={fetchQueries}
                disabled={isLoading}
                className="p-2 rounded-xl bg-[#262626] hover:bg-[#333333] border border-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] transition-colors cursor-pointer"
                title="Sync database queries"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#C19B48]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Queries Queue */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 space-y-2 text-[#A8A294]">
              <Loader2 className="w-6 h-6 animate-spin text-[#C19B48]" />
              <span className="text-xs">Loading faculty academic queue...</span>
            </div>
          ) : filteredQueries.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-2">
              <Scale className="w-8 h-8 text-[#C19B48] opacity-60 mx-auto" />
              <h4 className="text-sm font-serif font-bold text-[#F7F3E6]">No Queries in Queue</h4>
              <p className="text-xs text-[#A8A294]">
                All student judicial queries have been resolved or filtered out.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQueries.map((t) => {
                const isExpanded = expandedQueryId === t._id;
                const replyText = replyTextMap[t._id] || '';
                const isReplying = isReplyingMap[t._id] || false;

                return (
                  <div
                    key={t._id}
                    className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#C19B48]/40 transition-colors space-y-4 shadow-xl"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-[#F7F3E6]">
                          {t.studentName}
                        </span>
                        <span className="font-mono text-xs text-[#C19B48] bg-[#262626] px-2 py-0.5 rounded border border-[#3D3D3D]">
                          {t.rollNo}
                        </span>
                        <span className="font-mono text-[11px] text-[#A8A294] bg-[#262626] px-2 py-0.5 rounded">
                          {t.queryNumber}
                        </span>
                        <span className="text-xs text-[#60A5FA] font-medium bg-blue-500/15 px-2 py-0.5 rounded">
                          {t.subject}
                        </span>
                        {t.bareActSection && (
                          <span className="text-xs text-[#F59E0B] font-medium bg-amber-500/15 px-2 py-0.5 rounded font-mono">
                            {t.bareActSection}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {t.priority === 'urgent' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                            Urgent
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                            t.status === 'resolved'
                              ? 'bg-[#34D399]/20 text-[#34D399]'
                              : t.status === 'under_review'
                              ? 'bg-[#60A5FA]/20 text-[#60A5FA]'
                              : 'bg-[#F59E0B]/20 text-[#F59E0B]'
                          }`}
                        >
                          {t.status === 'under_review'
                            ? 'Under Review'
                            : t.status === 'resolved'
                            ? 'Resolved'
                            : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-[#F7F3E6]">{t.title}</h4>
                      <p className="text-xs text-[#A8A294] leading-relaxed bg-[#262626] p-3.5 rounded-xl border border-[#3D3D3D] font-sans">
                        "{t.initialQuestion}"
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-[#3D3D3D] text-xs">
                      <div className="flex items-center gap-3 text-[#A8A294] text-[11px]">
                        <span>{new Date(t.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        <span>•</span>
                        <span>{t.thread?.length || 1} Discussion Entries</span>
                        {t.assignedFacultyName && (
                          <>
                            <span>•</span>
                            <span className="text-[#C19B48] flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              {t.assignedFacultyName}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {t.status !== 'resolved' && (
                          <button
                            type="button"
                            onClick={() => handleResolve(t._id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Mark Resolved</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setExpandedQueryId(isExpanded ? null : t._id)}
                          className="px-3 py-1 rounded-lg bg-[#262626] hover:bg-[#333333] border border-[#3D3D3D] text-[#F7F3E6] font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? 'Hide Thread' : 'Answer / View Thread'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Thread & Canned Citations Inserter */}
                    {isExpanded && (
                      <div className="p-4 sm:p-5 border-t border-[#3D3D3D] bg-[#181818] rounded-xl space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="space-y-2.5">
                          <div className="text-[11px] font-bold text-[#A8A294] uppercase tracking-wider">
                            Discussion History
                          </div>

                          {t.thread?.map((msg, idx) => {
                            const isStaff = msg.senderRole !== 'student';
                            return (
                              <div
                                key={msg._id || idx}
                                className={`p-3.5 rounded-xl text-xs space-y-1.5 ${
                                  isStaff
                                    ? 'bg-[#262626] border-l-4 border-[#C19B48] text-[#F7F3E6]'
                                    : 'bg-[#202020] border border-[#3D3D3D] text-[#A8A294]'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="font-semibold text-[#F7F3E6] flex items-center gap-1">
                                    {isStaff && <Sparkles className="w-3 h-3 text-[#C19B48]" />}
                                    <span>
                                      {msg.senderName} ({isStaff ? 'Faculty Response' : 'Student Question'})
                                    </span>
                                  </span>
                                  <span className="text-[#A8A294]/60 text-[10px]">
                                    {new Date(msg.createdAt).toLocaleString([], {
                                      day: '2-digit',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>

                                <p className="whitespace-pre-wrap leading-relaxed text-[#F7F3E6] font-sans">
                                  {msg.message}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Faculty Reply Box with Canned Responses */}
                        <div className="pt-2 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#F7F3E6]">
                              Draft Faculty Reasoning or Citation:
                            </span>

                            <CannedLegalResponses
                              onSelectResponse={(text) =>
                                setReplyTextMap((prev) => ({
                                  ...prev,
                                  [t._id]: prev[t._id] ? `${prev[t._id]}\n\n${text}` : text,
                                }))
                              }
                            />
                          </div>

                          <textarea
                            rows={4}
                            value={replyText}
                            onChange={(e) =>
                              setReplyTextMap((prev) => ({
                                ...prev,
                                [t._id]: e.target.value,
                              }))
                            }
                            placeholder="Type mentor legal explanation or insert landmark precedent using the button above..."
                            className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] placeholder:text-[#A8A294]/60 focus:outline-none focus:border-[#C19B48] leading-relaxed resize-none font-sans"
                          />

                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyTextMap((prev) => ({ ...prev, [t._id]: '' }));
                                setExpandedQueryId(null);
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs text-[#A8A294] hover:text-[#F7F3E6]"
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              disabled={!replyText || isReplying}
                              onClick={() => handleSendReply(t._id)}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {isReplying ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Send Answer to Student</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
