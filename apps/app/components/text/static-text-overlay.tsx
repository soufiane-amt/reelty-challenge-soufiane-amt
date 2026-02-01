"use client";

import { Type } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface StaticTextOverlayProps {
  textContent: string;
  startPosition: number;
  duration: number;
  isActive: boolean;
  totalClips: number;
  clipWidth: number;
  gap: number;
  onClick?: () => void;
  zoomLevel?: number;
}

export default function StaticTextOverlay({
  textContent,
  startPosition,
  duration,
  isActive,
  clipWidth,
  gap,
  onClick,
}: StaticTextOverlayProps) {
  const xPosition = startPosition * (clipWidth + gap);
  const width = clipWidth * duration + gap * (duration - 1) - 15;

  if (!isActive || !textContent) {
    return (
      <div className="group flex items-center px-6">
        <div
          className="flex items-center"
          style={{ transform: "translateX(0px)" }}
        >
          <div
            className={twMerge(
              "relative flex items-center gap-2 rounded-lg border-2 bg-zinc-800 px-5 py-2 shadow transition-colors",
              "border-zinc-700 cursor-pointer hover:border-violet-500",
            )}
            style={{ width: `${clipWidth}px` }}
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

  return (
    <div className="group flex items-center px-6">
      <div
        className="flex items-center"
        style={{ transform: `translateX(${xPosition}px)` }}
      >
        <div
          className={twMerge(
            "relative flex items-center gap-2 rounded-lg border-2 px-5 py-2 shadow-md transition-colors",
            isActive
              ? "border-violet-500 bg-zinc-800 cursor-move"
              : "border-zinc-700 bg-zinc-800",
          )}
          style={{ width: `${width}px` }}
          onClick={onClick}
        >
          <div className="relative flex items-center gap-2 pl-5">
            <button
              className={twMerge(
                "flex size-8 items-center justify-center rounded-md border transition-all",
                isActive
                  ? "border-violet-600 bg-violet-600 text-white hover:bg-violet-700"
                  : "border-zinc-600 bg-zinc-700 text-zinc-400 hover:bg-zinc-600",
              )}
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
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
        </div>
      </div>
    </div>
  );
}
