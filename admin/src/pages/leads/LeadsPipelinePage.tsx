import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  Phone,
  Plus,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface LeadCard {
  id: string;
  name: string;
  phone: string;
  email: string;
  targetExam: string;
  stage: 'new' | 'contacted' | 'demo' | 'fee_discussion' | 'enrolled';
  source: string;
  dateAdded: string;
  priority: 'high' | 'medium' | 'normal';
}

const INITIAL_LEADS: LeadCard[] = [
  {
    id: 'lead-01',
    name: 'Vikramaditya Rao',
    phone: '+91 98112 88901',
    email: 'vikram.rao@delhi.ac.in',
    targetExam: 'Delhi Judicial Services (DJS 2026)',
    stage: 'new',
    source: 'Website Form',
    dateAdded: 'Today, 10:15 AM',
    priority: 'high',
  },
  {
    id: 'lead-02',
    name: 'Meenakshi Sundaram',
    phone: '+91 97120 44512',
    email: 'meenakshi.s@gmail.com',
    targetExam: 'Haryana PCS-J Foundation',
    stage: 'new',
    source: 'Walk-in Inquiry',
    dateAdded: 'Today, 11:30 AM',
    priority: 'high',
  },
  {
    id: 'lead-03',
    name: 'Adv. Sameer Tandon',
    phone: '+91 99231 00451',
    email: 'sameer.adv@clc.in',
    targetExam: 'UP PCS-J Mains Writing',
    stage: 'contacted',
    source: 'WhatsApp Hotline',
    dateAdded: 'Yesterday',
    priority: 'medium',
  },
  {
    id: 'lead-04',
    name: 'Priyanka Chawla',
    phone: '+91 98990 77123',
    email: 'priyanka.chawla@law.du.ac.in',
    targetExam: 'Judicial Foundation (Morning Cohort)',
    stage: 'demo',
    source: 'Faculty Referral',
    dateAdded: '11 Sep 2026',
    priority: 'high',
  },
  {
    id: 'lead-05',
    name: 'Arjun Nambiar',
    phone: '+91 94110 55678',
    email: 'arjun.n@nuals.ac.in',
    targetExam: 'CPC Pleadings Mastery',
    stage: 'fee_discussion',
    source: 'Website Demo',
    dateAdded: '09 Sep 2026',
    priority: 'medium',
  },
  {
    id: 'lead-06',
    name: 'Devika Singhania',
    phone: '+91 98101 22345',
    email: 'devika.singhania@ilslaw.edu',
    targetExam: 'Judicial Services Foundation',
    stage: 'enrolled',
    source: 'Campus Seminar',
    dateAdded: '08 Sep 2026',
    priority: 'normal',
  },
];

export const LeadsPipelinePage: React.FC = () => {
  const [leads, setLeads] = useState<LeadCard[]>(INITIAL_LEADS);
  const [search, setSearch] = useState('');

  const moveStage = (id: string, newStage: LeadCard['stage']) => {
    setLeads((prev) =>
      prev.map((lead) => (lead.id === id ? { ...lead, stage: newStage } : lead))
    );
    toast.success('Lead Stage Updated', {
      description: `Moved candidate to ${newStage.replace('_', ' ').toUpperCase()}`,
    });
  };

  const columns: { stage: LeadCard['stage']; label: string; color: string }[] = [
    { stage: 'new', label: 'New Inquiries', color: 'border-l-4 border-[#C19B48]' },
    { stage: 'contacted', label: 'Contacted / Follow-up', color: 'border-l-4 border-[#60A5FA]' },
    { stage: 'demo', label: 'Trial & Demo Class', color: 'border-l-4 border-[#F59E0B]' },
    { stage: 'fee_discussion', label: 'Fee Discussion', color: 'border-l-4 border-purple-500' },
    { stage: 'enrolled', label: 'Enrolled / Admitted', color: 'border-l-4 border-[#34D399]' },
  ];

  const filtered = leads.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.targetExam.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search)
  );

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <UserPlus className="w-3.5 h-3.5" />
            <span>Admissions & Recruitment CRM</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Inquiry Pipeline & Kanban Desk
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Manage aspiring judiciary candidates across conversion stages: Initial Inquiries → Counselor Calls → Demo Classroom Sessions → Formal Enrollment.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-[#A8A294] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate name, exam..."
              className="pl-9 pr-4 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] placeholder-[#A8A294] focus:outline-hidden focus:border-[#C19B48]"
            />
          </div>
          <button
            onClick={() => toast.info('New Lead Registration Form Opened')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
        {columns.map((col) => {
          const colLeads = filtered.filter((l) => l.stage === col.stage);
          return (
            <div
              key={col.stage}
              className="p-3.5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-3 min-w-[240px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-[#3D3D3D]">
                <span className="text-xs font-bold text-[#F7F3E6] truncate">
                  {col.label}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#262626] border border-[#3D3D3D] text-[#C19B48]">
                  {colLeads.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2.5">
                {colLeads.length === 0 ? (
                  <div className="p-4 text-center text-[11px] text-[#A8A294] bg-[#262626]/50 rounded-xl border border-dashed border-[#3D3D3D]">
                    No candidates in this stage
                  </div>
                ) : (
                  colLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className={`p-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors space-y-2.5 ${col.color}`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#F7F3E6] truncate">
                            {lead.name}
                          </h4>
                          {lead.priority === 'high' && (
                            <span className="text-[9px] font-bold text-[#EF4444] bg-[#EF4444]/15 px-1.5 py-0.2 rounded">
                              HOT
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#C19B48] truncate mt-0.5">
                          {lead.targetExam}
                        </p>
                      </div>

                      <div className="space-y-1 text-[11px] text-[#A8A294]">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#C19B48]" />
                          <span>{lead.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          <span>{lead.dateAdded} • {lead.source}</span>
                        </div>
                      </div>

                      {/* Move Stage Selector */}
                      <div className="pt-2 border-t border-[#3D3D3D] flex items-center justify-between">
                        <span className="text-[10px] text-[#A8A294]">Move to:</span>
                        <select
                          value={lead.stage}
                          onChange={(e) => moveStage(lead.id, e.target.value as LeadCard['stage'])}
                          className="text-[10px] bg-[#1E1E1E] text-[#F7F3E6] px-2 py-0.5 rounded border border-[#3D3D3D] focus:outline-hidden cursor-pointer"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="demo">Demo Class</option>
                          <option value="fee_discussion">Fee Discussion</option>
                          <option value="enrolled">Enrolled</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
