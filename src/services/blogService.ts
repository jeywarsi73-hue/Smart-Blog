import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { DEFAULT_SITE_SETTINGS, STARTER_ARTICLES } from '../data/starterArticles';
import {
  Article,
  ArticleLanguage,
  ArticleStatus,
  SiteSettings,
  VoiceName,
} from '../types/blog';

function toMillis(val: unknown): number {
  if (val instanceof Timestamp) {
    return val.toMillis();
  }
  if (typeof val === 'number') {
    return val;
  }
  return Date.now();
}

export function slugifyArticleId(title: string): string {
  const ascii = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  const suffix = Math.random().toString(36).slice(2, 8);
  return ascii.length >= 3 ? `${ascii}-${suffix}` : `essay-${Date.now()}-${suffix}`;
}

export function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.min(120, Math.ceil(words / 180)));
}

function mapDocToArticle(id: string, data: Record<string, unknown>): Article {
  return {
    id,
    title: String(data.title ?? ''),
    subtitle: typeof data.subtitle === 'string' && data.subtitle ? data.subtitle : undefined,
    excerpt: String(data.excerpt ?? ''),
    content: String(data.content ?? ''),
    language: data.language === 'bn' ? 'bn' : 'en',
    category: String(data.category ?? 'Essay'),
    coverImage:
      typeof data.coverImage === 'string' && data.coverImage ? data.coverImage : undefined,
    coverCaption:
      typeof data.coverCaption === 'string' && data.coverCaption ? data.coverCaption : undefined,
    authorName: String(data.authorName ?? 'Editor'),
    authorId: String(data.authorId ?? ''),
    status: data.status === 'draft' ? 'draft' : 'published',
    featured: Boolean(data.featured),
    readTimeMinutes:
      typeof data.readTimeMinutes === 'number' ? Math.max(1, Math.round(data.readTimeMinutes)) : 3,
    voicePreference: (['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'].includes(
      String(data.voicePreference)
    )
      ? String(data.voicePreference)
      : 'Kore') as VoiceName,
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
  };
}

export function subscribePublishedArticles(
  onData: (articles: Article[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const q = query(collection(db, 'articles'), where('status', '==', 'published'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => mapDocToArticle(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.createdAt - a.createdAt);
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'articles');
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeAllArticlesAdmin(
  onData: (articles: Article[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'articles'),
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => mapDocToArticle(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => b.updatedAt - a.updatedAt);
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, 'articles');
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export interface ArticleInput {
  id?: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  content: string;
  language: ArticleLanguage;
  category: string;
  coverImage?: string;
  coverCaption?: string;
  authorName: string;
  status: ArticleStatus;
  featured: boolean;
  voicePreference: VoiceName;
}

function buildSanitizedFields(input: ArticleInput) {
  const title = input.title.trim().slice(0, 200);
  const content = input.content.trim().slice(0, 50000);
  const excerpt =
    input.excerpt.trim().slice(0, 600) || content.replace(/\s+/g, ' ').slice(0, 180);
  const category = input.category.trim().slice(0, 60) || (input.language === 'bn' ? 'প্রবন্ধ' : 'Essay');
  const authorName = input.authorName.trim().slice(0, 100) || 'Editor';

  const base: Record<string, unknown> = {
    title,
    excerpt,
    content,
    language: input.language === 'bn' ? 'bn' : 'en',
    category,
    authorName,
    status: input.status === 'draft' ? 'draft' : 'published',
    featured: Boolean(input.featured),
    readTimeMinutes: estimateReadTime(content),
    voicePreference: input.voicePreference,
  };

  if (input.subtitle && input.subtitle.trim()) {
    base.subtitle = input.subtitle.trim().slice(0, 400);
  }
  if (input.coverImage && input.coverImage.trim()) {
    base.coverImage = input.coverImage.trim().slice(0, 500);
  }
  if (input.coverCaption && input.coverCaption.trim()) {
    base.coverCaption = input.coverCaption.trim().slice(0, 300);
  }

  return base;
}

export async function createArticle(input: ArticleInput, authorId: string): Promise<string> {
  const articleId =
    input.id && /^[a-zA-Z0-9_-]{1,128}$/.test(input.id)
      ? input.id
      : slugifyArticleId(input.title);
  const docPath = `articles/${articleId}`;
  const payload = {
    ...buildSanitizedFields(input),
    authorId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'articles', articleId), payload);
    return articleId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, docPath);
  }
}

export async function updateArticle(articleId: string, input: ArticleInput): Promise<void> {
  const docPath = `articles/${articleId}`;
  const sanitized = buildSanitizedFields(input);
  const payload: Record<string, unknown> = {
    ...sanitized,
    subtitle: sanitized.subtitle ?? '',
    coverImage: sanitized.coverImage ?? '',
    coverCaption: sanitized.coverCaption ?? '',
    updatedAt: serverTimestamp(),
  };

  try {
    await updateDoc(doc(db, 'articles', articleId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, docPath);
  }
}

export async function deleteArticle(articleId: string): Promise<void> {
  const docPath = `articles/${articleId}`;
  try {
    await deleteDoc(doc(db, 'articles', articleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  const docPath = 'siteSettings/main';
  try {
    const snap = await getDoc(doc(db, 'siteSettings', 'main'));
    if (!snap.exists()) {
      return DEFAULT_SITE_SETTINGS;
    }
    const d = snap.data() as Record<string, unknown>;
    return {
      publicationName: String(d.publicationName ?? DEFAULT_SITE_SETTINGS.publicationName),
      publicationTagline: String(d.publicationTagline ?? DEFAULT_SITE_SETTINGS.publicationTagline),
      editorBio: String(d.editorBio ?? DEFAULT_SITE_SETTINGS.editorBio),
      defaultVoiceBn: (['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'].includes(
        String(d.defaultVoiceBn)
      )
        ? String(d.defaultVoiceBn)
        : 'Kore') as VoiceName,
      defaultVoiceEn: (['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'].includes(
        String(d.defaultVoiceEn)
      )
        ? String(d.defaultVoiceEn)
        : 'Charon') as VoiceName,
      updatedAt: toMillis(d.updatedAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
  }
}

export async function saveSiteSettings(
  settings: Omit<SiteSettings, 'updatedAt'>
): Promise<void> {
  const docPath = 'siteSettings/main';
  const payload = {
    publicationName: settings.publicationName.trim().slice(0, 100) || DEFAULT_SITE_SETTINGS.publicationName,
    publicationTagline:
      settings.publicationTagline.trim().slice(0, 240) || DEFAULT_SITE_SETTINGS.publicationTagline,
    editorBio: settings.editorBio.trim().slice(0, 500) || DEFAULT_SITE_SETTINGS.editorBio,
    defaultVoiceBn: settings.defaultVoiceBn,
    defaultVoiceEn: settings.defaultVoiceEn,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'siteSettings', 'main'), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function seedStarterArticlesToFirestore(
  authorId: string,
  authorName: string
): Promise<void> {
  for (const item of STARTER_ARTICLES) {
    const docPath = `articles/${item.id}`;
    try {
      await setDoc(doc(db, 'articles', item.id), {
        title: item.title,
        subtitle: item.subtitle ?? '',
        excerpt: item.excerpt,
        content: item.content,
        language: item.language,
        category: item.category,
        coverImage: item.coverImage ?? '',
        coverCaption: item.coverCaption ?? '',
        authorName: authorName || item.authorName,
        authorId,
        status: item.status,
        featured: item.featured,
        readTimeMinutes: item.readTimeMinutes,
        voicePreference: item.voicePreference,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  }
}
