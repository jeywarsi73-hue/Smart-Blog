import React, { useMemo, useState } from 'react';
import { ArrowRight, Headphones, Loader2, Pause, Search } from 'lucide-react';
import { Article, ArticleLanguage, SiteSettings } from '../types/blog';
import { useAudioPlayer } from '../context/AudioPlayerContext';
import { EditorialImage } from './EditorialImage';

interface BlogFrontPageProps {
  articles: Article[];
  settings: SiteSettings;
  languageFilter: 'all' | ArticleLanguage;
  onLanguageFilterChange: (lang: 'all' | ArticleLanguage) => void;
  onOpenArticle: (articleId: string) => void;
  isLoading: boolean;
}

function formatEditorialDate(ms: number, lang: ArticleLanguage): string {
  try {
    return new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toLocaleDateString();
  }
}

export const BlogFrontPage: React.FC<BlogFrontPageProps> = ({
  articles,
  settings,
  languageFilter,
  onLanguageFilterChange,
  onOpenArticle,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { currentArticle, isPlaying, isLoadingSegment, playArticle, togglePlayPause } =
    useAudioPlayer();

  const categories = useMemo(() => {
    const set = new Set<string>();
    articles.forEach((a) => {
      if (languageFilter === 'all' || a.language === languageFilter) {
        set.add(a.category);
      }
    });
    return ['all', ...Array.from(set)];
  }, [articles, languageFilter]);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return articles.filter((article) => {
      if (languageFilter !== 'all' && article.language !== languageFilter) {
        return false;
      }
      if (selectedCategory !== 'all' && article.category !== selectedCategory) {
        return false;
      }
      if (q.length > 0) {
        const hay = `${article.title} ${article.subtitle ?? ''} ${article.excerpt} ${article.category}`.toLowerCase();
        return hay.includes(q);
      }
      return true;
    });
  }, [articles, languageFilter, selectedCategory, searchQuery]);

  const leadArticle = useMemo(() => {
    if (filteredArticles.length === 0) return null;
    return filteredArticles.find((a) => a.featured) ?? filteredArticles[0];
  }, [filteredArticles]);

  const secondaryArticles = useMemo(() => {
    if (!leadArticle) return [];
    return filteredArticles.filter((a) => a.id !== leadArticle.id).slice(0, 3);
  }, [filteredArticles, leadArticle]);

  const archiveArticles = useMemo(() => {
    if (!leadArticle) return [];
    const usedIds = new Set([leadArticle.id, ...secondaryArticles.map((a) => a.id)]);
    return filteredArticles.filter((a) => !usedIds.has(a.id));
  }, [filteredArticles, leadArticle, secondaryArticles]);

  const handleListenToggle = (article: Article, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentArticle?.id === article.id) {
      togglePlayPause();
    } else {
      void playArticle(article, 0);
    }
  };

  const renderListenButton = (article: Article, variant: 'primary' | 'subtle' = 'subtle') => {
    const isThisActive = currentArticle?.id === article.id;
    const isThisLoading = isThisActive && isLoadingSegment;
    const isThisPlaying = isThisActive && isPlaying;

    const label = isThisLoading
      ? article.language === 'bn'
        ? 'অডিও প্রস্তুত হচ্ছে...'
        : 'Preparing audio...'
      : isThisPlaying
        ? article.language === 'bn'
          ? 'বিরতি দিন'
          : 'Pause Audio'
        : article.language === 'bn'
          ? 'আর্টিকেল শুনুন'
          : 'Listen Now';

    if (variant === 'primary') {
      return (
        <button
          type="button"
          onClick={(e) => handleListenToggle(article, e)}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-[#9A3412] text-[#FBF9F5] hover:bg-[#7C2D12] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A3412] focus-visible:ring-offset-2"
        >
          {isThisLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isThisPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Headphones className="w-4 h-4" />
          )}
          <span>{label}</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={(e) => handleListenToggle(article, e)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A3412] ${
          isThisActive
            ? 'border-[#9A3412] text-[#9A3412] bg-[#9A3412]/5'
            : 'border-stone-300 text-stone-700 hover:border-stone-900 hover:text-stone-900'
        }`}
      >
        {isThisLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isThisPlaying ? (
          <Pause className="w-3.5 h-3.5" />
        ) : (
          <Headphones className="w-3.5 h-3.5" />
        )}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24">
      {/* Masthead Editorial Tagline */}
      <section className="border-b border-stone-200 pb-6 mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">
              Bilingual Text-to-Speech Journal · বাংলা ও ইংরেজি অডিও ব্লগ
            </p>
            <p className="text-base sm:text-lg text-stone-700 leading-relaxed">
              {settings.publicationTagline}
            </p>
          </div>
          <p className="text-xs text-stone-500 font-data whitespace-nowrap shrink-0">
            {articles.length} {articles.length === 1 ? 'Essay' : 'Essays'} Published
          </p>
        </div>
      </section>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-14 animate-pulse">
          <div className="lg:col-span-6 space-y-4 py-4">
            <div className="h-4 w-40 bg-stone-200" />
            <div className="h-12 w-full bg-stone-200" />
            <div className="h-12 w-3/4 bg-stone-200" />
            <div className="h-20 w-full bg-stone-200" />
          </div>
          <div className="lg:col-span-6 aspect-[4/3] bg-stone-200" />
        </div>
      )}

      {/* Tier 1: Lead Featured Story */}
      {!isLoading && leadArticle && (
        <section aria-label="Lead story" className="mb-14 pb-12 border-b border-stone-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between py-1">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mb-4">
                  <span className="uppercase tracking-widest text-[#9A3412] font-medium">
                    Featured Essay
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{leadArticle.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{leadArticle.language === 'bn' ? 'বাংলা' : 'English'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-data">{leadArticle.readTimeMinutes} min read</span>
                </div>

                <h1
                  onClick={() => onOpenArticle(leadArticle.id)}
                  className="font-editorial text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold leading-[1.18] text-[#1C1917] mb-4 cursor-pointer hover:text-[#9A3412] transition-colors [text-wrap:balance]"
                >
                  {leadArticle.title}
                </h1>

                {leadArticle.subtitle && (
                  <p className="text-base sm:text-lg text-stone-600 leading-relaxed mb-4">
                    {leadArticle.subtitle}
                  </p>
                )}

                <p className="text-sm sm:text-base text-stone-700 leading-relaxed mb-6">
                  {leadArticle.excerpt}
                </p>
              </div>

              <div className="pt-4 border-t border-stone-200/80 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-stone-500">
                  <span className="font-medium text-stone-800">{leadArticle.authorName}</span>
                  <span className="mx-2" aria-hidden="true">
                    ·
                  </span>
                  <span>{formatEditorialDate(leadArticle.createdAt, leadArticle.language)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {renderListenButton(leadArticle, 'primary')}
                  <button
                    type="button"
                    onClick={() => onOpenArticle(leadArticle.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border border-stone-300 text-[#1C1917] hover:border-[#1C1917] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1917]"
                  >
                    <span>{leadArticle.language === 'bn' ? 'সম্পূর্ণ পড়ুন' : 'Read Essay'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 flex flex-col">
              <div
                onClick={() => onOpenArticle(leadArticle.id)}
                className="cursor-pointer flex-1 min-h-[280px] lg:min-h-[380px] relative group"
              >
                <EditorialImage
                  src={leadArticle.coverImage}
                  alt={leadArticle.title}
                  containerClassName="w-full h-full border border-stone-200"
                  className="w-full h-full object-cover group-hover:scale-[1.015] transition-transform duration-300"
                />
              </div>
              {leadArticle.coverCaption && (
                <p className="text-xs font-editorial italic text-stone-500 mt-2">
                  {leadArticle.coverCaption}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Filter & Search Toolbar */}
      <section aria-label="Filter essays" className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center p-1 bg-[#EFEAE0] border border-stone-200">
              {(
                [
                  { id: 'all', label: 'All Essays' },
                  { id: 'bn', label: 'বাংলা (Bangla)' },
                  { id: 'en', label: 'English' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onLanguageFilterChange(tab.id);
                    setSelectedCategory('all');
                  }}
                  className={`px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    languageFilter === tab.id
                      ? 'bg-[#FBF9F5] text-[#1C1917] shadow-xs'
                      : 'text-stone-600 hover:text-[#1C1917]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {categories.length > 2 && (
              <select
                aria-label="Filter by category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#FBF9F5] border border-stone-300 text-xs text-stone-700 px-3 py-2 focus:outline-none focus:border-[#1C1917]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search essays in বাংলা or English..."
              aria-label="Search essays"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-stone-300 text-[#1C1917] placeholder:text-stone-400 focus:outline-none focus:border-[#1C1917]"
            />
          </div>
        </div>
      </section>

      {/* Empty Search State */}
      {!isLoading && filteredArticles.length === 0 && (
        <div className="py-16 text-center border border-stone-200 bg-[#F5F1E8]/60 mb-14">
          <p className="font-editorial text-xl text-stone-800 mb-2">
            No matching essays found
          </p>
          <p className="text-sm text-stone-600 mb-5">
            Try clearing your search filter or switching between Bangla and English editions.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              onLanguageFilterChange('all');
            }}
            className="px-4 py-2 text-xs font-medium bg-[#1C1917] text-[#FBF9F5] hover:bg-stone-800 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Tier 2: Secondary Editorial Features */}
      {!isLoading && secondaryArticles.length > 0 && (
        <section aria-label="Featured collection" className="mb-16">
          <h2 className="text-xs uppercase tracking-widest text-stone-500 mb-6">
            Recent Dispatches · সাম্প্রতিক লেখা
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {secondaryArticles.map((article) => (
              <article
                key={article.id}
                onClick={() => onOpenArticle(article.id)}
                className="group cursor-pointer flex flex-col justify-between border-b border-stone-200 pb-6 md:border-b-0 md:pb-0"
              >
                <div>
                  <EditorialImage
                    src={article.coverImage}
                    alt={article.title}
                    containerClassName="aspect-[4/3] mb-4 border border-stone-200"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  />

                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mb-2">
                    <span>{article.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{article.language === 'bn' ? 'বাংলা' : 'English'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-data">{article.readTimeMinutes} min</span>
                  </div>

                  <h3 className="font-editorial text-xl font-semibold text-[#1C1917] leading-snug mb-2 group-hover:text-[#9A3412] transition-colors">
                    {article.title}
                  </h3>

                  <p className="text-sm text-stone-600 leading-relaxed line-clamp-3 mb-4">
                    {article.excerpt}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-200/70">
                  <span className="text-xs text-stone-500">
                    {formatEditorialDate(article.createdAt, article.language)}
                  </span>
                  {renderListenButton(article, 'subtle')}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Tier 3: Editorial Archive List */}
      {!isLoading && archiveArticles.length > 0 && (
        <section aria-label="Archive list" className="mb-16 pt-8 border-t border-stone-200">
          <h2 className="text-xs uppercase tracking-widest text-stone-500 mb-6">
            Editorial Archive · আর্কাইভ
          </h2>
          <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
            {archiveArticles.map((article) => (
              <div
                key={article.id}
                onClick={() => onOpenArticle(article.id)}
                className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group hover:bg-[#F3EFE7]/50 px-2 -mx-2 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mb-1">
                    <span>{article.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{article.language === 'bn' ? 'বাংলা' : 'English'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatEditorialDate(article.createdAt, article.language)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-data">{article.readTimeMinutes} min read</span>
                  </div>
                  <h3 className="font-editorial text-lg font-semibold text-[#1C1917] group-hover:text-[#9A3412] transition-colors">
                    {article.title}
                  </h3>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {renderListenButton(article, 'subtle')}
                  <span className="text-xs font-medium text-stone-700 group-hover:text-[#9A3412] inline-flex items-center gap-1 whitespace-nowrap">
                    Read <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* About Section */}
      <section
        id="about-section"
        className="mt-12 pt-10 border-t border-stone-300 grid grid-cols-1 md:grid-cols-12 gap-8"
      >
        <div className="md:col-span-4">
          <p className="text-xs uppercase tracking-widest text-stone-500 mb-2">
            About the Publication
          </p>
          <h2 className="font-editorial text-2xl font-semibold text-[#1C1917]">
            {settings.publicationName}
          </h2>
        </div>
        <div className="md:col-span-8 space-y-3 text-sm sm:text-base text-stone-700 leading-relaxed">
          <p>{settings.editorBio}</p>
          <p className="text-stone-600 text-sm">
            Every essay published here includes instant neural text-to-speech playback across both
            Bengali and English—allowing readers to switch effortlessly between visual reading and
            spoken narration.
          </p>
        </div>
      </section>
    </main>
  );
};
