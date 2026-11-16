import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, CheckCircle2 } from 'lucide-react';
import { IconDownloadAudio } from './icons/FlaticonIcons';
import type { AudioResult } from '../types';

interface AudioPlayerProps {
  audioResult: AudioResult;
  onReset: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioResult, onReset }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(audioResult.duration || 0);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioResult.url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch((err) => {
        console.error('Audio playback failed:', err);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleDownload = () => {
    const fileName = `mavs-speech-${audioResult.language}-${audioResult.voice}.wav`;
    const a = document.createElement('a');
    a.href = audioResult.url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const effectiveDuration = duration || audioResult.duration || 0;

  return (
    <div className="bg-white/85 backdrop-blur-md border border-[rgba(44,16,48,0.12)] rounded-3xl p-6 sm:p-8 shadow-soft-lg space-y-6">
      <audio ref={audioRef} src={audioResult.url} preload="auto" />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-[rgba(44,16,48,0.08)]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center shadow-soft">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-mavs-plum">Speech Synthesized Successfully</h3>
            <p className="text-xs font-medium text-mavs-muted">Mithi v1 Flash &bull; 24 kHz Studio WAV</p>
          </div>
        </div>

        {/* Metadata badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-3 py-1 bg-white/90 text-mavs-plum font-bold rounded-xl border border-[rgba(44,16,48,0.10)] shadow-soft">
            {audioResult.language.toUpperCase()}
          </span>
          <span className="px-3 py-1 bg-mavs-pink text-white font-bold rounded-xl shadow-accent">
            Voice: {audioResult.voice.charAt(0).toUpperCase() + audioResult.voice.slice(1)}
          </span>
          <span className="px-3 py-1 bg-mavs-plum text-white font-bold rounded-xl shadow-soft">
            {effectiveDuration.toFixed(2)}s
          </span>
        </div>
      </div>

      {/* Main player controls */}
      <div className="space-y-4">
        {/* Playback Progress */}
        <div className="space-y-1.5">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={effectiveDuration || 1}
              step={0.01}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2.5 bg-[rgba(44,16,48,0.06)] rounded-lg appearance-none cursor-pointer accent-mavs-pink focus:outline-none"
            />
          </div>
          <div className="flex justify-between text-xs font-semibold text-mavs-muted font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(effectiveDuration)}</span>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={togglePlay}
              className="w-12 h-12 rounded-2xl bg-mavs-pink hover:bg-mavs-pink-hover text-white shadow-accent flex items-center justify-center btn-soft cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className="p-3 bg-white/90 hover:bg-mavs-pink/10 text-mavs-plum border border-[rgba(44,16,48,0.10)] rounded-2xl shadow-soft btn-soft cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-mavs-pink" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-white/90 hover:bg-mavs-pink/10 text-mavs-plum font-semibold text-xs rounded-2xl border border-[rgba(44,16,48,0.10)] shadow-soft btn-soft cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-mavs-pink" />
              <span>Generate Again</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-mavs-plum hover:bg-[#1a091d] text-white rounded-2xl text-xs font-bold shadow-soft-md btn-soft cursor-pointer"
            >
              <IconDownloadAudio className="w-4 h-4 text-mavs-orange" />
              <span>Download WAV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Generated text preview */}
      <div className="p-4 bg-[rgba(250,240,227,0.7)] rounded-2xl border border-[rgba(44,16,48,0.08)] text-xs font-medium text-mavs-plum leading-relaxed">
        <span className="font-bold text-mavs-pink mr-1.5 uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-white border border-[rgba(44,16,48,0.08)]">Script</span>
        &ldquo;{audioResult.text}&rdquo;
      </div>
    </div>
  );
};
