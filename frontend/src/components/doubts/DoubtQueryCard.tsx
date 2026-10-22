import React from 'react';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Loader2,
  Send,
} from 'lucide-react';
import type { DoubtQuery } from '../../types/doubt.types';

export interface DoubtQueryCardProps {
  query: DoubtQuery;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEscalateToChat: (query: DoubtQuery) => void;
  replyText: string;
  onReplyTextChange: (text: string) => void;
  onSendReply: () => void;
  isSendingReply: boolean;
  onResolveQuery: () => void;
}

export const DoubtQueryCard: React.FC<DoubtQueryCardProps> = ({
  query,
  isExpanded,
  onToggleExpand,
  onEscalateToChat,
  replyText,
  onReplyTextChange,
  onSendReply,
  isSendingReply,
  onResolveQuery,
}) => {
  return (
    <div className="rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] overflow-hidden shadow-xs transition-all">
      {/* Query Card Header */}
      <div className="min-w-0 p-4 sm:p-5 space-y-3">
        {/* Top Badges & Status Row */}
        <div className="space-y-2.5">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center text-[10px] leading-none font-mono font-bold px-2 py-1.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
              {query.queryNumber}
            </span>
            <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
              {query.priority === 'urgent' && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 animate-pulse whitespace-nowrap">
                  Urgent
                </span>
              )}

              <span
                className={`inline-flex items-center max-w-full text-[10px] leading-tight text-center px-2.5 py-1.5 rounded-full font-bold whitespace-normal ${
                  query.status === 'resolved'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : query.status === 'under_review'
                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                    : 'bg-amber-500/15 text-[#c19b48] dark:text-[#e8cf8d] border border-amber-500/30'
                }`}
              >
                {query.status === 'resolved'
                  ? 'Resolved'
                  : query.status === 'under_review'
                  ? 'Under Faculty Review'
                  : 'Pending Evaluation'}
              </span>
            </div>
          </div>

          <span className="inline-flex max-w-full items-center text-[10px] leading-snug px-2.5 py-1.5 rounded-full font-bold bg-slate-100 dark:bg-[#061120] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#143564] break-words [overflow-wrap:anywhere]">
            {query.subject}
          </span>

          {query.bareActSection && (
            <div>
              <span className="inline-flex items-center max-w-full text-[10px] leading-none px-2 py-1 rounded bg-amber-500/10 text-[#c19b48] dark:text-[#e8cf8d] border border-amber-500/20 font-medium whitespace-normal break-words">
                {query.bareActSection}
              </span>
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="space-y-1 min-w-0">
          <h4 className="text-sm sm:text-base font-serif font-bold text-slate-900 dark:text-white break-words leading-snug">
            {query.title}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words [overflow-wrap:anywhere] whitespace-pre-wrap">
            {query.initialQuestion}
          </p>
        </div>

        {/* Expand & Actions Footer */}
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-[#143564]/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          {/* Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-slate-400 text-[11px] min-w-0">
            <span className="whitespace-nowrap font-medium text-slate-500 dark:text-slate-400 shrink-0">
              {new Date(query.createdAt).toLocaleDateString([], {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
            <span className="min-w-0 break-words font-medium text-slate-500 dark:text-slate-400">
              {query.thread?.length || 1} Discussion Messages
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 w-full sm:flex sm:items-center">
            <button
              type="button"
              onClick={() => onEscalateToChat(query)}
              className="min-w-0 w-full sm:w-auto sm:flex-initial inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2.5 rounded-xl bg-[#c19b48]/10 hover:bg-[#c19b48]/20 text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
              title="Chat with faculty live"
            >
              <span>Live Chamber</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </button>

            <button
              type="button"
              onClick={onToggleExpand}
              className="min-w-0 w-full sm:w-auto sm:flex-initial inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-slate-200 dark:hover:bg-[#143564] text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer"
            >
              <span>{isExpanded ? 'Hide Thread' : 'View Thread'}</span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
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

            {query.thread?.map((msg, idx) => {
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
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 text-[11px]">
                    <div className="flex items-center gap-1.5 font-semibold min-w-0">
                      {isFaculty && <Sparkles className="w-3 h-3 text-[#c19b48] shrink-0" />}
                      <span
                        className={`min-w-0 break-words [overflow-wrap:anywhere] ${
                          isFaculty
                            ? 'text-[#c19b48] dark:text-[#e8cf8d]'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {msg.senderName} ({isFaculty ? 'Judicial Faculty' : 'Student'})
                      </span>
                    </div>
                    <span className="text-slate-400 text-[10px] sm:ml-2 whitespace-nowrap">
                      {new Date(msg.createdAt).toLocaleString([], {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

              <p className="whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 break-words [overflow-wrap:anywhere]">
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
              onChange={(e) => onReplyTextChange(e.target.value)}
              placeholder="Post follow-up question or clarification to faculty..."
              className="w-full min-w-0 p-3 rounded-xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48] resize-y leading-relaxed"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              {query.status !== 'resolved' && (
                <button
                  type="button"
                  onClick={onResolveQuery}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Mark Resolved</span>
                </button>
              )}

              <button
                type="button"
                disabled={!replyText || isSendingReply}
                onClick={onSendReply}
                className="max-w-full px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-bold text-xs transition-colors inline-flex items-center justify-center gap-1.5 ml-auto cursor-pointer disabled:opacity-50 whitespace-nowrap"
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
};
