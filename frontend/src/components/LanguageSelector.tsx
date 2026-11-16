import React from 'react';
import { ChevronDown } from 'lucide-react';
import { IconGlobeLanguages } from './icons/FlaticonIcons';
import type { LanguageOption } from '../types';

interface LanguageSelectorProps {
  languages: LanguageOption[];
  selectedLanguage: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  languages,
  selectedLanguage,
  onChange,
  disabled = false,
}) => {
  const currentLang = languages.find((l) => l.code === selectedLanguage);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-mavs-plum">
          1. Select Language
        </label>
        {currentLang && (
          <span className="px-2.5 py-0.5 rounded-full bg-mavs-pink/10 border border-mavs-pink/20 text-mavs-pink font-semibold text-[11px]">
            {currentLang.name} ({currentLang.native_name})
          </span>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mavs-pink">
          <IconGlobeLanguages className="w-4 h-4" />
        </div>
        <select
          value={selectedLanguage}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || languages.length === 0}
          className="w-full pl-10 pr-10 py-3 bg-white/90 border border-[rgba(44,16,48,0.12)] rounded-2xl text-sm font-semibold text-mavs-plum shadow-soft hover:border-mavs-pink/50 focus:outline-none focus:ring-2 focus:ring-mavs-pink/20 focus:border-mavs-pink transition-all appearance-none cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
        >
          {languages.length === 0 ? (
            <option value="">Loading languages...</option>
          ) : (
            languages.map((lang) => (
              <option key={lang.code} value={lang.code} className="font-semibold text-sm py-1">
                {lang.name} — {lang.native_name} ({lang.code.toUpperCase()})
              </option>
            ))
          )}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-mavs-muted">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};
