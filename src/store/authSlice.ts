import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Profile } from "../types";
import type { RootState } from "./store";

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean; // vrai tant que la session initiale n'a pas été résolue
  authBusy: boolean; // vrai pendant un signIn/signUp en cours
  error: string | null;
}

const initialState: AuthState = {
  session: null,
  profile: null,
  loading: true,
  authBusy: false,
  error: null,
};

// Résout la session existante au démarrage de l'app (persistée via AsyncStorage)
export const bootstrapSession = createAsyncThunk("auth/bootstrap", async () => {
  const { data } = await supabase.auth.getSession();
  return data.session;
});

export const fetchProfile = createAsyncThunk("auth/fetchProfile", async (userId: string) => {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return data as Profile;
});

export const signIn = createAsyncThunk(
  "auth/signIn",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return rejectWithValue(error.message);
    return true;
  }
);

export const signUp = createAsyncThunk(
  "auth/signUp",
  async (
    { email, password, fullName }: { email: string; password: string; fullName: string },
    { rejectWithValue }
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return rejectWithValue(error.message);
    return true;
  }
);

export const signOut = createAsyncThunk("auth/signOut", async () => {
  await supabase.auth.signOut();
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Appelé par le listener supabase.auth.onAuthStateChange (voir store/AuthListener.tsx)
    sessionChanged(state, action: PayloadAction<Session | null>) {
      state.session = action.payload;
      state.loading = false;
      if (!action.payload) state.profile = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.session = action.payload;
        state.loading = false;
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(signIn.pending, (state) => {
        state.authBusy = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state) => {
        state.authBusy = false;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.authBusy = false;
        state.error = (action.payload as string) || "Connexion impossible.";
      })
      .addCase(signUp.pending, (state) => {
        state.authBusy = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state) => {
        state.authBusy = false;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.authBusy = false;
        state.error = (action.payload as string) || "Inscription impossible.";
      });
  },
});

export const { sessionChanged } = authSlice.actions;
export default authSlice.reducer;

// ---- sélecteurs ----
export const selectSession = (state: RootState): Session | null => state.auth.session;
export const selectUser = (state: RootState) => state.auth.session?.user ?? null;
export const selectAuthLoading = (state: RootState): boolean => state.auth.loading;
export const selectAuthBusy = (state: RootState): boolean => state.auth.authBusy;
export const selectProfile = (state: RootState): Profile | null => state.auth.profile;
export const selectDisplayName = (state: RootState): string => {
  const profile = state.auth.profile;
  const email = state.auth.session?.user?.email;
  return profile?.full_name || email?.split("@")[0] || "Citoyen";
};
export const selectInitials = (state: RootState): string =>
  selectDisplayName(state)
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
