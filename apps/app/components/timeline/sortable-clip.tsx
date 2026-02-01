"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import VideoClipCard from "./video-clip-card";
import { ComponentProps } from "react";

interface SortableClipProps extends ComponentProps<typeof VideoClipCard> {
  id: string;
}

export function SortableClip(props: SortableClipProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    position: "relative" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex-shrink-0"
    >
      <VideoClipCard {...props} />
    </div>
  );
}
