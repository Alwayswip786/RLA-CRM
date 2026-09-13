import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

interface DoubtTicket {
  id: string;
  studentName: string;
  rollNumber: string;
  subject: string;
  query: string;
  timeAgo: string;
  status: 'pending' | 'resolved';
  reply?: string;
}

const DOUBTS: DoubtTicket[] = [
  {
    id: 'd-01',
    studentName: 'Vikram Mehta',
    rollNumber: 'RLA-2026-055',
    subject: 'Civil Procedure Code (Section 11)',
    query: 'Sir, can a subsequent suit be barred under constructive res judicata if the plaintiff claims a different statutory relief arising from the same transaction?',
    timeAgo: '20 mins ago',
    status: 'pending',
  },
  {
    id: 'd-02',
    studentName: 'Sneha Kapoor',
    rollNumber: 'RLA-2026-072',
    subject: 'BNSS 2023 (Section 35)',
    query: 'Regarding BNSS arrest guidelines, is section 35 notice of appearance mandatory even if the investigating officer believes the accused may tamper with electronic evidence?',
    timeAgo: '45 mins ago',
    status: 'pending',
  },
  {
    id: 'd-03',
    studentName: 'Pooja Sharma',
    rollNumber: 'RLA-2026-042',
    subject: 'Civil Procedure Code (Order 14)',
    query: 'Can a pure question of jurisdiction be framed and disposed of as a preliminary issue when facts regarding territorial limit are disputed by defendant?',
    timeAgo: 'Yesterday',
    status: 'resolved',
    reply: 'No, Pooja. If jurisdiction depends on a mixed question of fact and law (such as disputed place of cause of action), evidence must be led and it cannot be decided as a preliminary issue alone.',
  },
];

export const DoubtsPage: React.FC = () => {
  const [tickets, setTickets] = useState<DoubtTicket[]>(DOUBTS);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = (ticketId: string) => {
    if (!replyText) return;
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, status: 'resolved', reply: replyText }
          : t
      )
    );
    toast.success('Reply Sent to Student Classroom Portal', {
      description: 'Audio & text response synchronized to student Doubt Desk.',
    });
    setActiveTicketId(null);
    setReplyText('');
  };

  return (
    <div className="space-y-6 select-none">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-semibold">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Academic Mentorship Desk</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Faculty Doubt Resolution Desk
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Review legal queries submitted by aspirants across Bare Acts, draft voice or text explanations, and maintain a mentor knowledge base.
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs text-[#A8A294]">Unresolved Questions:</div>
          <div className="font-serif text-2xl font-bold text-[#60A5FA]">
            {tickets.filter((t) => t.status === 'pending').length} Tickets
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {tickets.map((t) => (
          <div
            key={t.id}
            className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#F7F3E6]">{t.studentName}</span>
                <span className="font-mono text-xs text-[#A8A294] bg-[#262626] px-2 py-0.5 rounded border border-[#3D3D3D]">
                  {t.rollNumber}
                </span>
                <span className="text-xs text-[#C19B48] font-medium bg-[#C19B48]/15 px-2 py-0.5 rounded">
                  {t.subject}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  t.status === 'pending'
                    ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                    : 'bg-[#34D399]/20 text-[#34D399]'
                }`}
              >
                {t.status}
              </span>
            </div>

            <p className="text-xs text-[#F7F3E6] leading-relaxed bg-[#262626] p-4 rounded-xl border border-[#3D3D3D]">
              "{t.query}"
            </p>

            {t.reply && (
              <div className="p-4 rounded-xl bg-[#1A1A1A] border-l-4 border-[#34D399] space-y-1 text-xs">
                <span className="text-[10px] uppercase font-bold text-[#34D399]">Faculty Response:</span>
                <p className="text-[#A8A294] leading-relaxed">{t.reply}</p>
              </div>
            )}

            {t.status === 'pending' && (
              <div className="pt-2">
                {activeTicketId === t.id ? (
                  <div className="space-y-3">
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type mentor legal explanation or precedent citation..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48]"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setActiveTicketId(null)}
                        className="px-3 py-1.5 rounded-lg text-xs text-[#A8A294] hover:text-[#F7F3E6]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSendReply(t.id)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Answer</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveTicketId(t.id)}
                    className="px-4 py-1.5 rounded-lg bg-[#262626] hover:bg-[#C19B48] text-[#F7F3E6] hover:text-[#1E1E1E] border border-[#3D3D3D] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Reply to Student
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
