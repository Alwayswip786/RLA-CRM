import React, { useState } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export const MainsSubmitPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState('DAW-2025-084');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        toast.error('Only PDF documents are accepted for judicial copy evaluation.');
        return;
      }
      setSelectedFile(file);
      toast.success(`PDF selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a scanned PDF answer copy first.');
      return;
    }
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setSelectedFile(null);
      toast.success('Mains Answer Sheet uploaded successfully!', {
        description: 'Assigned to Adv. Rajinder Sir for line-by-line remarks. Evaluation turn-around: 48 hours.',
        duration: 4500,
      });
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-semibold">
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Handwritten Copy Digitization Portal</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
          Upload Mains Answer Sheet (PDF)
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Upload scanned copies written on standard ruled judicial answer booklets for evaluation and marks tabulation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Form (2 cols) */}
        <form onSubmit={handleUploadSubmit} className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-5 shadow-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Select Mains Test / DAW Question <span className="text-[#c19b48]">*</span>
            </label>
            <select
              value={selectedQuestion}
              onChange={(e) => setSelectedQuestion(e.target.value)}
              className="w-full px-3 py-2 sm:py-2.5 rounded-xl bg-slate-50 dark:bg-[#061120] border border-slate-200 dark:border-[#143564] text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-[#c19b48]"
            >
              <option value="DAW-2025-084">DAW #84: CPC Section 10 Res Sub Judice (Due Today)</option>
              <option value="DAW-2025-083">DAW #83: BNS Private Defence Sec 34-44 (Due Yesterday)</option>
              <option value="MT-FL-02">Mains Mock Full Length 02: Criminal Law Paper</option>
              <option value="MT-FL-01">Mains Mock Full Length 01: Civil Law Paper I</option>
            </select>
          </div>

          {/* Drag & Drop Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Scanned Answer Copy (PDF) <span className="text-[#c19b48]">*</span>
            </label>
            <label className="border-2 border-dashed border-slate-300 dark:border-[#143564] hover:border-[#c19b48] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group bg-slate-50/50 dark:bg-[#061120]/40">
              <UploadCloud className="w-10 h-10 text-[#c19b48] group-hover:scale-110 transition-transform mb-3" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {selectedFile ? selectedFile.name : 'Click to select or drag PDF file here'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Supported: PDF files up to 25 MB. Ensure clear page contrast.
              </span>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isUploading}
            className="w-full py-2.5 sm:py-3 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-60"
          >
            {isUploading ? (
              <div className="w-4 h-4 border-2 border-[#061120] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Answer Sheet for Evaluation</span>
              </>
            )}
          </button>
        </form>

        {/* Instructions Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs">
          <h3 className="text-sm font-serif font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#c19b48]" />
            <span>Scanning Guidelines</span>
          </h3>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5">
            <li className="flex items-start gap-2">
              <span className="text-[#c19b48] font-bold">1.</span>
              <span>Use standard blue or black ballpoint pen as required in actual judicial service commissions.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#c19b48] font-bold">2.</span>
              <span>Leave a 1-inch margin on both sides of each sheet for mentor remarks and mark breakdowns.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#c19b48] font-bold">3.</span>
              <span>Scan all pages sequentially in a single PDF document. Rotate upside-down pages before uploading.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#c19b48] font-bold">4.</span>
              <span>Evaluation remarks by Adv. Rajinder Sir will be available within 48 hours under Evaluated Copies.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
