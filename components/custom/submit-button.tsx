"use client";

import { useFormStatus } from "react-dom";

import { LoaderIcon } from "@/components/custom/icons";

import { Button } from "../ui/button";

// SubmitButton component - A reusable button component for form submissions
// that handles loading states and accessibility
export function SubmitButton({ children }: { children: React.ReactNode }) {
  // Get the current form submission state using the useFormStatus hook
  // 'pending' indicates if a form submission is in progress
  const { pending } = useFormStatus();

  return (
    <Button
      // Dynamically change button type based on pending state
      // Prevents double submissions by changing to 'button' while pending
      type={pending ? "button" : "submit"}
      // Disable the button while submission is pending
      aria-disabled={pending}
      // Style classes for the button
      className="relative text-white"
    >
      {/* Main button content passed as children */}
      {children}

      {/* Loading spinner that appears during form submission */}
      {pending && (
        <span className="animate-spin absolute right-4">
          <LoaderIcon />
        </span>
      )}

      {/* Screen reader text for accessibility */}
      <span aria-live="polite" className="sr-only" role="status">
        {pending ? "Loading" : "Submit form"}
      </span>
    </Button>
  );
}
