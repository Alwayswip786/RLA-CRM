import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { toast } from '../../lib/toast';
import { apiClient } from '../../lib/apiClient';
import type { DoubtQuery } from '../../types/doubt.types';
import { DoubtTicketSkeleton } from '../../components/ui/skeleton';
import { DoubtQueryCard } from '../../components/doubts/DoubtQueryCard';
import { SubmitDoubtModal } from '../../components/doubts/SubmitDoubtModal';

export const DoubtsPage: React.FC = () => {
  const navigate = useNavigate();

  // Formal Queries State
  const [queries, setQueries] = useState<DoubtQuery[]>([]);
  const [isLoadingQueries, setIsLoadingQueries] = useState(true);
  const [expandedQueryId, setExpandedQueryId] = useState<string | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

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

  // 2. Post Follow-up Reply to a Thread
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
    navigate(
      `/dashboard/chamber?queryId=${query._id}&ref=${encodeURIComponent(query.queryNumber)}&subject=${encodeURIComponent(query.subject)}`
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 1. Dual Tab Controls & Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tab Switcher Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] w-full sm:w-auto">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer bg-white dark:bg-[#0a1c36] text-[#c19b48] dark:text-[#e8cf8d] shadow-xs border border-slate-200/80 dark:border-[#c19b48]/30"
          >
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="sm:hidden">Legal Queries</span>
            <span className="hidden sm:inline">Formal Legal Queries</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/dashboard/chamber')}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0" />
            <span className="sm:hidden">Live Chamber</span>
            <span className="hidden sm:inline">Live Faculty Chamber</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsSubmitModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ask New Query</span>
        </button>
      </div>

      {/* 2. Content Area: Formal Queries Ledger */}
      <div className="space-y-4">
        {/* Queries List */}
        {isLoadingQueries && queries.length === 0 ? (
          <DoubtTicketSkeleton count={3} />
        ) : queries.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4">
            <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-base font-serif font-bold text-slate-900 dark:text-white">
                No Legal Queries Found
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Have a doubt regarding Bare Act provisions, conflicting rulings, or Mains drafting? Submit your query directly to faculty.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Submit Your First Query</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {queries.map((item) => (
              <DoubtQueryCard
                key={item._id}
                query={item}
                isExpanded={expandedQueryId === item._id}
                onToggleExpand={() =>
                  setExpandedQueryId(expandedQueryId === item._id ? null : item._id)
                }
                onEscalateToChat={handleEscalateToChat}
                replyText={replyTextMap[item._id] || ''}
                onReplyTextChange={(text) =>
                  setReplyTextMap((prev) => ({
                    ...prev,
                    [item._id]: text,
                  }))
                }
                onSendReply={() => handleSendThreadReply(item._id)}
                isSendingReply={isSubmittingReply[item._id] || false}
                onResolveQuery={() => handleResolveQuery(item._id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Submit Query Modal */}
      <SubmitDoubtModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onQueryCreated={(newQuery) => {
          setQueries((prev) => [newQuery, ...prev]);
          setExpandedQueryId(newQuery._id);
        }}
      />
    </div>
  );
};
