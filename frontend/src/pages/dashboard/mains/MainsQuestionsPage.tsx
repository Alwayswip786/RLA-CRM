import React, { useState } from 'react';
import {
  PenTool,
  Clock,
  BookOpen,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

export const MainsQuestionsPage: React.FC = () => {
  const [draftAnswer, setDraftAnswer] = useState('');

  const wordCount = draftAnswer.trim() ? draftAnswer.trim().split(/\s+/).length : 0;

  const handleSubmitDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (wordCount < 50) {
      toast.error('Draft is too brief. Judicial mains answers require at least 150-250 words.');
      return;
    }
    toast.success('Mains draft saved! Proceed to PDF upload or await mentor review.', {
      duration: 4000,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] text-xs font-semibold mb-2">
            <PenTool className="w-3.5 h-3.5" />
            <span>Daily Answer Writing (DAW) Clinic</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Daily Mains Problem & Legal Drafting
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Build judicial writing discipline with structured daily problems evaluated by Rajinder Sir.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Submission Deadline: 10:00 PM Today</span>
          </span>
        </div>
      </div>

      {/* Today's Mains Problem Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-[#143564]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#c19b48] uppercase tracking-wider">
              Civil Law I (CPC & Specific Relief Act)
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">Question ID: DAW-2025-084</span>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-[#0a1c36] dark:bg-[#143564] text-white">
            20 Marks • Word Limit: 300-350 Words
          </span>
        </div>

        {/* Problem Statement */}
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 dark:text-white leading-snug">
            Q. Discuss the scope and principles governing the doctrine of Res Sub Judice under Section 10 of the Code of Civil Procedure, 1908. Does the pendency of a previously instituted suit in a Foreign Court bar a court in India from trying a subsequent suit on identical cause of action? Cite relevant case law.
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Candidates must address: (i) Essential pre-conditions for invoking Section 10; (ii) Test of identity of matter in issue; (iii) Power to grant interim injunctions during Section 10 stay; (iv) The statutory exception provided under the Explanation to Section 10 regarding Foreign Courts.
          </p>
        </div>

        {/* Model Outline Guide */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] space-y-2">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#c19b48]" />
            <span>Recommended Headings & Structure</span>
          </h4>
          <ul className="text-xs text-slate-600 dark:text-slate-300 list-disc list-inside space-y-1">
            <li><strong>Introduction:</strong> Purpose of Sec 10 to avoid conflicting decrees by courts of concurrent jurisdiction.</li>
            <li><strong>Key Ingredients:</strong> Previously instituted vs subsequently instituted suit; same parties or litigating under same title; court competent to grant relief.</li>
            <li><strong>Foreign Court Exception:</strong> Reference Explanation to Section 10 explicitly.</li>
            <li><strong>Judicial Dictum:</strong> <em>National Institute of Mental Health v. C. Parameshwara (2005 SC)</em>.</li>
          </ul>
        </div>
      </div>

      {/* Interactive Answer Drafting Canvas */}
      <form onSubmit={handleSubmitDraft} className="p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PenTool className="w-4 h-4 text-[#c19b48]" />
            <span>Direct Text Answer Workspace</span>
          </h3>
          <span className={`text-xs font-mono font-semibold ${wordCount > 350 ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'}`}>
            {wordCount} / 350 Words
          </span>
        </div>

        <textarea
          rows={8}
          value={draftAnswer}
          onChange={(e) => setDraftAnswer(e.target.value)}
          placeholder="Start typing your structured legal answer here (Introduction, Pre-conditions, Landmark Cases, Conclusion)..."
          className="w-full p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs sm:text-sm font-normal text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48] leading-relaxed transition-all"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Prefer handwritten answers? You can scan and upload your handwritten sheets via the PDF uploader.
          </p>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit for Evaluation</span>
          </button>
        </div>
      </form>
    </div>
  );
};
