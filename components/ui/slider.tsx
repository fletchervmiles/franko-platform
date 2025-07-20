"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

type SliderProps = React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  /**
   * Additional className passed to the slider filled range element.
   */
  rangeClassName?: string
  /**
   * Additional className passed to the slider thumb element.
   */
  thumbClassName?: string
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, rangeClassName, thumbClassName, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-gray-200">
      <SliderPrimitive.Range className={cn("absolute h-full", rangeClassName ?? "bg-black")} />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className={cn("block h-2.5 w-2.5 rounded-full", thumbClassName ?? "bg-black")} />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
