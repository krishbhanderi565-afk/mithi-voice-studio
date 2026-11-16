import React from 'react';
import { IconProcessorChip, IconRefreshCw } from './icons/FlaticonIcons';
import type { HealthResponse } from '../types';

interface HeaderProps {
  health: HealthResponse | null;
  loading: boolean;
  isStartingUp?: boolean;
  onRefreshHealth: () => void;
}

export const Header: React.FC<HeaderProps> = ({ health, loading, isStartingUp = false, onRefreshHealth }) => {
  const isHealthy = health?.status === 'ok' && health?.model_loaded;

  return (
    <header className="border-b border-[rgba(44,16,48,0.08)] bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-soft">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Wordmark (No generic AI icon) */}
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="text-2xl sm:text-[28px] font-black text-mavs-plum tracking-tight font-display select-none leading-none">
              MAVS
            </span>
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest rounded-md bg-mavs-pink/10 text-mavs-pink border border-mavs-pink/20 leading-tight">
              V1 FLASH
            </span>
          </div>
          <p className="text-xs font-medium text-mavs-muted tracking-normal mt-1 hidden sm:block">
            Sweet, natural speech across 11 Indian languages
          </p>
        </div>

        {/* Backend & Model Status Indicator */}
        <div className="flex items-center space-x-3">
          <div
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
              isHealthy
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                : 'bg-mavs-orange-light text-mavs-orange border-mavs-orange/20'
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              {isHealthy && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isHealthy ? 'bg-emerald-500' : 'bg-mavs-orange animate-pulse'
                }`}
              />
            </span>
            <span className="hidden md:inline">
              {isHealthy
                ? `Engine Ready (${health?.device?.toUpperCase() || 'CPU'})`
                : isStartingUp
                ? 'Initializing Engine (~5s)...'
                : 'Backend Connecting...'}
            </span>
            <span className="md:hidden">
              {isHealthy ? 'Ready' : isStartingUp ? 'Starting' : 'Offline'}
            </span>
          </div>

          {health?.device && (
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-mavs-plum bg-[rgba(250,240,227,0.7)] rounded-xl border border-[rgba(44,16,48,0.08)]">
              <IconProcessorChip className="w-3.5 h-3.5 text-mavs-pink" />
              <span>{health.device.toUpperCase()} ({health.cpu_threads}T)</span>
            </div>
          )}

          <button
            onClick={onRefreshHealth}
            disabled={loading}
            title="Refresh backend status"
            className="p-2 text-mavs-plum bg-white/90 hover:bg-mavs-pink/10 border border-[rgba(44,16,48,0.10)] rounded-xl shadow-soft btn-soft disabled:opacity-50 cursor-pointer transition-colors"
          >
            <IconRefreshCw className={`w-4 h-4 text-mavs-plum ${loading ? 'animate-spin text-mavs-pink' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
