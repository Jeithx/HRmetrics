import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Line as SvgLine, Rect, Text as SvgText } from 'react-native-svg';
import Reanimated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useWaterStore } from '../../store/useWaterStore';
import { getWaterRange } from '../../db/waterQueries';
import { formatWater, mlToDisplay, displayToMl, WaterUnit } from '../../utils/waterUtils';
import { WaterDaySummary } from '../../types';
import { BorderRadius, Colors, Spacing, Typography } from '../../constants/theme';

const WATER_COLOR = '#4FC3F7';
const RING_RADIUS = 90;
const RING_SIZE = 220;
const RING_CX = RING_SIZE / 2;
const RING_CY = RING_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const SCREEN_W = Dimensions.get('window').width;
const DELETE_W = 72;
const QUICK_ADD_ML = [150, 250, 330, 500, 750, 1000];

const AnimatedCircle = Reanimated.createAnimatedComponent(Circle);

function getLocalDateStr(daysAgo = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr.includes('T') ? isoStr : isoStr.replace(' ', 'T'));
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ─── Progress Ring ──────────────────────────────────────────────────────────

interface ProgressRingProps {
  todayTotal: number;
  dailyGoalMl: number;
  waterUnit: WaterUnit;
  goalJustReached: boolean;
}

function ProgressRing({ todayTotal, dailyGoalMl, waterUnit, goalJustReached }: ProgressRingProps) {
  const ringProgress = useSharedValue(0);
  const percentScale = useSharedValue(1);
  const prevGoalReached = useRef(false);

  const animatedRingProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - Math.min(1, ringProgress.value)),
  }));

  const percentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: percentScale.value }],
  }));

  useEffect(() => {
    const p = dailyGoalMl > 0 ? todayTotal / dailyGoalMl : 0;
    ringProgress.value = withSpring(Math.min(1, p), { damping: 20, stiffness: 90 });
    if (goalJustReached && !prevGoalReached.current) {
      percentScale.value = withSequence(withSpring(1.2, { damping: 8 }), withSpring(1, { damping: 12 }));
    }
    prevGoalReached.current = goalJustReached;
  }, [todayTotal, dailyGoalMl, goalJustReached]);

  const percent = dailyGoalMl > 0 ? Math.min(100, Math.round((todayTotal / dailyGoalMl) * 100)) : 0;
  const isGoalReached = todayTotal >= dailyGoalMl && dailyGoalMl > 0;
  const remaining = Math.max(0, dailyGoalMl - todayTotal);

  return (
    <View style={styles.ringWrapper}>
      <View style={styles.ringContainer}>
        <Svg width={RING_SIZE} height={RING_SIZE}>
          <Circle
            cx={RING_CX}
            cy={RING_CY}
            r={RING_RADIUS}
            stroke={Colors.surfaceElevated}
            strokeWidth={16}
            fill="none"
          />
          <AnimatedCircle
            cx={RING_CX}
            cy={RING_CY}
            r={RING_RADIUS}
            stroke={isGoalReached ? Colors.success : WATER_COLOR}
            strokeWidth={16}
            fill="none"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${RING_CX} ${RING_CY})`}
            animatedProps={animatedRingProps}
          />
        </Svg>
        <View style={styles.ringCenter}>
          <Reanimated.Text style={[styles.ringPercent, isGoalReached && styles.ringPercentGoal, percentStyle]}>
            {percent}%
          </Reanimated.Text>
          <Text style={styles.ringTotal}>{formatWater(todayTotal, waterUnit)}</Text>
        </View>
      </View>
      <Text style={[styles.ringStatus, isGoalReached && styles.ringStatusGoal]}>
        {isGoalReached ? '✓ Goal reached!' : `${formatWater(remaining, waterUnit)} remaining`}
      </Text>
    </View>
  );
}

// ─── 14-day Bar Chart ───────────────────────────────────────────────────────

function WaterBarChart({
  goalMl,
  waterUnit,
}: {
  goalMl: number;
  waterUnit: WaterUnit;
}) {
  const [chartData, setChartData] = useState<WaterDaySummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      const end = getLocalDateStr(0);
      const start = getLocalDateStr(13);
      try {
        const raw = getWaterRange(start, end);
        setChartData(raw);
      } catch {}
    }, [])
  );

  const CHART_W = SCREEN_W - Spacing.lg * 4;
  const CHART_H = 160;
  const LABEL_H = 24;
  const BAR_COUNT = 14;
  const BAR_GAP = 2;
  const BAR_W = (CHART_W - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT;

  const dates = Array.from({ length: BAR_COUNT }, (_, i) => getLocalDateStr(BAR_COUNT - 1 - i));
  const dataMap = new Map(chartData.map((d) => [d.date, d.totalMl]));
  const bars = dates.map((date) => ({ date, totalMl: dataMap.get(date) ?? 0 }));
  const maxVal = Math.max(...bars.map((b) => b.totalMl), goalMl, 1);
  const goalY = CHART_H - (goalMl / maxVal) * CHART_H;
  const today = getLocalDateStr(0);

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>LAST 14 DAYS</Text>
      <Svg width={CHART_W} height={CHART_H + LABEL_H}>
        {/* Goal line */}
        {goalMl > 0 && (
          <SvgLine
            x1={0}
            y1={goalY}
            x2={CHART_W}
            y2={goalY}
            stroke={WATER_COLOR}
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.5}
          />
        )}
        {bars.map(({ date, totalMl }, i) => {
          const barH = (totalMl / maxVal) * CHART_H;
          const x = i * (BAR_W + BAR_GAP);
          const isToday = date === today;
          const hitsGoal = goalMl > 0 && totalMl >= goalMl;
          const fill = totalMl === 0
            ? Colors.surfaceElevated
            : hitsGoal
            ? WATER_COLOR
            : Colors.textTertiary;
          const showLabel = i === 0 || i === 6 || i === 13;
          return (
            <React.Fragment key={date}>
              <Rect
                x={x}
                y={CHART_H - barH}
                width={BAR_W}
                height={Math.max(barH, 2)}
                rx={2}
                fill={fill}
                opacity={isToday ? 1 : 0.75}
              />
              {showLabel && (
                <SvgText
                  x={x + BAR_W / 2}
                  y={CHART_H + LABEL_H - 4}
                  fill={Colors.textTertiary}
                  fontSize={8}
                  textAnchor="middle"
                >
                  {formatDateShort(date)}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

// Need React for Fragment
import React from 'react';

// ─── Swipeable Entry Row ─────────────────────────────────────────────────────

interface EntryRowProps {
  amountMl: number;
  recordedAt: string;
  notes: string | null;
  waterUnit: WaterUnit;
  onDelete: () => void;
}

function SwipeableEntryRow({ amountMl, recordedAt, notes, waterUnit, onDelete }: EntryRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10,
      onPanResponderMove: (_, { dx }) => {
        const base = isOpen.current ? -DELETE_W : 0;
        translateX.setValue(Math.max(-DELETE_W, Math.min(0, dx + base)));
      },
      onPanResponderRelease: (_, { dx }) => {
        const base = isOpen.current ? -DELETE_W : 0;
        if (dx + base < -DELETE_W / 2) {
          Animated.spring(translateX, { toValue: -DELETE_W, useNativeDriver: true }).start();
          isOpen.current = true;
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          isOpen.current = false;
        }
      },
    })
  ).current;

  const close = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
    isOpen.current = false;
  };

  return (
    <View style={styles.entrySwipeWrapper}>
      <View style={styles.entryDeleteZone}>
        <Pressable
          style={styles.entryDeleteBtn}
          onPress={() => {
            close();
            try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
            onDelete();
          }}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.text} />
        </Pressable>
      </View>
      <Animated.View
        style={[styles.entryRow, { transform: [{ translateX }], backgroundColor: Colors.surface }]}
        {...pan.panHandlers}
      >
        <View style={styles.entryAmountBadge}>
          <Text style={styles.entryAmountText}>{formatWater(amountMl, waterUnit)}</Text>
        </View>
        <View style={styles.entryMeta}>
          <Text style={styles.entryTime}>{formatTime(recordedAt)}</Text>
          {notes ? <Text style={styles.entryNotes} numberOfLines={1}>{notes}</Text> : null}
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Stats Strip ─────────────────────────────────────────────────────────────

function WaterStatsStrip({
  waterUnit,
  goalMl,
}: {
  waterUnit: WaterUnit;
  goalMl: number;
}) {
  const stats = useWaterStore((s) => s.stats);

  const cards = [
    { label: '7-DAY AVG', value: stats ? formatWater(stats.sevenDayAvg, waterUnit) : '—' },
    { label: '30-DAY AVG', value: stats ? formatWater(stats.thirtyDayAvg, waterUnit) : '—' },
    {
      label: 'BEST DAY',
      value: stats?.bestDay ? formatWater(stats.bestDay.amount, waterUnit) : '—',
    },
    { label: 'STREAK', value: stats ? `${stats.currentStreak}d` : '—' },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsStrip}>
      {cards.map((c) => (
        <View key={c.label} style={styles.statCard}>
          <Text style={styles.statLabel}>{c.label}</Text>
          <Text style={styles.statValue}>{c.value}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Water Screen ─────────────────────────────────────────────────────────────

export default function WaterScreen() {
  const {
    todayEntries,
    todayTotal,
    dailyGoalMl,
    waterUnit,
    logWater,
    deleteEntry,
    loadToday,
    loadStats,
    loadSettings,
  } = useWaterStore();

  const [customAmount, setCustomAmount] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [goalJustReached, setGoalJustReached] = useState(false);
  const prevTotal = useRef(todayTotal);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
      loadToday();
      loadStats();
    }, [loadSettings, loadToday, loadStats])
  );

  useEffect(() => {
    const wasBelow = prevTotal.current < dailyGoalMl;
    const isNow = todayTotal >= dailyGoalMl && dailyGoalMl > 0;
    if (wasBelow && isNow) {
      setGoalJustReached(true);
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
      setTimeout(() => setGoalJustReached(false), 1500);
    }
    prevTotal.current = todayTotal;
  }, [todayTotal, dailyGoalMl]);

  const handleQuickAdd = (ml: number) => {
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    logWater(ml);
    loadStats();
  };

  const handleCustomAdd = () => {
    const parsed = parseFloat(customAmount.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) return;
    const ml = displayToMl(parsed, waterUnit);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    logWater(ml, customNotes.trim() || undefined);
    setCustomAmount('');
    setCustomNotes('');
    loadStats();
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Water</Text>
          <View style={styles.headerRight}>
            <Text style={styles.goalLabel}>Goal: {formatWater(dailyGoalMl, waterUnit)}</Text>
          </View>
        </View>

        {/* Progress Ring */}
        <ProgressRing
          todayTotal={todayTotal}
          dailyGoalMl={dailyGoalMl}
          waterUnit={waterUnit}
          goalJustReached={goalJustReached}
        />

        {/* Quick Add */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QUICK ADD</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickAddRow}>
            {QUICK_ADD_ML.map((ml) => (
              <Pressable
                key={ml}
                style={({ pressed }) => [styles.quickBtn, pressed && styles.quickBtnPressed]}
                onPress={() => handleQuickAdd(ml)}
              >
                <Text style={styles.quickBtnText}>
                  +{mlToDisplay(ml, waterUnit)}{waterUnit === 'oz' ? ' oz' : 'ml'}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Custom Add */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CUSTOM AMOUNT</Text>
          <View style={styles.customCard}>
            <View style={styles.customInputRow}>
              <TextInput
                style={styles.customInput}
                value={customAmount}
                onChangeText={setCustomAmount}
                placeholder="0"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
              <Text style={styles.customUnit}>{waterUnit}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.addBtn,
                  !customAmount && styles.addBtnDisabled,
                  pressed && customAmount ? styles.addBtnPressed : null,
                ]}
                onPress={handleCustomAdd}
                disabled={!customAmount}
              >
                <Text style={styles.addBtnText}>Add</Text>
              </Pressable>
            </View>
            <TextInput
              style={styles.notesInput}
              value={customNotes}
              onChangeText={setCustomNotes}
              placeholder="Notes (optional)"
              placeholderTextColor={Colors.textTertiary}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Today's Log */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TODAY'S LOG</Text>
          {todayEntries.length === 0 ? (
            <View style={styles.emptyLog}>
              <Ionicons name="water-outline" size={32} color={Colors.textTertiary} />
              <Text style={styles.emptyLogText}>No entries yet</Text>
              <Text style={styles.emptyLogSub}>Tap a quick-add button above to get started</Text>
            </View>
          ) : (
            <View style={styles.logList}>
              {todayEntries.map((entry) => (
                <SwipeableEntryRow
                  key={entry.id}
                  amountMl={entry.amountMl}
                  recordedAt={entry.recordedAt}
                  notes={entry.notes}
                  waterUnit={waterUnit}
                  onDelete={() => {
                    deleteEntry(entry.id);
                    loadStats();
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* 14-day Chart */}
        <View style={styles.section}>
          <WaterBarChart goalMl={dailyGoalMl} waterUnit={waterUnit} />
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STATISTICS</Text>
          <WaterStatsStrip waterUnit={waterUnit} goalMl={dailyGoalMl} />
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingBottom: Spacing.xxxl },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    color: Colors.text,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  headerRight: {},
  goalLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
  },

  // Progress Ring
  ringWrapper: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  ringContainer: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    gap: 2,
  },
  ringPercent: {
    color: Colors.text,
    fontSize: Typography.size.xxxl,
    fontWeight: Typography.weight.bold,
  },
  ringPercentGoal: {
    color: Colors.success,
  },
  ringTotal: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
  },
  ringStatus: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
  },
  ringStatusGoal: {
    color: Colors.success,
    fontWeight: Typography.weight.semibold,
  },

  // Section
  section: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  sectionLabel: {
    color: Colors.textTertiary,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Quick Add
  quickAddRow: { flexDirection: 'row' },
  quickBtn: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: WATER_COLOR,
    marginRight: Spacing.sm,
  },
  quickBtnPressed: { opacity: 0.7, backgroundColor: Colors.surfaceElevated },
  quickBtnText: {
    color: WATER_COLOR,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },

  // Custom Add
  customCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  customInput: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    color: Colors.text,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.semibold,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
  },
  customUnit: {
    color: Colors.textSecondary,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
    width: 28,
  },
  addBtn: {
    backgroundColor: WATER_COLOR,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: Colors.surfaceElevated },
  addBtnPressed: { opacity: 0.8 },
  addBtnText: {
    color: Colors.background,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
  notesInput: {
    backgroundColor: Colors.surfaceElevated,
    color: Colors.text,
    fontSize: Typography.size.sm,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Today's log
  emptyLog: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyLogText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  emptyLogSub: {
    color: Colors.textTertiary,
    fontSize: Typography.size.sm,
    textAlign: 'center',
  },
  logList: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  // Swipeable entry
  entrySwipeWrapper: { overflow: 'hidden' },
  entryDeleteZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: DELETE_W,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryDeleteBtn: { alignItems: 'center', padding: Spacing.sm },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  entryAmountBadge: {
    backgroundColor: `${WATER_COLOR}20`,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: `${WATER_COLOR}40`,
  },
  entryAmountText: {
    color: WATER_COLOR,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  entryMeta: { flex: 1, gap: 2 },
  entryTime: {
    color: Colors.text,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  entryNotes: {
    color: Colors.textTertiary,
    fontSize: Typography.size.xs,
  },

  // Chart
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  chartTitle: {
    color: Colors.textTertiary,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // Stats
  statsStrip: { flexDirection: 'row' },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginRight: Spacing.sm,
    alignItems: 'center',
    gap: 4,
    minWidth: 90,
  },
  statLabel: {
    color: Colors.textTertiary,
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    color: Colors.text,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
});
