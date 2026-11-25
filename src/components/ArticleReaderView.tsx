import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Headphones,
  Loader2,
  Pause,
  Play,
  Share2,
  Volume2,
} from 'lucide-react';
import { Article, SiteSettings, VOICE_PROFILES, VoiceName } from '../types/blog';
import { splitArticleIntoSegments, useAudioPlayer } from '../context/AudioPlayerContext';
import { EditorialImage } from './EditorialImage';

interface ArticleReaderViewProps {
  article: Article;
  relatedArticles: Article[];
  settings: SiteSettings;
  onBack: () => void;
  onOpenArticle: (articleId: string) => void;
}

export const ArticleReaderView: React.FC<ArticleReaderViewProps> = ({
  article,
  relatedArticles,
  settings,
  onBack,
  onOpenArticle,
}) => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const {
    currentArticle,
    activeSegmentIndex,
    isPlaying,
    isLoadingSegment,
    playbackRate,
    voiceName,
    playArticle,
    togglePlayPause,
    jumpToSegment,
    setPlaybackRate,
    setVoiceName,
  } = useAudioPlayer();

  const segments = useMemo(() => splitArticleIntoSegments(article), [article]);
  const paragraphs = useMemo(() => segments.slice(1), [segments]);
  const isThisArticleActive = currentArticle?.id === article.id;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [article.id]);

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) {
        setScrollProgress(0);
        return;
      }
      setScrollProgress(Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100)));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleListenMain = () => {
    if (isThisArticleActive) {
      togglePlayPause();
    } else {
      void playArticle(article, 0);
    }
  };

  const handleCopyShareLink = async () => {
    try {
      const url = `${window.location.origin}/?article=${encodeURIComponent(article.id)}`;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(false);
    }
  };

  const formattedDate = (() => {
    try {
      return new Intl.DateTimeFormat(article.language === 'bn' ? 'bn-BD' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(article.createdAt));
    } catch {
      return new Date(article.createdAt).toLocaleDateString();
    }
  })();

  const isBangla = article.language === 'bn';

  return (
    <article className="pb-28">
      {/* Subtle reading progress indicator */}
      <div className="sticky top-0 z-20 h-0.5 bg-stone-200/70">
        <div
          className="h-full bg-[#9A3412] transition-[width] duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Back Breadcrumb */}
        <div className="mb-8">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-stone-600 hover:text-[#1C1917] transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isBangla ? 'সব প্রবন্ধে ফিরে যান' : 'Back to Journal'}</span>
          </button>
        </div>

        {/* 70/30 Asymmetric Editorial Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Main Essay Column (70%) */}
          <div className="lg:col-span-8">
            <header className="mb-8 pb-8 border-b border-stone-200">
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mb-4">
                <span className="uppercase tracking-widest text-[#9A3412] font-medium">
                  {article.category}
                </span>
                <span aria-hidden="true">·</span>
                <span>{isBangla ? 'বাংলা' : 'English'}</span>
                <span aria-hidden="true">·</span>
                <span className="font-data">{article.readTimeMinutes} min read</span>
                <span aria-hidden="true">·</span>
                <span>{formattedDate}</span>
              </div>

              <h1 className="font-editorial text-3xl sm:text-4xl lg:text-[2.85rem] font-semibold leading-[1.18] text-[#1C1917] mb-4 [text-wrap:balance]">
                {article.title}
              </h1>

              {article.subtitle && (
                <p className="text-lg sm:text-xl text-stone-600 leading-relaxed mb-6">
                  {article.subtitle}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <p className="text-sm text-stone-700">
                  {isBangla ? 'লিখেছেন: ' : 'By '}
                  <span className="font-semibold text-[#1C1917]">{article.authorName}</span>
                </p>

                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-[#1C1917] border border-stone-300 px-3 py-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{isBangla ? 'লিংক কপি হয়েছে' : 'Link Copied'}</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{isBangla ? 'শেয়ার করুন' : 'Share Essay'}</span>
                    </>
                  )}
                </button>
              </div>
            </header>

            {/* Primary One-Click TTS Listen Bar */}
            <section
              aria-label="Listen to this article"
              className={`mb-10 p-5 border transition-colors ${
                isThisArticleActive && isThisArticleActive && activeSegmentIndex === 0
                  ? 'border-[#9A3412]/50 bg-[#F3EFE7]'
                  : 'border-stone-200 bg-[#F5F1E8]/80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <button
                    type="button"
                    onClick={handleListenMain}
                    className="inline-flex items-center gap-2.5 px-5 py-3 text-sm font-medium bg-[#9A3412] hover:bg-[#7C2D12] text-[#FBF9F5] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A3412] focus-visible:ring-offset-2"
                  >
                    {isThisArticleActive && isLoadingSegment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isThisArticleActive && isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Headphones className="w-4 h-4" />
                    )}
                    <span>
                      {isThisArticleActive && isLoadingSegment
                        ? isBangla
                          ? 'ভয়েস প্রস্তুত হচ্ছে...'
                          : 'Synthesizing voice...'
                        : isThisArticleActive && isPlaying
                          ? isBangla
                            ? 'শোনা বিরতি দিন'
                            : 'Pause Narration'
                          : isBangla
                            ? 'পুরো আর্টিকেল শুনুন'
                            : 'Listen to Full Article'}
                    </span>
                  </button>

                  <div>
                    <p className="text-sm font-medium text-[#1C1917]">
                      {isBangla ? 'অডিও সংস্করণ' : 'Audio Edition'}
                    </p>
                    <p className="text-xs text-stone-600 font-data">
                      {paragraphs.length} paragraphs · Voice:{' '}
                      {isThisArticleActive ? voiceName : article.voicePreference}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    aria-label="Voice selection"
                    value={isThisArticleActive ? voiceName : article.voicePreference}
                    onChange={(e) => {
                      const nextVoice = e.target.value as VoiceName;
                      setVoiceName(nextVoice);
                      if (!isThisArticleActive) {
                        void playArticle({ ...article, voicePreference: nextVoice }, 0);
                      }
                    }}
                    className="bg-white border border-stone-300 text-xs text-stone-800 px-2.5 py-2 focus:outline-none focus:border-[#1C1917]"
                  >
                    {VOICE_PROFILES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Playback speed"
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(Number(e.target.value))}
                    className="bg-white border border-stone-300 text-xs font-data text-stone-800 px-2.5 py-2 focus:outline-none focus:border-[#1C1917]"
                  >
                    {[0.85, 1.0, 1.15, 1.3, 1.5].map((r) => (
                      <option key={r} value={r}>
                        {r}x
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Cover Photography */}
            {article.coverImage && (
              <figure className="mb-10">
                <EditorialImage
                  src={article.coverImage}
                  alt={article.title}
                  containerClassName="aspect-[16/10] border border-stone-200"
                  className="w-full h-full object-cover"
                />
                {article.coverCaption && (
                  <figcaption className="text-xs font-editorial italic text-stone-500 mt-2.5">
                    {article.coverCaption}
                  </figcaption>
                )}
              </figure>
            )}

            {/* Long-Form Prose Column (65-75ch) */}
            <div
              className={`max-w-2xl space-y-6 text-base sm:text-[17.5px] leading-[1.85] text-[#292524] ${
                isBangla ? 'article-prose-bn' : 'article-prose'
              }`}
            >
              {paragraphs.map((paragraph, idx) => {
                const segmentIdx = idx + 1;
                const isActiveParagraph =
                  isThisArticleActive && activeSegmentIndex === segmentIdx;

                return (
                  <div
                    key={segmentIdx}
                    className={`group relative rounded px-3 -mx-3 py-2 transition-colors ${
                      isActiveParagraph ? 'bg-[#EFEAE0]/90' : 'hover:bg-[#F5F1E8]/60'
                    }`}
                  >
                    <p>{paragraph}</p>
                    <button
                      type="button"
                      onClick={() => {
                        if (isThisArticleActive) {
                          jumpToSegment(segmentIdx);
                        } else {
                          void playArticle(article, segmentIdx);
                        }
                      }}
                      title={
                        isBangla ? 'এই অনুচ্ছেদ থেকে শুনুন' : 'Listen from this paragraph'
                      }
                      aria-label={`Listen from paragraph ${idx + 1}`}
                      className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium transition-opacity ${
                        isActiveParagraph
                          ? 'text-[#9A3412] opacity-100'
                          : 'text-stone-400 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-[#9A3412]'
                      }`}
                    >
                      {isActiveParagraph && isPlaying ? (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>{isBangla ? 'এখন পড়া হচ্ছে' : 'Narrating'}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3" />
                          <span>
                            {isBangla ? 'এখান থেকে শুনুন' : 'Listen from here'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Margin Rail (30%) */}
          <aside className="lg:col-span-4 space-y-8">
            {/* Voice Profile Guide */}
            <div className="border border-stone-200 bg-white/70 p-6">
              <p className="text-xs uppercase tracking-widest text-stone-500 mb-3">
                {isBangla ? 'কণ্ঠস্বর নির্বাচন' : 'Narrator Voices'}
              </p>
              <div className="space-y-2.5">
                {VOICE_PROFILES.map((vp) => {
                  const selected =
                    (isThisArticleActive ? voiceName : article.voicePreference) === vp.id;
                  return (
                    <button
                      key={vp.id}
                      type="button"
                      onClick={() => {
                        setVoiceName(vp.id);
                        if (!isThisArticleActive) {
                          void playArticle({ ...article, voicePreference: vp.id }, 0);
                        }
                      }}
                      className={`w-full text-left px-3 py-2 border transition-colors ${
                        selected
                          ? 'border-[#9A3412] bg-[#9A3412]/5'
                          : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#1C1917]">{vp.label}</span>
                        {selected && (
                          <span className="text-[11px] text-[#9A3412] font-medium">Active</span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {isBangla ? vp.toneBn : vp.toneEn}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Paragraph Jump Navigation */}
            <div className="border border-stone-200 bg-white/70 p-6">
              <p className="text-xs uppercase tracking-widest text-stone-500 mb-3">
                {isBangla ? 'অনুচ্ছেদ সূচি' : 'Audio Chapters'}
              </p>
              <div className="space-y-2">
                {paragraphs.map((p, idx) => {
                  const segmentIdx = idx + 1;
                  const active = isThisArticleActive && activeSegmentIndex === segmentIdx;
                  return (
                    <button
                      key={segmentIdx}
                      type="button"
                      onClick={() => {
                        if (isThisArticleActive) {
                          jumpToSegment(segmentIdx);
                        } else {
                          void playArticle(article, segmentIdx);
                        }
                      }}
                      className={`w-full text-left py-1.5 px-2 text-xs transition-colors flex items-start gap-2.5 ${
                        active
                          ? 'text-[#9A3412] font-medium bg-[#EFEAE0]/80'
                          : 'text-stone-600 hover:text-[#1C1917]'
                      }`}
                    >
                      <span className="font-data text-[11px] text-stone-400 shrink-0 mt-0.5">
                        {String(idx + 1).padStart(2, '0')}.
                      </span>
                      <span className="line-clamp-2">{p}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editor Note */}
            <div className="border-t border-stone-200 pt-5">
              <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">
                {settings.publicationName}
              </p>
              <p className="text-xs text-stone-600 leading-relaxed">{settings.editorBio}</p>
            </div>
          </aside>
        </div>

        {/* Related Essays */}
        {relatedArticles.length > 0 && (
          <section className="mt-16 pt-10 border-t border-stone-200">
            <h2 className="text-xs uppercase tracking-widest text-stone-500 mb-6">
              {isBangla ? 'আরও পড়ুন ও শুনুন' : 'Continue Reading & Listening'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedArticles.slice(0, 3).map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onOpenArticle(rel.id)}
                  className="cursor-pointer group border border-stone-200 bg-white/60 p-5 hover:border-stone-400 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
                    <span>{rel.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{rel.language === 'bn' ? 'বাংলা' : 'English'}</span>
                  </div>
                  <h3 className="font-editorial text-lg font-semibold text-[#1C1917] group-hover:text-[#9A3412] transition-colors mb-2">
                    {rel.title}
                  </h3>
                  <p className="text-xs text-stone-600 line-clamp-2">{rel.excerpt}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
};
