"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
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

const DialogContent = dynamic<React.ComponentProps<typeof Content>>(() => 
  import('@radix-ui/react-dialog').then(mod => mod.Content), {
  ssr: true,
  loading: () => null
})

// Re-export with Sheet naming
const Sheet = DialogRoot
const SheetTrigger = DialogTrigger
const SheetClose = DialogClose
const SheetPortal = DialogPortal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof Overlay>,
  React.ComponentPropsWithoutRef<typeof Overlay>
>(({ className, ...props }, ref) => (
  <DialogOverlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = "SheetOverlay"

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogContent
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetClose>
    </DialogContent>
  </SheetPortal>
))
SheetContent.displayName = "SheetContent"

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
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
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof Content>,
  React.ComponentPropsWithoutRef<typeof Content>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof Content>,
  React.ComponentPropsWithoutRef<typeof Content>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = "SheetDescription"

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetPortal,
  SheetOverlay,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
