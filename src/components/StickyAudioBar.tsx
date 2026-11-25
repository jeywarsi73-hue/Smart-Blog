import React from 'react';
import {
  Loader2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  X,
} from 'lucide-react';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { VOICE_PROFILES, VoiceName } from '../types/blog';

const SPEED_OPTIONS = [0.85, 1.0, 1.15, 1.3, 1.5];

export const StickyAudioBar: React.FC<{
  onOpenArticle: (articleId: string) => void;
}> = ({ onOpenArticle }) => {
  const {
    currentArticle,
    segments,
    activeSegmentIndex,
    isPlaying,
    isLoadingSegment,
    playbackRate,
    voiceName,
    segmentProgress,
    error,
    usingBrowserSpeech,
    togglePlayPause,
    stopPlayback,
    nextSegment,
    prevSegment,
    setPlaybackRate,
    setVoiceName,
    activateBrowserSpeechFallback,
  } = useAudioPlayer();

  if (!currentArticle) {
    return null;
  }

  const totalSegments = Math.max(1, segments.length);
  const overallPct = Math.min(
    100,
    Math.round(((activeSegmentIndex + segmentProgress) / totalSegments) * 100)
  );

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-40 bg-[#1C1917] text-[#FBF9F5] border-t border-stone-800 shadow-lg"
      role="region"
      aria-label="Article audio player"
    >
      {/* Thin continuous progress line along top edge */}
      <div className="h-0.5 w-full bg-stone-800">
        <div
          className="h-full bg-[#C2410C] transition-[width] duration-200"
          style={{ width: `${overallPct}%` }}
        />
      </div>

      {error && (
        <div className="bg-[#7C2D12] text-[#FBF9F5] px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2">
          <span className="truncate">{error}</span>
          <button
            type="button"
            onClick={activateBrowserSpeechFallback}
            className="underline font-medium whitespace-nowrap shrink-0 hover:text-stone-200"
          >
            Use Browser Voice Fallback
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Track info */}
        <button
          type="button"
          onClick={() => onOpenArticle(currentArticle.id)}
          className="min-w-0 flex-1 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C] rounded"
        >
          <p className="text-sm font-editorial font-semibold truncate group-hover:underline">
            {currentArticle.title}
          </p>
          <p className="text-xs text-stone-400 font-data truncate">
            {currentArticle.language === 'bn' ? 'বাংলা' : 'English'} · Paragraph{' '}
            {activeSegmentIndex + 1}/{totalSegments}
            {usingBrowserSpeech ? ' · Browser Voice' : ` · ${voiceName}`}
          </p>
        </button>

        {/* Center: Playback controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={prevSegment}
            disabled={activeSegmentIndex <= 0}
            aria-label="Previous paragraph"
            className="p-2 text-stone-300 hover:text-white disabled:opacity-35 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C] rounded"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={togglePlayPause}
            aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#9A3412] hover:bg-[#B45309] text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {isLoadingSegment ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={nextSegment}
            disabled={activeSegmentIndex >= totalSegments - 1}
            aria-label="Next paragraph"
            className="p-2 text-stone-300 hover:text-white disabled:opacity-35 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C] rounded"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Speed & Voice (hidden on narrow mobile to keep <=15% height & clean layout) */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-stone-400" />
            <select
              aria-label="Narrator voice"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value as VoiceName)}
              className="bg-stone-800 border border-stone-700 text-xs text-stone-200 px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-[#C2410C]"
            >
              {VOICE_PROFILES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          <select
            aria-label="Playback speed"
            value={playbackRate}
            onChange={(e) => setPlaybackRate(Number(e.target.value))}
            className="bg-stone-800 border border-stone-700 text-xs font-data text-stone-200 px-2 py-1 rounded focus:outline-none focus:ring-1 focus:ring-[#C2410C]"
          >
            {SPEED_OPTIONS.map((rate) => (
              <option key={rate} value={rate}>
                {rate}x
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={stopPlayback}
            aria-label="Close audio player"
            className="p-2 text-stone-400 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C] rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
