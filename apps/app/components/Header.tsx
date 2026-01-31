import { VideoIcon } from "lucide-react";
import RenderButton from "./RenderButton";
import { SAMPLE_VIDEOS } from "@/data/sample-videos";
import { TextTrack } from "@/types/types";

interface HeaderProps {
  ratio: "portrait" | "landscape";
  textTracks: TextTrack[];
  setToast: React.Dispatch<React.SetStateAction<string | null>>;
  templates?: any[];
  activeClips: typeof SAMPLE_VIDEOS;
}

function Header({
  ratio,
  textTracks,
  setToast,
  templates,
  activeClips,
}: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-6 z-50">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
          <VideoIcon size={18} />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-tight text-zinc-100">
            Untitled Project
          </h1>
          <p className="text-xs text-zinc-500">Last edited just now</p>
        </div>
      </div>
      <RenderButton
        clips={activeClips}
        ratio={ratio}
        textTracks={textTracks}
        setToast={setToast}
        templates={templates}
        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 shadow-lg shadow-violet-500/20"
      />
    </header>
  );
}

export default Header;
