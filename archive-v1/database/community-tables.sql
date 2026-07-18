-- Community Features Database Schema
-- Add these tables to your existing Supabase database

-- Friend Requests Table
CREATE TABLE IF NOT EXISTS friend_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_user_name TEXT NOT NULL,
  to_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE(from_user_id, to_user_id)
);

-- Friendships Table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_name TEXT NOT NULL,
  friend_avatar TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Community Challenges Table
CREATE TABLE IF NOT EXISTS community_challenges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('streak', 'total_workouts', 'duration', 'weekly_goal')),
  target INTEGER NOT NULL CHECK (target > 0),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  participants UUID[] DEFAULT '{}',
  leaderboard JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Activity Log (for community features)
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('workout_completed', 'streak_milestone', 'goal_achieved', 'challenge_joined', 'friend_added')),
  activity_data JSONB,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add public profile flag to existing profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user ON friend_requests(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user ON friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user_active ON friendships(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_active ON friendships(friend_id, is_active);
CREATE INDEX IF NOT EXISTS idx_challenges_active_dates ON community_challenges(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_challenges_participants ON community_challenges USING GIN(participants);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_public ON user_activity_log(user_id, is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_public_search ON profiles(is_public, display_name);

-- Row Level Security (RLS) Policies

-- Friend Requests RLS
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view friend requests sent to them" ON friend_requests
  FOR SELECT USING (auth.uid() = to_user_id);

CREATE POLICY "Users can view friend requests they sent" ON friend_requests
  FOR SELECT USING (auth.uid() = from_user_id);

CREATE POLICY "Users can send friend requests" ON friend_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can respond to friend requests sent to them" ON friend_requests
  FOR UPDATE USING (auth.uid() = to_user_id);

-- Friendships RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friendships" ON friendships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own friendships" ON friendships
  FOR ALL USING (auth.uid() = user_id);

-- Community Challenges RLS
ALTER TABLE community_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active challenges" ON community_challenges
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can create challenges" ON community_challenges
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Challenge creators can update their challenges" ON community_challenges
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can join challenges (update participants)" ON community_challenges
  FOR UPDATE USING (is_active = true);

-- User Activity Log RLS
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity" ON user_activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public activity" ON user_activity_log
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can log their own activity" ON user_activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update profiles RLS to allow public profile viewing
DROP POLICY IF EXISTS "Users can view public profiles" ON profiles;
CREATE POLICY "Users can view public profiles" ON profiles
  FOR SELECT USING (is_public = true OR auth.uid() = id);

-- Functions for Community Features

-- Function to automatically log workout completion activity
CREATE OR REPLACE FUNCTION log_workout_completion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_activity_log (user_id, activity_type, activity_data, is_public)
  VALUES (
    NEW.user_id,
    'workout_completed',
    jsonb_build_object(
      'workout_id', NEW.id,
      'split_type', NEW.split_type,
      'day', NEW.day,
      'duration', NEW.duration,
      'exercise_count', jsonb_array_length(NEW.exercises)
    ),
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to log workout completion
DROP TRIGGER IF EXISTS log_workout_completion_trigger ON workout_sessions;
CREATE TRIGGER log_workout_completion_trigger
  AFTER INSERT ON workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION log_workout_completion();

-- Function to update challenge leaderboards
CREATE OR REPLACE FUNCTION update_challenge_leaderboard(challenge_id UUID)
RETURNS void AS $$
DECLARE
  challenge_record RECORD;
  participant_id UUID;
  participant_progress INTEGER;
  leaderboard_data JSONB := '[]'::jsonb;
  participant_data JSONB;
BEGIN
  -- Get challenge details
  SELECT * INTO challenge_record
  FROM community_challenges
  WHERE id = challenge_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Calculate progress for each participant
  FOR participant_id IN SELECT unnest(challenge_record.participants)
  LOOP
    CASE challenge_record.type
      WHEN 'total_workouts' THEN
        SELECT COUNT(*) INTO participant_progress
        FROM workout_sessions
        WHERE user_id = participant_id
        AND date >= challenge_record.start_date
        AND date <= challenge_record.end_date;
        
      WHEN 'duration' THEN
        SELECT COALESCE(SUM(duration), 0) INTO participant_progress
        FROM workout_sessions
        WHERE user_id = participant_id
        AND date >= challenge_record.start_date
        AND date <= challenge_record.end_date;
        
      WHEN 'streak' THEN
        -- Simplified streak calculation for challenge period
        participant_progress := 0; -- Would need more complex logic
        
      ELSE
        participant_progress := 0;
    END CASE;
    
    -- Get participant name
    SELECT jsonb_build_object(
      'userId', participant_id,
      'userName', COALESCE(p.display_name, 'Unknown User'),
      'progress', participant_progress,
      'rank', 0  -- Will be calculated after sorting
    ) INTO participant_data
    FROM profiles p
    WHERE p.id = participant_id;
    
    leaderboard_data := leaderboard_data || participant_data;
  END LOOP;
  
  -- Sort leaderboard and assign ranks
  WITH ranked_participants AS (
    SELECT 
      jsonb_set(participant, '{rank}', to_jsonb(ROW_NUMBER() OVER (ORDER BY (participant->>'progress')::INTEGER DESC))),
      (participant->>'progress')::INTEGER as progress
    FROM jsonb_array_elements(leaderboard_data) AS participant
  )
  SELECT jsonb_agg(jsonb_set(participant, '{rank}', rank)) INTO leaderboard_data
  FROM (
    SELECT 
      jsonb_set(participant, '{rank}', to_jsonb(ROW_NUMBER() OVER (ORDER BY progress DESC))) as participant,
      ROW_NUMBER() OVER (ORDER BY progress DESC) as rank,
      progress
    FROM ranked_participants
  ) ranked;
  
  -- Update challenge with new leaderboard
  UPDATE community_challenges
  SET 
    leaderboard = leaderboard_data,
    updated_at = NOW()
  WHERE id = challenge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON friend_requests TO authenticated;
GRANT ALL ON friendships TO authenticated;
GRANT ALL ON community_challenges TO authenticated;
GRANT ALL ON user_activity_log TO authenticated;

-- Comments for documentation
COMMENT ON TABLE friend_requests IS 'Friend requests between users';
COMMENT ON TABLE friendships IS 'Active friendships between users';
COMMENT ON TABLE community_challenges IS 'Community fitness challenges';
COMMENT ON TABLE user_activity_log IS 'Log of user activities for social features';