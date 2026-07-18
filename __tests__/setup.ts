import { vi } from 'vitest';

// Import jest-dom with vitest setup - must come after vi import.
import '@testing-library/jest-dom/vitest';

// Define React Native globals expected by utils/logger.ts, utils/envValidation.ts,
// and several hooks/contexts. Vitest's jsdom env does not define __DEV__, so any
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

// Mock React Native core modules.
vi.mock('react-native', () => ({
  Platform: {
    OS: 'web',
    select: vi.fn((obj: Record<string, unknown>) => obj.web || obj.default),
  },
  StyleSheet: {
    create: (styles: Record<string, unknown>) => styles,
    flatten: (style: unknown) => style,
  },
  Dimensions: {
    get: vi.fn(() => ({ width: 1024, height: 768 })),
    addEventListener: vi.fn(() => ({ remove: vi.fn() })),
  },
  Alert: {
    alert: vi.fn(),
  },
  Keyboard: {
    dismiss: vi.fn(),
    addListener: vi.fn(() => ({ remove: vi.fn() })),
  },
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  TouchableHighlight: 'TouchableHighlight',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  Image: 'Image',
  ActivityIndicator: 'ActivityIndicator',
  Switch: 'Switch',
  Modal: 'Modal',
  FlatList: 'FlatList',
  SafeAreaView: 'SafeAreaView',
  Pressable: 'Pressable',
  Appearance: {
    getColorScheme: vi.fn(() => 'light'),
    addChangeListener: vi.fn(() => ({ remove: vi.fn() })),
  },
  useColorScheme: vi.fn(() => ({ colorScheme: 'light' })),
}));

// Mock expo modules.
vi.mock('expo-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    navigate: vi.fn(),
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
}));

// Mock crypto-js.
vi.mock('crypto-js', () => ({
  default: {
    AES: {
      encrypt: vi.fn((data: string) => ({ toString: () => `encrypted:${data}` })),
      decrypt: vi.fn((data: string) => ({
        toString: vi.fn(() => data.replace('encrypted:', '')),
      })),
    },
    PBKDF2: vi.fn(() => ({
      toString: vi.fn(() => 'derived-key'),
    })),
    enc: {
      Utf8: 'Utf8',
      Base64: 'Base64',
      Hex: 'Hex',
    },
    lib: {
      WordArray: {
        random: vi.fn(() => 'random-word-array'),
      },
    },
  },
  AES: {
    encrypt: vi.fn((data: string) => ({ toString: () => `encrypted:${data}` })),
    decrypt: vi.fn((data: string) => ({
      toString: vi.fn(() => data.replace('encrypted:', '')),
    })),
  },
  PBKDF2: vi.fn(() => ({
    toString: vi.fn(() => 'derived-key'),
  })),
  enc: {
    Utf8: 'Utf8',
    Base64: 'Base64',
    Hex: 'Hex',
  },
  lib: {
    WordArray: {
      random: vi.fn(() => 'random-word-array'),
    },
  },
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
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

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
