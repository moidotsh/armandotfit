// shared/exercises/index.ts
// Barrel for the exercise-data sub-module. The canonical types live in
// shared/types/exercise.ts; this folder holds the canonical *data*
// (system exercise library + split-day assignments) that seeds the DB
// and feeds the suggested-exercises picker.

export * from './splits';
export * from './data';
