import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '../services';

interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  companyId?: string;
  orgId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean; // Separate state for initial auth check
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: false,
  error: null,
};

// Login
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      const user = response.data?.user;
      
      if (!user) {
        throw new Error('User data not found in response');
      }
      
      // Wait a bit to ensure cookies are set by the browser
      await new Promise(resolve => setTimeout(resolve, 200));
      
      return user;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

// Register
export const register = createAsyncThunk(
  'auth/register',
  async (data: { email: string; password: string; name: string; role?: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(data);
      const user = response.data?.user;
      
      if (!user) {
        throw new Error('User data not found in response');
      }
      
      return user;
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

// Fetch current user (for auth check)
export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getCurrentUser();
      const user = response.data;
      
      if (!user) {
        throw new Error('User data not found');
      }
      
      return user;
    } catch (error: any) {
      if (error.response?.status === 401) {
        return rejectWithValue('Not authenticated');
      }
      const message = error.response?.data?.message || 'Failed to fetch user';
      return rejectWithValue(message);
    }
  }
);

// Logout
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      return;
    } catch (error: any) {
      // Clear state even if API fails
      return;
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
    },
    resetLoading: (state) => {
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      });

    // Register
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.user = null;
      });

    // Fetch Me (for auth check - uses isInitializing)
    builder
      .addCase(fetchMe.pending, (state) => {
        state.isInitializing = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.isInitializing = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(fetchMe.rejected, (state) => {
        state.isInitializing = false;
        state.isAuthenticated = false;
        state.user = null;
        // Don't set error for fetchMe - it's normal when not logged in
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.isInitializing = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        // Clear state even if logout API fails
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.isInitializing = false;
      });
  },
});

export const { clearError, setUser, clearUser, resetLoading } = authSlice.actions;
export default authSlice.reducer;
