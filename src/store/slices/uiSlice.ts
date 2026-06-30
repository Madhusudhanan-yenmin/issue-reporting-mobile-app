import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface UIState {
  toasts: Toast[];
  globalLoading: boolean;
  modalVisible: boolean;
  modalData: any;
  theme: 'light' | 'dark';
}

const initialState: UIState = {
  toasts: [],
  globalLoading: false,
  modalVisible: false,
  modalData: null,
  theme: 'dark',
};

// Async thunks to load and persist theme preference
export const loadPersistedTheme = createAsyncThunk('ui/loadPersistedTheme', async () => {
  try {
    const theme = await AsyncStorage.getItem('theme');
    return (theme === 'light' || theme === 'dark') ? theme : 'dark';
  } catch {
    return 'dark';
  }
});

export const toggleTheme = createAsyncThunk('ui/toggleTheme', async (_, { getState }) => {
  try {
    const state = getState() as any;
    const currentTheme = state.ui.theme;
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    await AsyncStorage.setItem('theme', nextTheme);
    return nextTheme;
  } catch {
    return 'dark';
  }
});

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    showToast(state, action: PayloadAction<Omit<Toast, 'id'>>) {
      const id = Date.now().toString();
      state.toasts.push({ id, ...action.payload });
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    clearToasts(state) {
      state.toasts = [];
    },
    setGlobalLoading(state, action: PayloadAction<boolean>) {
      state.globalLoading = action.payload;
    },
    openModal(state, action: PayloadAction<any>) {
      state.modalVisible = true;
      state.modalData = action.payload;
    },
    closeModal(state) {
      state.modalVisible = false;
      state.modalData = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadPersistedTheme.fulfilled, (state, action) => {
        state.theme = action.payload;
      })
      .addCase(toggleTheme.fulfilled, (state, action) => {
        state.theme = action.payload;
      });
  },
});

export const { showToast, dismissToast, clearToasts, setGlobalLoading, openModal, closeModal } = uiSlice.actions;
export default uiSlice.reducer;
