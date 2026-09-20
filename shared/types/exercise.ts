// shared/types/exercise.ts
// Catalog display enums. The exercises DB table stores only id + name
// (coarse identity); every display attribute (muscles, equipment,
// instructions, defaults) lives in shared/exercises/data.ts, which is
// the sole display source.

/** Display-only exercise type filter for the browse UI. */
export type ExerciseType = 'calisthenic' | 'free_weight' | 'cable' | 'machine' | 'cardio';

/** Display-only difficulty label. */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
