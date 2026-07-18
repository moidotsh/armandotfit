// services/communityService.ts - Community and social features service
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  preferredSplit: 'oneADay' | 'twoADay';
  weeklyGoal: number;
  isPublic: boolean;
  bio?: string;
  joinedAt: string;
  totalWorkouts: number;
  currentStreak: number;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  respondedAt?: string;
}

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  friendName: string;
  friendAvatar?: string;
  createdAt: string;
  isActive: boolean;
}

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  type: 'streak' | 'total_workouts' | 'duration' | 'weekly_goal';
  target: number;
  startDate: string;
  endDate: string;
  participants: string[];
  leaderboard: Array<{
    userId: string;
    userName: string;
    progress: number;
    rank: number;
  }>;
  createdBy: string;
  isActive: boolean;
}

class CommunityService {
  /**
   * Search for users by display name or email
   */
  async searchUsers(query: string, limit: number = 10): Promise<UserProfile[]> {
    try {
      if (!query.trim()) return [];

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          email,
          avatar_url,
          preferred_split,
          weekly_goal,
          is_public,
          bio,
          created_at
        `)
        .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
        .eq('is_public', true)
        .limit(limit);

      if (error) {
        console.error('Error searching users:', error);
        return [];
      }

      // Get workout stats for each user
      const usersWithStats = await Promise.all(
        data.map(async (user) => {
          const [workoutStats, streakData] = await Promise.all([
            this.getUserWorkoutStats(user.id),
            this.getUserCurrentStreak(user.id)
          ]);

          return {
            id: user.id,
            displayName: user.display_name,
            email: user.email,
            avatarUrl: user.avatar_url,
            preferredSplit: user.preferred_split,
            weeklyGoal: user.weekly_goal,
            isPublic: user.is_public,
            bio: user.bio,
            joinedAt: user.created_at,
            totalWorkouts: workoutStats.totalWorkouts,
            currentStreak: streakData.currentStreak
          } as UserProfile;
        })
      );

      return usersWithStats;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  /**
   * Send a friend request
   */
  async sendFriendRequest(toUserId: string, fromUserId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if friendship or request already exists
      const { data: existing } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`and(from_user_id.eq.${fromUserId},to_user_id.eq.${toUserId}),and(from_user_id.eq.${toUserId},to_user_id.eq.${fromUserId})`)
        .single();

      if (existing) {
        return { success: false, error: 'Friend request already exists or you are already friends' };
      }

      // Get sender's name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', fromUserId)
        .single();

      const { error } = await supabase
        .from('friend_requests')
        .insert({
          from_user_id: fromUserId,
          from_user_name: profile?.display_name || 'Unknown User',
          to_user_id: toUserId,
          status: 'pending'
        });

      if (error) {
        console.error('Error sending friend request:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending friend request:', error);
      return { success: false, error: 'Failed to send friend request' };
    }
  }

  /**
   * Get pending friend requests for a user
   */
  async getFriendRequests(userId: string): Promise<FriendRequest[]> {
    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('to_user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching friend requests:', error);
        return [];
      }

      return data.map(req => ({
        id: req.id,
        fromUserId: req.from_user_id,
        fromUserName: req.from_user_name,
        toUserId: req.to_user_id,
        status: req.status,
        createdAt: req.created_at,
        respondedAt: req.responded_at
      }));
    } catch (error) {
      console.error('Error fetching friend requests:', error);
      return [];
    }
  }

  /**
   * Respond to a friend request
   */
  async respondToFriendRequest(
    requestId: string, 
    response: 'accepted' | 'declined'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Update the friend request
      const { data: request, error: updateError } = await supabase
        .from('friend_requests')
        .update({
          status: response,
          responded_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating friend request:', updateError);
        return { success: false, error: updateError.message };
      }

      // If accepted, create friendship records
      if (response === 'accepted') {
        const [fromProfile, toProfile] = await Promise.all([
          supabase.from('profiles').select('display_name, avatar_url').eq('id', request.from_user_id).single(),
          supabase.from('profiles').select('display_name, avatar_url').eq('id', request.to_user_id).single()
        ]);

        const friendships = [
          {
            user_id: request.from_user_id,
            friend_id: request.to_user_id,
            friend_name: toProfile.data?.display_name || 'Unknown',
            friend_avatar: toProfile.data?.avatar_url,
            is_active: true
          },
          {
            user_id: request.to_user_id,
            friend_id: request.from_user_id,
            friend_name: fromProfile.data?.display_name || 'Unknown',
            friend_avatar: fromProfile.data?.avatar_url,
            is_active: true
          }
        ];

        const { error: friendshipError } = await supabase
          .from('friendships')
          .insert(friendships);

        if (friendshipError) {
          console.error('Error creating friendships:', friendshipError);
          return { success: false, error: 'Failed to create friendship' };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error responding to friend request:', error);
      return { success: false, error: 'Failed to respond to friend request' };
    }
  }

  /**
   * Get user's friends list
   */
  async getFriends(userId: string): Promise<Friendship[]> {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching friends:', error);
        return [];
      }

      return data.map(friendship => ({
        id: friendship.id,
        userId: friendship.user_id,
        friendId: friendship.friend_id,
        friendName: friendship.friend_name,
        friendAvatar: friendship.friend_avatar,
        createdAt: friendship.created_at,
        isActive: friendship.is_active
      }));
    } catch (error) {
      console.error('Error fetching friends:', error);
      return [];
    }
  }

  /**
   * Remove a friend
   */
  async removeFriend(userId: string, friendId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ is_active: false })
        .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

      if (error) {
        console.error('Error removing friend:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing friend:', error);
      return { success: false, error: 'Failed to remove friend' };
    }
  }

  /**
   * Create a community challenge
   */
  async createChallenge(challenge: Omit<CommunityChallenge, 'id' | 'participants' | 'leaderboard' | 'isActive'>): Promise<{ success: boolean; challengeId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('community_challenges')
        .insert({
          title: challenge.title,
          description: challenge.description,
          type: challenge.type,
          target: challenge.target,
          start_date: challenge.startDate,
          end_date: challenge.endDate,
          created_by: challenge.createdBy,
          participants: [challenge.createdBy], // Creator automatically joins
          leaderboard: [],
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating challenge:', error);
        return { success: false, error: error.message };
      }

      return { success: true, challengeId: data.id };
    } catch (error) {
      console.error('Error creating challenge:', error);
      return { success: false, error: 'Failed to create challenge' };
    }
  }

  /**
   * Get active community challenges
   */
  async getActiveChallenges(): Promise<CommunityChallenge[]> {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('community_challenges')
        .select('*')
        .eq('is_active', true)
        .gte('end_date', now)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching challenges:', error);
        return [];
      }

      return data.map(challenge => ({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        type: challenge.type,
        target: challenge.target,
        startDate: challenge.start_date,
        endDate: challenge.end_date,
        participants: challenge.participants || [],
        leaderboard: challenge.leaderboard || [],
        createdBy: challenge.created_by,
        isActive: challenge.is_active
      }));
    } catch (error) {
      console.error('Error fetching challenges:', error);
      return [];
    }
  }

  /**
   * Join a community challenge
   */
  async joinChallenge(challengeId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current challenge data
      const { data: challenge, error: fetchError } = await supabase
        .from('community_challenges')
        .select('participants')
        .eq('id', challengeId)
        .single();

      if (fetchError) {
        return { success: false, error: 'Challenge not found' };
      }

      const participants = challenge.participants || [];
      
      if (participants.includes(userId)) {
        return { success: false, error: 'Already participating in this challenge' };
      }

      // Add user to participants
      const { error } = await supabase
        .from('community_challenges')
        .update({
          participants: [...participants, userId]
        })
        .eq('id', challengeId);

      if (error) {
        console.error('Error joining challenge:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error joining challenge:', error);
      return { success: false, error: 'Failed to join challenge' };
    }
  }

  // Private helper methods

  private async getUserWorkoutStats(userId: string): Promise<{ totalWorkouts: number }> {
    try {
      const { count, error } = await supabase
        .from('workout_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching workout stats:', error);
        return { totalWorkouts: 0 };
      }

      return { totalWorkouts: count || 0 };
    } catch (error) {
      return { totalWorkouts: 0 };
    }
  }

  private async getUserCurrentStreak(userId: string): Promise<{ currentStreak: number }> {
    try {
      const { data, error } = await supabase.rpc('calculate_user_streaks', {
        target_user_id: userId
      });

      if (error || !data || data.length === 0) {
        return { currentStreak: 0 };
      }

      return { currentStreak: data[0].current_streak || 0 };
    } catch (error) {
      return { currentStreak: 0 };
    }
  }
}

export const communityService = new CommunityService();