import { useEffect, useRef } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import Svg, { Rect, Path } from 'react-native-svg';
import { Colors } from '../constants/theme';

export type RexMood = 'happy' | 'thinking' | 'excited' | 'neutral';
export type RexCostume = 'none' | 'sunglasses';

interface Props {
  mood?: RexMood;
  size?: number;
  animated?: boolean;
  onBounce?: boolean;
  costume?: RexCostume;
}

const AnimatedRect = Animated.createAnimatedComponent(Rect);

function getMouthPath(mood: RexMood, s: number): string {
  if (mood === 'happy') {
    return `M ${22 * s},${52 * s} Q ${40 * s},${62 * s} ${58 * s},${52 * s}`;
  }
  if (mood === 'excited') {
    return `M ${18 * s},${51 * s} Q ${40 * s},${67 * s} ${62 * s},${51 * s}`;
  }
  if (mood === 'thinking') {
    return `M ${24 * s},${54 * s} Q ${40 * s},${50 * s} ${56 * s},${54 * s}`;
  }
  return `M ${26 * s},${54 * s} L ${54 * s},${54 * s}`;
}

export default function RexMascot({
  mood = 'neutral',
  size = 80,
  animated = true,
  onBounce = false,
  costume = 'none',
}: Props) {
  const s = size / 80;

  const eyeW = 12 * s;
  const eyeFullH = 8 * s;
  const eyeRx = 3 * s;
  const eyeLx = 20 * s;
  const eyeRx2 = 48 * s;
  const eyeCenterY = 27 * s + eyeFullH / 2; // fixed center Y for both eyes

  // Normal height for left eye depends on mood
  const normalLeftH = mood === 'thinking' ? eyeFullH * 0.5 : eyeFullH;

  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const eyeLH = useSharedValue(normalLeftH);
  const eyeRH = useSharedValue(eyeFullH);
  const prevBounce = useRef(false);
  const normalLeftHRef = useRef(normalLeftH);

  // Sync left eye height when mood changes
  useEffect(() => {
    normalLeftHRef.current = mood === 'thinking' ? eyeFullH * 0.5 : eyeFullH;
    eyeLH.value = withTiming(normalLeftHRef.current, { duration: 150 });
  }, [mood]);

  // Idle float
  useEffect(() => {
    if (!animated) return;
    translateY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        withTiming(4, { duration: 1000, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, [animated]);

  // Bounce
  useEffect(() => {
    if (onBounce && !prevBounce.current) {
      scale.value = withSpring(1.15, { damping: 6, stiffness: 200 }, () => {
        scale.value = withSpring(1, { damping: 10, stiffness: 200 });
      });
    }
    prevBounce.current = onBounce;
  }, [onBounce]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  // Use animatedProps for SVG Rect — style.transform is not supported on SVG elements
  const leftEyeProps = useAnimatedProps(() => ({
    height: eyeLH.value,
    y: eyeCenterY - eyeLH.value / 2,
  }));

  const rightEyeProps = useAnimatedProps(() => ({
    height: eyeRH.value,
    y: eyeCenterY - eyeRH.value / 2,
  }));

  const handleTap = () => {
    const returnL = normalLeftHRef.current;
    eyeLH.value = withSequence(
      withTiming(0, { duration: 80 }),
      withTiming(returnL, { duration: 80 })
    );
    eyeRH.value = withSequence(
      withTiming(0, { duration: 80 }),
      withTiming(eyeFullH, { duration: 80 })
    );
  };

  const mouthPath = getMouthPath(mood, s);

  return (
    <Pressable onPress={handleTap}>
      <Animated.View style={containerStyle}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Head */}
          <Rect
            x={2 * s}
            y={2 * s}
            width={76 * s}
            height={76 * s}
            rx={16 * s}
            fill={Colors.surfaceElevated}
            stroke={Colors.primary}
            strokeWidth={2 * s}
          />

          {/* Left eye */}
          <AnimatedRect
            x={eyeLx}
            width={eyeW}
            rx={eyeRx}
            fill={Colors.primary}
            animatedProps={leftEyeProps}
          />

          {/* Right eye */}
          <AnimatedRect
            x={eyeRx2}
            width={eyeW}
            rx={eyeRx}
            fill={Colors.primary}
            animatedProps={rightEyeProps}
          />

          {/* Mouth */}
          <Path
            d={mouthPath}
            stroke={Colors.primary}
            strokeWidth={2.5 * s}
            strokeLinecap="round"
            fill="none"
          />

          {/* Sunglasses costume */}
          {costume === 'sunglasses' && (
            <>
              {/* Left lens */}
              <Rect
                x={eyeLx - 1 * s}
                y={eyeCenterY - eyeFullH / 2 - 2 * s}
                width={eyeW + 2 * s}
                height={eyeFullH + 4 * s}
                rx={4 * s}
                fill="#1A1A1A"
                opacity={0.92}
              />
              {/* Right lens */}
              <Rect
                x={eyeRx2 - 1 * s}
                y={eyeCenterY - eyeFullH / 2 - 2 * s}
                width={eyeW + 2 * s}
                height={eyeFullH + 4 * s}
                rx={4 * s}
                fill="#1A1A1A"
                opacity={0.92}
              />
              {/* Bridge */}
              <Rect
                x={eyeLx + eyeW}
                y={eyeCenterY - 1 * s}
                width={eyeRx2 - (eyeLx + eyeW)}
                height={2 * s}
                fill="#333333"
              />
            </>
          )}
        </Svg>
      </Animated.View>
    </Pressable>
  );
}

// Insight IDs that signal a problem → thinking face
const PROBLEM_IDS = new Set([
  'PLATEAU_DETECTED',
  'VOLUME_DROP',
  'MUSCLE_IMBALANCE',
  'OVERTRAINING_RISK',
  'HYDRATION_POOR',
  'HYDRATION_TODAY_BEHIND',
  'MISSED_DAYS',
  'SHORT_REST',
  'WEIGHT_TREND_CUT_STALL',
  'NO_WEIGHT_LOGGED',
]);

// Insight IDs that signal success / milestone → excited face
const CELEBRATE_IDS = new Set([
  'FIRST_WORKOUT',
  'GOAL_REACHED',
  'CONSISTENCY_STREAK',
  'VOLUME_SPIKE',
  'WATER_STREAK',
  'WEIGHT_TREND_CUT',
  'WEIGHT_TREND_BULK',
  'CLOSE_TO_GOAL',
]);

export function moodFromInsight(id: string | undefined): RexMood {
  if (!id || id === 'DEFAULT') return 'happy';
  if (id.startsWith('NEW_PR_') || id.startsWith('MILESTONE_')) return 'excited';
  if (id.startsWith('PLATEAU_')) return 'thinking';
  if (CELEBRATE_IDS.has(id)) return 'excited';
  if (PROBLEM_IDS.has(id)) return 'thinking';
  return 'neutral';
}
