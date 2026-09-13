import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  GraduationCap,
  FileCheck,
  CreditCard,
  Video,
  ArrowRight,
} from 'lucide-react';

interface AdminSession {
  name: string;
  email: string;
  role: string;
  title: string;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState<AdminSession>({
    name: 'Adv. Rajinder Sir',
    email: 'rajinder@rajinderlawacademy.com',
    role: 'director',
    title: 'Director & Academic Dean',
  });

  useEffect(() => {
    const raw = localStorage.getItem('rla_admin_session');
    if (raw) {
      try {
        setAdmin(JSON.parse(raw));
      } catch {
        // fallback
      }
    }
  }, []);

  return (
    <div className="space-y-6 select-none">
      {/* 1. Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5" />
            <span>Chamber Executive Command Active</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Welcome back, {admin.name}
          </h1>
          <p className="text-xs text-[#A8A294] leading-relaxed">
            Signed in with <strong className="text-[#F7F3E6] capitalize">{admin.role}</strong> authority.
            Your academic timetable, Mains DAW copy submissions, student admissions pipeline, and faculty doubts are synchronized with the Student Classroom Portal.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/mains-evaluation')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>Evaluate Copies (14)</span>
          </button>
          <button
            onClick={() => navigate('/leads')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2F2F2F] hover:bg-[#3D3D3D] text-[#F7F3E6] border border-[#3D3D3D] text-xs font-medium transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4 text-[#C19B48]" />
            <span>Admissions CRM</span>
          </button>
        </div>
      </div>

      {/* 2. Operational KPI Ribbon (4 Core Pillars) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Enrolments */}
        <div
          onClick={() => navigate('/students')}
          className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#C19B48]/50 transition-colors cursor-pointer flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between text-[#A8A294] text-xs">
            <span>Enrolled Students</span>
            <Users className="w-4 h-4 text-[#C19B48]" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#F7F3E6]">428</div>
          <div className="text-[11px] text-[#34D399] font-medium flex items-center justify-between">
            <span>+24 this week</span>
            <span className="text-[#A8A294]">PCS-J Foundation</span>
          </div>
        </div>

        {/* Unchecked Mains Copies */}
        <div
          onClick={() => navigate('/mains-evaluation')}
          className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#F59E0B]/50 transition-colors cursor-pointer flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between text-[#A8A294] text-xs">
            <span>Pending Mains Copies</span>
            <FileCheck className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#F7F3E6]">14</div>
          <div className="text-[11px] text-[#F59E0B] font-medium flex items-center justify-between">
            <span>Challenge #48</span>
            <span className="text-xs">Needs Grading</span>
          </div>
        </div>

        {/* New Admission Leads */}
        <div
          onClick={() => navigate('/leads')}
          className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#60A5FA]/50 transition-colors cursor-pointer flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between text-[#A8A294] text-xs">
            <span>Admissions Inquiries</span>
            <GraduationCap className="w-4 h-4 text-[#60A5FA]" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#F7F3E6]">57</div>
          <div className="text-[11px] text-[#60A5FA] font-medium flex items-center justify-between">
            <span>4 Demos today</span>
            <span className="text-[#A8A294]">18 Hot Pipeline</span>
          </div>
        </div>

        {/* Fee Collections */}
        <div
          onClick={() => navigate('/fees')}
          className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] hover:border-[#EF4444]/50 transition-colors cursor-pointer flex flex-col justify-between space-y-3"
        >
          <div className="flex items-center justify-between text-[#A8A294] text-xs">
            <span>Fee Installments Due</span>
            <CreditCard className="w-4 h-4 text-[#EF4444]" />
          </div>
          <div className="font-serif text-3xl font-bold text-[#F7F3E6]">₹3.4L</div>
          <div className="text-[11px] text-[#EF4444] font-medium flex items-center justify-between">
            <span>7 Overdue</span>
            <span className="text-[#A8A294]">Auto-reminders sent</span>
          </div>
        </div>
      </div>

      {/* 3. Operational Two-Column Chamber Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Mains Evaluation Desk & Today's Schedule */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mains Pending Evaluation Action Card */}
          <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-[#F7F3E6]">
                  Mains Answer Writing Submissions
                </h3>
                <p className="text-xs text-[#A8A294]">
                  Recent student answer sheets submitted for Daily Answer Writing (DAW)
                </p>
              </div>
              <button
                onClick={() => navigate('/mains-evaluation')}
                className="text-xs text-[#C19B48] hover:text-[#E8CF8D] font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>View All (14)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#3D3D3D] border border-[#3D3D3D] rounded-xl overflow-hidden bg-[#262626]">
              <div className="p-3.5 flex items-center justify-between hover:bg-[#2F2F2F] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center font-bold text-xs">
                    #48
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#F7F3E6]">
                      Pooja Sharma • Roll #2026-042
                    </div>
                    <div className="text-[11px] text-[#A8A294]">
                      CPC Sec 11 - Res Judicata & Constructive Res Judicata (PDF 4.2 MB)
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/mains-evaluation')}
                  className="px-3 py-1.5 rounded-lg bg-[#C19B48]/15 hover:bg-[#C19B48]/30 border border-[#C19B48]/40 text-[#E8CF8D] text-xs font-semibold cursor-pointer"
                >
                  Grade Copy
                </button>
              </div>

              <div className="p-3.5 flex items-center justify-between hover:bg-[#2F2F2F] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center font-bold text-xs">
                    #48
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#F7F3E6]">
                      Rohan Verma • Roll #2026-089
                    </div>
                    <div className="text-[11px] text-[#A8A294]">
                      CPC Sec 9 - Courts to try all civil suits unless barred (PDF 3.8 MB)
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/mains-evaluation')}
                  className="px-3 py-1.5 rounded-lg bg-[#C19B48]/15 hover:bg-[#C19B48]/30 border border-[#C19B48]/40 text-[#E8CF8D] text-xs font-semibold cursor-pointer"
                >
                  Grade Copy
                </button>
              </div>

              <div className="p-3.5 flex items-center justify-between hover:bg-[#2F2F2F] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#34D399]/20 text-[#34D399] flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#F7F3E6]">
                      Ananya Sen • Roll #2026-015
                    </div>
                    <div className="text-[11px] text-[#34D399]">
                      Evaluated by Rajinder Sir • Score: 18.5/25
                    </div>
                  </div>
                </div>
                <span className="text-[11px] text-[#A8A294] px-2 py-1 bg-[#1E1E1E] rounded-md border border-[#3D3D3D]">
                  Returned
                </span>
              </div>
            </div>
          </div>

          {/* Today's Lectures & Live Streams */}
          <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-[#F7F3E6]">
                  Today's Classroom Lectures & Shifts
                </h3>
                <p className="text-xs text-[#A8A294]">
                  Scheduled live streams and offline batch shifts
                </p>
              </div>
              <button
                onClick={() => navigate('/timetable')}
                className="text-xs text-[#C19B48] hover:text-[#E8CF8D] font-medium flex items-center gap-1 cursor-pointer"
              >
                <span>Full Timetable</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
                    LIVE AT 5:00 PM
                  </span>
                  <span className="text-xs text-[#A8A294]">Chamber Hall A</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#F7F3E6]">
                    Civil Procedure Code (Part XVI)
                  </h4>
                  <p className="text-[11px] text-[#C19B48]">
                    Faculty: Adv. Rajinder Sir
                  </p>
                </div>
                <button
                  onClick={() => navigate('/live-classes')}
                  className="w-full py-1.5 rounded-lg bg-[#C19B48] text-[#1E1E1E] font-bold text-xs hover:bg-[#D8B862] transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Start Live Stream</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#3D3D3D] text-[#A8A294]">
                    7:00 PM - 8:30 PM
                  </span>
                  <span className="text-xs text-[#A8A294]">Virtual Room 2</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#F7F3E6]">
                    Bharatiya Nagarik Suraksha Sanhita (BNSS)
                  </h4>
                  <p className="text-[11px] text-[#A8A294]">
                    Faculty: Adv. Sharma • Evening Batch
                  </p>
                </div>
                <button
                  onClick={() => navigate('/timetable')}
                  className="w-full py-1.5 rounded-lg bg-[#2F2F2F] text-[#F7F3E6] border border-[#3D3D3D] hover:bg-[#383838] font-medium text-xs transition-colors cursor-pointer"
                >
                  <span>View Shift Plan</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Doubt Desk & Quick Actions */}
        <div className="space-y-6">
          {/* Doubt Desk Urgent Queries */}
          <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-bold text-[#F7F3E6]">
                  Faculty Doubt Desk
                </h3>
                <span className="text-xs text-[#60A5FA]">5 Unresolved Queries</span>
              </div>
              <button
                onClick={() => navigate('/doubts')}
                className="text-xs text-[#C19B48] hover:text-[#E8CF8D] cursor-pointer"
              >
                Open Desk
              </button>
            </div>

            <div className="space-y-2.5">
              <div
                onClick={() => navigate('/doubts')}
                className="p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] hover:border-[#60A5FA]/40 transition-colors cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#F7F3E6]">Vikram Mehta</span>
                  <span className="text-[10px] text-[#A8A294]">20 mins ago</span>
                </div>
                <p className="text-xs text-[#A8A294] line-clamp-2">
                  "Sir, can a subsequent suit be barred under constructive res judicata if the cause of action is distinct?"
                </p>
                <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-[#60A5FA]/15 text-[#60A5FA]">
                  CPC • Section 11
                </span>
              </div>

              <div
                onClick={() => navigate('/doubts')}
                className="p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] hover:border-[#60A5FA]/40 transition-colors cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-[#F7F3E6]">Sneha Kapoor</span>
                  <span className="text-[10px] text-[#A8A294]">1 hour ago</span>
                </div>
                <p className="text-xs text-[#A8A294] line-clamp-2">
                  "Regarding BNSS arrest guidelines, is section 35 notice mandatory for bailable offences?"
                </p>
                <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-[#34D399]/15 text-[#34D399]">
                  BNSS • Criminal Procedure
                </span>
              </div>
            </div>
          </div>

          {/* Quick Notice Broadcast Box */}
          <div className="p-6 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-3">
            <h3 className="font-serif text-base font-bold text-[#F7F3E6]">
              Notice Board Broadcast
            </h3>
            <p className="text-xs text-[#A8A294]">
              Push urgent circulars directly to all enrolled students' Classroom Portals.
            </p>
            <button
              onClick={() => navigate('/notices')}
              className="w-full py-2.5 rounded-xl bg-[#2F2F2F] hover:bg-[#3D3D3D] text-[#F7F3E6] border border-[#3D3D3D] text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>+ Post New Circular</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
