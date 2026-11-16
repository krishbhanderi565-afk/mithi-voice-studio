import React, { useState, useEffect } from 'react';
import { DownloadCloud, AlertTriangle, HardDrive, Loader2, ShieldCheck } from 'lucide-react';
import { IconNeuralProcessing } from './icons/FlaticonIcons';
import { fetchModelStatus, startModelDownload, initializeModel } from '../services/api';
import type { ModelStatus } from '../types';

interface ModelSetupModalProps {
  onModelReady: () => void;
}

export const ModelSetupModal: React.FC<ModelSetupModalProps> = ({ onModelReady }) => {
  const [status, setStatus] = useState<ModelStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    try {
      const res = await fetchModelStatus();
      setStatus(res);
      if (res.is_installed && res.is_loaded) {
        onModelReady();
      } else if (res.is_installed && !res.is_loaded) {
        // Automatically trigger in-memory load if files exist
        await initializeModel();
        onModelReady();
      }
    } catch (err: unknown) {
      console.warn('Waiting for backend model manager...', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStartDownload = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await startModelDownload();
      // Poll faster during download
      const poll = setInterval(async () => {
        const s = await fetchModelStatus();
        setStatus(s);
        if (s.is_installed) {
          clearInterval(poll);
          await initializeModel();
          onModelReady();
        } else if (s.status === 'error') {
          clearInterval(poll);
          setError(s.error || 'Download failed. Please check internet connection.');
          setActionLoading(false);
        }
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to start download.');
      setActionLoading(false);
    }
  };

  const isDownloading = status?.status === 'downloading' || actionLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-mavs-plum/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-3xl border border-[rgba(44,16,48,0.12)] shadow-soft-lg p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-mavs-pink/10 text-mavs-pink border border-mavs-pink/20 flex items-center justify-center shadow-soft">
            <IconNeuralProcessing className="w-6 h-6 text-mavs-pink" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-mavs-plum tracking-tight">
              MAVS First-Launch Setup
            </h2>
            <p className="text-xs font-medium text-mavs-muted">
              Download official Mithi v1 Flash neural voice weights (~239 MB)
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-[rgba(250,240,227,0.7)] rounded-2xl border border-[rgba(44,16,48,0.08)] text-xs text-mavs-plum/90 space-y-2.5">
          <div className="flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <p className="leading-relaxed">
              <strong>Official Weights:</strong> Downloads verified acoustic and vocoder checkpoints from <code className="px-1.5 py-0.5 rounded bg-white font-mono text-[11px] border border-[rgba(44,16,48,0.08)]">Oomni/mithi-v1-flash</code>.
            </p>
          </div>

          <div className="flex items-start space-x-2.5">
            <HardDrive className="w-4 h-4 text-mavs-pink mt-0.5 shrink-0" />
            <p className="leading-relaxed">
              <strong>100% Local:</strong> After this one-time download, speech synthesis runs completely offline on your CPU with zero internet traffic.
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200/80 rounded-2xl text-xs text-red-700 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Download progress status */}
        {isDownloading ? (
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between text-xs font-semibold text-mavs-plum">
              <span className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-mavs-pink" />
                <span>Downloading weights from Hugging Face...</span>
              </span>
              <span className="text-mavs-pink font-mono">{status?.progress_percent || 0}%</span>
            </div>

            <div className="w-full h-3 bg-[rgba(44,16,48,0.06)] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-mavs-pink to-mavs-orange transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(5, status?.progress_percent || 0)}%` }}
              />
            </div>
            <p className="text-[11px] text-mavs-muted text-center font-medium">
              This usually takes 30–60 seconds depending on your connection.
            </p>
          </div>
        ) : (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleStartDownload}
              disabled={loading || actionLoading}
              className="w-full inline-flex items-center justify-center space-x-2.5 py-3.5 px-6 rounded-2xl bg-mavs-pink hover:bg-mavs-pink-hover text-white text-sm font-bold shadow-accent btn-soft cursor-pointer disabled:opacity-50"
            >
              <DownloadCloud className="w-5 h-5" />
              <span>Download Model Weights (239 MB)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
