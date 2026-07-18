// services/index.ts
// Barrel for the services layer. Consumers add concrete services
// (e.g. WorkoutService, ProgressionService) here.

export { BaseQueueService } from './base';
export {
  OfflineQueueService,
  type QueueItem,
  type QueueItemStatus,
  type SyncResult,
} from './offlineQueueService';
