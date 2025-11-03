import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersAPI } from '../services';

interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  createdBy?: string; // Who created this user (Admin or Manager ID)
  managerId?: string; // For users: their manager reference
  createdAt?: string;
  updatedAt?: string;
}

interface UsersState {
  users: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: UsersState = {
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
};

export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (params: { page?: number; limit?: number; search?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getAll(params || {});
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user');
    }
  }
);

export const createUser = createAsyncThunk(
  'users/create',
  async (data: any, { rejectWithValue }) => {
    try {
      const response = await usersAPI.create(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create user');
    }
  }
);

export const createUserByAdmin = createAsyncThunk(
  'users/createByAdmin',
  async (data: { name: string; email: string; password: string; role: string; managerId?: string }, { rejectWithValue }) => {
    try {
      const response = await usersAPI.createByAdmin(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create user');
    }
  }
);

export const createUserByManager = createAsyncThunk(
  'users/createByManager',
  async (data: { name: string; email: string; password: string; department?: string; location?: string }, { rejectWithValue }) => {
    try {
      const response = await usersAPI.createByManager(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create user');
    }
  }
);

export const fetchMyUsers = createAsyncThunk(
  'users/fetchMyUsers',
  async (params: { page?: number; limit?: number; search?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await usersAPI.getMyUsers(params || {});
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/update',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await usersAPI.update(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await usersAPI.delete(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Users
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle both response formats and ensure it's always an array
        const users = action.payload?.data || action.payload || [];
        state.users = Array.isArray(users) ? users : [];
        if (action.payload?.pagination) {
          state.pagination = action.payload.pagination;
        } else {
          // Reset pagination if not provided
          state.pagination = {
            page: 1,
            limit: state.users.length || 10,
            total: state.users.length,
          };
        }
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        // Always suppress errors and show empty state instead
        // This ensures the UI always renders with all cards visible
        state.users = [];
        state.error = null; // Never show errors - always use empty state
      });

    // Fetch User by ID
    builder
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create User
    builder
      .addCase(createUser.fulfilled, (state, action) => {
        state.users.unshift(action.payload);
      })
      .addCase(createUserByAdmin.fulfilled, (state, action) => {
        state.users.unshift(action.payload);
      })
      .addCase(createUserByManager.fulfilled, (state, action) => {
        state.users.unshift(action.payload);
      });

    // Fetch My Users (Manager)
    builder
      .addCase(fetchMyUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        const users = action.payload?.data || action.payload || [];
        state.users = Array.isArray(users) ? users : [];
        if (action.payload?.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchMyUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.users = [];
        state.error = null;
      });

    // Update User
    builder
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
      });

    // Delete User
    builder
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u._id !== action.payload);
      });
  },
});

export const { clearError } = usersSlice.actions;
export default usersSlice.reducer;