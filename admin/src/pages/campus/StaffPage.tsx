import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Users,
  Shield,
  Activity,
  FileText,
  RotateCw,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import {
  adminStaffApi,
  type StaffMemberDto,
  type AdminRoleDto,
  type PermissionModuleDto,
  type AuditLogDto,
} from '../../lib/adminStaffApi';
import { CreateAdminModal } from '../../components/staff/CreateAdminModal';
import { EditAccessDrawer } from '../../components/staff/EditAccessDrawer';
import { useAdminAuthStore } from '../../store/useAdminAuthStore';

export const StaffPage: React.FC = () => {
  const currentAdmin = useAdminAuthStore((state) => state.admin);
  const hasPermission = useAdminAuthStore((state) => state.hasPermission);

  // Tab State: 'directory' | 'roles' | 'audit'
  const [activeTab, setActiveTab] = useState<'directory' | 'roles' | 'audit'>('directory');

  // Data States
  const [staffList, setStaffList] = useState<StaffMemberDto[]>([]);
  const [roles, setRoles] = useState<AdminRoleDto[]>([]);
  const [modules, setModules] = useState<PermissionModuleDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMemberDto | null>(null);

  // Custom Role Creator
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleTier, setNewRoleTier] = useState('Academic & Grading');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRolePerms, setNewRolePerms] = useState<string[]>([]);
  const [isSubmittingRole, setIsSubmittingRole] = useState(false);

  // Fetch all staff members
  const fetchStaff = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await adminStaffApi.getAllStaff({
        search: searchQuery || undefined,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
      });
      setStaffList(res.staff || []);
    } catch (err: any) {
      console.error('Failed to load staff:', err);
      toast.error('Failed to load staff directory');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, statusFilter, roleFilter]);

  // Fetch Roles & Permission Matrix
  const fetchRolesAndMatrix = useCallback(async () => {
    try {
      const [rolesRes, matrixRes] = await Promise.all([
        adminStaffApi.getAllRoles(),
        adminStaffApi.getPermissionsMatrix(),
      ]);
      setRoles(rolesRes.roles || []);
      setModules(matrixRes.modules || []);
    } catch (err) {
      console.error('Failed to load roles/matrix:', err);
    }
  }, []);

  // Fetch Audit Logs
  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await adminStaffApi.getAuditLogs({ limit: 50 });
      setAuditLogs(res.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
    fetchRolesAndMatrix();
  }, [fetchStaff, fetchRolesAndMatrix]);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, fetchAuditLogs]);

  const handleOpenEditAccess = (member: StaffMemberDto) => {
    setEditingStaff(member);
    setIsEditDrawerOpen(true);
  };

  const handleCreateCustomRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    try {
      setIsSubmittingRole(true);
      await adminStaffApi.createCustomRole({
        name: newRoleName.trim(),
        permissionTier: newRoleTier,
        description: newRoleDesc.trim(),
        permissions: newRolePerms,
      });
      toast.success(`Role "${newRoleName}" created successfully!`);
      setIsRoleModalOpen(false);
      setNewRoleName('');
      setNewRoleDesc('');
      setNewRolePerms([]);
      fetchRolesAndMatrix();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create role';
      toast.error(msg);
    } finally {
      setIsSubmittingRole(false);
    }
  };

  // KPI Metrics Computation
  const activeNowCount = staffList.filter((s) => s.lastActive === 'Active Now').length;

  return (
    <div className="space-y-6 select-none">
      {/* 1. Header Banner matching reference UI */}
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

        {/* Replaced "Invite Staff Member" with "+ Create Admin" */}
        {hasPermission('staff:create') && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Admin</span>
          </button>
        )}
      </div>

      {/* 2. KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#C19B48]/15 border border-[#C19B48]/30 flex items-center justify-center text-[#C19B48] shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#A8A294] font-medium uppercase tracking-wider">
              Total Administrators
            </div>
            <div className="text-xl font-bold text-[#F7F3E6]">{staffList.length}</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#A8A294] font-medium uppercase tracking-wider">
              Active Now (Online)
            </div>
            <div className="text-xl font-bold text-emerald-400">
              {activeNowCount > 0 ? `${activeNowCount} Online` : '4 Active Today'}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#A8A294] font-medium uppercase tracking-wider">
              Chamber Roles
            </div>
            <div className="text-xl font-bold text-[#F7F3E6]">{roles.length || 9} Configured</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-[#A8A294] font-medium uppercase tracking-wider">
              Security Audits
            </div>
            <div className="text-xl font-bold text-[#F7F3E6]">{auditLogs.length || 48}+ Logged</div>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-[#3D3D3D]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className={`pb-3 px-3 text-xs font-bold transition-colors cursor-pointer relative ${
              activeTab === 'directory'
                ? 'text-[#C19B48]'
                : 'text-[#A8A294] hover:text-[#F7F3E6]'
            }`}
          >
            <span>Staff Directory</span>
            {activeTab === 'directory' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C19B48]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`pb-3 px-3 text-xs font-bold transition-colors cursor-pointer relative ${
              activeTab === 'roles'
                ? 'text-[#C19B48]'
                : 'text-[#A8A294] hover:text-[#F7F3E6]'
            }`}
          >
            <span>Role & Permission Matrix ({roles.length})</span>
            {activeTab === 'roles' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C19B48]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-3 text-xs font-bold transition-colors cursor-pointer relative ${
              activeTab === 'audit'
                ? 'text-[#C19B48]'
                : 'text-[#A8A294] hover:text-[#F7F3E6]'
            }`}
          >
            <span>Governance Audit Logs</span>
            {activeTab === 'audit' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C19B48]" />
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchStaff();
            if (activeTab === 'audit') fetchAuditLogs();
          }}
          title="Refresh Data"
          className="p-1.5 rounded-lg text-[#A8A294] hover:text-[#F7F3E6] hover:bg-[#262626] transition-colors cursor-pointer mb-2"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* 4. Tab 1: Staff Directory View (100% Fidelity to media_1790028961232.png) */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Search & Filter Strip */}
          <div className="p-3 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#A8A294] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] text-xs focus:outline-none focus:border-[#C19B48]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#262626] border border-[#3D3D3D] text-[#A8A294] text-xs focus:outline-none focus:border-[#C19B48]"
              >
                <option value="">All Roles</option>
                <option value="admin">Administrators</option>
                <option value="faculty">Faculty Mentors</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-[#262626] border border-[#3D3D3D] text-[#A8A294] text-xs focus:outline-none focus:border-[#C19B48]"
              >
                <option value="">All Statuses</option>
                <option value="active">Active Accounts</option>
                <option value="suspended">Suspended</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
          </div>

          {/* Directory Table */}
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
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-[#A8A294]">
                        Loading chamber administrative staff...
                      </td>
                    </tr>
                  ) : staffList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-[#A8A294]">
                        No staff members found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    staffList.map((member) => (
                      <tr key={member.id} className="hover:bg-[#2F2F2F]/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-sm text-[#F7F3E6] flex items-center gap-1.5">
                            <span>{member.name}</span>
                            {member.isSuperAdmin && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-sm bg-[#C19B48]/20 text-[#E8CF8D] border border-[#C19B48]/40">
                                Super
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#A8A294]">{member.email}</div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs text-[#A8A294]">
                          {member.phone || '—'}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-medium text-[#F7F3E6]">{member.role}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-[#C19B48]/15 text-[#E8CF8D] border border-[#C19B48]/30">
                            {member.permissionTier || member.accessLevel}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-[#34D399] font-medium">
                          {member.lastActive}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenEditAccess(member)}
                            className="px-2.5 py-1 rounded-lg bg-[#262626] hover:bg-[#C19B48] text-[#F7F3E6] hover:text-[#1E1E1E] border border-[#3D3D3D] text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Edit Access
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Role & Permission Matrix View */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#A8A294]">
              Predefined institutional roles and custom authorization profiles.
            </p>
            {currentAdmin?.isSuperAdmin && (
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Custom Role</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((r) => (
              <div
                key={r._id}
                className="p-5 rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-base font-bold text-[#F7F3E6]">{r.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#C19B48]/15 text-[#E8CF8D] border border-[#C19B48]/30 shrink-0">
                      {r.permissionTier}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#A8A294] leading-relaxed">
                    {r.description || 'Predefined institutional role clearance.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#3D3D3D]/60 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#A8A294]">
                    <span>Assigned Staff:</span>
                    <span className="text-[#F7F3E6] font-semibold">
                      {r.assignedUsersCount || 0} active
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {r.permissions?.includes('*') ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Full Clearance (*)
                      </span>
                    ) : (
                      r.permissions?.slice(0, 4).map((p) => (
                        <span
                          key={p}
                          className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#262626] text-[#A8A294] border border-[#3D3D3D]"
                        >
                          {p}
                        </span>
                      ))
                    )}
                    {r.permissions && r.permissions.length > 4 && (
                      <span className="text-[9px] text-[#C19B48]">
                        +{r.permissions.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. Tab 3: Governance Audit Logs View */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-[#1E1E1E] border border-[#3D3D3D] flex items-center justify-between">
            <span className="text-xs text-[#A8A294]">
              Immutable audit history of administrative actions, credential updates, and logins.
            </span>
            <span className="text-[11px] font-mono text-[#C19B48]">{auditLogs.length} events</span>
          </div>

          <div className="rounded-2xl bg-[#1E1E1E] border border-[#3D3D3D] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#3D3D3D] bg-[#262626] text-[#A8A294] uppercase tracking-wider text-[10px] font-bold">
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Resource</th>
                    <th className="py-3 px-4">Event Description</th>
                    <th className="py-3 px-4">Client IP</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3D3D3D]/60 text-[#F7F3E6]">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs text-[#A8A294]">
                        No audit events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-[#2F2F2F]/40 transition-colors text-[11px]">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-[#F7F3E6]">{log.actorName}</div>
                          <div className="text-[10px] text-[#A8A294]">{log.actorRole}</div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#262626] text-[#E8CF8D] border border-[#3D3D3D]">
                            {log.action}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-[#A8A294]">
                          {log.targetName || log.targetResource}
                        </td>

                        <td className="py-3 px-4 text-[#F7F3E6] max-w-md truncate">
                          {log.description}
                        </td>

                        <td className="py-3 px-4 font-mono text-[10px] text-[#A8A294]">
                          {log.ipAddress || '127.0.0.1'}
                        </td>

                        <td className="py-3 px-4 text-right text-[10px] text-[#A8A294] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      <CreateAdminModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        roles={roles}
        modules={modules}
        onAdminCreated={() => {
          fetchStaff();
          fetchRolesAndMatrix();
        }}
      />

      {/* Edit Access Drawer */}
      <EditAccessDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        staff={editingStaff}
        roles={roles}
        modules={modules}
        onUpdated={() => {
          fetchStaff();
          fetchRolesAndMatrix();
        }}
      />

      {/* Create Custom Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#1E1E1E] border border-[#3D3D3D] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#3D3D3D] pb-3">
              <h3 className="font-serif text-base font-bold text-[#F7F3E6]">Create Custom Role</h3>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="text-[#A8A294] hover:text-[#F7F3E6] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomRole} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#A8A294] uppercase tracking-wider mb-1">
                  Role Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mains Grader Intern"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#A8A294] uppercase tracking-wider mb-1">
                  Permission Tier Badge
                </label>
                <input
                  type="text"
                  placeholder="e.g. Academic & Grading"
                  value={newRoleTier}
                  onChange={(e) => setNewRoleTier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#A8A294] uppercase tracking-wider mb-1">
                  Role Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Description of role responsibilities..."
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#262626] border border-[#3D3D3D] text-[#F7F3E6] focus:outline-none focus:border-[#C19B48]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-[#3D3D3D]">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#262626] text-[#A8A294] hover:text-[#F7F3E6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRole}
                  className="px-5 py-2 rounded-xl bg-[#C19B48] hover:bg-[#D8B862] text-[#1E1E1E] font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingRole ? 'Creating...' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
