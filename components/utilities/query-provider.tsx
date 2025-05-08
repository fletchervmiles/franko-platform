"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// Create a single QueryClient instance to be used throughout the app
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default to no automatic refetching
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      retry: false
    },
  },
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
} 