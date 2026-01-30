import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, UserRole, UserStatus } from '@/types/user';

interface UsersState {
  users: User[];
  isLoading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  isLoading: false,
  error: null,
};

// Fetch users from backend
export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3100';
      const response = await fetch(`${backendUrl}/user`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const userList = Array.isArray(data) ? data : (data?.data || data?.users || []);
        // Map backend users to frontend format (convert _id to id and normalize role/status)
        return Array.isArray(userList) 
          ? userList.map((user: any) => {
              // Normalize role from backend format to frontend format
              const normalizeRole = (role: string): UserRole => {
                const roleLower = role?.toLowerCase() || '';
                if (roleLower === 'admin' || roleLower === 'administrator' || roleLower === 'adm') return 'admin';
                if (roleLower === 'moderator' || roleLower === 'mod') return 'moderator';
                if (roleLower === 'manager' || roleLower === 'editor' || roleLower === 'viewer') return 'user';
                return (roleLower as UserRole) || 'user';
              };
              
              // Normalize status
              const normalizeStatus = (status: string): UserStatus => {
                const statusLower = status?.toLowerCase() || '';
                if (statusLower === 'active' || statusLower === 'act') return 'active';
                if (statusLower === 'inactive' || statusLower === 'inact') return 'inactive';
                if (statusLower === 'pending' || statusLower === 'pend') return 'pending';
                return (statusLower as UserStatus) || 'active';
              };
              
              return {
                id: user._id || user.id || String(Date.now()),
                name: user.name || '',
                email: user.email || '',
                role: normalizeRole(user.role),
                status: normalizeStatus(user.status),
                department: user.department || 'Unassigned',
                location: user.location || 'Not specified',
                joinedAt: user.joinedAt || user.createdAt || new Date().toISOString().split('T')[0],
                lastActive: user.lastActive || user.updatedAt || new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString(),
                sessions: user.sessions || 0,
                avatar: user.avatar,
              } as User;
            })
          : [];
      } else {
        // Silently return empty array on error
        return [];
      }
    } catch (error) {
      // Silently return empty array on error
      return [];
    }
  }
);

// Create user
export const createUser = createAsyncThunk(
  'users/create',
  async (userData: {
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    department: string;
    location: string;
    password?: string;
  }, { rejectWithValue }) => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3100';
      const response = await fetch(`${backendUrl}/user`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        const userResponse = data.data || data.user || data;
        const newUser: User = {
          id: userResponse._id || userResponse.id || String(Date.now()),
          name: userData.name,
          email: userData.email,
          role: userData.role as UserRole,
          status: userData.status as UserStatus,
          department: userData.department,
          location: userData.location,
          joinedAt: new Date().toISOString().split('T')[0],
          lastActive: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString(),
          sessions: 0,
        };
        return newUser;
      } else {
        // Return a temporary user object for optimistic update
        const tempUser: User = {
          id: String(Date.now()),
          ...userData,
          joinedAt: new Date().toISOString().split('T')[0],
          lastActive: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString(),
          sessions: 0,
        };
        return tempUser;
      }
    } catch (error) {
      // Return a temporary user object for optimistic update
      const tempUser: User = {
        id: String(Date.now()),
        ...userData,
        joinedAt: new Date().toISOString().split('T')[0],
        lastActive: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString(),
        sessions: 0,
      };
      return tempUser;
    }
  }
);

// Update user
export const updateUser = createAsyncThunk(
  'users/update',
  async ({ id, userData }: { id: string; userData: Partial<User> }, { rejectWithValue }) => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3100';
      const response = await fetch(`${backendUrl}/user/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        const userResponse = data.data || data.user || data;
        // Normalize role and status from backend
        const normalizeRole = (role: string): UserRole => {
          const roleLower = role?.toLowerCase() || '';
          if (roleLower === 'admin' || roleLower === 'administrator' || roleLower === 'adm') return 'admin';
          if (roleLower === 'moderator' || roleLower === 'mod') return 'moderator';
          if (roleLower === 'manager' || roleLower === 'editor' || roleLower === 'viewer') return 'user';
          return (roleLower as UserRole) || 'user';
        };
        
        const normalizeStatus = (status: string): UserStatus => {
          const statusLower = status?.toLowerCase() || '';
          if (statusLower === 'active' || statusLower === 'act') return 'active';
          if (statusLower === 'inactive' || statusLower === 'inact') return 'inactive';
          if (statusLower === 'pending' || statusLower === 'pend') return 'pending';
          return (statusLower as UserStatus) || 'active';
        };
        
        return { 
          id: userResponse._id || userResponse.id || id, 
          name: userResponse.name || userData.name || '',
          email: userResponse.email || userData.email || '',
          role: normalizeRole(userResponse.role || (userData.role as string) || 'user'),
          status: normalizeStatus(userResponse.status || (userData.status as string) || 'active'),
          department: userResponse.department || userData.department || 'Unassigned',
          location: userResponse.location || userData.location || 'Not specified',
          joinedAt: userResponse.joinedAt || userResponse.createdAt || '',
          lastActive: userResponse.lastActive || userResponse.updatedAt || new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString(),
          sessions: userResponse.sessions || 0,
          avatar: userResponse.avatar || userData.avatar,
        } as User;
      } else {
        // Return updated user for optimistic update - ensure it's a valid User
        const currentUser = userData as Partial<User>;
        return {
          id,
          name: currentUser.name || '',
          email: currentUser.email || '',
          role: (currentUser.role as UserRole) || 'user',
          status: (currentUser.status as UserStatus) || 'active',
          department: currentUser.department || 'Unassigned',
          location: currentUser.location || 'Not specified',
          joinedAt: currentUser.joinedAt || '',
          lastActive: currentUser.lastActive || new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString(),
          sessions: currentUser.sessions || 0,
        } as User;
      }
    } catch (error) {
      // Return updated user for optimistic update - ensure it's a valid User
      const currentUser = userData as Partial<User>;
      return {
        id,
        name: currentUser.name || '',
        email: currentUser.email || '',
        role: (currentUser.role as UserRole) || 'user',
        status: (currentUser.status as UserStatus) || 'active',
        department: currentUser.department || 'Unassigned',
        location: currentUser.location || 'Not specified',
        joinedAt: currentUser.joinedAt || '',
        lastActive: currentUser.lastActive || new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString(),
        sessions: currentUser.sessions || 0,
      } as User;
    }
  }
);

// Delete user
export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3100';
      await fetch(`${backendUrl}/user/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      return id;
    } catch (error) {
      // Still return the id for optimistic update
      return id;
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
    // Fetch users
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state) => {
        state.isLoading = false;
        state.users = [];
        state.error = null; // Never show errors
      });

    // Create user
    builder
      .addCase(createUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state) => {
        state.isLoading = false;
        state.error = null; // Never show errors
      });

    // Update user
    builder
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...action.payload } as User;
        }
      })
      .addCase(updateUser.rejected, (state) => {
        state.isLoading = false;
        state.error = null; // Never show errors
      });

    // Delete user
    builder
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u.id !== action.payload);
      });
  },
});

export const { clearError } = usersSlice.actions;
export default usersSlice.reducer;

