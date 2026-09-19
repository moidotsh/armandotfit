// stores/musicStore.ts
// The music surface's playback state (the moidotsh MusicApp pattern,
// evolved): a client-side QUEUE of tracks + transport flags. Picking
// a search result plays it and continues with the rest of the results
// ("a playlist that includes it"); picking from the recents list or a
// loaded list continues THAT list. A pasted YouTube playlist switches
// to playlist mode (the iframe streams the list; transport forwards
// to the player). The player host (utils/youtube/player.ts) reacts to
// `current` changes and reports state back. The 5 SECTION markers
// below are load-bearing: audit-state (D10).

// =============================================================================
// SECTION: Loading
// (No loading state — the player host owns readiness; the store is
// instant.)
// =============================================================================

// =============================================================================
// SECTION: Error
// (No error state — search/pick failures degrade in place: null
// results render the hint, failed saves only log.)
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
// transport flag (mirrored from the player's state events).
// =============================================================================

import { create } from 'zustand';

export interface QueuedTrack {
  videoId: string;
  title: string;
  artist: string | null;
}

interface MusicState {
  // SECTION: Loading
  // (intentionally empty)

  // SECTION: Error
  // (intentionally empty)

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

export const useMusicStore = create<MusicState>()((set, get) => ({
  // SECTION: Loading
  // (intentionally empty)

  // SECTION: Error
  // (intentionally empty)

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
      set({ playing: false });
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
}));
