// Single source of truth for site palettes. Shared by the React view and the static snapshot,
// so a published site and its IPFS-ready copy can never drift apart visually.
import type { Theme } from "./sites";

export const THEME_PALETTE: Record<Theme, { bg: string; fg: string; accent: string; card: string }> = {
  gold: { bg: "#0b0b0b", fg: "#f5f5f5", accent: "#facc15", card: "rgba(180,130,30,0.12)" },
  midnight: { bg: "#0f172a", fg: "#e2e8f0", accent: "#38bdf8", card: "rgba(56,189,248,0.10)" },
  emerald: { bg: "#052e16", fg: "#ecfdf5", accent: "#34d399", card: "rgba(52,211,153,0.10)" },
  light: { bg: "#fafaf9", fg: "#1c1917", accent: "#b45309", card: "rgba(0,0,0,0.05)" },
};
