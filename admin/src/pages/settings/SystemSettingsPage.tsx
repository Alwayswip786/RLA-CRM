import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Megaphone,
  GraduationCap,
  FileCheck,
  ShieldAlert,
  Power,
  Save,
  RotateCcw,
  Plus,
  X,
  AlertTriangle,
  Clock,
  Smartphone,
  Eye,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { settingsService } from '../../services/settings.service';
import type { SystemSettingsData } from '../../types/settings.types';
import { cn } from '../../utils/cn';

const TABS = [
  { id: 'general', label: 'Academy Profile', icon: Building2, desc: 'Institutional details & contact channels' },
  { id: 'banner', label: 'Admissions Banner', icon: Megaphone, desc: 'Dynamic headline broadcast & CTA pill' },
  { id: 'exams', label: 'Judicial Taxonomy', icon: GraduationCap, desc: 'State judicial service target tags' },
  { id: 'mains', label: 'Mains & Academics', icon: FileCheck, desc: 'Submission caps, cutoffs & SLAs' },
  { id: 'security', label: 'Security & Policy', icon: ShieldAlert, desc: 'Watermarking & session limits' },
  { id: 'system', label: 'System State', icon: Power, desc: 'Maintenance mode & feature toggles' },
];

export const SystemSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [initialData, setInitialData] = useState<SystemSettingsData | null>(null);
  const [formData, setFormData] = useState<SystemSettingsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [newExamInput, setNewExamInput] = useState<string>('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingsService.getSystemSettings();
      setInitialData(data);
      setFormData(data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (path: string, value: any) => {
    if (!formData) return;

    setFormData((prev) => {
      if (!prev) return prev;
      const clone = JSON.parse(JSON.stringify(prev));

      const parts = path.split('.');
      let current = clone;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      return clone;
    });
  };

  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    const trimmed = newExamInput.trim().toUpperCase();
    if (!trimmed) return;

    if (formData.supportedExams.includes(trimmed)) {
      toast.error(`${trimmed} is already in the target exam list.`);
      return;
    }

    const updated = [...formData.supportedExams, trimmed];
    handleInputChange('supportedExams', updated);
    setNewExamInput('');
    toast.success(`Added ${trimmed} to target exams.`);
  };

  const handleRemoveExam = (examToRemove: string) => {
    if (!formData) return;
    const updated = formData.supportedExams.filter((e) => e !== examToRemove);
    handleInputChange('supportedExams', updated);
    toast.success(`Removed ${examToRemove}`);
  };

  const handleSave = async () => {
    if (!formData) return;

    try {
      setSaving(true);
      const updated = await settingsService.updateSystemSettings(formData);
      setInitialData(updated);
      setFormData(updated);
      toast.success('System settings & announcement banner updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!initialData) return;
    setFormData(JSON.parse(JSON.stringify(initialData)));
    toast('Settings reset to last saved state', { icon: '🔄' });
  };

  if (loading || !formData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-[#A8A294]">
        <div className="w-8 h-8 rounded-full border-2 border-[#C19B48] border-t-transparent animate-spin" />
        <span className="text-xs font-semibold uppercase tracking-wider">
          Loading Chamber Constants &amp; Settings...
        </span>
      </div>
    );
  }

  // Detect dirty state
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(initialData);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#3D3D3D] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#C19B48]/15 border border-[#C19B48]/40 flex items-center justify-center text-[#C19B48]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#F7F3E6] leading-none">
                System Settings &amp; Governance
              </h1>
              <p className="text-xs text-[#A8A294] mt-1">
                Configure Academy constants, admissions banner, exam taxonomy, SLAs, and security controls.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Unsaved Indicator */}
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-semibold animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              Unsaved Changes
            </span>
          )}

          {hasChanges && (
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] hover:bg-[#2F2F2F] text-[#A8A294] hover:text-[#F7F3E6] text-xs font-semibold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer',
              hasChanges && !saving
                ? 'bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] shadow-[#C19B48]/20 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-[#262626] border border-[#3D3D3D] text-[#6B675E] cursor-not-allowed opacity-60'
            )}
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-[#1E1E1E] border-t-transparent rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Main Layout: Vertical Tabs + Form Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar Tabs */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-2">
          <div className="bg-[#1E1E1E] border border-[#3D3D3D] rounded-2xl p-2 space-y-1 shadow-sm">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer',
                    isActive
                      ? 'bg-[#C19B48]/15 border border-[#C19B48]/40 text-[#F7F3E6]'
                      : 'hover:bg-[#262626] text-[#A8A294] hover:text-[#F7F3E6] border border-transparent'
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-lg shrink-0 mt-0.5',
                      isActive ? 'bg-[#C19B48] text-[#1E1E1E]' : 'bg-[#2A2A2A] text-[#A8A294]'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className={cn('block text-xs font-bold truncate', isActive ? 'text-[#F7F3E6]' : 'text-[#E3DDCF]')}>
                      {tab.label}
                    </span>
                    <span className="block text-[10px] text-[#A8A294] truncate mt-0.5">
                      {tab.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick System Summary Card */}
          <div className="bg-[#1E1E1E] border border-[#3D3D3D] rounded-2xl p-4 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#A8A294] flex items-center justify-between">
              <span>Platform Health</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#A8A294]">
                <span>App Build</span>
                <span className="font-mono text-[#F7F3E6] font-semibold">{formData.appVersion}</span>
              </div>
              <div className="flex items-center justify-between text-[#A8A294]">
                <span>Academic Cycle</span>
                <span className="text-[#C19B48] font-semibold">{formData.currentAcademicYear}</span>
              </div>
              <div className="flex items-center justify-between text-[#A8A294]">
                <span>Banner Status</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                    formData.announcementBanner.enabled
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-zinc-700 text-zinc-400'
                  )}
                >
                  {formData.announcementBanner.enabled ? 'Broadcast Active' : 'Off'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#A8A294]">
                <span>Maintenance</span>
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                    formData.maintenanceMode
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  )}
                >
                  {formData.maintenanceMode ? 'ACTIVE' : 'Normal'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Content Area */}
        <div className="lg:col-span-8 xl:col-span-9 bg-[#1E1E1E] border border-[#3D3D3D] rounded-2xl p-6 sm:p-8 shadow-xl min-h-[560px]">
          {/* ======================================================== */}
          {/* TAB 1: ACADEMY PROFILE & GENERAL INFO                    */}
          {/* ======================================================== */}
          {activeTab === 'general' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-base font-bold text-[#F7F3E6]">Academy Identity &amp; Contact Details</h2>
                <p className="text-xs text-[#A8A294] mt-0.5">
                  General institutional metadata visible across receipts, notifications, and student credentials.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#E3DDCF]">Institution Name</label>
                  <input
                    type="text"
                    value={formData.appName}
                    onChange={(e) => handleInputChange('appName', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] focus:border-[#C19B48] text-xs text-[#F7F3E6] outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#E3DDCF]">Academy Tagline / Subtitle</label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => handleInputChange('tagline', e.target.value)}
                    className="w-full h-10 px-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] focus:border-[#C19B48] text-xs text-[#F7F3E6] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#E3DDCF]">Support / Admissions Email</label>
                    <input
                      type="email"
                      value={formData.supportEmail}
                      onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] focus:border-[#C19B48] text-xs text-[#F7F3E6] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#E3DDCF]">Admissions Hotline / WhatsApp</label>
                    <input
                      type="text"
                      value={formData.contactPhone}
                      onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] focus:border-[#C19B48] text-xs text-[#F7F3E6] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#E3DDCF]">Physical Campus / Chamber Address</label>
                  <textarea
                    rows={2}
                    value={formData.campusAddress}
                    onChange={(e) => handleInputChange('campusAddress', e.target.value)}
                    className="w-full p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] focus:border-[#C19B48] text-xs text-[#F7F3E6] outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#3D3D3D]">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#E3DDCF]">Current Academic Cycle</label>
                    <input
                      type="text"
                      value={formData.currentAcademicYear}
                      onChange={(e) => handleInputChange('currentAcademicYear', e.target.value)}
                      placeholder="e.g. 2025–2026"
                      className="w-full h-10 px-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] focus:border-[#C19B48] text-xs text-[#C19B48] font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#E3DDCF]">Client Version (Cache Push)</label>
                    <input
                      type="text"
                      value={formData.appVersion}
                      onChange={(e) => handleInputChange('appVersion', e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] focus:border-[#C19B48] text-xs font-mono text-[#F7F3E6] outline-none"
                    />
                    <p className="text-[10px] text-[#A8A294]">
                      Incrementing forces client browsers to purge stale state and reload assets.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: ADMISSIONS & ANNOUNCEMENT BANNER                  */}
          {/* ======================================================== */}
          {activeTab === 'banner' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-base font-bold text-[#F7F3E6]">Admissions &amp; Announcement Banner</h2>
                <p className="text-xs text-[#A8A294] mt-0.5">
                  Control the top broadcast ribbon displayed across the Landing Page and Student Classroom.
                </p>
              </div>

              {/* Master Switch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#262626] border border-[#3D3D3D]">
                <div>
                  <h3 className="text-xs font-bold text-[#F7F3E6]">Broadcast Active</h3>
                  <p className="text-[11px] text-[#A8A294] mt-0.5">
                    When switched off, the banner collapses completely from all student and visitor views.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleInputChange('announcementBanner.enabled', !formData.announcementBanner.enabled)
                  }
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer',
                    formData.announcementBanner.enabled ? 'bg-[#C19B48]' : 'bg-[#3D3D3D]'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      formData.announcementBanner.enabled ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {/* Live Preview Box */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[#A8A294] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#C19B48]" />
                  Real-Time Live Banner Preview (What Students &amp; Visitors See)
                </span>
                <div className="rounded-2xl border border-[#3D3D3D] bg-[#141414] p-4 overflow-hidden shadow-inner">
                  {formData.announcementBanner.enabled ? (
                    <div
                      className={cn(
                        'w-full py-2 px-4 rounded-xl text-center text-xs font-medium flex items-center justify-center gap-2.5 transition-all shadow-sm',
                        formData.announcementBanner.theme === 'gold' &&
                          'bg-[#C19B48]/15 border border-[#C19B48]/40 text-[#F7F3E6]',
                        formData.announcementBanner.theme === 'urgent' &&
                          'bg-rose-500/15 border border-rose-500/40 text-rose-200',
                        formData.announcementBanner.theme === 'blue' &&
                          'bg-blue-500/15 border border-blue-500/40 text-blue-200',
                        formData.announcementBanner.theme === 'emerald' &&
                          'bg-emerald-500/15 border border-emerald-500/40 text-emerald-200'
                      )}
                    >
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                          formData.announcementBanner.theme === 'gold' && 'bg-[#C19B48] text-[#1E1E1E]',
                          formData.announcementBanner.theme === 'urgent' && 'bg-rose-500 text-white',
                          formData.announcementBanner.theme === 'blue' && 'bg-blue-500 text-white',
                          formData.announcementBanner.theme === 'emerald' && 'bg-emerald-500 text-white'
                        )}
                      >
                        {formData.announcementBanner.badgeText || 'ANNOUNCEMENT'}
                      </span>
                      <span className="truncate">
                        {formData.announcementBanner.message || 'Enter your announcement broadcast message...'}
                      </span>
                      {formData.announcementBanner.actionLink && (
                        <span className="font-bold underline text-xs ml-1 hover:opacity-80">
                          {formData.announcementBanner.actionText || 'Learn More →'}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="py-3 text-center text-xs text-[#6B675E] italic">
                      Banner is currently disabled. Toggle &quot;Broadcast Active&quot; to preview live.
                    </div>
                  )}
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-1">
                    <label className="text-xs font-semibold text-[#E3DDCF]">Badge Label</label>
                    <input
                      type="text"
                      value={formData.announcementBanner.badgeText}
                      onChange={(e) => handleInputChange('announcementBanner.badgeText', e.target.value)}
                      placeholder="e.g. ADMISSIONS 2025–26"
                      className="w-full h-10 px-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] focus:border-[#C19B48] text-xs font-bold text-[#F7F3E6] outline-none uppercase"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-[#E3DDCF]">Color Palette / Theme</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'gold', label: 'Chamber Gold', color: '#C19B48' },
                        { id: 'urgent', label: 'Crimson Alert', color: '#EF4444' },
                        { id: 'blue', label: 'Judicial Navy', color: '#3B82F6' },
                        { id: 'emerald', label: 'Emerald Pass', color: '#10B981' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleInputChange('announcementBanner.theme', t.id)}
                          className={cn(
                            'p-2 rounded-xl border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer',
                            formData.announcementBanner.theme === t.id
                              ? 'border-[#C19B48] bg-[#C19B48]/10 text-[#F7F3E6]'
                              : 'border-[#3D3D3D] bg-[#262626] text-[#A8A294] hover:text-[#F7F3E6]'
                          )}
                        >
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                          <span className="hidden sm:inline">{t.label.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#E3DDCF]">Announcement Broadcast Message</label>
                  <textarea
                    rows={2}
                    value={formData.announcementBanner.message}
                    onChange={(e) => handleInputChange('announcementBanner.message', e.target.value)}
                    placeholder="e.g. Comprehensive Judicial Foundation Batch Open • Daily Mains Answer Writing (DAW) Starts Monday"
                    className="w-full p-3 rounded-xl bg-[#262626] border border-[#3D3D3D] focus:border-[#C19B48] text-xs text-[#F7F3E6] outline-none resize-none leading-relaxed"
                  />
                  <p className="text-[10px] text-[#A8A294]">
                    Use &quot;•&quot; (bullet) to cleanly separate multi-item announcements.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#E3DDCF]">Action Destination URL</label>
                    <input
                      type="text"
                      value={formData.announcementBanner.actionLink || ''}
                      onChange={(e) => handleInputChange('announcementBanner.actionLink', e.target.value)}
                      placeholder="e.g. /signup or /leads/demos"
                      className="w-full h-10 px-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] focus:border-[#C19B48] text-xs text-[#F7F3E6] outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#E3DDCF]">Action Button / Link Label</label>
                    <input
                      type="text"
                      value={formData.announcementBanner.actionText || ''}
                      onChange={(e) => handleInputChange('announcementBanner.actionText', e.target.value)}
                      placeholder="e.g. Enroll Now →"
                      className="w-full h-10 px-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] focus:border-[#C19B48] text-xs text-[#F7F3E6] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: JUDICIAL EXAM TAXONOMY                           */}
          {/* ======================================================== */}
          {activeTab === 'exams' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-base font-bold text-[#F7F3E6]">Supported Judicial Services &amp; State Exams</h2>
                <p className="text-xs text-[#A8A294] mt-0.5">
                  These exam taxonomy codes populate student onboarding options, mock test series filters, and PYQs.
                </p>
              </div>

              {/* Active Exam Tags */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#E3DDCF]">Active State Judicial Exams</label>
                <div className="flex flex-wrap gap-2 p-4 bg-[#262626] rounded-2xl border border-[#3D3D3D] min-h-[110px] items-start">
                  {formData.supportedExams.length === 0 ? (
                    <span className="text-xs text-[#6B675E] m-auto">No target exams configured.</span>
                  ) : (
                    formData.supportedExams.map((exam) => (
                      <div
                        key={exam}
                        className="flex items-center gap-2 rounded-xl border border-[#C19B48]/30 bg-[#C19B48]/10 px-3 py-1.5 text-xs font-bold text-[#E8CF8D] shadow-sm group"
                      >
                        <span>{exam}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExam(exam)}
                          className="text-[#A8A294] hover:text-rose-400 transition-colors cursor-pointer"
                          title={`Remove ${exam}`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Add Exam Form */}
              <form onSubmit={handleAddExam} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. BJS (Bihar Judicial Services)"
                  value={newExamInput}
                  onChange={(e) => setNewExamInput(e.target.value)}
                  className="flex-1 h-10 px-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] focus:border-[#C19B48] text-xs text-[#F7F3E6] outline-none uppercase font-semibold"
                />
                <button
                  type="submit"
                  disabled={!newExamInput.trim()}
                  className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-[#C19B48]/20 border border-[#C19B48]/40 hover:bg-[#C19B48]/30 text-[#C19B48] hover:text-[#E8CF8D] text-xs font-bold transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Exam</span>
                </button>
              </form>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: MAINS & ACADEMIC RULES                           */}
          {/* ======================================================== */}
          {activeTab === 'mains' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-base font-bold text-[#F7F3E6]">Mains Evaluation Desk &amp; Academic Rules</h2>
                <p className="text-xs text-[#A8A294] mt-0.5">
                  Enforce daily answer upload windows, file size restrictions, and faculty grading SLAs.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#E3DDCF] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#C19B48]" />
                      Daily Upload Cutoff Time (IST)
                    </label>
                    <input
                      type="text"
                      value={formData.mainsEvaluation.dailyCutoffTime}
                      onChange={(e) => handleInputChange('mainsEvaluation.dailyCutoffTime', e.target.value)}
                      placeholder="18:00"
                      className="w-full h-10 px-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] focus:border-[#C19B48] text-xs font-mono text-[#F7F3E6] outline-none"
                    />
                    <p className="text-[10px] text-[#A8A294]">
                      Submissions lock at this hour to ensure same-day evaluation.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#E3DDCF]">Max Copies / Student / Day</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={formData.mainsEvaluation.maxDailySubmissionsPerStudent}
                      onChange={(e) =>
                        handleInputChange(
                          'mainsEvaluation.maxDailySubmissionsPerStudent',
                          parseInt(e.target.value) || 1
                        )
                      }
                      className="w-full h-10 px-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] focus:border-[#C19B48] text-xs text-[#F7F3E6] outline-none"
                    />
                    <p className="text-[10px] text-[#A8A294]">Prevents copy backlog and copy spamming.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#E3DDCF]">Evaluation SLA Standard</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={12}
                        max={168}
                        value={formData.mainsEvaluation.evaluationSlaHours}
                        onChange={(e) =>
                          handleInputChange('mainsEvaluation.evaluationSlaHours', parseInt(e.target.value) || 24)
                        }
                        className="w-full h-10 px-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] focus:border-[#C19B48] text-xs text-[#F7F3E6] outline-none"
                      />
                      <span className="text-xs font-bold text-[#A8A294] shrink-0">Hours</span>
                    </div>
                    <p className="text-[10px] text-[#A8A294]">
                      Copies pending longer than this are flagged as Overdue in Command Center.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#E3DDCF]">Max Answer PDF Size</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={5}
                        max={100}
                        value={formData.mainsEvaluation.maxFileSizeMB}
                        onChange={(e) =>
                          handleInputChange('mainsEvaluation.maxFileSizeMB', parseInt(e.target.value) || 10)
                        }
                        className="w-full h-10 px-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] focus:border-[#C19B48] text-xs text-[#F7F3E6] outline-none"
                      />
                      <span className="text-xs font-bold text-[#A8A294] shrink-0">MB</span>
                    </div>
                    <p className="text-[10px] text-[#A8A294]">Upper threshold for student answer scan uploads.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: SECURITY & PIRACY PREVENTION                     */}
          {/* ======================================================== */}
          {activeTab === 'security' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-base font-bold text-[#F7F3E6]">Security, Watermarking &amp; Session Limits</h2>
                <p className="text-xs text-[#A8A294] mt-0.5">
                  Protect intellectual property, copyright on lecture videos, and access parameters.
                </p>
              </div>

              <div className="space-y-4">
                {/* Anti-Piracy Watermarking Switch */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#262626] border border-[#3D3D3D]">
                  <div className="max-w-md">
                    <h3 className="text-xs font-bold text-[#F7F3E6] flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-[#C19B48]" />
                      Dynamic Anti-Piracy Watermarking
                    </h3>
                    <p className="text-[11px] text-[#A8A294] mt-0.5">
                      Dynamically stamps student Roll Number and Phone Number across evaluated Mains PDFs and video player streams.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange('security.enableWatermarking', !formData.security.enableWatermarking)
                    }
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer',
                      formData.security.enableWatermarking ? 'bg-emerald-500' : 'bg-[#3D3D3D]'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        formData.security.enableWatermarking ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* WhatsApp Verification Switch */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-[#262626] border border-[#3D3D3D]">
                  <div className="max-w-md">
                    <h3 className="text-xs font-bold text-[#F7F3E6] flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-[#34D399]" />
                      Mandatory WhatsApp / Phone OTP Verification
                    </h3>
                    <p className="text-[11px] text-[#A8A294] mt-0.5">
                      Requires phone verification before new student leads can unlock classroom dashboard access.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange(
                        'security.whatsappVerificationRequired',
                        !formData.security.whatsappVerificationRequired
                      )
                    }
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer',
                      formData.security.whatsappVerificationRequired ? 'bg-emerald-500' : 'bg-[#3D3D3D]'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        formData.security.whatsappVerificationRequired ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#E3DDCF]">Max Concurrent Student Devices</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={formData.security.maxConcurrentDevices}
                      onChange={(e) =>
                        handleInputChange('security.maxConcurrentDevices', parseInt(e.target.value) || 1)
                      }
                      className="w-full h-10 px-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] focus:border-[#C19B48] text-xs text-[#F7F3E6] outline-none"
                    />
                    <p className="text-[10px] text-[#A8A294]">
                      Exceeding triggers session invalidation on previous device.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#E3DDCF]">Admin Inactivity Timeout</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={15}
                        max={1440}
                        value={formData.security.adminSessionTimeoutMinutes}
                        onChange={(e) =>
                          handleInputChange(
                            'security.adminSessionTimeoutMinutes',
                            parseInt(e.target.value) || 120
                          )
                        }
                        className="w-full h-10 px-3.5 rounded-xl bg-[#262626] border border-[#3D3D3D] focus:border-[#C19B48] text-xs text-[#F7F3E6] outline-none"
                      />
                      <span className="text-xs font-bold text-[#A8A294] shrink-0">Mins</span>
                    </div>
                    <p className="text-[10px] text-[#A8A294]">Auto-logout staff after idle period.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: SYSTEM STATE & MAINTENANCE                        */}
          {/* ======================================================== */}
          {activeTab === 'system' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-base font-bold text-[#F7F3E6]">System State &amp; Maintenance Mode</h2>
                <p className="text-xs text-[#A8A294] mt-0.5">
                  Platform-wide status toggles, downtime broadcasts, and modular feature switches.
                </p>
              </div>

              {/* Maintenance Toggle */}
              <div
                className={cn(
                  'p-5 rounded-2xl border transition-all',
                  formData.maintenanceMode
                    ? 'bg-rose-500/10 border-rose-500/40 shadow-lg shadow-rose-500/10'
                    : 'bg-[#262626] border-[#3D3D3D]'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3
                      className={cn(
                        'text-xs font-bold flex items-center gap-2',
                        formData.maintenanceMode ? 'text-rose-400' : 'text-[#F7F3E6]'
                      )}
                    >
                      <Power className="w-4 h-4" />
                      Maintenance Mode
                    </h3>
                    <p className="text-[11px] text-[#A8A294] mt-1 max-w-md">
                      When enabled, regular students are blocked from classroom modules and see a scheduled maintenance screen.{' '}
                      <strong className="text-[#F7F3E6]">Admins &amp; Faculty retain full CMS access.</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInputChange('maintenanceMode', !formData.maintenanceMode)}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer',
                      formData.maintenanceMode ? 'bg-rose-500' : 'bg-[#3D3D3D]'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        formData.maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-[#3D3D3D]">
                  <label className="text-xs font-semibold text-[#E3DDCF]">Maintenance Message for Students</label>
                  <textarea
                    rows={2}
                    value={formData.maintenanceMessage}
                    onChange={(e) => handleInputChange('maintenanceMessage', e.target.value)}
                    className="w-full mt-1.5 p-3 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] focus:border-rose-500 text-xs text-[#F7F3E6] outline-none resize-none"
                  />
                </div>
              </div>

              {/* Feature Flags */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-[#E3DDCF] uppercase tracking-wider">
                  Modular Feature Toggles
                </h3>
                <div className="divide-y divide-[#3D3D3D] rounded-2xl border border-[#3D3D3D] bg-[#262626] overflow-hidden">
                  {[
                    { key: 'enableLiveChat', title: 'Live Classroom Chat', desc: 'Allows students to post questions during live lecture streams.' },
                    { key: 'enableMockRankings', title: 'Prelims Leaderboard & Rank Engine', desc: 'Computes and displays All-India percentiles for prelims mock series.' },
                    { key: 'enableBareActSearch', title: 'Bare Act Search Engine', desc: 'Full-text query index across Indian Penal Code, CrPC/BNSS, CPC, and Evidence.' },
                    { key: 'enableOnlineFeePayment', title: 'Online Fee Installment Gateway', desc: 'Permits students to settle installment dues via digital gateway.' },
                    { key: 'enableMainsPeerDiscussion', title: 'Peer Mains Review Forum', desc: 'Permits student discussion on model answers and evaluation rubrics.' },
                  ].map((flag) => {
                    const isChecked = Boolean(formData.featureFlags?.[flag.key]);

                    return (
                      <div key={flag.key} className="p-3.5 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-[#F7F3E6]">{flag.title}</div>
                          <p className="text-[11px] text-[#A8A294]">{flag.desc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInputChange(`featureFlags.${flag.key}`, !isChecked)}
                          className={cn(
                            'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer',
                            isChecked ? 'bg-[#C19B48]' : 'bg-[#3D3D3D]'
                          )}
                        >
                          <span
                            className={cn(
                              'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
                              isChecked ? 'translate-x-4' : 'translate-x-0.5'
                            )}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
