"use client"
import dynamic from "next/dynamic"
import type { WidgetPreviewProps } from "@/components/multi-agent/agents/widget-preview"
import { SharedModalCore } from "@/components/chat/shared-modal-core"
import { useEffect, useCallback, useState } from "react"

// Dynamically import existing WidgetPreview (client-only)
const WidgetPreview = dynamic(() => import("@/components/multi-agent/agents/widget-preview"), { ssr: false })

export type DisplayMode = "modal" | "standalone"

interface EmbeddedChatModalProps extends WidgetPreviewProps {
  displayMode: DisplayMode
  requirePreChatForm?: boolean
}

/**
 * EmbeddedChatModal – production-grade fullscreen modal used by the public
 * embed script. At the moment this is a thin wrapper around the existing
 * WidgetPreview component, wrapped in the SharedModalCore so that we can
 * migrate business logic gradually without breaking existing behaviour.
 */
export function EmbeddedChatModal({ displayMode, requirePreChatForm = false, ...rest }: EmbeddedChatModalProps) {
  const [isVisible, setIsVisible] = useState(true)

  // Close handler – hides iframe by calling parent script via postMessage
  const handleClose = useCallback(() => {
    // Trigger fade-out animation first
    setIsVisible(false)
    // After animation complete, send close message to parent (200ms)
    setTimeout(() => {
      if (typeof window !== "undefined" && window.parent !== window) {
        // Use postMessage for cross-origin communication
        window.parent.postMessage({ type: 'FRANKO_CLOSE' }, '*')
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

  // Listen for visibility reset from parent window
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'RESET_VISIBILITY') {
        setIsVisible(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Handle clicks outside modal content (only for modal mode, not standalone)
  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if (displayMode === "modal" && e.target === e.currentTarget) {
      handleClose()
    }
  }, [displayMode, handleClose])

  return (
    <SharedModalCore>
      <div
        className="fixed inset-0 flex flex-col"
        onClick={handleBackgroundClick}
        style={{
          touchAction: "manipulation",
          overscrollBehavior: "contain",
          transition: "opacity 0.2s ease",
          opacity: isVisible ? 1 : 0,
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          background: displayMode === "modal" ? "rgba(0,0,0,0.35)" : "#F9F8F6",
          backdropFilter: displayMode === "modal" ? "blur(4px)" : undefined,
        }}
      >
        {/* Mobile: Full-screen layout */}
        <div className="flex-1 flex flex-col min-h-0 md:hidden">
          <WidgetPreview 
            {...rest}
            requirePreChatForm={requirePreChatForm}
            isEmbedMode
            displayMode={displayMode}
            onClose={handleClose}
          />
        </div>

        {/* Desktop: Fixed-size centered modal */}
        <div className="hidden md:flex flex-1 items-center justify-center p-4" onClick={handleBackgroundClick}>
          <div 
            className="w-full max-w-[800px] h-[600px] flex flex-col"
            onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
            style={{
              maxHeight: "calc(100vh - 2rem)", // Ensure it fits in viewport with padding
            }}
          >
            <WidgetPreview 
              {...rest}
              requirePreChatForm={requirePreChatForm}
              isEmbedMode
              displayMode={displayMode}
              onClose={handleClose}
            />
          </div>
        </div>
      </div>
    </SharedModalCore>
  )
}

export default EmbeddedChatModal 