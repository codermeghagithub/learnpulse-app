/**
 * offlineQueue.ts — Resilient Offline Practice Queue
 *
 * Enables uninterrupted learning in low-connectivity college environments,
 * rural labs, or during network disruptions. Attempts are saved to localStorage
 * and replayed sequentially to /api/submit-attempt to maintain ACID consistency.
 */

export interface OfflineAttempt {
  id: string;
  questionId: string;
  selectedAnswer: string;
  conceptId: string;
  isReviewQuestion?: boolean;
  originConceptId?: string;
  timestamp: number;
}

const STORAGE_KEY = "learnpulse_offline_attempts_queue";

// In-memory queue fallback for Node/SSR/testing when window.localStorage is not present
let memoryStore: OfflineAttempt[] = [];

function getStorage() {
  if (typeof window !== "undefined" && typeof window.localStorage !== "undefined") {
    return window.localStorage;
  }
  return {
    getItem: (): string | null => JSON.stringify(memoryStore),
    setItem: (key: string, value: string): void => {
      void key;
      try {
        memoryStore = JSON.parse(value);
      } catch {
        memoryStore = [];
      }
    },
    removeItem: (key?: string): void => {
      void key;
      memoryStore = [];
    },
  };
}

/** Check if browser reports online status. */
export function isBrowserOnline(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return true;
  }
  return navigator.onLine;
}

/** Retrieve all pending attempts stored locally. */
export function getQueuedAttempts(): OfflineAttempt[] {
  try {
    const raw = getStorage().getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OfflineAttempt[];
  } catch (err) {
    console.error("[offlineQueue] Failed to parse stored queue:", err);
    return [];
  }
}

/** Save a new attempt to the offline queue. */
export function enqueueOfflineAttempt(
  attempt: Omit<OfflineAttempt, "id" | "timestamp">
): OfflineAttempt {
  const item: OfflineAttempt = {
    ...attempt,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `offline_${Date.now()}_${Math.random()}`,
    timestamp: Date.now(),
  };

  try {
    const current = getQueuedAttempts();
    current.push(item);
    getStorage().setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error("[offlineQueue] Failed to write to storage:", err);
  }

  return item;
}

/** Remove an attempt after successful server sync. */
export function removeQueuedAttempt(id: string): void {
  try {
    const current = getQueuedAttempts().filter((a) => a.id !== id);
    getStorage().setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.error("[offlineQueue] Failed to update storage:", err);
  }
}

/** Clear all queued attempts. */
export function clearQueuedAttempts(): void {
  try {
    getStorage().removeItem(STORAGE_KEY);
  } catch (err) {
    console.error("[offlineQueue] Failed to clear queue:", err);
  }
}


/**
 * Replay queued attempts to /api/submit-attempt sequentially in chronological order.
 * Ensures PostgreSQL mastery and attempt records are updated in order with ACID consistency.
 */
export async function syncOfflineAttempts(): Promise<{
  syncedCount: number;
  failedCount: number;
}> {
  const queue = getQueuedAttempts();
  if (queue.length === 0) return { syncedCount: 0, failedCount: 0 };

  // Sort by timestamp ascending
  const sorted = [...queue].sort((a, b) => a.timestamp - b.timestamp);
  let syncedCount = 0;
  let failedCount = 0;

  for (const item of sorted) {
    try {
      const res = await fetch("/api/submit-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: item.questionId,
          selectedAnswer: item.selectedAnswer,
          conceptId: item.conceptId,
          isReviewQuestion: item.isReviewQuestion,
          originConceptId: item.originConceptId,
        }),
      });

      if (res.ok) {
        removeQueuedAttempt(item.id);
        syncedCount++;
      } else {
        failedCount++;
        // Stop on auth/server error so attempts aren't dropped prematurely
        break;
      }
    } catch {
      failedCount++;
      break;
    }
  }

  return { syncedCount, failedCount };
}
