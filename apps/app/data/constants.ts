export const CARD_SIZE_CONSTANTS = {
  BASE_HEIGHTS: { LANDSCAPE: 225, PORTRAIT: 320 },
  MIN_HEIGHTS: { LANDSCAPE: 100, PORTRAIT: 150 },
  MAX_HEIGHTS: { LANDSCAPE: 500, PORTRAIT: 700 },
} as const;

export const GAP_BETWEEN_CLIPS = 16;

export function getConstrainedHeight(
  ratio: "landscape" | "portrait",
  zoomLevel: number,
): number {
  const baseHeight =
    ratio === "landscape"
      ? CARD_SIZE_CONSTANTS.BASE_HEIGHTS.LANDSCAPE
      : CARD_SIZE_CONSTANTS.BASE_HEIGHTS.PORTRAIT;
  const minHeight =
    ratio === "landscape"
      ? CARD_SIZE_CONSTANTS.MIN_HEIGHTS.LANDSCAPE
      : CARD_SIZE_CONSTANTS.MIN_HEIGHTS.PORTRAIT;
  const maxHeight =
    ratio === "landscape"
      ? CARD_SIZE_CONSTANTS.MAX_HEIGHTS.LANDSCAPE
      : CARD_SIZE_CONSTANTS.MAX_HEIGHTS.PORTRAIT;
  const scaledHeight = baseHeight * zoomLevel;
  return Math.max(minHeight, Math.min(maxHeight, scaledHeight));
}

export function getClipWidth(
  ratio: "landscape" | "portrait",
  zoomLevel: number,
): number {
  const height = getConstrainedHeight(ratio, zoomLevel);
  if (ratio === "landscape") return (height * 16) / 9;
  return (height * 9) / 16;
}

export function doIntervalsOverlap(
  start1: number,
  duration1: number,
  start2: number,
  duration2: number,
): boolean {
  const end1 = start1 + duration1;
  const end2 = start2 + duration2;
  return start1 < end2 && start2 < end1;
}
