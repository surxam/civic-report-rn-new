// Repris des variables CSS de la maquette web (styles.css :root)
import type { CategoryColorKey } from "../types";

export const colors = {
  bg: "#111212",
  surface: "#202121",
  surface2: "#2b2c2c",
  surface3: "#353636",
  line: "rgba(255,255,255,0.1)",
  text: "#f5f5f4",
  muted: "#a8aaa9",
  subtle: "#747776",
  primary: "#0c6a76",
  primaryBright: "#13a3b5",
  lime: "#86df11",
  blue: "#4e94e4",
  orange: "#ffad1c",
  aqua: "#55d9c5",
  red: "#dc0023",
  yellow: "#fcf07b",
  success: "#25b687",
  danger: "#e17979",
} as const;

export const categoryColors: Record<CategoryColorKey, string> = {
  blue: colors.blue,
  orange: colors.orange,
  lime: colors.lime,
  aqua: colors.aqua,
  red: colors.red,
  gray: colors.subtle,
};

export const spacing = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;
