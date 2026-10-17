import React from 'react';
import {
  Receipt,
  Download,
  CreditCard,
} from 'lucide-react';
import { toast } from '../../lib/toast';

interface Installment {
  id: string;
  installmentNo: string;
  amount: string;
  dueDate: string;
  paidDate?: string;
  status: 'Paid' | 'Upcoming';
  receiptNo?: string;
  paymentMode?: string;
}

const feeLedger: Installment[] = [
  {
    id: 'inst-1',
    installmentNo: 'Installment 1 (Admission & Study Material)',
    amount: '₹45,000',
    dueDate: '15 Jul 2025',
    paidDate: '14 Jul 2025',
    status: 'Paid',
    receiptNo: 'RLA-REC-2025-0982',
    paymentMode: 'UPI / NetBanking',
  },
  {
    id: 'inst-2',
    installmentNo: 'Installment 2 (Mid-Session Chamber Tuition)',
    amount: '₹35,000',
    dueDate: '15 Oct 2025',
    status: 'Upcoming',
  },
  {
    id: 'inst-3',
    installmentNo: 'Installment 3 (Mains & Advanced Test Wing)',
    amount: '₹30,000',
    dueDate: '15 Jan 2026',
    status: 'Upcoming',
  },
];

export const FeesPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-2">
            <Receipt className="w-3.5 h-3.5" />
            <span>Finance & Accounts Desk</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Fee Installments & GST Receipts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Course enrollment: Judicial Services Comprehensive Batch 2025-26.
          </p>
        </div>

        <button
          onClick={() => toast.success('Consolidated Fee Statement PDF downloaded')}
          className="w-full sm:w-auto justify-center px-4 py-2.5 sm:py-2 rounded-xl bg-slate-100 dark:bg-[#061120] hover:bg-[#c19b48] hover:text-[#061120] text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-[#143564] transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Download Statement</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3 sm:gap-4">
        <div className="min-w-0 p-4 rounded-xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
          <span className="text-xs text-slate-400">Total Course Fee</span>
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono mt-1">₹1,10,000</div>
          <span className="text-[11px] text-slate-500">Includes 18% GST & Bare Act sets</span>
        </div>

        <div className="min-w-0 p-4 rounded-xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
          <span className="text-xs text-slate-400">Total Amount Paid</span>
          <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">₹45,000</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Installment 1 cleared</span>
        </div>

        <div className="min-w-0 p-4 rounded-xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
          <span className="text-xs text-slate-400">Next Due Amount</span>
          <div className="text-lg sm:text-xl font-bold text-[#c19b48] dark:text-[#e8cf8d] font-mono mt-1">₹35,000</div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Due on 15 Oct 2025</span>
        </div>
      </div>

      {/* Installment Ledger */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs">
        <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
          Fee Schedule & Tax Invoices
        </h3>

        <div className="space-y-3">
          {feeLedger.map((inst) => (
            <div
              key={inst.id}
              className="min-w-0 p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] space-y-3 text-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 font-bold text-slate-900 dark:text-white text-sm leading-snug break-words">
                  {inst.installmentNo}
                </span>
                <span
                  className={`inline-flex shrink-0 items-center text-[10px] leading-none px-2.5 py-1 rounded-full font-bold border ${
                    inst.status === 'Paid'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
                      : 'bg-amber-500/10 text-[#a67c24] dark:text-[#e8cf8d] border-amber-500/25'
                  }`}
                >
                  {inst.status}
                </span>
              </div>

              <div className="grid min-w-0 grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 border-t border-slate-200 dark:border-[#143564] pt-3 text-[11px]">
                <div className="min-w-0">
                  <span className="block text-slate-400">Due date</span>
                  <span className="block mt-0.5 font-medium text-slate-700 dark:text-slate-200">{inst.dueDate}</span>
                </div>
                {inst.paidDate && (
                  <div className="min-w-0">
                    <span className="block text-slate-400">Paid on</span>
                    <span className="block mt-0.5 font-medium text-slate-700 dark:text-slate-200">{inst.paidDate}</span>
                  </div>
                )}
                {inst.paymentMode && (
                  <div className="min-w-0">
                    <span className="block text-slate-400">Payment mode</span>
                    <span className="block mt-0.5 font-medium text-slate-700 dark:text-slate-200 break-words">{inst.paymentMode}</span>
                  </div>
                )}
                {inst.receiptNo && (
                  <div className="min-w-0">
                    <span className="block text-slate-400">Receipt number</span>
                    <span className="block mt-0.5 font-mono text-slate-700 dark:text-slate-200 break-words [overflow-wrap:anywhere]">{inst.receiptNo}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-200 dark:border-[#143564] pt-3">
                <span className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  {inst.amount}
                </span>

                {inst.status === 'Paid' ? (
                  <button
                    onClick={() => toast.success(`GST Tax Invoice downloaded for ${inst.receiptNo}`)}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white dark:bg-[#0a1c36] hover:bg-slate-100 dark:hover:bg-[#143564] text-slate-700 dark:text-slate-200 font-medium text-xs border border-slate-200 dark:border-[#143564] transition-colors cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Receipt</span>
                  </button>
                ) : (
                  <button
                    onClick={() => toast.info('Connecting to Razorpay / Bank Payment Gateway...')}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>Pay Online</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
