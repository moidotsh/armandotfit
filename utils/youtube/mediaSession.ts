// utils/youtube/mediaSession.ts
//
// Lock-screen / hardware-key transport controls (web Media Session
// API). On a gym app the screen is off mid-set — this is how the
// owner pauses or skips without unlocking. Feature-detected, web-only,
// jsdom-safe: absent API = no-op. Handlers only touch the store; the
// player host's subscription translates intent into player commands,
// so this module never needs the player itself.

import { isWeb } from '../platform';
import { useMusicStore } from '../../stores';

type MediaSessionLike = {
  setActionHandler: (
    action: string,
    handler: (() => void) | null,
  ) => void;
  metadata: unknown;
};

function session(): MediaSessionLike | null {
  if (!isWeb || typeof navigator === 'undefined') return null;
  const s = (navigator as Navigator & { mediaSession?: MediaSessionLike })
    .mediaSession;
  return s ?? null;
}

let bound = false;

/** Wire the transport actions once per app life (idempotent). */
export function bindMediaSession(): void {
  const s = session();
  if (!s || bound) return;
  bound = true;
  const store = () => useMusicStore.getState();
  s.setActionHandler('play', () => store().setPlaying(true));
  s.setActionHandler('pause', () => store().setPlaying(false));
  s.setActionHandler('nexttrack', () => store().next());
  s.setActionHandler('previoustrack', () => store().prev());
}

/** Push now-playing metadata to the lock screen / control center. */
export function updateMediaMetadata(meta: {
  title: string;
  artist: string | null;
} | null): void {
  const s = session();
  if (!s) return;
  if (!meta) {
    s.metadata = null;
    return;
  }
  try {
    s.metadata = new MediaMetadata({
      title: meta.title,
      artist: meta.artist ?? '',
    });
  } catch {
    // MediaMetadata unavailable (older WebKit) — controls still work.
  }
}
