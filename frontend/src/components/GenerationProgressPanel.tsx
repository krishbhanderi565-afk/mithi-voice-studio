import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import {
  IconSoundWave,
  IconNeuralProcessing,
  IconGlobeLanguages,
  IconMicrophoneWave,
  IconScriptText
} from './icons/FlaticonIcons';
import type { LanguageOption, VoiceOption } from '../types';

interface GenerationProgressPanelProps {
  language?: LanguageOption;
  voice?: VoiceOption;
  textLength: number;
}

export const GenerationProgressPanel: React.FC<GenerationProgressPanelProps> = ({
  language,
  voice,
  textLength,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Honest status stages based on elapsed synthesis time
  const getStatusStage = (sec: number): string => {
    if (sec < 2) return 'Preparing your text...';
    if (sec < 4) return 'Initializing voice generation...';
    if (sec < 8) return 'Generating neural audio with Mithi v1 Flash...';
    if (sec < 13) return 'Processing 24 kHz audio frames...';
    return 'Finalizing your high-fidelity WAV file...';
  };

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
                Creating your voiceover...
              </h3>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-mavs-orange-light text-mavs-orange border border-mavs-orange/20">
                <IconNeuralProcessing className="w-3 h-3" />
                <span>In Progress</span>
              </span>
            </div>
            <p className="text-xs text-mavs-muted font-medium mt-0.5">
              {getStatusStage(elapsedSeconds)}
            </p>
          </div>
        </div>

        {/* Live Elapsed Counter */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-[#FAF0E3] border border-[rgba(44,16,48,0.08)] text-xs font-bold text-mavs-plum self-start sm:self-auto">
          <Clock className="w-4 h-4 text-mavs-pink" />
          <span>Time elapsed:</span>
          <span className="font-mono text-mavs-pink font-bold">{formatElapsed(elapsedSeconds)}</span>
        </div>
      </div>

      {/* Waveform Animation Centerpiece */}
      <div className="py-4 flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center justify-center space-x-2 h-12">
          <span className="w-1.5 rounded-full bg-mavs-pink animate-wave-1" />
          <span className="w-1.5 rounded-full bg-mavs-orange animate-wave-2" />
          <span className="w-1.5 rounded-full bg-mavs-pink animate-wave-3" />
          <span className="w-1.5 rounded-full bg-mavs-pink animate-wave-4" />
          <span className="w-1.5 rounded-full bg-mavs-orange animate-wave-5" />
          <span className="w-1.5 rounded-full bg-mavs-pink animate-wave-6" />
          <span className="w-1.5 rounded-full bg-mavs-orange animate-wave-7" />
        </div>

        {/* Indeterminate Progress Bar */}
        <div className="w-full max-w-md h-2 bg-[rgba(44,16,48,0.06)] rounded-full overflow-hidden relative">
          <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-mavs-pink via-mavs-orange to-mavs-pink rounded-full w-1/3 animate-[indeterminate_1.8s_ease-in-out_infinite]" />
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
