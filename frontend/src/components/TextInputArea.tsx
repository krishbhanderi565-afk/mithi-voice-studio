import React from 'react';
import { AlertCircle } from 'lucide-react';
import { IconScriptText, IconTrashBin } from './icons/FlaticonIcons';

interface TextInputAreaProps {
  text: string;
  onChange: (text: string) => void;
  maxLength?: number;
  disabled?: boolean;
  selectedLanguage: string;
}

const SAMPLE_SENTENCES: Record<string, { label: string; text: string }> = {
  hi: {
    label: 'Hindi sample',
    text: 'आज मौसम कितना अच्छा है! चलो, शाम को कहीं बाहर घूमने चलते हैं।',
  },
  en: {
    label: 'English sample',
    text: 'Welcome to MAVS. Sweet, natural speech generation in eleven Indian languages powered by Mithi v1 Flash.',
  },
  gu: {
    label: 'Gujarati sample',
    text: 'કેમ છો! MAVS માં તમારું સ્વાગત છે. આજે તમે શું સાંભળવા માંગો છો?',
  },
  bn: {
    label: 'Bengali sample',
    text: 'নমস্কার! কেমন আছেন? আপনি আজ কি শুনতে চান?',
  },
  ta: {
    label: 'Tamil sample',
    text: 'வணக்கம்! எப்படி இருக்கீங்க? இன்று நீங்கள் என்ன கேட்க விரும்புகிறீர்கள்?',
  },
  te: {
    label: 'Telugu sample',
    text: 'నమస్కారం! మీరు ఎలా ఉన్నారు? ఈరోజు మీరు ఏమి వినాలనుకుంటున్నారు?',
  },
  kn: {
    label: 'Kannada sample',
    text: 'ನಮಸ್ಕಾರ! ನೀವು ಹೇಗಿದ್ದೀರಿ? ಇಂದು ನೀವು ಏನನ್ನು ಕೇಳಲು ಬಯಸುತ್ತೀರಿ?',
  },
  ml: {
    label: 'Malayalam sample',
    text: 'നമസ്കാരം! സുഖമാണോ? ഇന്ന് നിങ്ങൾ എന്താണ് കേൾക്കാൻ ആഗ്രഹിക്കുന്നത്?',
  },
  mr: {
    label: 'Marathi sample',
    text: 'नमस्कार! कसे आहात? आज तुम्ही काय ऐकू इच्छिता?',
  },
  pa: {
    label: 'Punjabi sample',
    text: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ? ਅੱਜ ਤੁਸੀਂ ਕੀ ਸੁਣਨਾ ਚਾਹੁੰਦੇ ਹੋ?',
  },
  or: {
    label: 'Odia sample',
    text: 'ନମସ୍କାର! ଆପଣ କେମିତି ଅଛନ୍ତି? ଆଜି ଆପଣ କଣ ଶୁଣିବାକୁ ଚାହୁଁଛନ୍ତି?',
  },
};

export const TextInputArea: React.FC<TextInputAreaProps> = ({
  text,
  onChange,
  maxLength = 1000000,
  disabled = false,
  selectedLanguage,
}) => {
  const currentSample = SAMPLE_SENTENCES[selectedLanguage] || SAMPLE_SENTENCES['en'];
  const charCount = text.length;
  const isNearLimit = charCount > maxLength * 0.95;
  const isLimitReached = charCount >= maxLength;
  const remainingChars = Math.max(0, maxLength - charCount);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-mavs-plum">
          3. Enter Script
        </label>
        <div className="flex items-center space-x-2">
          {currentSample && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(currentSample.text)}
              className="inline-flex items-center space-x-1.5 px-3 py-1 bg-mavs-pink/10 hover:bg-mavs-pink/20 text-mavs-pink font-semibold text-xs rounded-xl border border-mavs-pink/20 btn-soft disabled:opacity-50 cursor-pointer"
            >
              <IconScriptText className="w-3.5 h-3.5" />
              <span>Load {currentSample.label}</span>
            </button>
          )}
          {text.length > 0 && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange('')}
              className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white/80 hover:bg-mavs-pink/10 text-mavs-muted hover:text-mavs-plum font-semibold text-xs rounded-xl border border-[rgba(44,16,48,0.10)] btn-soft disabled:opacity-50 cursor-pointer"
              title="Clear input"
            >
              <IconTrashBin className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <textarea
          rows={4}
          value={text}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          disabled={disabled}
          placeholder="Enter or paste text here to generate natural speech with MAVS (up to 1,000,000 characters)..."
          className={`w-full p-4 bg-white/90 border rounded-2xl text-mavs-plum placeholder:text-mavs-muted/50 text-base font-medium leading-relaxed shadow-soft focus:outline-none focus:ring-2 focus:ring-mavs-pink/20 transition-all resize-y min-h-[140px] max-h-[360px] disabled:bg-slate-100 disabled:cursor-not-allowed ${
            isLimitReached
              ? 'border-red-400 focus:border-red-500'
              : 'border-[rgba(44,16,48,0.12)] focus:border-mavs-pink'
          }`}
        />

        {isLimitReached && (
          <div className="flex items-center space-x-1.5 text-xs text-red-600 font-semibold mt-1 px-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Maximum character capacity reached (1,000,000 characters).</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1 pt-2 text-xs font-medium text-mavs-muted">
          <span>Supported: 11 Indian languages &bull; Indian Unicode scripts & English</span>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-mavs-muted/80">
              ({remainingChars.toLocaleString()} remaining)
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-lg border font-mono font-semibold text-xs ${
                isLimitReached
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : isNearLimit
                  ? 'bg-mavs-orange-light text-mavs-orange border-mavs-orange/20'
                  : 'bg-white/80 text-mavs-plum border-[rgba(44,16,48,0.10)]'
              }`}
            >
              {charCount.toLocaleString()} / {maxLength.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
