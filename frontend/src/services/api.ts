import type { AppConfigResponse, HealthResponse, ModelStatus } from '../types';

export async function getApiBaseUrl(): Promise<string> {
  if (typeof window !== 'undefined' && window.mavsDesktop?.getBackendUrl) {
    try {
      const url = await window.mavsDesktop.getBackendUrl();
      if (url) return url;
    } catch {
      // Fallback
    }
  }

  return import.meta.env.VITE_API_BASE_URL || '';
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function checkHealth(): Promise<HealthResponse> {
  const base = await getApiBaseUrl();
  const url = `${base}/health`;
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.detail || `Server reported status ${res.status}`, res.status);
    }
    return await res.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Unable to connect to MAVS local engine. Backend is initializing...', 0);
  }
}

export async function fetchModelStatus(): Promise<ModelStatus> {
  const base = await getApiBaseUrl();
  const url = `${base}/api/model/status`;
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.detail || `Failed to fetch model status (${res.status})`, res.status);
    }
    return await res.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Unable to communicate with model manager.', 0);
  }
}

export async function startModelDownload(): Promise<{ message: string; status: string }> {
  const base = await getApiBaseUrl();
  const url = `${base}/api/model/download`;
  try {
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.detail || `Failed to start download (${res.status})`, res.status);
    }
    return await res.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Failed to trigger model download.', 0);
  }
}

export async function initializeModel(): Promise<{ message: string; model_loaded: boolean }> {
  const base = await getApiBaseUrl();
  const url = `${base}/api/model/initialize`;
  try {
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.detail || `Model initialization failed (${res.status})`, res.status);
    }
    return await res.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Failed to initialize model in memory.', 0);
  }
}

export async function fetchConfig(): Promise<AppConfigResponse> {
  const base = await getApiBaseUrl();
  const url = `${base}/api/config`;
  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.detail || `Failed to fetch studio configuration (${res.status})`, res.status);
    }
    return await res.json();
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Unable to fetch model configuration from backend.', 0);
  }
}

export interface GenerateSpeechResult {
  blob: Blob;
  duration: number;
  sampleRate: number;
  language: string;
  voice: string;
}

export async function generateSpeech(
  text: string,
  language: string,
  voice: string,
  seed?: number
): Promise<GenerateSpeechResult> {
  const base = await getApiBaseUrl();
  const url = `${base}/api/generate`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        language,
        voice,
        seed: seed !== undefined ? seed : null,
      }),
    });

    if (!res.ok) {
      let errorMsg = `Generation failed (${res.status})`;
      try {
        const errJson = await res.json();
        if (errJson && errJson.detail) {
          errorMsg = errJson.detail;
        }
      } catch {
        // Fallback
      }
      throw new ApiError(errorMsg, res.status);
    }

    const durationHeader = res.headers.get('X-Audio-Duration');
    const sampleRateHeader = res.headers.get('X-Sample-Rate');
    const langHeader = res.headers.get('X-Language');
    const voiceHeader = res.headers.get('X-Voice');

    const duration = durationHeader ? parseFloat(durationHeader) : 0;
    const sampleRate = sampleRateHeader ? parseInt(sampleRateHeader, 10) : 24000;
    const blob = await res.blob();

    return {
      blob,
      duration,
      sampleRate,
      language: langHeader || language,
      voice: voiceHeader || voice,
    };
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    throw new ApiError('Network error while generating speech. Please verify the local engine is active.', 0);
  }
}
