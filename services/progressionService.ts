// services/progressionService.ts
// Dashboard progression summary + streak reads. Composes the latest
// user_analytics row with the calculate_user_streaks RPC result so the
// home screen gets everything it needs in one call.

import {
  progressionRepository,
  streakRepository,
  type RepositoryResult,
  ok,
} from '../utils/supabase/repositories';
import type { ID, ProgressionSummary, StreakInfo } from '../shared/types';

/**
 * ProgressionService — home-dashboard read orchestrator. Pulls the latest
 * analytics row + current/best streaks, composes them into ProgressionSummary.
 *
 * The composition is service-level (not in the repository) because
 * repositories are single-purpose: ProgressionRepository owns the
 * user_analytics table; StreakRepository owns the streak RPC. The
 * service is where cross-repository joins live.
 */
export class ProgressionService {
  /**
   * Get the home-dashboard summary. Returns zeros across the board if
   * the user has never worked out (fresh account).
   */
  static async getDashboardSummary(
    userId: ID,
  ): Promise<RepositoryResult<ProgressionSummary>> {
    const [latestRes, streakRes] = await Promise.all([
      progressionRepository.findLatest(userId),
      streakRepository.getStreaks(userId),
    ]);
    if (!latestRes.success) return latestRes;
    if (!streakRes.success) return streakRes;

    return ok(progressionRepository.buildSummary(latestRes.data, streakRes.data));
  }

  /** Standalone streak read (used by the streak badge in the header). */
  static async getStreaks(userId: ID): Promise<RepositoryResult<StreakInfo>> {
    return streakRepository.getStreaks(userId);
  }
}

export default ProgressionService;
