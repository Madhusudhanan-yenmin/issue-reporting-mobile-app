import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export interface Comment {
  _id: string;
  issueId: string;
  text: string;
  author: {
    _id: string;
    name: string;
    role: string;
  };
  createdAt: string;
}

interface CommentState {
  comments: Comment[];
  loading: boolean;
  error: string | null;
}

const initialState: CommentState = {
  comments: [],
  loading: false,
  error: null,
};

export const fetchComments = createAsyncThunk(
  'comment/fetchComments',
  async (issueId: string, thunkAPI) => {
    try {
      const response = await api.get(`/comments/${issueId}`);
      return response.data.map((data: any) => ({
        _id: data._id,
        issueId: data.issueId,
        text: data.message,
        author: data.userId && typeof data.userId === 'object' ? {
          _id: data.userId._id,
          name: data.userId.name,
          role: data.userId.role,
        } : { _id: '', name: 'Anonymous', role: 'USER' },
        createdAt: data.createdAt,
      }));
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to load comments';
      return thunkAPI.rejectWithValue(Array.isArray(message) ? message[0] : message);
    }
  },
);

export const postComment = createAsyncThunk(
  'comment/postComment',
  async ({ issueId, text }: { issueId: string; text: string }, thunkAPI) => {
    try {
      const response = await api.post('/comments', { issueId, message: text });
      const data = response.data;
      return {
        _id: data._id,
        issueId: data.issueId,
        text: data.message,
        author: data.userId && typeof data.userId === 'object' ? {
          _id: data.userId._id,
          name: data.userId.name,
          role: data.userId.role,
        } : { _id: '', name: 'Anonymous', role: 'USER' },
        createdAt: data.createdAt,
      };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to post comment';
      return thunkAPI.rejectWithValue(Array.isArray(message) ? message[0] : message);
    }
  },
);

const commentSlice = createSlice({
  name: 'comment',
  initialState,
  reducers: {
    clearComments(state) {
      state.comments = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchComments
      .addCase(fetchComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loading = false;
        state.comments = action.payload;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // postComment
      .addCase(postComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postComment.fulfilled, (state, action) => {
        state.loading = false;
        state.comments.push(action.payload);
      })
      .addCase(postComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearComments } = commentSlice.actions;
export default commentSlice.reducer;
