export { cn } from "cn";

/**
 * Calculate the number of days elapsed since an ISO timestamp.
 * Returns defaultFallback (default 30) if dateStr is null or undefined.
 */
export function getDaysSince(dateStr: string | null | undefined, defaultFallback: number = 30): number {
  if (!dateStr) return defaultFallback;
  const timestamp = new Date(dateStr).getTime();
  if (isNaN(timestamp)) return defaultFallback;
  return Math.max(0, (Date.now() - timestamp) / (1000 * 60 * 60 * 24));
}
