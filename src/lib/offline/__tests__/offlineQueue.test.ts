import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  enqueueOfflineAttempt,
  getQueuedAttempts,
  removeQueuedAttempt,
  clearQueuedAttempts,
  syncOfflineAttempts,
  isBrowserOnline,
} from "../offlineQueue";

describe("offlineQueue", () => {
  beforeEach(() => {
    clearQueuedAttempts();
    vi.restoreAllMocks();
  });

  it("enqueues an attempt with generated ID and timestamp", () => {
    const attempt = enqueueOfflineAttempt({
      questionId: "q1",
      selectedAnswer: "B",
      conceptId: "c1",
    });

    expect(attempt.questionId).toBe("q1");
    expect(attempt.selectedAnswer).toBe("B");
    expect(attempt.conceptId).toBe("c1");
    expect(typeof attempt.id).toBe("string");
    expect(attempt.timestamp).toBeGreaterThan(0);

    const queued = getQueuedAttempts();
    expect(queued).toHaveLength(1);
    expect(queued[0].id).toBe(attempt.id);
  });

  it("removes a specific attempt by ID", () => {
    const a1 = enqueueOfflineAttempt({
      questionId: "q1",
      selectedAnswer: "A",
      conceptId: "c1",
    });
    const a2 = enqueueOfflineAttempt({
      questionId: "q2",
      selectedAnswer: "C",
      conceptId: "c1",
    });

    expect(getQueuedAttempts()).toHaveLength(2);
    removeQueuedAttempt(a1.id);

    const remaining = getQueuedAttempts();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(a2.id);
  });

  it("clears all queued attempts", () => {
    enqueueOfflineAttempt({ questionId: "q1", selectedAnswer: "A", conceptId: "c1" });
    enqueueOfflineAttempt({ questionId: "q2", selectedAnswer: "B", conceptId: "c1" });
    expect(getQueuedAttempts()).toHaveLength(2);

    clearQueuedAttempts();
    expect(getQueuedAttempts()).toHaveLength(0);
  });

  it("syncs queued attempts sequentially via fetch", async () => {
    enqueueOfflineAttempt({ questionId: "q1", selectedAnswer: "A", conceptId: "c1" });
    enqueueOfflineAttempt({ questionId: "q2", selectedAnswer: "B", conceptId: "c1" });

    // Mock global fetch
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = mockFetch;

    const result = await syncOfflineAttempts();
    expect(result.syncedCount).toBe(2);
    expect(result.failedCount).toBe(0);
    expect(getQueuedAttempts()).toHaveLength(0);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("stops sync playback if a network error occurs", async () => {
    enqueueOfflineAttempt({ questionId: "q1", selectedAnswer: "A", conceptId: "c1" });
    enqueueOfflineAttempt({ questionId: "q2", selectedAnswer: "B", conceptId: "c1" });

    // Mock fetch failing on first attempt
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network offline"));
    global.fetch = mockFetch;

    const result = await syncOfflineAttempts();
    expect(result.syncedCount).toBe(0);
    expect(result.failedCount).toBe(1);
    expect(getQueuedAttempts()).toHaveLength(2); // Queue preserved
  });
});
