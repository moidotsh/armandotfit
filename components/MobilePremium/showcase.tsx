// components/MobilePremium/showcase.tsx
// The design-system showcase. Renders every MobilePremium primitive, plus
// all 7 atmosphere palettes side-by-side, plus demos of the cross-cutting
// Tier 1 + Tier 2 surface (Toast, animation hooks, theme switching). This
// is the most important screen in vellum — it's how a consumer sees what
// they're starting from. Visit /dev/premium to see it.
//
// The showcase IS the visual source of truth. If a primitive isn't here,
// it doesn't exist as far as consumers can tell.
//
// The theme is read via `useAppTheme()` — the showcase reacts live to
// light/dark/system preferences. Use the Theme selector at the top to
// flip the whole surface.

import React, { useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sun, Moon, Monitor, Mail, Lock, Eye, EyeOff, Settings, Bell, Info, ChevronRight, Home, Dumbbell, TrendingUp, Menu } from '@tamagui/lucide-icons-2';
import { theme } from '../../constants';
import { useAppTheme, useToast, type ColorSchemePreference } from '../../context';
import {
  useFadeIn,
  useScaleIn,
  usePopIn,
  useAnimatedCounter,
  useShake,
  useTranslateY,
  useContainerVariant,
} from '../../hooks';
// Direct imports from each primitive file (not the barrel) to avoid
// the circular dependency: ./index re-exports `showcase` from this
// file, so importing primitives through the barrel pulls this module
// back in transitively. Audit S5 catches the barrel cycle.
import { MobileAtmosphere } from './MobileAtmosphere';
import { MobileSurface } from './MobileSurface';
import { MobileHeader } from './MobileHeader';
import { MobileHomeHeader } from './MobileHomeHeader';
import { MobileActionFooter } from './MobileActionFooter';
import { MobilePrimaryButton } from './MobilePrimaryButton';
import { MobileInput } from './MobileInput';
import { MobileAlert } from './MobileAlert';
import { MobileSettingsRow } from './MobileSettingsRow';
import { MobileSectionEyebrow } from './MobileSectionEyebrow';
import { MobileStepper } from './MobileStepper';
import { MobileCheckboxItem } from './MobileCheckboxItem';
import { MobileSelectionList } from './MobileSelectionList';
import { MobileStepRail } from './MobileStepRail';
import { MobileDialog } from './MobileDialog';
import { MobileSelect } from './MobileSelect';
import { MobileNavDrawer } from './MobileNavDrawer';
import type { MobileNavDrawerItem } from './MobileNavDrawer';
import { SkeletonBlock } from './SkeletonBlock';
import { PALETTES, type AtmosphereSurface } from '../premium/shared';

const SURFACES: AtmosphereSurface[] = [
  'auth',
  'setup',
  'training',
  'goal',
  'instructions',
  'privacy',
  'analytics',
];

const PREFERENCE_OPTIONS: ReadonlyArray<{
  value: ColorSchemePreference;
  label: string;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}> = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

function ThemeSelector() {
  const { colors, preference, setPreference } = useAppTheme();
  return (
    <View style={styles.themeRow}>
      {PREFERENCE_OPTIONS.map(({ value, label, Icon }) => {
        const active = preference === value;
        return (
          <Pressable
            key={value}
            onPress={() => setPreference(value)}
            style={[
              styles.themeChip,
              {
                backgroundColor: active ? colors.brand : colors.card,
                borderColor: active ? colors.brand : colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Theme: ${label}`}
          >
            <Icon size={14} color={active ? colors.textOnBrand : colors.textSecondary} />
            <Text
              style={[
                styles.themeChipLabel,
                {
                  color: active ? colors.textOnBrand : colors.textSecondary,
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ToastDemo() {
  const { colors } = useAppTheme();
  const { showToast } = useToast();
  const toastButtons: ReadonlyArray<{ type: 'success' | 'warning' | 'error' | 'info'; label: string }> = [
    { type: 'success', label: 'Success' },
    { type: 'warning', label: 'Warning' },
    { type: 'error', label: 'Error' },
    { type: 'info', label: 'Info' },
  ];
  return (
    <MobileSurface>
      <View style={styles.toastRow}>
        {toastButtons.map(({ type, label }) => (
          <Pressable
            key={type}
            onPress={() => showToast(type, `${label} toast — auto-dismisses in 4s.`)}
            style={[
              styles.toastChip,
              {
                backgroundColor: colors.buttonBackground,
                borderColor: colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Show ${label} toast`}
          >
            <Text style={[styles.toastChipLabel, { color: colors.text }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </MobileSurface>
  );
}

function AnimationDemo() {
  const { colors } = useAppTheme();
  const fadeIn = useFadeIn({ animateOnMount: false, duration: 600 });
  const scaleIn = useScaleIn({ animateOnMount: false, duration: 600, useSpring: true });
  const popIn = usePopIn({ animateOnMount: false });
  const shake = useShake({ intensity: 8, cycles: 3 });
  const translateY = useTranslateY({ animateOnMount: false, initialValue: 24, duration: 500 });

  const [counterTarget, setCounterTarget] = useState('0');
  const counter = useAnimatedCounter(counterTarget);

  const replay = () => {
    fadeIn.reset();
    scaleIn.reset();
    popIn.reset();
    translateY.reset();
    // Defer one frame so the reset lands before the animation restarts.
    setTimeout(() => {
      fadeIn.fadeIn();
      scaleIn.scaleIn();
      popIn.popIn();
      translateY.animate();
    }, 16);
  };

  const runCounter = () => {
    const next = Math.floor(Math.random() * 1000);
    counter.startCount(
      counterTarget,
      next.toString(),
      (n) => Math.round(n).toString(),
      () => setCounterTarget(next.toString()),
      900,
    );
  };

  return (
    <View>
      <MobileSurface>
        <View style={styles.animGrid}>
          <Animated.View style={[styles.animCard, { backgroundColor: colors.buttonBackground }, fadeIn.style]}>
            <Text style={[styles.animLabel, { color: colors.textSecondary }]}>useFadeIn</Text>
            <Text style={[styles.animValue, { color: colors.text }]}>opacity → 1</Text>
          </Animated.View>
          <Animated.View style={[styles.animCard, { backgroundColor: colors.buttonBackground }, scaleIn.style]}>
            <Text style={[styles.animLabel, { color: colors.textSecondary }]}>useScaleIn</Text>
            <Text style={[styles.animValue, { color: colors.text }]}>spring → 1</Text>
          </Animated.View>
          <Animated.View style={[styles.animCard, { backgroundColor: colors.buttonBackground }, popIn.style]}>
            <Text style={[styles.animLabel, { color: colors.textSecondary }]}>usePopIn</Text>
            <Text style={[styles.animValue, { color: colors.text }]}>overshoot</Text>
          </Animated.View>
          <Animated.View
            style={[styles.animCard, { backgroundColor: colors.buttonBackground }, translateY.style]}
          >
            <Text style={[styles.animLabel, { color: colors.textSecondary }]}>useTranslateY</Text>
            <Text style={[styles.animValue, { color: colors.text }]}>slide ↑</Text>
          </Animated.View>
        </View>
      </MobileSurface>
      <View style={styles.spacer} />
      <MobilePrimaryButton onPress={replay} variant="secondary">
        Replay animations
      </MobilePrimaryButton>
      <View style={styles.spacer} />
      <MobilePrimaryButton onPress={shake.shake} variant="secondary">
        Shake the card below
      </MobilePrimaryButton>
      <View style={styles.spacer} />
      <MobileSurface>
        <Animated.View style={[styles.shakeCard, { backgroundColor: colors.buttonBackground }, shake.style]}>
          <Text style={[styles.animLabel, { color: colors.textSecondary }]}>useShake</Text>
          <Text style={[styles.animValue, { color: colors.text }]}>imperative — call shake() from any handler</Text>
        </Animated.View>
      </MobileSurface>
      <View style={styles.spacer} />
      <Text style={[styles.animLabel, { color: colors.textSecondary, marginBottom: 8 }]}>
        useAnimatedCounter
      </Text>
      <MobileSurface>
        <View style={styles.counterRow}>
          <Text style={[styles.counterValue, { color: colors.brand }]}>
            {counter.displayed}
          </Text>
          <MobilePrimaryButton
            onPress={runCounter}
            variant="secondary"
            style={styles.counterButton}
          >
            Count
          </MobilePrimaryButton>
        </View>
      </MobileSurface>
    </View>
  );
}

/**
 * SkeletonBlock + useShimmer demo. Three variants — a full-width bar, a
 * short bar, and a circular avatar placeholder — plus a stacked avatar+
 * two-line composition. The shimmer pulse is the live useShimmer output;
 * under `prefers-reduced-motion: reduce` the blocks render as flat
 * `colors.cardAlt` rectangles with no animation.
 */
function SkeletonDemo() {
  const { colors } = useAppTheme();
  return (
    <View>
      <MobileSurface>
        <SkeletonBlock height={16} />
        <View style={{ height: 12 }} />
        <SkeletonBlock width="60%" height={16} />
      </MobileSurface>
      <View style={styles.spacer} />
      <MobileSurface>
        <View style={styles.skeletonAvatarRow}>
          <SkeletonBlock width={48} height={48} borderRadius={24} />
          <View style={styles.skeletonAvatarMeta}>
            <SkeletonBlock width="80%" height={14} />
            <View style={{ height: 8 }} />
            <SkeletonBlock width="50%" height={12} />
          </View>
        </View>
      </MobileSurface>
      <Text style={[styles.animLabel, { color: colors.textSecondary, marginTop: 12 }]}>
        useShimmer pulses 1.0 → 0.5 → 1.0 over 1200ms via Animated.loop;
        collapses to a flat placeholder under prefers-reduced-motion: reduce.
      </Text>
    </View>
  );
}

/**
 * useContainerVariant demo: three sample containers at different aspect
 * ratios. Each reports its detected variant ('compact' | 'medium' | 'full').
 */
function ContainerVariantDemo() {
  const { colors } = useAppTheme();
  const refA = useRef(null);
  const refB = useRef(null);
  const refC = useRef(null);
  const a = useContainerVariant(refA, 'default');
  const b = useContainerVariant(refB, 'default');
  const c = useContainerVariant(refC, 'default');

  const samples: Array<{
    label: string;
    ref: React.RefObject<unknown>;
    style: ViewStyle;
    reading: { variant: string; fixedHeight: number; width: number; height: number };
  }> = [
    {
      label: 'wide & short → compact',
      ref: refA,
      style: { width: '100%', height: 28 },
      reading: a,
    },
    {
      label: 'balanced → medium',
      ref: refB,
      style: { width: '66%', height: 56 },
      reading: b,
    },
    {
      label: 'tall & narrow → full',
      ref: refC,
      style: { width: '40%', height: 110 },
      reading: c,
    },
  ];

  return (
    <View>
      <MobileSurface>
        {samples.map((s) => (
          <View key={s.label} style={styles.variantRow}>
            <View
              ref={s.ref as React.RefObject<View>}
              style={[styles.variantProbe, s.style, { backgroundColor: colors.brandMuted }]}
            />
            <View style={styles.variantMeta}>
              <Text style={[styles.bodyText, { color: colors.text }]}>{s.label}</Text>
              <Text style={[styles.animLabel, { color: colors.textSecondary, marginTop: 4 }]}>
                variant: {s.reading.variant} · fixedHeight: {s.reading.fixedHeight}px · measured:{' '}
                {s.reading.width.toFixed(0)}×{s.reading.height.toFixed(0)}
              </Text>
            </View>
          </View>
        ))}
      </MobileSurface>
    </View>
  );
}

export function Showcase() {
  const { colors } = useAppTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [stepperValue, setStepperValue] = useState(5);
  const [checked, setChecked] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>('option-a');
  const [multiSelectedIds, setMultiSelectedIds] = useState<string[]>(['feature-1']);
  const [inputValue, setInputValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectValue, setSelectValue] = useState('monthly');

  const drawerItems: MobileNavDrawerItem[] = [
    {
      id: '/',
      label: 'Home',
      icon: <Home size={18} color={colors.text} />,
      onPress: () => {},
    },
    {
      id: '/exercises',
      label: 'Exercises',
      icon: <Dumbbell size={18} color={colors.text} />,
      onPress: () => {},
    },
    {
      id: '/progress',
      label: 'Progress',
      icon: <TrendingUp size={18} color={colors.text} />,
      badge: 3,
      onPress: () => {},
    },
    {
      id: '/settings',
      label: 'Settings',
      icon: <Settings size={18} color={colors.text} />,
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView
      style={[styles.shell, { backgroundColor: colors.backgroundDeep }]}
      edges={['top', 'bottom']}
    >
      <MobileAtmosphere surface="analytics" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Nav-mode header demo (qep-tracker compact 44px pattern). */}
        <MobileHeader
          title="Showcase"
          accentColor={colors.brand}
          onBack={() => {}}
          onDismiss={() => {}}
        />

        {/* Page-mode header demo (legacy vellum pattern, preserved). */}
        <View style={styles.pageHeaderDemo}>
          <MobileSectionEyebrow flush={false}>Design System</MobileSectionEyebrow>
          <Text style={[theme.typography.mobileTitle, { color: colors.text }]}>
            MobilePremium Kit
          </Text>
          <Text
            style={[
              theme.typography.mobileSubtitle,
              { color: colors.textSecondary, marginTop: 4 },
            ]}
          >
            Every primitive, every palette, every hook — the visual source of truth for vellum
            consumers.
          </Text>
        </View>

        <View style={styles.section}>
          <MobileSectionEyebrow>Home Header (brand + subtitle row)</MobileSectionEyebrow>
          <MobileHomeHeader
            brand="Showcase"
            subtitle="Welcome back, visitor"
            menuButton={
              <Pressable
                onPress={() => {}}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Open menu"
                style={({ pressed }) => [
                  styles.homeMenuButton,
                  pressed ? { opacity: 0.6 } : null,
                ]}
              >
                <Menu size={22} color={colors.text} />
              </Pressable>
            }
          />
        </View>

        <View style={styles.section}>
          <MobileSectionEyebrow>Theme</MobileSectionEyebrow>
          <ThemeSelector />
        </View>

        <MobileStepRail current={2} total={5} accentColor={colors.brand} />

        <View style={styles.section}>
          <MobileSectionEyebrow>Surfaces</MobileSectionEyebrow>
          <MobileSurface>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              Default MobileSurface — the single material surface per screen. Card base with subtle
              brand tint, hairline inner border, soft glow. Adapts to light/dark automatically.
            </Text>
          </MobileSurface>
          <View style={styles.spacer} />
          <MobileSurface accentColor={colors.status.success}>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              Surface with green accent tint (success surfaces).
            </Text>
          </MobileSurface>
        </View>

        <View style={styles.section}>
          <MobileSectionEyebrow>Atmospheres (7 surfaces)</MobileSectionEyebrow>
          {SURFACES.map((surface) => (
            <View key={surface} style={styles.atmosphereRow}>
              <View style={styles.atmosphereContainer}>
                <MobileAtmosphere surface={surface} showVignette={false} />
                <View style={[styles.atmosphereLabel, { backgroundColor: colors.card }]}>
                  <Text
                    style={[
                      styles.bodyText,
                      theme.typography.mobileFieldLabel,
                      { color: colors.text },
                    ]}
                  >
                    {surface}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <MobileSectionEyebrow>Buttons</MobileSectionEyebrow>
          <MobilePrimaryButton onPress={() => setDialogOpen(true)}>Open Dialog</MobilePrimaryButton>
          <View style={styles.spacer} />
          <MobilePrimaryButton
            variant="secondary"
            onPress={() => {}}
            icon={<ChevronRight size={16} color={colors.brand} />}
            iconPosition="right"
          >
            Secondary
          </MobilePrimaryButton>
          <View style={styles.spacer} />
          <MobilePrimaryButton variant="ghost" onPress={() => {}}>
            Ghost Action
          </MobilePrimaryButton>
          <View style={styles.spacer} />
          <MobilePrimaryButton onPress={() => {}} loading>
            Loading
          </MobilePrimaryButton>
          <View style={styles.spacer} />
          <MobilePrimaryButton onPress={() => {}} disabled>
            Disabled
          </MobilePrimaryButton>
        </View>

        <View style={styles.section}>
          <MobileSectionEyebrow>Inputs</MobileSectionEyebrow>
          <MobileSurface>
            <MobileInput
              label="Email"
              value={inputValue}
              onChangeText={setInputValue}
              placeholder="you@example.com"
              helperText="We&rsquo;ll never share your email."
              keyboardType="email-address"
              autoComplete="email"
              icon={<Mail size={18} color={colors.textColors.muted} />}
            />
            <MobileInput
              label="Password"
              value=""
              onChangeText={() => {}}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              errorText="Password must be at least 8 characters."
              icon={<Lock size={18} color={colors.textColors.muted} />}
              rightIcon={
                showPassword ? (
                  <EyeOff size={18} color={colors.textColors.muted} />
                ) : (
                  <Eye size={18} color={colors.textColors.muted} />
                )
              }
              onRightIconPress={() => setShowPassword((s) => !s)}
              maxLength={64}
            />
          </MobileSurface>
        </View>

        <View style={styles.section}>
          <MobileSectionEyebrow>Select (bottom sheet)</MobileSectionEyebrow>
          <MobileSurface>
            <MobileSelect
              label="Billing cycle"
              value={selectValue}
              onValueChange={setSelectValue}
              options={[
                { value: 'monthly', label: 'Monthly', description: 'Billed every month' },
                { value: 'yearly', label: 'Yearly', description: 'Billed every 12 months — save 20%' },
                { value: 'lifetime', label: 'Lifetime', description: 'One-time payment' },
              ]}
            />
          </MobileSurface>
        </View>

        <View style={styles.section}>
          <MobileSectionEyebrow>Alerts</MobileSectionEyebrow>
          <MobileAlert type="success" title="Workout saved" message="3 sets logged." />
          <View style={styles.spacer} />
          <MobileAlert type="warning" title="Almost there" message="One more set to go." />
          <View style={styles.spacer} />
          <MobileAlert type="error" title="Network error" message="Couldn&rsquo;t reach the server." />
          <View style={styles.spacer} />
          <MobileAlert type="info" title="Heads up" message="Sync will run when you reconnect." />
        </View>

        <View style={styles.section}>
          <MobileSectionEyebrow>Stepper (long-press to accelerate)</MobileSectionEyebrow>
          <MobileSurface>
            <MobileStepper
              value={stepperValue}
              min={0}
              max={100}
              step={1}
              fastStep={5}
              unitLabel="reps"
              onChange={setStepperValue}
            />
          </MobileSurface>
        </View>

        <View style={styles.section}>
          <MobileSectionEyebrow>Checkbox</MobileSectionEyebrow>
          <MobileSurface>
            <MobileCheckboxItem
              title="Enable notifications"
              subtitle="Get reminded when it&rsquo;s time to work out."
              checked={checked}
              onToggle={() => setChecked((c) => !c)}
            />
          </MobileSurface>
        </View>

        <View style={styles.section}>
          <MobileSectionEyebrow>Selection List (single-select radio)</MobileSectionEyebrow>
          <MobileSurface>
            <MobileSelectionList
              options={[
                { id: 'option-a', label: 'Option A', description: 'First option' },
                { id: 'option-b', label: 'Option B', description: 'Second option' },
              ]}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </MobileSurface>
        </View>

        <View style={styles.section}>
          <MobileSectionEyebrow>Selection List (multi-select checkboxes)</MobileSectionEyebrow>
          <MobileSurface>
            <MobileSelectionList
              multiSelect
              options={[
                { id: 'feature-1', label: 'Feature One', description: 'Toggle me' },
                { id: 'feature-2', label: 'Feature Two', description: 'And me' },
                { id: 'feature-3', label: 'Feature Three' },
              ]}
              selectedIds={multiSelectedIds}
              onSelect={(id) =>
                setMultiSelectedIds((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                )
              }
            />
          </MobileSurface>
        </View>

        <View style={styles.section}>
          <MobileSectionEyebrow>Settings Rows (iconBox frame)</MobileSectionEyebrow>
          <MobileSurface padding={0}>
            <MobileSettingsRow
              icon={<Settings size={18} color={colors.brand} />}
              title="Account"
              description="user@example.com"
              onPress={() => {}}
            />
            <MobileSettingsRow
              icon={<Bell size={18} color={colors.brand} />}
              title="Notifications"
              onPress={() => {}}
            />
            <MobileSettingsRow
              icon={<Info size={18} color={colors.brand} />}
              title="Version"
              description="1.0.0"
            />
            <MobileSettingsRow
              title="Sign Out"
              onPress={() => {}}
              destructive
              isLast
            />
          </MobileSurface>
        </View>

        <View style={styles.section}>
          <MobileSectionEyebrow>Toast (auto-dismissing alerts)</MobileSectionEyebrow>
          <ToastDemo />
        </View>

        <View style={styles.section}>
          <MobileSectionEyebrow>Animation Hooks</MobileSectionEyebrow>
          <AnimationDemo />
        </View>

        <View style={styles.section}>
          <MobileSectionEyebrow>Container Variant (aspect+height)</MobileSectionEyebrow>
          <ContainerVariantDemo />
        </View>

        <View style={styles.section}>
          <MobileSectionEyebrow>Skeleton (loading placeholders)</MobileSectionEyebrow>
          <SkeletonDemo />
        </View>

        <View style={styles.section}>
          <MobileSectionEyebrow>Nav Drawer (left-side hamburger)</MobileSectionEyebrow>
          <MobileSurface>
            <Text style={[styles.bodyText, { color: colors.text }]}>
              MobileNavDrawer slides in from the left with a glass scrim. Active route is
              highlighted with a 3px brand strip and tinted background. Tapping the scrim
              or any item dismisses the drawer.
            </Text>
          </MobileSurface>
          <View style={styles.spacer} />
          <MobilePrimaryButton onPress={() => setDrawerOpen(true)}>
            Open drawer demo
          </MobilePrimaryButton>
        </View>

        <MobileActionFooter
          primary={{
            onPress: () => setDialogOpen(true),
            children: 'Open Dialog',
          }}
          secondaryLabel="Skip"
          onSecondary={() => {}}
          progressText="Step 3 of 5"
        />
      </ScrollView>

      <MobileDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Dialog Title"
        primaryLabel="Confirm"
        onPrimary={() => setDialogOpen(false)}
      >
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          The MobileDialog primitive. Renders a scrim + centered MobileSurface with a compact
          MobileHeader, optional body, and a primary/secondary action pair. Escape-to-close on web,
          backdrop-tap-to-close everywhere.
        </Text>
      </MobileDialog>

      <MobileNavDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={drawerItems}
        activePathname="/exercises"
        atmosphere="analytics"
        header={
          <View>
            <Text style={[theme.typography.mobileEyebrow, { color: colors.textMuted }]}>
              Showcase
            </Text>
            <Text style={[theme.typography.mobileTitle, { color: colors.text, marginTop: 2 }]}>
              MobileNavDrawer
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  pageHeaderDemo: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
  },
  spacer: {
    height: 12,
  },
  skeletonAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  skeletonAvatarMeta: {
    flex: 1,
  },
  homeMenuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  atmosphereRow: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  atmosphereContainer: {
    height: 120,
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  atmosphereLabel: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  themeChipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  toastRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toastChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  toastChipLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  animGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  animCard: {
    flex: 1,
    minWidth: 100,
    padding: 12,
    borderRadius: 12,
  },
  animLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  animValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  counterButton: {
    width: 'auto',
    alignSelf: 'auto',
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 44,
  },
  counterValue: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  shakeCard: {
    padding: 12,
    borderRadius: 12,
  },
  variantRow: {
    marginBottom: 12,
  },
  variantProbe: {
    borderRadius: 8,
  },
  variantMeta: {
    marginTop: 6,
  },
});

export default Showcase;
