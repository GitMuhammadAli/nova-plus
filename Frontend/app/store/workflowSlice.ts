import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { workflowAPI } from '../services';

interface Workflow {
  _id: string;
  name: string;
  description?: string;
  status: string;
  nodes: any[];
  connections: any[];
  lastRun?: string;
  runCount: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface WorkflowState {
  workflows: Workflow[];
  currentWorkflow: Workflow | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: WorkflowState = {
  workflows: [],
  currentWorkflow: null,
  isLoading: false,
  error: null,
};

export const fetchWorkflows = createAsyncThunk(
  'workflow/fetchAll',
  async (params: { status?: string; search?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await workflowAPI.getAll(params);
      const data = response.data?.workflows || response.data?.data || response.data || [];
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch workflows');
    }
  }
);

export const fetchWorkflowById = createAsyncThunk(
  'workflow/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await workflowAPI.getById(id);
      return response.data?.workflow || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch workflow');
    }
  }
);

export const createWorkflow = createAsyncThunk(
  'workflow/create',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await workflowAPI.create(data);
      return response.data?.workflow || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create workflow');
    }
  }
);

export const updateWorkflow = createAsyncThunk(
  'workflow/update',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await workflowAPI.update(id, data);
      return response.data?.workflow || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update workflow');
    }
  }
);

export const deleteWorkflow = createAsyncThunk(
  'workflow/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await workflowAPI.remove(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete workflow');
    }
  }
);

export const toggleWorkflowStatus = createAsyncThunk(
  'workflow/toggleStatus',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await workflowAPI.toggleStatus(id);
      return response.data?.workflow || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle workflow status');
    }
  }
);

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkflows.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkflows.fulfilled, (state, action) => {
        state.isLoading = false;
        state.workflows = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchWorkflows.rejected, (state) => {
        state.isLoading = false;
        state.workflows = [];
        state.error = null;
      });

    builder
      .addCase(fetchWorkflowById.fulfilled, (state, action) => {
        state.currentWorkflow = action.payload;
      });

    builder
      .addCase(createWorkflow.fulfilled, (state, action) => {
        state.workflows.unshift(action.payload);
      });

    builder
      .addCase(updateWorkflow.fulfilled, (state, action) => {
        const index = state.workflows.findIndex((w) => w._id === action.payload._id);
        if (index !== -1) {
          state.workflows[index] = action.payload;
        }
      });

    builder
      .addCase(deleteWorkflow.fulfilled, (state, action) => {
        state.workflows = state.workflows.filter((w) => w._id !== action.payload);
      });

    builder
      .addCase(toggleWorkflowStatus.fulfilled, (state, action) => {
        const index = state.workflows.findIndex((w) => w._id === action.payload._id);
        if (index !== -1) {
          state.workflows[index] = action.payload;
        }
      });
  },
});

export const { clearError } = workflowSlice.actions;
export default workflowSlice.reducer;

