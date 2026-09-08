// Miroir de la table report_categories / report_types côté Supabase.
// Le champ "id" ici correspond à report_categories.slug dans la base.
import type { Category, ReportStatus, ReportType } from "../types";
import type { colors } from "../theme/colors";

export const categories: Category[] = [
  {
    id: "voirie",
    label: "Voirie",
    color: "blue",
    icon: "trail-sign-outline",
    types: [
      { value: "trou_chaussee", label: "Trou dans la chaussée" },
      { value: "panneau_manquant", label: "Panneau manquant ou abîmé" },
    ],
  },
  {
    id: "eclairage",
    label: "Éclairage",
    color: "orange",
    icon: "bulb-outline",
    types: [{ value: "eclairage_defaillant", label: "Éclairage défaillant" }],
  },
  {
    id: "proprete",
    label: "Propreté",
    color: "lime",
    icon: "trash-outline",
    types: [{ value: "proprete_publique", label: "Propreté publique" }],
  },
  {
    id: "espaces_verts",
    label: "Espaces verts",
    color: "aqua",
    icon: "leaf-outline",
    types: [{ value: "espaces_verts", label: "Entretien des espaces verts" }],
  },
  {
    id: "securite",
    label: "Sécurité",
    color: "red",
    icon: "shield-checkmark-outline",
    types: [
      { value: "voiture_abandonnee", label: "Voiture abandonnée" },
      { value: "destruction_materiel_public", label: "Dégradation de matériel public" },
    ],
  },
  {
    id: "autre",
    label: "Autre",
    color: "gray",
    icon: "ellipsis-horizontal-circle-outline",
    types: [{ value: "autre", label: "Autre problème" }],
  },
];

export function categoryById(id: string | null): Category | undefined {
  return categories.find((category) => category.id === id);
}

export function getAllTypes(): ReportType[] {
  return categories.flatMap((category) => category.types);
}

export function typeLabel(value: string): string {
  return getAllTypes().find((type) => type.value === value)?.label || value;
}

export const STATUS_LABELS: Record<ReportStatus, string> = {
  accepted: "accepté",
  rejected: "refusé",
  pending: "en attente",
};

export const STATUS_COLORS: Record<ReportStatus, keyof typeof colors> = {
  accepted: "success",
  rejected: "danger",
  pending: "orange",
};
