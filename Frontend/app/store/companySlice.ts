import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { companyAPI } from '../services';

interface Company {
  _id: string;
  name: string;
  domain?: string;
  createdBy: string;
  managers: string[];
  users: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface CompanyState {
  companies: Company[];
  currentCompany: Company | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: CompanyState = {
  companies: [],
  currentCompany: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
};

export const fetchCompanies = createAsyncThunk(
  'company/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await companyAPI.getAll();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch companies');
    }
  }
);

export const fetchCompanyById = createAsyncThunk(
  'company/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await companyAPI.getById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch company');
    }
  }
);

export const createCompany = createAsyncThunk(
  'company/create',
  async (companyData: {
    name: string;
    domain?: string;
    companyAdminEmail: string;
    companyAdminName: string;
    companyAdminPassword: string;
  }, { rejectWithValue }) => {
    try {
      const response = await companyAPI.create(companyData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create company');
    }
  }
);

export const fetchCompanyUsers = createAsyncThunk(
  'company/fetchUsers',
  async ({ companyId, params }: { companyId: string; params?: { page?: number; limit?: number; search?: string } }, { rejectWithValue }) => {
    try {
      const response = await companyAPI.getCompanyUsers(companyId, params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch company users');
    }
  }
);

export const registerCompany = createAsyncThunk(
  'company/register',
  async (data: {
    companyName: string;
    domain?: string;
    adminName: string;
    email: string;
    password: string;
  }, { rejectWithValue }) => {
    try {
      const response = await companyAPI.register(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to register company');
    }
  }
);

const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentCompany: (state, action: PayloadAction<Company | null>) => {
      state.currentCompany = action.payload;
    },
    clearCompanies: (state) => {
      state.companies = [];
      state.currentCompany = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Companies
    builder
      .addCase(fetchCompanies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.isLoading = false;
        state.companies = Array.isArray(action.payload) ? action.payload : action.payload?.data || [];
        if (action.payload?.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Company By ID
    builder
      .addCase(fetchCompanyById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompanyById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCompany = action.payload;
      })
      .addCase(fetchCompanyById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create Company
    builder
      .addCase(createCompany.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload?.company) {
          state.companies.push(action.payload.company);
        }
      })
      .addCase(createCompany.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Company Users
    builder
      .addCase(fetchCompanyUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompanyUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        // Company users are typically handled separately, not stored in company slice
      })
      .addCase(fetchCompanyUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Register Company
    builder
      .addCase(registerCompany.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerCompany.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload?.company) {
          state.currentCompany = action.payload.company;
          state.companies.push(action.payload.company);
        }
        state.error = null;
      })
      .addCase(registerCompany.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentCompany, clearCompanies } = companySlice.actions;
export default companySlice.reducer;

