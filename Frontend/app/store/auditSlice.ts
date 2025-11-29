import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auditAPI } from '../services';

interface AuditLog {
  _id: string;
  action: string;
  resource: string;
  resourceId?: string;
  userId?: any;
  userName?: string;
  companyId?: string;
  metadata?: any;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

interface AuditState {
  logs: AuditLog[];
  recentActivity: AuditLog[];
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const initialState: AuditState = {
  logs: [],
  recentActivity: [],
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  },
};

export const fetchAuditLogs = createAsyncThunk(
  'audit/fetchLogs',
  async (params: {
    page?: number;
    limit?: number;
    action?: string;
    resource?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await auditAPI.getAll(params);
      // TransformInterceptor wraps in { success: true, data: ... }
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch audit logs');
    }
  }
);

export const fetchRecentActivity = createAsyncThunk(
  'audit/fetchRecent',
  async (limit: number = 20, { rejectWithValue }) => {
    try {
      const response = await auditAPI.getRecent(limit);
      const data = response.data?.logs || response.data?.data || response.data || [];
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recent activity');
    }
  }
);

const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditLogs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        const payload = action.payload;
        const logsData = payload?.logs || payload?.data || [];
        state.logs = Array.isArray(logsData) ? logsData : [];
        if (payload?.pagination) {
          state.pagination = payload.pagination;
        }
      })
      .addCase(fetchAuditLogs.rejected, (state) => {
        state.isLoading = false;
        state.logs = [];
        state.error = null;
      });

    builder
      .addCase(fetchRecentActivity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecentActivity.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recentActivity = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchRecentActivity.rejected, (state) => {
        state.isLoading = false;
        state.recentActivity = [];
        state.error = null;
      });
  },
});

export const { clearError } = auditSlice.actions;
export default auditSlice.reducer;

