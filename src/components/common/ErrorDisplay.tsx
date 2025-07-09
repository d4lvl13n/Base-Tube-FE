// src/components/common/ErrorDisplay.tsx
// User-Friendly Error Display Component for Task 1.2: Error Handling

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  AlertCircle, 
  WifiOff, 
  RefreshCw, 
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { UserFacingError, ErrorSeverity } from '../../types/error';

interface ErrorDisplayProps {
  error: UserFacingError | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  className?: string;
  variant?: 'banner' | 'modal' | 'inline' | 'toast';
  showDetails?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onDismiss,
  onRetry,
  className = '',
  variant = 'inline',
  showDetails = false
}) => {
  if (!error) return null;

  const getSeverityConfig = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return {
          icon: AlertCircle,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          accent: 'bg-yellow-500'
        };
      case ErrorSeverity.HIGH:
        return {
          icon: AlertTriangle,
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/20',
          accent: 'bg-orange-500'
        };
      case ErrorSeverity.CRITICAL:
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          accent: 'bg-red-500'
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/20',
          accent: 'bg-orange-500'
        };
    }
  };

  const config = getSeverityConfig(error.severity);
  const Icon = config.icon;

  const getVariantClasses = () => {
    switch (variant) {
      case 'banner':
        return `w-full p-4 ${config.bgColor} ${config.borderColor} border-l-4 border-l-orange-500`;
      case 'modal':
        return `max-w-md w-full p-6 ${config.bgColor} ${config.borderColor} border rounded-xl shadow-2xl`;
      case 'toast':
        return `max-w-sm w-full p-4 ${config.bgColor} ${config.borderColor} border rounded-lg shadow-lg`;
      default: // inline
        return `w-full p-4 ${config.bgColor} ${config.borderColor} border rounded-lg`;
    }
  };

  const ErrorContent = () => (
    <div className={`flex items-start gap-3 ${getVariantClasses()} ${className}`}>
      {/* Error Icon */}
      <div className={`flex-shrink-0 w-6 h-6 ${config.color} mt-0.5`}>
        <Icon className="w-full h-full" />
      </div>

      {/* Error Content */}
      <div className="flex-1 min-w-0">
        {/* Error Message */}
        <p className="text-white font-medium text-sm leading-relaxed">
          {error.message}
        </p>

        {/* Error Details */}
        {showDetails && error.code && (
          <p className="text-gray-400 text-xs mt-1">
            Error Code: {error.code}
          </p>
        )}

        {/* Recovery Actions */}
        {(error.recoveryActions || error.canRetry) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {/* Retry Button */}
            {error.canRetry && (error.retryAction || onRetry) && (
              <button
                onClick={error.retryAction || onRetry}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#fa7517] hover:bg-[#e8681e] text-white text-xs font-medium rounded-md transition-colors duration-200"
              >
                <RefreshCw className="w-3 h-3" />
                Try Again
              </button>
            )}

            {/* Custom Recovery Actions */}
            {error.recoveryActions?.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors duration-200 ${
                  action.primary
                    ? 'bg-[#fa7517] hover:bg-[#e8681e] text-white'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
              >
                {action.label}
                <ChevronRight className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dismiss Button */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-300 transition-colors duration-200"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  // Render based on variant
  switch (variant) {
    case 'modal':
      return (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <ErrorContent />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      );

    case 'toast':
      return (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <ErrorContent />
        </motion.div>
      );

    case 'banner':
      return (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <ErrorContent />
        </motion.div>
      );

    default: // inline
      return (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ErrorContent />
        </motion.div>
      );
  }
};

export default ErrorDisplay;

// Convenience components for specific use cases
export const ErrorBanner: React.FC<Omit<ErrorDisplayProps, 'variant'>> = (props) => (
  <ErrorDisplay {...props} variant="banner" />
);

export const ErrorModal: React.FC<Omit<ErrorDisplayProps, 'variant'>> = (props) => (
  <ErrorDisplay {...props} variant="modal" />
);

export const ErrorToast: React.FC<Omit<ErrorDisplayProps, 'variant'>> = (props) => (
  <ErrorDisplay {...props} variant="toast" />
);

export const InlineError: React.FC<Omit<ErrorDisplayProps, 'variant'>> = (props) => (
  <ErrorDisplay {...props} variant="inline" />
); 