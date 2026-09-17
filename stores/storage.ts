// stores/storage.ts
// Re-export shim — the storage adapter moved to utils/storage.ts (it is
// infra, not domain state, and utils modules must import it at the LEAF
// level: pulling the stores barrel from utils closes a barrel cycle via
// networkStore's logger import). Same-folder stores imports keep working
// through this shim; new cross-folder importers go to utils/storage.
export * from '../utils/storage';
export { default } from '../utils/storage';
