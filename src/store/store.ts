import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import reportsReducer from "./reportsSlice";
import toastReducer from "./toastSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    reports: reportsReducer,
    toast: toastReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // La session Supabase contient des objets non sérialisables (dates, etc.) :
      // on désactive la vérification stricte pour ce seul slice plutôt que globalement.
      serializableCheck: {
        ignoredPaths: ["auth.session"],
        ignoredActionPaths: ["payload"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
