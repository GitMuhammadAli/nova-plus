import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { inviteAPI, companyAPI } from '../services';

interface Invite {
  _id: string;
  token: string;
  email?: string;
  role: string;
  isUsed: boolean;
  isActive: boolean;
  usedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  usedAt?: string;
  expiresAt: string;
  createdAt: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  inviteLink?: string;
}

interface InvitesState {
  invites: Invite[];
  isLoading: boolean;
  error: string | null;
}

const initialState: InvitesState = {
  invites: [],
  isLoading: false,
  error: null,
};

// Fetch company invites
export const fetchCompanyInvites = createAsyncThunk(
  'invites/fetchCompanyInvites',
  async (companyId: string, { rejectWithValue }) => {
    try {
      const response = await inviteAPI.getCompanyInvites(companyId);
      // TransformInterceptor wraps in { success: true, data: [...] }
      // Handle different response structures
      const invites = Array.isArray(response.data?.data)
        ? response.data.data
        : Array.isArray(response.data?.invites)
        ? response.data.invites
        : Array.isArray(response.data)
        ? response.data
        : Array.isArray(response)
        ? response
        : [];
      console.log('Fetched invites:', invites.length, invites);
      return invites;
    } catch (error: any) {
      console.error('Failed to fetch invites:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch invites');
    }
  }
);

// Create invite
export const createInvite = createAsyncThunk(
  'invites/createInvite',
  async (
    data: { email?: string; role: string; expiresInDays?: number; companyId?: string },
    { rejectWithValue, getState }
  ) => {
    try {
      // Get companyId from state if not provided
      const state = getState() as any;
      const companyId = data.companyId || state?.auth?.user?.companyId;
      
      if (!companyId) {
        return rejectWithValue('Company ID is required');
      }
      
      const response = await inviteAPI.createInvite(
        { email: data.email, role: data.role, expiresInDays: data.expiresInDays },
        companyId
      );
      // TransformInterceptor wraps in { success: true, data: { invite, inviteLink } }
      return response.data?.data || response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create invite');
    }
  }
);

// Revoke invite
export const revokeInvite = createAsyncThunk(
  'invites/revokeInvite',
  async (
    { inviteId, companyId }: { inviteId: string; companyId: string },
    { rejectWithValue }
  ) => {
    try {
      await inviteAPI.revokeInvite(inviteId, companyId);
      return inviteId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to revoke invite');
    }
  }
);

// Resend invite
export const resendInvite = createAsyncThunk(
  'invites/resendInvite',
  async (inviteId: string, { rejectWithValue }) => {
    try {
      const response = await inviteAPI.resendInvite(inviteId);
      return { inviteId, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to resend invite');
    }
  }
);

// Cancel invite
export const cancelInvite = createAsyncThunk(
  'invites/cancelInvite',
  async (inviteId: string, { rejectWithValue }) => {
    try {
      const response = await inviteAPI.cancelInvite(inviteId);
      return inviteId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel invite');
    }
  }
);

// Bulk create invites
export const bulkCreateInvites = createAsyncThunk(
  'invites/bulkCreateInvites',
  async (
    data: { companyId: string; invites: Array<{ email?: string; role: string; expiresInDays?: number }> },
    { rejectWithValue }
  ) => {
    try {
      const response = await inviteAPI.bulkCreateInvites(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to bulk create invites');
    }
  }
);

const invitesSlice = createSlice({
  name: 'invites',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch invites
    builder
      .addCase(fetchCompanyInvites.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompanyInvites.fulfilled, (state, action) => {
        state.isLoading = false;
        // Ensure payload is always an array
        state.invites = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchCompanyInvites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create invite
    builder
      .addCase(createInvite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createInvite.fulfilled, (state, action) => {
        state.isLoading = false;
        // Refresh invites list instead of manually adding
        // The component will refetch after creation
      })
      .addCase(createInvite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Revoke invite
    builder
      .addCase(revokeInvite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(revokeInvite.fulfilled, (state, action) => {
        state.isLoading = false;
        // Mark invite as inactive instead of removing (for history)
        const invitesArray = Array.isArray(state.invites) ? state.invites : [];
        state.invites = invitesArray.map((invite) => 
          invite._id === action.payload 
            ? { ...invite, isActive: false }
            : invite
        );
      })
      .addCase(revokeInvite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Resend invite
    builder
      .addCase(resendInvite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendInvite.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(resendInvite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Cancel invite
    builder
      .addCase(cancelInvite.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelInvite.fulfilled, (state, action) => {
        state.isLoading = false;
        const invitesArray = Array.isArray(state.invites) ? state.invites : [];
        state.invites = invitesArray.map((invite) =>
          invite._id === action.payload
            ? { ...invite, isActive: false }
            : invite
        );
      })
      .addCase(cancelInvite.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Bulk create invites
    builder
      .addCase(bulkCreateInvites.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(bulkCreateInvites.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(bulkCreateInvites.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = invitesSlice.actions;
export default invitesSlice.reducer;

