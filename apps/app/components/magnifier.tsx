"use client";

import { ZoomIn, ZoomOut } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

interface MagnifierProps {
  onZoomChange: (zoom: number) => void;
  initialZoom?: number;
  ratio: "portrait" | "landscape";
  isLoading?: boolean;
  externalZoom?: number;
  minZoom?: number;
  maxZoom?: number;
}

const Magnifier = ({
  onZoomChange,
  initialZoom = 1.0,
  ratio,
  isLoading = false,
  externalZoom,
  minZoom: propMin,
  maxZoom: propMax,
}: MagnifierProps) => {
  const [zoom, setZoom] = useState(initialZoom);
  const onZoomChangeRef = useRef(onZoomChange);
  const [isInitialized, setIsInitialized] = useState(false);
  const getZoomLimits = () =>
    propMin && propMax
      ? { min: propMin, max: propMax }
      : ratio === "landscape"
        ? { min: 100 / 225, max: 500 / 225 }
        : { min: 150 / 320, max: 700 / 320 };
  const { min: minZoom, max: maxZoom } = getZoomLimits();

  useEffect(() => {
    onZoomChangeRef.current = onZoomChange;
  }, [onZoomChange]);

  useEffect(() => {
    if (isInitialized) return;
    const storageKey = `clip-zoom-level-${ratio}`;
    const savedZoom =
      typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;
    if (savedZoom) {
      const parsedZoom = parseFloat(savedZoom);
      if (parsedZoom >= minZoom && parsedZoom <= maxZoom) {
        setZoom(parsedZoom);
        onZoomChangeRef.current(parsedZoom);
      } else {
        setZoom(initialZoom);
        onZoomChangeRef.current(initialZoom);
      }
    } else {
      setZoom(initialZoom);
      onZoomChangeRef.current(initialZoom);
    }
    setIsInitialized(true);
  }, [isInitialized, initialZoom, ratio, minZoom, maxZoom]);

  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem(`clip-zoom-level-${ratio}`, zoom.toString());
    }
  }, [zoom, isInitialized, ratio]);

  useEffect(() => {
    if (externalZoom !== undefined && externalZoom !== zoom && isInitialized)
      setZoom(externalZoom);
  }, [externalZoom, zoom, isInitialized]);

  const handleZoomChange = (newZoom: number) => {
    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
    setZoom(clampedZoom);
    onZoomChangeRef.current(clampedZoom);
  };

  return (
    <div
      className={twMerge(
        "flex items-end justify-center rounded-2xl border border-zinc-800 bg-zinc-900 px-3.5 py-4",
        isLoading && "opacity-50",
      )}
    >
      <button
        onClick={() => handleZoomChange(zoom - 0.1)}
        disabled={zoom <= minZoom || isLoading}
        className="disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ZoomOut size={24} className="text-zinc-400 hover:text-zinc-100" />
      </button>
      <div className="relative mx-3 flex-1">
        <input
          type="range"
          min={minZoom}
          max={maxZoom}
          step={0.1}
          value={zoom}
          onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
          className="slider h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, #7c3aed 0%, #7c3aed ${((zoom - minZoom) / (maxZoom - minZoom)) * 100}%, #27272a ${((zoom - minZoom) / (maxZoom - minZoom)) * 100}%, #27272a 100%)`,
          }}
          disabled={isLoading}
        />
      </div>
      <button
        onClick={() => handleZoomChange(zoom + 0.1)}
        disabled={zoom >= maxZoom || isLoading}
        className="disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ZoomIn size={24} className="text-zinc-400 hover:text-zinc-100" />
      </button>
    </div>
  );
};

export default Magnifier;
