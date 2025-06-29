"use client"
import dynamic from "next/dynamic"
import type { WidgetPreviewProps } from "@/components/multi-agent/agents/widget-preview"
import { SharedModalCore } from "@/components/chat/shared-modal-core"
import { useEffect, useCallback, useState } from "react"
import { X } from "lucide-react"

// Dynamically import existing WidgetPreview (client-only)
const WidgetPreview = dynamic(() => import("@/components/multi-agent/agents/widget-preview"), { ssr: false })

/**
 * EmbeddedChatModal – production-grade fullscreen modal used by the public
 * embed script. At the moment this is a thin wrapper around the existing
 * WidgetPreview component, wrapped in the SharedModalCore so that we can
 * migrate business logic gradually without breaking existing behaviour.
 */
export function EmbeddedChatModal(props: WidgetPreviewProps) {
  const [isVisible, setIsVisible] = useState(true)

  // Close handler – hides iframe by calling parent script
  const handleClose = useCallback(() => {
    // Trigger fade-out animation first
    setIsVisible(false)
    // After animation complete, call parent close (200ms)
    setTimeout(() => {
      if (typeof window !== "undefined" && (window.parent as any)?.FrankoModal?.close) {
        (window.parent as any).FrankoModal.close()
      }
    }, 200)
  }, [])

  // ESC-key support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [handleClose])

  return (
    <SharedModalCore>
      <div
        className="fixed inset-0 flex flex-col items-center justify-center bg-[#F9F8F6]"
        style={{
          touchAction: "manipulation",
          overscrollBehavior: "none",
          transition: "opacity 0.2s ease",
          opacity: isVisible ? 1 : 0,
        }}
      >
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-end px-4">
          <button
            onClick={handleClose}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-black/5 focus:outline-none"
            aria-label="Close chat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat content */}
        <div className="flex-1 w-full max-w-none flex items-center justify-center px-2 md:px-0 pb-6 pt-12">
          <WidgetPreview {...props} />
        </div>
      </div>
    </SharedModalCore>
  )
}

export default EmbeddedChatModal 