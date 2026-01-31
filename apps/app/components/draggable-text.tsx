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
              "relative flex items-center gap-2 rounded-lg border-2 bg-white px-5 py-2 shadow transition-colors",
              "border-[#EDEDED] cursor-pointer hover:border-[#8E2DF6]",
            )}
            style={{ width: "100%", maxWidth: "200px" }}
            onClick={onClick}
          >
            <div className="relative flex items-center gap-2 pl-2">
              <button
                className="flex size-8 items-center justify-center rounded-md border border-[#E9E9E9] bg-[#F5F5F5] text-[#A3A3A3] transition-all hover:bg-white"
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
            "relative flex items-center gap-2 rounded-lg border-2 bg-white px-5 py-2 shadow-md cursor-move",
            isActive
              ? "border-[#8E2DF6] bg-white"
              : "border-[#F5F5F5] bg-[#F5F5F5]",
          )}
          style={{ width: "100%", height: "100%" }}
          onClick={onClick}
        >
          <div className="relative flex items-center gap-2 pl-2">
            <button
              className={cn(
                "flex size-8 items-center justify-center rounded-md border transition-colors",
                isActive
                  ? "border-black bg-black text-white"
                  : "border-[#E9E9E9] bg-white text-[#A3A3A3]",
              )}
              onClick={(e) => {
                e.stopPropagation();
                onActiveChange?.(!isActive);
              }}
            >
              <Type
                size={16}
                className={isActive ? "text-white" : "text-[#A3A3A3]"}
              />
            </button>
            {isActive&& textContent && (
              <span className="text-sm whitespace-nowrap text-black">
                {textContent}
              </span>
            )}
          </div>
          <div
            className="absolute right-0 top-0 flex h-full w-6 cursor-ew-resize items-center justify-center rounded-r-lg hover:bg-black/5"
            onPointerDown={handleResizePointerDown}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="h-4 w-1 rounded-full bg-gray-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
