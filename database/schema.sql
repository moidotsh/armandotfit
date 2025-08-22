-- Enhanced Exercise Database Schema
-- Clean implementation-ready version

-- Body regions/categories
CREATE TABLE muscle_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Individual muscles within categories
CREATE TABLE muscles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  muscle_category_id UUID REFERENCES muscle_categories(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Equipment types
CREATE TABLE equipment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Base exercises (system + custom)
CREATE TABLE exercises (
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
CREATE TABLE exercise_muscles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  muscle_id UUID REFERENCES muscles(id),
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(exercise_id, muscle_id)
);

-- Junction table: exercises -> equipment (multiple equipment per exercise)
CREATE TABLE exercise_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  equipment_type_id UUID REFERENCES equipment_types(id),
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(exercise_id, equipment_type_id)
);

-- User favorites
CREATE TABLE user_favorite_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, exercise_id)
);

-- Workout sessions
CREATE TABLE workout_sessions (
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

-- Exercises within workout sessions (with user customizations)
CREATE TABLE workout_session_exercises (
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
CREATE TABLE exercise_sets (
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
CREATE TABLE exercise_variations (
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
CREATE TABLE user_available_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_type_id UUID REFERENCES equipment_types(id),
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, equipment_type_id)
);

-- Insert initial muscle categories
INSERT INTO muscle_categories (name, display_name) VALUES
('arms', 'Arms'),
('back', 'Back'),
('chest', 'Chest'),
('shoulders', 'Shoulders'),
('core', 'Core'),
('upper_legs', 'Upper Legs'),
('lower_legs', 'Lower Legs'),
('full_body', 'Full Body');

-- Insert muscles with their categories
INSERT INTO muscles (name, display_name, muscle_category_id) VALUES
-- Arms
('biceps', 'Biceps', (SELECT id FROM muscle_categories WHERE name = 'arms')),
('triceps', 'Triceps', (SELECT id FROM muscle_categories WHERE name = 'arms')),
('forearms', 'Forearms', (SELECT id FROM muscle_categories WHERE name = 'arms')),

-- Back
('lats', 'Latissimus Dorsi', (SELECT id FROM muscle_categories WHERE name = 'back')),
('rhomboids', 'Rhomboids', (SELECT id FROM muscle_categories WHERE name = 'back')),
('traps', 'Trapezius', (SELECT id FROM muscle_categories WHERE name = 'back')),
('lower_back', 'Lower Back', (SELECT id FROM muscle_categories WHERE name = 'back')),
('rear_delts', 'Rear Deltoids', (SELECT id FROM muscle_categories WHERE name = 'back')),

-- Chest
('chest_upper', 'Upper Chest', (SELECT id FROM muscle_categories WHERE name = 'chest')),
('chest_middle', 'Middle Chest', (SELECT id FROM muscle_categories WHERE name = 'chest')),
('chest_lower', 'Lower Chest', (SELECT id FROM muscle_categories WHERE name = 'chest')),

-- Shoulders
('front_delts', 'Front Deltoids', (SELECT id FROM muscle_categories WHERE name = 'shoulders')),
('side_delts', 'Side Deltoids', (SELECT id FROM muscle_categories WHERE name = 'shoulders')),

-- Core
('abs', 'Abdominals', (SELECT id FROM muscle_categories WHERE name = 'core')),
('obliques', 'Obliques', (SELECT id FROM muscle_categories WHERE name = 'core')),

-- Upper Legs
('quadriceps', 'Quadriceps', (SELECT id FROM muscle_categories WHERE name = 'upper_legs')),
('hamstrings', 'Hamstrings', (SELECT id FROM muscle_categories WHERE name = 'upper_legs')),
('glutes', 'Glutes', (SELECT id FROM muscle_categories WHERE name = 'upper_legs')),
('hip_flexors', 'Hip Flexors', (SELECT id FROM muscle_categories WHERE name = 'upper_legs')),

-- Lower Legs
('calves', 'Calves', (SELECT id FROM muscle_categories WHERE name = 'lower_legs')),
('shins', 'Shins', (SELECT id FROM muscle_categories WHERE name = 'lower_legs'));

-- Insert equipment types
INSERT INTO equipment_types (name, display_name, category) VALUES
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
('bodyweight', 'Bodyweight', 'calisthenic');