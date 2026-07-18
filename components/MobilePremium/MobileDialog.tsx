// components/MobilePremium/MobileDialog.tsx
// Canonical mobile dialog primitive for the MobilePremium kit.
//
// Composition: a react-native `Modal` (transparent + fade) hosting an
// overlay (backdrop + centered card). Using RN Modal — not an absolute-
// positioned View, not a Tamagui Dialog.Portal — is deliberate: Modal
// renders in an OS-level portal that breaks out of the host screen's
// ScrollView / transform / overflow:hidden ancestry. An absolute-fill
// implementation centers the card on the *document* (not the visible
// viewport) when the host is a long ScrollView, so a dialog opened from
// a row deep in /settings could render partially or fully offscreen.
// Modal guarantees viewport-centered placement everywhere.
// c2-exempt: this is the canonical kit dialog — RN Modal is the point.
//
// The card is a MobileSurface (the kit's material treatment) with a
// compact MobileHeader (44px) at the top, a padded body for content, and
// a padded action footer holding the primary button (and an opt-in
// secondary button for genuine secondary actions, not a redundant Cancel —
// the X / backdrop / Escape close affordances cover dismiss).
//
// Motion: FadeIn (300ms, y=12) on mount — snappier than the screen-level
// 480ms. Reduced motion collapses the fade to 200ms fade-only.
//
// Web niceties: Escape-to-close (web only, gated by closeOnBackdropTap),
// backdrop tap closes by default, X button in the header closes.
//
// API compatibility: accepts both `open`/`onOpenChange` (qep-tracker API)
// and `visible`/`onClose` (vellum legacy API).

import React, { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { isWeb } from '../../utils';
import { FadeIn } from '../premium/shared';
import { useAppTheme } from '../../context';
import { MobileSurface } from './MobileSurface';
import { MobileHeader } from './MobileHeader';
import { MobilePrimaryButton } from './MobilePrimaryButton';

export interface MobileDialogProps {
  /** Whether the dialog is visible. qep-tracker API. */
  open?: boolean;
  /** Open-change handler (qep-tracker API). Called with `false` on any close gesture. */
  onOpenChange?: (open: boolean) => void;
  /** Whether the dialog is visible. Vellum legacy alias of `open`. */
  visible?: boolean;
  /** Close handler. Vellum legacy alias — wraps onOpenChange(false). */
  onClose?: () => void;
  /** Compact header title. */
  title?: string;
  /** Accent color (default theme brand). Tints the header dot and the primary button. */
  accentColor?: string;
  /** Dialog body. */
  children: React.ReactNode;
  /** Primary action label. Omit to render a dismiss-only dialog. */
  primaryLabel?: string;
  /** Legacy alias of `primaryLabel`. */
  primaryActionLabel?: string;
  /** Primary action handler. Omit for a dismiss-only dialog. */
  onPrimary?: () => void;
  /** Legacy alias of `onPrimary`. */
  onPrimaryAction?: () => void;
  /** Loading state for the primary action. */
  primaryLoading?: boolean;
  /** Disabled state for the primary action. */
  primaryDisabled?: boolean;
  /** Destructive variant — renders the primary action in error color. */
  destructive?: boolean;
  /** Secondary (Cancel) button label. Default 'Cancel'. */
  secondaryLabel?: string;
  /** Secondary action handler. Omit to default to close. */
  onSecondary?: () => void;
  /** Show the secondary button. Opt-in — default `false`. */
  showSecondary?: boolean;
  /** Close when the backdrop is tapped. Default `true`. */
  closeOnBackdropTap?: boolean;
  /** Show the X dismiss button in the header. Default `true`. */
  showCloseButton?: boolean;
  /** Test ID. */
  testID?: string;
}

/**
 * Canonical mobile dialog. Renders inside a react-native `Modal` portal
 * so it escapes any host ScrollView / transform / clipping context and
 * always centers on the visible viewport.
 *
 * Touch routing: the backdrop Pressable sits below the card layer. The
 * card layer uses `pointerEvents='box-none'` so taps on the empty area
 * around the card pass through to the backdrop (closing the dialog),
 * while taps on the card itself are captured by the card's children
 * (no accidental close).
 */
export function MobileDialog({
  open,
  onOpenChange,
  visible,
  onClose,
  title,
  accentColor,
  children,
  primaryLabel,
  primaryActionLabel,
  onPrimary,
  onPrimaryAction,
  primaryLoading = false,
  primaryDisabled = false,
  destructive = false,
  secondaryLabel = 'Cancel',
  onSecondary,
  showSecondary,
  closeOnBackdropTap = true,
  showCloseButton = true,
  testID,
}: MobileDialogProps) {
  const { colors } = useAppTheme();
  const accent = destructive ? colors.status.error : (accentColor ?? colors.brand);

  // Normalize the two API shapes.
  const resolvedOpen = open ?? visible ?? false;
  const handleClose = () => {
    if (onOpenChange) onOpenChange(false);
    else onClose?.();
  };

  const resolvedPrimaryLabel = primaryLabel ?? primaryActionLabel;
  const resolvedOnPrimary = onPrimary ?? onPrimaryAction;

  // R4b: Escape-to-close on web — paired add/removeEventListener with cleanup.
  useEffect(() => {
    if (!isWeb || !resolvedOpen || !closeOnBackdropTap) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWeb, resolvedOpen, closeOnBackdropTap]);

  if (!resolvedOpen) return null;

  const shouldShowSecondary = showSecondary ?? false;
  const hasFooter = !!resolvedOnPrimary || shouldShowSecondary;
  const headerTitle = title ?? '';

  return (
    <Modal
      testID={testID}
      visible={resolvedOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop layer. */}
        {closeOnBackdropTap ? (
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
          />
        ) : (
          <View style={StyleSheet.absoluteFill} />
        )}

        {/* Card layer — pointerEvents='box-none' so taps on empty area
            pass through to the backdrop Pressable below, but taps on the
            card itself are captured by the card (no close). */}
        <View pointerEvents="box-none" style={styles.cardLayer}>
          <FadeIn duration={300} y={12} style={styles.cardWrapper}>
            <MobileSurface accentColor={accent} padding={0}>
              {headerTitle ? (
                <MobileHeader
                  title={headerTitle}
                  accentColor={accent}
                  onDismiss={showCloseButton ? handleClose : undefined}
                />
              ) : null}
              <View style={styles.body}>{children}</View>
              {hasFooter ? (
                <View style={styles.footer}>
                  {resolvedOnPrimary ? (
                    <MobilePrimaryButton
                      onPress={resolvedOnPrimary}
                      loading={primaryLoading}
                      disabled={primaryDisabled}
                      accentColor={destructive ? colors.status.error : accent}
                    >
                      {resolvedPrimaryLabel ?? 'OK'}
                    </MobilePrimaryButton>
                  ) : null}
                  {shouldShowSecondary ? (
                    <MobilePrimaryButton
                      variant="secondary"
                      onPress={onSecondary ?? handleClose}
                      accentColor={accent}
                    >
                      {secondaryLabel}
                    </MobilePrimaryButton>
                  ) : null}
                </View>
              ) : null}
            </MobileSurface>
          </FadeIn>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  cardLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  cardWrapper: {
    width: '90%',
    maxWidth: 380,
  },
  body: {
    padding: 20,
  },
  footer: {
    padding: 20,
    paddingTop: 0,
    gap: 8,
  },
});

export default MobileDialog;
