import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectAPI } from '../services';

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: string;
  assignedTo?: any;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
};

export const fetchProjects = createAsyncThunk(
  'projects/fetchAll',
  async (params: { status?: string; assignedTo?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await projectAPI.findAll(params);
      const data = response.data?.projects || response.data?.data || response.data || [];
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch projects');
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await projectAPI.getById(id);
      return response.data?.project || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch project');
    }
  }
);

export const createProject = createAsyncThunk(
  'projects/create',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await projectAPI.create(data);
      return response.data?.project || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create project');
    }
  }
);

export const updateProject = createAsyncThunk(
  'projects/update',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await projectAPI.update(id, data);
      return response.data?.project || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update project');
    }
  }
);

export const deleteProject = createAsyncThunk(
  'projects/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await projectAPI.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete project');
    }
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchProjects.rejected, (state) => {
        state.isLoading = false;
        state.projects = [];
        state.error = null;
      });

    builder
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.currentProject = action.payload;
      });

    builder
      .addCase(createProject.fulfilled, (state, action) => {
        state.projects.unshift(action.payload);
      });

    builder
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) {
          state.projects[index] = action.payload;
        }
      });

    builder
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter((p) => p._id !== action.payload);
      });
  },
});

export const { clearError } = projectsSlice.actions;
export default projectsSlice.reducer;

