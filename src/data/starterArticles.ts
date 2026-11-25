import { Article, SiteSettings } from '../types/blog';

export const COVER_IMAGE_PRESETS = [
  {
    label: 'Editorial Desk & Headphones',
    url: '/src/assets/images/hero_editorial_studio_1795579744495.jpg',
  },
  {
    label: 'Monsoon Verandah & Book',
    url: '/src/assets/images/article_monsoon_verandah_1795579744946.jpg',
  },
  {
    label: 'Analog Tape & Microphone',
    url: '/src/assets/images/article_analog_sound_1795579744622.jpg',
  },
  {
    label: 'Archival Library Reading Room',
    url: '/src/assets/images/article_archival_library_1795579745515.jpg',
  },
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  publicationName: 'Katha & Quill',
  publicationTagline:
    'Bilingual essays in Bangla and English — crafted for quiet reading and effortless listening.',
  editorBio:
    'An independent literary & technology journal exploring language, voice, and the craft of slow publishing across Dhaka and the world.',
  defaultVoiceBn: 'Kore',
  defaultVoiceEn: 'Charon',
  updatedAt: Date.now(),
};

export const STARTER_ARTICLES: Omit<Article, 'authorId'>[] = [
  {
    id: 'shobder-bhetor-shor-bangla-audio-essay',
    title: 'শব্দের ভেতর স্বর: বাংলা গদ্যে শোনার নতুন দিগন্ত',
    subtitle: 'কেন আধুনিক পাঠক শুধু চোখ দিয়ে নয়, কানের মাধ্যমেও সাহিত্যের রস আস্বাদন করতে চান',
    excerpt:
      'ব্যস্ত শহরের যান্ত্রিক কোলাহলের মাঝেও যখন একটি কণ্ঠস্বর আমাদের প্রিয় কোনো বাংলা প্রবন্ধ পড়ে শোনায়, তখন অক্ষরগুলো যেন নতুন প্রাণ ফিরে পায়।',
    content: `মানুষের গল্প বলার এবং শোনার ইতিহাস অক্ষরের চেয়েও অনেক প্রাচীন। ছাপাখানার যুগ শুরু হওয়ার আগে কবিতা, পুঁথি এবং লোককথা এক প্রজন্ম থেকে আরেক প্রজন্মে বাহিত হতো কেবল কণ্ঠস্বরের সুরে ও ছন্দে। আজ ডিজিটাল যুগে এসে আমরা আবার সেই আদিম অথচ চিরন্তন অভ্যাসটির কাছে ফিরে যাচ্ছি—তবে এবার আমাদের সঙ্গী কৃত্রিম বুদ্ধিমত্তা ও নিখুঁত উচ্চারণের প্রযুক্তি।

একটি দীর্ঘ বাংলা প্রবন্ধ বা গল্প যখন পর্দার ওপারে শুধু স্থির অক্ষর হয়ে থাকে, তখন কর্মব্যস্ত দিনে অনেক সময়ই তা পড়ে ওঠা সম্ভব হয় না। ট্রেনে বা বাসে যাতায়াতের সময়, সন্ধ্যায় হাঁটতে বেরিয়ে, কিংবা এক কাপ চায়ের সাথে চোখ বুজে যখন পাঠক একটি বাটনে ক্লিক করে পুরো লেখাটি শুনতে পান—তখন সেই পাঠাভ্যাস এক সম্পূর্ণ ভিন্ন মাত্রা পায়।

বাংলা ভাষার ধ্বনিগত মাধুর্য অত্যন্ত সূক্ষ্ম। যুক্তাক্ষরের বুনন, যতিচিহ্নের বিরতি এবং আবেগের ওঠানামা ঠিকঠাক না হলে শ্রোতার কানে তা কৃত্রিম শোনায়। আধুনিক নিউরাল টেক্সট-টু-স্পিচ প্রযুক্তি এখন সেই বাধা অনেকটাই দূর করেছে। দাড়ি, কমা এবং অনুচ্ছেদের সূক্ষ্ম বিরতি বুঝে নিয়ে কণ্ঠস্বর যখন স্বাভাবিকভাবে এগোয়, তখন মনে হয় যেন কোনো প্রিয়জন পাশে বসে বই পড়ে শোনাচ্ছেন।

ব্লগিংয়ের ভবিষ্যৎ তাই কেবল লেখা আর প্রকাশের মধ্যে সীমাবদ্ধ নয়; প্রতিটি লেখাকে একই সাথে পাঠযোগ্য এবং শ্রবণযোগ্য করে তোলাই এখন সৃজনশীল প্রকাশনার নতুন মানদণ্ড।`,
    language: 'bn',
    category: 'সাহিত্য ও কণ্ঠ',
    coverImage: '/src/assets/images/hero_editorial_studio_1795579744495.jpg',
    coverCaption: 'চিত্র ১ — আলোকিত টেবিলে খোলা খাতা ও স্টুডিও হেডফোন',
    authorName: 'Jey Warsi',
    status: 'published',
    featured: true,
    readTimeMinutes: 4,
    voicePreference: 'Kore',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'borshar-baranda-o-ek-cup-cha',
    title: 'বর্ষার বারান্দায় অলস দুপুর ও পাঠের নীরবতা',
    subtitle: 'শ্রাবণের বৃষ্টি আর মাটির কাপে চা—ধীরগতির পাঠাভ্যাসের এক ব্যক্তিগত স্মৃতিচারণ',
    excerpt:
      'টিনের চালে কিংবা কাঠের জানালার কাচে বৃষ্টির ফোঁটা পড়ার শব্দের সাথে পুরনো বইয়ের পাতার গন্ধ মিলেমিশে তৈরি করে এক অপার্থিব প্রশান্তি।',
    content: `আষাঢ় ও শ্রাবণের দুপুরগুলো শহরেও কেমন যেন হঠাৎ করে মন্থর হয়ে যায়। আকাশ কালো করে মেঘ জমে এলে ঘরের ভেতরের আলো কমে আসে, আর তখনই মনে পড়ে কোনো অসমাপ্ত বইয়ের কথা। জানালার গ্রিল ঘেঁষে বসে বাইরে সবুজ পাতায় বৃষ্টির ফোঁটা পড়তে দেখার যে আনন্দ, তা কোনো দ্রুতগতির স্ক্রলিংয়ের সাথে তুলনা করা যায় না।

ছোটবেলায় দেখেছি, বাড়ির বড়রা বিকেলের দিকে বারান্দায় বসে খবরের কাগজ বা মাসিক পত্রিকা জোরে জোরে পড়তেন। পাশের ঘরে বসে থাকা অন্যরা কাজ করতে করতেই সেই পাঠ শুনে নিতেন। পড়া আর শোনার মধ্যে তখন কোনো অদৃশ্য দেয়াল ছিল না; লেখা মানেই ছিল একটি সম্মিলিত শ্রুতি-অভিজ্ঞতা।

আজ আমরা যখন ব্যক্তিগত ব্লগে কোনো ভ্রমণকাহিনী বা স্মৃতিকথা পড়ি, তখন একইভাবে যদি কণ্ঠের উষ্ণতা পাশে পাওয়া যায়, তবে সেই লেখাটি আরও গভীরভাবে হৃদয়ে দাগ কাটে। বিশেষ করে প্রবাসে থাকা বাঙালিরা যখন ব্যস্ত জীবনের ফাঁকে মাতৃভাষায় লেখা কোনো গল্প শুনতে পান, তখন তারা যেন মুহূর্তেই ফিরে যান নিজেদের চেনা বারান্দায়।

নীরবতা আর ধ্বনির এই মেলবন্ধনই আমাদের লেখাকে বাঁচিয়ে রাখে। শব্দ যখন কাগজ ছেড়ে বাতাসে ভাসে, তখন তা কেবল তথ্য থাকে না—তা হয়ে ওঠে অনুভূতি।`,
    language: 'bn',
    category: 'স্মৃতিকথা',
    coverImage: '/src/assets/images/article_monsoon_verandah_1795579744946.jpg',
    coverCaption: 'চিত্র ২ — বৃষ্টির দুপুরে কাঠের জানালার পাশে খোলা বই ও মাটির কাপ',
    authorName: 'Jey Warsi',
    status: 'published',
    featured: false,
    readTimeMinutes: 3,
    voicePreference: 'Zephyr',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'the-architecture-of-spoken-prose',
    title: 'The Architecture of Spoken Prose',
    subtitle: 'Designing digital essays that read cleanly on paper-like screens and sound natural through neural voice synthesis',
    excerpt:
      'Great long-form writing has always carried an internal cadence. When paired with thoughtful audio narration, an editorial page transforms into an intimate listening room.',
    content: `Every memorable essay has a hidden rhythm long before a voice actor or neural synthesizer ever speaks a syllable aloud. Punctuation marks act as subtle breath marks—commas offer a fleeting pause at the turn of a thought, while em-dashes invite a brief reflection before the sentence resolves.

For decades, the web treated written articles purely as visual artifacts optimized for rapid scanning. Sidebars flickered, pop-ups interrupted mid-sentence, and readers were nudged to skim rather than dwell. Yet when an article is also meant to be heard, poor structure reveals itself immediately. Tangled clauses and bloated bullet lists sound breathless when spoken aloud.

Writing for a dual-mode reading and listening blog changes how we craft paragraphs. Shorter sentences breathe more gracefully. Concrete imagery anchors the listener who cannot glance back up the page. Clear paragraph breaks allow a streaming audio queue to advance smoothly from idea to idea without losing the thread.

When readers press play, they are trusting the publication with their quiet attention—whether during a morning walk, a late-night commute, or while resting tired eyes. Honoring that trust means pairing typographic restraint with clear, unhurried audio narration.`,
    language: 'en',
    category: 'Editorial Craft',
    coverImage: '/src/assets/images/article_analog_sound_1795579744622.jpg',
    coverCaption: 'Fig. 3 — Analog tape spools and studio condenser microphone on travertine',
    authorName: 'Jey Warsi',
    status: 'published',
    featured: false,
    readTimeMinutes: 4,
    voicePreference: 'Charon',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 7,
  },
  {
    id: 'building-a-living-bilingual-archive',
    title: 'Building a Living Bilingual Archive',
    subtitle: 'Why independent writers benefit from owning a calm, searchable space across both Bengali and English',
    excerpt:
      'Publishing in two languages lets ideas cross cultural borders without losing their native texture—especially when readers can listen in either tongue.',
    content: `Many writers think in one language while drafting technical notes in another. A bilingual publication refuses to force those worlds apart. Instead of maintaining two fragmented blogs, a unified editorial archive allows a reflective Bengali essay to sit naturally beside an English monograph on software or design.

Accessibility sits at the heart of this approach. Not everyone who understands spoken Bengali reads dense literary Bangla at speed, and not every busy reader has twenty uninterrupted minutes to sit before a monitor. Offering instant text-to-speech playback bridges that gap effortlessly.

With a streamlined admin studio, an independent author can draft an essay, choose an archival cover image, preview how the narrator handles Bengali and English phrasing, and publish directly to the live journal in seconds—without wrestling with complex servers or bloated CMS plugins.

A calm archive grows slowly, one carefully edited essay at a time. Over months and years, those written pages and spoken recordings form a lasting library that readers can return to whenever they seek clarity.`,
    language: 'en',
    category: 'Publishing',
    coverImage: '/src/assets/images/article_archival_library_1795579745515.jpg',
    coverCaption: 'Fig. 4 — Afternoon light across archival library shelves and journals',
    authorName: 'Jey Warsi',
    status: 'published',
    featured: false,
    readTimeMinutes: 4,
    voicePreference: 'Kore',
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 10,
  },
];
