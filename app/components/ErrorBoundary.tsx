import React, {Component, type ReactNode} from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Prevents entire app crashes by containing errors to specific components
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {hasError: false, error: null};
  }

  static getDerivedStateFromError(error: Error): State {
    return {hasError: true, error};
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console (would connect to error tracking service in production)
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback or default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded font-mono">
          <h2 className="text-sm font-medium text-red-800 mb-2">
            SOMETHING WENT WRONG
          </h2>
          <p className="text-xs text-red-600">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({hasError: false, error: null})}
            className="mt-3 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs uppercase tracking-wider transition-colors"
          >
            TRY AGAIN
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Specific error boundary for cart operations
 */
export function CartErrorBoundary({children}: {children: ReactNode}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded font-mono">
          <p className="text-sm text-yellow-800">
            Unable to load cart item. Please refresh the page.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Specific error boundary for 3D components
 */
export function ThreeDErrorBoundary({children}: {children: ReactNode}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center h-full bg-gray-50 font-mono">
          <div className="text-center p-8">
            <h2 className="text-lg font-medium text-gray-800 mb-2">
              3D VIEWER UNAVAILABLE
            </h2>
            <p className="text-sm text-gray-600">
              Unable to load 3D scene. Please check your browser compatibility.
            </p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
