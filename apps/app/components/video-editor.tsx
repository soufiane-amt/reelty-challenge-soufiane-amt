"use client";

import { getConstrainedHeight, doIntervalsOverlap } from "@/data/constants";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePinchZoom } from "@/hooks/use-pinch-zoom";
import { SAMPLE_VIDEOS } from "@/data/sample-videos";
import VideoClipCard from "./video-clip-card";
import { twMerge } from "tailwind-merge";
import { Button } from "./ui/button";
import Magnifier from "./magnifier";
import { Plus, Type } from "lucide-react";
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

interface TextTrack {
  id: string;
  content: string;
  animation: string;
  startPosition: number;
  duration: number;
}

export default function tchVideoEditor() {
  const ratio: "portrait" | "landscape" = "portrait";
  const [zoomLevel, setZoomLevel] = useState(30); // Pixels per second
  const clipsScrollContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [textTracks, setTextTracks] = useState<TextTrack[]>([]);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);

  const [textInput, setTextInput] = useState("");
  const [selectedTextAnimation, setSelectedTextAnimation] = useState<
    string | null
  >(null);
  const [isTextOpen, setIsTextOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
      setTextInput(track.content);
      setSelectedTextAnimation(track.animation);
      setIsTextOpen(true);
    }
  };

  const handleAddTextClick = () => {
    setEditingTrackId(null);
    setTextInput("");
    setSelectedTextAnimation(null);
    setIsTextOpen(true);
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

  const totalTimelineDuration = activeClips.reduce(
    (acc, clip) => acc + clip.duration,
    0,
  );

  return (
    <div className="relative flex h-full max-h-full flex-col overflow-hidden">
      {toast && (
        <Toast message={toast} />
      )}
      <div className="shrink-0 p-6 md:px-8 md:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <p className="text-lg font-medium">Edit</p>
            </div>
            <div className="size-1.5 rounded-full bg-[#D9D9D9]" />
            <div className="flex items-center space-x-1">
              <p className="line-clamp-1">Video Editor</p>
            </div>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddTextClick}
              className="gap-2"
            >
              <Type size={16} />
              Add Text
            </Button>
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
      </div>

      <TextDock
        isOpen={isTextOpen}
        setIsOpen={setIsTextOpen}
        textInput={textInput}
        setTextInput={setTextInput}
        selectedTextAnimation={selectedTextAnimation}
        setSelectedTextAnimation={setSelectedTextAnimation}
        onApplyText={handleApplyText}
        onReset={handleDeleteText}
        hasAppliedText={!!editingTrackId}
      />

      <div
        ref={containerRef}
        className="scrollbar scrollbar-w-1.5 scrollbar-thumb-[#E9E9E9] scrollbar-thumb-rounded-full scrollbar-hover:scrollbar-thumb-black relative flex flex-1 flex-col justify-center overflow-hidden overflow-y-auto rounded-3xl border border-[#F6F6F6] bg-white md:flex"
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
              "scrollbar scrollbar-h-1.5 scrollbar-thumb-[#E9E9E9] scrollbar-thumb-rounded-full scrollbar-hover:scrollbar-thumb-black mx-6 mb-2.5 overflow-x-auto overflow-y-hidden pb-6",
              isTextOpen && "opacity-10",
            )}
          >
            <div
              className="relative"
              style={{ width: `${totalTimelineDuration * zoomLevel}px` }}
            >
              <TimelineRuler
                duration={totalTimelineDuration}
                zoomLevel={zoomLevel}
              />
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
                  className="px-0 top-9"
                />
              ))}

              <div className="flex items-center pt-24">
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
                    />
                  ))}
                </SortableContext>
              </div>
            </div>
            {removedClips.length > 0 && (
              <div className="mt-4 flex gap-4">
                {/* Removed clips UI - kept separate from timeline track */}
                <div
                  className={twMerge(
                    "flex size-11 items-center justify-center rounded-lg border",
                    "border-[#EDEDED] bg-[#FBFBFB] shadow-md",
                  )}
                >
                  <Plus size={24} className="text-[#A3A3A3] duration-300" />
                </div>
              </div>
            )}
          </div>
        </DndContext>
      </div>

      <div className="shrink-0 p-6 md:px-8 md:py-4">
        <RenderButton
          clips={activeClips}
          ratio={ratio}
          textTracks={textTracks}
        />
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
}: {
  clips: typeof SAMPLE_VIDEOS;
  ratio: "portrait" | "landscape";
  textTracks: TextTrack[];
}) {
  const [isRendering, setIsRendering] = useState(false);

  const handleRender = async () => {
    setIsRendering(true);
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
          })),
          ratio,
        }),
      });

      if (!response.ok) throw new Error("Render failed");

      const data = await response.json();
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (e) {
      console.error(e);
      alert("Error rendering video");
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="flex items-center justify-end">
      <Button
        onClick={handleRender}
        disabled={isRendering || clips.length === 0}
        className="min-w-[120px]"
      >
        {isRendering ? (
          <span className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Rendering...
          </span>
        ) : (
          "Render Video"
        )}
      </Button>
    </div>
  );
}
