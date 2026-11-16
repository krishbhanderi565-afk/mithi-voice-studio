import React, { useState, useEffect } from 'react';
import { Clock, XCircle, Loader2 } from 'lucide-react';
import {
  IconSoundWave,
  IconNeuralProcessing,
  IconGlobeLanguages,
  IconMicrophoneWave,
  IconScriptText
} from './icons/FlaticonIcons';
import type { LanguageOption, VoiceOption } from '../types';
import { fetchGenerationProgress, type GenerationProgress } from '../services/api';

interface GenerationProgressPanelProps {
  language?: LanguageOption;
  voice?: VoiceOption;
  textLength: number;
  onCancel?: () => void;
  isCancelling?: boolean;
}

export const GenerationProgressPanel: React.FC<GenerationProgressPanelProps> = ({
  language,
  voice,
  textLength,
  onCancel,
  isCancelling = false,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [progress, setProgress] = useState<GenerationProgress>({
    active: true,
    stage: 'Analyzing sentence structure...',
    current_chunk: 0,
    total_chunks: 0,
    elapsed_sec: 0,
    text_length: textLength,
    can_cancel: true,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll real generation progress from backend
  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      const data = await fetchGenerationProgress();
      if (mounted && data && data.active) {
        setProgress(data);
      }
    };

    poll();
    const interval = setInterval(poll, 500);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const formatElapsed = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const hasChunks = progress.total_chunks > 0;
  const percentComplete = hasChunks
    ? Math.min(100, Math.round((progress.current_chunk / progress.total_chunks) * 100))
    : 0;

  return (
    <div className="bg-white/85 backdrop-blur-md rounded-3xl border border-[rgba(44,16,48,0.12)] p-6 sm:p-8 shadow-soft-lg space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[rgba(44,16,48,0.08)]">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-mavs-pink/10 text-mavs-pink border border-mavs-pink/20 flex items-center justify-center shrink-0 shadow-soft">
            <IconSoundWave className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-mavs-plum tracking-tight">
                {isCancelling ? 'Cancelling Generation...' : 'Synthesizing Audio...'}
              </h3>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-mavs-orange-light text-mavs-orange border border-mavs-orange/20">
                <IconNeuralProcessing className="w-3 h-3" />
                <span>{hasChunks ? `${percentComplete}%` : 'In Progress'}</span>
              </span>
            </div>
            <p className="text-xs text-mavs-muted font-medium mt-0.5">
              {isCancelling ? 'Halting inference and releasing resources...' : progress.stage}
            </p>
          </div>
        </div>

        {/* Live Elapsed Counter & Cancel Button */}
        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-[#FAF0E3] border border-[rgba(44,16,48,0.08)] text-xs font-bold text-mavs-plum">
            <Clock className="w-4 h-4 text-mavs-pink" />
            <span>Elapsed:</span>
            <span className="font-mono text-mavs-pink font-bold">{formatElapsed(elapsedSeconds)}</span>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isCancelling}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all disabled:opacity-50"
              title="Cancel current voice generation"
            >
              {isCancelling ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <XCircle className="w-3.5 h-3.5" />
              )}
              <span>{isCancelling ? 'Cancelling...' : 'Cancel'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Waveform Animation Centerpiece & Progress Bar */}
      <div className="py-2 flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center justify-center space-x-2 h-10">
          <span className="w-1.5 rounded-full bg-mavs-pink animate-wave-1" />
          <span className="w-1.5 rounded-full bg-mavs-orange animate-wave-2" />
          <span className="w-1.5 rounded-full bg-mavs-pink animate-wave-3" />
          <span className="w-1.5 rounded-full bg-mavs-pink animate-wave-4" />
          <span className="w-1.5 rounded-full bg-mavs-orange animate-wave-5" />
          <span className="w-1.5 rounded-full bg-mavs-pink animate-wave-6" />
          <span className="w-1.5 rounded-full bg-mavs-orange animate-wave-7" />
        </div>

        {/* Real Progress Bar */}
        <div className="w-full max-w-lg space-y-1.5">
          <div className="w-full h-2.5 bg-[rgba(44,16,48,0.06)] rounded-full overflow-hidden relative">
            {hasChunks ? (
              <div
                className="h-full bg-gradient-to-r from-mavs-pink via-mavs-orange to-mavs-pink rounded-full transition-all duration-300 ease-out"
                style={{ width: `${percentComplete}%` }}
              />
            ) : (
              <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-mavs-pink via-mavs-orange to-mavs-pink rounded-full w-1/3 animate-[indeterminate_1.8s_ease-in-out_infinite]" />
            )}
          </div>
          {hasChunks && (
            <div className="flex justify-between text-[11px] font-semibold text-mavs-muted">
              <span>Sentence {progress.current_chunk} of {progress.total_chunks}</span>
              <span>{percentComplete}% completed</span>
            </div>
          )}
        </div>
      </div>

      {/* Target Parameters Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
        <div className="flex items-center space-x-2.5 p-3 rounded-2xl bg-[rgba(250,240,227,0.65)] border border-[rgba(44,16,48,0.06)]">
          <IconGlobeLanguages className="w-4 h-4 text-mavs-pink shrink-0" />
          <div>
            <p className="text-[10px] uppercase font-bold text-mavs-muted tracking-wider">Language</p>
            <p className="font-semibold text-mavs-plum">{language?.name || 'English'} ({language?.native_name || 'English'})</p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 p-3 rounded-2xl bg-[rgba(250,240,227,0.65)] border border-[rgba(44,16,48,0.06)]">
          <IconMicrophoneWave className="w-4 h-4 text-mavs-orange shrink-0" />
          <div>
            <p className="text-[10px] uppercase font-bold text-mavs-muted tracking-wider">Voice</p>
            <p className="font-semibold text-mavs-plum">{voice?.name || 'Satvik'} ({voice?.gender || 'Male'})</p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 p-3 rounded-2xl bg-[rgba(250,240,227,0.65)] border border-[rgba(44,16,48,0.06)]">
          <IconScriptText className="w-4 h-4 text-mavs-pink shrink-0" />
          <div>
            <p className="text-[10px] uppercase font-bold text-mavs-muted tracking-wider">Script Length</p>
            <p className="font-semibold text-mavs-plum">{textLength.toLocaleString()} characters</p>
          </div>
        </div>
      </div>
    </div>
  );
};
