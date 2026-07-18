// Mock for react-native to avoid Flow syntax issues in vitest.
// Used via the resolve.alias in vitest.config.ts. Tests import the
// real react-native in production, but vitest's jsdom env can't parse
// RN's native module shims — this stub keeps imports resolving.

export const Platform = {
  OS: 'web',
  select: <T>(obj: Record<string, T>) => obj.web || obj.default,
  Version: '1.0.0',
  isTesting: true,
};

export const StyleSheet = {
  create: <T extends Record<string, unknown>>(styles: T) => styles,
  flatten: (style: unknown) => style,
  hairlineWidth: 1,
  absoluteFill: { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0 },
  absoluteFillObject: { position: 'absolute' as const, left: 0, right: 0, top: 0, bottom: 0 },
};

export const Dimensions = {
  get: () => ({ width: 1024, height: 768 }),
  addEventListener: () => ({ remove: () => {} }),
  removeEventListener: () => {},
  set: () => {},
};

export const Alert = {
  alert: () => {},
};

export const Keyboard = {
  dismiss: () => {},
  addListener: () => ({ remove: () => {} }),
  removeListener: () => {},
  dismissAll: () => {},
};

export const View = 'View';
export const Text = 'Text';
export const TextInput = 'TextInput';
export const ScrollView = 'ScrollView';
export const TouchableOpacity = 'TouchableOpacity';
export const TouchableHighlight = 'TouchableHighlight';
export const TouchableWithoutFeedback = 'TouchableWithoutFeedback';
export const Image = 'Image';
export const ActivityIndicator = 'ActivityIndicator';
export const Switch = 'Switch';
export const Modal = 'Modal';
export const FlatList = 'FlatList';
export const SafeAreaView = 'SafeAreaView';
export const Pressable = 'Pressable';
export const AppState = {
  currentState: 'active',
  addEventListener: () => ({ remove: () => {} }),
  removeEventListener: () => {},
};

export const Appearance = {
  getColorScheme: () => 'light',
  addChangeListener: () => ({ remove: () => {} }),
};

export const StatusBar = {
  setBarStyle: () => {},
  setBackgroundColor: () => {},
  setHidden: () => {},
};

export const NativeModules = {};
export const NativeEventEmitter = class NativeEventEmitter {
  addListener() {
    return { remove: () => {} };
  }
  removeListener() {}
  emit() {}
};

export const Easing = {
  linear: () => {},
  ease: () => {},
  in: () => {},
  out: () => {},
  inOut: () => {},
  bezier: () => {},
};

export const Animated = {
  View: 'AnimatedView',
  Text: 'AnimatedText',
  Image: 'AnimatedImage',
  createAnimatedComponent: (component: unknown) => component,
  timing: () => ({ start: () => {}, stop: () => {} }),
  spring: () => ({ start: () => {}, stop: () => {} }),
  Value: class AnimatedValue {
    constructor(value: number) {
      this.value = value;
    }
    setValue() {}
    setOffset() {}
    flattenOffset() {}
    extractOffset() {}
    addListener() {
      return '';
    }
    removeListener() {}
    removeAllListeners() {}
    stopAnimation() {}
    resetAnimation() {}
    interpolate = () => {};
    value: number;
  },
  ValueXY: class AnimatedValueXY {
    constructor() {}
    getLayout() {
      return {};
    }
    getTranslateTransform() {
      return [];
    }
    setValue() {}
    setOffset() {}
    flattenOffset() {}
    extractOffset() {}
    stopAnimation() {}
    resetAnimation() {}
    addListener() {
      return '';
    }
    removeListener() {}
    x: number = 0;
    y: number = 0;
  },
};

export const useWindowDimensions = () => ({ width: 1024, height: 768 });

export const PixelRatio = {
  get: () => 2,
  getFontScale: () => 1,
  getPixelSizeForLayoutSize: (size: number) => size * 2,
  roundToNearestPixel: (size: number) => size,
};

export const I18nManager = {
  isRTL: false,
  allowRTL: () => {},
  forceRTL: () => {},
  swapLeftAndRightInRTL: () => {},
};

export const InteractionManager = {
  runAfterInteractions: () => ({
    then: (cb: () => void) => {
      cb();
      return { cancel: () => {} };
    },
    cancel: () => {},
    done: () => {},
  }),
  createInteractionHandle: () => 1,
  clearInteractionHandle: () => {},
  setDeadline: () => {},
};

export const LayoutAnimation = {
  configureNext: () => {},
  create: () => {},
  Types: { easeInEaseOut: 'easeInEaseOut', linear: 'linear', spring: 'spring' },
  Properties: { opacity: 'opacity', scaleX: 'scaleX', scaleY: 'scaleY' },
};

export const Linking = {
  openURL: () => Promise.resolve(),
  canOpenURL: () => Promise.resolve(true),
  getInitialURL: () => Promise.resolve(null),
  sendIntent: () => Promise.resolve(),
};

export const AsyncStorage = {
  getItem: () => Promise.resolve(null),
  setItem: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
  clear: () => Promise.resolve(),
  getAllKeys: () => Promise.resolve([]),
  multiGet: () => Promise.resolve([]),
  multiSet: () => Promise.resolve(),
  multiRemove: () => Promise.resolve(),
};

export const AppRegistry = {
  registerComponent: () => {},
  runApplication: () => {},
  unmountApplicationComponentAtRootTag: () => {},
};

export const DeviceEventEmitter = {
  addListener: () => ({ remove: () => {} }),
  emit: () => {},
  removeListener: () => {},
  removeAllListeners: () => {},
};

export const useColorScheme = () => ({ colorScheme: 'light' as const });

export default {
  Platform,
  StyleSheet,
  Dimensions,
  Alert,
  Keyboard,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  Image,
  ActivityIndicator,
  Switch,
  Modal,
  FlatList,
  SafeAreaView,
};
