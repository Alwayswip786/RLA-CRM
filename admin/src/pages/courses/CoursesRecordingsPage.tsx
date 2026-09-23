import React, { useState, useEffect } from 'react';
import {
  Video,
  Upload,
  FileText,
  Clock,
  Search,
  Loader2,
  Play,
  X,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '../../lib/apiClient';

interface RecordingItem {
  id: string;
  title: string;
  courseTitle: string;
  courseSlug: string;
  moduleTitle: string;
  faculty: string;
  duration: string;
  videoUrl: string;
  videoThumbnail?: string;
  createdAt: string;
  likesCount: number;
  viewsCount: number;
  quality: string;
  hasHandout: boolean;
}

interface CourseOption {
  courseId: string;
  courseTitle: string;
  slug: string;
}

export const CoursesRecordingsPage: React.FC = () => {
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Modals
  const [previewItem, setPreviewItem] = useState<RecordingItem | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Upload Form state
  const [selectedCourseSlug, setSelectedCourseSlug] = useState('');
  const [availableModules, setAvailableModules] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formDuration, setFormDuration] = useState('45 mins');
  const [formPoints, setFormPoints] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRecordingsAndCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [recRes, coursesRes] = await Promise.all([
        apiClient.get('/courses/admin/recordings'),
        apiClient.get('/courses/admin/all'),
      ]);

      if (recRes.data?.data) {
        setRecordings(recRes.data.data);
      }
      if (coursesRes.data?.data) {
        setCourses(coursesRes.data.data);
        if (coursesRes.data.data.length > 0 && !selectedCourseSlug) {
          setSelectedCourseSlug(coursesRes.data.data[0].slug || coursesRes.data.data[0].courseId);
        }
      }
    } catch (err: any) {
      console.error('Failed to load recordings:', err);
      setError(err?.response?.data?.message || 'Failed to load lecture recordings archive.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordingsAndCourses();
  }, []);

  // When selectedCourseSlug changes in upload modal, fetch modules
  useEffect(() => {
    if (!selectedCourseSlug) return;
    const fetchModulesForCourse = async () => {
      try {
        const res = await apiClient.get(`/courses/${selectedCourseSlug}`);
        if (res.data?.data?.modules) {
          setAvailableModules(res.data.data.modules);
          if (res.data.data.modules.length > 0) {
            setSelectedModuleId(res.data.data.modules[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load modules for course:', err);
      }
    };
    fetchModulesForCourse();
  }, [selectedCourseSlug]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseSlug || !selectedModuleId || !formTitle || !formVideoUrl) {
      toast.error('Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      await apiClient.post('/courses/admin/recordings', {
        courseId: selectedCourseSlug,
        moduleId: selectedModuleId,
        title: formTitle,
        videoUrl: formVideoUrl,
        duration: formDuration,
        durationSeconds: 2700,
        points: formPoints,
      });

      toast.success('Lecture recording published successfully!');
      setIsUploadModalOpen(false);
      setFormTitle('');
      setFormVideoUrl('');
      fetchRecordingsAndCourses();
    } catch (err: any) {
      console.error('Upload failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to publish recording.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = recordings.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.courseTitle.toLowerCase().includes(search.toLowerCase()) ||
      r.faculty.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C19B48]/15 border border-[#C19B48]/30 text-[#C19B48] text-xs font-semibold">
            <Video className="w-3.5 h-3.5" />
            <span>Digital Classroom Vault</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#F7F3E6]">
            Recorded Lecture Archive CMS
          </h1>
          <p className="text-xs text-[#A8A294] max-w-2xl leading-relaxed">
            Manage dynamic video captures, attach Bare Act annotations and commentary handouts, and monitor student streaming views across all judicial programs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRecordingsAndCourses}
            className="p-2.5 rounded-xl bg-[#262626] hover:bg-[#333333] border border-[#3D3D3D] text-[#A8A294] hover:text-[#F7F3E6] transition-colors cursor-pointer"
            title="Refresh Archive"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Upload New Lecture</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="p-4 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#A8A294] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recorded lecture title, course, faculty..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-xs text-[#F7F3E6] placeholder-[#A8A294] focus:outline-hidden focus:border-[#C19B48]"
          />
        </div>
        <div className="text-xs text-[#A8A294]">
          Total Archived Lectures: <strong className="text-[#F7F3E6]">{recordings.length}</strong>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-[#A8A294]">
          <Loader2 className="w-8 h-8 animate-spin text-[#C19B48]" />
          <p className="text-xs font-medium">Loading lecture vault recordings from cloud database...</p>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-center space-y-3">
          <p className="text-xs">{error}</p>
          <button
            onClick={fetchRecordingsAndCourses}
            className="px-4 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-3 text-[#A8A294]">
          <Video className="w-10 h-10 mx-auto text-[#C19B48]/50" />
          <p className="text-sm font-semibold text-[#F7F3E6]">No lecture recordings found</p>
          <p className="text-xs">Try modifying your search or click "Upload New Lecture" above.</p>
        </div>
      ) : (
        /* Table */
        <div className="rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#3D3D3D] bg-[#262626] text-[#A8A294] uppercase tracking-wider text-[10px] font-bold">
                  <th className="py-3.5 px-4">Lecture Title & Program</th>
                  <th className="py-3.5 px-4">Duration & Resolution</th>
                  <th className="py-3.5 px-4">Lead Faculty</th>
                  <th className="py-3.5 px-4">Curriculum Module</th>
                  <th className="py-3.5 px-4">Student Plays</th>
                  <th className="py-3.5 px-4">Handout PDF</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3D3D3D]/60 text-[#F7F3E6]">
                {filtered.map((rec) => (
                  <tr key={rec.id} className="hover:bg-[#2F2F2F]/50 transition-colors">
                    <td className="py-3.5 px-4 max-w-[280px]">
                      <div className="font-semibold text-sm text-[#F7F3E6] truncate">{rec.title}</div>
                      <div className="text-[11px] text-[#C19B48] truncate">{rec.courseTitle}</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono text-xs font-bold text-[#F7F3E6] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#C19B48]" />
                        <span>{rec.duration}</span>
                      </div>
                      <div className="text-[10px] text-[#A8A294]">{rec.quality}</div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-[#F7F3E6] whitespace-nowrap">{rec.faculty}</td>

                    <td className="py-3.5 px-4 text-[11px] text-[#A8A294] max-w-[180px] truncate">
                      {rec.moduleTitle}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-xs text-[#34D399] whitespace-nowrap">
                      {rec.viewsCount} views
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {rec.hasHandout ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#C19B48] bg-[#C19B48]/15 px-2 py-0.5 rounded border border-[#C19B48]/30">
                          <FileText className="w-3 h-3" />
                          PDF Attached
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#A8A294]">Direct Stream</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setPreviewItem(rec)}
                        className="px-2.5 py-1 rounded-lg bg-[#262626] hover:bg-[#C19B48] text-[#F7F3E6] hover:text-[#1E1E1E] border border-[#3D3D3D] text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        <span>Preview</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PREVIEW VIDEO MODAL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] overflow-hidden text-[#F7F3E6] shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-[#3D3D3D]">
              <div>
                <h3 className="font-serif font-bold text-base text-[#F7F3E6]">{previewItem.title}</h3>
                <p className="text-xs text-[#A8A294]">{previewItem.courseTitle} • {previewItem.faculty}</p>
              </div>
              <button
                onClick={() => setPreviewItem(null)}
                className="text-[#A8A294] hover:text-[#F7F3E6] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video bg-black flex items-center justify-center">
              {previewItem.videoUrl ? (
                <video
                  src={previewItem.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center text-[#A8A294] space-y-2">
                  <Video className="w-12 h-12 mx-auto text-[#C19B48]" />
                  <p className="text-sm">Video Stream Ready</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#262626] flex items-center justify-between text-xs text-[#A8A294]">
              <span>Duration: <strong className="text-[#F7F3E6]">{previewItem.duration}</strong></span>
              <span>Likes: <strong className="text-[#F7F3E6]">{previewItem.likesCount}</strong></span>
              <span>Views: <strong className="text-[#34D399]">{previewItem.viewsCount}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD NEW LECTURE MODAL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] p-6 text-[#F7F3E6] shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#3D3D3D]">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#C19B48]" />
                <h3 className="font-serif font-bold text-lg text-[#F7F3E6]">Upload / Link Video Lecture</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-[#A8A294] hover:text-[#F7F3E6] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#A8A294] mb-1">Target Judiciary Course *</label>
                <select
                  value={selectedCourseSlug}
                  onChange={(e) => setSelectedCourseSlug(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48]"
                  required
                >
                  {courses.map((c) => (
                    <option key={c.courseId} value={c.slug || c.courseId}>
                      {c.courseTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#A8A294] mb-1">Curriculum Module *</label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48]"
                  required
                >
                  {availableModules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#A8A294] mb-1">Lecture Title *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. CPC Sec 10: Res Sub Judice & Stay of Suit Principles"
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#A8A294] mb-1">Video Stream URL (HLS / MP4) *</label>
                <input
                  type="url"
                  value={formVideoUrl}
                  onChange={(e) => setFormVideoUrl(e.target.value)}
                  placeholder="https://commondatastorage.googleapis.com/.../video.mp4"
                  className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#A8A294] mb-1">Duration Label</label>
                  <input
                    type="text"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    placeholder="45 mins"
                    className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#A8A294] mb-1">Completion Points</label>
                  <input
                    type="number"
                    value={formPoints}
                    onChange={(e) => setFormPoints(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-hidden focus:border-[#C19B48]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#3D3D3D] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#333333] text-[#A8A294] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Publish Recording</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
