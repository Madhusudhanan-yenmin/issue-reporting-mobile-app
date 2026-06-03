import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'USER' | 'ADMIN' | 'OFFICER';
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isSessionLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  isSessionLoading: true,
};

// Thunk to load session from storage
export const loadSession = createAsyncThunk('auth/loadSession', async (_, thunkAPI) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const userJson = await AsyncStorage.getItem('user');
    if (token && userJson) {
      const user = JSON.parse(userJson) as User;
      return { token, user };
    }
    return null;
  } catch (err: any) {
    return thunkAPI.rejectWithValue('Failed to load session');
  }
});

// Thunk to register a new user
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData: any, thunkAPI) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Registration failed';
      return thunkAPI.rejectWithValue(Array.isArray(message) ? message[0] : message);
    }
  },
);

// Thunk to login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: any, thunkAPI) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { accessToken, user } = response.data;
      await AsyncStorage.setItem('token', accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      return { token: accessToken, user };
    } catch (err: any) {
      const message = err.response?.data?.message || 'Invalid credentials';
      return thunkAPI.rejectWithValue(Array.isArray(message) ? message[0] : message);
    }
  },
);

// Thunk to load profile details (optional fresh validation)
export const loadProfile = createAsyncThunk('auth/loadProfile', async (_, thunkAPI) => {
  try {
    const response = await api.get('/auth/profile');
    const user = response.data;
    await AsyncStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (err: any) {
    return thunkAPI.rejectWithValue('Session expired');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      AsyncStorage.removeItem('token');
      AsyncStorage.removeItem('user');
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // loadSession
      .addCase(loadSession.pending, (state) => {
        state.isSessionLoading = true;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.isSessionLoading = false;
        if (action.payload) {
          state.token = action.payload.token;
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
      })
      .addCase(loadSession.rejected, (state) => {
        state.isSessionLoading = false;
      })
      // registerUser
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // loginUser
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // loadProfile
      .addCase(loadProfile.fulfilled, (state, action) => {
        state.user = action.payload;
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
