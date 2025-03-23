import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError: (error: Error) => void;
}

/**
 * Error boundary component to catch and display React rendering errors
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  componentDidCatch(error: Error) {
    this.props.onError(error);
  }

  render() {
    return this.props.children;
  }
} 