import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

interface AlertBannerProps {
  message: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({ message, onDismiss, onRetry }) => {
  if (!message) return null;

  return (
    <div className="flex items-start justify-between p-4 bg-white/90 backdrop-blur-md border border-red-200/80 rounded-2xl text-mavs-plum text-sm shadow-soft">
      <div className="flex items-start space-x-3.5">
        <div className="w-8 h-8 rounded-xl bg-red-50 text-red-500 border border-red-200/60 flex items-center justify-center shrink-0">
          <AlertCircle className="w-4 h-4 stroke-[2.5]" />
        </div>
        <div className="space-y-0.5">
          <p className="font-bold text-xs uppercase tracking-wider text-red-700">Notice</p>
          <p className="text-xs font-medium text-mavs-plum/90 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 pl-3 shrink-0">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold text-white bg-mavs-plum hover:bg-[#1a091d] rounded-xl shadow-soft btn-soft cursor-pointer"
          >
            <RefreshCw className="w-3 h-3 text-mavs-pink" />
            <span>Retry</span>
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 text-mavs-muted hover:text-mavs-plum hover:bg-mavs-pink/10 rounded-lg transition-all cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
