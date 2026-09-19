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
 * Split a YouTube video title into artist + song, the moidotsh
 * convention: cut the tail at "~", "Lo-Fi", or "Remix", then split
 * the remainder on the first " - ". "Artist - Song" → both; a lone
 * word stays a title with no artist.
 */
export function parseVideoTitle(raw: string): { artist: string | null; title: string } {
  const cleaned = raw
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
