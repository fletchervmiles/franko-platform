"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"

interface HelpDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function HelpDrawer({ isOpen, onClose }: HelpDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-[400px] sm:w-[400px] border-l p-0 flex flex-col bg-white">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex justify-between items-center">
             <SheetTitle className="text-lg font-semibold">Understanding Personas</SheetTitle>
           </div>
           <SheetDescription className="text-sm text-gray-500 text-left">
              Learn how to use personas to segment your feedback
            </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="space-y-2">
            <h3 className="text-base font-semibold">What are personas?</h3>
            <p className="text-sm text-gray-600">
              Personas represent distinct user types who interact with your product. Each persona has different goals,
              needs, and behaviors. The AI will automatically tag interviews to the most relevant persona.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold">Benefits of using personas</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-600">
              <li>See how satisfaction (PMF) varies across different user types</li>
              <li>Identify which personas find the most value in your product</li>
              <li>Understand unique pain points for each user segment</li>
              <li>Prioritize features based on persona needs</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold">Tips for effective personas</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-600">
              <li>
                <strong>Keep it simple:</strong> Aim for 3-5 distinct personas that represent your core user types
              </li>
              <li>
                <strong>Be specific:</strong> Use clear labels and descriptions to differentiate between personas
              </li>
              <li>
                <strong>Focus on needs:</strong> Consider the jobs-to-be-done for each persona
              </li>
              <li>
                <strong>Update regularly:</strong> As your user base evolves, revisit and refine your personas
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold">Managing your personas</h3>
            <p className="text-sm text-gray-600">
              We automatically create system-seeded personas based on your website and context data. You can:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-600">
              <li>Edit labels and descriptions to better match your understanding of users</li>
              <li>Delete personas that aren't relevant (labels will switch to unassigned)</li>
              <li>Merge similar personas when they represent the same user type</li>
              <li>Add new personas (maximum 5 active personas at a time)</li>
            </ul>
          </div>
        </div>

        <SheetFooter className="px-6 py-4 border-t mt-auto">
          <Button onClick={onClose} className="w-full">
            Got it
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
