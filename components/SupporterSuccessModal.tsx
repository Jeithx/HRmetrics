import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withDelay,
} from 'react-native-reanimated';
import RexMascot from './RexMascot';
import { useSupporterStore } from '../store/useSupporterStore';
import { SUPPORTER_TIERS, LIFTER_TITLES, TIER_MESSAGES } from '../constants/supporter';
import { Colors, Spacing, Typography, BorderRadius } from '../constants/theme';
import { SupporterTier } from '../db/supporterQueries';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  tier: SupporterTier | null;
  onDone: () => void;
}

export default function SupporterSuccessModal({ tier, onDone }: Props) {
  const { setLifterTitle, status } = useSupporterStore();
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [titleConfirmed, setTitleConfirmed] = useState(false);

  const visible = tier !== null;
  const tierDef = SUPPORTER_TIERS.find((t) => t.id === tier);
  const isCheatMeal = tier === 'CHEAT_MEAL';

  const bgOpacity  = useSharedValue(0);
  const cardScale  = useSharedValue(0.7);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setSelectedTitle(status?.lifterTitleId ?? null);
      setTitleConfirmed(false);
      bgOpacity.value   = withTiming(1, { duration: 300 });
      cardScale.value   = withSpring(1, { damping: 12, stiffness: 160 });
      cardOpacity.value = withTiming(1, { duration: 300 });
    } else {
      bgOpacity.value   = withTiming(0, { duration: 200 });
      cardScale.value   = withTiming(0.7, { duration: 200 });
      cardOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const bgStyle   = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const handleConfirmTitle = () => {
    if (selectedTitle) {
      setLifterTitle(selectedTitle);
      setTitleConfirmed(true);
    }
  };

  if (!visible || !tierDef) return null;

  const styles = StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    },
    card: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      borderWidth: 2,
      borderColor: Colors.primary,
      width: '88%',
      maxHeight: '85%',
    },
    inner: {
      padding: Spacing.xl,
      alignItems: 'center',
      gap: Spacing.md,
    },
    rexContainer: { marginBottom: Spacing.sm },
    headline: {
      color: Colors.text,
      fontSize: Typography.size.xl,
      fontWeight: Typography.weight.bold,
      textAlign: 'center',
    },
    message: {
      color: Colors.textSecondary,
      fontSize: Typography.size.sm,
      textAlign: 'center',
      lineHeight: 20,
    },
    perksBox: {
      width: '100%',
      backgroundColor: Colors.surfaceElevated,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      gap: Spacing.xs,
    },
    perksLabel: {
      color: Colors.textSecondary,
      fontSize: Typography.size.xs,
      fontWeight: Typography.weight.semibold,
      marginBottom: Spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    perkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    perkText: { color: Colors.text, fontSize: Typography.size.sm, flex: 1 },
    titleSection: { width: '100%', gap: Spacing.sm },
    titleLabel: {
      color: Colors.text,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold,
    },
    titlesScroll: { flexGrow: 0 },
    titlePill: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surfaceElevated,
      marginRight: Spacing.sm,
    },
    titlePillSelected: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    titlePillText: {
      color: Colors.text,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold,
    },
    titlePillTextSelected: { color: '#0F0F0F' },
    confirmBtn: {
      backgroundColor: Colors.primary,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.sm,
      alignItems: 'center',
    },
    confirmBtnText: {
      color: '#0F0F0F',
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.bold,
    },
    confirmedTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    confirmedTitleText: {
      color: Colors.primary,
      fontSize: Typography.size.sm,
      fontWeight: Typography.weight.semibold,
    },
    doneBtn: {
      backgroundColor: Colors.primary,
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xxxl,
      marginTop: Spacing.sm,
    },
    doneBtnText: {
      color: '#0F0F0F',
      fontSize: Typography.size.md,
      fontWeight: Typography.weight.bold,
    },
  });

  function PerkRow({ perk, delayIndex }: { perk: string; delayIndex: number }) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(12);

    useEffect(() => {
      const delay = delayIndex * 150;
      opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
      translateY.value = withDelay(delay, withSpring(0, { damping: 14 }));
    }, []);

    const style = useAnimatedStyle(() => ({
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    }));

    return (
      <Animated.View style={[styles.perkRow, style]}>
        <Ionicons name="checkmark-circle" size={14} color={Colors.primary} />
        <Text style={styles.perkText}>{perk}</Text>
      </Animated.View>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, bgStyle]}>
        <Animated.View style={[styles.card, cardStyle]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.inner}>
            {/* REX */}
            <View style={styles.rexContainer}>
              <RexMascot mood="excited" size={120} onBounce={visible} costume="none" />
            </View>

            {/* Title */}
            <Text style={styles.headline}>
              You're officially a {tierDef.name}! 🎉
            </Text>
            <Text style={styles.message}>{TIER_MESSAGES[tier]}</Text>

            {/* Unlocked perks */}
            <View style={styles.perksBox}>
              <Text style={styles.perksLabel}>Unlocked:</Text>
              {tierDef.perks.map((perk, i) => (
                <PerkRow key={i} perk={perk} delayIndex={i} />
              ))}
            </View>

            {/* Lifter title selector (Cheat Meal only) */}
            {isCheatMeal && !titleConfirmed && (
              <View style={styles.titleSection}>
                <Text style={styles.titleLabel}>Choose your Lifter Title</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.titlesScroll}
                >
                  {LIFTER_TITLES.map((lt) => {
                    const isSelected = selectedTitle === lt.id;
                    return (
                      <Pressable
                        key={lt.id}
                        onPress={() => setSelectedTitle(lt.id)}
                        style={[
                          styles.titlePill,
                          isSelected && styles.titlePillSelected,
                        ]}
                      >
                        <Text style={[styles.titlePillText, isSelected && styles.titlePillTextSelected]}>
                          {lt.emoji} {lt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                {selectedTitle && (
                  <Pressable style={styles.confirmBtn} onPress={handleConfirmTitle}>
                    <Text style={styles.confirmBtnText}>Confirm Title</Text>
                  </Pressable>
                )}
              </View>
            )}

            {isCheatMeal && titleConfirmed && selectedTitle && (
              <View style={styles.confirmedTitle}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                <Text style={styles.confirmedTitleText}>
                  {LIFTER_TITLES.find(t => t.id === selectedTitle)?.emoji}{' '}
                  {LIFTER_TITLES.find(t => t.id === selectedTitle)?.label} — set!
                </Text>
              </View>
            )}

            {/* Let's Go button */}
            <Pressable style={styles.doneBtn} onPress={onDone}>
              <Text style={styles.doneBtnText}>Let's Go 💪</Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

