import { useEffect, useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useToastStore, ToastType } from '../store/useToastStore';
import { BorderRadius, Colors, Spacing, Typography } from '../constants/theme';

const TYPE_BG: Record<ToastType, string> = {
  success: Colors.success,
  error: Colors.error,
  info: '#4488FF',
};

export default function Toast() {
  const { visible, message, type, hideToast } = useToastStore();
  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 200 });

    timerRef.current = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(80, { duration: 300 }, () => {
        runOnJS(hideToast)();
      });
    }, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, message]); // message in deps so back-to-back toasts reset the timer

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: TYPE_BG[type] }, animStyle]}
      pointerEvents="none"
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 72,
    left: Spacing.lg,
    right: Spacing.lg,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 999,
  },
  text: {
    color: Colors.background,
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    textAlign: 'center',
  },
});
