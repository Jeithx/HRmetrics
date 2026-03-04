import { create } from 'zustand';
import {
  insertWaterEntry,
  getWaterEntriesToday,
  getTodaysTotalMl,
  getWaterHistory,
  getWaterStats,
  deleteWaterEntry,
} from '../db/waterQueries';
import { getSetting, setSetting } from '../db/settingsQueries';
import { WaterEntry, WaterDaySummary, WaterStats } from '../types';
import type { WaterUnit } from '../utils/waterUtils';

interface WaterStore {
  todayEntries: WaterEntry[];
  todayTotal: number;
  dailyGoalMl: number;
  history: WaterDaySummary[];
  stats: WaterStats | null;
  waterUnit: WaterUnit;
  isLoading: boolean;
  logWater: (amountMl: number, notes?: string) => void;
  deleteEntry: (id: number) => void;
  loadToday: () => void;
  loadHistory: () => void;
  loadStats: () => void;
  setDailyGoal: (ml: number) => void;
  loadSettings: () => void;
  setWaterUnit: (unit: WaterUnit) => void;
}

export const useWaterStore = create<WaterStore>((set, get) => ({
  todayEntries: [],
  todayTotal: 0,
  dailyGoalMl: 2500,
  history: [],
  stats: null,
  waterUnit: 'ml',
  isLoading: false,

  logWater: (amountMl, notes) => {
    try {
      insertWaterEntry(amountMl, notes);
      const todayEntries = getWaterEntriesToday();
      const todayTotal = getTodaysTotalMl();
      set({ todayEntries, todayTotal });
    } catch (e) {
      console.error('logWater failed:', e);
    }
  },

  deleteEntry: (id) => {
    try {
      deleteWaterEntry(id);
      const todayEntries = getWaterEntriesToday();
      const todayTotal = getTodaysTotalMl();
      set({ todayEntries, todayTotal });
    } catch (e) {
      console.error('deleteEntry failed:', e);
    }
  },

  loadToday: () => {
    try {
      const todayEntries = getWaterEntriesToday();
      const todayTotal = getTodaysTotalMl();
      set({ todayEntries, todayTotal });
    } catch (e) {
      console.error('loadToday failed:', e);
    }
  },

  loadHistory: () => {
    try {
      const history = getWaterHistory(30, 0);
      set({ history });
    } catch (e) {
      console.error('loadHistory failed:', e);
    }
  },

  loadStats: () => {
    try {
      const { dailyGoalMl } = get();
      const stats = getWaterStats(dailyGoalMl);
      set({ stats });
    } catch (e) {
      console.error('loadStats failed:', e);
    }
  },

  setDailyGoal: (ml) => {
    try {
      setSetting('daily_water_goal_ml', String(ml));
      set({ dailyGoalMl: ml });
    } catch (e) {
      console.error('setDailyGoal failed:', e);
    }
  },

  loadSettings: () => {
    try {
      const goalStr = getSetting('daily_water_goal_ml');
      const unitStr = getSetting('water_unit');
      const dailyGoalMl = goalStr ? parseInt(goalStr, 10) : 2500;
      const waterUnit: WaterUnit = unitStr === 'oz' ? 'oz' : 'ml';
      set({ dailyGoalMl, waterUnit });
    } catch (e) {
      console.error('loadSettings failed:', e);
    }
  },

  setWaterUnit: (unit) => {
    try {
      setSetting('water_unit', unit);
      set({ waterUnit: unit });
    } catch (e) {
      console.error('setWaterUnit failed:', e);
    }
  },
}));
