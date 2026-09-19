// stores/musicStore.ts
// The music surface's playback state: a client-side QUEUE of tracks +
// transport flags + the volume preference. Picking a search result
// plays it and continues with the rest of the results ("a playlist
// that includes it"); picking from the recents list or a loaded list
// continues THAT list. A pasted YouTube playlist switches to playlist
// mode (the iframe streams the list; transport forwards to the
// player). When a queue exhausts, the station continues (the gym's
// radio never stops mid-set). The player host
// (utils/youtube/playerHost.ts) reacts to changes and reports state
// back — including playback ERRORS, which land in the Error section
// as a notice the sheet surfaces. The 5 SECTION markers below are
// load-bearing: audit-state (D10).

// =============================================================================
// SECTION: Loading
// (No loading state — the player host owns readiness; the store is
// instant.)
// =============================================================================

// =============================================================================
// SECTION: Error
// playbackNotice — the player host's error report (unavailable video,
// refused embed), consumed by the sheet as a toast. `id` increments so
// repeated identical errors still announce.
// =============================================================================

// =============================================================================
// SECTION: Modals
// sheetOpen — the music sheet's visibility.
// =============================================================================

// =============================================================================
// SECTION: Selection
// current — the playing (or about-to-play) track. index — its place
// in the queue.
// =============================================================================

// =============================================================================
// SECTION: UI
// queue — the continuation list. playlistId — when set, the iframe
// streams that YouTube playlist and the queue is unused. playing —
// transport flag (mirrored from the player's state events). volume —
// 0..100, the one persisted field (a UI preference, SE2-clean).
// =============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../utils/storage';
import { DEFAULT_STATION_ID } from '../constants';

export interface QueuedTrack {
  videoId: string;
  title: string;
  artist: string | null;
}

export interface PlaybackNotice {
  id: number;
  message: string;
}

interface MusicState {
  // SECTION: Loading
  // (intentionally empty)

  // SECTION: Error
  playbackNotice: PlaybackNotice | null;
  /** The player host reports a playback error (advance is the host's). */
  reportPlaybackError: (message: string) => void;
  clearPlaybackNotice: () => void;

  // SECTION: Modals
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;

  // SECTION: Selection
  queue: QueuedTrack[];
  index: number;

  // SECTION: UI
  current: QueuedTrack | null;
  playlistId: string | null;
  playing: boolean;
  /** 0..100 — persisted; the host applies it to the player. */
  volume: number;
  setVolume: (volume: number) => void;
  /** Signal counters — playlist-mode skips have no queue to advance,
   *  so next/prev bump these and the player host reacts. */
  skipSignal: number;
  prevSignal: number;

  /** Play `track` now, continuing with `rest` after it. Picking from
   *  a list passes the list's remainder — search results, recents, or
   *  any queue. */
  playNow: (track: QueuedTrack, rest: QueuedTrack[]) => void;
  /** Stream a pasted YouTube playlist (mode shift; queue unused). */
  playPlaylist: (playlistId: string) => void;
  next: () => void;
  prev: () => void;
  setPlaying: (playing: boolean) => void;
  /** The player host reports the ended track — advance. */
  handleEnded: () => void;
  stop: () => void;
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => ({
      // SECTION: Loading
      // (intentionally empty)

      // SECTION: Error
      playbackNotice: null,
      reportPlaybackError: (message) =>
        set((st) => ({
          playbackNotice: { id: (st.playbackNotice?.id ?? 0) + 1, message },
        })),
      clearPlaybackNotice: () => set({ playbackNotice: null }),

      // SECTION: Modals
      sheetOpen: false,
      setSheetOpen: (open) => set({ sheetOpen: open }),

      // SECTION: Selection
      queue: [],
      index: 0,

      // SECTION: UI
      current: null,
      playlistId: null,
      playing: false,
      volume: 80,
      setVolume: (volume) =>
        set({ volume: Math.max(0, Math.min(100, Math.round(volume))) }),
      skipSignal: 0,
      prevSignal: 0,

      playNow: (track, rest) =>
        set({
          queue: [track, ...rest],
          index: 0,
          current: track,
          playlistId: null,
          playing: true,
        }),

      playPlaylist: (playlistId) =>
        set({ playlistId, queue: [], index: 0, current: null, playing: true }),

      next: () => {
        const { queue, index, playlistId } = get();
        if (playlistId) {
          // Playlist mode: the host forwards to the player's own next.
          set((st) => ({ skipSignal: st.skipSignal + 1 }));
          return;
        }
        const nextIndex = index + 1;
        if (nextIndex >= queue.length) {
          // An exhausted queue (something WAS playing) hands off to the
          // station — music continues instead of stopping mid-gym. A
          // next() with nothing queued keeps the old behavior (stop).
          if (queue.length === 0) {
            set({ playing: false });
            return;
          }
          get().playPlaylist(DEFAULT_STATION_ID);
          get().reportPlaybackError('Queue done — the station continues');
          return;
        }
        set({ index: nextIndex, current: queue[nextIndex], playing: true });
      },

      prev: () => {
        const { queue, index, playlistId } = get();
        if (playlistId) {
          set((st) => ({ prevSignal: st.prevSignal + 1 }));
          return;
        }
        if (index <= 0) return;
        set({ index: index - 1, current: queue[index - 1], playing: true });
      },

      setPlaying: (playing) => set({ playing }),

      handleEnded: () => get().next(),

      stop: () => set({ current: null, playlistId: null, queue: [], index: 0, playing: false }),
    }),
    {
      name: 'armandotfit:music',
      storage: createJSONStorage(() => zustandStorage),
      // Only the volume preference persists — playback state is
      // session-local by design.
      partialize: (state) => ({ volume: state.volume }),
    },
  ),
);
