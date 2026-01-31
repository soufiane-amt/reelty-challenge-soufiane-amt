export default function Toast({ message }: { message: string }) {
  return (
    <div className="absolute top-6 left-1/2 z-[100] -translate-x-1/2 animate-in fade-in slide-in-from-top-2">
      <div className="rounded-full bg-red-500 px-6 py-2.5 text-sm font-medium text-white shadow-xl">
        {message}
      </div>
    </div>
  );
}
