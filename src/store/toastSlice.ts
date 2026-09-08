import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "./store";

interface ToastState {
  message: string | null;
  id: number;
}

const initialState: ToastState = { message: null, id: 0 };

const toastSlice = createSlice({
  name: "toast",
  initialState,
  reducers: {
    showToast(state, action: PayloadAction<string>) {
      state.message = action.payload;
      state.id += 1; // permet de redéclencher l'animation même pour un message identique
    },
    hideToast(state) {
      state.message = null;
    },
  },
});

export const { showToast, hideToast } = toastSlice.actions;
export default toastSlice.reducer;

export const selectToast = (state: RootState): ToastState => state.toast;
