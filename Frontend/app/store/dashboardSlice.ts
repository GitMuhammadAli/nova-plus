import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardAPI } from '../services';

interface DashboardSummary {
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  activeUsers: number;
  completedProjects: number;
  pendingTasks: number;
  recentActivity?: any[];
}

interface DashboardStats {
  users: {
    total: number;
    active: number;
    new: number;
    growth: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    growth: number;
  };
  tasks: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
}

interface DashboardState {
  summary: DashboardSummary | null;
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  summary: null,
  stats: null,
  isLoading: false,
  error: null,
};

export const fetchDashboardSummary = createAsyncThunk(
  'dashboard/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getSummary();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard summary');
    }
  }
);

export const fetchDashboardStats = createAsyncThunk(
  'dashboard/fetchStats',
  async (period: string = '30d', { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getStats(period);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard stats');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchDashboardSummary.rejected, (state) => {
        state.isLoading = false;
        state.summary = null;
        state.error = null;
      });

    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state) => {
        state.isLoading = false;
        state.stats = null;
        state.error = null;
      });
  },
});

export const { clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;

