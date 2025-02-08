"use client"

import * as React from "react"
import { X } from "lucide-react"
import dynamic from 'next/dynamic'
import { cn } from "@/lib/utils"

// Import types only
import type { Root, Trigger, Close, Portal, Overlay, Content } from '@radix-ui/react-dialog'

// Dynamically import individual components
const DialogRoot = dynamic<React.ComponentProps<typeof Root>>(() => 
  import('@radix-ui/react-dialog').then(mod => mod.Root), {
  ssr: true,
  loading: () => null
})

const DialogTrigger = dynamic<React.ComponentProps<typeof Trigger>>(() => 
  import('@radix-ui/react-dialog').then(mod => mod.Trigger), {
  ssr: true,
  loading: () => null
})

const DialogClose = dynamic<React.ComponentProps<typeof Close>>(() => 
  import('@radix-ui/react-dialog').then(mod => mod.Close), {
  ssr: true,
  loading: () => null
})

const DialogPortal = dynamic<React.ComponentProps<typeof Portal>>(() => 
  import('@radix-ui/react-dialog').then(mod => mod.Portal), {
  ssr: true,
  loading: () => null
})

const DialogOverlay = dynamic<React.ComponentProps<typeof Overlay>>(() => 
  import('@radix-ui/react-dialog').then(mod => mod.Overlay), {
  ssr: true,
  loading: () => null
})

const DialogContentPrimitive = dynamic<React.ComponentProps<typeof Content>>(() => 
  import('@radix-ui/react-dialog').then(mod => mod.Content), {
  ssr: true,
  loading: () => null
})

const Dialog = DialogRoot
const DialogContent = React.forwardRef<
  React.ElementRef<typeof Content>,
  React.ComponentPropsWithoutRef<typeof Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogContentPrimitive
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogClose>
    </DialogContentPrimitive>
  </DialogPortal>
))
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
