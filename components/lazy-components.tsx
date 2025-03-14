/**
 * Lazy-loaded component definitions
 * 
 * This file contains dynamic imports for components that are not needed
 * for the initial render, improving load performance.
 */

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Simple loading placeholder
const SimpleLoadingPlaceholder = () => (
  <div className="flex items-center justify-center p-4">
    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
  </div>
);

// Progress bar placeholder that takes up space but shows a minimal UI
const ProgressBarPlaceholder = () => (
  <div className="w-full h-2 bg-gray-100 rounded overflow-hidden">
    <div className="h-full bg-gray-200 animate-pulse" style={{ width: '30%' }}></div>
  </div>
);

// Lazy load the external chat progress component
// This isn't needed immediately since it only appears after the user starts chatting
export const LazyExternalChatProgress = dynamic(
  () => import('./external-chat-progress').then(mod => ({ default: mod.ExternalChatProgress })),
  {
    loading: () => <ProgressBarPlaceholder />,
    ssr: false,
  }
);

// Lazy load the direct progress bar component
// This is the new component that parses progress directly from responses
export const LazyDirectProgressBar = dynamic(
  () => import('./direct-progress-bar').then(mod => ({ default: mod.DirectProgressBar })),
  {
    loading: () => <ProgressBarPlaceholder />,
    ssr: false,
  }
);

// Lazy load the Markdown component which is used for rendering AI responses
// This helps reduce the initial bundle size
export const LazyMarkdown = dynamic(
  () => import('./custom/markdown').then(mod => ({ default: mod.Markdown })),
  {
    loading: () => <SimpleLoadingPlaceholder />,
    ssr: false,
  }
);

// Lazy load the ConversationPlan component which isn't needed immediately
export const LazyConversationPlan = dynamic(
  () => import('./conversation-plan').then(mod => ({ default: mod.ConversationPlan })),
  {
    loading: () => <SimpleLoadingPlaceholder />,
    ssr: false,
  }
);

// Lazy load the OptionButtons component which appears in some messages
export const LazyOptionButtons = dynamic(
  () => import('./OptionButtons').then(mod => ({ default: mod.OptionButtons })),
  {
    loading: () => <SimpleLoadingPlaceholder />,
    ssr: false,
  }
);