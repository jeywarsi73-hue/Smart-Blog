import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Article, VoiceName } from '../types/blog';

interface AudioPlayerContextValue {
  currentArticle: Article | null;
  segments: string[];
  activeSegmentIndex: number;
  isPlaying: boolean;
  isLoadingSegment: boolean;
  playbackRate: number;
  voiceName: VoiceName;
  segmentProgress: number; // 0 to 1
  segmentDuration: number; // seconds
  error: string | null;
  usingBrowserSpeech: boolean;
  playArticle: (article: Article, startSegment?: number) => Promise<void>;
  togglePlayPause: () => void;
  stopPlayback: () => void;
  nextSegment: () => void;
  prevSegment: () => void;
  jumpToSegment: (index: number) => void;
  setPlaybackRate: (rate: number) => void;
  setVoiceName: (voice: VoiceName) => void;
  activateBrowserSpeechFallback: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

export function splitArticleIntoSegments(article: Article): string[] {
  const headerSegment = article.subtitle
    ? `${article.title}. ${article.subtitle}`
    : article.title;
  const paragraphs = article.content
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  return [headerSegment, ...paragraphs];
}

function base64ToWavUrl(base64: string): string {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

export const AudioPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [segments, setSegments] = useState<string[]>([]);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoadingSegment, setIsLoadingSegment] = useState<boolean>(false);
  const [playbackRate, setPlaybackRateState] = useState<number>(1.0);
  const [voiceName, setVoiceNameState] = useState<VoiceName>('Kore');
  const [segmentProgress, setSegmentProgress] = useState<number>(0);
  const [segmentDuration, setSegmentDuration] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [usingBrowserSpeech, setUsingBrowserSpeech] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlCacheRef = useRef<Map<string, string>>(new Map());
  const inflightRef = useRef<Map<string, Promise<string>>>(new Map());
  const playSessionRef = useRef<number>(0);
  const segmentsRef = useRef<string[]>([]);
  const articleRef = useRef<Article | null>(null);
  const voiceRef = useRef<VoiceName>('Kore');
  const rateRef = useRef<number>(1.0);
  const usingBrowserSpeechRef = useRef<boolean>(false);

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    articleRef.current = currentArticle;
  }, [currentArticle]);

  useEffect(() => {
    voiceRef.current = voiceName;
  }, [voiceName]);

  useEffect(() => {
    rateRef.current = playbackRate;
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    usingBrowserSpeechRef.current = usingBrowserSpeech;
  }, [usingBrowserSpeech]);

  const cancelBrowserSpeech = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const fetchAudioUrlForSegment = useCallback(
    async (article: Article, index: number, text: string, voice: VoiceName): Promise<string> => {
      const key = `${article.id}:${voice}:${index}:${text.slice(0, 32)}`;
      const existing = urlCacheRef.current.get(key);
      if (existing) {
        return existing;
      }

      const inflight = inflightRef.current.get(key);
      if (inflight) {
        return inflight;
      }

      const promise = (async () => {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            language: article.language,
            voiceName: voice,
          }),
        });

        const payload = (await res.json().catch(() => ({}))) as {
          audioBase64?: string;
          error?: string;
        };

        if (!res.ok || !payload.audioBase64) {
          throw new Error(payload.error || `Audio synthesis failed (${res.status}).`);
        }

        const objectUrl = base64ToWavUrl(payload.audioBase64);
        urlCacheRef.current.set(key, objectUrl);
        return objectUrl;
      })();

      inflightRef.current.set(key, promise);
      try {
        return await promise;
      } finally {
        inflightRef.current.delete(key);
      }
    },
    []
  );

  const speakWithBrowser = useCallback(
    (article: Article, segs: string[], index: number, session: number) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        setError('Browser speech synthesis is unavailable on this device.');
        setIsPlaying(false);
        return;
      }

      cancelBrowserSpeech();
      const text = segs[index];
      if (!text) {
        setIsPlaying(false);
        return;
      }

      setActiveSegmentIndex(index);
      setIsLoadingSegment(false);
      setIsPlaying(true);

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = article.language === 'bn' ? 'bn-BD' : 'en-US';
      utterance.rate = rateRef.current;

      const voices = window.speechSynthesis.getVoices();
      const matched = voices.find((v) =>
        v.lang.toLowerCase().startsWith(article.language === 'bn' ? 'bn' : 'en')
      );
      if (matched) {
        utterance.voice = matched;
      }

      utterance.onend = () => {
        if (playSessionRef.current !== session) return;
        const nextIdx = index + 1;
        if (nextIdx < segs.length) {
          speakWithBrowser(article, segs, nextIdx, session);
        } else {
          setIsPlaying(false);
          setSegmentProgress(1);
        }
      };

      utterance.onerror = () => {
        if (playSessionRef.current !== session) return;
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [cancelBrowserSpeech]
  );

  const playSegmentInternal = useCallback(
    async (
      article: Article,
      segs: string[],
      index: number,
      voice: VoiceName,
      session: number
    ) => {
      if (index < 0 || index >= segs.length) {
        setIsPlaying(false);
        return;
      }

      if (usingBrowserSpeechRef.current) {
        speakWithBrowser(article, segs, index, session);
        return;
      }

      setActiveSegmentIndex(index);
      setSegmentProgress(0);
      setSegmentDuration(0);
      setIsLoadingSegment(true);
      setError(null);

      if (audioRef.current) {
        audioRef.current.pause();
      }
      cancelBrowserSpeech();

      try {
        const audioUrl = await fetchAudioUrlForSegment(article, index, segs[index], voice);
        if (playSessionRef.current !== session) {
          return;
        }

        // Prefetch next paragraph in background for seamless transition
        if (index + 1 < segs.length) {
          void fetchAudioUrlForSegment(article, index + 1, segs[index + 1], voice).catch(
            () => undefined
          );
        }

        const audio = audioRef.current ?? new Audio();
        audioRef.current = audio;
        audio.src = audioUrl;
        audio.playbackRate = rateRef.current;

        audio.onloadedmetadata = () => {
          if (playSessionRef.current === session) {
            setSegmentDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
          }
        };

        audio.ontimeupdate = () => {
          if (playSessionRef.current === session && audio.duration > 0) {
            setSegmentProgress(audio.currentTime / audio.duration);
          }
        };

        audio.onended = () => {
          if (playSessionRef.current !== session) return;
          const nextIdx = index + 1;
          if (nextIdx < segs.length) {
            void playSegmentInternal(article, segs, nextIdx, voice, session);
          } else {
            setIsPlaying(false);
            setSegmentProgress(1);
          }
        };

        audio.onerror = () => {
          if (playSessionRef.current !== session) return;
          setError('Audio playback failed for this paragraph.');
          setIsPlaying(false);
          setIsLoadingSegment(false);
        };

        setIsLoadingSegment(false);
        await audio.play();
        if (playSessionRef.current === session) {
          setIsPlaying(true);
        }
      } catch (err: unknown) {
        if (playSessionRef.current !== session) return;
        const msg = err instanceof Error ? err.message : 'Unable to generate article speech.';
        setError(msg);
        setIsLoadingSegment(false);
        setIsPlaying(false);
      }
    },
    [cancelBrowserSpeech, fetchAudioUrlForSegment, speakWithBrowser]
  );

  const playArticle = useCallback(
    async (article: Article, startSegment = 0) => {
      const session = ++playSessionRef.current;
      const segs = splitArticleIntoSegments(article);
      const chosenVoice = article.voicePreference || voiceRef.current;

      setCurrentArticle(article);
      setSegments(segs);
      setVoiceNameState(chosenVoice);
      setUsingBrowserSpeech(false);
      usingBrowserSpeechRef.current = false;

      await playSegmentInternal(article, segs, startSegment, chosenVoice, session);
    },
    [playSegmentInternal]
  );

  const togglePlayPause = useCallback(() => {
    if (!articleRef.current) return;

    if (usingBrowserSpeechRef.current) {
      if (isPlaying) {
        window.speechSynthesis.pause();
        setIsPlaying(false);
      } else if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        const session = ++playSessionRef.current;
        speakWithBrowser(articleRef.current, segmentsRef.current, activeSegmentIndex, session);
      }
      return;
    }

    const audio = audioRef.current;
    if (!audio || !audio.src) {
      const session = ++playSessionRef.current;
      void playSegmentInternal(
        articleRef.current,
        segmentsRef.current,
        activeSegmentIndex,
        voiceRef.current,
        session
      );
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      void audio.play().then(() => setIsPlaying(true));
    }
  }, [activeSegmentIndex, isPlaying, playSegmentInternal, speakWithBrowser]);

  const stopPlayback = useCallback(() => {
    playSessionRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    cancelBrowserSpeech();
    setIsPlaying(false);
    setIsLoadingSegment(false);
    setCurrentArticle(null);
    setSegments([]);
    setActiveSegmentIndex(0);
    setSegmentProgress(0);
    setError(null);
  }, [cancelBrowserSpeech]);

  const jumpToSegment = useCallback(
    (index: number) => {
      if (!articleRef.current) return;
      const clamped = Math.max(0, Math.min(segmentsRef.current.length - 1, index));
      const session = ++playSessionRef.current;
      void playSegmentInternal(
        articleRef.current,
        segmentsRef.current,
        clamped,
        voiceRef.current,
        session
      );
    },
    [playSegmentInternal]
  );

  const nextSegment = useCallback(() => {
    jumpToSegment(activeSegmentIndex + 1);
  }, [activeSegmentIndex, jumpToSegment]);

  const prevSegment = useCallback(() => {
    jumpToSegment(activeSegmentIndex - 1);
  }, [activeSegmentIndex, jumpToSegment]);

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
  }, []);

  const setVoiceName = useCallback(
    (newVoice: VoiceName) => {
      setVoiceNameState(newVoice);
      voiceRef.current = newVoice;
      setUsingBrowserSpeech(false);
      usingBrowserSpeechRef.current = false;
      if (articleRef.current && (isPlaying || isLoadingSegment)) {
        const session = ++playSessionRef.current;
        void playSegmentInternal(
          articleRef.current,
          segmentsRef.current,
          activeSegmentIndex,
          newVoice,
          session
        );
      }
    },
    [activeSegmentIndex, isLoadingSegment, isPlaying, playSegmentInternal]
  );

  const activateBrowserSpeechFallback = useCallback(() => {
    if (!articleRef.current) return;
    setError(null);
    setUsingBrowserSpeech(true);
    usingBrowserSpeechRef.current = true;
    const session = ++playSessionRef.current;
    speakWithBrowser(articleRef.current, segmentsRef.current, activeSegmentIndex, session);
  }, [activeSegmentIndex, speakWithBrowser]);

  useEffect(() => {
    const cache = urlCacheRef.current;
    return () => {
      playSessionRef.current += 1;
      audioRef.current?.pause();
      cancelBrowserSpeech();
      cache.forEach((url) => URL.revokeObjectURL(url));
      cache.clear();
    };
  }, [cancelBrowserSpeech]);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentArticle,
        segments,
        activeSegmentIndex,
        isPlaying,
        isLoadingSegment,
        playbackRate,
        voiceName,
        segmentProgress,
        segmentDuration,
        error,
        usingBrowserSpeech,
        playArticle,
        togglePlayPause,
        stopPlayback,
        nextSegment,
        prevSegment,
        jumpToSegment,
        setPlaybackRate,
        setVoiceName,
        activateBrowserSpeechFallback,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};

export function useAudioPlayer(): AudioPlayerContextValue {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  }
  return ctx;
}
