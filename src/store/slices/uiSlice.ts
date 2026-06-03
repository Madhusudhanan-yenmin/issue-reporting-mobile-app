import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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
}

const initialState: UIState = {
  toasts: [],
  globalLoading: false,
  modalVisible: false,
  modalData: null,
};

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
});

export const { showToast, dismissToast, clearToasts, setGlobalLoading, openModal, closeModal } = uiSlice.actions;
export default uiSlice.reducer;
