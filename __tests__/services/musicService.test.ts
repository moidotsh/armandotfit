import { describe, it, expect, beforeEach } from 'vitest';
import { parseVideoTitle, parseSearchResponse, parsePlaylistId } from '../../services/musicService';
import { useMusicStore } from '../../stores/musicStore';

describe('parseVideoTitle (the moidotsh convention)', () => {
  it('splits artist - song', () => {
    expect(parseVideoTitle('Nirvana - Come As You Are')).toEqual({
      artist: 'Nirvana',
      title: 'Come As You Are',
    });
  });
  it('keeps a lone title with no artist', () => {
    expect(parseVideoTitle('Come As You Are')).toEqual({ artist: null, title: 'Come As You Are' });
  });
  it('cuts the tail at ~, Lo-Fi, Remix', () => {
    const { title } = parseVideoTitle('Lofi Girl - warm tape ~ 1 hour mix');
    expect(title).toBe('warm tape');
    expect(parseVideoTitle('Artist - Song (Lo-Fi Remix)').title).toBe('Song (');
  });
});

describe('parseSearchResponse', () => {
  it('maps embeddable video items to tracks and skips non-video rows', () => {
    const tracks = parseSearchResponse({
      items: [
        { id: { videoId: 'abc' }, snippet: { title: 'A - One' } },
        { id: { kind: 'youtube#channel' }, snippet: { title: 'channel' } },
        { id: { videoId: 'def' }, snippet: { title: 'Two' } },
      ],
    });
    expect(tracks).toEqual([
      { videoId: 'abc', title: 'One', artist: 'A' },
      { videoId: 'def', title: 'Two', artist: null },
    ]);
  });
});

describe('parsePlaylistId', () => {
  it('accepts bare IDs and URLs carrying list=', () => {
    expect(parsePlaylistId('PL6fhs6TSspZv0F0YgsG-p7Mn189CU2XKS')).toBe(
      'PL6fhs6TSspZv0F0YgsG-p7Mn189CU2XKS',
    );
    expect(parsePlaylistId('https://www.youtube.com/playlist?list=PLabc1234567890xyz')).toBe(
      'PLabc1234567890xyz',
    );
    expect(parsePlaylistId('https://youtu.be/xyz?list=RDxyz&t=3')).toBe('RDxyz');
  });
  it('rejects nothing-shaped input', () => {
    expect(parsePlaylistId('')).toBeNull();
    expect(parsePlaylistId('nonsense')).toBeNull();
    expect(parsePlaylistId('https://youtu.be/xyz')).toBeNull();
  });
});

describe('the music store queue semantics', () => {
  beforeEach(() => {
    useMusicStore.getState().stop();
    useMusicStore.setState({ sheetOpen: false });
  });

  it('playNow plays the pick first and continues with the rest', () => {
    const { playNow, next } = useMusicStore.getState();
    playNow(
      { videoId: 'a', title: 'A', artist: null },
      [
        { videoId: 'b', title: 'B', artist: null },
        { videoId: 'c', title: 'C', artist: null },
      ],
    );
    const st = useMusicStore.getState();
    expect(st.current?.videoId).toBe('a');
    expect(st.playing).toBe(true);
    next();
    expect(useMusicStore.getState().current?.videoId).toBe('b');
    next();
    expect(useMusicStore.getState().current?.videoId).toBe('c');
    next();
    expect(useMusicStore.getState().playing).toBe(false); // queue exhausted
  });

  it('prev walks back; handleEnded advances', () => {
    const { playNow } = useMusicStore.getState();
    playNow(
      { videoId: 'a', title: 'A', artist: null },
      [{ videoId: 'b', title: 'B', artist: null }],
    );
    useMusicStore.getState().next();
    useMusicStore.getState().prev();
    expect(useMusicStore.getState().current?.videoId).toBe('a');
    useMusicStore.getState().handleEnded();
    expect(useMusicStore.getState().current?.videoId).toBe('b');
  });

  it('playlist mode signals skips instead of advancing a queue', () => {
    useMusicStore.getState().playPlaylist('PLabc1234567890');
    const before = useMusicStore.getState().skipSignal;
    useMusicStore.getState().next();
    expect(useMusicStore.getState().skipSignal).toBe(before + 1);
    expect(useMusicStore.getState().current).toBeNull();
  });
});
