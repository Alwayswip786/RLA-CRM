import React from 'react';
import {
  CreditCard,
  Download,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

interface FeeRecord {
  id: string;
  studentName: string;
  rollNumber: string;
  course: string;
  totalFee: string;
  paidAmount: string;
  pendingAmount: string;
  nextDueDate: string;
  status: 'Paid in Full' | 'Installment Due' | 'Overdue';
}

const FEE_RECORDS: FeeRecord[] = [
  {
    id: 'fee-01',
    studentName: 'Pooja Sharma',
    rollNumber: 'RLA-2026-042',
    course: 'Judicial Services Foundation',
    totalFee: '₹1,45,000',
    paidAmount: '₹1,45,000',
    pendingAmount: '₹0',
    nextDueDate: 'Cleared',
    status: 'Paid in Full',
  },
  {
    id: 'fee-02',
    studentName: 'Rohan Verma',
    rollNumber: 'RLA-2026-089',
    course: 'Judicial Services Foundation',
    totalFee: '₹1,50,000',
    paidAmount: '₹1,15,000',
    pendingAmount: '₹35,000',
    nextDueDate: '20 Sep 2026',
    status: 'Installment Due',
  },
  {
    id: 'fee-03',
    studentName: 'Siddharth Joshi',
    rollNumber: 'RLA-2026-104',
    course: 'Judicial Services Foundation',
    totalFee: '₹1,50,000',
    paidAmount: '₹1,00,000',
    pendingAmount: '₹50,000',
    nextDueDate: '01 Sep 2026',
    status: 'Overdue',
  },
  {
    id: 'fee-04',
    studentName: 'Ananya Sen',
    rollNumber: 'RLA-2026-015',
    course: 'CPC & Pleadings Mastery',
    totalFee: '₹45,000',
    paidAmount: '₹45,000',
    pendingAmount: '₹0',
    nextDueDate: 'Cleared',
    status: 'Paid in Full',
  },
];

export const FeesPage: React.FC = () => {
  return (
    <div className="space-y-6 select-none">
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs font-semibold">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Chamber Treasury & Accounts</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Fee Installments & GST Invoices Desk
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Monitor installment payment milestones, generate official tax receipts with GST identification, and send automated WhatsApp fee alerts.
          </p>
        </div>

        <button
          onClick={() => toast.info('Record Offline Payment Modal Opened')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Record Payment</span>
        </button>
      </div>

      <div className="rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#3D3D3D] bg-[#262626] text-[#A8A294] uppercase tracking-wider text-[10px] font-bold">
                <th className="py-3.5 px-4">Student & Roll No</th>
                <th className="py-3.5 px-4">Course Enrolled</th>
                <th className="py-3.5 px-4">Total Package</th>
                <th className="py-3.5 px-4">Paid Amount</th>
                <th className="py-3.5 px-4">Pending / Due</th>
                <th className="py-3.5 px-4">Fee Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3D3D3D]/60 text-[#F7F3E6]">
              {FEE_RECORDS.map((f) => (
                <tr key={f.id} className="hover:bg-[#2F2F2F]/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-sm text-[#F7F3E6]">{f.studentName}</div>
                    <div className="font-mono text-[11px] text-[#A8A294]">{f.rollNumber}</div>
                  </td>

                  <td className="py-3.5 px-4 font-medium text-[#F7F3E6]">{f.course}</td>

                  <td className="py-3.5 px-4 font-mono text-xs text-[#A8A294]">{f.totalFee}</td>

                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-[#34D399]">{f.paidAmount}</td>

                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-xs text-[#EF4444]">{f.pendingAmount}</div>
                    <div className="text-[10px] text-[#A8A294]">{f.nextDueDate}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        f.status === 'Paid in Full'
                          ? 'bg-[#34D399]/20 text-[#34D399]'
                          : f.status === 'Installment Due'
                          ? 'bg-[#F59E0B]/20 text-[#F59E0B]'
                          : 'bg-[#EF4444]/20 text-[#EF4444]'
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toast.success(`Generated GST Invoice for ${f.studentName}`)}
                        className="p-1.5 rounded-lg bg-[#262626] hover:bg-[#C19B48] text-[#A8A294] hover:text-[#1E1E1E] border border-[#3D3D3D] transition-colors cursor-pointer"
                        title="Download Tax Receipt"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      {f.status !== 'Paid in Full' && (
                        <button
                          onClick={() => toast.success(`WhatsApp Payment Reminder Sent to ${f.studentName}`)}
                          className="px-2.5 py-1 rounded-lg bg-[#EF4444]/15 hover:bg-[#EF4444]/30 text-[#EF4444] font-semibold text-xs border border-[#EF4444]/30 transition-colors cursor-pointer"
                        >
                          Send Reminder
                        </button>
                      )}
                    </div>
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
