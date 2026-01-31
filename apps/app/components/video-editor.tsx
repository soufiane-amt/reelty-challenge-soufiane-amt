"use client";

import { getConstrainedHeight, doIntervalsOverlap } from "@/data/constants";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { usePinchZoom } from "@/hooks/use-pinch-zoom";
import { SAMPLE_VIDEOS } from "@/data/sample-videos";
import VideoClipCard from "./video-clip-card";
import { twMerge } from "tailwind-merge";
import { Button } from "./ui/button";
import Magnifier from "./magnifier";
import {
  Plus,
  Type,
  Play,
  Video as VideoIcon,
  Layers,
  Upload,
  Link as LinkIcon,
  FileVideo,
  Save,
} from "lucide-react";
import TextDock from "./text-dock";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import DraggableText from "./draggable-text";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableClip } from "./sortable-clip";
import { TimelineRuler } from "./timeline-ruler";
import Toast from "./ui/Toast";
import { Input } from "./ui/input";
import { trpc } from "@/api/client";
import Lottie from "lottie-react";
import { replaceAnimationPlaceholder } from "./text-dock";

interface TextTrack {
  id: string;
  content: string;
  animation: string;
  startPosition: number;
  duration: number;
}

const getVideoDuration = (url: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      resolve(video.duration);
    };
    video.onerror = () => {
      reject("Invalid video");
    };
    video.src = url;
  });
};

const TextOverlay = ({
  text,
  template,
  ratio,
}: {
  text: TextTrack;
  template: any;
  ratio: "portrait" | "landscape";
}) => {
  const animationData = useMemo(() => {
    return template?.content
      ? replaceAnimationPlaceholder(template.content, text.content)
      : null;
  }, [template, text.content]);

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {animationData ? (
        <div className="h-full w-full">
          <Lottie
            animationData={animationData}
            loop={true}
            className="h-full w-full"
          />
        </div>
      ) : (
        <div
          className="text-center font-sans font-bold text-white drop-shadow-lg"
          style={{
            fontSize: ratio === "landscape" ? "4vw" : "3rem",
            textShadow: "0 2px 10px rgba(0,0,0,0.8)",
          }}
        >
          {text.content}
        </div>
      )}
    </div>
  );
};

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

  const activeTexts = textTracks.filter(
    (track) =>
      globalTime >= track.startPosition &&
      globalTime < track.startPosition + track.duration,
  );

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

export default function tchVideoEditor() {
  const ratio: "portrait" | "landscape" = "portrait";
  const [zoomLevel, setZoomLevel] = useState(30); // Pixels per second
  const clipsScrollContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [textTracks, setTextTracks] = useState<TextTrack[]>([]);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);

  const [textInput, setTextInput] = useState("");
  const [selectedTextAnimation, setSelectedTextAnimation] = useState<
    string | null
  >(null);
  const [isTextOpen, setIsTextOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"media" | "text">("media");
  const [importUrl, setImportUrl] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const { data: templates } = trpc.textTemplates.getAll.useQuery();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    if (isTextOpen) {
      setSidebarTab("text");
    }
  }, [isTextOpen]);

  const [activeClips, setActiveClips] = useState(SAMPLE_VIDEOS);
  const [removedClips, setRemovedClips] = useState<typeof SAMPLE_VIDEOS>([]);

  const handleZoomChange = useCallback(
    (newZoom: number) => setZoomLevel(newZoom),
    [],
  );
  const { setZoom: setPinchZoom } = usePinchZoom({
    minZoom: 10,
    maxZoom: 200,
    sensitivity: 1,
    onZoomChange: handleZoomChange,
    containerRef,
  });

  useEffect(() => {
    setPinchZoom(zoomLevel);
  }, [zoomLevel, setPinchZoom]);

  const constrainedHeight = getConstrainedHeight(ratio, 1);

  const handleApplyText = () => {
    if (textInput && selectedTextAnimation) {
      if (editingTrackId) {
        setTextTracks((tracks) =>
          tracks.map((t) =>
            t.id === editingTrackId
              ? { ...t, content: textInput, animation: selectedTextAnimation }
              : t,
          ),
        );
      } else {
        const totalDuration = activeClips.reduce(
          (acc, clip) => acc + clip.duration,
          0,
        );
        const DEFAULT_DURATION = 5;
        const MIN_DURATION = 2;
        let newStart = -1;
        let newDuration = DEFAULT_DURATION;

        const sortedTracks = [...textTracks].sort(
          (a, b) => a.startPosition - b.startPosition,
        );

        const findGap = (duration: number) => {
          if (sortedTracks.length === 0) {
            return totalDuration >= duration ? 0 : -1;
          }

          if (sortedTracks[0].startPosition >= duration) return 0;

          for (let i = 0; i < sortedTracks.length - 1; i++) {
            const currentEnd =
              sortedTracks[i].startPosition + sortedTracks[i].duration;
            const nextStart = sortedTracks[i + 1].startPosition;
            if (nextStart - currentEnd >= duration) return currentEnd;
          }

          const lastTrack = sortedTracks[sortedTracks.length - 1];
          const lastEnd = lastTrack.startPosition + lastTrack.duration;
          if (totalDuration - lastEnd >= duration) return lastEnd;

          return -1;
        };

        let start = findGap(DEFAULT_DURATION);
        if (start !== -1) {
          newStart = start;
          newDuration = DEFAULT_DURATION;
        } else {
          start = findGap(MIN_DURATION);
          if (start !== -1) {
            newStart = start;
            newDuration = MIN_DURATION;
          }
        }

        if (newStart !== -1) {
          const newTrack: TextTrack = {
            id: crypto.randomUUID(),
            content: textInput,
            animation: selectedTextAnimation,
            startPosition: newStart,
            duration: newDuration,
          };
          setTextTracks([...textTracks, newTrack]);
        } else {
          setToast("There is no place to put the text. Please try again.");
          return;
        }
      }
      setIsTextOpen(false);
      setEditingTrackId(null);
      setTextInput("");
      setSelectedTextAnimation(null);
    }
  };

  const handleDeleteText = () => {
    if (editingTrackId) {
      setTextTracks((tracks) => tracks.filter((t) => t.id !== editingTrackId));
      setIsTextOpen(false);
      setEditingTrackId(null);
      setTextInput("");
      setSelectedTextAnimation(null);
    }
  };

  const handleTextClick = (id: string) => {
    const track = textTracks.find((t) => t.id === id);
    if (track) {
      setEditingTrackId(id);
      setSelectedClipId(null);
      setTextInput(track.content);
      setSelectedTextAnimation(track.animation);
      setSidebarTab("text");
      setIsTextOpen(true);
    }
  };

  const handleAddTextClick = () => {
    setEditingTrackId(null);
    setSelectedClipId(null);
    setTextInput("");
    setSelectedTextAnimation(null);
    setSidebarTab("text");
    setIsTextOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = URL.createObjectURL(file);
      const duration = await getVideoDuration(url);
      const newClip = {
        id: crypto.randomUUID(),
        url,
        thumbnail: "",
        duration,
      };
      setActiveClips((prev) => [...prev, newClip]);
      setToast("Video uploaded successfully");
    } catch (error) {
      console.error(error);
      setToast("Failed to upload video");
    }
    // Reset input
    e.target.value = "";
  };

  const handleUrlImport = async () => {
    if (!importUrl) return;
    try {
      const duration = await getVideoDuration(importUrl);
      const newClip = {
        id: crypto.randomUUID(),
        url: importUrl,
        thumbnail: "",
        duration,
      };
      setActiveClips((prev) => [...prev, newClip]);
      setToast("Video imported successfully");
      setImportUrl("");
    } catch (error) {
      setToast("Failed to import video. Check URL.");
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event;

    const activeId = String(active.id);
    if (activeId.startsWith("text-")) {
      const trackId = activeId.replace("text-", "");
      const track = textTracks.find((t) => t.id === trackId);
      if (!track) return;

      const deltaSeconds = delta.x / zoomLevel;
      let newStart = Math.max(0, track.startPosition + deltaSeconds);

      const SNAP_THRESHOLD_PX = 15;
      const snapThresholdSec = SNAP_THRESHOLD_PX / zoomLevel;

      let accumulatedTime = 0;
      for (const clip of activeClips) {
        accumulatedTime += clip.duration;
        if (Math.abs(newStart - accumulatedTime) < snapThresholdSec) {
          newStart = accumulatedTime;
          break;
        }
      }

      const isOverlapping = textTracks.some((t) => {
        if (t.id === trackId) return false;
        return doIntervalsOverlap(
          newStart,
          track.duration,
          t.startPosition,
          t.duration,
        );
      });

      if (isOverlapping) return;

      setTextTracks((tracks) =>
        tracks.map((t) =>
          t.id === trackId ? { ...t, startPosition: newStart } : t,
        ),
      );
    } else if (over && active.id !== over.id) {
      setActiveClips((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleRemoveClip = (id: string) => {
    const clip = activeClips.find((c) => c.id === id);
    if (clip) {
      setActiveClips(activeClips.filter((c) => c.id !== id));
      if (selectedClipId === id) setSelectedClipId(null);
      setRemovedClips([...removedClips, clip]);
    }
  };

  const handleAddClip = (id: string) => {
    const clip = removedClips.find((c) => c.id === id);
    if (clip) {
      setRemovedClips(removedClips.filter((c) => c.id !== id));
      setActiveClips([...activeClips, clip]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Delete" || e.code === "Backspace") {
        const target = e.target as HTMLElement;
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        )
          return;

        if (editingTrackId) {
          handleDeleteText();
        } else if (selectedClipId) {
          handleRemoveClip(selectedClipId);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingTrackId, selectedClipId, activeClips, textTracks]);

  const totalTimelineDuration = activeClips.reduce(
    (acc, clip) => acc + clip.duration,
    0,
  );

  return (
    <div className="flex h-full w-full flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {toast && <Toast message={toast} />}

      <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 z-50">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
            <VideoIcon size={18} />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
              Untitled Project
            </h1>
            <p className="text-xs text-zinc-500">Last edited just now</p>
          </div>
        </div>
        <RenderButton
          clips={activeClips}
          ratio={ratio}
          textTracks={textTracks}
          setToast={setToast}
          templates={templates}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 shadow-lg shadow-violet-500/20"
        />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 shrink-0 border-r border-zinc-800 bg-zinc-900/50 flex flex-col z-40">
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => setSidebarTab("media")}
              className={twMerge(
                "flex-1 py-3 text-sm font-medium transition-colors",
                sidebarTab === "media"
                  ? "border-b-2 border-violet-500 text-violet-500"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              Media
            </button>
            <button
              onClick={() => setSidebarTab("text")}
              className={twMerge(
                "flex-1 py-3 text-sm font-medium transition-colors",
                sidebarTab === "text"
                  ? "border-b-2 border-violet-500 text-violet-500"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              Text
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {sidebarTab === "media" && (
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                    Import Media
                  </h3>
                  <div className="grid gap-4">
                    <Button
                      variant="outline"
                      className="h-24 w-full flex-col gap-2 border-dashed border-zinc-700 hover:border-violet-500 hover:bg-violet-500/5"
                      onClick={() =>
                        document.getElementById("video-upload")?.click()
                      }
                    >
                      <Upload size={24} className="text-zinc-400" />
                      <span className="text-zinc-400">Upload from Device</span>
                    </Button>
                    <input
                      id="video-upload"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />

                    <div className="flex gap-2">
                      <Input
                        placeholder="Paste video URL..."
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        className="bg-zinc-950"
                      />
                      <Button size="icon" onClick={handleUrlImport}>
                        <LinkIcon size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {sidebarTab === "text" && (
              <TextDock
                isOpen={true}
                setIsOpen={setIsTextOpen}
                textInput={textInput}
                setTextInput={setTextInput}
                selectedTextAnimation={selectedTextAnimation}
                setSelectedTextAnimation={setSelectedTextAnimation}
                onApplyText={handleApplyText}
                onReset={handleDeleteText}
                hasAppliedText={!!editingTrackId}
              />
            )}
          </div>
        </aside>

        <div className="flex flex-1 flex-col min-w-0">
          <main className="flex-1 bg-zinc-950 relative flex items-center justify-center p-4 overflow-hidden">
            <PreviewPlayer
              clips={activeClips}
              textTracks={textTracks}
              ratio={ratio}
              templates={templates}
            />
          </main>

          <section className="h-72 shrink-0 border-t border-zinc-800 bg-zinc-900 flex flex-col z-30">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 px-4 bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  <Layers size={14} />
                  <span>Timeline</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddTextClick}
                  className="h-8 gap-2 text-zinc-400 hover:text-zinc-100"
                >
                  <Type size={14} />
                  Add Text
                </Button>
                <div className="h-4 w-px bg-zinc-800" />
                <Magnifier
                  onZoomChange={handleZoomChange}
                  initialZoom={zoomLevel}
                  ratio={ratio}
                  isLoading={false}
                  externalZoom={zoomLevel}
                  minZoom={10}
                  maxZoom={200}
                />
              </div>
            </div>

            <div
              ref={containerRef}
              className="scrollbar scrollbar-w-1.5 scrollbar-thumb-zinc-700 scrollbar-thumb-rounded-full scrollbar-hover:scrollbar-thumb-zinc-500 relative flex flex-1 flex-col overflow-hidden overflow-y-auto bg-zinc-900/50"
            >
              <DndContext
                id="video-editor-dnd"
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <div
                  ref={clipsScrollContainerRef}
                  className={twMerge(
                    "scrollbar scrollbar-h-1.5 scrollbar-thumb-zinc-700 scrollbar-thumb-rounded-full scrollbar-hover:scrollbar-thumb-zinc-500 mx-4 my-2 overflow-x-auto overflow-y-hidden pb-6",
                    isTextOpen &&
                      "opacity-50 grayscale transition-all duration-300",
                  )}
                >
                  <div
                    className="relative"
                    style={{
                      width: `${totalTimelineDuration * zoomLevel}px`,
                      minHeight: "100%",
                    }}
                  >
                    <TimelineRuler
                      duration={totalTimelineDuration}
                      zoomLevel={zoomLevel}
                    />

                    <div className="absolute top-8 left-0 w-full h-16 z-20">
                      {textTracks.map((track) => (
                        <DraggableText
                          key={track.id}
                          id={`text-${track.id}`}
                          textContent={track.content}
                          startPosition={track.startPosition}
                          duration={track.duration}
                          isActive={editingTrackId === track.id}
                          totalClips={activeClips.length}
                          zoomLevel={zoomLevel}
                          onClick={() => handleTextClick(track.id)}
                          onDurationChange={(d) => {
                            const isOverlapping = textTracks.some((t) => {
                              if (t.id === track.id) return false;
                              return doIntervalsOverlap(
                                track.startPosition,
                                d,
                                t.startPosition,
                                t.duration,
                              );
                            });
                            if (!isOverlapping) {
                              setTextTracks((tracks) =>
                                tracks.map((t) =>
                                  t.id === track.id ? { ...t, duration: d } : t,
                                ),
                              );
                            }
                          }}
                          className="top-0"
                        />
                      ))}
                    </div>

                    <div className="flex items-center pt-10">
                      <SortableContext
                        items={activeClips}
                        strategy={horizontalListSortingStrategy}
                      >
                        {activeClips.map((video, index) => (
                          <SortableClip
                            key={video.id}
                            id={video.id}
                            videoUrl={video.url}
                            ratio={ratio}
                            height={constrainedHeight}
                            index={index}
                            isRemoved={false}
                            onRemove={handleRemoveClip}
                            onAdd={handleAddClip}
                            width={video.duration * zoomLevel}
                            isSelected={selectedClipId === video.id}
                            onSelect={(id) => {
                              setSelectedClipId(id);
                              setEditingTrackId(null);
                              setIsTextOpen(false);
                            }}
                          />
                        ))}
                      </SortableContext>
                    </div>
                  </div>

                  {removedClips.length > 0 && (
                    <div className="mt-8 flex gap-4 border-t border-zinc-800/50 pt-4">
                      <div className="text-xs text-zinc-500 writing-vertical-lr rotate-180">
                        Bin
                      </div>
                      <div
                        className={twMerge(
                          "flex size-11 items-center justify-center rounded-lg border",
                          "border-zinc-800 bg-zinc-900 shadow-md",
                        )}
                      >
                        <Plus
                          size={24}
                          className="text-zinc-500 duration-300"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </DndContext>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const MIN_RENDER_DELAY_MS = 2000;
const MAX_RENDER_DELAY_MS = 8000;

function RenderButton({
  clips,
  ratio,
  textTracks,
  className,
  setToast,
  templates,
}: {
  clips: typeof SAMPLE_VIDEOS;
  ratio: "portrait" | "landscape";
  textTracks: TextTrack[];
  className?: string;
  setToast: React.Dispatch<React.SetStateAction<string | null>>;
  templates?: any[];
}) {
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [fileName, setFileName] = useState("my-video");

  const handleRender = async () => {
    setShowSaveModal(false);
    setIsRendering(true);
    setProgress(0);
    try {
      const response = await fetch("http://localhost:3001/render", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clips,
          texts: textTracks.map((t) => ({
            content: t.content,
            start: t.startPosition,
            duration: t.duration,
            animation: t.animation,
          })),
          ratio,
          templates,
        }),
      });

      if (!response.ok) throw new Error("Render failed");

      const data = await response.json();
      const jobId = data.id;

      // Poll for progress
      while (true) {
        const statusRes = await fetch(
          `http://localhost:3001/progress/${jobId}`,
        );
        if (!statusRes.ok) throw new Error("Failed to check progress");

        const status = await statusRes.json();

        if (status.status === "done") {
          setProgress(100);
          setToast("Render complete! Downloading...");

          const response = await fetch(status.url);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${fileName}.mp4`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          break;
        } else if (status.status === "error") {
          throw new Error(status.error || "Render failed");
        } else {
          setProgress(Math.round(status.progress * 100));
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (e) {
      console.error(e);
      setToast("Error rendering video. Please try again.");
    } finally {
      setIsRendering(false);
      setProgress(0);
    }
  };

  return (
    <div className="flex items-center">
      <Button
        onClick={() => setShowSaveModal(true)}
        disabled={isRendering || clips.length === 0}
        className={twMerge(
          "relative min-w-[140px] overflow-hidden",
          textTracks ? "" : "",
          className,
        )}
      >
        {isRendering && (
          <div
            className="absolute left-0 top-0 h-full bg-white/20 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        )}
        {isRendering ? (
          <span className="relative z-10 flex items-center gap-2">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {progress}%
          </span>
        ) : (
          <>
            <Save size={16} className="mr-2" />
            Save
          </>
        )}
      </Button>

      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2">
            <h3 className="mb-4 text-lg font-medium text-zinc-100">
              Save Video
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">
                  Destination Filename
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Enter filename"
                    autoFocus
                    className="flex-1"
                  />
                  <span className="text-sm text-zinc-500">.mp4</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowSaveModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRender}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  Start Export
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
