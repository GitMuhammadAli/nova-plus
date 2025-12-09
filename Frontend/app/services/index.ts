import api from '@/lib/api';

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (data: { email: string; password: string; name: string; role?: string }) =>
    api.post('/auth/register', data),
  
  logout: () => api.post('/auth/logout'),
  
  refreshToken: () => api.post('/auth/refresh'),
  
  getCurrentUser: () => api.get('/auth/me'),
};

// ============================================
// USERS API
// ============================================
export const usersAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/user', { params }),
  
  getCompanyUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/user/company', { params }),
  
  getAllForAdmin: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/user/all', { params }),
  
  getMyUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/user/my-users', { params }),
  
  getById: (id: string) => api.get(`/user/${id}`),
  
  create: (data: any) => api.post('/user', data),
  
  createByAdmin: (data: { name: string; email: string; password: string; role: string; managerId?: string }) =>
    api.post('/user/create-by-admin', data),
  
  createByManager: (data: { name: string; email: string; password: string; department?: string; location?: string }) =>
    api.post('/user/create-by-manager', data),
  
  update: (id: string, data: any) => api.patch(`/user/${id}`, data),
  
  delete: (id: string) => api.delete(`/user/${id}`),
};

// ============================================
// ANALYTICS API
// ============================================
export const analyticsAPI = {
  getSummary: () => api.get('/analytics/summary'),
  
  getAnalyticsStats: (period?: string) => api.get('/analytics/stats', { params: { period } }),
  
  recordVisit: (path: string, metadata?: Record<string, any>) => 
    api.post('/analytics/visit', { path, metadata }),
  
  trackVisit: (data: {
    page: string;
    referrer?: string;
    userAgent?: string;
    ipAddress?: string;
    device?: string;
    browser?: string;
    os?: string;
    duration?: number;
  }) => api.post('/analytics/visit', { path: data.page, metadata: data }),
  
  getStats: (period?: string) => api.get('/analytics/stats', { params: { period } }),
  
  getTraffic: (period?: string) => api.get('/analytics/traffic', { params: { period } }),
  
  getDevices: (period?: string) => api.get('/analytics/devices', { params: { period } }),
  
  getConversion: (period?: string) => api.get('/analytics/conversion', { params: { period } }),
  
  getTopPages: (period?: string) => api.get('/analytics/top-pages', { params: { period } }),
};

// ============================================
// BILLING API
// ============================================
export const billingAPI = {
  getAll: (params?: any) => api.get('/billing', { params }),
  
  getById: (id: string) => api.get(`/billing/${id}`),
  
  create: (data: any) => api.post('/billing', data),
  
  update: (id: string, data: any) => api.patch(`/billing/${id}`, data),
  
  delete: (id: string) => api.delete(`/billing/${id}`),
};

// ============================================
// SETTINGS API
// ============================================
export const settingsAPI = {
  getAll: (params?: any) => api.get('/settings', { params }),
  
  getById: (id: string) => api.get(`/settings/${id}`),
  
  create: (data: any) => api.post('/settings', data),
  
  update: (id: string, data: any) => api.patch(`/settings/${id}`, data),
  
  delete: (id: string) => api.delete(`/settings/${id}`),
  
  getCompany: () => api.get('/settings/company'),
  
  getBranding: () => api.get('/settings/branding'),
  
  updateBranding: (data: { logo?: string; primaryColor?: string; secondaryColor?: string; companyName?: string }) =>
    api.patch('/settings/branding', data),
  
  getPermissions: () => api.get('/settings/permissions'),
  
  updatePermissions: (data: Record<string, any>) => api.patch('/settings/permissions', data),
};

// ============================================
// TASK API
// ============================================
export const taskAPI = {
  getAll: (params?: any) => api.get('/tasks', { params }),
  
  getById: (id: string) => api.get(`/tasks/${id}`),
  
  create: (data: any) => api.post('/tasks', data),
  
  update: (id: string, data: any) => api.patch(`/tasks/${id}`, data),
  
  updateStatus: (id: string, status: string) => api.patch(`/tasks/${id}/status`, { status }),
  
  addComment: (id: string, comment: string) => api.post(`/tasks/${id}/comments`, { comment }),
  
  delete: (id: string) => api.delete(`/tasks/${id}`),
  
  getMyTasks: () => api.get('/tasks/me'),
};

// ============================================
// PROJECT API
// ============================================
export const projectAPI = {
  findAll: (params?: { status?: string; assignedTo?: string }) => api.get('/projects', { params }),
  
  getById: (id: string) => api.get(`/projects/${id}`),
  
  create: (data: any) => api.post('/projects', data),
  
  update: (id: string, data: any) => api.patch(`/projects/${id}`, data),
  
  delete: (id: string) => api.delete(`/projects/${id}`),
  
  getMyProjects: () => api.get('/projects/me'),
};

// ============================================
// TEAM API
// ============================================
export const teamAPI = {
  getAll: (params?: any) => api.get('/team', { params }),
  
  getById: (id: string) => api.get(`/team/${id}`),
  
  create: (data: any) => api.post('/team', data),
  
  update: (id: string, data: any) => api.patch(`/team/${id}`, data),
  
  delete: (id: string) => api.delete(`/team/${id}`),
  
  addMember: (teamId: string, data: any) => api.post(`/team/${teamId}/members`, data),
  
  removeMember: (teamId: string, memberId: string) => 
    api.delete(`/team/${teamId}/members/${memberId}`),
};

// ============================================
// UPLOADS API
// ============================================
export const uploadsAPI = {
  getAll: (params?: any) => api.get('/uploads', { params }),
  
  getById: (id: string) => api.get(`/uploads/${id}`),
  
  upload: (formData: FormData) => 
    api.post('/uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  delete: (id: string) => api.delete(`/uploads/${id}`),
  
  update: (id: string, data: any) => api.patch(`/uploads/${id}`, data),
  
  makePublic: (id: string) => api.post(`/uploads/${id}/make-public`),
  
  getSignedUrl: (data?: { folder?: string; expiresIn?: number }) => 
    api.post('/uploads/signed-url', data),
};

// ============================================
// HEALTH API
// ============================================
export const healthAPI = {
  check: () => api.get('/health'),
};

// ============================================
// DASHBOARD API
// ============================================
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getStats: (period?: string) => api.get('/dashboard/stats', { params: { period } }),
};

// ============================================
// ACTIVITY API
// ============================================
export const activityAPI = {
  getRecent: (limit?: number) => api.get('/activity/recent', { params: { limit } }),
};

// ============================================
// WEBHOOK API
// ============================================
export const webhookAPI = {
  getAll: () => api.get('/webhooks'),
  getById: (id: string) => api.get(`/webhooks/${id}`),
  create: (data: { url: string; events: string[]; retries?: number; isActive?: boolean }) =>
    api.post('/webhooks', data),
  update: (id: string, data: { url?: string; events?: string[]; retries?: number; isActive?: boolean }) =>
    api.patch(`/webhooks/${id}`, data),
  delete: (id: string) => api.delete(`/webhooks/${id}`),
  test: (id: string) => api.post(`/webhooks/${id}/test`),
  getLogs: (id: string, limit?: number) => api.get(`/webhooks/${id}/logs`, { params: { limit } }),
};

// ============================================
// QUEUE API
// ============================================
export const queueAPI = {
  getStats: () => api.get('/queue/stats'),
};

// ============================================
// COMPANY API
// ============================================
export const companyAPI = {
  getAll: () => api.get('/company/all'),
  getById: (id: string) => api.get(`/company/${id}`),
  getStats: (id: string) => api.get(`/company/${id}/stats`),
  getActivity: (id: string) => api.get(`/company/${id}/activity`),
  getProfile: (id: string) => api.get(`/company/${id}/profile`),
  create: (data: {
    name: string;
    domain?: string;
    companyAdminEmail: string;
    companyAdminName: string;
    companyAdminPassword: string;
  }) => api.post('/company/create', data),
  register: (data: {
    companyName: string;
    domain?: string;
    adminName: string;
    email: string;
    password: string;
  }) => api.post('/company/register', data),
  update: (id: string, data: { name?: string; domain?: string }) => api.patch(`/company/${id}`, data),
  getCompanyUsers: (companyId: string, params?: { page?: number; limit?: number; search?: string }) =>
    api.get(`/company/${companyId}/users`, { params }),
};

// ============================================
// DEPARTMENT API
// ============================================
export const departmentAPI = {
  getAll: () => api.get('/departments'),
  
  getById: (id: string) => api.get(`/departments/${id}`),
  
  create: (data: any) => api.post('/departments', data),
  
  update: (id: string, data: any) => api.patch(`/departments/${id}`, data),
  
  delete: (id: string) => api.delete(`/departments/${id}`),
  
  assignManager: (id: string, managerId: string) => 
    api.post(`/departments/${id}/assign-manager`, { managerId }),
  
  addMember: (id: string, userId: string) => 
    api.post(`/departments/${id}/members`, { userId }),
  
  removeMember: (id: string, userId: string) => 
    api.delete(`/departments/${id}/members/${userId}`),
};

// ============================================
// AUDIT API
// ============================================
export const auditAPI = {
  getAll: (params?: { page?: number; limit?: number; search?: string; action?: string; severity?: string; userId?: string; resource?: string; startDate?: string; endDate?: string }) => 
    api.get('/audit/logs', { params }),
  
  getRecent: (limit?: number) => api.get('/audit/recent', { params: { limit } }),
  
  getById: (id: string) => api.get(`/audit/${id}`),
};

// ============================================
// WORKFLOW API
// ============================================
export const workflowAPI = {
  getAll: (params?: { status?: string; search?: string }) => 
    api.get('/workflow', { params }),
  
  getById: (id: string) => api.get(`/workflow/${id}`),
  
  create: (data: any) => api.post('/workflow', data),
  
  update: (id: string, data: any) => api.patch(`/workflow/${id}`, data),
  
  remove: (id: string) => api.delete(`/workflow/${id}`),
  
  toggleStatus: (id: string) => api.post(`/workflow/${id}/toggle-status`),
  
  duplicate: (id: string) => api.post(`/workflow/${id}/duplicate`),
  
  execute: (id: string, triggerData?: any) => 
    api.post(`/workflow/${id}/execute`, { triggerData }),
};

// ============================================
// INVITE API
// ============================================
export const inviteAPI = {
  createInvite: (data: {
    email?: string;
    role: string;
    expiresInDays?: number;
  }, companyId: string) => api.post(`/invite/company/${companyId}`, data),
  getInvite: (token: string) => api.get(`/invite/${token}`),
  acceptInvite: (token: string, data: {
    name: string;
    email: string;
    password: string;
  }) => api.post(`/invite/${token}/accept`, data),
  getCompanyInvites: (companyId: string) => api.get(`/invite/company/${companyId}`),
  revokeInvite: (inviteId: string, companyId: string) => api.delete(`/invite/${inviteId}/company/${companyId}`),
  resendInvite: (inviteId: string) => api.post(`/invite/${inviteId}/resend`),
  cancelInvite: (inviteId: string) => api.post(`/invite/${inviteId}/cancel`),
  bulkCreateInvites: (data: { companyId: string; invites: Array<{ email?: string; role: string; expiresInDays?: number }> }) => 
    api.post(`/invite/bulk`, data),
};

// ============================================
// BILLING API
// ============================================
export const billingAPI = {
  createCheckoutSession: (data: { priceId: string; successUrl?: string; cancelUrl?: string }) =>
    api.post('/billing/create-checkout-session', data),
  
  getPlans: () => api.get('/billing/plans'),
  
  getBillingInfo: () => api.get('/billing/me'),
  
  updateUsage: (data: { subscriptionItemId: string; quantity: number }) =>
    api.post('/billing/usage', data),
  
  cancelSubscription: (data: { immediately?: boolean }) =>
    api.post('/billing/cancel', data),
};

// ============================================
// INTEGRATIONS API
// ============================================
export const integrationsAPI = {
  getAll: () => api.get('/integrations'),
  
  testEmail: (data: { smtpHost: string; smtpPort: number; username: string; password: string; to: string }) =>
    api.post('/integrations/email/test', data),
  
  testSlack: (data: { webhookUrl: string }) =>
    api.post('/integrations/slack/test', data),
  
  startGoogleOAuth: () => api.get('/integrations/oauth/google/start'),
  
  handleGoogleOAuthCallback: (code: string, state: string) =>
    api.get('/integrations/oauth/google/callback', { params: { code, state } }),
  
  delete: (id: string) => api.delete(`/integrations/${id}`),
};