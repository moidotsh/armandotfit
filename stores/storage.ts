// stores/storage.ts
// Re-export — the storage adapter lives in utils/storage.ts (utils
// modules import it at the leaf, never via the stores barrel). This
// shim keeps the historical stores/storage import path working.
export { zustandStorage } from '../utils/storage';
