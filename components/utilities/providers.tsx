"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes";
import { QueryProvider } from "./query-provider";
import { FeedbackModalProvider } from "../contexts/feedback-modal-context";
import FeedbackComponent from "../feedback-component";

export const Providers = ({ children, ...props }: ThemeProviderProps) => {
  return (
    <NextThemesProvider {...props}>
      <QueryProvider>
        <FeedbackModalProvider>
          <TooltipProvider>
            {children}
            <FeedbackComponent />
          </TooltipProvider>
        </FeedbackModalProvider>
      </QueryProvider>
    </NextThemesProvider>
  );
};