export type VoiceName = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
export type ArticleLanguage = 'bn' | 'en';
export type ArticleStatus = 'draft' | 'published';

export interface Article {
  id: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  content: string;
  language: ArticleLanguage;
  category: string;
  coverImage?: string;
  coverCaption?: string;
  authorName: string;
  authorId: string;
  status: ArticleStatus;
  featured: boolean;
  readTimeMinutes: number;
  voicePreference: VoiceName;
  createdAt: number; // epoch ms for UI rendering
  updatedAt: number; // epoch ms for UI rendering
}

export interface SiteSettings {
  publicationName: string;
  publicationTagline: string;
  editorBio: string;
  defaultVoiceBn: VoiceName;
  defaultVoiceEn: VoiceName;
  updatedAt: number;
}

export interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: 'admin';
  createdAt: number;
}

export const VOICE_PROFILES: {
  id: VoiceName;
  label: string;
  toneBn: string;
  toneEn: string;
}[] = [
  { id: 'Kore', label: 'Kore', toneBn: 'উষ্ণ ও স্পষ্ট সাহিত্যিক কণ্ঠ', toneEn: 'Warm, poised editorial voice' },
  { id: 'Charon', label: 'Charon', toneBn: 'গভীর ও গম্ভীর ধারাভাষ্য', toneEn: 'Deep, reflective documentary tone' },
  { id: 'Zephyr', label: 'Zephyr', toneBn: 'সাবলীল ও প্রাণবন্ত পাঠ', toneEn: 'Bright, conversational cadence' },
  { id: 'Puck', label: 'Puck', toneBn: 'তথ্যবহুল ও দ্রুতগতির কণ্ঠ', toneEn: 'Crisp, energetic storytelling' },
  { id: 'Fenrir', label: 'Fenrir', toneBn: 'দৃঢ় ও নাটকীয় উপস্থাপনা', toneEn: 'Bold, resonant narration' },
];
