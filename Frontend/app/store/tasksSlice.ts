import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { taskAPI } from '../services';

interface Task {
  _id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  assignedTo?: any;
  assignedBy?: any;
  projectId?: string;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TasksState {
  tasks: Task[];
  myTasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: TasksState = {
  tasks: [],
  myTasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
};

export const fetchTasks = createAsyncThunk(
  'tasks/fetchAll',
  async (params: { projectId?: string; status?: string; assignedTo?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await taskAPI.getAll(params);
      const data = response.data?.tasks || response.data?.data || response.data || [];
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tasks');
    }
  }
);

export const fetchMyTasks = createAsyncThunk(
  'tasks/fetchMyTasks',
  async (_, { rejectWithValue }) => {
    try {
      const response = await taskAPI.getMyTasks();
      const data = response.data?.tasks || response.data?.data || response.data || [];
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch my tasks');
    }
  }
);

export const fetchTaskById = createAsyncThunk(
  'tasks/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await taskAPI.getById(id);
      return response.data?.task || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch task');
    }
  }
);

export const createTask = createAsyncThunk(
  'tasks/create',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await taskAPI.create(data);
      return response.data?.task || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create task');
    }
  }
);

export const updateTask = createAsyncThunk(
  'tasks/update',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await taskAPI.update(id, data);
      return response.data?.task || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task');
    }
  }
);

export const updateTaskStatus = createAsyncThunk(
  'tasks/updateStatus',
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await taskAPI.updateStatus(id, status);
      return response.data?.task || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update task status');
    }
  }
);

export const deleteTask = createAsyncThunk(
  'tasks/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await taskAPI.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete task');
    }
  }
);

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchTasks.rejected, (state) => {
        state.isLoading = false;
        state.tasks = [];
        state.error = null;
      });

    builder
      .addCase(fetchMyTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myTasks = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchMyTasks.rejected, (state) => {
        state.isLoading = false;
        state.myTasks = [];
        state.error = null;
      });

    builder
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.currentTask = action.payload;
      });

    builder
      .addCase(createTask.fulfilled, (state, action) => {
        state.tasks.unshift(action.payload);
      });

    builder
      .addCase(updateTask.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        const myIndex = state.myTasks.findIndex((t) => t._id === action.payload._id);
        if (myIndex !== -1) {
          state.myTasks[myIndex] = action.payload;
        }
      });

    builder
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        const myIndex = state.myTasks.findIndex((t) => t._id === action.payload._id);
        if (myIndex !== -1) {
          state.myTasks[myIndex] = action.payload;
        }
      });

    builder
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t._id !== action.payload);
        state.myTasks = state.myTasks.filter((t) => t._id !== action.payload);
      });
  },
});

export const { clearError } = tasksSlice.actions;
export default tasksSlice.reducer;

