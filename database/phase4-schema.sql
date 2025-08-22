-- Phase 4: Cloud Backend Schema
-- Run this in your Supabase SQL editor to add cloud workout storage

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workout Sessions Table (Cloud storage for workouts)
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  split_type TEXT NOT NULL CHECK (split_type IN ('oneADay', 'twoADay')),
  day INTEGER NOT NULL CHECK (day >= 1 AND day <= 7),
  exercises JSONB NOT NULL DEFAULT '[]',
  duration INTEGER NOT NULL CHECK (duration > 0), -- minutes
  notes TEXT,
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Analytics & Progress Tracking
CREATE TABLE IF NOT EXISTS user_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_workouts INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0, -- minutes
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  weekly_goal_progress JSONB DEFAULT '{"completed": 0, "target": 4}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Workout Sharing & Social Features
CREATE TABLE IF NOT EXISTS workout_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workout_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync Metadata (for offline sync)
CREATE TABLE IF NOT EXISTS sync_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  checksum TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, table_name, record_id)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON workout_sessions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_created_at ON workout_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_date ON user_analytics(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_shares_shared_with ON workout_shares(shared_with, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_metadata_user_table ON sync_metadata(user_id, table_name);

-- Row Level Security (RLS) Policies

-- Workout Sessions RLS
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own workout sessions
CREATE POLICY "Users can view own workout sessions" ON workout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workout sessions" ON workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workout sessions" ON workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own workout sessions" ON workout_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Users can view shared workout sessions
CREATE POLICY "Users can view shared workouts" ON workout_sessions
  FOR SELECT USING (
    is_shared = true AND 
    (auth.uid() = ANY(shared_with) OR auth.uid() = user_id)
  );

-- User Analytics RLS
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own analytics" ON user_analytics
  FOR ALL USING (auth.uid() = user_id);

-- Workout Shares RLS
ALTER TABLE workout_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shares sent to them" ON workout_shares
  FOR SELECT USING (auth.uid() = shared_with OR auth.uid() = shared_by);

CREATE POLICY "Users can create shares" ON workout_shares
  FOR INSERT WITH CHECK (auth.uid() = shared_by);

CREATE POLICY "Users can update shares sent to them" ON workout_shares
  FOR UPDATE USING (auth.uid() = shared_with);

-- Sync Metadata RLS
ALTER TABLE sync_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sync metadata" ON sync_metadata
  FOR ALL USING (auth.uid() = user_id);

-- Functions for Analytics Updates

-- Function to update user analytics after workout
CREATE OR REPLACE FUNCTION update_user_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update daily analytics
  INSERT INTO user_analytics (user_id, date, total_workouts, total_duration)
  VALUES (
    NEW.user_id,
    NEW.date::date,
    1,
    NEW.duration
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    total_workouts = user_analytics.total_workouts + 1,
    total_duration = user_analytics.total_duration + NEW.duration,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update analytics
CREATE TRIGGER update_analytics_on_workout
  AFTER INSERT ON workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_analytics();

-- Function to calculate streaks
CREATE OR REPLACE FUNCTION calculate_user_streaks(target_user_id UUID)
RETURNS TABLE(current_streak INTEGER, best_streak INTEGER) AS $$
DECLARE
  streak_count INTEGER := 0;
  max_streak INTEGER := 0;
  check_date DATE;
  workout_count INTEGER;
BEGIN
  -- Start from today and count backwards
  check_date := CURRENT_DATE;
  
  -- Count current streak
  LOOP
    SELECT COUNT(*) INTO workout_count
    FROM workout_sessions ws
    WHERE ws.user_id = target_user_id 
    AND ws.date::date = check_date;
    
    IF workout_count > 0 THEN
      streak_count := streak_count + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  -- Calculate best streak (simplified - checks last 90 days)
  WITH daily_workouts AS (
    SELECT 
      date::date as workout_date,
      COUNT(*) as workout_count
    FROM workout_sessions 
    WHERE user_id = target_user_id 
    AND date >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY date::date
    ORDER BY date::date
  ),
  streak_groups AS (
    SELECT 
      workout_date,
      workout_date - (ROW_NUMBER() OVER (ORDER BY workout_date))::integer * INTERVAL '1 day' as grp
    FROM daily_workouts
    WHERE workout_count > 0
  )
  SELECT MAX(COUNT(*)) INTO max_streak
  FROM streak_groups
  GROUP BY grp;
  
  IF max_streak IS NULL THEN
    max_streak := 0;
  END IF;
  
  -- Use current streak if it's the best
  IF streak_count > max_streak THEN
    max_streak := streak_count;
  END IF;
  
  RETURN QUERY SELECT streak_count, max_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON workout_sessions TO authenticated;
GRANT ALL ON user_analytics TO authenticated;
GRANT ALL ON workout_shares TO authenticated;
GRANT ALL ON sync_metadata TO authenticated;

-- Comments for documentation
COMMENT ON TABLE workout_sessions IS 'Cloud storage for user workout sessions with sharing capabilities';
COMMENT ON TABLE user_analytics IS 'Daily aggregated analytics and progress tracking';
COMMENT ON TABLE workout_shares IS 'Social sharing of workouts between users';
COMMENT ON TABLE sync_metadata IS 'Metadata for offline sync and conflict resolution';