import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  auth,
  BOOTSTRAPPED_ADMIN_EMAIL,
  db,
  googleProvider,
} from './lib/firebase';
import { DEFAULT_SITE_SETTINGS, STARTER_ARTICLES } from './data/starterArticles';
import {
  fetchSiteSettings,
  subscribeAllArticlesAdmin,
  subscribePublishedArticles,
} from './services/blogService';
import { Article, ArticleLanguage, SiteSettings } from './types/blog';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { BlogFrontPage } from './components/BlogFrontPage';
import { ArticleReaderView } from './components/ArticleReaderView';
import { AdminPanel } from './components/AdminPanel';
import { StickyAudioBar } from './components/StickyAudioBar';
import { ErrorBoundary } from './components/ErrorBoundary';

type AppView = 'home' | 'article' | 'admin';

function BlogApplication() {
  const [view, setView] = useState<AppView>('home');
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [languageFilter, setLanguageFilter] = useState<'all' | ArticleLanguage>('all');

  const [publishedArticles, setPublishedArticles] = useState<Article[]>([]);
  const [adminArticles, setAdminArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState<boolean>(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Sync URL ?article=... on initial load & popstate
  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const articleParam = params.get('article');
      const modeParam = params.get('mode');
      if (modeParam === 'admin') {
        setView('admin');
        setSelectedArticleId(null);
      } else if (articleParam) {
        setSelectedArticleId(articleParam);
        setView('article');
      }
    };
    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  // Load publication settings
  useEffect(() => {
    void fetchSiteSettings()
      .then(setSettings)
      .catch(() => {
        // Fallback to default settings if unreadable
      });
  }, []);

  // Subscribe to published articles for public readers
  useEffect(() => {
    const unsub = subscribePublishedArticles(
      (items) => {
        setPublishedArticles(items);
        setArticlesLoading(false);
        setFirestoreError(null);
      },
      (err) => {
        setArticlesLoading(false);
        setFirestoreError(err.message);
      }
    );
    return () => unsub();
  }, []);

  // Track Firebase Auth & Admin status
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsAdmin(false);
        setAdminArticles([]);
        setAuthLoading(false);
        return;
      }

      if (
        currentUser.emailVerified &&
        currentUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase()
      ) {
        setIsAdmin(true);
        setAuthLoading(false);
        return;
      }

      try {
        const adminSnap = await getDoc(doc(db, 'admins', currentUser.uid));
        setIsAdmin(currentUser.emailVerified && adminSnap.exists());
      } catch {
        setIsAdmin(false);
      } finally {
        setAuthLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to all articles (published + drafts) only when verified admin
  useEffect(() => {
    if (!isAdmin) return;
    const unsub = subscribeAllArticlesAdmin(
      (items) => setAdminArticles(items),
      (err) => setFirestoreError(err.message)
    );
    return () => unsub();
  }, [isAdmin]);

  // Show Firestore published articles, or inaugural bilingual starter essays if DB is empty
  const displayArticles = useMemo<Article[]>(() => {
    if (publishedArticles.length > 0) {
      return publishedArticles;
    }
    return STARTER_ARTICLES.map((item) => ({
      ...item,
      authorId: 'inaugural-edition',
    }));
  }, [publishedArticles]);

  const activeArticle = useMemo(() => {
    if (!selectedArticleId) return null;
    return (
      adminArticles.find((a) => a.id === selectedArticleId) ??
      displayArticles.find((a) => a.id === selectedArticleId) ??
      null
    );
  }, [selectedArticleId, adminArticles, displayArticles]);

  const relatedArticles = useMemo(() => {
    if (!activeArticle) return [];
    return displayArticles.filter((a) => a.id !== activeArticle.id);
  }, [activeArticle, displayArticles]);

  const navigateHome = (lang: 'all' | ArticleLanguage = 'all') => {
    setLanguageFilter(lang);
    setView('home');
    setSelectedArticleId(null);
    window.history.pushState({}, '', '/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateAbout = () => {
    setView('home');
    setSelectedArticleId(null);
    window.history.pushState({}, '', '/');
    setTimeout(() => {
      document.getElementById('about-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const navigateArticle = (articleId: string) => {
    setSelectedArticleId(articleId);
    setView('article');
    window.history.pushState({}, '', `/?article=${encodeURIComponent(articleId)}`);
  };

  const navigateAdmin = () => {
    setView('admin');
    setSelectedArticleId(null);
    window.history.pushState({}, '', '/?mode=admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Sign in failed:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917]">
      {/* Strict 3-Zone Top Navigation Bar */}
      <header className="border-b border-stone-200 bg-[#FBF9F5]/95 backdrop-blur-xs sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => navigateHome('all')}
            className="font-editorial text-xl font-bold tracking-tight text-[#1C1917] whitespace-nowrap shrink-0 hover:text-[#9A3412] transition-colors text-left"
          >
            {settings.publicationName}
          </button>

          {/* Zone 2: 4 concise single-line text nav links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600"
          >
            <button
              type="button"
              onClick={() => navigateHome('all')}
              className={`whitespace-nowrap shrink-0 hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors ${
                view === 'home' && languageFilter === 'all' ? 'text-[#1C1917] underline' : ''
              }`}
            >
              Journal
            </button>
            <button
              type="button"
              onClick={() => navigateHome('bn')}
              className={`whitespace-nowrap shrink-0 hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors ${
                view === 'home' && languageFilter === 'bn' ? 'text-[#1C1917] underline' : ''
              }`}
            >
              Bangla
            </button>
            <button
              type="button"
              onClick={() => navigateHome('en')}
              className={`whitespace-nowrap shrink-0 hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors ${
                view === 'home' && languageFilter === 'en' ? 'text-[#1C1917] underline' : ''
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={navigateAbout}
              className="whitespace-nowrap shrink-0 hover:text-[#1C1917] hover:underline underline-offset-4 transition-colors"
            >
              About
            </button>
          </nav>

          {/* Zone 3: 1 primary action button */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => (view === 'admin' ? navigateHome('all') : navigateAdmin())}
              className="px-4 py-2 text-xs font-medium bg-[#1C1917] text-[#FBF9F5] hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
            >
              {view === 'admin' ? 'View Journal' : isAdmin ? 'Editor Studio' : 'Admin Panel'}
            </button>
          </div>
        </div>
      </header>

      {firestoreError && (
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4">
          <div className="border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
            Database notice: {firestoreError}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">
        {view === 'home' && (
          <BlogFrontPage
            articles={displayArticles}
            settings={settings}
            languageFilter={languageFilter}
            onLanguageFilterChange={setLanguageFilter}
            onOpenArticle={navigateArticle}
            isLoading={articlesLoading}
          />
        )}

        {view === 'article' && activeArticle && (
          <ArticleReaderView
            article={activeArticle}
            relatedArticles={relatedArticles}
            settings={settings}
            onBack={() => navigateHome(languageFilter)}
            onOpenArticle={navigateArticle}
          />
        )}

        {view === 'article' && !activeArticle && (
          <div className="max-w-xl mx-auto px-4 py-24 text-center">
            <h1 className="font-editorial text-2xl font-semibold mb-3">Essay not found</h1>
            <p className="text-sm text-stone-600 mb-6">
              This essay may have been moved back to drafts or deleted by the editor.
            </p>
            <button
              type="button"
              onClick={() => navigateHome('all')}
              className="px-5 py-2.5 text-xs font-medium bg-[#1C1917] text-[#FBF9F5]"
            >
              Return to Journal
            </button>
          </div>
        )}

        {view === 'admin' && (
          <AdminPanel
            user={user}
            isAdmin={isAdmin}
            authLoading={authLoading}
            adminArticles={adminArticles}
            settings={settings}
            onSignIn={handleSignIn}
            onSignOut={handleSignOut}
            onOpenArticle={navigateArticle}
            onSettingsUpdated={setSettings}
            onBackToBlog={() => navigateHome('all')}
          />
        )}
      </div>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-stone-200 bg-[#F5F1E8]/70 py-8 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-stone-500">
          <p>
            © {new Date().getFullYear()} {settings.publicationName}. Bilingual Editorial &amp;
            Audio Journal.
          </p>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => navigateHome('bn')}
              className="hover:text-[#1C1917] transition-colors"
            >
              বাংলা সংস্করণ
            </button>
            <button
              type="button"
              onClick={() => navigateHome('en')}
              className="hover:text-[#1C1917] transition-colors"
            >
              English Edition
            </button>
            <button
              type="button"
              onClick={navigateAdmin}
              className="hover:text-[#1C1917] transition-colors"
            >
              Admin Studio
            </button>
          </div>
        </div>
      </footer>

      {/* Persistent Compact Sticky Audio Bar */}
      <StickyAudioBar onOpenArticle={navigateArticle} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AudioPlayerProvider>
        <BlogApplication />
      </AudioPlayerProvider>
    </ErrorBoundary>
  );
}
