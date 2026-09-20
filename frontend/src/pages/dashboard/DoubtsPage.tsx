import React, { useState, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Send,
  Loader2,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles,
  Scale,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../lib/apiClient';
import { ChamberChatWindow } from '../../components/chat/ChamberChatWindow';
import type { DoubtQuery, DoubtCategory, DoubtPriority } from '../../types/doubt.types';

export const DoubtsPage: React.FC = () => {
  // Navigation Tabs: 'queries' (Formal REST) or 'live_chat' (WebSocket)
  const [activeTab, setActiveTab] = useState<'queries' | 'live_chat'>('queries');
  const [chatContext, setChatContext] = useState<{ queryNumber?: string; subject?: string } | undefined>();

  // Formal Queries State
  const [queries, setQueries] = useState<DoubtQuery[]>([]);
  const [isLoadingQueries, setIsLoadingQueries] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQueryId, setExpandedQueryId] = useState<string | null>(null);

  // New Query Form State
  const [subject, setSubject] = useState('Code of Civil Procedure');
  const [bareActSection, setBareActSection] = useState('');
  const [title, setTitle] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [category, setCategory] = useState<DoubtCategory>('Bare Act Interpretation');
  const [priority, setPriority] = useState<DoubtPriority>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Thread Reply State
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [isSubmittingReply, setIsSubmittingReply] = useState<Record<string, boolean>>({});

  // 1. Fetch Student's Doubt Queries
  const fetchQueries = async () => {
    try {
      setIsLoadingQueries(true);
      const res = await apiClient.get('/doubts/my-queries');
      if (res.data?.queries) {
        setQueries(res.data.queries);
      }
    } catch (err) {
      console.error('Failed to fetch doubts:', err);
      toast.error('Unable to load doubt queries.');
    } finally {
      setIsLoadingQueries(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, []);

  // Filter queries
  const filteredQueries = useMemo(() => {
    return queries.filter((q) => {
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'pending'
          ? q.status === 'pending' || q.status === 'under_review'
          : q.status === statusFilter;

      const qSearch = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !qSearch ||
        q.queryNumber.toLowerCase().includes(qSearch) ||
        q.title.toLowerCase().includes(qSearch) ||
        q.initialQuestion.toLowerCase().includes(qSearch) ||
        q.subject.toLowerCase().includes(qSearch) ||
        (q.bareActSection && q.bareActSection.toLowerCase().includes(qSearch));

      return matchesStatus && matchesSearch;
    });
  }, [queries, statusFilter, searchQuery]);

  // 2. Submit New Legal Query
  const handlePostDoubt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      toast.error('Please enter your question or case scenario.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/doubts', {
        subject,
        bareActSection: bareActSection.trim(),
        title: title.trim(),
        initialQuestion: questionText.trim(),
        category,
        priority,
      });

      const newQuery: DoubtQuery = res.data?.query;
      if (newQuery) {
        setQueries((prev) => [newQuery, ...prev]);
        setExpandedQueryId(newQuery._id);
      }

      toast.success(
        <div>
          <div className="font-semibold">Query Registered: {newQuery?.queryNumber}</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Submitted to Academic Faculty Desk. Faculty will post citation within 24 hours.
          </div>
        </div>
      );

      // Reset form
      setTitle('');
      setBareActSection('');
      setQuestionText('');
      setPriority('normal');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit query. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Post Follow-up Reply to a Thread
  const handleSendThreadReply = async (queryId: string) => {
    const text = replyTextMap[queryId]?.trim();
    if (!text) return;

    setIsSubmittingReply((prev) => ({ ...prev, [queryId]: true }));
    try {
      const res = await apiClient.post(`/doubts/${queryId}/reply`, {
        message: text,
      });

      if (res.data?.query) {
        setQueries((prev) =>
          prev.map((q) => (q._id === queryId ? res.data.query : q))
        );
      }

      toast.success('Follow-up clarification posted to faculty thread.');
      setReplyTextMap((prev) => ({ ...prev, [queryId]: '' }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to post reply.');
    } finally {
      setIsSubmittingReply((prev) => ({ ...prev, [queryId]: false }));
    }
  };

  // 4. Mark Query as Resolved
  const handleResolveQuery = async (queryId: string) => {
    try {
      const res = await apiClient.patch(`/doubts/${queryId}/resolve`);
      if (res.data?.query) {
        setQueries((prev) =>
          prev.map((q) => (q._id === queryId ? res.data.query : q))
        );
      }
      toast.success('Query marked as resolved.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update status.');
    }
  };

  // 5. Escalate Query to Live Chat
  const handleEscalateToChat = (query: DoubtQuery) => {
    setChatContext({
      queryNumber: query.queryNumber,
      subject: query.subject,
    });
    setActiveTab('live_chat');
    toast.info(`Opening live chamber conversation for ${query.queryNumber}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner & Dual Tab Controls */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-semibold">
              <Scale className="w-3.5 h-3.5" />
              <span>Judicial Mentorship & Doubt Resolution Chamber</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
              Academic Mentorship Chamber
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Submit formal statutory queries with case law citations, or converse 1-to-1 in real-time with Adv. Rajinder Sir.
            </p>
          </div>

          {/* Tab Switcher Buttons */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('queries')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'queries'
                  ? 'bg-white dark:bg-[#0a1c36] text-[#c19b48] dark:text-[#e8cf8d] shadow-xs border border-slate-200/80 dark:border-[#c19b48]/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Formal Legal Queries</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-[#143564] font-mono">
                {queries.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('live_chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'live_chat'
                  ? 'bg-white dark:bg-[#0a1c36] text-[#c19b48] dark:text-[#e8cf8d] shadow-xs border border-slate-200/80 dark:border-[#c19b48]/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Faculty Chamber</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Content Area */}
      {activeTab === 'live_chat' ? (
        /* TAB 2: LIVE WEBSOCKET CHAT */
        <ChamberChatWindow initialQueryContext={chatContext} />
      ) : (
        /* TAB 1: FORMAL REST QUERY SYSTEM */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (5 Cols): Submit Query Form */}
          <div className="lg:col-span-5 space-y-4">
            <form
              onSubmit={handlePostDoubt}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#143564] pb-3">
                <h3 className="text-sm font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#c19b48]" />
                  <span>Submit New Legal Query</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Formal Q&A Desk</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Subject Area
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48]"
                >
                  <option value="Code of Civil Procedure">Code of Civil Procedure (CPC)</option>
                  <option value="Bhartiya Nyaya Sanhita (BNS)">Bhartiya Nyaya Sanhita (BNS)</option>
                  <option value="Bhartiya Nagarik Suraksha Sanhita (BNSS)">Bhartiya Nagarik Suraksha Sanhita (BNSS)</option>
                  <option value="Indian Evidence Act / BSA">Indian Evidence Act / BSA</option>
                  <option value="Constitution of India">Constitution of India</option>
                  <option value="Contract & Specific Relief">Contract & Specific Relief Act</option>
                  <option value="Limitation Act & Transfer of Property">Limitation & TPA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Specific Bare Act Provision / Section (Optional)
                </label>
                <input
                  type="text"
                  value={bareActSection}
                  onChange={(e) => setBareActSection(e.target.value)}
                  placeholder="e.g. Section 11 CPC or Section 111 BNS"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Question Title / Legal Issue
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Res Judicata applicability between co-defendants"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Detailed Question or Case Scenario
                </label>
                <textarea
                  rows={5}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="State the factual proposition, contradictory High Court judgments, or legal ambiguity..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48] leading-relaxed resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DoubtCategory)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48]"
                  >
                    <option value="Bare Act Interpretation">Bare Act Interpretation</option>
                    <option value="Mains Answer Drafting">Mains Answer Drafting</option>
                    <option value="Case Law & Precedent">Case Law & Precedent</option>
                    <option value="Procedural Practice">Procedural Practice</option>
                    <option value="General Legal Doubt">General Legal Doubt</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as DoubtPriority)}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48]"
                  >
                    <option value="normal">Standard Priority</option>
                    <option value="urgent">Urgent (Exam Doubt)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Query to Faculty</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column (7 Cols): Query History & Threads */}
          <div className="lg:col-span-7 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {['all', 'pending', 'resolved'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#c19b48] text-[#061120]'
                        : 'bg-slate-100 dark:bg-[#061120] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {st === 'pending' ? 'Active / In Review' : st}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search queries..."
                    className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48] w-40 sm:w-48"
                  />
                </div>

                <button
                  type="button"
                  onClick={fetchQueries}
                  disabled={isLoadingQueries}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-slate-200 dark:hover:bg-[#143564] border border-slate-200 dark:border-[#143564] text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Refresh queries"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQueries ? 'animate-spin text-[#c19b48]' : ''}`} />
                </button>
              </div>
            </div>

            {/* Queries List */}
            {isLoadingQueries ? (
              <div className="flex flex-col items-center justify-center p-12 space-y-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#c19b48]" />
                <span className="text-xs">Loading faculty queries ledger...</span>
              </div>
            ) : filteredQueries.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-serif font-bold text-slate-900 dark:text-white">
                  No Legal Queries Found
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No queries match your current search criteria.'
                    : 'Submit your first academic doubt using the form on the left.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredQueries.map((item) => {
                  const isExpanded = expandedQueryId === item._id;
                  const replyText = replyTextMap[item._id] || '';
                  const isSendingReply = isSubmittingReply[item._id] || false;

                  return (
                    <div
                      key={item._id}
                      className="rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] overflow-hidden shadow-xs transition-all"
                    >
                      {/* Query Card Header */}
                      <div className="p-4 sm:p-5 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              {item.queryNumber}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-slate-100 dark:bg-[#061120] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#143564]">
                              {item.subject}
                            </span>
                            {item.bareActSection && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-[#c19b48] dark:text-[#e8cf8d] border border-amber-500/20 font-medium">
                                {item.bareActSection}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {item.priority === 'urgent' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 animate-pulse">
                                Urgent
                              </span>
                            )}

                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                                item.status === 'resolved'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : item.status === 'under_review'
                                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                  : 'bg-amber-500/15 text-[#c19b48] dark:text-[#e8cf8d] border border-amber-500/30'
                              }`}
                            >
                              {item.status === 'resolved'
                                ? 'Resolved'
                                : item.status === 'under_review'
                                ? 'Under Faculty Review'
                                : 'Pending Evaluation'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-serif font-bold text-slate-900 dark:text-white">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                            {item.initialQuestion}
                          </p>
                        </div>

                        {/* Expand & Actions Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#143564]/60 text-xs">
                          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                            <span>{new Date(item.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            <span>•</span>
                            <span>{item.thread?.length || 1} Discussion Messages</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEscalateToChat(item)}
                              className="px-2.5 py-1 rounded-lg bg-[#c19b48]/10 hover:bg-[#c19b48]/20 text-[#c19b48] dark:text-[#e8cf8d] text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Chat with faculty live"
                            >
                              <span>Live Chamber</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedQueryId(isExpanded ? null : item._id)
                              }
                              className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#061120] hover:bg-slate-200 dark:hover:bg-[#143564] text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <span>{isExpanded ? 'Hide Thread' : 'View Thread'}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Thread Discussion */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-[#143564] bg-slate-50/50 dark:bg-[#061120]/60 space-y-4 animate-in slide-in-from-top-2 duration-200">
                          <div className="space-y-3">
                            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                              Legal Discussion Thread
                            </div>

                            {item.thread?.map((msg, idx) => {
                              const isFaculty = msg.senderRole !== 'student';
                              return (
                                <div
                                  key={msg._id || idx}
                                  className={`p-3.5 sm:p-4 rounded-xl text-xs space-y-1.5 ${
                                    isFaculty
                                      ? 'bg-amber-50/80 dark:bg-[#143564]/50 border border-amber-200 dark:border-[#c19b48]/30 shadow-xs'
                                      : 'bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[11px]">
                                    <div className="flex items-center gap-1.5 font-semibold">
                                      {isFaculty && <Sparkles className="w-3 h-3 text-[#c19b48]" />}
                                      <span
                                        className={
                                          isFaculty
                                            ? 'text-[#c19b48] dark:text-[#e8cf8d]'
                                            : 'text-slate-900 dark:text-white'
                                        }
                                      >
                                        {msg.senderName} ({isFaculty ? 'Judicial Faculty' : 'Student'})
                                      </span>
                                    </div>
                                    <span className="text-slate-400 text-[10px]">
                                      {new Date(msg.createdAt).toLocaleString([], {
                                        day: '2-digit',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>

                                  <p className="whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">
                                    {msg.message}
                                  </p>
                                </div>
                              );
                            })}
                          </div>

                          {/* Follow-up Reply Input */}
                          <div className="pt-2 space-y-2">
                            <textarea
                              rows={3}
                              value={replyText}
                              onChange={(e) =>
                                setReplyTextMap((prev) => ({
                                  ...prev,
                                  [item._id]: e.target.value,
                                }))
                              }
                              placeholder="Post follow-up question or clarification to faculty..."
                              className="w-full p-3 rounded-xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48] resize-none leading-relaxed"
                            />

                            <div className="flex items-center justify-between">
                              {item.status !== 'resolved' && (
                                <button
                                  type="button"
                                  onClick={() => handleResolveQuery(item._id)}
                                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Mark Resolved</span>
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={!replyText || isSendingReply}
                                onClick={() => handleSendThreadReply(item._id)}
                                className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors flex items-center gap-1.5 ml-auto cursor-pointer disabled:opacity-50"
                              >
                                {isSendingReply ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <>
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Post Clarification</span>
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
        </div>
      )}
    </div>
  );
};
