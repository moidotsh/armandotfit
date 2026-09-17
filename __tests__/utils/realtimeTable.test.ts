// __tests__/utils/realtimeTable.test.ts
//
// Pins the realtime table seam's contract:
//   - hydration reads the tail newest-first and delivers oldest-first
//   - hydration failure degrades to a warning (onHydrate never fires)
//   - hydrateLimit 0 skips the read entirely
//   - INSERT payloads map through mapRow into onInsert
//   - the stopper removes the channel exactly once; re-stopping is a no-op
//
// The supabase client is the setup-file vi.mock singleton; each test
// replaces the pieces it drives on that instance.

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '../../utils/supabase/client';
import { startRealtimeTable, type RealtimeRow } from '../../utils/supabase/realtimeTable';

type InsertCallback = (payload: { new: RealtimeRow }) => void;

interface HydrationResult {
  data: RealtimeRow[] | null;
  error: { message: string } | null;
}

function stubHydration(result: HydrationResult): void {
  (supabase as unknown as Record<string, unknown>).from = vi.fn(() => ({
    select: () => ({
      order: () => ({
        limit: () => Promise.resolve(result),
      }),
    }),
  }));
}

function stubChannel(): { inserts: InsertCallback[]; channel: unknown } {
  const inserts: InsertCallback[] = [];
  const channel = {
    on: (_type: string, _filter: unknown, cb: InsertCallback) => {
      inserts.push(cb);
      return channel;
    },
    // The real SDK chains: subscribe() returns the channel itself.
    subscribe: vi.fn(() => channel),
  };
  (supabase as unknown as Record<string, unknown>).channel = vi.fn(() => channel);
  (supabase as unknown as Record<string, unknown>).removeChannel = vi.fn();
  return { inserts, channel };
}

/** Flush the seam's fire-and-forget hydration promise. */
async function flush(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

const mapRow = (row: RealtimeRow) => ({ id: String(row.id), body: String(row.body) });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('startRealtimeTable — hydration', () => {
  it('delivers the tail oldest-first through mapRow', async () => {
    stubHydration({
      data: [
        { id: 'c', body: 'third' },
        { id: 'b', body: 'second' },
        { id: 'a', body: 'first' },
      ],
      error: null,
    });
    stubChannel();
    const onHydrate = vi.fn();

    startRealtimeTable({ table: 'events', mapRow, onHydrate });
    await flush();

    expect(onHydrate).toHaveBeenCalledTimes(1);
    expect(onHydrate).toHaveBeenCalledWith([
      { id: 'a', body: 'first' },
      { id: 'b', body: 'second' },
      { id: 'c', body: 'third' },
    ]);
  });

  it('degrades to a warning on error — onHydrate never fires', async () => {
    stubHydration({ data: null, error: { message: 'Invalid URL' } });
    stubChannel();
    const onHydrate = vi.fn();

    startRealtimeTable({ table: 'events', mapRow, onHydrate });
    await flush();

    expect(onHydrate).not.toHaveBeenCalled();
  });

  it('skips the read entirely when hydrateLimit is 0', async () => {
    const from = vi.fn();
    (supabase as unknown as Record<string, unknown>).from = from;
    stubChannel();
    const onHydrate = vi.fn();

    startRealtimeTable({ table: 'events', mapRow, onHydrate, hydrateLimit: 0 });
    await flush();

    expect(from).not.toHaveBeenCalled();
    expect(onHydrate).not.toHaveBeenCalled();
  });
});

describe('startRealtimeTable — INSERT stream', () => {
  it('maps INSERT payloads into onInsert', () => {
    stubHydration({ data: [], error: null });
    const { inserts } = stubChannel();
    const onInsert = vi.fn();

    startRealtimeTable({ table: 'events', mapRow, onHydrate: vi.fn(), onInsert });
    expect(inserts).toHaveLength(1);
    inserts[0]({ new: { id: 'z', body: 'live row' } });

    expect(onInsert).toHaveBeenCalledWith({ id: 'z', body: 'live row' });
  });
});

describe('startRealtimeTable — the stopper', () => {
  it('removes the channel exactly once; re-stopping is a no-op', () => {
    stubHydration({ data: [], error: null });
    const { channel } = stubChannel();
    const removeChannel = (supabase as unknown as { removeChannel: ReturnType<typeof vi.fn> })
      .removeChannel;

    const stop = startRealtimeTable({ table: 'events', mapRow, onHydrate: vi.fn() });
    stop();
    stop();

    expect(removeChannel).toHaveBeenCalledTimes(1);
    expect(removeChannel).toHaveBeenCalledWith(channel);
  });
});
