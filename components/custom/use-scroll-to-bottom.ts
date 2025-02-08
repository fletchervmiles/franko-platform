/**
 * useScrollToBottom Hook
 * 
 * Purpose:
 * - Provides automatic scrolling functionality for chat/message interfaces
 * - Keeps the view focused on the latest content
 * - Handles dynamic content updates
 * - Maintains scroll position at bottom when new content is added
 * 
 * Technical Features:
 * - Uses MutationObserver for efficient DOM change detection
 * - Generic typing for flexibility with different HTML elements
 * - Automatic cleanup on unmount
 * - Real-time response to content changes
 * 
 * Data Flow:
 * - Returns two refs that need to be attached to DOM elements
 * - Observes changes in the container element
 * - Automatically triggers scrolling when content changes
 * 
 * Architecture Notes:
 * - Custom React hook pattern
 * - Uses TypeScript generics for type safety
 * - Implements cleanup to prevent memory leaks
 * - Uses the Observer pattern for DOM monitoring
 */

// Import necessary React hooks and types
import { useEffect, useRef, RefObject } from "react";

// Custom hook that provides automatic scrolling to bottom functionality
// T extends HTMLElement allows this hook to work with any HTML element type
export function useScrollToBottom<T extends HTMLElement>(): [
  RefObject<T>,  // Reference to the container element
  RefObject<T>,  // Reference to the end element (scroll target)
] {
  // Create refs for the container and end elements
  const containerRef = useRef<T>(null);  // Container that holds the scrollable content
  const endRef = useRef<T>(null);        // Element to scroll to (typically at the bottom)

  useEffect(() => {
    // Get the current values of the refs
    const container = containerRef.current;
    const end = endRef.current;

    // Only proceed if both container and end elements exist
    if (container && end) {
      // Create a MutationObserver to watch for changes in the container
      const observer = new MutationObserver(() => {
        // When changes occur, scroll the end element into view
        // behavior: "instant" means no smooth scrolling
        // block: "end" ensures the element is aligned to the bottom
        end.scrollIntoView({ behavior: "instant", block: "end" });
      });

      // Start observing the container for any changes
      observer.observe(container, {
        childList: true,      // Watch for changes to child elements
        subtree: true,        // Watch for changes in nested elements
        attributes: true,     // Watch for attribute changes
        characterData: true,  // Watch for text content changes
      });

      // Cleanup function to disconnect the observer when component unmounts
      return () => observer.disconnect();
    }
  }, []); // Empty dependency array means this effect runs once on mount

  // Return the refs for use in the component
  return [containerRef, endRef];
}
