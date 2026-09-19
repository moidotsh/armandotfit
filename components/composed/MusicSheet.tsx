// components/composed/MusicSheet.tsx
//
// THE MUSIC SURFACE — the moidotsh hidden-player pattern with search
// (the owner's ask): type a song or artist/genre, results list, tap
// and it plays — the picked song first, the remaining results
// continuing as its playlist. Picking from the RECENT PICKS list
// (persisted in music_picks — the owner-sanctioned sixth table)
// continues down the recency list. Without a YouTube Data API key,
// search reads its hint and a pasted playlist still plays (the
// keyless moidotsh parity mode). The player itself lives off-tree
// (utils/youtube/playerHost.ts) — audio continues with the sheet
// closed.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Play, Pause, SkipBack, SkipForward, Minus, Plus } from '@tamagui/lucide-icons-2';
import { MobileSheet, MobileInput } from '../MobilePremium';
import { useAppTheme, useToast } from '../../context';
import { useMusicStore, type QueuedTrack } from '../../stores';
import { useMusicPicks } from '../../hooks/queries';
import { useSaveMusicPick } from '../../hooks/mutations';
import {
  searchTracks,
  parseVideoTitle,
  parseYouTubeRef,
  fetchVideoTitle,
  type MusicTrack,
} from '../../services/musicService';
import { YOUTUBE_SEARCH_ENABLED } from '../../constants';
import { GAUGE, theme } from '../../constants';
import { bootMusicPlayer, syncFromStore } from '../../utils/youtube/playerHost';

export function MusicSheet() {
  const { colors } = useAppTheme();
  const { showToast } = useToast();

  // The player host boots once (web only) and every store change is
  // pushed to the player — this sheet is the player's single mount
  // point at the app root, so audio persists across routes and the
  // sheet's own visibility.
  React.useEffect(() => {
    bootMusicPlayer();
  }, []);
  React.useEffect(
    () => useMusicStore.subscribe(() => syncFromStore()),
    [],
  );
  const sheetOpen = useMusicStore((s) => s.sheetOpen);
  const setSheetOpen = useMusicStore((s) => s.setSheetOpen);
  const playNow = useMusicStore((s) => s.playNow);
  const playPlaylist = useMusicStore((s) => s.playPlaylist);
  const updateCurrentMeta = useMusicStore((s) => s.updateCurrentMeta);
  const current = useMusicStore((s) => s.current);
  const playlistId = useMusicStore((s) => s.playlistId);
  const playing = useMusicStore((s) => s.playing);
  const next = useMusicStore((s) => s.next);
  const prev = useMusicStore((s) => s.prev);
  const setPlaying = useMusicStore((s) => s.setPlaying);
  const volume = useMusicStore((s) => s.volume);
  const setVolume = useMusicStore((s) => s.setVolume);
  const playbackNotice = useMusicStore((s) => s.playbackNotice);

  // Playback errors surface as chit toasts (the sheet may be closed —
  // the notice announces wherever the owner is).
  const noticedIdRef = useRef(0);
  useEffect(() => {
    if (!playbackNotice || playbackNotice.id === noticedIdRef.current) return;
    noticedIdRef.current = playbackNotice.id;
    showToast('error', playbackNotice.message);
  }, [playbackNotice, showToast]);

  const picksQuery = useMusicPicks(20);
  const picks = picksQuery.data ?? [];
  const savePick = useSaveMusicPick();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MusicTrack[] | null>(null);
  const [searchFailed, setSearchFailed] = useState(false);
  const [searching, setSearching] = useState(false);
  // After a pick the sheet collapses to the MINI PLAYER (art + meta +
  // transport) — one search, one tap, then the music gets out of the
  // way (the owner's call). The expander row reopens the library.
  const [minimized, setMinimized] = useState(false);

  // R1: a search in flight when the sheet unmounts must not touch
  // state on the dead instance.
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const pick = (track: MusicTrack, rest: MusicTrack[]) => {
    const queued: QueuedTrack = {
      videoId: track.videoId,
      title: track.title,
      artist: track.artist,
    };
    playNow(queued, rest);
    savePick.mutate(queued);
    setMinimized(true);
  };

  // THE INPUT takes anything: a pasted/typed YouTube link (video or
  // playlist) plays immediately — no API needed; anything else is a
  // search query (keyed only). One field, both paths.
  const submitQuery = async () => {
    const raw = query.trim();
    if (raw.length === 0) return;
    const ref = parseYouTubeRef(raw);
    if (ref) {
      if (ref.kind === 'playlist') {
        playPlaylist(ref.playlistId);
      } else {
        const placeholder: QueuedTrack = {
          videoId: ref.videoId,
          title: 'Pasted track',
          artist: null,
        };
        playNow(placeholder, []);
        savePick.mutate(placeholder);
        const real = await fetchVideoTitle(ref.videoId);
        if (!aliveRef.current || real == null) {
          // Still playing under the placeholder; nothing to do.
        } else {
          const parsed = parseVideoTitle(real);
          updateCurrentMeta(ref.videoId, parsed.title, parsed.artist);
        }
      }
      setQuery('');
      setMinimized(true);
      return;
    }
    if (!YOUTUBE_SEARCH_ENABLED || raw.length < 2) return;
    setSearching(true);
    const found = await searchTracks(raw);
    if (!aliveRef.current) return;
    setResults(found);
    setSearchFailed(found == null);
    setSearching(false);
  };

  const recentsAsTracks: MusicTrack[] = useMemo(
    () =>
      picks.map((p) => ({
        videoId: p.videoId,
        title: p.title,
        artist: p.artist,
      })),
    [picks],
  );

  const nowTitle = current?.title ?? (playlistId ? 'PLAYLIST' : null);
  const nowArtist = current?.artist ?? null;

  return (
    <MobileSheet
      open={sheetOpen}
      onOpenChange={setSheetOpen}
      title="MUSIC"
      testID="music-sheet"
    >
      {minimized && nowTitle ? (
        <MiniPlayer
          current={current}
          playing={playing}
          onToggle={() => (playing ? setPlaying(false) : setPlaying(true))}
          onPrev={prev}
          onNext={next}
          onExpand={() => setMinimized(false)}
        />
      ) : (
        <>
      {/* THE INPUT — one field, both paths: a YouTube link (video or
          playlist) plays immediately; anything else searches (keyed). */}
      <View style={styles.searchBlock}>
        <MobileInput
          label=""
          value={query}
          onChangeText={setQuery}
          placeholder={
            YOUTUBE_SEARCH_ENABLED
              ? 'Song, artist, or YouTube link…'
              : 'Paste a YouTube link…'
          }
          onSubmitEditing={() => void submitQuery()}
          returnKeyType="go"
          testID="music-search"
        />
        {!YOUTUBE_SEARCH_ENABLED ? (
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Links play instantly. Set EXPO_PUBLIC_YOUTUBE_API_KEY to also search songs.
          </Text>
        ) : null}
      </View>

      {/* RESULTS — the pick plays first; the rest continue. */}
      {searching ? (
        <Text style={[styles.hint, { color: colors.textMuted }]}>Searching…</Text>
      ) : searchFailed ? (
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Search unavailable — the API key refused this origin. Allow this app's
          domain in the key's website restrictions (Google Cloud Console).
        </Text>
      ) : results != null ? (
        results.length === 0 ? (
          <Text style={[styles.hint, { color: colors.textMuted }]}>Nothing found.</Text>
        ) : (
          <View style={styles.list} testID="music-results">
            {results.map((t, i) => (
              <ResultRow
                key={t.videoId}
                title={t.title}
                artist={t.artist}
                active={current?.videoId === t.videoId}
                onPress={() => pick(t, results.slice(i + 1))}
                testID={`music-result-${i}`}
              />
            ))}
          </View>
        )
      ) : null}

      {/* RECENT PICKS — persisted; picking continues down the list. */}
      {!searching && results == null && recentsAsTracks.length > 0 ? (
        <View style={styles.block}>
          <Text style={[styles.sectionWhisper, { color: colors.textMuted }]}>
            RECENT PICKS
          </Text>
          <View style={styles.list} testID="music-recents">
            {recentsAsTracks.map((t, i) => (
              <ResultRow
                key={`${t.videoId}-${i}`}
                title={t.title}
                artist={t.artist}
                active={current?.videoId === t.videoId}
                onPress={() => pick(t, recentsAsTracks.slice(i + 1))}
                testID={`music-recent-${i}`}
              />
            ))}
          </View>
        </View>
      ) : null}

      {/* THE TRANSPORT — now playing + prev/play/next. */}
      {nowTitle ? (
        <View style={styles.transport} testID="music-transport">
          <View style={styles.nowHold}>
            <Text style={[styles.nowTitle, { color: colors.text }]} numberOfLines={1}>
              {nowTitle}
            </Text>
            {nowArtist ? (
              <Text style={[styles.nowArtist, { color: colors.textMuted }]} numberOfLines={1}>
                {nowArtist}
              </Text>
            ) : null}
          </View>
          <Pressable
            onPress={prev}
            accessibilityRole="button"
            accessibilityLabel="Previous track"
            style={({ pressed }) => [styles.transportButton, pressed ? { opacity: 0.6 } : null]}
            testID="music-prev"
          >
            <SkipBack size={20} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={() => (playing ? setPlaying(false) : setPlaying(true))}
            accessibilityRole="button"
            accessibilityLabel={playing ? 'Pause' : 'Play'}
            style={({ pressed }) => [styles.transportButton, pressed ? { opacity: 0.6 } : null]}
            testID="music-toggle"
          >
            {playing ? (
              <Pause size={22} color={colors.text} />
            ) : (
              <Play size={22} color={colors.text} />
            )}
          </Pressable>
          <Pressable
            onPress={next}
            accessibilityRole="button"
            accessibilityLabel="Next track"
            style={({ pressed }) => [styles.transportButton, pressed ? { opacity: 0.6 } : null]}
            testID="music-next"
          >
            <SkipForward size={20} color={colors.text} />
          </Pressable>
        </View>
      ) : null}

      {/* THE VOLUME — furniture caps, ± steppers, the mono figure.
          Persists; applies to the player on the next sync. */}
      <View style={styles.volumeRow} testID="music-volume">
        <Text style={[styles.sectionWhisper, { color: colors.textMuted }]}>
          VOLUME
        </Text>
        <Pressable
          onPress={() => setVolume(volume - 10)}
          accessibilityRole="button"
          accessibilityLabel={`Volume down, currently ${volume} percent`}
          style={({ pressed }) => [styles.transportButton, pressed ? { opacity: 0.6 } : null]}
          testID="music-volume-down"
        >
          <Minus size={18} color={colors.text} />
        </Pressable>
        <Text style={[styles.volumeFigure, { color: colors.text }]}>
          {volume}
        </Text>
        <Pressable
          onPress={() => setVolume(volume + 10)}
          accessibilityRole="button"
          accessibilityLabel={`Volume up, currently ${volume} percent`}
          style={({ pressed }) => [styles.transportButton, pressed ? { opacity: 0.6 } : null]}
          testID="music-volume-up"
        >
          <Plus size={18} color={colors.text} />
        </Pressable>
      </View>
        </>
      )}
    </MobileSheet>
  );
}

function ResultRow({
  title,
  artist,
  active,
  onPress,
  testID,
}: {
  title: string;
  artist: string | null;
  active: boolean;
  onPress: () => void;
  testID: string;
}) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={artist ? `${artist} — ${title}` : title}
      style={({ pressed }) => [
        styles.resultRow,
        { borderBottomColor: colors.mobilePremium.hairlineBorder },
        pressed ? { opacity: 0.6 } : null,
      ]}
      testID={testID}
    >
      <View style={styles.resultHold}>
        <Text
          style={[styles.resultTitle, { color: active ? colors.brandText : colors.text }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {artist ? (
          <Text style={[styles.resultArtist, { color: colors.textMuted }]} numberOfLines={1}>
            {artist}
          </Text>
        ) : null}
      </View>
      <Play size={16} color={active ? colors.brandText : colors.textMuted} />
    </Pressable>
  );
}


/** THE MINI PLAYER — the sheet collapsed to its essentials: the
 *  thumbnail as the disc (center hole, the live pip in signal while
 *  playing), title/artist, transport. The expander row reopens the
 *  library. Playlist mode (no current track) shows the panel face. */
function MiniPlayer({
  current,
  playing,
  onToggle,
  onPrev,
  onNext,
  onExpand,
}: {
  current: QueuedTrack | null;
  playing: boolean;
  onToggle: () => void;
  onPrev: () => void;
  onNext: () => void;
  onExpand: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <View testID="music-mini">
      <View style={styles.miniRow}>
        <View style={styles.discWrap}>
          {current ? (
            <Image
              source={{ uri: `https://i.ytimg.com/vi/${current.videoId}/mqdefault.jpg` }}
              style={styles.discArt}
              accessibilityRole="image"
              accessibilityLabel={current.title}
            />
          ) : (
            <View
              style={[
                styles.discArt,
                styles.discFallback,
                { borderColor: colors.mobilePremium.hairlineBorderStrong },
              ]}
            >
              <Play size={18} color={colors.textMuted} />
            </View>
          )}
          {/* The center hole — the CD read. */}
          <View
            style={[styles.discHole, { backgroundColor: colors.card }]}
            accessibilityElementsHidden
          />
        </View>
        <View style={styles.nowHold}>
          <Text style={[styles.nowTitle, { color: colors.text }]} numberOfLines={1}>
            {current?.title ?? 'PLAYLIST'}
          </Text>
          {current?.artist ? (
            <Text style={[styles.nowArtist, { color: colors.textMuted }]} numberOfLines={1}>
              {current.artist}
            </Text>
          ) : null}
          <View style={styles.miniPipRow}>
            <View
              style={[
                styles.miniPip,
                { backgroundColor: playing ? colors.brand : colors.textMuted },
              ]}
              accessibilityElementsHidden
            />
            <Text style={[styles.miniState, { color: colors.textMuted }]}>
              {playing ? 'PLAYING' : 'PAUSED'}
            </Text>
          </View>
        </View>
        <Pressable
          onPress={onPrev}
          accessibilityRole="button"
          accessibilityLabel="Previous track"
          style={({ pressed }) => [styles.transportButton, pressed ? { opacity: 0.6 } : null]}
          testID="music-prev"
        >
          <SkipBack size={18} color={colors.text} />
        </Pressable>
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause' : 'Play'}
          style={({ pressed }) => [styles.transportButton, pressed ? { opacity: 0.6 } : null]}
          testID="music-toggle"
        >
          {playing ? (
            <Pause size={22} color={colors.text} />
          ) : (
            <Play size={22} color={colors.text} />
          )}
        </Pressable>
        <Pressable
          onPress={onNext}
          accessibilityRole="button"
          accessibilityLabel="Next track"
          style={({ pressed }) => [styles.transportButton, pressed ? { opacity: 0.6 } : null]}
          testID="music-next"
        >
          <SkipForward size={18} color={colors.text} />
        </Pressable>
      </View>
      <Pressable
        onPress={onExpand}
        accessibilityRole="button"
        accessibilityLabel="Open music library"
        style={({ pressed }) => [styles.miniExpand, pressed ? { opacity: 0.6 } : null]}
        testID="music-mini-expand"
      >
        <Text style={[styles.sectionWhisper, { color: colors.textMuted }]}>
          SEARCH · RECENTS
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: 16,
  },
  searchBlock: {
    marginTop: 4,
  },
  sectionWhisper: {
    ...GAUGE.whisper,
    marginBottom: 6,
  },
  hint: {
    ...theme.typography.mobileMeta,
    paddingVertical: 8,
  },
  list: {},
  resultRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
  },
  resultHold: {
    flex: 1,
    gap: 1,
  },
  resultTitle: {
    ...GAUGE.row,
    fontSize: 15,
  },
  resultArtist: {
    ...theme.typography.mobileLedger,
  },
  pasteRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  pasteInputHold: {
    flex: 1,
  },
  pasteVerb: {
    height: 44,
    minWidth: 64,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: theme.shapes.control,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  pasteVerbWord: {
    ...theme.typography.mobileAction,
    fontSize: 13,
  },
  // THE STATION — one tap, full width.
  stationButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: theme.shapes.control,
  },
  stationWord: {
    ...theme.typography.mobileAction,
    fontSize: 13,
  },
  transport: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nowHold: {
    flex: 1,
    gap: 1,
  },
  nowTitle: {
    ...GAUGE.row,
    fontSize: 15,
  },
  nowArtist: {
    ...theme.typography.mobileLedger,
  },
  transportButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discWrap: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The disc: a square art panel at the CD's proportion, radius 2
  // (the machined corner), hairline edge — the room stays flat.
  discArt: {
    width: 64,
    height: 64,
    borderRadius: theme.shapes.tile,
  },
  discFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  discHole: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  miniPipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  miniPip: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  miniState: {
    ...theme.typography.mobileEyebrow,
  },
  miniExpand: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 6,
  },
  volumeRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  volumeFigure: {
    ...theme.typography.mobileLedger,
    fontSize: 15,
    minWidth: 34,
    textAlign: 'center',
  },
});

export default MusicSheet;
