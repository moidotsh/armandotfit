// components/MobilePremium/MobileAbsorbBar.tsx
// The absorbing top bar — the home header drinks the page. The bar is a
// paper strip pinned over the top of the scroll (the masthead rides a
// transparent layer above it); the strong surfaces below register as
// STATIONS (an announcement strip's wash, an ink hero plate, a brand
// card, a plain paper card), and as one crosses the bar its
// colour rises into the strip like dye into water: a damped fill height
// with a live wavy meniscus (two SVG wave tiles drifting at different
// speeds), the chrome flipping to its readable companion as the fill
// takes the row. Entering, the colour connects DOWN to the card below —
// the fill rises from the bar's floor; exiting, the card rides out above
// and the fill hangs from the bar's top, meniscus flipped, its crests
// dripping toward the floor. When a station leaves, the strip is the
// page's paper again — the background that runs between the elements,
// which is what it already renders at rest (backgroundDeep, the
// atmosphere's base tint).
//
// Geometry is DOM-only, so the motion is web-only (jsdom collapses to
// the inert static bar; native keeps the overlay layout with a plain
// paper strip — no measurement engine). Fill heights are written
// straight to the layer nodes from a rAF loop, so scrolling never
// re-renders React: only layer mount/unmount, phase flips, the tone
// flip, and the scrolled hairline are state. Ink dialect throughout —
// flat fills, no shadows, no gradients.

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useAppTheme } from '../../context';
import { hasWindow, isWeb } from '../../utils';
import { prefersReducedMotionSync } from './MobileMotion';

// ── Tuning ──────────────────────────────────────────────────────────────
// The rise is near-sticky (the fill meets the card's edge at first
// contact and stays on it — a slow liquid here reads as the colour
// popping in mid-bar); the fall stays viscous. Damping is time-based
// exponential, so the feel holds at 60 and 120Hz. The chrome has NO
// engage/release thresholds — the contrast copy is clipped to the
// fill's own shape, so half-covered text reads half-flipped by
// construction: the ripple splits the letters.
const DAMP_RISE_MS = 34;
const DAMP_FALL_MS = 62;
const HAIRLINE_AT = 6;

const WAVE_A = { tile: 112, height: 28, cls: 'arq-absorb-wave-a' };
const WAVE_B = { tile: 76, height: 20, cls: 'arq-absorb-wave-b' };
// One drift period per wave — the CSS durations and the engine's
// mask-phase lock read the same numbers.
const DRIFT_A_MS = 3400;
const DRIFT_B_MS = 5200;

interface WaveSpec {
  tile: number;
  height: number;
  cls: string;
}

interface AbsorbStationEntry {
  el: HTMLElement | null;
  color: string;
  /** Damped fill fraction 0..1 — engine-owned, never React state. */
  cur: number;
  /** Measured overlap target 0..1. */
  target: number;
  /**
   * Transit phase: entering (the colour connects DOWN to the card below
   * the bar — the fill rises) or exiting (the card is above — the fill
   * hangs from it, meniscus dripping toward the floor). Flips exactly
   * when the card's bottom edge crosses the bar's bottom, i.e. at full
   * fill, so the swap is seamless.
   */
  exit: boolean;
  /** The card's own corner radius, cached at first dock (0 = square). */
  cardRadius: number | null;
  /** True while the docking corners are written inline. */
  docked: boolean;
}

export interface AbsorbFillLayer {
  id: string;
  color: string;
  exit: boolean;
}

export interface AbsorbTone {
  /** Readable chrome colour while a fill owns the row; null = neutral. */
  fg: string | null;
  /** The owning fill's own colour — chrome with an opaque ground (the
   *  language pill) paints IT, not transparency: the base copy's ground
   *  would otherwise show through under the contrast copy. */
  bg: string | null;
}

interface AbsorbContextValue {
  /** The backdrop strip element — the overlap zone the engine measures. */
  barEl: React.MutableRefObject<HTMLElement | null>;
  /** The chrome contrast copies' clip nodes — engine-written heights.
   *  Two copies, one per wave's mask; their union is the visible crest. */
  chromeClipEls: {
    a: React.MutableRefObject<HTMLElement | null>;
    b: React.MutableRefObject<HTMLElement | null>;
  };
  /** Live station registry (engine-owned). */
  stations: Map<string, AbsorbStationEntry>;
  /** Fill layer nodes, written to directly by the rAF loop. */
  layerEls: Map<string, HTMLElement>;
  /** Mounted fill layers. */
  layers: AbsorbFillLayer[];
  /** Chrome tone while a station's fill owns the row. */
  tone: AbsorbTone;
  /** True once the page has scrolled off its rest position. */
  scrolled: boolean;
  /** The measured masthead height (the body spacer's source). */
  barHeight: number;
  /** The dominant fill's transit phase — clips the chrome copy. */
  clipExit: boolean;
  attach(id: string, color: string, el: unknown): void;
  detach(id: string): void;
  setStationColor(id: string, color: string): void;
  ping(): void;
  reportBarHeight(h: number): void;
  attachLayerEl(id: string, el: unknown): void;
  attachChromeClip(which: 'a' | 'b', el: unknown): void;
}

const EMPTY_TONE: AbsorbTone = { fg: null, bg: null };

// The provider-less default (cart buttons and pills on screens that
// never mount a bar) — every member is a no-op or a rest value.
const IDLE_CONTEXT: AbsorbContextValue = {
  barEl: { current: null },
  chromeClipEls: { a: { current: null }, b: { current: null } },
  stations: new Map(),
  layerEls: new Map(),
  layers: [],
  tone: EMPTY_TONE,
  scrolled: false,
  barHeight: 0,
  clipExit: false,
  attach: () => {},
  detach: () => {},
  setStationColor: () => {},
  ping: () => {},
  reportBarHeight: () => {},
  attachLayerEl: () => {},
  attachChromeClip: () => {},
};

const AbsorbContext = createContext<AbsorbContextValue | null>(null);

function useAbsorb(): AbsorbContextValue {
  return useContext(AbsorbContext) ?? IDLE_CONTEXT;
}

// ── Small DOM helpers ───────────────────────────────────────────────────
// RN views pass their host node on web; native passes class instances
// for which HTMLElement does not exist — one guard covers both.
const HAS_HTML_ELEMENT = typeof HTMLElement !== 'undefined';

function nodeFrom(el: unknown): HTMLElement | null {
  return HAS_HTML_ELEMENT && el instanceof HTMLElement ? el : null;
}

function yiq(color: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (m == null) return 255;
  const n = parseInt(m[1], 16);
  return ((n >> 16) * 299 + ((n >> 8) & 0xff) * 587 + (n & 0xff) * 114) / 1000;
}

// ── The meniscus ────────────────────────────────────────────────────────
// One seamless SVG wave tile per colour and phase, cached — the fill's
// leading edge is a water surface: two tiles at different wavelengths and
// drift speeds (pure CSS keyframes), the slower one at 65% so their crests
// interfere. Entering, the solid sits below the curve (crests rise into
// the paper above the fill); exiting, the tile flips — solid above the
// curve, crests hanging down toward the floor like the last drips.
const waveUriCache = new Map<string, string>();

function waveBackground(color: string, v: WaveSpec, flip: boolean): string {
  const key = `${v.tile}:${flip ? 'f' : 'n'}:${color}`;
  let uri = waveUriCache.get(key);
  if (uri == null) {
    const { tile: w, height: h } = v;
    const a = h / 2;
    const path = flip
      ? `M0 ${a} Q ${w / 4} ${h} ${w / 2} ${a} T ${w} ${a} L ${w} 0 L 0 0 Z`
      : `M0 ${a} Q ${w / 4} 0 ${w / 2} ${a} T ${w} ${a} L ${w} ${h} L 0 ${h} Z`;
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<path d="${path}" fill="${color}"/></svg>`;
    uri = `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
    waveUriCache.set(key, uri);
  }
  return uri;
}

// The amplitude box — the wave's scale frame. The engine squashes it to
// the fill's own height every tick (scaleY, anchored at the seam), so
// the meniscus is born flat at first contact and grows its amplitude
// with the fill instead of arriving full-size.
function waveBoxStyle(v: WaveSpec, flip: boolean): ViewStyle {
  const anchor = flip
    ? { bottom: -(v.height - 1), top: 'auto' as const }
    : { top: -(v.height - 1), bottom: 'auto' as const };
  return {
    position: 'absolute',
    left: 0,
    right: 0,
    height: v.height,
    ...anchor,
  } as unknown as ViewStyle;
}

// The drift strip — the full-amplitude wave tile inside its scale frame,
// drifting horizontally on the CSS keyframes; flipped on exit so the
// crests hang down. background* are web-only CSS keys RN's ViewStyle
// doesn't declare (same cast pattern as the boot gradients).
function waveStyle(color: string, v: WaveSpec, flip: boolean): ViewStyle {
  return {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '240%',
    backgroundImage: waveBackground(color, v, flip),
    backgroundRepeat: 'repeat-x',
    backgroundSize: `${v.tile}px 100%`,
  } as unknown as ViewStyle;
}

/**
 * Flattens a translucent surface wash over the page colour — stations
 * whose real fill is an alpha tint (the announcement strip's brandMuted)
 * register the colour they actually read on screen.
 */
export function compositeWash(wash: string, over: string): string {
  const m = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/.exec(wash);
  const h = /^#([0-9a-f]{6})$/i.exec(over.trim());
  if (m == null || h == null) return over;
  const a = m[4] != null ? Math.min(1, Math.max(0, parseFloat(m[4]))) : 1;
  const base = parseInt(h[1], 16);
  const mix = (w: number, o: number) => Math.round(w * a + o * (1 - a));
  const r = mix(parseInt(m[1], 10), (base >> 16) & 0xff);
  const g = mix(parseInt(m[2], 10), (base >> 8) & 0xff);
  const b = mix(parseInt(m[3], 10), base & 0xff);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * The colour a dimmed surface reads: `color` at `alpha` composited over
 * the page — a card stepped back with RN opacity (closed drops) still
 * absorbs as the grey it actually is, not its raw token.
 */
export function dimmedOver(color: string, alpha: number, over: string): string {
  const c = /^#([0-9a-f]{6})$/i.exec(color.trim());
  const o = /^#([0-9a-f]{6})$/i.exec(over.trim());
  if (c == null || o == null) return color;
  const a = Math.min(1, Math.max(0, alpha));
  const cn = parseInt(c[1], 16);
  const on = parseInt(o[1], 16);
  const mix = (x: number, y: number) => Math.round(x * a + y * (1 - a));
  const r = mix((cn >> 16) & 0xff, (on >> 16) & 0xff);
  const g = mix((cn >> 8) & 0xff, (on >> 8) & 0xff);
  const b = mix(cn & 0xff, on & 0xff);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// The chrome clip's wave mask tiles — monochrome alpha (black below or
// above the curve, transparent elsewhere), the SAME curves and drift
// timings as the visible meniscus. TWO specs, one per visible wave tile:
// the meniscus is two counter-drifting curves and the chrome's mask must
// cover their UNION (the real visible crest) — a single-wave mask leaves
// the base copy showing through wherever the second wave crests above
// the first (an opposite-colour square through any opaque chrome). One
// CSS animation drives one mask-position-x, so each wave's mask rides
// its own masked copy of the chrome; their union is exact by
// construction.
const MASK_A = { tile: WAVE_A.tile, height: WAVE_A.height };
const MASK_B = { tile: WAVE_B.tile, height: WAVE_B.height };
// The envelope overshoot covers the TALLEST crest (wave A's).
const MASK_W = MASK_A.tile;
const MASK_H = MASK_A.height;

function maskTile(w: number, h: number, flip: boolean): string {
  const a = h / 2;
  const path = flip
    ? `M0 ${a} Q ${w / 4} ${h} ${w / 2} ${a} T ${w} ${a} L ${w} 0 L 0 0 Z`
    : `M0 ${a} Q ${w / 4} 0 ${w / 2} ${a} T ${w} ${a} L ${w} ${h} L 0 ${h} Z`;
  // s7-exempt: mask alpha — never a rendered colour, only opacity composites.
  return encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="${path}" fill="#000"/></svg>`,
  );
}

const maskTileAEnter = maskTile(MASK_A.tile, MASK_A.height, false);
const maskTileAExit = maskTile(MASK_A.tile, MASK_A.height, true);
const maskTileBEnter = maskTile(MASK_B.tile, MASK_B.height, false);
const maskTileBExit = maskTile(MASK_B.tile, MASK_B.height, true);

function ensureAbsorbCss(): void {
  if (document.getElementById('arqavellum-absorb-css') != null) return;
  const el = document.createElement('style');
  el.id = 'arqavellum-absorb-css';
  el.textContent = [
    `@keyframes arq-absorb-drift-a{from{transform:translateX(0)}to{transform:translateX(-${WAVE_A.tile}px)}}`,
    `@keyframes arq-absorb-drift-b{from{transform:translateX(-${WAVE_B.tile}px)}to{transform:translateX(0)}}`,
    `.${WAVE_A.cls}{animation:arq-absorb-drift-a ${DRIFT_A_MS}ms linear infinite}`,
    `.${WAVE_B.cls}{animation:arq-absorb-drift-b ${DRIFT_B_MS}ms linear infinite;opacity:.65}`,
    // The chrome contrast copy's clip: the fill's own waves as alpha
    // masks (tile + a solid field), each drifting in lockstep with its
    // visible wave. The engine writes mask-size and mask-position-y per
    // tick so each mask's wave squashes with the fill — born flat,
    // growing in. The solid field repeats in x: the drift keyframes
    // animate ONE mask-position-x value, which applies to EVERY layer —
    // a no-repeat field would slide off the clip's right edge with the
    // loop and bare the right-hand chrome to the base copy mid-fill.
    // Tiled, the 100%-wide field is x-phase-neutral.
    `.arq-absorb-mask-enter{-webkit-mask-image:url("data:image/svg+xml,${maskTileAEnter}"),linear-gradient(#000,#000);mask-image:url("data:image/svg+xml,${maskTileAEnter}"),linear-gradient(#000,#000);-webkit-mask-repeat:repeat-x,repeat-x;mask-repeat:repeat-x,repeat-x;animation:arq-absorb-mask-drift ${DRIFT_A_MS}ms linear infinite}`,
    `.arq-absorb-mask-exit{-webkit-mask-image:url("data:image/svg+xml,${maskTileAExit}"),linear-gradient(#000,#000);mask-image:url("data:image/svg+xml,${maskTileAExit}"),linear-gradient(#000,#000);-webkit-mask-repeat:repeat-x,repeat-x;mask-repeat:repeat-x,repeat-x;animation:arq-absorb-mask-drift ${DRIFT_A_MS}ms linear infinite}`,
    // Wave B's mask copy — same shape, its OWN drift (the visible B tile
    // runs 5.2s rightward, so the mask must too).
    `.arq-absorb-mask-b-enter{-webkit-mask-image:url("data:image/svg+xml,${maskTileBEnter}"),linear-gradient(#000,#000);mask-image:url("data:image/svg+xml,${maskTileBEnter}"),linear-gradient(#000,#000);-webkit-mask-repeat:repeat-x,repeat-x;mask-repeat:repeat-x,repeat-x;animation:arq-absorb-mask-drift-b ${DRIFT_B_MS}ms linear infinite}`,
    `.arq-absorb-mask-b-exit{-webkit-mask-image:url("data:image/svg+xml,${maskTileBExit}"),linear-gradient(#000,#000);mask-image:url("data:image/svg+xml,${maskTileBExit}"),linear-gradient(#000,#000);-webkit-mask-repeat:repeat-x,repeat-x;mask-repeat:repeat-x,repeat-x;animation:arq-absorb-mask-drift-b ${DRIFT_B_MS}ms linear infinite}`,
    `@keyframes arq-absorb-mask-drift{from{-webkit-mask-position-x:0;mask-position-x:0}to{-webkit-mask-position-x:-${MASK_W}px;mask-position-x:-${MASK_W}px}}`,
    `@keyframes arq-absorb-mask-drift-b{from{-webkit-mask-position-x:-${MASK_B.tile}px;mask-position-x:-${MASK_B.tile}px}to{-webkit-mask-position-x:0;mask-position-x:0}}`,
    '@media (prefers-reduced-motion:reduce){.arq-absorb-wave-a,.arq-absorb-wave-b,.arq-absorb-mask-enter,.arq-absorb-mask-exit,.arq-absorb-mask-b-enter,.arq-absorb-mask-b-exit{animation:none}}',
  ].join('');
  document.head.appendChild(el);
}

// ── The provider (registry + engine + bar state) ────────────────────────

export function AbsorbProvider({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  const [layers, setLayers] = useState<AbsorbFillLayer[]>([]);
  const [tone, setTone] = useState<AbsorbTone>(EMPTY_TONE);
  const [scrolled, setScrolled] = useState(false);
  const [barHeight, setBarHeight] = useState(0);
  const [clipExit, setClipExit] = useState(false);

  const barEl = useRef<HTMLElement | null>(null);
  const chromeClipA = useRef<HTMLElement | null>(null);
  const chromeClipB = useRef<HTMLElement | null>(null);
  const stationsRef = useRef<Map<string, AbsorbStationEntry> | null>(null);
  if (stationsRef.current == null) stationsRef.current = new Map();
  const stations = stationsRef.current;
  const layerElsRef = useRef<Map<string, HTMLElement> | null>(null);
  if (layerElsRef.current == null) layerElsRef.current = new Map();
  const layerEls = layerElsRef.current;

  const colorsRef = useRef(colors);
  colorsRef.current = colors;
  const bindRef = useRef<(() => void) | null>(null);

  const ping = useCallback(() => {
    bindRef.current?.();
  }, []);

  const attach = useCallback(
    (id: string, color: string, el: unknown) => {
      const node = nodeFrom(el);
      const existing = stations.get(id);
      if (existing != null) {
        existing.el = node;
        existing.color = color;
      } else {
        stations.set(id, { el: node, color, cur: 0, target: 0, exit: false, cardRadius: null, docked: false });
      }
      ping();
    },
    [stations, ping],
  );

  const detach = useCallback(
    (id: string) => {
      const entry = stations.get(id);
      if (entry != null) entry.el = null;
      ping();
    },
    [stations, ping],
  );

  const setStationColor = useCallback(
    (id: string, color: string) => {
      const entry = stations.get(id);
      if (entry != null && entry.color !== color) {
        entry.color = color;
        ping();
      }
    },
    [stations, ping],
  );

  const reportBarHeight = useCallback((h: number) => {
    setBarHeight((prev) => (Math.abs(prev - h) > 0.5 ? h : prev));
  }, []);

  const attachLayerEl = useCallback(
    (id: string, el: unknown) => {
      const node = nodeFrom(el);
      if (node != null) layerEls.set(id, node);
      else layerEls.delete(id);
    },
    [layerEls],
  );

  const attachChromeClip = useCallback((which: 'a' | 'b', el: unknown) => {
    const ref = which === 'a' ? chromeClipA : chromeClipB;
    ref.current = nodeFrom(el);
  }, []);

  // The measurement engine. Binds to the scrolling container (the app
  // scrolls an inner div, not the window — discovered by walking up from
  // any live station), re-measures on scroll/resize/content-resize, and
  // eases every fill height toward its overlap target in one rAF loop.
  useEffect(() => {
    if (!isWeb || !hasWindow()) return;
    if (process.env.NODE_ENV === 'test') return;
    ensureAbsorbCss();

    const reduced = prefersReducedMotionSync();
    let scroller: HTMLElement | Window = window;
    let ro: ResizeObserver | null = null;
    let raf = 0;
    let lastTs = 0;
    let zoneH = 0;
    let engagedFg: string | null = null;
    let engagedBg: string | null = null;
    let scrolledNow = false;
    let dominantId: string | null = null;
    let clipExitNow = false;
    // The mask copies' drifts must run in PHASE with the visible wave
    // strips. CSS animations start at mount, and the strips' mounts
    // (per station) never coincide with the clips' mounts (per
    // engagement) — an unaligned mask is x-shifted off its crest, and
    // the split line stops tracking the wave. Alignment SEEKS each
    // clip's running animation to its strip's live phase (Web
    // Animations currentTime — no restart, no jump), one frame after
    // the dominant flips so the new layer's elements exist, with a
    // bounded retry for late clip mounts.
    let maskLockId: string | null = null;
    const stripPhase = (strip: HTMLElement | null): number | null => {
      if (strip == null || typeof strip.getAnimations !== 'function') return null;
      for (const anim of strip.getAnimations()) {
        if (anim.playState !== 'running') continue;
        const t = Number(anim.currentTime);
        if (Number.isFinite(t)) return t;
      }
      return null;
    };
    const seekClip = (clip: HTMLElement, phase: number): void => {
      if (typeof clip.getAnimations !== 'function') return;
      for (const anim of clip.getAnimations()) {
        if (anim.playState !== 'running') continue;
        anim.currentTime = phase;
        return;
      }
    };
    const alignMasks = (stationId: string) => {
      const layer = layerEls.get(stationId);
      if (layer == null) return;
      const jobs = [
        [chromeClipA.current, WAVE_A.cls, DRIFT_A_MS],
        [chromeClipB.current, WAVE_B.cls, DRIFT_B_MS],
      ] as const;
      for (const [clip, waveCls, period] of jobs) {
        if (clip == null) continue;
        const box = Array.from(layer.children).find(
          (b) =>
            b.firstElementChild instanceof HTMLElement &&
            (b.firstElementChild as HTMLElement).classList.contains(waveCls),
        ) as HTMLElement | undefined;
        const stripEl = box?.firstElementChild;
        const phase =
          stripEl instanceof HTMLElement ? stripPhase(stripEl) : null;
        if (phase != null) seekClip(clip, phase % period);
      }
    };
    const scheduleMaskAlign = (stationId: string, tries = 0) => {
      window.requestAnimationFrame(() => {
        if (dominantId !== stationId) return;
        const ready =
          layerEls.get(stationId) != null &&
          chromeClipA.current != null &&
          chromeClipB.current != null;
        if (ready) alignMasks(stationId);
        else if (tries < 90) scheduleMaskAlign(stationId, tries + 1);
      });
    };

    // The readable companion of a fill: whichever of the palette's two
    // poles carries contrast against it (works in both modes — the
    // poles swap in dark, the math does not).
    const readableFg = (fill: string): string => {
      const c = colorsRef.current;
      const light = yiq(c.background) >= yiq(c.text) ? c.background : c.text;
      const dark = light === c.background ? c.text : c.background;
      return yiq(fill) < 150 ? light : dark;
    };

    const measure = () => {
      const bar = barEl.current;
      if (bar == null) return;
      const zr = bar.getBoundingClientRect();
      if (zr.height < 8) return;
      zoneH = zr.height;

      let dominantTarget = 0;
      const active = new Set<string>();
      for (const [id, s] of stations) {
        if (s.el == null) {
          s.target = 0;
        } else {
          const r = s.el.getBoundingClientRect();
          const oy = Math.min(zr.bottom, r.bottom) - Math.max(zr.top, r.top);
          const ox = Math.min(zr.right, r.right) - Math.max(zr.left, r.left);
          // Horizontal overlap is a gate, not a ratio: stations live in
          // the constrained content column while the bar runs full-bleed
          // (the plate language) — a card must fill the bar completely.
          s.target = oy > 0 && ox > 0 ? Math.min(1, oy / zr.height) : 0;
          // Exiting once the card's bottom edge rides into the zone —
          // the colour now connects UP to the card, so the fill hangs.
          s.exit = r.bottom < zr.bottom - 0.5;
        }
        // A station stays mounted while it has overlap OR its fill is
        // still draining.
        if (s.target > 0.004 || s.cur > 0.004) active.add(id);
        if (s.target > dominantTarget) {
          dominantTarget = s.target;
          dominantId = id;
        }
      }

      setLayers((prev) => {
        const next: AbsorbFillLayer[] = [];
        for (const [id, s] of stations) {
          if (active.has(id)) next.push({ id, color: s.color, exit: s.exit });
        }
        if (prev.length !== next.length) return next;
        for (let i = 0; i < next.length; i += 1) {
          if (
            prev[i].id !== next[i].id ||
            prev[i].color !== next[i].color ||
            prev[i].exit !== next[i].exit
          ) {
            return next;
          }
        }
        return prev;
      });

      // The chrome tone follows the dominant fill with no thresholds —
      // the overlay copy is clipped to the fill's own shape, so partial
      // coverage reads correctly by construction (the ripple splits the
      // letters; covered halves flip, uncovered halves stay ink).
      const dominant = dominantId != null ? stations.get(dominantId) ?? null : null;
      if (dominantId !== maskLockId) {
        maskLockId = dominantId;
        if (dominantId != null) scheduleMaskAlign(dominantId);
      }
      if (dominant != null && dominantTarget > 0.004) {
        const fg = readableFg(dominant.color);
        if (engagedFg !== fg || engagedBg !== dominant.color) {
          engagedFg = fg;
          engagedBg = dominant.color;
          setTone({ fg, bg: dominant.color });
        }
        if (clipExitNow !== dominant.exit) {
          clipExitNow = dominant.exit;
          setClipExit(dominant.exit);
        }
      } else if (engagedFg != null) {
        engagedFg = null;
        engagedBg = null;
        dominantId = null;
        setTone({ fg: null, bg: null });
      }

      const top = scroller instanceof HTMLElement ? scroller.scrollTop : window.scrollY;
      const nextScrolled = top > HAIRLINE_AT;
      if (nextScrolled !== scrolledNow) {
        scrolledNow = nextScrolled;
        setScrolled(nextScrolled);
      }
    };

    const tick = (ts: number) => {
      const dt = lastTs > 0 ? Math.min(64, ts - lastTs) : 16.7;
      lastTs = ts;
      let moving = false;
      const dead: string[] = [];
      for (const [id, s] of stations) {
        // Liquid falls a touch faster than it rises — gravity in the
        // damping constant, nothing more.
        const damp = s.target < s.cur ? DAMP_FALL_MS : DAMP_RISE_MS;
        const k = reduced ? 1 : 1 - Math.exp(-dt / damp);
        const delta = s.target - s.cur;
        if (Math.abs(delta) > 0.0015) {
          s.cur += delta * k;
          moving = true;
        } else {
          s.cur = s.target;
        }
        // The drain's last drops snap home — an exponential tail would
        // linger as a sub-pixel sliver for another half-second.
        if (s.target === 0 && s.cur < 0.02) s.cur = 0;
        const node = layerEls.get(id);
        if (node != null && zoneH > 0) {
          const fillPx = Math.max(0, s.cur * zoneH);
          node.style.height = `${fillPx.toFixed(2)}px`;
          // The meniscus is born flat: every wave box squashes to the
          // fill's own height and grows its amplitude with it, so the
          // ripple creeps up from 0 at the point of contact.
          for (const child of Array.from(node.children)) {
            const box = child as HTMLElement;
            const boxH = box.offsetHeight || 1;
            box.style.transform = `scaleY(${Math.min(1, fillPx / boxH).toFixed(3)})`;
          }
        }
        // Docking corners: the card's colliding edge squares as it
        // submerges (riding the same damped liquid), reading as the card
        // merging into the bar's pool; released, the card's own radius
        // is restored. Written inline on the card element — clearing the
        // inline value falls back to its stylesheet radius.
        const cardEl =
          s.el != null && s.el.firstElementChild instanceof HTMLElement
            ? s.el.firstElementChild
            : null;
        if (cardEl != null) {
          if (s.cardRadius == null) {
            s.cardRadius =
              parseFloat(getComputedStyle(cardEl).borderTopLeftRadius) || 0;
          }
          const submerge = Math.min(1, s.cur * 1.8);
          if (submerge > 0.004) {
            const open = (s.cardRadius * (1 - submerge)).toFixed(2);
            const keep = s.cardRadius.toFixed(2);
            cardEl.style.borderRadius = s.exit
              ? `${keep}px ${keep}px ${open}px ${open}px`
              : `${open}px ${open}px ${keep}px ${keep}px`;
            s.docked = true;
          } else if (s.docked) {
            cardEl.style.borderRadius = '';
            s.docked = false;
          }
        }
        if (s.el == null && s.target === 0 && s.cur < 0.004) dead.push(id);
      }
      if (dead.length > 0) {
        for (const id of dead) stations.delete(id);
      }
      // The chrome's contrast copies are clipped to the visible INK
      // ENVELOPE — the fill plus the wave's overshoot above it (the
      // crest band crosses the letters; without it the base ink text
      // sits on ink wave with no paper copy over it and reads as the
      // wave painting in front of the text) — with each mask's wave
      // squashed to the same amplitude. One copy per wave spec; their
      // union is the true visible crest.
      const dom = dominantId != null ? stations.get(dominantId) : null;
      const clipA = chromeClipA.current;
      const clipB = chromeClipB.current;
      if ((clipA != null || clipB != null) && dom != null && zoneH > 0) {
        const fillPx = Math.max(0, dom.cur * zoneH);
        const envU = fillPx + Math.min(fillPx, MASK_H);
        const clipH = Math.min(zoneH, envU);
        for (const [clip, m] of [
          [clipA, MASK_A],
          [clipB, MASK_B],
        ] as const) {
          if (clip == null) continue;
          const km = Math.max(1, Math.min(m.height, fillPx));
          clip.style.height = `${clipH.toFixed(2)}px`;
          // Each mask band anchors where ITS wave's squashed box sits:
          // the fill's edge, one pixel of seam overlap, minus the
          // spec's own amplitude (the boxes overlap the fill by 1px and
          // the specs squash to different heights). Anchoring both
          // bands at the clip's top floated the shorter wave's mask
          // above its crest — the fill's colour riding the humps over
          // opaque chrome. At deep submersion the band rides past the
          // strip's edge with the visible meniscus, so no phantom wave
          // parks over the letters.
          const tileY = dom.exit ? fillPx - 1 : clipH - fillPx + 1 - km;
          const gradY = dom.exit ? 0 : Math.max(0, tileY + km);
          const gradH = Math.max(1, dom.exit ? Math.max(0, tileY) : clipH - gradY);
          const sizes = `${m.tile}px ${km.toFixed(2)}px,100% ${gradH.toFixed(2)}px`;
          clip.style.setProperty('mask-size', sizes, '');
          clip.style.setProperty('-webkit-mask-size', sizes, '');
          const pos = `${tileY.toFixed(2)}px,${gradY.toFixed(2)}px`;
          clip.style.setProperty('mask-position-y', pos, '');
          clip.style.setProperty('-webkit-mask-position-y', pos, '');
        }
      }
      raf = moving ? window.requestAnimationFrame(tick) : 0;
      if (!moving) {
        lastTs = 0;
        // A drained fill unmounts on the next measure — run it once
        // more when the liquid settles so empty layers never linger.
        measure();
      }
    };

    const kick = () => {
      if (raf === 0) {
        lastTs = 0;
        raf = window.requestAnimationFrame(tick);
      }
    };

    const schedule = () => {
      measure();
      kick();
    };

    const bind = () => {
      scroller.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      ro?.disconnect();
      let found: HTMLElement | null = null;
      for (const s of stations.values()) {
        if (s.el == null) continue;
        let p: HTMLElement | null = s.el.parentElement;
        while (p != null && p !== document.body) {
          const oy = window.getComputedStyle(p).overflowY;
          if (oy === 'auto' || oy === 'scroll') {
            found = p;
            break;
          }
          p = p.parentElement;
        }
        break;
      }
      scroller = found ?? window;
      scroller.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      if (ro != null) {
        if (scroller instanceof HTMLElement) ro.observe(scroller);
        for (const s of stations.values()) {
          if (s.el != null) ro.observe(s.el);
        }
      }
      measure();
      kick();
    };
    bindRef.current = bind;

    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => schedule());
    }

    bind();
    // The home feed staggers in (FadeIn transforms move the stations
    // without resizing them) — a few settle beats re-measure past it.
    const settle = [320, 780, 1400].map((ms) => window.setTimeout(schedule, ms));

    return () => {
      settle.forEach((t) => window.clearTimeout(t));
      if (raf !== 0) window.cancelAnimationFrame(raf);
      scroller.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      ro?.disconnect();
      bindRef.current = null;
    };
  }, [stations, layerEls, barEl]);

  const value = useMemo<AbsorbContextValue>(
    () => ({
      barEl,
      chromeClipEls: { a: chromeClipA, b: chromeClipB },
      stations,
      layerEls,
      layers,
      tone,
      scrolled,
      barHeight,
      clipExit,
      attach,
      detach,
      setStationColor,
      ping,
      reportBarHeight,
      attachLayerEl,
      attachChromeClip,
    }),
    [
      stations,
      layerEls,
      layers,
      tone,
      scrolled,
      barHeight,
      clipExit,
      attach,
      detach,
      setStationColor,
      ping,
      reportBarHeight,
      attachLayerEl,
      attachChromeClip,
    ],
  );

  return <AbsorbContext.Provider value={value}>{children}</AbsorbContext.Provider>;
}

/**
 * Neutralizes the absorb tone for a subtree — the host wraps the BASE
 * chrome copy in it (always ink), while the clipped contrast copy above
 * reads the live tone. Without a provider it renders children as-is.
 */
export function AbsorbChromeNeutral({ children }: { children: React.ReactNode }) {
  const ctx = useContext(AbsorbContext);
  const neutral = useMemo<AbsorbContextValue | null>(
    () => (ctx == null ? null : { ...ctx, tone: EMPTY_TONE }),
    [ctx],
  );
  if (neutral == null) return <>{children}</>;
  return <AbsorbContext.Provider value={neutral}>{children}</AbsorbContext.Provider>;
}

// ── The backdrop strip ──────────────────────────────────────────────────
// Full-bleed, pinned under the masthead (z10): the neutral paper, the
// fill layers, the scrolled hairline. Purely decorative — it never
// takes a pointer, and screen readers skip it.
export function AbsorbTopBar() {
  const absorb = useAbsorb();
  const { colors } = useAppTheme();
  // The page's top strip carries the atmosphere's vignette (an inset
  // shadow from the screen edges) — an opaque bar over it reads as a
  // slightly different shade. The bar clones the vignette at viewport
  // geometry (clipped to the strip by the bar's own overflow) so its
  // neutral rest state is pixel-identical to the page beneath.
  const [vignetteH, setVignetteH] = useState(0);
  useEffect(() => {
    if (!isWeb || !hasWindow()) return;
    if (process.env.NODE_ENV === 'test') return;
    const read = () => setVignetteH(window.innerHeight);
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);

  const setBarRef = useCallback(
    (el: unknown) => {
      absorb.barEl.current = nodeFrom(el);
    },
    [absorb],
  );

  const waveClass = useCallback((cls: string) => {
    return (el: unknown) => {
      nodeFrom(el)?.classList.add(cls);
    };
  }, []);

  return (
    <View
      testID="absorb-bar"
      ref={setBarRef}
      style={[
        styles.bar,
        { backgroundColor: colors.backgroundDeep },
        absorb.barHeight > 0 ? { height: absorb.barHeight } : null,
      ]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {vignetteH > 0 ? (
        <View
          testID="absorb-bar-vignette"
          style={[
            styles.vignetteClone,
            { height: vignetteH, boxShadow: colors.mobilePremium.atmosphereVignette },
          ]}
          pointerEvents="none"
        />
      ) : null}
      {absorb.layers.map((layer) => (
        <View
          key={layer.id}
          ref={(el) => absorb.attachLayerEl(layer.id, el)}
          style={[
            styles.fill,
            { backgroundColor: layer.color },
            layer.exit ? styles.fillExit : null,
          ]}
          pointerEvents="none"
        >
          {([WAVE_B, WAVE_A] as const).map((v) => (
            <View
              key={v.cls}
              style={[
                waveBoxStyle(v, layer.exit),
                { transformOrigin: layer.exit ? 'top' : 'bottom' },
              ]}
              pointerEvents="none"
            >
              <View
                ref={waveClass(v.cls)}
                style={waveStyle(layer.color, v, layer.exit)}
                pointerEvents="none"
              />
            </View>
          ))}
        </View>
      ))}
      {absorb.scrolled ? (
        <View
          style={[styles.hairline, { backgroundColor: colors.cardBorder }]}
          pointerEvents="none"
        />
      ) : null}
    </View>
  );
}

// ── The body-side pieces ────────────────────────────────────────────────

/** The top-of-body spacer holding the first card below the pinned bar. */
export function AbsorbSpacer() {
  const { barHeight } = useAbsorb();
  return <View style={{ height: barHeight }} pointerEvents="none" collapsable={false} />;
}

/**
 * Registers a coloured surface as a station. Wrap the card; the fill
 * adopts `color` as the bar absorbs it. Theme tokens only (S7).
 */
export function AbsorbStation({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  const id = useId();
  const { attach, detach, setStationColor } = useAbsorb();
  const attachRef = useCallback(
    (el: unknown) => attach(id, color, el),
    [attach, id, color],
  );
  useEffect(() => () => detach(id), [detach, id]);
  useEffect(() => {
    setStationColor(id, color);
  }, [setStationColor, id, color]);
  return (
    <View ref={attachRef} testID="absorb-station" style={styles.station} collapsable={false}>
      {children}
    </View>
  );
}

/** Readable chrome colour while a fill owns the row; null at rest. */
export function useAbsorbFg(): string | null {
  return useAbsorb().tone.fg;
}

/** The full bar context — the header host reads height + tone. */
export function useAbsorbBar(): AbsorbContextValue {
  return useAbsorb();
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 0,
  },
  // Exit phase: the fill hangs from the bar's top edge, connected to the
  // card riding out above — its meniscus (and drips) point to the floor.
  fillExit: {
    top: 0,
    bottom: 'auto',
  },
  hairline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
  },
  // Screen-geometry canvas for the atmosphere's vignette — absolute to
  // the bar's top-left corner, which IS the screen's; the bar's overflow
  // clips it to the strip so the inset shadow lands exactly where the
  // page's own vignette would.
  vignetteClone: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    backgroundColor: 'transparent',
  },
  station: {
    width: '100%',
  },
});
