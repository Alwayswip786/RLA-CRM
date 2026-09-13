import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileText,
  Code2,
  CheckCircle2,
  X,
  Send,
  PanelLeftClose,
  PanelLeftOpen,
  Check,
  Terminal,
} from 'lucide-react';
import { toast } from 'sonner';
import { ThemeSwitcher } from '../../../components/dashboard/ThemeSwitcher';

interface LessonItem {
  id: string;
  title: string;
  type: 'video' | 'quiz' | 'problem' | 'document';
  score: string;
  duration?: string;
  question?: string;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
  problemStatement?: string;
  exampleInput?: string;
  exampleOutput?: string;
  documentContent?: string[];
}

const moduleLessons: LessonItem[] = [
  {
    id: 'lesson-1',
    title: 'Java Installation & Choosing the Right IDE',
    type: 'video',
    score: '10/10',
    duration: '28:45',
  },
  {
    id: 'lesson-2',
    title: 'IDE Full Form',
    type: 'quiz',
    score: '20/20',
    question: 'What does the acronym "IDE" stand for in software engineering?',
    options: [
      'Integrated Development Environment',
      'Internal Data Engine',
      'Interactive Debugging Entity',
      'Interface Design Ecosystem',
    ],
    correctIndex: 0,
    explanation:
      'An IDE (Integrated Development Environment) provides comprehensive facilities to computer programmers for software development, typically consisting of a source code editor, build automation tools, and a debugger.',
  },
  {
    id: 'lesson-3',
    title: 'File Extension for Java',
    type: 'quiz',
    score: '20/20',
    question: 'What is the file extension of Java source code files before compilation?',
    options: ['.class', '.java', '.jvm', '.js'],
    correctIndex: 1,
    explanation:
      'Java source code is written in plain text files with the .java extension. When compiled with javac, it generates bytecode in .class files.',
  },
  {
    id: 'lesson-4',
    title: 'Create a New Java Class',
    type: 'quiz',
    score: '20/20',
    question: 'Which keyword is used to declare a class in Java?',
    options: ['struct', 'define', 'class', 'object'],
    correctIndex: 2,
    explanation:
      'In Java, every application begins with a class definition using the "class" keyword followed by the class identifier.',
  },
  {
    id: 'lesson-5',
    title: 'Entry Point of a Program',
    type: 'quiz',
    score: '20/20',
    question: 'What is the exact signature of the entry point method for any standard standalone Java application?',
    options: [
      'public void start(String[] args)',
      'public static void main(String[] args)',
      'private static int main()',
      'public abstract void run()',
    ],
    correctIndex: 1,
    explanation:
      'The Java Virtual Machine (JVM) calls the method "public static void main(String[] args)" to start program execution.',
  },
  {
    id: 'lesson-6',
    title: 'Two Sum',
    type: 'problem',
    score: '10/10',
    problemStatement:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    exampleInput: 'nums = [2, 7, 11, 15], target = 9',
    exampleOutput: '[0, 1]  (Because nums[0] + nums[1] == 2 + 7 == 9)',
  },
  {
    id: 'lesson-7',
    title: 'Installation & IDE',
    type: 'document',
    score: '0/1',
    documentContent: [
      'Step 1: Download JDK 22 (Java Development Kit) for your operating system (Windows x64 Installer, macOS DMG, or Linux deb/rpm) from the official Oracle repository.',
      'Step 2: Run the installer wizard and choose the default installation directory (e.g., C:\\Program Files\\Java\\jdk-22).',
      'Step 3: Configure Environment Variables - Add JAVA_HOME pointing to your JDK root and append %JAVA_HOME%\\bin to your system PATH variable.',
      'Step 4: Verify installation in Terminal or PowerShell by running: java -version and javac -version.',
      'Step 5: Install an IDE - Download IntelliJ IDEA Community Edition or VS Code with the "Extension Pack for Java".',
    ],
  },
];

export const LecturePlayerPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>();
  const navigate = useNavigate();

  // Find active lesson index
  const activeIndex = Math.max(
    0,
    moduleLessons.findIndex((l) => l.id === lessonId)
  );
  const currentLesson = moduleLessons[activeIndex] || moduleLessons[0];

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLessonAccordionOpen, setIsLessonAccordionOpen] = useState(true);
  const [isDoubtModalOpen, setIsDoubtModalOpen] = useState(false);
  const [doubtText, setDoubtText] = useState('');

  // Video playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(254); // 04:14
  const totalDuration = 1725; // 28:45

  // Quiz state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  // Problem test run state
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testsPassed, setTestsPassed] = useState(false);

  // Reset quiz / problem state when switching lessons
  useEffect(() => {
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setIsTestRunning(false);
    setTestsPassed(false);
  }, [lessonId]);

  // Video playback timer simulation
  useEffect(() => {
    let interval: any;
    if (isPlaying && currentLesson.type === 'video') {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, currentLesson.type]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleSpeedChange = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
    toast.info(`Playback speed: ${speeds[nextIdx]}x`);
  };

  const handleLessonSwitch = (newLessonId: string) => {
    navigate(`/dashboard/courses/${courseId || 'java-dsa'}/learn/${newLessonId}`);
  };

  const handlePrevLesson = () => {
    if (activeIndex > 0) {
      handleLessonSwitch(moduleLessons[activeIndex - 1].id);
    }
  };

  const handleNextLesson = () => {
    if (activeIndex < moduleLessons.length - 1) {
      handleLessonSwitch(moduleLessons[activeIndex + 1].id);
    }
  };

  const handleDoubtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtText.trim()) return;
    toast.success('Doubt submitted to Instructor! You will receive response shortly.');
    setDoubtText('');
    setIsDoubtModalOpen(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-100/80 dark:bg-[#06080e] text-slate-900 dark:text-slate-100 flex flex-col justify-between select-none transition-colors">
      {/* Top Header Bar */}
      <header className="h-12 bg-white dark:bg-[#090d16] border-b border-slate-200 dark:border-[#141b2b] px-4 flex items-center justify-between shrink-0 transition-colors">
        <button
          type="button"
          onClick={() => navigate(`/dashboard/courses/${courseId || 'java-dsa'}`)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors group cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-45 transition-transform" />
          <span>Go Back</span>
        </button>

        <div className="flex items-center gap-2.5">
          <ThemeSwitcher />
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#121a2c] transition-colors cursor-pointer"
            title={isSidebarOpen ? 'Collapse lesson drawer' : 'Expand lesson drawer'}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main 2-Column Layout matching Image 6 (media_1789164227250.png) */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Lesson Drawer */}
        {isSidebarOpen && (
          <aside className="w-72 sm:w-80 border-r border-slate-200 dark:border-[#141b2b] bg-white dark:bg-[#070b14] p-3 flex flex-col gap-3 shrink-0 overflow-y-auto custom-scrollbar transition-colors">
            {/* Module Progress Card */}
            <div className="rounded-xl bg-slate-50 dark:bg-[#0b101c] border border-slate-200 dark:border-[#141e32] p-3.5 shadow-xs transition-colors">
              <button
                type="button"
                onClick={() => navigate(`/dashboard/courses/${courseId || 'java-dsa'}`)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white mb-2.5 group cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span className="truncate">1 - Installation and IDE</span>
              </button>

              {/* Progress Percentage */}
              <div className="text-[11px] font-semibold text-[#c19b48] dark:text-[#e8cf8d] mb-1">99.0% Complete</div>
              <div className="w-full h-1 bg-slate-200 dark:bg-[#152034] rounded-full overflow-hidden mb-3">
                <div className="h-full bg-[#c19b48] w-[99%] rounded-full" />
              </div>

              {/* 4 Metric Columns matching Image 6 */}
              <div className="grid grid-cols-4 gap-1 text-center pt-2 border-t border-slate-200 dark:border-[#141e32]">
                <div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Video</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">1/1</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Problem</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">1/1</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">MCQs</div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">4/4</div>
                </div>
                <div>
                  <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">Score</div>
                  <div className="text-xs font-bold text-[#c19b48] dark:text-[#e8cf8d]">100/101</div>
                </div>
              </div>
            </div>

            {/* LESSON Accordion List */}
            <div className="rounded-xl bg-slate-50 dark:bg-[#0b101c] border border-slate-200 dark:border-[#141e32] p-2 flex-1 flex flex-col overflow-hidden transition-colors">
              <button
                type="button"
                onClick={() => setIsLessonAccordionOpen(!isLessonAccordionOpen)}
                className="w-full flex items-center justify-between p-2 text-[11px] font-bold tracking-wider text-slate-700 dark:text-slate-300 uppercase hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-[#c19b48] dark:text-[#e8cf8d]" />
                  <span>LESSON</span>
                </div>
                {isLessonAccordionOpen ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {isLessonAccordionOpen && (
                <div className="mt-1 space-y-1 overflow-y-auto custom-scrollbar pr-1 flex-1">
                  {moduleLessons.map((item) => {
                    const isActive = item.id === currentLesson.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleLessonSwitch(item.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-amber-500/10 dark:bg-[#15233c] text-[#c19b48] dark:text-[#e8cf8d] font-medium border border-amber-500/30 dark:border-[#c19b48]/40 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0e1626]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          {item.type === 'video' && (
                            <Play
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isActive ? 'text-[#c19b48] fill-[#c19b48] dark:text-[#e8cf8d] dark:fill-[#e8cf8d]' : 'text-slate-400 dark:text-slate-500'
                              }`}
                            />
                          )}
                          {item.type === 'quiz' && (
                            <HelpCircle className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                          )}
                          {item.type === 'problem' && (
                            <Code2 className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                          )}
                          {item.type === 'document' && (
                            <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                          )}

                          <span className="truncate">{item.title}</span>
                        </div>

                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
                          {item.score}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Vertical Drawer Pill Handle */}
        <button
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden sm:flex absolute left-0 sm:left-auto top-1/2 -translate-y-1/2 z-20 w-1.5 h-10 bg-slate-300 dark:bg-slate-400/50 hover:bg-[#c19b48] rounded-full transition-colors cursor-pointer"
          style={{ left: isSidebarOpen ? 'calc(20rem - 3px)' : '4px' }}
          title={isSidebarOpen ? 'Collapse drawer' : 'Expand drawer'}
        />

        {/* Right Main Content Area: Video Lecture / Quiz / Problem / Document */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-100/60 dark:bg-[#06080e] p-3 sm:p-5 overflow-y-auto transition-colors">
          {/* Top Video Lecture Bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <span>
                {currentLesson.type === 'video'
                  ? 'Video Lecture'
                  : currentLesson.type === 'quiz'
                  ? 'MCQ Assessment'
                  : currentLesson.type === 'problem'
                  ? 'Coding Problem'
                  : 'Documentation Notes'}
              </span>
              <Play className="w-3 h-3 text-[#c19b48] fill-[#c19b48] dark:text-[#e8cf8d] dark:fill-[#e8cf8d]" />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDoubtModalOpen(true)}
                className="px-3.5 py-1 rounded-md bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Doubt</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#121a2c] transition-colors cursor-pointer"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* VIEW 1: VIDEO LECTURE (Replicating Image 6: media_1789164227250.png) */}
          {currentLesson.type === 'video' && (
            <div
              className={`flex-1 flex flex-col justify-center ${
                isFullscreen ? 'fixed inset-0 z-50 bg-black p-4' : ''
              }`}
            >
              <div className="relative w-full aspect-video max-h-[75vh] rounded-2xl overflow-hidden border border-slate-300 dark:border-[#141e32] bg-black shadow-2xl group flex items-center justify-center">
                {/* Visual Canvas: Screenshot from Image 6 */}
                <img
                  src="/java_video_screen.png"
                  alt="Java Installation & Choosing the Right IDE Lecture"
                  className="w-full h-full object-cover select-none pointer-events-none"
                />

                {/* Center Circular Play/Pause Button */}
                <button
                  type="button"
                  onClick={togglePlay}
                  className={`absolute z-20 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-900/70 hover:bg-[#c19b48] text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-2xl cursor-pointer ${
                    isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
                  }`}
                  title={isPlaying ? 'Pause' : 'Play Video'}
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-white" />
                  ) : (
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white ml-1.5" />
                  )}
                </button>

                {/* Bottom Scrubber & Control Bar */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 sm:p-4 pt-8 z-20 opacity-90 group-hover:opacity-100 transition-opacity">
                  {/* Progress Scrubber Bar */}
                  <div
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const percentage = clickX / rect.width;
                      setCurrentTime(Math.floor(percentage * totalDuration));
                    }}
                    className="w-full h-1.5 bg-white/25 hover:h-2.5 rounded-full overflow-hidden mb-3 cursor-pointer transition-all"
                  >
                    <div
                      className="h-full bg-gradient-to-r from-[#c19b48] to-[#e8cf8d] rounded-full transition-all"
                      style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                    />
                  </div>

                  {/* Player Controls */}
                  <div className="flex items-center justify-between text-xs text-white">
                    <div className="flex items-center gap-3.5">
                      <button
                        type="button"
                        onClick={togglePlay}
                        className="hover:text-[#c19b48] transition-colors cursor-pointer"
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                      </button>

                      <button
                        type="button"
                        onClick={toggleMute}
                        className="hover:text-[#c19b48] transition-colors cursor-pointer"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>

                      <span className="text-xs font-mono text-slate-300">
                        {formatTime(currentTime)} / {formatTime(totalDuration)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        1080p HD
                      </span>

                      <button
                        type="button"
                        onClick={handleSpeedChange}
                        className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-xs font-mono font-medium transition-colors cursor-pointer"
                      >
                        {playbackSpeed}x
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="hover:text-[#c19b48] transition-colors cursor-pointer"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: QUIZ / MCQ ASSESSMENT */}
          {currentLesson.type === 'quiz' && (
            <div className="flex-1 max-w-3xl mx-auto w-full py-6">
              <div className="rounded-2xl bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-[#141e32] p-6 shadow-xs transition-colors">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#141e32] pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[#c19b48] dark:text-[#e8cf8d]" />
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">{currentLesson.title}</h2>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] border border-[#c19b48]/30">
                    Points: {currentLesson.score}
                  </span>
                </div>

                <div className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 mb-6 leading-relaxed">
                  {currentLesson.question}
                </div>

                <div className="space-y-3 mb-6">
                  {currentLesson.options?.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === currentLesson.correctIndex;
                    let style = 'bg-slate-50 dark:bg-[#070b14] border-slate-200 dark:border-[#141e32] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-[#1e3458] hover:bg-slate-100 dark:hover:bg-[#0d1626]';

                    if (isAnswerSubmitted) {
                      if (isCorrect) {
                        style = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 font-semibold';
                      } else if (isSelected && !isCorrect) {
                        style = 'bg-rose-500/15 border-rose-500/50 text-rose-700 dark:text-rose-300';
                      }
                    } else if (isSelected) {
                      style = 'bg-amber-500/10 dark:bg-[#c19b48]/20 border-[#c19b48] text-[#c19b48] dark:text-[#e8cf8d] font-semibold';
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (!isAnswerSubmitted) setSelectedOption(idx);
                        }}
                        className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer ${style}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 shrink-0">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                        {isAnswerSubmitted && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation Box on Submit */}
                {isAnswerSubmitted && (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-[#081324] border border-emerald-200 dark:border-[#142646] mb-6">
                    <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-1">
                      Correct Answer & Explanation
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{currentLesson.explanation}</p>
                  </div>
                )}

                {/* Submit / Next Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {!isAnswerSubmitted ? (
                    <button
                      type="button"
                      disabled={selectedOption === null}
                      onClick={() => {
                        setIsAnswerSubmitted(true);
                        if (selectedOption === currentLesson.correctIndex) {
                          toast.success('Correct Answer! +20 Points Earned');
                        } else {
                          toast.error('Incorrect option. Review the explanation.');
                        }
                      }}
                      className="px-6 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] disabled:opacity-40 disabled:pointer-events-none text-[#061120] text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextLesson}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Next Lesson</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: CODING PROBLEM */}
          {currentLesson.type === 'problem' && (
            <div className="flex-1 max-w-4xl mx-auto w-full py-4 space-y-4">
              <div className="rounded-2xl bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-[#141e32] p-6 shadow-xs transition-colors">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#141e32] pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-[#c19b48] dark:text-[#e8cf8d]" />
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">{currentLesson.title}</h2>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                    Difficulty: Easy | Score: {currentLesson.score}
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line mb-4">
                  {currentLesson.problemStatement}
                </div>

                {/* Example */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-[#141e32] font-mono text-xs text-slate-700 dark:text-slate-300 space-y-1 mb-4">
                  <div>
                    <span className="text-slate-500">Input:</span> {currentLesson.exampleInput}
                  </div>
                  <div>
                    <span className="text-slate-500">Output:</span> {currentLesson.exampleOutput}
                  </div>
                </div>

                {/* Code Solution snippet */}
                <div className="rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-300 overflow-x-auto mb-4">
                  <div className="text-slate-500 mb-2">// Solution: Optimal O(n) Hash Map approach in Java</div>
                  <pre className="text-sky-300">
{`class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[] {};
    }
}`}
                  </pre>
                </div>

                {/* Run Tests Button */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    {testsPassed && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Check className="w-4 h-4" />
                        All 3 Test Cases Passed!
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsTestRunning(true);
                      setTimeout(() => {
                        setIsTestRunning(false);
                        setTestsPassed(true);
                        toast.success('Solution executed: Runtime 1ms (Beats 99.4% in Java)');
                      }, 700);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-[#061120] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>{isTestRunning ? 'Evaluating...' : 'Run Test Cases'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: DOCUMENTATION / NOTES */}
          {currentLesson.type === 'document' && (
            <div className="flex-1 max-w-4xl mx-auto w-full py-4">
              <div className="rounded-2xl bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-[#141e32] p-6 shadow-xs transition-colors">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#141e32] pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#c19b48] dark:text-[#e8cf8d]" />
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">{currentLesson.title} Guide</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => toast.success('Guide bookmarked!')}
                    className="text-xs text-[#c19b48] dark:text-[#e8cf8d] hover:underline cursor-pointer"
                  >
                    Bookmark Notes
                  </button>
                </div>

                <div className="space-y-4">
                  {currentLesson.documentContent?.map((step, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-[#141e32] flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-[#c19b48]/15 text-[#c19b48] dark:text-[#e8cf8d] border border-[#c19b48]/30 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Sticky Lesson Navigator Bar matching Image 6 (< Lesson 1/7 >) */}
      <footer className="h-12 bg-white dark:bg-[#090d16] border-t border-slate-200 dark:border-[#141b2b] px-4 flex items-center justify-center shrink-0 transition-colors">
        <div className="flex items-center gap-2">
          {/* Previous Lesson Button */}
          <button
            type="button"
            onClick={handlePrevLesson}
            disabled={activeIndex === 0}
            className="w-7 h-7 rounded-md bg-slate-100 dark:bg-[#0e1626] border border-slate-200 dark:border-[#18243c] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#142036] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
            title="Previous Lesson"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Lesson Counter Badge */}
          <div className="px-4 py-1 rounded-md bg-slate-100 dark:bg-[#0e1626] border border-slate-200 dark:border-[#18243c] text-xs font-medium text-slate-700 dark:text-slate-300 select-none">
            Lesson {activeIndex + 1}/{moduleLessons.length}
          </div>

          {/* Next Lesson Button */}
          <button
            type="button"
            onClick={handleNextLesson}
            disabled={activeIndex === moduleLessons.length - 1}
            className="w-7 h-7 rounded-md bg-slate-100 dark:bg-[#0e1626] border border-slate-200 dark:border-[#18243c] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#142036] disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer"
            title="Next Lesson"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>

      {/* Doubt Modal */}
      {isDoubtModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#0b101c] border border-slate-200 dark:border-[#1a2842] shadow-2xl p-5 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1a2842] mb-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <HelpCircle className="w-4 h-4 text-[#c19b48] dark:text-[#e8cf8d]" />
                <span>Ask a Doubt on this Lesson</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDoubtModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDoubtSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lesson Reference
                </label>
                <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-[#141e32] p-2.5 rounded-xl">
                  {currentLesson.title}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Describe what you are stuck on
                </label>
                <textarea
                  rows={4}
                  value={doubtText}
                  onChange={(e) => setDoubtText(e.target.value)}
                  placeholder="E.g., I ran into a PATH variable error when typing javac in powershell..."
                  className="w-full rounded-xl bg-slate-50 dark:bg-[#070b14] border border-slate-200 dark:border-[#141e32] p-3 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#c19b48] transition-colors resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDoubtModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#141e32] text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#c19b48] hover:bg-[#d8b862] text-xs font-semibold text-[#061120] flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Doubt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
