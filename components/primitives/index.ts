// components/primitives/index.ts
// Barrel for atomic primitives. LoadingSpinner / LoadingOverlay /
// AppLoading are the three ActivityIndicator wrappers that audit C4
// requires; ToastContainer renders the global toast stack — it MUST
// sit inside a <ToastProvider> in the root layout.

export { LoadingSpinner } from './LoadingSpinner';
export { LoadingOverlay } from './LoadingOverlay';
export { AppLoading } from './AppLoading';
export { ToastContainer } from './Toast';
