import { describe, it, expect } from "vitest";
import {
  doIntervalsOverlap,
  getConstrainedHeight,
  getClipWidth,
  CARD_SIZE_CONSTANTS,
} from "../data/constants";

describe("doIntervalsOverlap", () => {
  it("should detect overlapping intervals", () => {
    // Overlap: [0, 10) and [5, 15)
    expect(doIntervalsOverlap(0, 10, 5, 10)).toBe(true);
    // Overlap: [5, 15) and [0, 10)
    expect(doIntervalsOverlap(5, 10, 0, 10)).toBe(true);
    // Inside: [2, 8) inside [0, 10)
    expect(doIntervalsOverlap(0, 10, 2, 6)).toBe(true);
  });

  it("should not detect non-overlapping intervals", () => {
    // Before: [0, 5) and [6, 11)
    expect(doIntervalsOverlap(0, 5, 6, 5)).toBe(false);
    // After: [6, 11) and [0, 5)
    expect(doIntervalsOverlap(6, 5, 0, 5)).toBe(false);
  });

  it("should handle touching intervals as non-overlapping", () => {
    // [0, 5) and [5, 10) - touching at 5
    expect(doIntervalsOverlap(0, 5, 5, 5)).toBe(false);
  });
});

describe("getConstrainedHeight", () => {
  it("should return scaled height within bounds for landscape", () => {
    const ratio = "landscape";
    const base = CARD_SIZE_CONSTANTS.BASE_HEIGHTS.LANDSCAPE;

    // Normal zoom (1)
    expect(getConstrainedHeight(ratio, 1)).toBe(base);

    // Min bound (very small zoom)
    expect(getConstrainedHeight(ratio, 0.01)).toBe(
      CARD_SIZE_CONSTANTS.MIN_HEIGHTS.LANDSCAPE,
    );

    // Max bound (very large zoom)
    expect(getConstrainedHeight(ratio, 100)).toBe(
      CARD_SIZE_CONSTANTS.MAX_HEIGHTS.LANDSCAPE,
    );
  });

  it("should return scaled height within bounds for portrait", () => {
    const ratio = "portrait";
    const base = CARD_SIZE_CONSTANTS.BASE_HEIGHTS.PORTRAIT;

    // Normal zoom (1)
    expect(getConstrainedHeight(ratio, 1)).toBe(base);
  });
});

describe("getClipWidth", () => {
  it("should calculate correct width for landscape (16:9)", () => {
    const zoom = 1;
    const height = getConstrainedHeight("landscape", zoom);
    expect(getClipWidth("landscape", zoom)).toBe((height * 16) / 9);
  });

  it("should calculate correct width for portrait (9:16)", () => {
    const zoom = 1;
    const height = getConstrainedHeight("portrait", zoom);
    expect(getClipWidth("portrait", zoom)).toBe((height * 9) / 16);
  });
});
