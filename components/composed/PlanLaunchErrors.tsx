// components/composed/PlanLaunchErrors.tsx
// Phase 4 resilience follow-up: two presentational pieces that surface
// plan-launch query failures as deliberate UI states instead of silent
// static fallback (split-selection) or indefinite spinner (workout-detail).
//
// Both are pure composition of existing MobilePremium primitives — no new
// error system. PlanLookupErrorAlert pairs a warning MobileAlert with a
// ghost Retry button for the inline split-selection case. HydrationErrorState
// wraps EmptyState (title + message) with paired Retry (primary) + Discard
// (ghost) actions for the plan-backed workout-detail case where the user
// must explicitly drop back to split-selection (no in-screen static
// substitution).
//
// The parents own the wire-up: onRetry is the React Query refetch path,
// onDiscard is the existing resetSession + safeGoBack path.

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MobileAlert, EmptyState, MobilePrimaryButton } from '../MobilePremium';

export interface PlanLookupErrorAlertProps {
  /**
   * Retry handler. The parent passes the React Query refetch so retry
   * uses the normal query path (no bespoke retry loop).
   */
  onRetry: () => void;
  /** Test ID for the alert root. */
  testID?: string;
}

/**
 * Inline warning shown at the launch-decision site when the active-plan
 * lookup failed. Distinguished from "no saved plan" by tone + copy:
 * the alert never claims the user has no plan, only that the lookup
 * could not complete.
 */
export function PlanLookupErrorAlert({ onRetry, testID }: PlanLookupErrorAlertProps) {
  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      accessibilityLabel="Couldn't check your saved plan"
      style={styles.alertWrap}
    >
      <MobileAlert
        variant="warning"
        title="Couldn't check your saved plan"
        message="We couldn't reach your plan. Your saved plan may still exist — retry, or start a static workout below."
      />
      <MobilePrimaryButton
        variant="ghost"
        onPress={onRetry}
        testID="plan-lookup-error-retry"
      >
        Retry plan check
      </MobilePrimaryButton>
    </View>
  );
}

export interface HydrationErrorStateProps {
  /**
   * Retry handler. The parent passes the plan-hydration query's refetch
   * so retry uses the normal React Query path.
   */
  onRetry: () => void;
  /**
   * Discard handler. The parent passes the existing discard path
   * (resetSession + safeGoBack) so the draft clears and the user
   * returns to split-selection to make the explicit static-vs-plan
   * decision there.
   */
  onDiscard: () => void;
  /** Test ID for the error-state root. */
  testID?: string;
}

/**
 * Plan-hydration error state. Renders an accessible EmptyState explaining
 * the saved plan could not be loaded (and that no workout has been saved
 * or changed), with paired Retry + Discard actions. Renders INSTEAD of
 * the loading spinner — distinguishes query-error from query-pending.
 *
 * EmptyState only carries one action slot, so Discard renders as a
 * sibling ghost button beneath the EmptyState. Both buttons belong to
 * the same accessibility group so screen readers announce them together.
 */
export function HydrationErrorState({
  onRetry,
  onDiscard,
  testID,
}: HydrationErrorStateProps) {
  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      accessibilityLabel="Couldn't load your saved plan"
    >
      <EmptyState
        title="Couldn't load your saved plan"
        message="Your workout hasn't been saved or changed. Retry to try again, or discard to return to split selection."
        action={{ label: 'Retry', onPress: onRetry, variant: 'primary' }}
      />
      <View style={styles.discardWrap}>
        <MobilePrimaryButton
          variant="ghost"
          onPress={onDiscard}
          testID="plan-hydration-error-discard"
        >
          Discard
        </MobilePrimaryButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  alertWrap: {
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  discardWrap: {
    marginTop: 4,
    marginBottom: 16,
  },
});
