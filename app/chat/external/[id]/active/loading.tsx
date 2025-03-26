import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="h-[100dvh] bg-[#F9F8F6] flex items-center justify-center p-4"
      style={{
        touchAction: "manipulation",
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        overscrollBehavior: 'none'
      }}
    >
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="text-sm text-gray-500">Loading chat...</p>
      </div>
    </div>
  );
} 