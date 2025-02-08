"use client"; // Marks this as a client-side component

// Import necessary hooks for theme management and component lifecycle
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// ThemeToggle component - Provides a UI element to switch between light and dark themes
export function ThemeToggle() {
  // Get theme utilities from next-themes
  // setTheme: function to change the theme
  // theme: current theme value
  const { setTheme, theme } = useTheme();

  // State to track whether component has mounted
  // This prevents hydration mismatch between server and client
  const [mounted, setMounted] = useState(false);

  // Effect to set mounted state once component is hydrated on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Return null during server-side rendering or initial mount
  // This prevents theme flash and hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div
      // Make the div clickable and show cursor pointer on hover
      className="cursor-pointer"
      // Toggle between light and dark theme on click
      onClick={() => {
        setTheme(theme === "dark" ? "light" : "dark");
      }}
    >
      {/* Display text showing which mode will be switched to */}
      {`Toggle ${theme === "light" ? "dark" : "light"} mode`}
    </div>
  );
}
