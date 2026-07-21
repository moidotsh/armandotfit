import { vi } from 'vitest';

// Import jest-dom with vitest setup - must come after vi import.
import '@testing-library/jest-dom/vitest';

// Define React Native globals expected by utils/logger.ts and several
// hooks/contexts. Vitest's jsdom env does not define __DEV__, so any
// module that references it bare would throw `ReferenceError: __DEV__ is not
// defined` at import time — failing every test that transitively pulls in
// utils/, services/, context/, or stores. `false` mirrors the production code path.
(globalThis as any).__DEV__ = false;

// Mock AsyncStorage.
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
    removeItem: vi.fn(() => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve()),
    getAllKeys: vi.fn(() => Promise.resolve([])),
    multiGet: vi.fn(() => Promise.resolve([])),
    multiSet: vi.fn(() => Promise.resolve()),
    multiRemove: vi.fn(() => Promise.resolve()),
  },
}));

// React Native is mocked via resolve.alias → __mocks__/react-native.ts in
// vitest.config.ts. Do NOT add a vi.mock('react-native', ...) here: the two
// would race and the inline factory would shadow the alias-resolved file,
// which is where the host-component forwardRef mocks live (the ones that
// resolve function-style `style` props and stringify accessibilityState).
// Keep this file for the modules that don't have a dedicated __mocks__ file.

// Mock react-native-safe-area-context. Required the moment any test pulls
// in the MobilePremium barrel: MobileNavDrawer imports useSafeAreaInsets,
// and the real package's JS distribution pulls in react-native's Flow-
// syntax index.js, which vitest's transform can't parse. Mock must
// register before the first indirect import resolves.
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: vi.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
  useSafeAreaFrame: vi.fn(() => ({ x: 0, y: 0, width: 1024, height: 768 })),
}));

// Mock expo modules.
vi.mock('expo-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    navigate: vi.fn(),
    canGoBack: vi.fn(() => false),
  })),
  useLocalSearchParams: vi.fn(() => ({})),
  useGlobalSearchParams: vi.fn(() => ({})),
  usePathname: vi.fn(() => '/'),
  Link: 'Link',
  router: {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    navigate: vi.fn(),
    canGoBack: vi.fn(() => false),
  },
  Stack: {
    Screen: 'Screen',
  },
  Tabs: {
    Screen: 'Screen',
  },
}));

vi.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        supabaseUrl: 'https://test.supabase.co',
        supabaseAnonKey: 'test-anon-key',
      },
    },
  },
}));

vi.mock('expo-crypto', () => ({
  digestStringAsync: vi.fn(() => Promise.resolve('hashed-value')),
  CryptoDigestAlgorithm: {
    SHA256: 'SHA256',
  },
  CryptoEncoding: {
    HEX: 'HEX',
  },
}));

vi.mock('expo-haptics', () => ({
  default: {
    impactAsync: vi.fn(),
    notificationAsync: vi.fn(),
    selectionAsync: vi.fn(),
    ImpactFeedbackStyle: {
      Light: 'Light',
      Medium: 'Medium',
      Heavy: 'Heavy',
    },
  },
}));

vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(() => Promise.resolve(null)),
  setItemAsync: vi.fn(() => Promise.resolve()),
  deleteItemAsync: vi.fn(() => Promise.resolve()),
}));

// Mock expo-clipboard. Required because the hooks barrel re-exports
// useCopyForAi, which imports expo-clipboard. Without this mock, any
// test that pulls in @hooks/ would try to load expo-modules-core's
// EventEmitter, which vitest's jsdom env can't resolve.
vi.mock('expo-clipboard', () => ({
  setStringAsync: vi.fn(() => Promise.resolve(true)),
  getStringAsync: vi.fn(() => Promise.resolve('')),
}));

// Mock tamagui.
vi.mock('tamagui', () => ({
  View: 'View',
  Text: 'Text',
  XStack: 'XStack',
  YStack: 'YStack',
  ZStack: 'ZStack',
  Spacer: 'Spacer',
  ScrollView: 'ScrollView',
  Input: 'Input',
  TextArea: 'TextArea',
  Button: 'Button',
  Switch: 'Switch',
  Label: 'Label',
  Paragraph: 'Paragraph',
  H1: 'H1',
  H2: 'H2',
  H3: 'H3',
  H4: 'H4',
  H5: 'H5',
  H6: 'H6',
  Spinner: 'Spinner',
  Image: 'Image',
  useTheme: vi.fn(() => ({
    name: 'light',
  })),
  useMedia: vi.fn(() => ({
    sm: false,
    md: true,
    lg: false,
    xl: false,
  })),
  themed: vi.fn((component) => component),
  createTamagui: vi.fn((config) => config),
  config: {},
  TamaguiProvider: ({ children }: { children: React.ReactNode }) => children,
  SizableText: 'SizableText',
  Circle: 'Circle',
  Square: 'Square',
  Stack: 'Stack',
  Theme: 'Theme',
}));

vi.mock('@tamagui/lucide-icons-2', () => ({
  ChevronRight: 'ChevronRight',
  ChevronLeft: 'ChevronLeft',
  ChevronDown: 'ChevronDown',
  ChevronUp: 'ChevronUp',
  Check: 'Check',
  X: 'X',
  Plus: 'Plus',
  Minus: 'Minus',
  Settings: 'Settings',
  User: 'User',
  Home: 'Home',
  Calendar: 'Calendar',
  Clock: 'Clock',
  Info: 'Info',
  AlertCircle: 'AlertCircle',
  AlertTriangle: 'AlertTriangle',
  CheckCircle2: 'CheckCircle2',
  HelpCircle: 'HelpCircle',
  Trash: 'Trash',
  Edit: 'Edit',
  Save: 'Save',
  Upload: 'Upload',
  Download: 'Download',
  RefreshCw: 'RefreshCw',
  Eye: 'Eye',
  EyeOff: 'EyeOff',
  Lock: 'Lock',
  Unlock: 'Unlock',
  Sun: 'Sun',
  Moon: 'Moon',
  Monitor: 'Monitor',
  ClipboardCopy: 'ClipboardCopy',
  Menu: 'Menu',
  Bell: 'Bell',
  Mail: 'Mail',
  Search: 'Search',
  Package: 'Package',
  TrendingUp: 'TrendingUp',
}));

// Mock @supabase/supabase-js.
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      signOut: vi.fn(() => Promise.resolve({ error: null })),
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      recoverSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      setSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null })),
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      upsert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
  })),
}));

// Global test utilities.
// Class form (not vi.fn().mockImplementation) so `new ResizeObserver(...)` is
// a real constructor call — required by hooks/useContainerQuery.ts. Vitest's
// mock-implementation fn is not constructable in newer V8 under jsdom.
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

// Mock window.matchMedia.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Suppress console errors in tests unless explicitly asserted.
vi.spyOn(console, 'error').mockImplementation(() => {});

// ── Screen-test hook stubs ────────────────────────────────────────────
//
// Phase 4 resilience follow-up: integration tests for app/split-selection
// and app/workout-detail need to control the React Query state of the
// plan-launch hooks (useActivePlanForVariant, usePlanLaunchHydration) to
// reproduce the lookup-error and hydration-error UI branches. T2 Part A
// requires module-level vi.mock() calls to live in this file (not in the
// test files), so the mocks are centralized here.
//
// The stubs are vi.hoisted so the vi.mock factory — which is itself
// hoisted by Vitest — can safely reference them. Each stub defaults to
// the "happy empty" shape so tests that don't care about a hook still
// get a sane return value. Screen integration tests override the stubs
// per-test via `screenHookStubs.X.mockReturnValue(...)`.
//
// Scope: only the hooks the two screens actually import from `../hooks`.
// Other hook exports are not stubbed; tests that need them must add
// their own stub here.

const screenHookStubs = vi.hoisted(() => ({
  useProfile: vi.fn(
    (..._a: unknown[]): { data: unknown; isLoading: boolean } => ({
      data: undefined,
      isLoading: false,
    }),
  ),
  useRecentWorkouts: vi.fn(
    (..._a: unknown[]): { data: unknown[] } => ({ data: [] }),
  ),
  useVariantTree: vi.fn(
    (..._a: unknown[]): { data: unknown; isLoading: boolean } => ({
      data: undefined,
      isLoading: false,
    }),
  ),
  useActivePlanForVariant: vi.fn(
    (..._a: unknown[]): {
      data: unknown;
      isError: boolean;
      isLoading: boolean;
      refetch: () => Promise<unknown>;
    } => ({
      data: null,
      isError: false,
      isLoading: false,
      refetch: () => Promise.resolve({}),
    }),
  ),
  usePlanLaunchHydration: vi.fn(
    (..._a: unknown[]): {
      data: unknown;
      isError: boolean;
      isLoading: boolean;
      refetch: () => Promise<unknown>;
    } => ({
      data: null,
      isError: false,
      isLoading: false,
      refetch: () => Promise.resolve({}),
    }),
  ),
  useSuggestedExercises: vi.fn(
    (..._a: unknown[]): { data: unknown[]; isLoading: boolean } => ({
      data: [],
      isLoading: false,
    }),
  ),
  useWorkoutDetail: vi.fn(
    (..._a: unknown[]): { data: unknown; isLoading: boolean } => ({
      data: undefined,
      isLoading: false,
    }),
  ),
  useLogWorkout: vi.fn(
    (..._a: unknown[]): {
      mutate: (dto: unknown) => void;
      isPending: boolean;
      isSuccess: boolean;
      isError: boolean;
      error: unknown;
    } => ({
      mutate: () => {},
      isPending: false,
      isSuccess: false,
      isError: false,
      error: null,
    }),
  ),
  useAiPayload: vi.fn((..._a: unknown[]): string => ''),
  useExerciseSetupOptions: vi.fn(
    (..._a: unknown[]): {
      data: Map<unknown, unknown> | undefined;
      isLoading: boolean;
    } => ({ data: undefined, isLoading: false }),
  ),
  useExerciseCapabilities: vi.fn(
    (..._a: unknown[]): {
      data: Map<unknown, unknown> | undefined;
      isLoading: boolean;
    } => ({ data: undefined, isLoading: false }),
  ),
  useActiveSetupPresets: vi.fn(
    (..._a: unknown[]): {
      data: unknown[];
      isLoading: boolean;
    } => ({ data: [], isLoading: false }),
  ),
  useAllSetupPresets: vi.fn(
    (..._a: unknown[]): {
      data: unknown[];
      isLoading: boolean;
    } => ({ data: [], isLoading: false }),
  ),
  useCreateSetupPreset: vi.fn(
    (..._a: unknown[]): {
      mutate: (vars: unknown, opts?: unknown) => void;
      isPending: boolean;
    } => ({ mutate: () => {}, isPending: false }),
  ),
  useUpdateSetupPreset: vi.fn(
    (..._a: unknown[]): {
      mutate: (vars: unknown, opts?: unknown) => void;
      isPending: boolean;
    } => ({ mutate: () => {}, isPending: false }),
  ),
  useRetireSetupPreset: vi.fn(
    (..._a: unknown[]): {
      mutate: (vars: unknown, opts?: unknown) => void;
      isPending: boolean;
    } => ({ mutate: () => {}, isPending: false }),
  ),
  useUnretireSetupPreset: vi.fn(
    (..._a: unknown[]): {
      mutate: (vars: unknown, opts?: unknown) => void;
      isPending: boolean;
    } => ({ mutate: () => {}, isPending: false }),
  ),
  useDeleteSetupPreset: vi.fn(
    (..._a: unknown[]): {
      mutate: (vars: unknown, opts?: unknown) => void;
      isPending: boolean;
    } => ({ mutate: () => {}, isPending: false }),
  ),
}));

vi.mock('../hooks', async (importOriginal) => {
  // Pull in the real barrel so non-stubbed exports (useReducedMotion,
  // usePlatformAnimation, usePressedStyle, useFadeIn, …) keep working
  // for every other test. The 9 stubs below override only the hooks the
  // Phase 4 resilience screen tests need to control; everything else
  // passes through untouched.
  const actual = await importOriginal<typeof import('../hooks')>();
  return {
    ...actual,
    useProfile: (...a: unknown[]) => screenHookStubs.useProfile(...a),
    useRecentWorkouts: (...a: unknown[]) => screenHookStubs.useRecentWorkouts(...a),
    useVariantTree: (...a: unknown[]) => screenHookStubs.useVariantTree(...a),
    useActivePlanForVariant: (...a: unknown[]) =>
      screenHookStubs.useActivePlanForVariant(...a),
    usePlanLaunchHydration: (...a: unknown[]) =>
      screenHookStubs.usePlanLaunchHydration(...a),
    useSuggestedExercises: (...a: unknown[]) =>
      screenHookStubs.useSuggestedExercises(...a),
    useWorkoutDetail: (...a: unknown[]) => screenHookStubs.useWorkoutDetail(...a),
    useLogWorkout: (...a: unknown[]) => screenHookStubs.useLogWorkout(...a),
    useAiPayload: (...a: unknown[]) => screenHookStubs.useAiPayload(...a),
    useExerciseSetupOptions: (...a: unknown[]) =>
      screenHookStubs.useExerciseSetupOptions(...a),
    useExerciseCapabilities: (...a: unknown[]) =>
      screenHookStubs.useExerciseCapabilities(...a),
    useActiveSetupPresets: (...a: unknown[]) =>
      screenHookStubs.useActiveSetupPresets(...a),
    useAllSetupPresets: (...a: unknown[]) =>
      screenHookStubs.useAllSetupPresets(...a),
    useCreateSetupPreset: (...a: unknown[]) =>
      screenHookStubs.useCreateSetupPreset(...a),
    useUpdateSetupPreset: (...a: unknown[]) =>
      screenHookStubs.useUpdateSetupPreset(...a),
    useRetireSetupPreset: (...a: unknown[]) =>
      screenHookStubs.useRetireSetupPreset(...a),
    useUnretireSetupPreset: (...a: unknown[]) =>
      screenHookStubs.useUnretireSetupPreset(...a),
    useDeleteSetupPreset: (...a: unknown[]) =>
      screenHookStubs.useDeleteSetupPreset(...a),
  };
});

export { screenHookStubs };
