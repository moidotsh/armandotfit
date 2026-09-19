// utils/youtube/playerHost.ts
//
// The hidden YouTube player host (web only — the moidotsh MusicApp
// pattern, adapted): one IFrame-API player, created off-tree in a
// 1×1 fixed div, driven imperatively. The music store owns intent
// (current track, playlist, transport); this module reacts and
// reports state back (playing/title/ended). jsdom-safe: the API
// script never loads there, every entry point no-ops.

import { isWeb, hasDocument } from '../platform';
import { useMusicStore } from '../../stores';
import { parseVideoTitle } from '../../services/musicService';

interface YTPlayer {
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  loadPlaylist: (opts: { list: string; listType: string }) => void;
  getVideoData: () => { title?: string };
}

let player: YTPlayer | null = null;
let booting = false;

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        opts: Record<string, unknown>,
      ) => YTPlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function ensureDiv(): HTMLElement {
  const id = 'gauge-music-host';
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    // Off-tree visually: 1×1, fixed, transparent, untouchable. The
    // player stays mounted for the app's whole life — audio continues
    // with the sheet closed.
    el.setAttribute(
      'style',
      'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-10px;top:-10px;',
    );
    document.body.appendChild(el);
  }
  return el;
}

/** Load the IFrame API once, then create the hidden player. Safe to
 *  call repeatedly (idempotent). */
export function bootMusicPlayer(): void {
  if (!isWeb || !hasDocument() || player || booting) return;
  if (document.getElementById('youtube-iframe-api')) return;
  booting = true;

  const create = () => {
    if (!window.YT?.Player) return;
    // The store reports back through these handlers.
    player = new window.YT.Player(ensureDiv(), {
      height: '1',
      width: '1',
      playerVars: {
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        iv_load_policy: 3,
      },
      events: {
        onReady: () => {
          booting = false;
          syncFromStore();
        },
        onStateChange: (e: { data: number }) => {
          const store = useMusicStore.getState();
          if (e.data === 1) store.setPlaying(true);
          else if (e.data === 2) store.setPlaying(false);
          else if (e.data === 0) store.handleEnded();
        },
      },
    });
  };

  // Chain after any other onYouTubeIframeAPIReady subscriber.
  const prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    prev?.();
    create();
  };

  const script = document.createElement('script');
  script.id = 'youtube-iframe-api';
  script.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(script);
}

/** Push the store's intent into the player (called on every store
 *  change from the React host component). */
export function syncFromStore(): void {
  if (!player) return;
  const { current, playlistId, playing, skipSignal, prevSignal } =
    useMusicStore.getState();
  if (current?.videoId && current.videoId !== lastLoadedId) {
    lastLoadedId = current.videoId;
    player.loadVideoById(current.videoId);
    return;
  }
  if (playlistId && playlistId !== lastLoadedList) {
    lastLoadedList = playlistId;
    player.loadPlaylist({ list: playlistId, listType: 'playlist' });
    return;
  }
  if (skipSignal !== lastSkip) {
    lastSkip = skipSignal;
    player.nextVideo();
    return;
  }
  if (prevSignal !== lastPrev) {
    lastPrev = prevSignal;
    player.previousVideo();
    return;
  }
  if (playing !== lastPlaying) {
    lastPlaying = playing;
    if (playing) player.playVideo();
    else player.pauseVideo();
  }
}

let lastLoadedId: string | null = null;
let lastLoadedList: string | null = null;
let lastPlaying: boolean | null = null;
let lastSkip = 0;
let lastPrev = 0;

/** The playing video's display title/artist (the store's current may
 *  be stale in playlist mode — the player knows the truth). */
export function currentTrackMeta(): { title: string; artist: string | null } | null {
  if (!player) return null;
  const raw = player.getVideoData()?.title;
  if (!raw) return null;
  return parseVideoTitle(raw);
}
