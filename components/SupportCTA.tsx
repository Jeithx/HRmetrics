import { useEffect } from 'react';
import { StyleSheet, Text, Pressable, View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { recordPromptShown } from '../utils/supporterPrompt';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export default function SupportCTA({ visible, onDismiss }: Props) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 350 });
  }, [visible]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!visible) return null;

  const handleTap = () => {
    recordPromptShown();
    router.push('/settings/supporter');
  };

  const handleDismiss = () => {
    recordPromptShown();
    onDismiss();
  };

  return (
    <Animated.View style={[styles.container, style]}>
      <Pressable style={styles.inner} onPress={handleTap}>
        <Text style={styles.icon}>⚡</Text>
        <Text style={styles.text}>Enjoying HRmetrics? Help keep it free →</Text>
      </Pressable>
      <Pressable onPress={handleDismiss} style={styles.closeBtn} hitSlop={8}>
        <Ionicons name="close" size={14} color={Colors.textTertiary} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingLeft: Spacing.md,
  },
  icon: { fontSize: 16 },
  text: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    flex: 1,
  },
  closeBtn: {
    padding: Spacing.sm,
    paddingRight: Spacing.md,
  },
});
