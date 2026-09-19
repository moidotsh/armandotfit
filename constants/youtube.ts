// constants/youtube.ts
//
// The music surface's env gate. YouTube SEARCH rides the Data API v3,
// which requires a key — there is no sanctioned keyless search (the
// iframe player's listType=search was deprecated by Google in 2020).
// The key is OPTIONAL by design: without it the app stays fully
// functional and the music sheet offers playlist-paste instead (the
// moidotsh parity mode — a playlist ID plays through the iframe with
// no API at all). With EXPO_PUBLIC_YOUTUBE_API_KEY set, search lights
// up. Static member access is load-bearing for Expo inlining (SE3).

export const YOUTUBE_API_KEY: string = process.env.EXPO_PUBLIC_YOUTUBE_API_KEY ?? '';
export const YOUTUBE_SEARCH_ENABLED = YOUTUBE_API_KEY.length > 0;

/**
 * The default station — the owner's curated playlist: one tap, zero
 * setup. Also the queue-exhaustion continuation (the queue hands off
 * to the station instead of stopping mid-gym).
 */
export const DEFAULT_STATION_ID = 'PL6fhs6TSspZv0F0YgsG-p7Mn189CU2XKS';
