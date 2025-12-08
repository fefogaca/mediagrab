export type MediaProviderId =
  | 'youtube'
  | 'vimeo'
  | 'tiktok'
  | 'instagram'
  | 'twitter'
  | 'facebook'
  | 'dailymotion'
  | 'soundcloud';

export interface MediaProvider {
  id: MediaProviderId;
  label: string;
  patterns: RegExp[];
}

export const MEDIA_PROVIDERS: MediaProvider[] = [
  {
    id: 'youtube',
    label: 'YouTube',
    patterns: [/youtube\.com/i, /youtu\.be/i],
  },
  {
    id: 'vimeo',
    label: 'Vimeo',
    patterns: [/vimeo\.com/i],
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    patterns: [/tiktok\.com/i],
  },
  {
    id: 'instagram',
    label: 'Instagram',
    patterns: [/instagram\.com/i, /instagr\.am/i],
  },
  {
    id: 'twitter',
    label: 'Twitter (X)',
    patterns: [/twitter\.com/i, /x\.com/i],
  },
  {
    id: 'facebook',
    label: 'Facebook',
    patterns: [/facebook\.com/i, /fb\.watch/i],
  },
  {
    id: 'dailymotion',
    label: 'Dailymotion',
    patterns: [/dailymotion\.com/i, /dai\.ly/i],
  },
  {
    id: 'soundcloud',
    label: 'SoundCloud',
    patterns: [/soundcloud\.com/i],
  },
];

export type MediaValidationError = 'INVALID_URL' | 'UNSUPPORTED_PROVIDER';

export type MediaValidationResult =
  | {
      ok: true;
      provider: MediaProvider;
      normalizedUrl: string;
    }
  | {
      ok: false;
      reason: MediaValidationError;
      message: string;
    };

export function normalizeCandidateUrl(candidate: string): string | null {
  if (!candidate || typeof candidate !== 'string') return null;

  const trimmed = candidate.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (!parsed.protocol.startsWith('http')) {
      return null;
    }
    return parsed.toString();
  } catch {
    // Allow URLs without protocol by trying to prefix https
    try {
      const parsed = new URL(`https://${trimmed}`);
      if (!parsed.protocol.startsWith('http')) {
        return null;
      }
      return parsed.toString();
    } catch {
      return null;
    }
  }
}

export function detectMediaProvider(candidateUrl: string): MediaProvider | null {
  try {
    const parsed = new URL(candidateUrl);
    const hostAndPath = `${parsed.hostname}${parsed.pathname}`;

    return (
      MEDIA_PROVIDERS.find((provider) =>
        provider.patterns.some((pattern) => pattern.test(hostAndPath))
      ) ?? null
    );
  } catch {
    return null;
  }
}

export function validateMediaUrl(candidate: string): MediaValidationResult {
  const normalized = normalizeCandidateUrl(candidate);
  if (!normalized) {
    return {
      ok: false,
      reason: 'INVALID_URL',
      message: 'Forneça um link completo (https://...) para continuar.',
    };
  }

  const provider = detectMediaProvider(normalized);
  if (!provider) {
    return {
      ok: false,
      reason: 'UNSUPPORTED_PROVIDER',
      message:
        'Este link não é suportado no momento. Tente um link do YouTube, Vimeo, TikTok ou outra plataforma suportada.',
    };
  }

  return {
    ok: true,
    provider,
    normalizedUrl: normalized,
  };
}
