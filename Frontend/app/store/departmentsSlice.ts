import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { departmentAPI } from '../services';

interface Department {
  _id: string;
  name: string;
  description?: string;
  managerId?: any;
  members?: any[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface DepartmentsState {
  departments: Department[];
  currentDepartment: Department | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DepartmentsState = {
  departments: [],
  currentDepartment: null,
  isLoading: false,
  error: null,
};

export const fetchDepartments = createAsyncThunk(
  'departments/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await departmentAPI.getAll();
      const data = response.data?.departments || response.data?.data || response.data || [];
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch departments');
    }
  }
);

export const fetchDepartmentById = createAsyncThunk(
  'departments/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await departmentAPI.getById(id);
      return response.data?.department || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch department');
    }
  }
);

export const createDepartment = createAsyncThunk(
  'departments/create',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await departmentAPI.create(data);
      return response.data?.department || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create department');
    }
  }
);

export const updateDepartment = createAsyncThunk(
  'departments/update',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await departmentAPI.update(id, data);
      return response.data?.department || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update department');
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  'departments/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await departmentAPI.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete department');
    }
  }
);

const departmentsSlice = createSlice({
  name: 'departments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.departments = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchDepartments.rejected, (state) => {
        state.isLoading = false;
        state.departments = [];
        state.error = null;
      });

    builder
      .addCase(fetchDepartmentById.fulfilled, (state, action) => {
        state.currentDepartment = action.payload;
      });

    builder
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.departments.unshift(action.payload);
      });

    builder
      .addCase(updateDepartment.fulfilled, (state, action) => {
        const index = state.departments.findIndex((d) => d._id === action.payload._id);
        if (index !== -1) {
          state.departments[index] = action.payload;
        }
      });

    builder
      .addCase(deleteDepartment.fulfilled, (state, action) => {
        state.departments = state.departments.filter((d) => d._id !== action.payload);
      });
  },
});

export const { clearError } = departmentsSlice.actions;
export default departmentsSlice.reducer;

