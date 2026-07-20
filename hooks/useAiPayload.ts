// hooks/useAiPayload.ts
// armandotfit consumer hook that combines the shell-level buildAiPayload
// formatter with this consumer's route metadata registry. Screens import
// this and pass an optional visibleContent/params override; everything
// else (appName, route, title, contextLabel) is auto-derived.
//
// Stays in armandotfit (not ported to arqavellum): knows the consumer
// app name and the armandotfit route metadata map. The shell ships the
// pure formatter + the empty registry scaffolding; this hook is the
// consumer-side glue.

import { useMemo } from 'react';
import { usePathname, useLocalSearchParams } from 'expo-router';
import { buildAiPayload, type AiPayloadParamValue } from '../utils';
import { getAiRouteMetadata } from '../navigation/routeMetadata';

export interface UseAiPayloadOptions {
  /** Optional pre-formatted screen summary. */
  visibleContent?: string;
  /** Optional context override (defaults to route metadata's contextLabel). */
  contextLabel?: string;
  /** Optional title override (defaults to route metadata's title). */
  title?: string;
}

export function useAiPayload(options: UseAiPayloadOptions = {}): string {
  const pathname = usePathname();
  const searchParams = useLocalSearchParams<Record<string, string | string[]>>();

  return useMemo(() => {
    const meta = getAiRouteMetadata(pathname);
    const params: Record<string, AiPayloadParamValue> = {};
    for (const [k, v] of Object.entries(searchParams)) {
      if (typeof v === 'string') {
        params[k] = v;
      } else if (Array.isArray(v)) {
        params[k] = v.join(',');
      }
    }
    const hasParams = Object.keys(params).length > 0;
    return buildAiPayload({
      appName: 'armandotfit',
      route: pathname,
      title: options.title ?? meta.title,
      contextLabel: options.contextLabel ?? meta.contextLabel,
      params: hasParams ? params : undefined,
      visibleContent: options.visibleContent,
    });
  }, [pathname, searchParams, options.title, options.contextLabel, options.visibleContent]);
}

export default useAiPayload;
