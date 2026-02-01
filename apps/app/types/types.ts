export interface TextTrack {
  id: string;
  content: string;
  animation: string;
  startPosition: number;
  duration: number;
}

export interface Clip {
  id: string;
  url: string;
  duration: number;
  thumbnail: string;
}