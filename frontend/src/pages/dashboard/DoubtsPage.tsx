import React, { useState } from 'react';
import {
  HelpCircle,
  MessageSquare,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

interface DoubtThread {
  id: string;
  subject: string;
  question: string;
  askedOn: string;
  status: 'Resolved' | 'Under Faculty Review';
  facultyReply?: string;
  facultyName?: string;
  replyTime?: string;
}

const initialDoubts: DoubtThread[] = [
  {
    id: 'd-1',
    subject: 'Civil Procedure (Section 11)',
    question: 'Sir, does Res Judicata apply between co-defendants if no relief was claimed by one against the other in the former suit?',
    askedOn: '09 Sep 2025',
    status: 'Resolved',
    facultyName: 'Adv. Rajinder Sir',
    facultyReply: 'No Rohit. As held in Mahboob Sahab v. Syed Ismail (1995 SC), for res judicata to apply between co-defendants, there must be: (1) a conflict of interest, (2) necessary to decide to give plaintiff relief, and (3) question must have been actually decided.',
    replyTime: '10 Sep 2025',
  },
  {
    id: 'd-2',
    subject: 'Bhartiya Nyaya Sanhita (Section 111)',
    question: 'In Section 111 BNS (Organized Crime), what is the exact minimum punishment if death of any person results from the act?',
    askedOn: '11 Sep 2025',
    status: 'Under Faculty Review',
  },
];

export const DoubtsPage: React.FC = () => {
  const [doubts, setDoubts] = useState<DoubtThread[]>(initialDoubts);
  const [subject, setSubject] = useState('Code of Civil Procedure');
  const [questionText, setQuestionText] = useState('');

  const handlePostDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    const newDoubt: DoubtThread = {
      id: Date.now().toString(),
      subject,
      question: questionText.trim(),
      askedOn: 'Today',
      status: 'Under Faculty Review',
    };

    setDoubts((prev) => [newDoubt, ...prev]);
    setQuestionText('');
    toast.success('Doubt submitted to Academic Faculty Desk!', {
      description: 'Adv. Rajinder Sir will post detailed reasoning within 24 hours.',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Faculty Doubt Resolution Chamber</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
          Ask a Doubt / Academic Mentorship
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Post complex Bare Act interpretations or procedural doubts directly to Adv. Rajinder Sir.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ask Question Form */}
        <form onSubmit={handlePostDoubt} className="p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs h-fit">
          <h3 className="text-sm font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#c19b48]" />
            <span>Submit New Legal Query</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject Area
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48]"
            >
              <option value="Code of Civil Procedure">Code of Civil Procedure (CPC)</option>
              <option value="Bhartiya Nyaya Sanhita (BNS)">Bhartiya Nyaya Sanhita (BNS)</option>
              <option value="Bhartiya Nagarik Suraksha Sanhita (BNSS)">Bhartiya Nagarik Suraksha Sanhita (BNSS)</option>
              <option value="Indian Evidence Act / BSA">Indian Evidence Act / BSA</option>
              <option value="Constitution of India">Constitution of India</option>
              <option value="Contract & Specific Relief">Contract & Specific Relief Act</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Your Question or Case Scenario
            </label>
            <textarea
              rows={5}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="State the specific legal provision, section number, or conflicting high court decisions..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#c19b48] leading-relaxed"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post Query to Mentor</span>
          </button>
        </form>

        {/* Existing Doubt Threads */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
            My Previous Queries ({doubts.length})
          </h3>

          {doubts.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-slate-100 dark:bg-[#061120] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#143564]">
                  {item.subject}
                </span>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    item.status === 'Resolved'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/15 text-[#c19b48] dark:text-[#e8cf8d] border border-amber-500/30 animate-pulse'
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                {item.question}
              </p>

              {item.facultyReply && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-[#143564]/50 border border-amber-200 dark:border-[#c19b48]/30 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#c19b48] dark:text-[#e8cf8d] font-semibold">
                    <span>{item.facultyName} (Judicial Faculty)</span>
                    <span className="text-slate-400 font-normal">{item.replyTime}</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-[11px]">
                    {item.facultyReply}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
