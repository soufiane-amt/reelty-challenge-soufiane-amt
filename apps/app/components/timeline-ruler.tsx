import React from "react";

interface TimelineRulerProps {
  duration: number;
  zoomLevel: number;
}

export const TimelineRuler = ({ duration, zoomLevel }: TimelineRulerProps) => {
  const ticks: any = [];

  const step = zoomLevel < 20 ? 5 : 1;

  for (let i = 0; i <= duration; i += step) {
    const isMajor = i % 5 === 0;

    ticks.push(
      <div
        key={i}
        className="absolute top-0 flex flex-col items-start"
        style={{ left: `${i * zoomLevel}px` }}
      >
        <div
          className={`border-l border-zinc-700 ${isMajor ? "h-3" : "h-1.5"}`}
        />
        {isMajor && (
          <span className="text-[10px] text-zinc-500 -ml-1 mt-0.5 font-mono select-none">
            {formatTime(i)}
          </span>
        )}
      </div>,
    );
  }

  return (
    <div className="absolute top-0 left-0 w-full h-8 pointer-events-none z-10">
      {ticks}
    </div>
  );
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
