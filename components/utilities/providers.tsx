"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes";
import { QueryProvider } from "./query-provider";
import { FeedbackModalProvider } from "../contexts/feedback-modal-context";
import { ProfileProvider } from "../contexts/profile-context";
import FeedbackComponent from "../feedback-component";

export const Providers = ({ children, ...props }: ThemeProviderProps) => {
  return (
    <NextThemesProvider {...props}>
      <QueryProvider>
        <FeedbackModalProvider>
          <ProfileProvider>
            <TooltipProvider>
              {children}
              <FeedbackComponent />
            </TooltipProvider>
          </ProfileProvider>
        </FeedbackModalProvider>
      </QueryProvider>
    </NextThemesProvider>
  );
};