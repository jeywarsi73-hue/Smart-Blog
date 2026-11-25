import React, { useMemo, useState } from 'react';
import { User } from 'firebase/auth';
import {
  Check,
  Copy,
  Edit3,
  ExternalLink,
  FileText,
  Globe,
  Headphones,
  Loader2,
  LogOut,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Volume2,
} from 'lucide-react';
import { COVER_IMAGE_PRESETS } from '../data/starterArticles';
import {
  ArticleInput,
  createArticle,
  deleteArticle,
  estimateReadTime,
  saveSiteSettings,
  seedStarterArticlesToFirestore,
  updateArticle,
} from '../services/blogService';
import {
  Article,
  ArticleLanguage,
  ArticleStatus,
  SiteSettings,
  VOICE_PROFILES,
  VoiceName,
} from '../types/blog';
import { useAudioPlayer } from '../context/AudioPlayerContext';

type AdminTab = 'articles' | 'editor' | 'settings' | 'publish';

interface AdminPanelProps {
  user: User | null;
  isAdmin: boolean;
  authLoading: boolean;
  adminArticles: Article[];
  settings: SiteSettings;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onOpenArticle: (articleId: string) => void;
  onSettingsUpdated: (next: SiteSettings) => void;
  onBackToBlog: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  user,
  isAdmin,
  authLoading,
  adminArticles,
  settings,
  onSignIn,
  onSignOut,
  onOpenArticle,
  onSettingsUpdated,
  onBackToBlog,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('articles');
  const [statusFilter, setStatusFilter] = useState<'all' | ArticleStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Composer state
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [language, setLanguage] = useState<ArticleLanguage>('bn');
  const [category, setCategory] = useState('সাহিত্য ও কণ্ঠ');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState(COVER_IMAGE_PRESETS[0].url);
  const [coverCaption, setCoverCaption] = useState('');
  const [authorName, setAuthorName] = useState(user?.displayName || 'Jey Warsi');
  const [voicePreference, setVoicePreference] = useState<VoiceName>('Kore');
  const [featured, setFeatured] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [testingVoice, setTestingVoice] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Settings form state
  const [pubName, setPubName] = useState(settings.publicationName);
  const [pubTagline, setPubTagline] = useState(settings.publicationTagline);
  const [editorBio, setEditorBio] = useState(settings.editorBio);
  const [defaultVoiceBn, setDefaultVoiceBn] = useState<VoiceName>(settings.defaultVoiceBn);
  const [defaultVoiceEn, setDefaultVoiceEn] = useState<VoiceName>(settings.defaultVoiceEn);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const { playArticle } = useAudioPlayer();

  const filteredAdminArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return adminArticles.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (q && !`${a.title} ${a.category} ${a.excerpt}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [adminArticles, statusFilter, searchQuery]);

  const startNewArticle = () => {
    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setLanguage('bn');
    setCategory('সাহিত্য ও কণ্ঠ');
    setExcerpt('');
    setContent('');
    setCoverImage(COVER_IMAGE_PRESETS[0].url);
    setCoverCaption('');
    setAuthorName(user?.displayName || 'Jey Warsi');
    setVoicePreference(settings.defaultVoiceBn);
    setFeatured(false);
    setFeedbackMsg(null);
    setActiveTab('editor');
  };

  const startEditArticle = (article: Article) => {
    setEditingId(article.id);
    setTitle(article.title);
    setSubtitle(article.subtitle ?? '');
    setLanguage(article.language);
    setCategory(article.category);
    setExcerpt(article.excerpt);
    setContent(article.content);
    setCoverImage(article.coverImage ?? '');
    setCoverCaption(article.coverCaption ?? '');
    setAuthorName(article.authorName);
    setVoicePreference(article.voicePreference);
    setFeatured(article.featured);
    setFeedbackMsg(null);
    setActiveTab('editor');
  };

  const handleSaveArticle = async (targetStatus: ArticleStatus) => {
    if (!user) return;
    if (!title.trim() || !content.trim()) {
      setFeedbackMsg({
        type: 'err',
        text: 'Please provide both a title and article body before saving.',
      });
      return;
    }

    setIsSaving(true);
    setFeedbackMsg(null);
    try {
      const payload: ArticleInput = {
        title,
        subtitle,
        excerpt: excerpt.trim() || content.replace(/\s+/g, ' ').slice(0, 180),
        content,
        language,
        category: category.trim() || (language === 'bn' ? 'প্রবন্ধ' : 'Essay'),
        coverImage,
        coverCaption,
        authorName: authorName.trim() || user.displayName || 'Editor',
        status: targetStatus,
        featured,
        voicePreference,
      };

      if (editingId) {
        await updateArticle(editingId, payload);
        setFeedbackMsg({
          type: 'ok',
          text:
            targetStatus === 'published'
              ? 'Article updated and published live.'
              : 'Draft updated.',
        });
      } else {
        const newId = await createArticle(payload, user.uid);
        setEditingId(newId);
        setFeedbackMsg({
          type: 'ok',
          text:
            targetStatus === 'published'
              ? 'New article published live to your blog.'
              : 'Draft saved.',
        });
      }
      setActiveTab('articles');
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to save article.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickToggleStatus = async (article: Article) => {
    const nextStatus: ArticleStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      await updateArticle(article.id, {
        title: article.title,
        subtitle: article.subtitle,
        excerpt: article.excerpt,
        content: article.content,
        language: article.language,
        category: article.category,
        coverImage: article.coverImage,
        coverCaption: article.coverCaption,
        authorName: article.authorName,
        status: nextStatus,
        featured: article.featured,
        voicePreference: article.voicePreference,
      });
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Could not update status.',
      });
    }
  };

  const handleDelete = async (articleId: string) => {
    try {
      await deleteArticle(articleId);
      setConfirmDeleteId(null);
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to delete article.',
      });
    }
  };

  const handleSeedStarters = async () => {
    if (!user) return;
    setIsSeeding(true);
    setFeedbackMsg(null);
    try {
      await seedStarterArticlesToFirestore(user.uid, user.displayName || 'Jey Warsi');
      setFeedbackMsg({
        type: 'ok',
        text: '4 bilingual starter essays published to your Firestore database.',
      });
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to publish starter essays.',
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const handleTestVoice = async () => {
    setTestingVoice(true);
    setFeedbackMsg(null);
    try {
      const sampleText =
        language === 'bn'
          ? 'নমস্কার ও শুভেচ্ছা। এটি আপনার বাংলা ব্লগের টেক্সট-টু-স্পিচ কণ্ঠস্বরের নমুনা।'
          : 'Welcome to Katha and Quill. This is a live preview of your selected editorial voice.';
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          language,
          voiceName: voicePreference,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        audioBase64?: string;
        error?: string;
      };
      if (!res.ok || !data.audioBase64) {
        throw new Error(data.error || 'Voice test failed.');
      }
      const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
      await audio.play();
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Voice preview failed.',
      });
    } finally {
      setTestingVoice(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedbackMsg(null);
    try {
      await saveSiteSettings({
        publicationName: pubName,
        publicationTagline: pubTagline,
        editorBio,
        defaultVoiceBn,
        defaultVoiceEn,
      });
      onSettingsUpdated({
        publicationName: pubName,
        publicationTagline: pubTagline,
        editorBio,
        defaultVoiceBn,
        defaultVoiceEn,
        updatedAt: Date.now(),
      });
      setFeedbackMsg({ type: 'ok', text: 'Publication settings saved.' });
    } catch (err: unknown) {
      setFeedbackMsg({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to save settings.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyBlogUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      setCopiedUrl(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-500 mb-3" />
        <p className="text-sm text-stone-600">Verifying editor session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20">
        <div className="border border-stone-200 bg-white p-8">
          <p className="text-xs uppercase tracking-widest text-[#9A3412] font-medium mb-2">
            Editor Studio · এ্যাডমিন প্যানেল
          </p>
          <h1 className="font-editorial text-3xl font-semibold text-[#1C1917] mb-3">
            Sign in to publish &amp; manage articles
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed mb-6">
            Authenticate with your authorized Google account to compose বাংলা and English essays,
            preview neural Text-to-Speech voices, and publish directly to your live blog.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void onSignIn()}
              className="px-5 py-2.5 text-sm font-medium bg-[#1C1917] text-[#FBF9F5] hover:bg-stone-800 transition-colors"
            >
              Sign in with Google
            </button>
            <button
              type="button"
              onClick={onBackToBlog}
              className="px-4 py-2.5 text-sm font-medium border border-stone-300 text-stone-700 hover:border-stone-900 transition-colors"
            >
              Return to Blog
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20">
        <div className="border border-stone-200 bg-white p-8">
          <p className="text-xs uppercase tracking-widest text-[#9A3412] font-medium mb-2">
            Access Restricted
          </p>
          <h1 className="font-editorial text-2xl font-semibold text-[#1C1917] mb-3">
            Editor permissions required
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed mb-6">
            You are currently signed in as <span className="font-medium">{user.email}</span>. Only
            authorized publication administrators can access the publishing studio.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="px-4 py-2 text-sm font-medium bg-[#1C1917] text-[#FBF9F5] hover:bg-stone-800 transition-colors"
            >
              Sign Out
            </button>
            <button
              type="button"
              onClick={onBackToBlog}
              className="px-4 py-2 text-sm font-medium border border-stone-300 text-stone-700 hover:border-stone-900 transition-colors"
            >
              Return to Blog
            </button>
          </div>
        </div>
      </div>
    );
  }

  const publishedCount = adminArticles.filter((a) => a.status === 'published').length;
  const draftCount = adminArticles.filter((a) => a.status === 'draft').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Navigation (240px equivalent) */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="border border-stone-200 bg-white p-5">
            <p className="text-xs uppercase tracking-widest text-stone-500 mb-1">Editor Studio</p>
            <p className="text-sm font-semibold text-[#1C1917] truncate">
              {user.displayName || user.email}
            </p>
            <p className="text-xs text-stone-500 truncate mb-4">{user.email}</p>

            <nav className="space-y-1">
              {(
                [
                  { id: 'articles', label: 'All Articles', icon: FileText },
                  { id: 'editor', label: editingId ? 'Edit Essay' : 'Write New Essay', icon: Plus },
                  { id: 'settings', label: 'Publication Settings', icon: Settings },
                  { id: 'publish', label: 'Free Publish & Share', icon: Globe },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id === 'editor' && activeTab !== 'editor') {
                        startNewArticle();
                      } else {
                        setActiveTab(item.id);
                      }
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors text-left ${
                      active
                        ? 'bg-[#1C1917] text-[#FBF9F5]'
                        : 'text-stone-700 hover:bg-[#F3EFE7]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-5 pt-4 border-t border-stone-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={onBackToBlog}
                className="text-xs text-stone-600 hover:text-[#1C1917] underline"
              >
                View Live Blog
              </button>
              <button
                type="button"
                onClick={() => void onSignOut()}
                className="inline-flex items-center gap-1 text-xs text-stone-600 hover:text-[#9A3412]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Compact Metric Summary */}
          <div className="border border-stone-200 bg-white p-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone-500">Published</p>
              <p className="font-data text-2xl font-semibold text-[#1C1917]">{publishedCount}</p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Drafts</p>
              <p className="font-data text-2xl font-semibold text-stone-600">{draftCount}</p>
            </div>
          </div>
        </aside>

        {/* Main Admin Workspace */}
        <section className="lg:col-span-9">
          {/* Top Breadcrumb Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-stone-200">
            <div>
              <p className="text-xs text-stone-500">
                Editor Studio /{' '}
                {activeTab === 'articles'
                  ? 'Articles'
                  : activeTab === 'editor'
                    ? editingId
                      ? 'Edit Essay'
                      : 'New Essay'
                    : activeTab === 'settings'
                      ? 'Publication Settings'
                      : 'Free Publish & Hosting'}
              </p>
              <h1 className="font-editorial text-2xl font-semibold text-[#1C1917] mt-0.5">
                {activeTab === 'articles' && 'Manage Articles'}
                {activeTab === 'editor' && (editingId ? 'Edit Essay' : 'Compose Bilingual Essay')}
                {activeTab === 'settings' && 'Publication & Default Voice Settings'}
                {activeTab === 'publish' && 'Publish & Share Your Blog for Free'}
              </h1>
            </div>

            {activeTab !== 'editor' && (
              <button
                type="button"
                onClick={startNewArticle}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[#9A3412] text-[#FBF9F5] hover:bg-[#7C2D12] transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Article</span>
              </button>
            )}
          </div>

          {feedbackMsg && (
            <div
              className={`mb-6 px-4 py-3 text-xs border ${
                feedbackMsg.type === 'ok'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : 'border-red-300 bg-red-50 text-red-900'
              }`}
            >
              {feedbackMsg.text}
            </div>
          )}

          {/* TAB 1: ARTICLES TABLE */}
          {activeTab === 'articles' && (
            <div className="space-y-5">
              {adminArticles.length === 0 && (
                <div className="border border-stone-200 bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-editorial text-lg font-semibold text-[#1C1917] mb-1">
                      Your Firestore database has no saved articles yet
                    </h2>
                    <p className="text-xs text-stone-600">
                      Publish our 4 inaugural Bangla &amp; English essays into Firestore so you can
                      edit them or start fresh with a blank article.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSeedStarters()}
                    disabled={isSeeding}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#1C1917] text-[#FBF9F5] hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0 disabled:opacity-50"
                  >
                    {isSeeding ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Publish 4 Starter Essays</span>
                  </button>
                </div>
              )}

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="inline-flex items-center p-1 bg-[#EFEAE0] border border-stone-200 self-start">
                  {(['all', 'published', 'draft'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 text-xs font-medium capitalize transition-colors ${
                        statusFilter === st
                          ? 'bg-white text-[#1C1917] shadow-xs'
                          : 'text-stone-600 hover:text-[#1C1917]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter articles..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-stone-300 focus:outline-none focus:border-[#1C1917]"
                  />
                </div>
              </div>

              {/* Articles Data Grid */}
              <div className="border border-stone-200 bg-white overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-[11px] uppercase tracking-wider text-stone-500 bg-stone-50/70">
                      <th className="py-3 px-4 font-medium">Title</th>
                      <th className="py-3 px-3 font-medium">Lang</th>
                      <th className="py-3 px-3 font-medium">Status</th>
                      <th className="py-3 px-3 font-medium">Voice</th>
                      <th className="py-3 px-3 font-medium text-right">Read</th>
                      <th className="py-3 px-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-xs">
                    {filteredAdminArticles.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 px-4 text-center text-stone-500">
                          No articles match the current filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAdminArticles.map((article) => (
                        <tr key={article.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="py-3 px-4 max-w-xs">
                            <p className="font-medium text-[#1C1917] truncate">{article.title}</p>
                            <p className="text-[11px] text-stone-500 truncate">
                              {article.category}
                              {article.featured ? ' · Featured' : ''}
                            </p>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-stone-700">
                            {article.language === 'bn' ? 'বাংলা' : 'EN'}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => void handleQuickToggleStatus(article)}
                              className={`text-xs font-medium underline ${
                                article.status === 'published'
                                  ? 'text-emerald-700'
                                  : 'text-amber-700'
                              }`}
                            >
                              {article.status === 'published' ? 'Published' : 'Draft'}
                            </button>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-stone-600">
                            {article.voicePreference}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap text-right font-data text-stone-600">
                            {article.readTimeMinutes}m
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void playArticle(article, 0)}
                                title="Listen to article"
                                className="p-1.5 text-stone-600 hover:text-[#9A3412]"
                              >
                                <Headphones className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenArticle(article.id)}
                                title="Preview article"
                                className="p-1.5 text-stone-600 hover:text-[#1C1917]"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => startEditArticle(article)}
                                title="Edit article"
                                className="p-1.5 text-stone-600 hover:text-[#1C1917]"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {confirmDeleteId === article.id ? (
                                <button
                                  type="button"
                                  onClick={() => void handleDelete(article.id)}
                                  className="px-2 py-1 text-[11px] bg-red-700 text-white"
                                >
                                  Confirm
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(article.id)}
                                  title="Delete article"
                                  className="p-1.5 text-stone-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: COMPOSE / EDIT ARTICLE */}
          {activeTab === 'editor' && (
            <div className="border border-stone-200 bg-white p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    Language · ভাষা
                  </label>
                  <select
                    value={language}
                    onChange={(e) => {
                      const nextLang = e.target.value as ArticleLanguage;
                      setLanguage(nextLang);
                      setVoicePreference(
                        nextLang === 'bn' ? settings.defaultVoiceBn : settings.defaultVoiceEn
                      );
                    }}
                    className="w-full px-3 py-2 text-sm border border-stone-300 bg-white focus:outline-none focus:border-[#1C1917]"
                  >
                    <option value="bn">বাংলা (Bangla)</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    maxLength={60}
                    placeholder={language === 'bn' ? 'সাহিত্য ও কণ্ঠ' : 'Editorial Craft'}
                    className="w-full px-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-[#1C1917]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    Author Name
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    maxLength={100}
                    className="w-full px-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-[#1C1917]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Article Headline · শিরোনাম
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  placeholder={
                    language === 'bn'
                      ? 'আপনার বাংলা প্রবন্ধের শিরোনাম লিখুন...'
                      : 'Enter your essay headline...'
                  }
                  className="w-full px-3 py-2.5 text-base font-editorial border border-stone-300 focus:outline-none focus:border-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Subtitle / Deck (Optional)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  maxLength={400}
                  placeholder="A concise subtitle introducing the essay..."
                  className="w-full px-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Short Excerpt (Shown on Front Page)
                </label>
                <textarea
                  rows={2}
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  maxLength={600}
                  placeholder="2–3 sentence summary for cards (auto-generated from body if left blank)"
                  className="w-full px-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-[#1C1917]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-stone-700">
                    Full Article Body (Separate paragraphs with a blank line for clean TTS pacing)
                  </label>
                  <span className="text-xs font-data text-stone-500">
                    Est. {estimateReadTime(content)} min read
                  </span>
                </div>
                <textarea
                  rows={12}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={50000}
                  placeholder={
                    language === 'bn'
                      ? 'এখানে আপনার সম্পূর্ণ বাংলা আর্টিকেল লিখুন বা পেস্ট করুন...'
                      : 'Write or paste your full essay here...'
                  }
                  className="w-full px-3.5 py-3 text-sm leading-relaxed border border-stone-300 focus:outline-none focus:border-[#1C1917]"
                />
              </div>

              {/* Cover Image & TTS Voice Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-stone-200">
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-stone-700">
                    Cover Image Preset or URL
                  </label>
                  <select
                    value={
                      COVER_IMAGE_PRESETS.some((p) => p.url === coverImage) ? coverImage : 'custom'
                    }
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setCoverImage(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs border border-stone-300 bg-white focus:outline-none focus:border-[#1C1917]"
                  >
                    {COVER_IMAGE_PRESETS.map((preset) => (
                      <option key={preset.url} value={preset.url}>
                        {preset.label}
                      </option>
                    ))}
                    <option value="custom">Custom Image URL</option>
                  </select>
                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    maxLength={500}
                    placeholder="/src/assets/images/..."
                    className="w-full px-3 py-2 text-xs border border-stone-300 focus:outline-none focus:border-[#1C1917]"
                  />
                  <input
                    type="text"
                    value={coverCaption}
                    onChange={(e) => setCoverCaption(e.target.value)}
                    maxLength={300}
                    placeholder="Optional photo caption"
                    className="w-full px-3 py-2 text-xs border border-stone-300 focus:outline-none focus:border-[#1C1917]"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-medium text-stone-700">
                    Default Narrator Voice (Text-to-Speech)
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={voicePreference}
                      onChange={(e) => setVoicePreference(e.target.value as VoiceName)}
                      className="flex-1 px-3 py-2 text-xs border border-stone-300 bg-white focus:outline-none focus:border-[#1C1917]"
                    >
                      {VOICE_PROFILES.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label} — {language === 'bn' ? v.toneBn : v.toneEn}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => void handleTestVoice()}
                      disabled={testingVoice}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-stone-300 hover:border-[#1C1917] transition-colors whitespace-nowrap shrink-0"
                    >
                      {testingVoice ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                      <span>Test Voice</span>
                    </button>
                  </div>

                  <label className="flex items-center gap-2 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="accent-[#9A3412]"
                    />
                    <span className="text-xs text-stone-700">
                      Feature this essay as the Lead Hero Story on the front page
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('articles')}
                  className="px-4 py-2 text-xs font-medium border border-stone-300 text-stone-700 hover:border-stone-900"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSaveArticle('draft')}
                    disabled={isSaving}
                    className="px-4 py-2 text-xs font-medium border border-stone-300 text-[#1C1917] hover:border-[#1C1917] disabled:opacity-50"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSaveArticle('published')}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium bg-[#9A3412] text-[#FBF9F5] hover:bg-[#7C2D12] disabled:opacity-50"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editingId ? 'Update & Publish' : 'Publish Article'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PUBLICATION SETTINGS */}
          {activeTab === 'settings' && (
            <form
              onSubmit={(e) => void handleSaveSettings(e)}
              className="border border-stone-200 bg-white p-6 space-y-5"
            >
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Publication Name
                </label>
                <input
                  type="text"
                  value={pubName}
                  onChange={(e) => setPubName(e.target.value)}
                  maxLength={100}
                  className="w-full px-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  Masthead Tagline
                </label>
                <input
                  type="text"
                  value={pubTagline}
                  onChange={(e) => setPubTagline(e.target.value)}
                  maxLength={240}
                  className="w-full px-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-[#1C1917]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1.5">
                  About / Editor Bio
                </label>
                <textarea
                  rows={3}
                  value={editorBio}
                  onChange={(e) => setEditorBio(e.target.value)}
                  maxLength={500}
                  className="w-full px-3 py-2 text-sm border border-stone-300 focus:outline-none focus:border-[#1C1917]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    Default Bangla Voice
                  </label>
                  <select
                    value={defaultVoiceBn}
                    onChange={(e) => setDefaultVoiceBn(e.target.value as VoiceName)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 bg-white focus:outline-none focus:border-[#1C1917]"
                  >
                    {VOICE_PROFILES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label} — {v.toneBn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    Default English Voice
                  </label>
                  <select
                    value={defaultVoiceEn}
                    onChange={(e) => setDefaultVoiceEn(e.target.value as VoiceName)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 bg-white focus:outline-none focus:border-[#1C1917]"
                  >
                    {VOICE_PROFILES.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label} — {v.toneEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium bg-[#1C1917] text-[#FBF9F5] hover:bg-stone-800 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Settings</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: FREE PUBLISHING & HOSTING GUIDE */}
          {activeTab === 'publish' && (
            <div className="border border-stone-200 bg-white p-6 space-y-6">
              <div>
                <h2 className="font-editorial text-xl font-semibold text-[#1C1917] mb-2">
                  ফ্রিতে পাবলিশ ও শেয়ার করার উপায় (Free Publishing &amp; Live Link)
                </h2>
                <p className="text-sm text-stone-600 leading-relaxed">
                  আপনার এই ব্লগ ওয়েবসাইটটি ইতিমধ্যেই Firebase Firestore (ফ্রি Spark প্ল্যান) এবং
                  সার্ভার-সাইড বাংলা/ইংরেজি Text-to-Speech ইঞ্জিনের সাথে যুক্ত। আপনি কোনো আলাদা
                  হোস্টিং খরচ ছাড়াই এটি পাবলিশ ও শেয়ার করতে পারবেন।
                </p>
              </div>

              <div className="p-4 bg-[#F5F1E8] border border-stone-200 space-y-2">
                <p className="text-xs uppercase tracking-widest text-stone-500">
                  Live Application URL
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <code className="text-xs font-data text-[#1C1917] break-all">
                    {window.location.origin}
                  </code>
                  <button
                    type="button"
                    onClick={() => void handleCopyBlogUrl()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1C1917] text-[#FBF9F5] whitespace-nowrap shrink-0"
                  >
                    {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUrl ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4 text-sm text-stone-700 leading-relaxed">
                <div>
                  <h3 className="font-semibold text-[#1C1917] mb-1">
                    ১. সরাসরি AI Studio Share / Deploy বাটন দিয়ে ফ্রি পাবলিশ:
                  </h3>
                  <p className="text-xs text-stone-600">
                    AI Studio-এর উপরের ডানদিকে থাকা <strong>Share App</strong> অথবা{' '}
                    <strong>Deploy</strong> অপশন ব্যবহার করে আপনার ওয়েবসাইটের পাবলিক লিংক পাঠকদের
                    সাথে শেয়ার করুন। প্রতিটি আর্টিকেলের নিজস্ব লিংক রয়েছে (যেমন{' '}
                    <code className="font-data">/?article=...</code>)।
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-[#1C1917] mb-1">
                    ২. ডেটাবেজ ও নিরাপত্তা (Firebase Spark Free Tier):
                  </h3>
                  <p className="text-xs text-stone-600">
                    আপনার সব আর্টিকেল Firebase Firestore-এ সংরক্ষিত থাকে এবং শুধুমাত্র আপনার
                    ভেরিফাইড Google অ্যাকাউন্ট (<span className="font-data">{user.email}</span>)
                    থেকেই নতুন আর্টিকেল পাবলিশ, এডিট বা ডিলিট করা যাবে। সাধারণ পাঠকেরা লগইন
                    ছাড়াই সব প্রকাশিত আর্টিকেল পড়তে ও শুনতে পারবেন।
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
