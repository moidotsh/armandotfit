-- Migration: Enhanced Exercise Database Schema
-- Adds new tables while preserving existing workout_sessions table

-- Body regions/categories
CREATE TABLE IF NOT EXISTS muscle_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Individual muscles within categories
CREATE TABLE IF NOT EXISTS muscles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  muscle_category_id UUID REFERENCES muscle_categories(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Equipment types
CREATE TABLE IF NOT EXISTS equipment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Base exercises (system + custom)
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  exercise_type VARCHAR(50) NOT NULL CHECK (exercise_type IN ('calisthenic', 'free_weight', 'cable', 'machine')),
  difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  instructions TEXT,
  tips TEXT,
  is_system_exercise BOOLEAN DEFAULT FALSE,
  created_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Junction table: exercises -> muscles (primary and secondary)
CREATE TABLE IF NOT EXISTS exercise_muscles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  muscle_id UUID REFERENCES muscles(id),
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(exercise_id, muscle_id)
);

-- Junction table: exercises -> equipment (multiple equipment per exercise)
CREATE TABLE IF NOT EXISTS exercise_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  equipment_type_id UUID REFERENCES equipment_types(id),
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(exercise_id, equipment_type_id)
);

-- User favorites
CREATE TABLE IF NOT EXISTS user_favorite_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

-- NEW workout sessions structure (only if you want to replace the existing one)
-- Skip this if you want to keep your current workout_sessions table
/*
CREATE TABLE IF NOT EXISTS workout_sessions_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(200),
  split_type VARCHAR(50),
  day_number INTEGER,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
*/

-- Exercises within workout sessions (with user customizations)
CREATE TABLE IF NOT EXISTS workout_session_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  order_in_workout INTEGER NOT NULL,
  user_grip VARCHAR(100),
  user_equipment_notes TEXT,
  target_rep_range VARCHAR(20),
  rest_timer_seconds INTEGER DEFAULT 60,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Individual sets within exercises
CREATE TABLE IF NOT EXISTS exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_session_exercise_id UUID REFERENCES workout_session_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  target_reps INTEGER,
  actual_reps INTEGER,
  weight DECIMAL(5,2),
  rep_range VARCHAR(20),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  rest_duration_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Exercise variations (for related exercises)
CREATE TABLE IF NOT EXISTS exercise_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  variation_exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  variation_type VARCHAR(50),
  difficulty_progression INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(base_exercise_id, variation_exercise_id)
);

-- User's available equipment (for exercise filtering)
CREATE TABLE IF NOT EXISTS user_available_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_type_id UUID REFERENCES equipment_types(id),
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, equipment_type_id)
);

-- Insert initial muscle categories (only if they don't exist)
INSERT INTO muscle_categories (name, display_name) 
SELECT * FROM (VALUES 
  ('arms', 'Arms'),
  ('back', 'Back'),
  ('chest', 'Chest'),
  ('shoulders', 'Shoulders'),
  ('core', 'Core'),
  ('upper_legs', 'Upper Legs'),
  ('lower_legs', 'Lower Legs'),
  ('full_body', 'Full Body')
) AS new_categories(name, display_name)
WHERE NOT EXISTS (SELECT 1 FROM muscle_categories WHERE muscle_categories.name = new_categories.name);

-- Insert muscles with their categories (only if they don't exist)
DO $$
BEGIN
  -- Arms
  IF NOT EXISTS (SELECT 1 FROM muscles WHERE name = 'biceps') THEN
    INSERT INTO muscles (name, display_name, muscle_category_id) VALUES
    ('biceps', 'Biceps', (SELECT id FROM muscle_categories WHERE name = 'arms')),
    ('triceps', 'Triceps', (SELECT id FROM muscle_categories WHERE name = 'arms')),
    ('forearms', 'Forearms', (SELECT id FROM muscle_categories WHERE name = 'arms'));
  END IF;

  -- Back
  IF NOT EXISTS (SELECT 1 FROM muscles WHERE name = 'lats') THEN
    INSERT INTO muscles (name, display_name, muscle_category_id) VALUES
    ('lats', 'Latissimus Dorsi', (SELECT id FROM muscle_categories WHERE name = 'back')),
    ('rhomboids', 'Rhomboids', (SELECT id FROM muscle_categories WHERE name = 'back')),
    ('traps', 'Trapezius', (SELECT id FROM muscle_categories WHERE name = 'back')),
    ('lower_back', 'Lower Back', (SELECT id FROM muscle_categories WHERE name = 'back')),
    ('rear_delts', 'Rear Deltoids', (SELECT id FROM muscle_categories WHERE name = 'back'));
  END IF;

  -- Chest
  IF NOT EXISTS (SELECT 1 FROM muscles WHERE name = 'chest_upper') THEN
    INSERT INTO muscles (name, display_name, muscle_category_id) VALUES
    ('chest_upper', 'Upper Chest', (SELECT id FROM muscle_categories WHERE name = 'chest')),
    ('chest_middle', 'Middle Chest', (SELECT id FROM muscle_categories WHERE name = 'chest')),
    ('chest_lower', 'Lower Chest', (SELECT id FROM muscle_categories WHERE name = 'chest'));
  END IF;

  -- Shoulders
  IF NOT EXISTS (SELECT 1 FROM muscles WHERE name = 'front_delts') THEN
    INSERT INTO muscles (name, display_name, muscle_category_id) VALUES
    ('front_delts', 'Front Deltoids', (SELECT id FROM muscle_categories WHERE name = 'shoulders')),
    ('side_delts', 'Side Deltoids', (SELECT id FROM muscle_categories WHERE name = 'shoulders'));
  END IF;

  -- Core
  IF NOT EXISTS (SELECT 1 FROM muscles WHERE name = 'abs') THEN
    INSERT INTO muscles (name, display_name, muscle_category_id) VALUES
    ('abs', 'Abdominals', (SELECT id FROM muscle_categories WHERE name = 'core')),
    ('obliques', 'Obliques', (SELECT id FROM muscle_categories WHERE name = 'core'));
  END IF;

  -- Upper Legs
  IF NOT EXISTS (SELECT 1 FROM muscles WHERE name = 'quadriceps') THEN
    INSERT INTO muscles (name, display_name, muscle_category_id) VALUES
    ('quadriceps', 'Quadriceps', (SELECT id FROM muscle_categories WHERE name = 'upper_legs')),
    ('hamstrings', 'Hamstrings', (SELECT id FROM muscle_categories WHERE name = 'upper_legs')),
    ('glutes', 'Glutes', (SELECT id FROM muscle_categories WHERE name = 'upper_legs')),
    ('hip_flexors', 'Hip Flexors', (SELECT id FROM muscle_categories WHERE name = 'upper_legs'));
  END IF;

  -- Lower Legs
  IF NOT EXISTS (SELECT 1 FROM muscles WHERE name = 'calves') THEN
    INSERT INTO muscles (name, display_name, muscle_category_id) VALUES
    ('calves', 'Calves', (SELECT id FROM muscle_categories WHERE name = 'lower_legs')),
    ('shins', 'Shins', (SELECT id FROM muscle_categories WHERE name = 'lower_legs'));
  END IF;
END $$;

-- Insert equipment types (only if they don't exist)
INSERT INTO equipment_types (name, display_name, category)
SELECT * FROM (VALUES
  -- Free weights
  ('barbell', 'Barbell', 'free_weight'),
  ('dumbbell', 'Dumbbell', 'free_weight'),
  ('kettlebell', 'Kettlebell', 'free_weight'),
  ('weight_plate', 'Weight Plate', 'free_weight'),

  -- Machines
  ('leg_press_machine', 'Leg Press Machine', 'machine'),
  ('lat_pulldown_machine', 'Lat Pulldown Machine', 'machine'),
  ('chest_press_machine', 'Chest Press Machine', 'machine'),
  ('shoulder_press_machine', 'Shoulder Press Machine', 'machine'),
  ('leg_curl_machine', 'Leg Curl Machine', 'machine'),
  ('leg_extension_machine', 'Leg Extension Machine', 'machine'),
  ('calf_raise_machine', 'Calf Raise Machine', 'machine'),
  ('smith_machine', 'Smith Machine', 'machine'),

  -- Cable equipment
  ('cable_machine', 'Cable Machine', 'cable'),
  ('cable_crossover', 'Cable Crossover', 'cable'),

  -- Accessories
  ('bench_flat', 'Flat Bench', 'accessory'),
  ('bench_incline', 'Incline Bench', 'accessory'),
  ('bench_decline', 'Decline Bench', 'accessory'),
  ('preacher_bench', 'Preacher Bench', 'accessory'),
  ('squat_rack', 'Squat Rack', 'accessory'),
  ('power_rack', 'Power Rack', 'accessory'),
  ('pull_up_bar', 'Pull-up Bar', 'accessory'),
  ('dip_bars', 'Dip Bars', 'accessory'),

  -- Bodyweight
  ('bodyweight', 'Bodyweight', 'calisthenic')
) AS new_equipment(name, display_name, category)
WHERE NOT EXISTS (SELECT 1 FROM equipment_types WHERE equipment_types.name = new_equipment.name);

-- Enable Row Level Security on new tables
ALTER TABLE muscle_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE muscles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_muscles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorite_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_session_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_variations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_available_equipment ENABLE ROW LEVEL SECURITY;

-- Create policies for exercises (system exercises are readable by all, custom exercises only by creator)
CREATE POLICY "System exercises are viewable by everyone" ON exercises
  FOR SELECT USING (is_system_exercise = true);

CREATE POLICY "Users can view own custom exercises" ON exercises
  FOR SELECT USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can create custom exercises" ON exercises
  FOR INSERT WITH CHECK (created_by_user_id = auth.uid() AND is_system_exercise = false);

CREATE POLICY "Users can update own custom exercises" ON exercises
  FOR UPDATE USING (created_by_user_id = auth.uid() AND is_system_exercise = false);

CREATE POLICY "Users can delete own custom exercises" ON exercises
  FOR DELETE USING (created_by_user_id = auth.uid() AND is_system_exercise = false);

-- Create policies for user-specific tables
CREATE POLICY "Users can manage own favorites" ON user_favorite_exercises
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage own equipment" ON user_available_equipment
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage own workout session exercises" ON workout_session_exercises
  FOR ALL USING (
    workout_session_id IN (
      SELECT id FROM workout_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own exercise sets" ON exercise_sets
  FOR ALL USING (
    workout_session_exercise_id IN (
      SELECT wse.id FROM workout_session_exercises wse
      JOIN workout_sessions ws ON wse.workout_session_id = ws.id
      WHERE ws.user_id = auth.uid()
    )
  );

-- Public read access to reference tables
CREATE POLICY "Reference tables are readable by all" ON muscle_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Reference tables are readable by all" ON muscles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Reference tables are readable by all" ON equipment_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Reference tables are readable by all" ON exercise_muscles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Reference tables are readable by all" ON exercise_equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Reference tables are readable by all" ON exercise_variations FOR SELECT TO authenticated USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_muscles_category ON muscles(muscle_category_id);
CREATE INDEX IF NOT EXISTS idx_exercise_muscles_exercise ON exercise_muscles(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_muscles_muscle ON exercise_muscles(muscle_id);
CREATE INDEX IF NOT EXISTS idx_exercise_equipment_exercise ON exercise_equipment(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_equipment_equipment ON exercise_equipment(equipment_type_id);
CREATE INDEX IF NOT EXISTS idx_exercises_type ON exercises(exercise_type);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_exercises_user ON exercises(created_by_user_id);
CREATE INDEX IF NOT EXISTS idx_workout_session_exercises_session ON workout_session_exercises(workout_session_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_session_exercise ON exercise_sets(workout_session_exercise_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorite_exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_user_equipment_user ON user_available_equipment(user_id);