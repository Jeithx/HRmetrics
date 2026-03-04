import { getDatabase } from './database';
import {
  Exercise,
  Routine,
  RoutineDay,
  RoutineDayExercise,
  Workout,
  WorkoutSet,
  BodyWeightEntry,
  PersonalRecord,
} from '../types';

interface RawWaterEntry {
  id: number;
  amount_ml: number;
  recorded_at: string;
  notes: string | null;
}

interface AppSetting {
  key: string;
  value: string;
}

export interface BackupData {
  version: 1;
  exportedAt: string;
  exercises: Exercise[];
  routines: Routine[];
  routineDays: RoutineDay[];
  routineDayExercises: RoutineDayExercise[];
  workouts: Workout[];
  workoutSets: WorkoutSet[];
  bodyWeightEntries: BodyWeightEntry[];
  waterEntries: RawWaterEntry[];
  personalRecords: PersonalRecord[];
  appSettings: AppSetting[];
}

export function exportFullBackup(): BackupData {
  const db = getDatabase();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    exercises: db.getAllSync<Exercise>('SELECT * FROM exercises ORDER BY id'),
    routines: db.getAllSync<Routine>('SELECT * FROM routines ORDER BY id'),
    routineDays: db.getAllSync<RoutineDay>('SELECT * FROM routine_days ORDER BY id'),
    routineDayExercises: db.getAllSync<RoutineDayExercise>(
      'SELECT * FROM routine_day_exercises ORDER BY id'
    ),
    workouts: db.getAllSync<Workout>('SELECT * FROM workouts ORDER BY id'),
    workoutSets: db.getAllSync<WorkoutSet>('SELECT * FROM workout_sets ORDER BY id'),
    bodyWeightEntries: db.getAllSync<BodyWeightEntry>(
      'SELECT * FROM body_weight_entries ORDER BY id'
    ),
    waterEntries: db.getAllSync<RawWaterEntry>(
      'SELECT * FROM water_intake_entries ORDER BY id'
    ),
    personalRecords: db.getAllSync<PersonalRecord>(
      'SELECT * FROM personal_records ORDER BY id'
    ),
    appSettings: db.getAllSync<AppSetting>('SELECT * FROM app_settings ORDER BY key'),
  };
}

const ARRAY_KEYS = [
  'exercises',
  'routines',
  'routineDays',
  'routineDayExercises',
  'workouts',
  'workoutSets',
  'bodyWeightEntries',
  'waterEntries',
  'personalRecords',
  'appSettings',
] as const;

function isValidBackup(raw: unknown): raw is BackupData {
  if (typeof raw !== 'object' || raw === null) return false;
  const obj = raw as Record<string, unknown>;
  if (obj['version'] !== 1) return false;
  if (typeof obj['exportedAt'] !== 'string') return false;
  for (const key of ARRAY_KEYS) {
    if (!Array.isArray(obj[key])) return false;
  }
  return true;
}

export function importFullBackup(raw: unknown): { success: boolean; error?: string } {
  if (!isValidBackup(raw)) {
    return { success: false, error: 'Invalid backup file' };
  }

  const data = raw;
  const db = getDatabase();

  try {
    db.execSync('BEGIN TRANSACTION');

    // Delete in dependency order (most-dependent first)
    db.runSync('DELETE FROM workout_sets');
    db.runSync('DELETE FROM personal_records');
    db.runSync('DELETE FROM workouts');
    db.runSync('DELETE FROM routine_day_exercises');
    db.runSync('DELETE FROM routine_days');
    db.runSync('DELETE FROM routines');
    db.runSync('DELETE FROM body_weight_entries');
    db.runSync('DELETE FROM water_intake_entries');
    db.runSync('DELETE FROM exercises WHERE is_custom = 1');

    // Insert custom exercises from backup (defaults are always seeded)
    for (const e of data.exercises) {
      if (e.is_custom === 1) {
        db.runSync(
          'INSERT INTO exercises (id, name, muscle_group, is_custom) VALUES (?, ?, ?, 1)',
          [e.id, e.name, e.muscle_group]
        );
      }
    }

    for (const r of data.routines) {
      db.runSync(
        'INSERT INTO routines (id, name, days_per_week, created_at) VALUES (?, ?, ?, ?)',
        [r.id, r.name, r.days_per_week, r.created_at]
      );
    }

    for (const rd of data.routineDays) {
      db.runSync(
        'INSERT INTO routine_days (id, routine_id, day_order, name) VALUES (?, ?, ?, ?)',
        [rd.id, rd.routine_id, rd.day_order, rd.name]
      );
    }

    for (const rde of data.routineDayExercises) {
      db.runSync(
        'INSERT INTO routine_day_exercises (id, routine_day_id, exercise_id, order_index, target_sets, target_reps, target_weight) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          rde.id,
          rde.routine_day_id,
          rde.exercise_id,
          rde.order_index,
          rde.target_sets,
          rde.target_reps,
          rde.target_weight,
        ]
      );
    }

    for (const w of data.workouts) {
      db.runSync(
        'INSERT INTO workouts (id, routine_day_id, started_at, finished_at, notes) VALUES (?, ?, ?, ?, ?)',
        [w.id, w.routine_day_id, w.started_at, w.finished_at, w.notes]
      );
    }

    for (const ws of data.workoutSets) {
      db.runSync(
        'INSERT INTO workout_sets (id, workout_id, exercise_id, set_number, weight_kg, reps, completed, rpe) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          ws.id,
          ws.workout_id,
          ws.exercise_id,
          ws.set_number,
          ws.weight_kg,
          ws.reps,
          ws.completed,
          ws.rpe,
        ]
      );
    }

    for (const bw of data.bodyWeightEntries) {
      db.runSync(
        'INSERT INTO body_weight_entries (id, weight_kg, recorded_at, notes) VALUES (?, ?, ?, ?)',
        [bw.id, bw.weight_kg, bw.recorded_at, bw.notes]
      );
    }

    for (const we of data.waterEntries) {
      db.runSync(
        'INSERT INTO water_intake_entries (id, amount_ml, recorded_at, notes) VALUES (?, ?, ?, ?)',
        [we.id, we.amount_ml, we.recorded_at, we.notes]
      );
    }

    for (const pr of data.personalRecords) {
      db.runSync(
        'INSERT INTO personal_records (id, exercise_id, weight_kg, reps, estimated_1rm, achieved_at) VALUES (?, ?, ?, ?, ?, ?)',
        [pr.id, pr.exercise_id, pr.weight_kg, pr.reps, pr.estimated_1rm, pr.achieved_at]
      );
    }

    for (const s of data.appSettings) {
      db.runSync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [
        s.key,
        s.value,
      ]);
    }

    db.execSync('COMMIT');
    return { success: true };
  } catch (e) {
    try {
      db.execSync('ROLLBACK');
    } catch {
      // ignore rollback error
    }
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error during import',
    };
  }
}
