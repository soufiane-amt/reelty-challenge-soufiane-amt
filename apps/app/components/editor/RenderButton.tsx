"use client";
import { Button } from "../ui/button";
import { useState } from "react";
import { Clip, TextTrack } from "@/types/types";
import { twMerge } from "tailwind-merge";
import { Input } from "../ui/input";
import { Save } from "lucide-react";

function RenderButton({
  clips,
  ratio,
  textTracks,
  className,
  setToast,
  templates,
}: {
  clips: Clip[];
  ratio: "portrait" | "landscape";
  textTracks: TextTrack[];
  className?: string;
  setToast: React.Dispatch<React.SetStateAction<string | null>>;
  templates?: any[];
}) {
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [fileName, setFileName] = useState("my-video");

  const handleRender = async () => {
    setShowSaveModal(false);
    setIsRendering(true);
    setProgress(0);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_RENDER_SERVER_URL}/render`,
        {
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
              animation: t.animation,
            })),
            ratio,
            templates,
          }),
        },
      );

      if (!response.ok) throw new Error("Render failed");

      const data = await response.json();
      const jobId = data.id;

      while (true) {
        const statusRes = await fetch(
          `${process.env.NEXT_PUBLIC_RENDER_SERVER_URL}/progress/${jobId}`,
        );
        if (!statusRes.ok) throw new Error("Failed to check progress");

        const status = await statusRes.json();

        if (status.status === "done") {
          setProgress(100);
          setToast("Render complete! Downloading...");

          const response = await fetch(status.url);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${fileName}.mp4`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          break;
        } else if (status.status === "error") {
          throw new Error(status.error || "Render failed");
        } else {
          setProgress(Math.round(status.progress * 100));
        }

        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (e) {
      console.error(e);
      setToast("Error rendering video. Please try again.");
    } finally {
      setIsRendering(false);
      setProgress(0);
    }
  };

  return (
    <div className="flex items-center">
      <Button
        onClick={() => setShowSaveModal(true)}
        disabled={isRendering || clips.length === 0}
        className={twMerge(
          "relative min-w-[140px] overflow-hidden",
          textTracks ? "" : "",
          className,
        )}
      >
        {isRendering && (
          <div
            className="absolute left-0 top-0 h-full bg-white/20 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        )}
        {isRendering ? (
          <span className="relative z-10 flex items-center gap-2">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
            {progress}%
          </span>
        ) : (
          <>
            <Save size={16} className="mr-2" />
            Save
          </>
        )}
      </Button>

      {showSaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2">
            <h3 className="mb-4 text-lg font-medium text-zinc-100">
              Save Video
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-zinc-400">
                  Destination Filename
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="Enter filename"
                    autoFocus
                    className="flex-1"
                  />
                  <span className="text-sm text-zinc-500">.mp4</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowSaveModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRender}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  Start Export
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default RenderButton;
