import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface Issue {
  _id: string;
  ticketId: string;
  title: string;
  description: string;
  category: 'ROAD' | 'WATER' | 'ELECTRICITY' | 'GARBAGE' | 'DRAINAGE' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'REOPENED' | 'CLOSED';
  location: string;
  images: string[];
  userId: any;
  officerId: any;
  resolutionNotes?: string;
  resolutionImages?: string[];
  voiceUrl?: string;
  videoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  _id: string;
  issueId: string;
  action: string;
  performedBy: {
    _id: string;
    name: string;
    role: string;
  };
  createdAt: string;
}

interface IssueState {
  issues: Issue[];
  total: number;
  page: number;
  limit: number;
  selectedIssue: Issue | null;
  activities: Activity[];
  loading: boolean;
  error: string | null;
}

const initialState: IssueState = {
  issues: [],
  total: 0,
  page: 1,
  limit: 10,
  selectedIssue: null,
  activities: [],
  loading: false,
  error: null,
};

// Fetch issues with pagination and filters
export const fetchIssues = createAsyncThunk(
  'issue/fetchIssues',
  async (
    filters: { page?: number; limit?: number; search?: string; status?: string; category?: string } | undefined,
    thunkAPI,
  ) => {
    try {
      const response = await api.get('/issues', { params: filters });
      return response.data; // { data: Issue[], total: number, page: number, limit: number }
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to fetch issues');
    }
  },
);

// Fetch detailed issue by ID
export const fetchIssueById = createAsyncThunk(
  'issue/fetchIssueById',
  async (id: string, thunkAPI) => {
    try {
      const response = await api.get(`/issues/${id}`);
      return response.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to load issue details');
    }
  },
);

// Create new issue
export const createIssue = createAsyncThunk(
  'issue/createIssue',
  async (issueData: any, thunkAPI) => {
    try {
      const response = await api.post('/issues', issueData);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to file issue';
      return thunkAPI.rejectWithValue(Array.isArray(message) ? message[0] : message);
    }
  },
);

// Assign officer
export const assignOfficer = createAsyncThunk(
  'issue/assignOfficer',
  async ({ id, officerId }: { id: string; officerId: string }, thunkAPI) => {
    try {
      const response = await api.patch(`/issues/${id}/assign`, { officerId });
      return response.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to assign officer');
    }
  },
);

// Update Priority
export const updatePriority = createAsyncThunk(
  'issue/updatePriority',
  async ({ id, priority }: { id: string; priority: string }, thunkAPI) => {
    try {
      const response = await api.patch(`/issues/${id}/priority`, { priority });
      return response.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to update priority');
    }
  },
);

// Update Status
export const updateStatus = createAsyncThunk(
  'issue/updateStatus',
  async (
    {
      id,
      status,
      resolutionNotes,
      resolutionImages,
    }: { id: string; status: string; resolutionNotes?: string; resolutionImages?: string[] },
    thunkAPI,
  ) => {
    try {
      const response = await api.patch(`/issues/${id}/status`, {
        status,
        resolutionNotes,
        resolutionImages,
      });
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to transition status';
      return thunkAPI.rejectWithValue(Array.isArray(message) ? message[0] : message);
    }
  },
);

// Fetch activities timeline
export const fetchActivities = createAsyncThunk(
  'issue/fetchActivities',
  async (id: string, thunkAPI) => {
    try {
      const response = await api.get(`/issues/${id}/activities`);
      return response.data;
    } catch (err: any) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to load timeline logs');
    }
  },
);

const issueSlice = createSlice({
  name: 'issue',
  initialState,
  reducers: {
    clearIssueError(state) {
      state.error = null;
    },
    clearSelectedIssue(state) {
      state.selectedIssue = null;
      state.activities = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchIssues
      .addCase(fetchIssues.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIssues.fulfilled, (state, action) => {
        state.loading = false;
        state.issues = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchIssues.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchIssueById
      .addCase(fetchIssueById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchIssueById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedIssue = action.payload;
      })
      .addCase(fetchIssueById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // createIssue
      .addCase(createIssue.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createIssue.fulfilled, (state, action) => {
        state.loading = false;
        state.issues.unshift(action.payload);
      })
      .addCase(createIssue.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // assignOfficer
      .addCase(assignOfficer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(assignOfficer.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedIssue = action.payload;
        // Update item in list
        const index = state.issues.findIndex((i) => i._id === action.payload._id);
        if (index !== -1) {
          state.issues[index] = action.payload;
        }
      })
      .addCase(assignOfficer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // updatePriority
      .addCase(updatePriority.fulfilled, (state, action) => {
        state.selectedIssue = action.payload;
        const index = state.issues.findIndex((i) => i._id === action.payload._id);
        if (index !== -1) {
          state.issues[index] = action.payload;
        }
      })
      // updateStatus
      .addCase(updateStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedIssue = action.payload;
        const index = state.issues.findIndex((i) => i._id === action.payload._id);
        if (index !== -1) {
          state.issues[index] = action.payload;
        }
      })
      .addCase(updateStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // fetchActivities
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.activities = action.payload;
      });
  },
});

export const { clearIssueError, clearSelectedIssue } = issueSlice.actions;
export default issueSlice.reducer;
