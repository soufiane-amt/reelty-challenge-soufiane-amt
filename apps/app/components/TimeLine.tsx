import { Layers, Type } from "lucide-react";
import { Button } from "./ui/button";
import Magnifier from "./magnifier";

interface TimelineProps {
  handleAddTextClick: () => void;
  handleZoomChange: (newZoom: number) => void;
  zoomLevel?: number;
  ratio: "portrait" | "landscape";
}

function Timeline({
  handleAddTextClick,
  handleZoomChange,
  zoomLevel,
  ratio,
}: TimelineProps) {
  return (
    <div className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 px-4 bg-zinc-900/50">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-wider">
          <Layers size={14} />
          <span>Timeline</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
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
  );
}

export default Timeline;
