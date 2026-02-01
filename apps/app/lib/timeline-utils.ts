export interface TimeInterval {
  startPosition: number;
  duration: number;
}

export function findAvailableTextSlot(
  tracks: TimeInterval[],
  totalDuration: number,
  requestedDuration: number,
): number {
  const sorted = [...tracks].sort((a, b) => a.startPosition - b.startPosition);

  if (sorted.length === 0) {
    return totalDuration >= requestedDuration ? 0 : -1;
  }

  if (sorted[0].startPosition >= requestedDuration) {
    return 0;
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const currentEnd = sorted[i].startPosition + sorted[i].duration;
    const nextStart = sorted[i + 1].startPosition;
    if (nextStart - currentEnd >= requestedDuration) {
      return currentEnd;
    }
  }

  const lastTrack = sorted[sorted.length - 1];
  const lastEnd = lastTrack.startPosition + lastTrack.duration;
  if (totalDuration - lastEnd >= requestedDuration) {
    return lastEnd;
  }

  return -1;
}

/**
 * Snaps a proposed time to the nearest clip boundary if within threshold.
 */
export function calculateSnappedTime(
  proposedTime: number,
  clips: { duration: number }[],
  snapThreshold: number,
): number {
  if (Math.abs(proposedTime) < snapThreshold) return 0;

  let accumulatedTime = 0;
  for (const clip of clips) {
    accumulatedTime += clip.duration;
    if (Math.abs(proposedTime - accumulatedTime) < snapThreshold) {
      return accumulatedTime;
    }
  }
  return proposedTime;
}

export function getActiveTracks<T extends TimeInterval>(
  tracks: T[],
  time: number,
): T[] {
  return tracks.filter(
    (track) =>
      time >= track.startPosition &&
      time < track.startPosition + track.duration,
  );
}
