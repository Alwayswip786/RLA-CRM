import React from 'react';
import {
  BookOpen,
  Play,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

interface QuizCategory {
  id: string;
  bareAct: string;
  chaptersCount: number;
  totalQuestions: number;
  completedQuestions: number;
  accuracy: string;
}

const quizCategories: QuizCategory[] = [
  {
    id: 'cpc',
    bareAct: 'Code of Civil Procedure, 1908',
    chaptersCount: 158,
    totalQuestions: 640,
    completedQuestions: 420,
    accuracy: '86%',
  },
  {
    id: 'bns',
    bareAct: 'Bhartiya Nyaya Sanhita, 2023',
    chaptersCount: 358,
    totalQuestions: 550,
    completedQuestions: 280,
    accuracy: '79%',
  },
  {
    id: 'bnss',
    bareAct: 'Bhartiya Nagarik Suraksha Sanhita, 2023',
    chaptersCount: 531,
    totalQuestions: 720,
    completedQuestions: 310,
    accuracy: '81%',
  },
  {
    id: 'bsa',
    bareAct: 'Bhartiya Sakshya Adhiniyam, 2023',
    chaptersCount: 170,
    totalQuestions: 480,
    completedQuestions: 390,
    accuracy: '88%',
  },
  {
    id: 'constitution',
    bareAct: 'Constitution of India (Articles 1 to 395)',
    chaptersCount: 395,
    totalQuestions: 850,
    completedQuestions: 620,
    accuracy: '91%',
  },
  {
    id: 'tpa',
    bareAct: 'Transfer of Property Act, 1882',
    chaptersCount: 137,
    totalQuestions: 320,
    completedQuestions: 150,
    accuracy: '74%',
  },
];

export const PracticeQuizzesPage: React.FC = () => {
  const handleStartQuiz = (actName: string) => {
    toast.success(`Starting 20-Question Daily Sprint on ${actName}`, {
      description: 'Timer: 15 Minutes. Section numbers & Case laws included.',
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564]">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Chapter & Section Drill Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white">
            Bare Act Practice Quizzes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Master tricky Bare Act section numbers, exceptions, and illustrations with targeted daily sprints.
          </p>
        </div>

        <button
          onClick={() => toast.info('Launching Rapid-Fire 50 Mixed Bare Act MCQs')}
          className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Play className="w-3.5 h-3.5 fill-[#061120]" />
          <span>Quick 20-Question Mixed Sprint</span>
        </button>
      </div>

      {/* Grid of Bare Act Quizzes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {quizCategories.map((item) => {
          const progressPercent = Math.round((item.completedQuestions / item.totalQuestions) * 100);

          return (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white dark:bg-[#0a1c36] border border-slate-200 dark:border-[#143564] space-y-4 shadow-xs hover:border-[#c19b48]/60 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#061120] text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-[#143564]">
                    {item.totalQuestions} Curated MCQs
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    {item.accuracy} Accuracy
                  </span>
                </div>

                <h3 className="text-base font-serif font-bold text-slate-900 dark:text-white">
                  {item.bareAct}
                </h3>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Practiced: {item.completedQuestions} / {item.totalQuestions}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-[#061120] h-2 rounded-full overflow-hidden border border-slate-200 dark:border-[#143564]">
                    <div
                      className="h-full bg-gradient-to-r from-[#c19b48] to-[#e8cf8d] rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#143564] flex items-center justify-between">
                <button
                  onClick={() => toast.info(`Resetting question history for ${item.bareAct}`)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>

                <button
                  onClick={() => handleStartQuiz(item.bareAct)}
                  className="px-3 py-1.5 rounded-lg bg-[#0a1c36] dark:bg-[#143564] hover:bg-[#143564] text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Practice Sections</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
