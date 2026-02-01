"use client";

import { getConstrainedHeight, doIntervalsOverlap } from "@/data/constants";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePinchZoom } from "@/hooks/use-pinch-zoom";
import { SAMPLE_VIDEOS } from "@/data/sample-videos";
import { twMerge } from "tailwind-merge";
import { Plus } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import DraggableText from "../text/draggable-text";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableClip } from "../timeline/sortable-clip";
import { TimelineRuler } from "../timeline/timeline-ruler";
import Toast from "../ui/Toast";
import { trpc } from "@/api/client";
import { TextTrack } from "@/types/types";
import PreviewPlayer from "./PreviewPlayer";
import {
  findAvailableTextSlot,
  calculateSnappedTime,
} from "@/lib/timeline-utils";
import SideBar from "../layout/SideBar";
import Timeline from "../timeline/TimeLine";
import Header from "../layout/Header";

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

  const [activeClips, setActiveClips] = useState<typeof SAMPLE_VIDEOS>([]);
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

        let start = findAvailableTextSlot(
          textTracks,
          totalDuration,
          DEFAULT_DURATION,
        );
        if (start !== -1) {
          newStart = start;
          newDuration = DEFAULT_DURATION;
        } else {
          start = findAvailableTextSlot(
            textTracks,
            totalDuration,
            MIN_DURATION,
          );
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
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

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

      newStart = calculateSnappedTime(newStart, activeClips, snapThresholdSec);

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

      <Header
        ratio={ratio}
        textTracks={textTracks}
        setToast={setToast}
        templates={templates}
        activeClips={activeClips}
      />
      <div className="flex flex-1 overflow-hidden">
        <SideBar
          sidebarTab={sidebarTab}
          setSidebarTab={setSidebarTab}
          handleFileUpload={handleFileUpload}
          handleUrlImport={handleUrlImport}
          handleApplyText={handleApplyText}
          handleDeleteText={handleDeleteText}
          importUrl={importUrl}
          setImportUrl={setImportUrl}
          textInput={textInput}
          setTextInput={setTextInput}
          selectedTextAnimation={selectedTextAnimation}
          setSelectedTextAnimation={setSelectedTextAnimation}
          editingTrackId={editingTrackId}
          setIsTextOpen={setIsTextOpen}
        />
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
            <Timeline
              handleAddTextClick={handleAddTextClick}
              handleZoomChange={handleZoomChange}
              zoomLevel={zoomLevel}
              ratio={ratio}
            />
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
                    "mx-4 my-2 overflow-x-auto overflow-y-hidden pb-6 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:hover:bg-zinc-500 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-2",
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
