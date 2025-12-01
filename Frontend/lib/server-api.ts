import { cookies } from 'next/headers';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5500';
const API_URL = API_BASE.endsWith('/api/v1') 
  ? API_BASE 
  : API_BASE.endsWith('/') 
    ? `${API_BASE}api/v1`
    : `${API_BASE}/api/v1`;

/**
 * Server-side API client that uses cookies for authentication
 */
async function serverFetch(endpoint: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;
  const refreshToken = cookieStore.get('refresh_token')?.value;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  // Include cookies in the request
  const cookieHeader = cookieStore.toString();
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
    cache: options.cache || 'no-store', // Default to no cache for dynamic data
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Handle unauthorized - might need to refresh token
      throw new Error('Unauthorized');
    }
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `Request failed with status ${response.status}`);
  }

  const data = await response.json();
  // Handle TransformInterceptor format: { success: true, data: ... }
  // Or direct data format
  if (data && typeof data === 'object' && !Array.isArray(data) && 'data' in data && data.success !== false) {
    return data.data;
  }
  return data;
}

/**
 * Server-side API utilities
 */
export const serverAPI = {
  // Auth
  getCurrentUser: async () => {
    try {
      const data = await serverFetch('/auth/me');
      return data?.data || data;
    } catch (error) {
      return null;
    }
  },

  // Users
  getUsers: async (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const data = await serverFetch(`/user?${queryParams.toString()}`);
    // serverFetch already extracts data from { success: true, data: ... }
    return Array.isArray(data) ? data : (data?.data || data || []);
  },

  getCompanyUsers: async (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const data = await serverFetch(`/user/company?${queryParams.toString()}`);
    // serverFetch already extracts data from { success: true, data: ... }
    return Array.isArray(data) ? data : (data?.data || data || []);
  },

  // Company
  getCompany: async (companyId: string) => {
    const data = await serverFetch(`/company/${companyId}`);
    return data;
  },

  getCompanyStats: async (companyId: string) => {
    const data = await serverFetch(`/company/${companyId}/stats`);
    return data;
  },

  // Dashboard
  getDashboardSummary: async () => {
    const data = await serverFetch('/dashboard/summary');
    return data;
  },

  getDashboardStats: async (period: string = '30d') => {
    const data = await serverFetch(`/dashboard/stats?period=${period}`);
    return data;
  },

  // Departments
  getDepartments: async () => {
    const data = await serverFetch('/departments');
    // Backend returns { success: true, departments: [...] }
    if (data && typeof data === 'object' && 'departments' in data) {
      return Array.isArray(data.departments) ? data.departments : [];
    }
    return Array.isArray(data) ? data : (data?.data || data || []);
  },

  // Invites
  getCompanyInvites: async (companyId: string) => {
    const data = await serverFetch(`/invite/company/${companyId}`);
    return Array.isArray(data) ? data : (data?.data || data || []);
  },

  // Projects
  getProjects: async (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const data = await serverFetch(`/project?${queryParams.toString()}`);
    return Array.isArray(data) ? data : (data?.data || data || []);
  },

  // Tasks
  getTasks: async (params?: { page?: number; limit?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const data = await serverFetch(`/task?${queryParams.toString()}`);
    return Array.isArray(data) ? data : (data?.data || data || []);
  },

  getMyTasks: async () => {
    const data = await serverFetch('/task/my-tasks');
    return Array.isArray(data) ? data : (data?.data || data || []);
  },
};

