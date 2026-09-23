import apiClient from './apiClient';

export interface AdminRoleDto {
  _id: string;
  name: string;
  slug: string;
  description: string;
  isSystemRole: boolean;
  permissionTier: string;
  permissions: string[];
  assignedUsersCount?: number;
  isActive: boolean;
}

export interface StaffMemberDto {
  id: string;
  _id: string;
  rollNo?: string;
  name: string;
  salutation?: string;
  email: string;
  phone: string;
  role: string;
  adminRole?: AdminRoleDto | null;
  adminRoleId?: string;
  accessLevel: string;
  permissionTier: string;
  isSuperAdmin: boolean;
  lastActive: string;
  lastActiveAt?: string;
  status: 'active' | 'suspended' | 'deactivated';
  customPermissions: string[];
  effectivePermissions: string[];
  createdAt?: string;
}

export interface AuditLogDto {
  _id: string;
  actorId: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetResource: string;
  targetResourceId?: string;
  targetName?: string;
  description: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface PermissionModuleDto {
  key: string;
  label: string;
  actions: string[];
}

export const adminStaffApi = {
  // Staff Directory
  async getAllStaff(params?: { search?: string; role?: string; status?: string }): Promise<{ staff: StaffMemberDto[]; total: number }> {
    const res = await apiClient.get('/admin/staff', { params });
    return res.data;
  },

  async getStaffById(id: string): Promise<{ staff: StaffMemberDto }> {
    const res = await apiClient.get(`/admin/staff/${id}`);
    return res.data;
  },

  async createStaffAdmin(payload: {
    name: string;
    email: string;
    phone?: string;
    salutation?: string;
    password?: string;
    adminRoleId?: string;
    adminTitle?: string;
    customPermissions?: string[];
    status?: 'active' | 'suspended';
    isSuperAdmin?: boolean;
  }): Promise<{ message: string; staff: StaffMemberDto }> {
    const res = await apiClient.post('/admin/staff', payload);
    return res.data;
  },

  async updateStaffAdmin(
    id: string,
    payload: {
      name?: string;
      email?: string;
      phone?: string;
      salutation?: string;
      password?: string;
      adminRoleId?: string;
      adminTitle?: string;
      customPermissions?: string[];
      status?: 'active' | 'suspended' | 'deactivated';
      isSuperAdmin?: boolean;
    }
  ): Promise<{ message: string; staff: StaffMemberDto }> {
    const res = await apiClient.put(`/admin/staff/${id}`, payload);
    return res.data;
  },

  async toggleStaffStatus(
    id: string,
    status: 'active' | 'suspended' | 'deactivated'
  ): Promise<{ message: string; status: string }> {
    const res = await apiClient.patch(`/admin/staff/${id}/status`, { status });
    return res.data;
  },

  async revokeStaffSessions(id: string): Promise<{ message: string }> {
    const res = await apiClient.post(`/admin/staff/${id}/revoke-sessions`);
    return res.data;
  },

  async deleteStaffAdmin(id: string): Promise<{ message: string }> {
    const res = await apiClient.delete(`/admin/staff/${id}`);
    return res.data;
  },

  // Roles & Access Tiers
  async getAllRoles(): Promise<{ roles: AdminRoleDto[] }> {
    const res = await apiClient.get('/admin/roles');
    return res.data;
  },

  async createCustomRole(payload: {
    name: string;
    description?: string;
    permissionTier?: string;
    permissions: string[];
  }): Promise<{ message: string; role: AdminRoleDto }> {
    const res = await apiClient.post('/admin/roles', payload);
    return res.data;
  },

  async updateRole(
    id: string,
    payload: {
      name?: string;
      description?: string;
      permissionTier?: string;
      permissions?: string[];
      isActive?: boolean;
    }
  ): Promise<{ message: string; role: AdminRoleDto }> {
    const res = await apiClient.put(`/admin/roles/${id}`, payload);
    return res.data;
  },

  async deleteRole(id: string): Promise<{ message: string }> {
    const res = await apiClient.delete(`/admin/roles/${id}`);
    return res.data;
  },

  // Governance Audit Logs
  async getAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    actorId?: string;
    search?: string;
  }): Promise<{ logs: AuditLogDto[]; total: number; page: number; totalPages: number }> {
    const res = await apiClient.get('/admin/audit-logs', { params });
    return res.data;
  },

  // System Permissions Matrix
  async getPermissionsMatrix(): Promise<{ modules: PermissionModuleDto[] }> {
    const res = await apiClient.get('/admin/permissions/matrix');
    return res.data;
  },
};

export default adminStaffApi;
