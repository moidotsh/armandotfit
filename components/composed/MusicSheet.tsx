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
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Play, Pause, SkipBack, SkipForward } from '@tamagui/lucide-icons-2';
import { MobileSheet, MobileInput } from '../MobilePremium';
import { useAppTheme } from '../../context';
import { useMusicStore, type QueuedTrack } from '../../stores';
import { useMusicPicks } from '../../hooks/queries';
import { useSaveMusicPick } from '../../hooks/mutations';
import { searchTracks, parsePlaylistId, type MusicTrack } from '../../services/musicService';
import { YOUTUBE_SEARCH_ENABLED } from '../../constants';
import { GAUGE, theme } from '../../constants';

/** The default station — the owner's moidotsh playlist: one tap,
 *  zero setup, the moidotsh Music experience. */
const DEFAULT_STATION = 'PL6fhs6TSspZv0F0YgsG-p7Mn189CU2XKS';
import { bootMusicPlayer, syncFromStore } from '../../utils/youtube/playerHost';

export function MusicSheet() {
  const { colors } = useAppTheme();

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
  const current = useMusicStore((s) => s.current);
  const playlistId = useMusicStore((s) => s.playlistId);
  const playing = useMusicStore((s) => s.playing);
  const next = useMusicStore((s) => s.next);
  const prev = useMusicStore((s) => s.prev);
  const setPlaying = useMusicStore((s) => s.setPlaying);

  const picksQuery = useMusicPicks(20);
  const picks = picksQuery.data ?? [];
  const savePick = useSaveMusicPick();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MusicTrack[] | null>(null);
  const [searchFailed, setSearchFailed] = useState(false);
  const [searching, setSearching] = useState(false);
  const [pasteValue, setPasteValue] = useState('');

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
  };

  const runSearch = async () => {
    if (!YOUTUBE_SEARCH_ENABLED || query.trim().length < 2) return;
    setSearching(true);
    const found = await searchTracks(query);
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
      {/* THE SEARCH — type a song, artist, or genre. */}
      {YOUTUBE_SEARCH_ENABLED ? (
        <View style={styles.searchBlock}>
          <MobileInput
            label=""
            value={query}
            onChangeText={setQuery}
            placeholder="Song, artist, genre…"
            onSubmitEditing={() => void runSearch()}
            returnKeyType="search"
            testID="music-search"
          />
        </View>
      ) : (
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Paste a playlist below — or set EXPO_PUBLIC_YOUTUBE_API_KEY to enable song search.
        </Text>
      )}

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

      {/* THE STATION — the default mix, one tap (moidotsh parity,
          zero setup). */}
      <View style={styles.block}>
        <Pressable
          onPress={() => playPlaylist(DEFAULT_STATION)}
          accessibilityRole="button"
          accessibilityLabel="Play the default station"
          style={({ pressed }) => [
            styles.stationButton,
            { borderColor: colors.mobilePremium.hairlineBorderStrong },
            pressed ? { opacity: 0.6 } : null,
          ]}
          testID="music-station"
        >
          <Play size={16} color={colors.text} />
          <Text style={[styles.stationWord, { color: colors.text }]}>
            THE STATION · DEFAULT MIX
          </Text>
        </Pressable>
      </View>

      {/* THE PASTE — any playlist link. */}
      <View style={styles.block}>
        <Text style={[styles.sectionWhisper, { color: colors.textMuted }]}>
          PLAY FROM A PLAYLIST LINK
        </Text>
        <View style={styles.pasteRow}>
          <View style={styles.pasteInputHold}>
            <MobileInput
              label=""
              value={pasteValue}
              onChangeText={setPasteValue}
              placeholder="youtube.com/playlist?list=…"
              testID="music-paste"
            />
          </View>
          <Pressable
            onPress={() => {
              const id = parsePlaylistId(pasteValue);
              if (id) {
                playPlaylist(id);
                setPasteValue('');
              }
            }}
            accessibilityRole="button"
            accessibilityLabel="Play playlist"
            style={({ pressed }) => [
              styles.pasteVerb,
              { borderColor: colors.mobilePremium.hairlineBorderStrong },
              pressed ? { opacity: 0.6 } : null,
            ]}
            testID="music-paste-play"
          >
            <Text style={[styles.pasteVerbWord, { color: colors.text }]}>PLAY</Text>
          </Pressable>
        </View>
      </View>

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
});

export default MusicSheet;
