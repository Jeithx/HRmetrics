import { useRoutineStore } from '../store/useRoutineStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { useBodyWeightStore } from '../store/useBodyWeightStore';
import { useWaterStore } from '../store/useWaterStore';
import { useExerciseStore } from '../store/useExerciseStore';

export function reloadAllStores(): void {
  useExerciseStore.getState().loadExercises();
  useRoutineStore.getState().loadRoutines();
  useRoutineStore.getState().loadTodaysDay();
  useHistoryStore.getState().loadWorkouts(true);
  useHistoryStore.getState().loadPRs();
  useHistoryStore.getState().loadStats();
  useBodyWeightStore.getState().loadEntries();
  useBodyWeightStore.getState().loadStats();
  useBodyWeightStore.getState().loadPhaseInfo();
  useWaterStore.getState().loadSettings();
  useWaterStore.getState().loadToday();
}
