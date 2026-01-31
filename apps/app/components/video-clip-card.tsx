"use client";

import { useRef } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { twMerge } from "tailwind-merge";

interface VideoClipCardProps {
  id: string;
  videoUrl: string;
  ratio: "portrait" | "landscape";
  height: number;
  index: number;
  isRemoved?: boolean;
  onRemove?: (id: string) => void;
  onAdd?: (id: string) => void;
  width?: number;
}

export default function VideoClipCard({
  id,
  videoUrl,
  ratio,
  height,
  isRemoved = false,
  onRemove,
  onAdd,
  width,
}: VideoClipCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isRemoved && onAdd) onAdd(id);
    else if (!isRemoved && onRemove) onRemove(id);
  };

  return (
    <div
      className={cn(
        "relative rounded-xl bg-black/5",
        !width && (ratio === "landscape" ? "aspect-video" : "aspect-9/16"),
      )}
      style={{
        height: `${height}px`,
        width: width ? `${width}px` : undefined,
        flexShrink: 0,
      }}
      onClick={() => isRemoved && onAdd?.(id)}
    >
      <div
        className={twMerge(
          "relative size-full rounded-xl bg-black/20",
          !isRemoved && "cursor-move",
        )}
      >
        <div
          className={twMerge(
            "relative size-full overflow-hidden rounded-xl duration-300",
            isRemoved && "cursor-pointer opacity-50 hover:opacity-70",
          )}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            className="size-full object-cover"
            muted
            preload="metadata"
            disablePictureInPicture
            playsInline
            loop
            autoPlay
          />
        </div>
        <button
          type="button"
          className="absolute -top-2 -right-2 z-30 flex size-6 items-center justify-center rounded-md border-2 border-[#EDEDED] bg-black text-white duration-200 hover:scale-[1.1] hover:transform"
          onClick={handleButtonClick}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {isRemoved ? (
            <Plus size={12} strokeWidth={2.5} />
          ) : (
            <Minus size={12} strokeWidth={2.5} />
          )}
        </button>
      </div>
    </div>
  );
}
