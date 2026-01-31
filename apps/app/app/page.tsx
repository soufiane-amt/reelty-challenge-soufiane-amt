import VideoEditor from "@/components/video-editor";

export default function Home() {
  return (
    <div className="flex h-screen max-h-screen w-full flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="flex h-full max-h-full flex-1 flex-col overflow-hidden">
        <VideoEditor />
      </div>
    </div>
  );
}
