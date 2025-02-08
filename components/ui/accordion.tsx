"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import dynamic from 'next/dynamic'
import { cn } from "@/lib/utils"

// Import types only
import type { Root, Item, Header, Trigger, Content } from '@radix-ui/react-accordion'

// Dynamically import individual components
const AccordionRoot = dynamic<React.ComponentProps<typeof Root>>(() => 
  import('@radix-ui/react-accordion').then(mod => mod.Root), {
  ssr: true,
  loading: () => null
})

const AccordionItemPrimitive = dynamic<React.ComponentProps<typeof Item>>(() => 
  import('@radix-ui/react-accordion').then(mod => mod.Item), {
  ssr: true,
  loading: () => null
})

const AccordionHeaderPrimitive = dynamic<React.ComponentProps<typeof Header>>(() => 
  import('@radix-ui/react-accordion').then(mod => mod.Header), {
  ssr: true,
  loading: () => null
})

const AccordionTriggerPrimitive = dynamic<React.ComponentProps<typeof Trigger>>(() => 
  import('@radix-ui/react-accordion').then(mod => mod.Trigger), {
  ssr: true,
  loading: () => null
})

const AccordionContentPrimitive = dynamic<React.ComponentProps<typeof Content>>(() => 
  import('@radix-ui/react-accordion').then(mod => mod.Content), {
  ssr: true,
  loading: () => null
})

const Accordion = AccordionRoot

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof Item>,
  React.ComponentPropsWithoutRef<typeof Item>
>(({ className, ...props }, ref) => (
  <AccordionItemPrimitive
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof Trigger>,
  React.ComponentPropsWithoutRef<typeof Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionHeaderPrimitive className="flex">
    <AccordionTriggerPrimitive
      ref={ref}
      className={cn(
        "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </AccordionTriggerPrimitive>
  </AccordionHeaderPrimitive>
))
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof Content>,
  React.ComponentPropsWithoutRef<typeof Content>
>(({ className, children, ...props }, ref) => (
  <AccordionContentPrimitive
    ref={ref}
    className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionContentPrimitive>
))
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
