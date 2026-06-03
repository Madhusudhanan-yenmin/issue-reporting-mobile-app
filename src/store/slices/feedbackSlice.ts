import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface Feedback {
  _id: string;
  issueId: string;
  rating: number;
  comment?: string;
  userId: string;
  createdAt: string;
}

interface FeedbackState {
  feedback: Feedback | null;
  loading: boolean;
  error: string | null;
  submitted: boolean;
}

const initialState: FeedbackState = {
  feedback: null,
  loading: false,
  error: null,
  submitted: false,
};

export const submitFeedback = createAsyncThunk(
  'feedback/submitFeedback',
  async ({ issueId, rating, comment }: { issueId: string; rating: number; comment?: string }, thunkAPI) => {
    try {
      const response = await api.post('/feedback', { issueId, rating, comment });
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to submit feedback';
      return thunkAPI.rejectWithValue(Array.isArray(message) ? message[0] : message);
    }
  },
);

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    clearFeedback(state) {
      state.feedback = null;
      state.error = null;
      state.submitted = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitFeedback.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.submitted = false;
      })
      .addCase(submitFeedback.fulfilled, (state, action) => {
        state.loading = false;
        state.feedback = action.payload;
        state.submitted = true;
      })
      .addCase(submitFeedback.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearFeedback } = feedbackSlice.actions;
export default feedbackSlice.reducer;
