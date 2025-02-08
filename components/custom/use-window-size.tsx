/**
 * useWindowSize Hook
 * 
 * Purpose:
 * - Tracks and provides the current window dimensions
 * - Enables responsive design based on window size
 * - Updates automatically when window is resized
 * - Provides undefined values during server-side rendering
 * 
 * Technical Features:
 * - Client-side only functionality (marked with "use client")
 * - Uses React hooks for state management
 * - Implements event listener cleanup
 * - Type-safe with TypeScript interface
 * 
 * Data Flow:
 * - Listens to window resize events
 * - Updates internal state with new dimensions
 * - Returns current window dimensions to components
 * 
 * Architecture Notes:
 * - Custom React hook pattern
 * - Handles SSR gracefully with undefined initial values
 * - Implements cleanup to prevent memory leaks
 * - Uses TypeScript for type safety
 */

"use client";

import { useState, useEffect } from "react";

// Define the shape of the window size state
interface WindowSize {
  width: number | undefined;
  height: number | undefined;
}

// Custom hook to track window dimensions
function useWindowSize(): WindowSize {
  // Initialize state with undefined dimensions
  // This prevents hydration mismatch during SSR
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount and unmount

  return windowSize;
}

export default useWindowSize;
