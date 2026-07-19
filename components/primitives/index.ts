// components/primitives/index.ts
// Barrel for atomic primitives. LoadingSpinner / LoadingOverlay /
// AppLoading are the three ActivityIndicator wrappers that audit C4
// requires; ToastContainer renders the global toast stack — it MUST
// sit inside a <ToastProvider> in the root layout. AuthGuard is the
// central auth-flow redirect wrapper — sits inside <AuthProvider>.
// AppErrorBoundary wraps the root layout as the outermost provider
// (outside ThemeProvider) so a theme crash still triggers the fallback.

export { LoadingSpinner } from './LoadingSpinner';
export { LoadingOverlay } from './LoadingOverlay';
export { AppLoading } from './AppLoading';
export { ToastContainer } from './Toast';
export { AuthGuard } from './AuthGuard';
export { AppErrorBoundary } from './AppErrorBoundary';
