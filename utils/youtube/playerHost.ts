// utils/youtube/playerHost.ts
//
// The hidden YouTube player host (web only): one IFrame-API player,
// created off-tree in a 1×1 fixed div, driven imperatively. The music
// store owns intent (current track, playlist, transport, volume); this
// module reacts and reports state back (playing/title/ended/ERROR —
// an unavailable or embed-refused video reports a notice and advances
// instead of dying silently with a stuck play icon). The Media
// Session API rides along: lock-screen controls route through the
// store, now-playing metadata pushes on every track change. jsdom-
// safe: the API script never loads there, every entry point no-ops.

import { isWeb, hasDocument } from '../platform';
import { useMusicStore } from '../../stores';
import { parseVideoTitle } from '../../services/musicService';
import { bindMediaSession, updateMediaMetadata } from './mediaSession';

interface YTPlayer {
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  loadPlaylist: (opts: { list: string; listType: string }) => void;
  setVolume: (volume: number) => void;
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

/** Player error codes → honest one-line messages (advance follows). */
function playerErrorMessage(code: number): string {
  if (code === 101 || code === 150) return "Track won't embed here — skipped";
  if (code === 100) return 'Track unavailable — skipped';
  return 'Playback problem — skipped';
}

/** Load the IFrame API once, then create the hidden player. Safe to
 *  call repeatedly (idempotent). */
export function bootMusicPlayer(): void {
  if (!isWeb || !hasDocument() || player || booting) return;
  if (document.getElementById('youtube-iframe-api')) return;
  booting = true;
  bindMediaSession();

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
          const { volume } = useMusicStore.getState();
          lastVolume = volume;
          player?.setVolume(volume);
          syncFromStore();
        },
        onStateChange: (e: { data: number }) => {
          const store = useMusicStore.getState();
          if (e.data === 1) {
            store.setPlaying(true);
            // Now-playing metadata: the queue knows the track; playlist
            // mode asks the player (its title is the truth there).
            updateMediaMetadata(
              store.current
                ? { title: store.current.title, artist: store.current.artist }
                : currentTrackMeta(),
            );
          } else if (e.data === 2) store.setPlaying(false);
          else if (e.data === 0) store.handleEnded();
        },
        onError: (e: { data: number }) => {
          const store = useMusicStore.getState();
          store.reportPlaybackError(playerErrorMessage(e.data));
          // Advance past the broken track: the queue walks; playlist
          // mode forwards to the player's own next.
          if (store.playlistId) player?.nextVideo();
          else store.next();
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
  const { current, playlistId, playing, skipSignal, prevSignal, volume } =
    useMusicStore.getState();
  // Volume rides every sync (idempotent, never conflicts with the
  // one-command diff chain below).
  if (volume !== lastVolume) {
    lastVolume = volume;
    player.setVolume(volume);
  }
  if (current?.videoId && current.videoId !== lastLoadedId) {
    lastLoadedId = current.videoId;
    updateMediaMetadata({ title: current.title, artist: current.artist });
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
let lastVolume: number | null = null;
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
