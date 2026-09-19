// shared/types/music.ts
// Domain types for the music surface: a persisted pick (music_picks —
// the owner-sanctioned sixth table) and the transient queue track.

export interface MusicPick {
  id: string;
  videoId: string;
  title: string;
  artist: string | null;
  pickedAt: string;
}
