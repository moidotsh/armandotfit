// hooks/useRestClock.ts
//
// THE REST INSTRUMENT's read side (docs/architecture/gauge-thesis.md
// §7): derives the countdown from the store's endsAt against a
// re-ticking now. `remainingSec` floors to whole seconds (mono
// figures never show sub-second jitter); `settled` is the derived
// rest-over state (the readout persists, muted, until the next log
// or a dismiss). The clock itself NEVER animates — time-driven
// figures render static (thesis §6, F2's law).

import { useMemo } from 'react';
import { useRestStore } from '../stores';
import { useNowTick } from './useNowTick';

export function useRestClock() {
  const now = useNowTick();
  const endsAt = useRestStore((s) => s.endsAt);
  const startRest = useRestStore((s) => s.startRest);
  const adjustRest = useRestStore((s) => s.adjustRest);
  const dismissRest = useRestStore((s) => s.dismissRest);

  const active = endsAt != null;
  const remainingSec = useMemo(() => {
    if (endsAt == null) return 0;
    return Math.max(0, Math.floor((endsAt - now) / 1000));
  }, [endsAt, now]);
  const settled = active && remainingSec <= 0;

  /** The mono readout: m:ss — 1:30, 0:45, 0:00. */
  const readout = useMemo(() => {
    const m = Math.floor(remainingSec / 60);
    const s = remainingSec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }, [remainingSec]);

  return { active, remainingSec, settled, readout, startRest, adjustRest, dismissRest };
}
