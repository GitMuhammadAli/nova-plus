import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '../services';

interface User {
  _id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      console.log('🔵 Calling API login with:', credentials.email);
      
      const response = await authAPI.login(credentials);
      
      console.log('🟢 API response:', response.data);
      
      // Backend wraps response: {success: true, data: {user: {...}}}
      // Handle all possible structures
      const user = response.data?.data?.user || response.data?.user || response.data;
      
      console.log('✅ User extracted:', user);
      
      return user;
    } catch (error: any) {
      console.log('🔴 Login error:', error);
      console.log('🔴 Error response:', error.response?.data);
      
      const message = error.response?.data?.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (data: { email: string; password: string; name: string; role?: string }, { rejectWithValue }) => {
    try {
      console.log('🔵 Calling API register with:', data.email);
      
      const response = await authAPI.register(data);
      
      console.log('🟢 API response:', response.data);
      
      // Backend wraps response: {success: true, data: {user: {...}}}
      const user = response.data?.data?.user || response.data?.user || response.data;
      
      console.log('✅ User extracted:', user);
      
      return user;
    } catch (error: any) {
      console.log('🔴 Register error:', error);
      
      const message = error.response?.data?.message || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔵 Calling /auth/me...');
      
      const response = await authAPI.getCurrentUser();
      
      console.log('✅ /auth/me success:', response.data);
      
      // Backend returns user directly (not wrapped in data)
      return response.data;
    } catch (error: any) {
      console.log('🔴 /auth/me failed:', error.response?.status);
      
      // Don't show error message for 401 (just means not logged in)
      if (error.response?.status === 401) {
        return rejectWithValue('Not authenticated');
      }
      
      const message = error.response?.data?.message || 'Failed to fetch user';
      return rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      // Cookies are cleared by backend
      return;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Logout failed';
      return rejectWithValue(message);
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
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
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
      });

    // Fetch Me
    builder
      .addCase(fetchMe.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.isLoading = false;
        // Don't set error for fetchMe - it's normal to fail when not logged in
        state.isAuthenticated = false;
        state.user = null;
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        // Clear state even if logout API fails
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      });
  },
});

export const { clearError, setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;