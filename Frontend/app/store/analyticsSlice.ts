import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { analyticsAPI } from '../services';

interface AnalyticsSummary {
  totalVisitors: number;
  visitorsLast30Days: number;
  visitorChange: number;
  avgSessionDuration: string;
  conversionRate: number;
  conversionRateChange: number;
  revenue: number;
  revenueChange: number;
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
}

interface AnalyticsStats {
  trafficData: any[];
  conversionData: any[];
  deviceData: any[];
  topPages: any[];
}

interface AnalyticsState {
  summary: AnalyticsSummary | null;
  stats: AnalyticsStats | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  summary: null,
  stats: null,
  isLoading: false,
  error: null,
};

export const fetchAnalyticsSummary = createAsyncThunk(
  'analytics/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await analyticsAPI.getSummary();
      // TransformInterceptor wraps in { success: true, data: ... }
      return response.data?.data || response.data?.summary || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics summary');
    }
  }
);

export const fetchAnalyticsStats = createAsyncThunk(
  'analytics/fetchStats',
  async (period: string = '6m', { rejectWithValue }) => {
    try {
      const response = await analyticsAPI.getAnalyticsStats(period);
      // TransformInterceptor wraps in { success: true, data: ... }
      return response.data?.data || response.data?.stats || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch analytics stats');
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalyticsSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnalyticsSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchAnalyticsSummary.rejected, (state) => {
        state.isLoading = false;
        state.summary = null;
        state.error = null;
      });

    builder
      .addCase(fetchAnalyticsStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAnalyticsStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAnalyticsStats.rejected, (state) => {
        state.isLoading = false;
        state.stats = null;
        state.error = null;
      });
  },
});

export const { clearError } = analyticsSlice.actions;
export default analyticsSlice.reducer;

