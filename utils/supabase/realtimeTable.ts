// utils/supabase/realtimeTable.ts
// Realtime table seam — hydrate the tail of a table, then stream INSERTs
// from it. The shape consumers keep re-building by hand:
//
//   1. Hydration: read the last `hydrateLimit` rows ordered by the
//      timestamp column (descending), hand them to `onHydrate` oldest-
//      first so a store can append without re-sorting.
//   2. Stream: subscribe to postgres_changes INSERTs on the table and
//      hand each mapped row to `onInsert`. The subscriber's own writes
//      echo back through the channel — dedupe by primary key in the
//      store, not here.
//
// Mapping is consumer-owned (`mapRow`, pure) so domain types never cross
// this module. Errors degrade to `logger.warn` — a failed hydration or
// channel never throws into the caller. No env gating: deciding when a
// realtime surface should run (configured? simulated? disabled?) is a
// consumer decision; this module only knows how to wire the pipe.
//
// Returns the paired stopper (R4a discipline for the channel side).

import { supabase } from './client';
import { logger } from '../logger';

/** A raw database row as PostgREST returns it. */
export type RealtimeRow = Record<string, unknown>;

export interface RealtimeTableConfig<Mapped> {
  /** Table name in the public schema. */
  table: string;
  /** Map a raw row to the consumer's shape. Pure — no side effects. */
  mapRow: (row: RealtimeRow) => Mapped;
  /** The hydrated tail, oldest-first. Called once, when the read lands. */
  onHydrate: (rows: Mapped[]) => void;
  /** A realtime INSERT, mapped. May echo rows this client wrote itself. */
  onInsert?: (row: Mapped) => void;
  /** How many tail rows hydration reads. Default 100; 0 skips hydration. */
  hydrateLimit?: number;
  /** Column the hydration tail orders by, descending. Default 'created_at'. */
  hydrateOrderColumn?: string;
  /** Channel name — keep unique per subscription. Default `realtime-<table>`. */
  channelName?: string;
}

/**
 * Start a realtime table subscription: one tail read + one INSERT stream.
 * Returns the stopper; calling it more than once is a no-op.
 */
export function startRealtimeTable<Mapped>(config: RealtimeTableConfig<Mapped>): () => void {
  const {
    table,
    mapRow,
    onHydrate,
    onInsert,
    hydrateLimit = 100,
    hydrateOrderColumn = 'created_at',
    channelName = `realtime-${table}`,
  } = config;

  if (hydrateLimit > 0) {
    void (async () => {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order(hydrateOrderColumn, { ascending: false })
        .limit(hydrateLimit);
      if (error != null) {
        logger.warn('data', `hydration of ${table} failed:`, error.message);
        return;
      }
      // Fetched newest-first for the tail read; delivered oldest-first.
      const rows = ((data ?? []) as RealtimeRow[]).slice().reverse().map(mapRow);
      onHydrate(rows);
    })();
  }

  let channel: ReturnType<typeof supabase.channel> | null = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table },
      (payload: { new: RealtimeRow }) => {
        onInsert?.(mapRow(payload.new));
      },
    )
    .subscribe((status: string) => {
      if (status === 'CHANNEL_ERROR') {
        logger.warn('data', `channel ${channelName} error`);
      }
    });

  let stopped = false;
  return () => {
    if (stopped || channel == null) return;
    stopped = true;
    supabase.removeChannel(channel);
    channel = null;
  };
}
