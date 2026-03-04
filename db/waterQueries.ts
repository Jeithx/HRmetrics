import { getDatabase, isDbReady } from './database';
import { WaterEntry, WaterDaySummary, WaterStats } from '../types';

function localDateStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function localISOStr(): string {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 19);
}

function rowToEntry(r: { id: number; amount_ml: number; recorded_at: string; notes: string | null }): WaterEntry {
  return { id: r.id, amountMl: r.amount_ml, recordedAt: r.recorded_at, notes: r.notes };
}

export function insertWaterEntry(amountMl: number, notes?: string): number {
  if (!isDbReady()) return -1;
  const db = getDatabase();
  const result = db.runSync(
    'INSERT INTO water_intake_entries (amount_ml, recorded_at, notes) VALUES (?, ?, ?)',
    [amountMl, localISOStr(), notes ?? null]
  );
  return result.lastInsertRowId;
}

export function getWaterEntriesToday(): WaterEntry[] {
  if (!isDbReady()) return [];
  const db = getDatabase();
  const rows = db.getAllSync<{ id: number; amount_ml: number; recorded_at: string; notes: string | null }>(
    `SELECT id, amount_ml, recorded_at, notes FROM water_intake_entries
     WHERE substr(recorded_at, 1, 10) = ?
     ORDER BY recorded_at DESC`,
    [localDateStr()]
  );
  return rows.map(rowToEntry);
}

export function getTodaysTotalMl(): number {
  if (!isDbReady()) return 0;
  const db = getDatabase();
  const row = db.getFirstSync<{ total: number }>(
    `SELECT COALESCE(SUM(amount_ml), 0) as total FROM water_intake_entries
     WHERE substr(recorded_at, 1, 10) = ?`,
    [localDateStr()]
  );
  return row?.total ?? 0;
}

export function getWaterEntriesByDate(date: string): WaterEntry[] {
  if (!isDbReady()) return [];
  const db = getDatabase();
  const rows = db.getAllSync<{ id: number; amount_ml: number; recorded_at: string; notes: string | null }>(
    `SELECT id, amount_ml, recorded_at, notes FROM water_intake_entries
     WHERE substr(recorded_at, 1, 10) = ?
     ORDER BY recorded_at DESC`,
    [date]
  );
  return rows.map(rowToEntry);
}

export function getWaterHistory(limit: number, offset: number): WaterDaySummary[] {
  if (!isDbReady()) return [];
  const db = getDatabase();
  return db.getAllSync<WaterDaySummary>(
    `SELECT substr(recorded_at, 1, 10) as date, SUM(amount_ml) as totalMl
     FROM water_intake_entries
     GROUP BY substr(recorded_at, 1, 10)
     ORDER BY date DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );
}

export function getWaterRange(startDate: string, endDate: string): WaterDaySummary[] {
  if (!isDbReady()) return [];
  const db = getDatabase();
  return db.getAllSync<WaterDaySummary>(
    `SELECT substr(recorded_at, 1, 10) as date, SUM(amount_ml) as totalMl
     FROM water_intake_entries
     WHERE substr(recorded_at, 1, 10) BETWEEN ? AND ?
     GROUP BY substr(recorded_at, 1, 10)
     ORDER BY date ASC`,
    [startDate, endDate]
  );
}

export function deleteWaterEntry(id: number): void {
  if (!isDbReady()) return;
  const db = getDatabase();
  db.runSync('DELETE FROM water_intake_entries WHERE id = ?', [id]);
}

export function getWaterStreak(goalMl: number): number {
  if (!isDbReady()) return 0;
  const db = getDatabase();
  const today = localDateStr();
  const rows = db.getAllSync<{ date: string; total: number }>(
    `SELECT substr(recorded_at, 1, 10) as date, SUM(amount_ml) as total
     FROM water_intake_entries
     WHERE substr(recorded_at, 1, 10) <= ?
     GROUP BY substr(recorded_at, 1, 10)
     ORDER BY date DESC`,
    [today]
  );
  const goalDates = new Set(rows.filter((r) => r.total >= goalMl).map((r) => r.date));

  let streak = 0;
  const checkDate = new Date();
  if (!goalDates.has(today)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  while (true) {
    const y = checkDate.getFullYear();
    const m = String(checkDate.getMonth() + 1).padStart(2, '0');
    const d = String(checkDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    if (goalDates.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function getWaterStats(goalMl: number): WaterStats {
  if (!isDbReady()) return { todayTotal: 0, sevenDayAvg: 0, thirtyDayAvg: 0, bestDay: null, currentStreak: 0 };
  const db = getDatabase();
  const today = localDateStr();

  const todayRow = db.getFirstSync<{ total: number }>(
    `SELECT COALESCE(SUM(amount_ml), 0) as total FROM water_intake_entries
     WHERE substr(recorded_at, 1, 10) = ?`,
    [today]
  );

  const sevenRow = db.getFirstSync<{ avg: number }>(
    `SELECT COALESCE(AVG(daily), 0) as avg FROM (
       SELECT SUM(amount_ml) as daily FROM water_intake_entries
       WHERE substr(recorded_at, 1, 10) < ?
       GROUP BY substr(recorded_at, 1, 10)
       ORDER BY substr(recorded_at, 1, 10) DESC
       LIMIT 7
     )`,
    [today]
  );

  const thirtyRow = db.getFirstSync<{ avg: number }>(
    `SELECT COALESCE(AVG(daily), 0) as avg FROM (
       SELECT SUM(amount_ml) as daily FROM water_intake_entries
       WHERE substr(recorded_at, 1, 10) < ?
       GROUP BY substr(recorded_at, 1, 10)
       ORDER BY substr(recorded_at, 1, 10) DESC
       LIMIT 30
     )`,
    [today]
  );

  const bestRow = db.getFirstSync<{ date: string; amount: number }>(
    `SELECT substr(recorded_at, 1, 10) as date, SUM(amount_ml) as amount
     FROM water_intake_entries
     GROUP BY substr(recorded_at, 1, 10)
     ORDER BY amount DESC
     LIMIT 1`
  );

  return {
    todayTotal: todayRow?.total ?? 0,
    sevenDayAvg: Math.round(sevenRow?.avg ?? 0),
    thirtyDayAvg: Math.round(thirtyRow?.avg ?? 0),
    bestDay: bestRow ? { date: bestRow.date, amount: bestRow.amount } : null,
    currentStreak: getWaterStreak(goalMl),
  };
}
