"use client"

import type { ReactNode } from "react"

export interface SharedModalCoreProps {
  children: ReactNode
}

/**
 * Temporary stub of the shared modal core. It simply renders its children.
 *
 * In the next phases we will migrate all business logic (agent selection,
 * message streaming, etc.) into this component / hook.
 */
export function SharedModalCore({ children }: SharedModalCoreProps) {
  return <>{children}</>
} 