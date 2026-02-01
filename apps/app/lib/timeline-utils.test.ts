import { describe, it, expect } from "vitest";
import { calculateSnappedTime, findAvailableTextSlot, getActiveTracks } from "../lib/timeline-utils";

describe("findAvailableTextSlot", () => {
  it("should return 0 if there are no existing tracks and enough space", () => {
    const result = findAvailableTextSlot([], 10, 5);
    expect(result).toBe(0);
  });

  it("should return -1 if there are no existing tracks but not enough space", () => {
    const result = findAvailableTextSlot([], 4, 5);
    expect(result).toBe(-1);
  });

  it("should place text before the first track if there is space", () => {
    // Track starts at 5, we need 3s. Should fit at 0.
    const tracks = [{ startPosition: 5, duration: 5 }];
    const result = findAvailableTextSlot(tracks, 20, 3);
    expect(result).toBe(0);
  });

  it("should place text in a gap between tracks", () => {
    // Track 1: [0-5], Track 2: [10-15]. Gap is [5-10] (5s long).
    // We need 3s. Should fit at 5.
    const tracks = [
      { startPosition: 0, duration: 5 },
      { startPosition: 10, duration: 5 },
    ];
    const result = findAvailableTextSlot(tracks, 20, 3);
    expect(result).toBe(5);
  });

  it("should place text after the last track", () => {
    // Track 1: [0-5]. Total 10. We need 3. Should fit at 5.
    const tracks = [{ startPosition: 0, duration: 5 }];
    const result = findAvailableTextSlot(tracks, 10, 3);
    expect(result).toBe(5);
  });

  it("should return -1 if no gap is large enough", () => {
    // Track 1: [0-4], Track 2: [6-10]. Gap is 2s.
    // We need 3s. Should fail.
    const tracks = [
      { startPosition: 0, duration: 4 },
      { startPosition: 6, duration: 4 },
    ];
    const result = findAvailableTextSlot(tracks, 10, 3);
    expect(result).toBe(-1);
  });

  it("should handle unsorted input correctly", () => {
    // Tracks provided out of order: [10-15], [0-5]
    // Gap is [5-10].
    const tracks = [
      { startPosition: 10, duration: 5 },
      { startPosition: 0, duration: 5 },
    ];
    const result = findAvailableTextSlot(tracks, 20, 3);
    expect(result).toBe(5);
  });
});

describe("calculateSnappedTime", () => {
  const clips = [{ duration: 5 }, { duration: 3 }, { duration: 4 }];
  // Boundaries: 0, 5, 8 (5+3), 12 (5+3+4)

  it("should snap to 0 if close enough", () => {
    expect(calculateSnappedTime(0.1, clips, 0.5)).toBe(0);
  });

  it("should snap to clip boundaries", () => {
    // Snap to 5
    expect(calculateSnappedTime(4.9, clips, 0.5)).toBe(5);
    expect(calculateSnappedTime(5.1, clips, 0.5)).toBe(5);

    // Snap to 8
    expect(calculateSnappedTime(7.8, clips, 0.5)).toBe(8);
  });

  it("should not snap if outside threshold", () => {
    expect(calculateSnappedTime(6.0, clips, 0.5)).toBe(6.0);
  });

  it("should return proposed time if no clips", () => {
    expect(calculateSnappedTime(3.5, [], 0.5)).toBe(3.5);
  });
});

describe("getActiveTracks", () => {
  const tracks = [
    { startPosition: 0, duration: 5 }, // 0-5
    { startPosition: 5, duration: 5 }, // 5-10
    { startPosition: 2, duration: 8 }, // 2-10 (overlaps)
  ];

  it("should return tracks active at specific time", () => {
    const active = getActiveTracks(tracks, 3);
    expect(active).toHaveLength(2); // First and third track
    expect(active[0].startPosition).toBe(0);
    expect(active[1].startPosition).toBe(2);
  });

  it("should handle inclusive start time", () => {
    const active = getActiveTracks(tracks, 5);
    // Should include track starting at 5, exclude track ending at 5
    expect(active.some((t) => t.startPosition === 5)).toBe(true);
    expect(active.some((t) => t.startPosition === 0)).toBe(false);
  });

  it("should handle exclusive end time", () => {
    const active = getActiveTracks(tracks, 10);
    expect(active).toHaveLength(0);
  });
});
