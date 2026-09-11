export { cn } from "cn";

// Calculates calendar days elapsed since an ISO timestamp
export function getDaysSince(dateStr: string | null | undefined, defaultFallback: number = 30): number {
  if (!dateStr) return defaultFallback;
  const timestamp = new Date(dateStr).getTime();
  if (isNaN(timestamp)) return defaultFallback;
  return Math.max(0, (Date.now() - timestamp) / (1000 * 60 * 60 * 24));
}
