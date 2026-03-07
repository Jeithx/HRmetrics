# HRmetrics

A minimalist, fully offline workout tracking app for Android. No accounts, no cloud, no subscriptions — your data stays on your device.

---

## Features

### Workout Tracking
- Start workouts from your active routine or freestyle
- Track sets, reps, and weight per exercise
- Rest timer with background notifications and SVG ring animation
- Drag-to-reorder exercises during a workout
- Personal record detection (Epley formula) with PR celebration overlay on finish
- Post-workout summary screen (duration, volume, new PRs)

### Routine Management
- Create routines with custom named training days
- Built-in templates: PPL (6-day), Upper/Lower (4-day), Full Body (3-day), StrongLifts 5×5 (3-day)
- Cycle-based day progression — automatically advances to next non-rest day
- Skip and swap day support

### History & Progress
- Paginated workout history with swipe-to-delete
- Per-exercise progress charts (SVG line chart, estimated 1RM over time)
- Personal records board grouped by muscle group
- 8-week volume bar chart
- 30-day muscle group distribution chart

### Body Weight Tracking
- Log daily weight with optional notes
- SVG chart: raw entries, moving average (7/14/30-day), goal line, phase start marker
- Cut / Bulk / Maintain phase support with goal weight tracking
- Phase badge on home screen

### Water Intake Tracking
- Animated SVG ring progress toward daily goal
- Quick-add buttons (+250ml, +500ml)
- 14-day bar chart + day detail modal
- Daily goal and unit (ml / oz) configurable in Settings
- Water card on home screen with quick-log buttons

### REX — Insight Engine
- Rule-based offline insight engine (no AI API, no network)
- 24 rules across 5 categories: workout, weight, water, recovery, milestone
- Animated SVG mascot with mood based on top insight:
  - **Excited** — new PR, milestone, streak, goal reached, cut/bulk on track
  - **Thinking** — plateau, volume drop, overtraining risk, poor hydration, missed days
  - **Happy** — no issues detected (everything looks good)
  - **Neutral** — informational insights (long session, daily variance)
- Blink on tap, idle float, bounce on new insights
- Max 3 insights shown per day; dismissed insights permanently hidden; recently shown suppressed for 3 days
- REX detail screen: all insights + weekly summary (workouts / volume / water / body weight change)

### Exercise Library
- 150+ built-in exercises across all muscle groups
- Directional cable variants (Low to High, High to Low, Mid)
- Machine, DB, barbell, cable, bodyweight, and Smith machine variants
- Custom exercise creation, editing, and deletion
- "Custom" badge in exercise picker

### Backup & Restore
- Full database export as JSON (all workouts, routines, body weight, water, PRs, settings)
- Import from JSON file to restore all data
- Last backup date tracked in settings

### Settings
- Weight unit: kg / lbs (stored in kg, converted at display time)
- Rest timer duration presets
- Water daily goal and ml/oz toggle
- Scheduled reminders: workout, water, weight logging (expo-notifications)
- CSV export of workouts and body weight history
- Clear all user data
- Manage custom exercises

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native + Expo SDK ~55 |
| Language | TypeScript (strict) |
| Navigation | Expo Router (file-based) |
| Database | expo-sqlite (synchronous API) |
| State | Zustand 5.x |
| Animations | react-native-reanimated |
| Charts | react-native-svg (custom — no charting library) |
| Haptics | expo-haptics |
| Icons | @expo/vector-icons (Ionicons) |
| Notifications | expo-notifications ~55.0.10 |
| File system | expo-file-system/legacy + expo-sharing |
| Drag & drop | react-native-draggable-flatlist |
| Document pick | expo-document-picker |

---

## Getting Started

### Install
```bash
npm install --legacy-peer-deps
```

### Run (development)
```bash
npx expo start
```

Scan the QR code with Expo Go, or press `a` to open on a connected Android device.

### Build APK (sideload / test)
```bash
eas build --platform android --profile preview
```

### Build AAB (Play Store)
```bash
eas build --platform android --profile production
```

---

## Project Structure

```
app/
  _layout.tsx                  # Root stack, DB init, notification listeners, Toast
  onboarding.tsx               # First-launch onboarding (3 swipeable cards)
  rex.tsx                      # REX detail screen (all insights + weekly summary)
  (tabs)/
    _layout.tsx                # Bottom tab bar (4 tabs)
    index.tsx                  # Home: today's card, body weight, water, last workout, REX
    routines.tsx               # Routine list with active badge
    history.tsx                # Workouts / Progress / Records / Water tabs
    settings.tsx               # All settings
  workout/
    active.tsx                 # Active workout (DraggableFlatList, rest timer, sets)
    summary.tsx                # Post-workout summary with PR overlay
  routines/
    builder.tsx                # 2-step routine builder (template → day names)
    day-editor.tsx             # Per-day exercise editor
    [id].tsx                   # Routine detail / inline edit / set-active
  history/[id].tsx             # Read-only workout detail
  bodyweight/index.tsx         # Body weight chart and log
  water/index.tsx              # Water intake screen
  exercises/index.tsx          # Custom exercise management
  settings/
    backup.tsx                 # Backup & restore
    notifications.tsx          # Reminder settings

components/
  ExercisePicker.tsx           # Searchable + grouped exercise modal
  RestTimer.tsx                # SVG ring countdown (red at ≤10s)
  RexMascot.tsx                # Animated SVG robot face with moods
  StatsOverview.tsx            # Horizontal scrollable stat cards
  WeeklyVolumeChart.tsx        # 8-week bar chart (View-based)
  MuscleGroupChart.tsx         # 30-day muscle group bars
  PhaseSelector.tsx            # Cut / Bulk / Maintain bottom sheet
  ExerciseFormModal.tsx        # Create / edit custom exercise
  Toast.tsx                    # Global slide-up toast (Reanimated)
  SkeletonLoader.tsx           # Shimmer loading placeholders
  PROverlay.tsx                # Sequential PR celebration overlay

db/
  database.ts                  # Schema creation + exercise seeding + migration
  workoutQueries.ts            # Workout CRUD + PR detection (Epley)
  routineQueries.ts            # Routine CRUD + template application
  historyQueries.ts            # History, charts, stats, PR queries
  bodyWeightQueries.ts         # Body weight CRUD + stats + moving average
  waterQueries.ts              # Water intake CRUD + stats + streak
  settingsQueries.ts           # Key-value settings + phase info
  exerciseQueries.ts           # Custom exercise CRUD + usage check
  backupQueries.ts             # Full DB export / import (JSON)
  exportQueries.ts             # CSV export + clear all data

store/
  useWorkoutStore.ts           # Active workout state + timestamp timer
  useRoutineStore.ts           # Routines + active day + skip/swap
  useHistoryStore.ts           # Workout history (paginated) + PRs + stats
  useBodyWeightStore.ts        # Body weight entries + stats + phase
  useWaterStore.ts             # Water entries + goal + unit
  useExerciseStore.ts          # Exercise list (built-in + custom)
  useInsightStore.ts           # REX insight generation + dismiss tracking
  useToastStore.ts             # Global toast state

utils/
  insightEngine.ts             # Pure rule-based insight engine (24 rules)
  weightUtils.ts               # kg ↔ lbs conversion + volume formatting
  waterUtils.ts                # ml ↔ oz conversion + formatting
  notificationService.ts       # Expo notification helpers (reminders + workout/rest)
  reloadAllStores.ts           # Reload all stores after backup restore

constants/
  theme.ts                     # Colors, Spacing, Typography, BorderRadius
  routineTemplates.ts          # Built-in routine template definitions

types/index.ts                 # All shared TypeScript types
```

---

## Database

**File:** `hrmetrics.db` (expo-sqlite, WAL mode, foreign keys ON)

### Tables

| Table | Description |
|---|---|
| `exercises` | Built-in and custom exercises |
| `routines` | Routine definitions |
| `routine_days` | Named days within a routine |
| `routine_day_exercises` | Exercise assignments per day (order, target sets/reps/weight) |
| `workouts` | Workout sessions (started_at, finished_at) |
| `workout_sets` | Individual sets (weight_kg, reps, completed, rpe) |
| `body_weight_entries` | Daily body weight log |
| `personal_records` | PR history per exercise (weight, reps, estimated 1RM) |
| `water_intake_entries` | Water intake log (amount_ml, recorded_at) |
| `app_settings` | Key-value store for all user preferences |

### Initialization Pattern
`getDatabase()` calls `runSchemaSync()` on first open — all tables and setting defaults are created **synchronously** before any component renders. `initializeDatabase()` only performs the async exercise seed step and sets `dbInitialized = true`.

### Personal Records
Computed with the **Epley formula**: `estimated 1RM = weight_kg × (1 + reps / 30)`

---

## Design System

| Token | Value |
|---|---|
| Background | `#0F0F0F` |
| Surface | `#1A1A1A` |
| Surface Elevated | `#242424` |
| Primary | `#C8FF00` (lime) |
| Text | `#FFFFFF` |
| Text Secondary | `#888888` |
| Error | `#FF4444` |
| Success | `#00C851` |
| Water accent | `#4FC3F7` |

- Dark theme only
- No third-party UI component libraries — all components custom-built
- Charts built with react-native-svg and View-based flex bars

---

## Principles

- **Offline first** — no backend, no accounts, no telemetry, no network calls
- **Data ownership** — full backup and restore via JSON export
- **Simple data layer** — SQLite sync API directly, no ORM or query builder
- **No over-engineering** — each feature built to exactly what is needed

---

## License

MIT
