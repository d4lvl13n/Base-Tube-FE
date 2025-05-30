import React, { Component, ErrorInfo, ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home, Bug, ArrowLeft } from "lucide-react";
import { ErrorCode, ErrorSeverity } from "../../types/error";
import { ApiErrorHandler } from "../../utils/errorHandler";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  severity: ErrorSeverity;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorId: null,
    severity: ErrorSeverity.MEDIUM
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // Determine error severity based on error type
    let severity = ErrorSeverity.MEDIUM;
    
    if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
      severity = ErrorSeverity.HIGH;
    } else if (error.stack?.includes('React') || error.name.includes('React')) {
      severity = ErrorSeverity.CRITICAL;
    }

    return { 
      hasError: true, 
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error using our centralized error handler
    const userFacingError = ApiErrorHandler.handleApiError(error, {
      component: 'ErrorBoundary',
      action: 'React component error',
      additionalData: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    });

    console.group('🚨 React Error Boundary');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('User-facing error:', userFacingError);
    console.groupEnd();

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // TODO: Send to monitoring service
    // if (process.env.NODE_ENV === 'production') {
    //   sendErrorToMonitoring(error, errorInfo, this.state.errorId);
    // }
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleGoBack = () => {
    window.history.back();
  };

  private handleReportBug = () => {
    const bugReportUrl = `mailto:support@base.tube?subject=Bug Report - ${this.state.errorId}&body=Error ID: ${this.state.errorId}%0A%0APlease describe what you were doing when this error occurred:%0A%0A`;
    window.open(bugReportUrl);
  };

  private getSeverityInfo() {
    switch (this.state.severity) {
      case ErrorSeverity.LOW:
        return {
          title: "Minor Issue",
          description: "Something went wrong, but you should be able to continue.",
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/20"
        };
      case ErrorSeverity.HIGH:
        return {
          title: "Service Interruption",
          description: "We're experiencing technical difficulties. Please try refreshing the page.",
          color: "text-orange-500",
          bgColor: "bg-orange-500/10", 
          borderColor: "border-orange-500/20"
        };
      case ErrorSeverity.CRITICAL:
        return {
          title: "Critical Error",
          description: "A serious error has occurred. Our team has been notified.",
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/20"
        };
      default:
        return {
          title: "Something Went Wrong",
          description: "An unexpected error occurred. Please try again.",
          color: "text-orange-500",
          bgColor: "bg-orange-500/10",
          borderColor: "border-orange-500/20"
        };
    }
  }

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const severityInfo = this.getSeverityInfo();
      const isChunkLoadError = this.state.error?.name === 'ChunkLoadError' || 
                               this.state.error?.message.includes('Loading chunk');

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={`max-w-lg w-full ${severityInfo.bgColor} ${severityInfo.borderColor} border rounded-xl p-8 text-center`}
          >
            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`w-16 h-16 mx-auto mb-6 rounded-full ${severityInfo.bgColor} flex items-center justify-center`}
            >
              <AlertTriangle className={`w-8 h-8 ${severityInfo.color}`} />
            </motion.div>

            {/* Error Title */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-white mb-3"
            >
              {severityInfo.title}
            </motion.h1>

            {/* Error Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-gray-300 mb-6 leading-relaxed"
            >
              {isChunkLoadError 
                ? "A new version of the app is available. Please refresh to get the latest updates."
                : severityInfo.description
              }
            </motion.p>

            {/* Error ID */}
            {this.state.errorId && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mb-6"
              >
                <p className="text-xs text-gray-500 mb-1">Error ID for support:</p>
                <code className="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300">
                  {this.state.errorId}
                </code>
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              {/* Primary Action */}
              <button
                onClick={this.handleRefresh}
                className="w-full bg-[#fa7517] hover:bg-[#e8681e] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                {isChunkLoadError ? 'Refresh Page' : 'Try Again'}
              </button>

              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={this.handleGoBack}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors duration-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors duration-200"
                >
                  <Home className="w-4 h-4" />
                  Home
                </button>
              </div>

              {/* Report Bug Button */}
              <button
                onClick={this.handleReportBug}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-400 hover:text-gray-300 text-sm transition-colors duration-200"
              >
                <Bug className="w-4 h-4" />
                Report this issue
              </button>
            </motion.div>

            {/* Development Info */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <motion.details
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-6 text-left"
              >
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300">
                  Developer Info
                </summary>
                <div className="mt-2 p-3 bg-gray-900 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">Error Message:</p>
                  <code className="text-xs text-red-400 block mb-3">
                    {this.state.error.message}
                  </code>
                  {this.state.error.stack && (
                    <>
                      <p className="text-xs text-gray-400 mb-2">Stack Trace:</p>
                      <pre className="text-xs text-gray-500 overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </>
                  )}
                </div>
              </motion.details>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;