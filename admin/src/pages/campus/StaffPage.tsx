import React from 'react';
import {
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Director / Super Admin' | 'Academic Mentor' | 'Paper Evaluator' | 'Admissions Counselor';
  accessLevel: 'Full Access' | 'Academic & Grading' | 'Leads & Inquiries';
  lastActive: string;
  status: 'active' | 'suspended';
}

const STAFF: StaffMember[] = [
  {
    id: 'staff-01',
    name: 'Adv. Rajinder Sir',
    email: 'rajinder@rajinderlawacademy.com',
    phone: '+91 98111 00001',
    role: 'Director / Super Admin',
    accessLevel: 'Full Access',
    lastActive: 'Active Now',
    status: 'active',
  },
  {
    id: 'staff-02',
    name: 'Adv. Sharma',
    email: 'sharma.faculty@rajinderlawacademy.com',
    phone: '+91 98111 00002',
    role: 'Academic Mentor',
    accessLevel: 'Academic & Grading',
    lastActive: '25 mins ago',
    status: 'active',
  },
  {
    id: 'staff-03',
    name: 'Adv. R.K. Gupta',
    email: 'gupta.evaluator@rajinderlawacademy.com',
    phone: '+91 98111 00003',
    role: 'Paper Evaluator',
    accessLevel: 'Academic & Grading',
    lastActive: '2 hours ago',
    status: 'active',
  },
  {
    id: 'staff-04',
    name: 'Priya Malhotra',
    email: 'admissions@rajinderlawacademy.com',
    phone: '+91 98111 00004',
    role: 'Admissions Counselor',
    accessLevel: 'Leads & Inquiries',
    lastActive: '10 mins ago',
    status: 'active',
  },
];

export const StaffPage: React.FC = () => {
  return (
    <div className="space-y-6 select-none">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Chamber Governance & Security</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Staff & Role Management
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Manage administrative credentials, assign role-based access for academic mentors and copy evaluators, and inspect audit activity logs.
          </p>
        </div>

        <button
          onClick={() => toast('Invite Staff Member Dialog Opened', { icon: 'ℹ️' })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Staff Member</span>
        </button>
      </div>

      <div className="rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#3D3D3D] bg-[#262626] text-[#A8A294] uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3.5 px-4">Faculty / Staff Member</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Chamber Role</th>
                <th className="py-3.5 px-4">Permission Tier</th>
                <th className="py-3.5 px-4">Last Activity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3D3D3D]/60 text-[#F7F3E6]">
              {STAFF.map((member) => (
                <tr key={member.id} className="hover:bg-[#2F2F2F]/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-sm text-[#F7F3E6]">{member.name}</div>
                    <div className="text-[11px] text-[#A8A294]">{member.email}</div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-xs text-[#A8A294]">
                    {member.phone}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-medium text-[#F7F3E6]">{member.role}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-[#C19B48]/15 text-[#E8CF8D] border border-[#C19B48]/30">
                      {member.accessLevel}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-xs text-[#34D399] font-medium">
                    {member.lastActive}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => toast(`Editing permissions for ${member.name}`, { icon: 'ℹ️' })}
                      className="px-2.5 py-1 rounded-lg bg-[#262626] hover:bg-[#C19B48] text-[#F7F3E6] hover:text-[#1E1E1E] border border-[#3D3D3D] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Edit Access
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
