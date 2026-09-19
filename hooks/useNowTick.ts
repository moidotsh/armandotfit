// hooks/useNowTick.ts
//
// A re-ticking "now": Date.now() refreshed on an interval, for the
// surfaces that count a live duration (the Floor's clock, the
// ticker's elapsed figure). One hook instead of one paired interval
// per surface — R4a's cleanup is built in here, once.

import { useEffect, useState } from 'react';

export function useNowTick(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
