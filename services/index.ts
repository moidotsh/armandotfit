// services/index.ts
// Barrel for the services layer. Vellum's infrastructure
// (BaseQueueService, OfflineQueueService) + armandotfit's concrete
// domain services.

export { BaseQueueService } from './base';
export {
  OfflineQueueService,
  type QueueItem,
  type QueueItemStatus,
  type SyncResult,
} from './offlineQueueService';

// armandotfit domain services
export { WorkoutService } from './workoutService';
export { ProgressionService } from './progressionService';
export { AnalyticsService } from './analyticsService';
