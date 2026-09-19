// services/musicService.ts
//
// The music surface's read path: YouTube Data API v3 search (via
// fetchWithRetry — the sanctioned network shim, S8) + the pure
// title/artist parser. Everything here is display-only derivation;
// playback itself lives in the iframe player host (utils/youtube).

import { fetchWithRetry } from '../utils/api-client';
import { YOUTUBE_API_KEY } from '../constants';
import { logger } from '../utils';
import { AppError, ErrorCode } from '../utils/errors';

export interface MusicTrack {
  videoId: string;
  title: string;
  artist: string | null;
}

interface YouTubeSearchItem {
  id?: { videoId?: string };
  snippet?: { title?: string };
}

/**
 * Search YouTube for videos. Returns display tracks (videoId + parsed
 * title/artist) in result order — the picked song plays first and the
 * remaining results continue as its playlist (the caller owns the
 * queue). Returns null when search is not configured (no key) or the
 * API declined — the UI reads null as "search unavailable", never as
 * an empty result set.
 */
export async function searchTracks(query: string): Promise<MusicTrack[] | null> {
  if (!YOUTUBE_API_KEY) return null;
  const q = query.trim();
  if (q.length < 2) return [];
  const url =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video` +
    `&maxResults=10&videoEmbeddable=true&q=${encodeURIComponent(q)}&key=${YOUTUBE_API_KEY}`;
  try {
    const res = await fetchWithRetry(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new AppError(`YouTube search HTTP ${res.status}`, ErrorCode.SERVER_ERROR);
    const payload: unknown = await res.json();
    return parseSearchResponse(payload);
  } catch (e) {
    logger.warn('api', 'YouTube search failed:', e instanceof Error ? e.message : e);
    return null;
  }
}

/** Parse a Data API search response into display tracks (pure). */
export function parseSearchResponse(payload: unknown): MusicTrack[] {
  const items = (payload as { items?: YouTubeSearchItem[] } | null)?.items ?? [];
  const out: MusicTrack[] = [];
  for (const item of items) {
    const videoId = item.id?.videoId;
    if (!videoId) continue;
    const { artist, title } = parseVideoTitle(item.snippet?.title ?? '');
    out.push({ videoId, title, artist });
  }
  return out;
}

/**
 * Decode the HTML entities YouTube ships in snippet titles
 * (&quot; &#39; &amp; &#8212; …) — the API escapes, the UI must not.
 * Named entities cover what titles actually carry; numeric forms
 * (decimal + hex) decode any codepoint. Unknown entities pass
 * through untouched.
 */
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  nbsp: ' ',
};

export function decodeHtmlEntities(raw: string): string {
  return raw.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) {
      const code = Number.parseInt(body.slice(2), 16);
      return code > 0 ? String.fromCodePoint(code) : match;
    }
    if (body.startsWith('#')) {
      const code = Number.parseInt(body.slice(1), 10);
      return code > 0 ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[body] ?? match;
  });
}

/**
 * Split a YouTube video title into artist + song, the moidotsh
 * convention: entity-decode first (the API escapes titles), cut the
 * tail at "~", "Lo-Fi", or "Remix", then split the remainder on the
 * first " - ". "Artist - Song" → both; a lone word stays a title with
 * no artist.
 */
export function parseVideoTitle(raw: string): { artist: string | null; title: string } {
  const cleaned = decodeHtmlEntities(raw)
    .split('~')[0]
    .split('Lo-Fi')[0]
    .split('Lo-FI')[0]
    .split('Remix')[0]
    .trim();
  const parts = cleaned.split(' - ');
  if (parts.length === 1) {
    return { artist: null, title: parts[0].trim() };
  }
  return { artist: parts[0].trim(), title: parts.slice(1).join(' - ').trim() };
}

/**
 * Extract a playlist ID from a pasted value: a bare ID (PL…, OL…,
 * RD…) or any YouTube URL carrying list=… . Returns null when nothing
 * playlist-shaped is found.
 */
export function parsePlaylistId(input: string): string | null {
  const v = input.trim();
  if (v.length === 0) return null;
  if (/^(PL|OL|RD|UU|LL|FL)[A-Za-z0-9_-]{10,}$/.test(v)) return v;
  const m = v.match(/[?&]list=([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

/** What a pasted YouTube reference resolves to. */
export type YouTubeRef =
  | { kind: 'video'; videoId: string }
  | { kind: 'playlist'; playlistId: string };

/**
 * Resolve ANY pasted YouTube reference — a video link (youtu.be/ID,
 * watch?v=ID), a playlist link or bare playlist ID, or a bare 11-char
 * video ID. The paste path is link-shaped: paste what YouTube gives
 * you and it plays. Order matters: list= beats v= when both ride one
 * URL (a video URL with a list context plays the LIST, matching what
 * the user copied from).
 */
export function parseYouTubeRef(input: string): YouTubeRef | null {
  const v = input.trim();
  if (v.length === 0) return null;
  // Playlist first: bare playlist-shaped IDs, then any URL with list=.
  const playlist = parsePlaylistId(v);
  if (playlist) return { kind: 'playlist', playlistId: playlist };
  // Video URL forms.
  const watch = v.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (watch) return { kind: 'video', videoId: watch[1] };
  const short = v.match(/youtu\.be\/([A-Za-z0-9_-]{11})/);
  if (short) return { kind: 'video', videoId: short[1] };
  const shorts = v.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/);
  if (shorts) return { kind: 'video', videoId: shorts[1] };
  // Bare 11-char token — a video ID by elimination (playlists matched
  // their longer prefixed shapes above).
  if (/^[A-Za-z0-9_-]{11}$/.test(v)) return { kind: 'video', videoId: v };
  return null;
}

/**
 * Fetch one video's display title (the paste-a-video path has no
 * title until asked). Keyed only; null when keyless or the API
 * declines — the caller plays with a placeholder label instead.
 */
export async function fetchVideoTitle(videoId: string): Promise<string | null> {
  if (!YOUTUBE_API_KEY) return null;
  const url =
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}` +
    `&key=${YOUTUBE_API_KEY}`;
  try {
    const res = await fetchWithRetry(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new AppError(`YouTube videos HTTP ${res.status}`, ErrorCode.SERVER_ERROR);
    const payload = (await res.json()) as {
      items?: Array<{ snippet?: { title?: string } }>;
    };
    return payload.items?.[0]?.snippet?.title ?? null;
  } catch (e) {
    logger.warn('api', 'YouTube video lookup failed:', e instanceof Error ? e.message : e);
    return null;
  }
}
