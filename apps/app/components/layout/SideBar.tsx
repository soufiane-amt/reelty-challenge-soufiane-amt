import { LinkIcon, Upload } from "lucide-react";
import TextDock from "../text/text-dock";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { twMerge } from "tailwind-merge";

interface SideBarProps {
  sidebarTab: "media" | "text";
  setSidebarTab: React.Dispatch<React.SetStateAction<"media" | "text">>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;

  handleUrlImport: () => void;
  handleApplyText: () => void;
  handleDeleteText: () => void;
  importUrl: string;
  setImportUrl: React.Dispatch<React.SetStateAction<string>>;
  textInput: string;
  setTextInput: React.Dispatch<React.SetStateAction<string>>;

  selectedTextAnimation: string | null;
  setSelectedTextAnimation: React.Dispatch<React.SetStateAction<string | null>>;
  editingTrackId: string | null;
  setIsTextOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

function SideBar({
  sidebarTab,
  setSidebarTab,
  handleFileUpload,
  handleUrlImport,
  handleApplyText,
  handleDeleteText,
  importUrl,
  setImportUrl,
  textInput,
  setTextInput,
  selectedTextAnimation,
  setSelectedTextAnimation,
  editingTrackId,
  setIsTextOpen,
}: SideBarProps) {
  return (
    <aside className="w-80 shrink-0 border-r border-zinc-800 bg-zinc-900/50 flex flex-col z-40">
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setSidebarTab("media")}
          className={twMerge(
            "flex-1 py-3 text-sm font-medium transition-colors",
            sidebarTab === "media"
              ? "border-b-2 border-violet-500 text-violet-500"
              : "text-zinc-400 hover:text-zinc-200",
          )}
        >
          Media
        </button>
        <button
          onClick={() => setSidebarTab("text")}
          className={twMerge(
            "flex-1 py-3 text-sm font-medium transition-colors",
            sidebarTab === "text"
              ? "border-b-2 border-violet-500 text-violet-500"
              : "text-zinc-400 hover:text-zinc-200",
          )}
        >
          Text
        </button>
      </div>

      <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:hover:bg-zinc-500 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2">
        {sidebarTab === "media" && (
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
                Import Media
              </h3>
              <div className="grid gap-4">
                <Button
                  variant="outline"
                  className="h-24 w-full flex-col gap-2 border-dashed border-zinc-700 hover:border-violet-500 hover:bg-violet-500/5"
                  onClick={() =>
                    document.getElementById("video-upload")?.click()
                  }
                >
                  <Upload size={24} className="text-zinc-400" />
                  <span className="text-zinc-400">Upload from Device</span>
                </Button>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <div className="flex gap-2">
                  <Input
                    placeholder="Paste video URL..."
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    className="bg-zinc-950"
                  />
                  <Button size="icon" onClick={handleUrlImport}>
                    <LinkIcon size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {sidebarTab === "text" && (
          <TextDock
            isOpen={true}
            setIsOpen={setIsTextOpen}
            textInput={textInput}
            setTextInput={setTextInput}
            selectedTextAnimation={selectedTextAnimation}
            setSelectedTextAnimation={setSelectedTextAnimation}
            onApplyText={handleApplyText}
            onReset={handleDeleteText}
            hasAppliedText={!!editingTrackId}
          />
        )}
      </div>
    </aside>
  );
}

export default SideBar;
