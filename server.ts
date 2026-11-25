import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const ALLOWED_VOICES = new Set(['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr']);

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      apiVersion: 'v1beta',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// In-memory LRU cache for synthesized audio chunks (keyed by voice:lang:text)
const ttsCache = new Map<string, string>();
const MAX_CACHE_ENTRIES = 120;

function getCachedAudio(key: string): string | undefined {
  const val = ttsCache.get(key);
  if (val) {
    ttsCache.delete(key);
    ttsCache.set(key, val);
  }
  return val;
}

function setCachedAudio(key: string, base64Audio: string): void {
  if (ttsCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = ttsCache.keys().next().value;
    if (oldestKey) {
      ttsCache.delete(oldestKey);
    }
  }
  ttsCache.set(key, base64Audio);
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/tts', async (req: Request, res: Response) => {
    try {
      const { text, language, voiceName } = req.body as {
        text?: unknown;
        language?: unknown;
        voiceName?: unknown;
      };

      if (typeof text !== 'string' || text.trim().length === 0) {
        res.status(400).json({ error: 'Text content is required for audio synthesis.' });
        return;
      }

      const cleanedText = text.trim().slice(0, 2600);
      const lang = language === 'bn' ? 'bn' : 'en';
      const voice = typeof voiceName === 'string' && ALLOWED_VOICES.has(voiceName) ? voiceName : 'Kore';

      if (!ai) {
        res.status(503).json({
          error: 'Text-to-speech service key is not configured on the server.',
        });
        return;
      }

      const cacheKey = `${voice}:${lang}:${cleanedText}`;
      const cached = getCachedAudio(cacheKey);
      if (cached) {
        res.json({ audioBase64: cached, mimeType: 'audio/wav', cached: true });
        return;
      }

      const stylePrompt =
        lang === 'bn'
          ? 'Warm, articulate Bengali literary narrator. Read naturally with clear Bengali pronunciation and gentle editorial pacing.'
          : 'Warm, articulate editorial magazine narrator. Read with calm, clear, measured cadence.';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: cleanedText,
                speechMetadata: {
                  style: stylePrompt,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        res.status(502).json({ error: 'The voice model returned an empty audio payload.' });
        return;
      }

      setCachedAudio(cacheKey, base64Audio);
      res.json({ audioBase64: base64Audio, mimeType: 'audio/wav', cached: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unexpected TTS synthesis failure.';
      const status =
        message.includes('429') || message.includes('RESOURCE_EXHAUSTED')
          ? 429
          : message.includes('403') || message.includes('PERMISSION_DENIED')
            ? 403
            : 500;
      res.status(status).json({ error: message });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  const distDir = path.resolve(__dirname, 'dist');

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
