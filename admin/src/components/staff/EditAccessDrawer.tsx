import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  RotateCw,
  Trash2,
  Check,
  Loader2,
  ChevronDown,
  ChevronUp,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  adminStaffApi,
  type StaffMemberDto,
  type AdminRoleDto,
  type PermissionModuleDto,
} from '../../lib/adminStaffApi';
import { useAdminAuthStore } from '../../store/useAdminAuthStore';

interface EditAccessDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  staff: StaffMemberDto | null;
  roles: AdminRoleDto[];
  modules: PermissionModuleDto[];
  onUpdated: () => void;
}

export const EditAccessDrawer: React.FC<EditAccessDrawerProps> = ({
  isOpen,
  onClose,
  staff,
  roles,
  modules,
  onUpdated,
}) => {
  const currentAdmin = useAdminAuthStore((state) => state.admin);

  const [name, setName] = useState('');
  const [salutation, setSalutation] = useState('Adv.');
  const [phone, setPhone] = useState('');
  const [adminTitle, setAdminTitle] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [status, setStatus] = useState<'active' | 'suspended' | 'deactivated'>('active');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);

  const [isPermissionsOpen, setIsPermissionsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (staff) {
      setName(staff.name || '');
      setSalutation(staff.salutation || 'Adv.');
      setPhone(staff.phone || '');
      setAdminTitle(staff.role || '');
      setSelectedRoleId(staff.adminRoleId || (staff.adminRole as any)?._id || '');
      setStatus(staff.status || 'active');
      setIsSuperAdmin(Boolean(staff.isSuperAdmin));
      setCustomPermissions(staff.effectivePermissions || []);
      setNewPassword('');
    }
  }, [staff]);

  if (!isOpen || !staff) return null;

  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId);
    const found = roles.find((r) => r._id === roleId);
    if (found) {
      setAdminTitle(found.name);
      setCustomPermissions(found.permissions || []);
    }
  };

  const togglePermission = (perm: string) => {
    setCustomPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const toggleModuleAll = (modKey: string, actions: string[]) => {
    const modPerms = actions.map((act) => `${modKey}:${act}`);
    const allSelected = modPerms.every((p) => customPermissions.includes(p));

    if (allSelected) {
      setCustomPermissions((prev) => prev.filter((p) => !p.startsWith(`${modKey}:`)));
    } else {
      setCustomPermissions((prev) => Array.from(new Set([...prev, ...modPerms])));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await adminStaffApi.updateStaffAdmin(staff.id, {
        name: name.trim(),
        salutation,
        phone: phone.trim(),
        adminTitle: adminTitle.trim(),
        adminRoleId: selectedRoleId || undefined,
        status,
        isSuperAdmin: currentAdmin?.isSuperAdmin ? isSuperAdmin : staff.isSuperAdmin,
        customPermissions,
        password: newPassword.trim() ? newPassword.trim() : undefined,
      });

      toast.success(`Access & credentials updated for ${staff.name}`);
      onUpdated();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update access';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevokeSessions = async () => {
    try {
      setIsRevoking(true);
      await adminStaffApi.revokeStaffSessions(staff.id);
      toast.success(`Active sessions revoked for ${staff.name}. Token refreshed.`);
      onUpdated();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to revoke sessions';
      toast.error(msg);
    } finally {
      setIsRevoking(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!window.confirm(`Are you sure you want to deactivate ${staff.name}? They will lose all chamber access.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      await adminStaffApi.deleteStaffAdmin(staff.id);
      toast.success(`${staff.name} has been deactivated.`);
      onUpdated();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to deactivate admin';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs flex justify-end">
      <div className="relative w-full max-w-xl bg-[#1E1E1E] border-l border-[#3D3D3D] h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-6 border-b border-[#3D3D3D] bg-[#242424] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#C19B48]/15 border border-[#C19B48]/30 flex items-center justify-center text-[#C19B48] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-base font-bold text-[#F7F3E6] truncate">
                  Edit Access • {staff.name}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.2 rounded-sm uppercase ${
                    staff.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {staff.status}
                </span>
              </div>
              <p className="text-[11px] text-[#A8A294] truncate">{staff.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#2F2F2F] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Quick Security Actions */}
          <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-[#F7F3E6]">Active Session Management</div>
              <div className="text-[11px] text-[#A8A294]">
                Invalidate all cached JWT tokens immediately.
              </div>
            </div>
            <button
              type="button"
              onClick={handleRevokeSessions}
              disabled={isRevoking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E1E1E] hover:bg-[#2F2F2F] text-[#E8CF8D] hover:text-[#F7F3E6] border border-[#3D3D3D] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRevoking ? 'animate-spin' : ''}`} />
              <span>Revoke Sessions</span>
            </button>
          </div>

          {/* Designation & Role Preset */}
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#A8A294] uppercase tracking-wider mb-1.5">
                Chamber Role Preset
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
              >
                <option value="">-- Custom / Direct Clearance --</option>
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name} ({r.permissionTier})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#A8A294] uppercase tracking-wider mb-1.5">
                Admin Title / Chamber Role
              </label>
              <input
                type="text"
                value={adminTitle}
                onChange={(e) => setAdminTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#A8A294] uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[#A8A294] uppercase tracking-wider mb-1.5">
                Contact Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
              />
            </div>
          </div>

          {/* Status & Clearance Level */}
          <div className="p-4 rounded-xl bg-[#262626] border border-[#3D3D3D] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F7F3E6]">Account Status:</span>
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
              <label className="flex items-center gap-2 text-xs font-semibold text-[#C19B48] cursor-pointer pt-2 border-t border-[#3D3D3D]">
                <input
                  type="checkbox"
                  checked={isSuperAdmin}
                  onChange={(e) => setIsSuperAdmin(e.target.checked)}
                  className="rounded border-[#3D3D3D] text-[#C19B48] focus:ring-[#C19B48] bg-[#1E1E1E] w-4 h-4"
                />
                <ShieldAlert className="w-4 h-4" />
                <span>Super Admin Privileges (*)</span>
              </label>
            )}
          </div>

          {/* Optional Password Reset */}
          <div>
            <label className="block text-[11px] font-semibold text-[#A8A294] uppercase tracking-wider mb-1.5">
              Reset Password (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A8A294]">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                placeholder="Leave blank to preserve current password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
              />
            </div>
          </div>

          {/* Granular Module Permissions */}
          <div className="border border-[#3D3D3D] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setIsPermissionsOpen(!isPermissionsOpen)}
              className="w-full p-3.5 bg-[#242424] hover:bg-[#282828] flex items-center justify-between text-xs font-semibold text-[#F7F3E6] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span>Granular Feature Permissions</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C19B48]/15 text-[#E8CF8D] border border-[#C19B48]/30">
                  {customPermissions.includes('*') ? 'All Features (*)' : `${customPermissions.length} enabled`}
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
                    customPermissions.includes(`${mod.key}:${act}`)
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
                            customPermissions.includes('*') ||
                            customPermissions.includes(`${mod.key}:*`) ||
                            customPermissions.includes(permKey);

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
        </form>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[#3D3D3D] bg-[#242424] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleDeleteStaff}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Deactivate Admin</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#262626] hover:bg-[#2F2F2F] text-[#A8A294] hover:text-[#F7F3E6] text-xs font-semibold border border-[#3D3D3D] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Access Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
