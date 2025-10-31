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
  
  getById: (id: string) => api.get(`/user/${id}`),
  
  create: (data: any) => api.post('/user', data),
  
  update: (id: string, data: any) => api.patch(`/user/${id}`, data),
  
  delete: (id: string) => api.delete(`/user/${id}`),
};

// ============================================
// ANALYTICS API
// ============================================
export const analyticsAPI = {
  getAll: (params?: any) => api.get('/analytics', { params }),
  
  getById: (id: string) => api.get(`/analytics/${id}`),
  
  getDashboardStats: () => api.get('/analytics/dashboard-stats'),
  
  create: (data: any) => api.post('/analytics', data),
  
  update: (id: string, data: any) => api.patch(`/analytics/${id}`, data),
  
  delete: (id: string) => api.delete(`/analytics/${id}`),
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
};

// ============================================
// TASK API
// ============================================
export const taskAPI = {
  getAll: (params?: any) => api.get('/task', { params }),
  
  getById: (id: string) => api.get(`/task/${id}`),
  
  create: (data: any) => api.post('/task', data),
  
  update: (id: string, data: any) => api.patch(`/task/${id}`, data),
  
  delete: (id: string) => api.delete(`/task/${id}`),
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
  getSummary: () => api.get('/api/dashboard/summary'),
  getStats: (period?: string) => api.get('/api/dashboard/stats', { params: { period } }),
};

// ============================================
// ACTIVITY API
// ============================================
export const activityAPI = {
  getRecent: (limit?: number) => api.get('/api/activity/recent', { params: { limit } }),
};