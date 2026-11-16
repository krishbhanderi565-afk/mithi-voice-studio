export interface LanguageOption {
  code: string;
  name: string;
  native_name: string;
}

export interface VoiceOption {
  id: string;
  name: string;
  gender: string;
  description: string;
}

export interface AudioFormatConfig {
  media_type: string;
  sample_rate: number;
  channels: number;
  bits_per_sample: number;
  codec: string;
}

export interface AppConfigResponse {
  model_name: string;
  model_version: string;
  default_language: string;
  default_voice: string;
  max_text_length: number;
  languages: LanguageOption[];
  voices: VoiceOption[];
  audio_format: AudioFormatConfig;
}

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  device: string;
  cpu_threads: number;
  model_name: string;
  model_version: string;
  details: Record<string, string>;
}

export interface ModelStatus {
  is_installed: boolean;
  is_loaded: boolean;
  model_path: string;
  missing_files: string[];
  status: string;
  progress_percent: number;
  total_bytes: number;
  downloaded_bytes: number;
  free_disk_mb: number;
  error?: string | null;
}

export interface AudioResult {
  blob: Blob;
  url: string;
  duration: number;
  sampleRate: number;
  language: string;
  voice: string;
  text: string;
  createdAt: Date;
}

declare global {
  interface Window {
    mavsDesktop?: {
      isDesktop: boolean;
      getBackendUrl: () => Promise<string>;
      getBackendPort: () => Promise<number>;
      getAppVersion: () => Promise<string>;
      openExternal: (url: string) => Promise<void>;
      onBackendStatus: (callback: (status: { ready: boolean; error?: string }) => void) => void;
    };
  }
}
