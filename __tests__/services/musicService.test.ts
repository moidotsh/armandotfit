import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseVideoTitle,
  parseSearchResponse,
  parsePlaylistId,
  parseYouTubeRef,
  decodeHtmlEntities,
} from '../../services/musicService';
import { useMusicStore } from '../../stores/musicStore';

describe('decodeHtmlEntities (the API escapes titles; the UI must not)', () => {
  it('decodes the entities YouTube actually ships', () => {
    // The owner's console report, verbatim shapes.
    expect(decodeHtmlEntities('ANSWER TO &quot;D.O.R.&quot;')).toBe('ANSWER TO "D.O.R."');
    expect(decodeHtmlEntities('I&#39;m God')).toBe("I'm God");
    expect(decodeHtmlEntities('Suck My D*&amp;*')).toBe('Suck My D*&*');
  });
  it('decodes numeric forms (decimal + hex) and passes unknowns through', () => {
    expect(decodeHtmlEntities('A &#8212; B')).toBe('A — B');
    expect(decodeHtmlEntities('A &#x2014; B')).toBe('A — B');
    expect(decodeHtmlEntities('&lt;tag&gt; &nbsp;')).toBe('<tag>  ');
    expect(decodeHtmlEntities('&bogus; 100% &amp')).toBe('&bogus; 100% &amp');
  });
});

describe('parseVideoTitle (the moidotsh convention)', () => {
  it('decodes entities before splitting', () => {
    expect(parseVideoTitle('Lil B - I&#39;m God (Produced By Clams Casino)')).toEqual({
      artist: 'Lil B',
      title: "I'm God (Produced By Clams Casino)",
    });
  });
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

describe('parseYouTubeRef (the paste path)', () => {
  it('resolves video URLs in every common shape', () => {
    expect(parseYouTubeRef('https://youtu.be/dQw4w9WgXcQ')).toEqual({
      kind: 'video',
      videoId: 'dQw4w9WgXcQ',
    });
    expect(parseYouTubeRef('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=3')).toEqual({
      kind: 'video',
      videoId: 'dQw4w9WgXcQ',
    });
    expect(parseYouTubeRef('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toEqual({
      kind: 'video',
      videoId: 'dQw4w9WgXcQ',
    });
    expect(parseYouTubeRef('dQw4w9WgXcQ')).toEqual({
      kind: 'video',
      videoId: 'dQw4w9WgXcQ',
    });
  });
  it('resolves playlists — and list= beats v= when both ride one URL', () => {
    expect(parseYouTubeRef('PL6fhs6TSspZv0F0YgsG-p7Mn189CU2XKS')).toEqual({
      kind: 'playlist',
      playlistId: 'PL6fhs6TSspZv0F0YgsG-p7Mn189CU2XKS',
    });
    expect(
      parseYouTubeRef('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabc1234567890xyz'),
    ).toEqual({ kind: 'playlist', playlistId: 'PLabc1234567890xyz' });
  });
  it('rejects nothing-shaped input', () => {
    expect(parseYouTubeRef('')).toBeNull();
    expect(parseYouTubeRef('nonsense')).toBeNull();
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
    // Queue exhausted → playback STOPS: nothing the owner didn't
    // pick ever auto-plays (owner decision — no station fall-in).
    next();
    const after = useMusicStore.getState();
    expect(after.playing).toBe(false);
    expect(after.playlistId).toBeNull();
    expect(after.current?.videoId).toBe('c');
  });

  it('next with nothing queued stops quietly', () => {
    useMusicStore.getState().next();
    expect(useMusicStore.getState().playing).toBe(false);
    expect(useMusicStore.getState().playlistId).toBeNull();
  });

  it('updateCurrentMeta lands the real title on a pasted video', () => {
    useMusicStore.getState().playNow(
      { videoId: 'abcdefghijk', title: 'Pasted track', artist: null },
      [],
    );
    useMusicStore.getState().updateCurrentMeta('abcdefghijk', 'Come As You Are', 'Nirvana');
    const st = useMusicStore.getState();
    expect(st.current).toEqual({
      videoId: 'abcdefghijk',
      title: 'Come As You Are',
      artist: 'Nirvana',
    });
    expect(st.queue[0]).toEqual(st.current);
    // A stale answer for a different video is ignored.
    useMusicStore.getState().updateCurrentMeta('other video!', 'Nope', null);
    expect(useMusicStore.getState().current?.title).toBe('Come As You Are');
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

describe('the music store volume + notices', () => {
  beforeEach(() => {
    useMusicStore.getState().stop();
    useMusicStore.setState({ playbackNotice: null, volume: 80 });
  });

  it('volume clamps to 0..100 in steps', () => {
    const { setVolume } = useMusicStore.getState();
    setVolume(65);
    expect(useMusicStore.getState().volume).toBe(65);
    setVolume(-10);
    expect(useMusicStore.getState().volume).toBe(0);
    setVolume(140);
    expect(useMusicStore.getState().volume).toBe(100);
  });

  it('volume persists (and only volume) under the music key', async () => {
    useMusicStore.getState().setVolume(30);
    await Promise.resolve();
    const raw = window.localStorage.getItem('armandotfit:music');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string) as { state: Record<string, unknown> };
    expect(parsed.state.volume).toBe(30);
    expect(Object.keys(parsed.state)).toEqual(['volume']);
  });

  it('playback notices bump their id so repeats still announce', () => {
    useMusicStore.getState().reportPlaybackError('Track unavailable — skipped');
    const first = useMusicStore.getState().playbackNotice;
    expect(first?.message).toContain('skipped');
    useMusicStore.getState().reportPlaybackError('Track unavailable — skipped');
    const second = useMusicStore.getState().playbackNotice;
    expect(second?.id).toBeGreaterThan(first?.id ?? 0);
    useMusicStore.getState().clearPlaybackNotice();
    expect(useMusicStore.getState().playbackNotice).toBeNull();
  });
});
