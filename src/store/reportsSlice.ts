import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { supabase } from "../lib/supabase";
import { typeLabel } from "../constants/categories";
import type { Report, ReportDraft, ReportRow, ReportStatus } from "../types";
import type { RootState } from "./store";

const emptyDraft: ReportDraft = {
  categoryId: null,
  type: "",
  address: "Avenue Habib Bourguiba, Tunis",
  title: "",
  description: "",
  photos: [], // uris locales choisies avec expo-image-picker
  video: null, // uri locale de la vidéo capturée avec la caméra
};

interface ReportsState {
  items: Report[];
  loading: boolean;
  error: string | null;
  draft: ReportDraft;
}

const initialState: ReportsState = {
  items: [],
  loading: false,
  error: null,
  draft: emptyDraft,
};

function mapRow(row: ReportRow): Report {
  return {
    id: row.id,
    reference: row.reference,
    title: row.title,
    type_label: typeLabel(row.type_value),
    description: row.description,
    address: row.address,
    status: row.status,
    rejection_reason: row.rejection_reason,
    date: new Date(row.created_at).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    image_url: row.report_images?.[0]
      ? supabase.storage.from("report-media").getPublicUrl(row.report_images[0].storage_path).data.publicUrl
      : null,
    video_url: row.report_videos?.[0]
      ? supabase.storage.from("report-media").getPublicUrl(row.report_videos[0].storage_path).data.publicUrl
      : null,
  };
}

export const fetchReports = createAsyncThunk<Report[], void, { state: RootState; rejectValue: string }>(
  "reports/fetch",
  async (_, { getState, rejectWithValue }) => {
    const user = getState().auth.session?.user;
    if (!user) return [];
    const { data, error } = await supabase
      .from("reports")
      .select("*, report_images(storage_path), report_videos(storage_path)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) return rejectWithValue(error.message);

    return (data as ReportRow[] | null)?.map(mapRow) ?? [];
  }
);

const uploadPhoto = async (userId: string, reportId: string, localUri: string) => {
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const path = `${userId}/${reportId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from("report-media")
    .upload(path, decode(base64), { contentType: "image/jpeg" });
  if (error) throw error;
  await supabase.from("report_images").insert({ report_id: reportId, storage_path: path });
};

const uploadVideo = async (userId: string, reportId: string, localUri: string) => {
  const base64 = await FileSystem.readAsStringAsync(localUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const path = `${userId}/${reportId}/video-${Date.now()}.mp4`;
  const { error } = await supabase.storage
    .from("report-media")
    .upload(path, decode(base64), { contentType: "video/mp4" });
  if (error) throw error;
  await supabase.from("report_videos").insert({ report_id: reportId, storage_path: path });
};

export const submitReport = createAsyncThunk<
  ReportRow,
  void,
  { state: RootState; rejectValue: string }
>("reports/submit", async (_, { getState, dispatch, rejectWithValue }) => {
  const user = getState().auth.session?.user;
  const draft = getState().reports.draft;
  if (!user) return rejectWithValue("Non authentifié");

  const { data, error } = await supabase
    .from("reports")
    .insert({
      user_id: user.id,
      category_id: draft.categoryId,
      type_value: draft.type,
      title: draft.title,
      description: draft.description,
      address: draft.address,
      status: "pending" as ReportStatus,
    })
    .select()
    .single();
  if (error || !data) return rejectWithValue(error?.message || "Envoi impossible.");

  for (const uri of draft.photos) {
    try {
      await uploadPhoto(user.id, data.id, uri);
    } catch (e) {
      console.warn("uploadPhoto failed", (e as Error).message);
    }
  }

  if (draft.video) {
    try {
      await uploadVideo(user.id, data.id, draft.video);
    } catch (e) {
      console.warn("uploadVideo failed", (e as Error).message);
    }
  }

  await dispatch(fetchReports());
  return data as ReportRow;
});

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    updateDraft(state, action: PayloadAction<Partial<ReportDraft>>) {
      state.draft = { ...state.draft, ...action.payload };
    },
    resetDraft(state) {
      state.draft = emptyDraft;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Erreur inconnue";
      })
      .addCase(submitReport.fulfilled, (state) => {
        state.draft = emptyDraft;
      });
  },
});

export const { updateDraft, resetDraft } = reportsSlice.actions;
export default reportsSlice.reducer;

// ---- sélecteurs ----
export const selectReports = (state: RootState): Report[] => state.reports.items;
export const selectReportsLoading = (state: RootState): boolean => state.reports.loading;
export const selectDraft = (state: RootState): ReportDraft => state.reports.draft;
export const selectReportCountByStatus = (status: ReportStatus) => (state: RootState): number =>
  state.reports.items.filter((r) => r.status === status).length;
