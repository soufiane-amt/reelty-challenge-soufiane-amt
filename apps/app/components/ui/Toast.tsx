export default function Toast({ message }: { message: string }) {
  return (
    <div className="absolute top-6 left-1/2 z-[100] -translate-x-1/2 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/90 px-6 py-2.5 text-sm font-medium text-zinc-100 shadow-xl backdrop-blur-md">
        {message}
      </div>
    </div>
  );
}
