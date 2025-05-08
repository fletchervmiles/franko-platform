"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

// Create a single QueryClient instance with environment-specific defaults
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // In production, be more aggressive with refreshing data
      staleTime: process.env.NODE_ENV === 'production' ? 30 * 1000 : Infinity, // 30 sec in prod, infinite in dev
      refetchOnWindowFocus: process.env.NODE_ENV === 'production', // true in production, false in dev
      retry: false
    },
  },
});

// Log when QueryClient is initialized
console.log(`QueryClient initialized with staleTime: ${
  process.env.NODE_ENV === 'production' ? '30s' : 'Infinity'
}, refetchOnWindowFocus: ${process.env.NODE_ENV === 'production'}`);

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
} 