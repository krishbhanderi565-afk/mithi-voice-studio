import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { LanguageSelector } from './components/LanguageSelector';
import { VoiceSelector } from './components/VoiceSelector';
import { TextInputArea } from './components/TextInputArea';
import { AudioPlayer } from './components/AudioPlayer';
import { AlertBanner } from './components/AlertBanner';
import { ModelSetupModal } from './components/ModelSetupModal';
import { GenerationProgressPanel } from './components/GenerationProgressPanel';
import { checkHealth, fetchConfig, fetchModelStatus, generateSpeech, ApiError } from './services/api';
import type { LanguageOption, VoiceOption, AudioResult, HealthResponse } from './types';
import { Loader2 } from 'lucide-react';
import { IconSoundWave, IconMicrophoneWave, IconProcessorChip } from './components/icons/FlaticonIcons';

export const App: React.FC = () => {
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [selectedVoice, setSelectedVoice] = useState<string>('satvik');
  const [text, setText] = useState<string>(
    'Welcome to MAVS. Sweet, natural speech generation in eleven Indian languages powered by Mithi v1 Flash.'
  );
  const [maxLength, setMaxLength] = useState<number>(1000000);

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState<boolean>(false);
  const [isConfigLoading, setIsConfigLoading] = useState<boolean>(true);
  const [isStartingUp, setIsStartingUp] = useState<boolean>(true);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [audioResult, setAudioResult] = useState<AudioResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);

  // Keep track of active object URL to cleanly revoke on replacement or unmount
  const activeUrlRef = useRef<string | null>(null);
  const configLoadedRef = useRef<boolean>(false);

  const revokeCurrentUrl = () => {
    if (activeUrlRef.current) {
      URL.revokeObjectURL(activeUrlRef.current);
      activeUrlRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      revokeCurrentUrl();
    };
  }, []);

  const loadHealthAndConfig = async (silent: boolean = false): Promise<boolean> => {
    setIsHealthLoading(true);
    try {
      // 1. Fetch studio config as soon as backend is reachable
      if (!configLoadedRef.current) {
        try {
          const config = await fetchConfig();
          setLanguages(config.languages);
          setVoices(config.voices);
          setSelectedLanguage(config.default_language || 'en');
          setSelectedVoice(config.default_voice || 'satvik');
          setMaxLength(config.max_text_length || 1000000);
          setIsConfigLoading(false);
          configLoadedRef.current = true;
        } catch {
          // Backend might still be binding port
        }
      }

      const hRes = await checkHealth();
      setHealth(hRes);

      if (hRes.model_loaded) {
        setError(null);
        setIsStartingUp(false);
        return true;
      } else if (hRes.status === 'initializing') {
        setIsStartingUp(true);
      } else {
        const modelStat = await fetchModelStatus().catch(() => null);
        if (modelStat && !modelStat.is_installed) {
          setShowSetupModal(true);
          setIsStartingUp(false);
        }
      }
    } catch (err: unknown) {
      if (!silent) {
        const message = err instanceof ApiError ? err.message : 'Failed to connect to MAVS engine.';
        setError(message);
      }
    } finally {
      setIsHealthLoading(false);
    }
    return false;
  };

  useEffect(() => {
    let isSubscribed = true;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let attempts = 0;
    const maxAttempts = 35; // 35 * 1000ms = 35 seconds

    const poll = async () => {
      attempts++;
      const success = await loadHealthAndConfig(attempts < 10);
      if (success || attempts >= maxAttempts) {
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
        if (isSubscribed) {
          setIsStartingUp(false);
          if (!success && attempts >= maxAttempts) {
            setError('MAVS engine initialization timed out. Click the refresh icon to retry.');
          }
        }
      }
    };

    // Begin immediate poll
    poll();
    pollInterval = setInterval(poll, 1000);

    // Desktop IPC listener
    if (typeof window !== 'undefined' && window.mavsDesktop?.onBackendStatus) {
      window.mavsDesktop.onBackendStatus((status) => {
        if (!isSubscribed) return;
        if (status.ready) {
          setError(null);
          loadHealthAndConfig(false);
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
          setIsStartingUp(false);
        } else if (status.error) {
          setError(status.error);
          setIsStartingUp(false);
        }
      });
    }

    return () => {
      isSubscribed = false;
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanText = text.trim();
    if (!cleanText) {
      setError('Please enter or paste text to generate speech.');
      return;
    }

    if (cleanText.length > maxLength) {
      setError(`Text length (${cleanText.length.toLocaleString()} chars) exceeds maximum capacity of ${maxLength.toLocaleString()} characters.`);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateSpeech(cleanText, selectedLanguage, selectedVoice);

      // Clean up previous object URL
      revokeCurrentUrl();

      const newUrl = URL.createObjectURL(result.blob);
      activeUrlRef.current = newUrl;

      const newResult: AudioResult = {
        blob: result.blob,
        url: newUrl,
        duration: result.duration,
        sampleRate: result.sampleRate,
        language: result.language,
        voice: result.voice,
        text: cleanText,
        createdAt: new Date(),
      };

      setAudioResult(newResult);
    } catch (err: unknown) {
      console.error('Speech generation error:', err);
      const message =
        err instanceof ApiError
          ? err.message
          : 'Failed to generate speech. Please ensure the backend is running and try again.';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResetAudio = () => {
    revokeCurrentUrl();
    setAudioResult(null);
  };

  const currentLangObj = languages.find((l) => l.code === selectedLanguage);
  const currentVoiceObj = voices.find((v) => v.id === selectedVoice);
  const bgUrl = typeof window !== 'undefined' ? new URL('bg-pattern.jpg', window.location.href).href : './bg-pattern.jpg';

  return (
    <div
      className="min-h-screen flex flex-col app-bg-wrapper selection:bg-mavs-pink selection:text-white"
      style={{
        backgroundColor: '#FAF0E3',
        backgroundImage: `url("${bgUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <Header
        health={health}
        loading={isHealthLoading}
        isStartingUp={isStartingUp}
        onRefreshHealth={() => loadHealthAndConfig(false)}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14 space-y-8">
        {/* Soft Modern Hero Section */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-[rgba(44,16,48,0.10)] bg-white/70 backdrop-blur-sm shadow-soft text-xs font-semibold text-mavs-plum">
            <IconSoundWave className="w-3.5 h-3.5 text-mavs-pink" />
            <span>Official Mithi v1 Flash Model</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-mavs-plum tracking-tight leading-[1.2] font-display">
            Turn Indian text into{' '}
            <span className="text-mavs-pink">
              sweet speech.
            </span>
          </h2>

          <p className="text-xs sm:text-sm font-medium text-mavs-muted leading-relaxed max-w-xl mx-auto">
            High-fidelity 24 kHz speech synthesis across 11 Indian languages with natural prosody in Satvik and Charvi voices.
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="max-w-3xl mx-auto">
            <AlertBanner
              message={error}
              onDismiss={() => setError(null)}
              onRetry={() => loadHealthAndConfig(false)}
            />
          </div>
        )}

        {/* Active Generation Progress State */}
        {isGenerating && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-top-3 duration-300">
            <GenerationProgressPanel
              language={currentLangObj}
              voice={currentVoiceObj}
              textLength={text.trim().length}
            />
          </div>
        )}

        {/* Main Workspace Card */}
        <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-md rounded-3xl border border-[rgba(44,16,48,0.12)] shadow-soft-lg p-6 sm:p-8 space-y-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Top selectors row: Language & Voice */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
              <LanguageSelector
                languages={languages}
                selectedLanguage={selectedLanguage}
                onChange={(code) => setSelectedLanguage(code)}
                disabled={isConfigLoading || isGenerating}
              />

              <VoiceSelector
                voices={voices}
                selectedVoice={selectedVoice}
                onChange={(id) => setSelectedVoice(id)}
                disabled={isConfigLoading || isGenerating}
              />
            </div>

            {/* Text Input Area */}
            <TextInputArea
              text={text}
              onChange={(val) => setText(val)}
              maxLength={maxLength}
              disabled={isGenerating}
              selectedLanguage={selectedLanguage}
            />

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[rgba(44,16,48,0.08)]">
              <div className="flex items-center space-x-2 text-xs font-semibold text-mavs-muted">
                <div className="w-5 h-5 rounded-full bg-mavs-pink/10 text-mavs-pink flex items-center justify-center">
                  <IconProcessorChip className="w-3.5 h-3.5" />
                </div>
                <span>100% Local CPU Inference &bull; 24 kHz Studio WAV</span>
              </div>

              <button
                type="submit"
                disabled={isGenerating || !text.trim() || !health?.model_loaded}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-8 py-3.5 bg-mavs-pink hover:bg-mavs-pink-hover active:scale-[0.98] text-white font-bold text-sm uppercase tracking-wider rounded-2xl shadow-accent btn-soft disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Audio...</span>
                  </>
                ) : (
                  <>
                    <IconMicrophoneWave className="w-4 h-4" />
                    <span>Generate Audio</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Audio Output Result Section */}
        {audioResult && !isGenerating && (
          <div className="max-w-3xl mx-auto transition-all animate-in fade-in slide-in-from-bottom-4 duration-300">
            <AudioPlayer
              audioResult={audioResult}
              onReset={handleResetAudio}
            />
          </div>
        )}

        {/* First Launch Model Setup Modal */}
        {showSetupModal && (
          <ModelSetupModal
            onModelReady={() => {
              setShowSetupModal(false);
              loadHealthAndConfig(false);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgba(44,16,48,0.08)] bg-white/70 backdrop-blur-sm py-6 text-xs text-mavs-muted">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-mavs-plum">MAVS</span>
            <span>&bull; Powered by official</span>
            <a
              href="https://huggingface.co/Oomni/mithi-v1-flash"
              target="_blank"
              rel="noopener noreferrer"
              className="text-mavs-pink font-semibold hover:underline"
            >
              Mithi v1 Flash
            </a>
            <span>(Apache-2.0)</span>
          </div>
          <div className="text-mavs-muted/80 font-medium">
            Kokoro-82M &bull; Indic-BERT &bull; Maya text normalizer &bull; misaki
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
