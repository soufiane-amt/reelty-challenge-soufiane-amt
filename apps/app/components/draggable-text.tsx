"use client";

import { Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";

interface DraggableTextProps {
  id: string;
  textContent: string;
  startPosition: number;
  duration: number;
  isActive: boolean;
  totalClips: number;
  zoomLevel: number;
  onStartPositionChange?: (position: number) => void;
  onDurationChange?: (duration: number) => void;
  onActiveChange?: (active: boolean) => void;
  onClick?: () => void;
  className?: string;
  scrollContainerRef?: React.RefObject<HTMLDivElement>;
}

export default function DraggableText({
  id,
  textContent,
  startPosition,
  duration,
  isActive,
  zoomLevel,
  totalClips,
  onActiveChange,
  onClick,
  onDurationChange,
  className,
}: DraggableTextProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });
  const xPosition = startPosition * zoomLevel;
  const width = duration * zoomLevel;

  const currentX = xPosition + (transform ? transform.x : 0);

  if (!textContent) {
    return (
      <div className={cn("group flex items-center", className)}>
        <div
          className="flex items-center justify-center"
          style={{ width: "100%" }}
        >
          <div
            className={cn(
              "relative flex items-center gap-2 rounded-lg border-2 bg-zinc-800 px-5 py-2 shadow transition-colors",
              "border-zinc-700 cursor-pointer hover:border-violet-500",
            )}
            style={{ width: "100%", maxWidth: "200px" }}
            onClick={onClick}
          >
            <div className="relative flex items-center gap-2 pl-2">
              <button
                className="flex size-8 items-center justify-center rounded-md border border-zinc-600 bg-zinc-700 text-zinc-400 transition-all hover:bg-zinc-600 hover:text-zinc-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick?.();
                }}
              >
                <Type size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startDuration = duration;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaSeconds = deltaX / zoomLevel;

      const newDuration = Math.max(0.5, startDuration + deltaSeconds);

      if (newDuration !== duration) {
        onDurationChange?.(newDuration);
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  return (
    <div
      className={cn("absolute top-4 z-20 flex items-center", className)}
      style={{ left: 0 }}
    >
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className="flex items-center touch-none"
        style={{ transform: `translateX(${currentX}px)`, width: `${width}px` }}
      >
        <div
          className={cn(
            "relative flex items-center gap-2 rounded-lg border-2 px-5 py-2 shadow-md cursor-move",
            isActive
              ? "border-violet-500 bg-zinc-800"
              : "border-zinc-700 bg-zinc-800",
          )}
          style={{ width: "100%", height: "100%" }}
          onClick={onClick}
        >
          <div className="relative flex items-center gap-2 pl-2">
            <button
              className={cn(
                "flex size-8 items-center justify-center rounded-md border transition-colors",
                isActive
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-zinc-600 bg-zinc-700 text-zinc-400",
              )}
              onClick={(e) => {
                e.stopPropagation();
                onActiveChange?.(!isActive);
              }}
            >
              <Type
                size={16}
                className={isActive ? "text-white" : "text-zinc-400"}
              />
            </button>
            {isActive && textContent && (
              <span className="text-sm whitespace-nowrap text-zinc-100">
                {textContent}
              </span>
            )}
          </div>
          <div
            className="absolute right-0 top-0 flex h-full w-6 cursor-ew-resize items-center justify-center rounded-r-lg hover:bg-white/5"
            onPointerDown={handleResizePointerDown}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="h-4 w-1 rounded-full bg-zinc-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
