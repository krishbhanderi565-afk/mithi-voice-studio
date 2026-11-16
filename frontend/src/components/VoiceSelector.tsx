import React from 'react';
import { Check } from 'lucide-react';
import { IconMicrophoneWave } from './icons/FlaticonIcons';
import type { VoiceOption } from '../types';

interface VoiceSelectorProps {
  voices: VoiceOption[];
  selectedVoice: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoice,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-wider text-mavs-plum">
        2. Choose Voice
      </label>
      <div className="grid grid-cols-2 gap-3.5">
        {voices.map((voice) => {
          const isSelected = selectedVoice === voice.id;
          return (
            <button
              key={voice.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(voice.id)}
              className={`group relative flex flex-col p-3.5 rounded-2xl border text-left transition-all btn-soft ${
                isSelected
                  ? 'bg-mavs-pink text-white shadow-accent border-mavs-pink'
                  : 'bg-white/90 text-mavs-plum hover:bg-white border-[rgba(44,16,48,0.12)] hover:border-mavs-pink/40 shadow-soft'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-mavs-pink/10 text-mavs-pink group-hover:bg-mavs-pink/20'
                    }`}
                  >
                    <IconMicrophoneWave className="w-4 h-4" />
                  </div>
                  <div>
                    <span className={`font-bold text-sm block leading-tight ${isSelected ? 'text-white' : 'text-mavs-plum'}`}>
                      {voice.name}
                    </span>
                    <span
                      className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md mt-0.5 ${
                        isSelected
                          ? 'bg-white/25 text-white'
                          : 'bg-[rgba(250,240,227,0.8)] text-mavs-muted'
                      }`}
                    >
                      {voice.gender}
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-white text-mavs-pink flex items-center justify-center shadow-soft">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </div>
              <p className={`text-xs font-normal line-clamp-1 mt-1 ${isSelected ? 'text-white/90' : 'text-mavs-muted'}`}>
                {voice.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
