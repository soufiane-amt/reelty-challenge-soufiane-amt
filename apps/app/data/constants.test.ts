import { describe, it, expect } from "vitest";
import {
  doIntervalsOverlap,
  getConstrainedHeight,
  getClipWidth,
  CARD_SIZE_CONSTANTS,
} from "../data/constants";

describe("doIntervalsOverlap", () => {
  it("should detect overlapping intervals", () => {
    expect(doIntervalsOverlap(0, 10, 5, 10)).toBe(true);
    expect(doIntervalsOverlap(5, 10, 0, 10)).toBe(true);
    expect(doIntervalsOverlap(0, 10, 2, 6)).toBe(true);
  });

  it("should not detect non-overlapping intervals", () => {
    expect(doIntervalsOverlap(0, 5, 6, 5)).toBe(false);
    expect(doIntervalsOverlap(6, 5, 0, 5)).toBe(false);
  });

  it("should handle touching intervals as non-overlapping", () => {
    expect(doIntervalsOverlap(0, 5, 5, 5)).toBe(false);
  });
});

describe("getConstrainedHeight", () => {
  it("should return scaled height within bounds for landscape", () => {
    const ratio = "landscape";
    const base = CARD_SIZE_CONSTANTS.BASE_HEIGHTS.LANDSCAPE;

    expect(getConstrainedHeight(ratio, 1)).toBe(base);

    expect(getConstrainedHeight(ratio, 0.01)).toBe(
      CARD_SIZE_CONSTANTS.MIN_HEIGHTS.LANDSCAPE,
    );

    expect(getConstrainedHeight(ratio, 100)).toBe(
      CARD_SIZE_CONSTANTS.MAX_HEIGHTS.LANDSCAPE,
    );
  });

  it("should return scaled height within bounds for portrait", () => {
    const ratio = "portrait";
    const base = CARD_SIZE_CONSTANTS.BASE_HEIGHTS.PORTRAIT;

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
