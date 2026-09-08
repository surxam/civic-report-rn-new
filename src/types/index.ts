// Types partagés, calqués sur le schéma Supabase (supabase/schema.sql).
import type { ComponentProps } from "react";
import type { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type IoniconName = ComponentProps<typeof Ionicons>["name"];

export type CategoryColorKey = "blue" | "orange" | "lime" | "aqua" | "red" | "gray";

export interface ReportType {
  value: string;
  label: string;
}

export interface Category {
  id: string;
  label: string;
  color: CategoryColorKey;
  icon: IoniconName;
  types: ReportType[];
}

export type ReportStatus = "pending" | "accepted" | "rejected";

/** Ligne brute renvoyée par Supabase (table `reports` + jointure `report_images`) */
export interface ReportRow {
  id: string;
  reference: string;
  user_id: string;
  category_id: string;
  type_value: string;
  title: string;
  description: string;
  address: string;
  status: ReportStatus;
  rejection_reason: string | null;
  created_at: string;
  report_images?: { storage_path: string }[];
  report_videos?: { storage_path: string }[];
}

/** Rapport tel qu'affiché côté UI (formaté pour ReportCard) */
export interface Report {
  id: string;
  reference: string;
  title: string;
  type_label: string;
  description: string;
  address: string;
  status: ReportStatus;
  rejection_reason: string | null;
  date: string;
  image_url: string | null;
  video_url: string | null;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export interface ReportDraft {
  categoryId: string | null;
  type: string;
  address: string;
  title: string;
  description: string;
  photos: string[]; // uris locales choisies avec expo-image-picker
  video: string | null; // uri locale de la vidéo capturée avec la caméra
}

/** Paramètres de navigation du Stack racine (React Navigation) */
export type RootStackParamList = {
  Login: undefined;
  Categories: undefined;
  MediaChoice: undefined;
  ReportForm: undefined;
  History: undefined;
  Profile: undefined;
};

/** Raccourci pour typer les props (navigation, route) reçues par chaque écran. */
export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

/**
 * Sous-ensemble de NativeStackNavigationProp utilisé par le composant Screen (Header + BottomNav).
 * Une interface plus étroite avec des méthodes (typage bivariant) évite les soucis de variance
 * de TypeScript quand un `NativeStackNavigationProp<RootStackParamList, "Home">` (typé pour un
 * écran précis) est passé à un composant générique qui accepte n'importe quel écran.
 */
export interface AppNavigation {
  navigate(screen: keyof RootStackParamList): void;
  goBack(): void;
}
