import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminStaffApi, type AdminRoleDto, type PermissionModuleDto } from '../../lib/adminStaffApi';
import { useAdminAuthStore } from '../../store/useAdminAuthStore';

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: AdminRoleDto[];
  modules: PermissionModuleDto[];
  onAdminCreated: () => void;
}

export const CreateAdminModal: React.FC<CreateAdminModalProps> = ({
  isOpen,
  onClose,
  roles,
  modules,
  onAdminCreated,
}) => {
  const currentAdmin = useAdminAuthStore((state) => state.admin);

  const [salutation, setSalutation] = useState<'Adv.' | 'Mr.' | 'Ms.' | 'Dr.'>('Adv.');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('Judicial@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [adminTitle, setAdminTitle] = useState('');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Granular Permissions
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When role changes, pre-fill title and baseline permissions
  useEffect(() => {
    if (selectedRoleId) {
      const foundRole = roles.find((r) => r._id === selectedRoleId);
      if (foundRole) {
        setAdminTitle(foundRole.name);
        setSelectedPermissions(foundRole.permissions || []);
      }
    }
  }, [selectedRoleId, roles]);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 12; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
    setShowPassword(true);
    toast.success('Generated strong credentials password!');
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const toggleModuleAll = (modKey: string, actions: string[]) => {
    const modPerms = actions.map((act) => `${modKey}:${act}`);
    const allSelected = modPerms.every((p) => selectedPermissions.includes(p));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !p.startsWith(`${modKey}:`)));
    } else {
      setSelectedPermissions((prev) => Array.from(new Set([...prev, ...modPerms])));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please provide full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please provide a valid email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminStaffApi.createStaffAdmin({
        salutation,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password: password.trim() || undefined,
        adminRoleId: selectedRoleId || undefined,
        adminTitle: adminTitle.trim() || undefined,
        status,
        isSuperAdmin: currentAdmin?.isSuperAdmin ? isSuperAdmin : false,
        customPermissions: selectedPermissions,
      });

      toast.success(`Admin account created for ${name.trim()}!`);
      onAdminCreated();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create admin';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#1E1E1E] border border-[#3D3D3D] rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 border-b border-[#3D3D3D] flex items-center justify-between bg-[#242424]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C19B48]/15 border border-[#C19B48]/30 flex items-center justify-center text-[#C19B48]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#F7F3E6]">Create Admin Account</h3>
              <p className="text-[11px] text-[#A8A294]">
                Appoint institutional administrator, assign RBAC clearance and credentials.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#2F2F2F] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Row 1: Salutation, Full Name */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-[11px] font-semibold text-[#A8A294] uppercase tracking-wider mb-1.5">
                Salutation
              </label>
              <select
                value={salutation}
                onChange={(e) => setSalutation(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
              >
                <option value="Adv.">Adv.</option>
                <option value="Mr.">Mr.</option>
                <option value="Ms.">Ms.</option>
                <option value="Dr.">Dr.</option>
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-semibold text-[#A8A294] uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Adv. Rohit Verma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
              />
            </div>
          </div>

          {/* Row 2: Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#A8A294] uppercase tracking-wider mb-1.5">
                Official Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="mentor@rajinderlawacademy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#A8A294] uppercase tracking-wider mb-1.5">
                Contact Phone
              </label>
              <input
                type="text"
                placeholder="+91 98111 XXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
              />
            </div>
          </div>

          {/* Row 3: Role & Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#A8A294] uppercase tracking-wider mb-1.5">
                Chamber Role / Clearance Preset
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
              >
                <option value="">-- Select Predefined Role --</option>
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} ({r.permissionTier})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#A8A294] uppercase tracking-wider mb-1.5">
                Admin Title / Chamber Designation
              </label>
              <input
                type="text"
                placeholder="e.g. Academic Mentor & Evaluator"
                value={adminTitle}
                onChange={(e) => setAdminTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
              />
            </div>
          </div>

          {/* Row 4: Initial Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-[#A8A294] uppercase tracking-wider">
                Initial Account Password
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="inline-flex items-center gap-1 text-[11px] text-[#C19B48] hover:text-[#D8B862] cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-Generate Secure Password</span>
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A8A294]">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A8A294] hover:text-[#F7F3E6] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Row 5: Status & Super Admin Toggles */}
          <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-[#F7F3E6]">Initial Status:</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-[#1E1E1E] text-[#A8A294] border border-[#3D3D3D]'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('suspended')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    status === 'suspended'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-[#1E1E1E] text-[#A8A294] border border-[#3D3D3D]'
                  }`}
                >
                  Suspended
                </button>
              </div>
            </div>

            {currentAdmin?.isSuperAdmin && (
              <label className="flex items-center gap-2 text-xs font-semibold text-[#C19B48] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSuperAdmin}
                  onChange={(e) => setIsSuperAdmin(e.target.checked)}
                  className="rounded border-[#3D3D3D] text-[#C19B48] focus:ring-[#C19B48] bg-[#1E1E1E] w-4 h-4"
                />
                <ShieldAlert className="w-4 h-4" />
                <span>Assign Super Admin Privileges (*)</span>
              </label>
            )}
          </div>

          {/* Collapsible Granular Module Permissions */}
          <div className="border border-[#3D3D3D] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsPermissionsOpen(!isPermissionsOpen)}
              className="w-full p-3.5 bg-[#242424] hover:bg-[#282828] flex items-center justify-between text-xs font-semibold text-[#F7F3E6] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span>Granular Feature Permissions Matrix</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C19B48]/15 text-[#E8CF8D] border border-[#C19B48]/30">
                  {selectedPermissions.includes('*')
                    ? 'All Features (Full Clearance)'
                    : `${selectedPermissions.length} selected`}
                </span>
              </div>
              {isPermissionsOpen ? (
                <ChevronUp className="w-4 h-4 text-[#A8A294]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#A8A294]" />
              )}
            </button>

            {isPermissionsOpen && (
              <div className="p-4 bg-[#1A1A1A] space-y-4 max-h-60 overflow-y-auto divide-y divide-[#3D3D3D]/50 text-xs">
                {modules.map((mod) => {
                  const allModSelected = mod.actions.every((act) =>
                    selectedPermissions.includes(`${mod.key}:${act}`)
                  );

                  return (
                    <div key={mod.key} className="pt-3 first:pt-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#F7F3E6] text-xs">{mod.label}</span>
                        <button
                          type="button"
                          onClick={() => toggleModuleAll(mod.key, mod.actions)}
                          className="text-[10px] text-[#C19B48] hover:text-[#D8B862] cursor-pointer"
                        >
                          {allModSelected ? 'Deselect Module' : 'Select All'}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {mod.actions.map((action) => {
                          const permKey = `${mod.key}:${action}`;
                          const isChecked =
                            selectedPermissions.includes('*') ||
                            selectedPermissions.includes(`${mod.key}:*`) ||
                            selectedPermissions.includes(permKey);

                          return (
                            <label
                              key={action}
                              className="flex items-center gap-1.5 text-[11px] text-[#A8A294] hover:text-[#F7F3E6] cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => togglePermission(permKey)}
                                className="rounded border-[#3D3D3D] text-[#C19B48] bg-[#262626] w-3.5 h-3.5 focus:ring-0 cursor-pointer"
                              />
                              <span className="capitalize">{action}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#3D3D3D] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#2F2F2F] text-[#A8A294] hover:text-[#F7F3E6] text-xs font-semibold border border-[#3D3D3D] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Create Admin Account</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
