"use client"; // Marks this as a client-side component

// Import the theme provider from next-themes library
import { ThemeProvider as NextThemesProvider } from "next-themes";
// Import types directly from next-themes
import type { ThemeProviderProps } from "next-themes";
// Import React for JSX support
import * as React from "react";

// ThemeProvider component - Wraps the application to provide theme context
// This enables dark/light mode functionality throughout the app
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Render the NextThemesProvider with any additional props passed through
  // The provider makes theme information and toggle functions available to all child components
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
