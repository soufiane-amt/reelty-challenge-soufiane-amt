"use client";
import { SAMPLE_VIDEOS } from "@/data/sample-videos";
import { TextTrack } from "@/types/types";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Play } from "lucide-react";
import TextOverlay from "../text/TextOverlay";
import { getActiveTracks } from "@/lib/timeline-utils";

function PreviewPlayer({
  clips,
  textTracks,
  ratio,
  templates,
}: {
  clips: typeof SAMPLE_VIDEOS;
  textTracks: TextTrack[];
  ratio: "portrait" | "landscape";
  templates?: any[];
}) {
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setActiveClipIndex(0);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [clips.length]);

  const totalDurationBeforeCurrent = clips
    .slice(0, activeClipIndex)
    .reduce((acc, clip) => acc + clip.duration, 0);

  const globalTime = totalDurationBeforeCurrent + currentTime;

  const activeTexts = getActiveTracks(textTracks, globalTime);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        )
          return;
        e.preventDefault();
        handlePlayPause();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying]);

  const handleEnded = () => {
    if (activeClipIndex < clips.length - 1) {
      setActiveClipIndex((prev) => prev + 1);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play();
          setIsPlaying(true);
        }
      }, 0);
    } else {
      setIsPlaying(false);
      setActiveClipIndex(0);
    }
  };

  const currentClip = clips[activeClipIndex];

  if (!currentClip) {
    return (
      <div className="flex h-full w-full items-center justify-center text-zinc-500">
        <p>No clips to preview</p>
      </div>
    );
  }
  return (
    <div
      className={twMerge(
        "relative flex items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-2xl",
        ratio === "landscape"
          ? "aspect-video h-auto w-full max-w-5xl max-h-full"
          : "aspect-[9/16] h-full max-h-full w-auto",
      )}
    >
      <video
        ref={videoRef}
        src={currentClip.url}
        className="h-full w-full object-contain"
        onEnded={handleEnded}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onLoadedData={() => setIsBuffering(false)}
        onClick={handlePlayPause}
        playsInline
      />
      {activeTexts.map((text) => (
        <TextOverlay
          key={text.id}
          text={text}
          template={templates?.find((t) => t.key === text.animation)}
          ratio={ratio}
        />
      ))}
      {isBuffering && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent shadow-lg" />
        </div>
      )}
      {!isPlaying && !isBuffering && (
        <div
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 transition-opacity hover:bg-black/30"
          onClick={handlePlayPause}
        >
          <div className="flex size-20 items-center justify-center rounded-full border border-white/20 bg-white/10 shadow-xl backdrop-blur-md transition-transform hover:scale-110">
            <Play size={40} className="ml-1 fill-white text-white" />
          </div>
        </div>
      )}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
        {clips.map((_, idx) => (
          <div
            key={idx}
            className={twMerge(
              "h-1.5 rounded-full shadow-sm transition-all",
              idx === activeClipIndex
                ? "w-6 bg-violet-500"
                : "w-1.5 bg-white/30",
            )}
          />
        ))}
      </div>
    </div>
  );
}

export default PreviewPlayer;
