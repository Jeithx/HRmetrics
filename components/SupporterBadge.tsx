import { StyleSheet, Text, View } from 'react-native';
import { SupporterTier } from '../db/supporterQueries';
import { SUPPORTER_TIERS } from '../constants/supporter';
import { Typography, BorderRadius, Spacing } from '../constants/theme';

interface SupporterBadgeProps {
  tier: SupporterTier;
  size?: 'sm' | 'md';
}

const TIER_STYLES: Record<SupporterTier, { bg: string; textColor: string }> = {
  PRE_WORKOUT:  { bg: '#2A2A2A',  textColor: '#AAAAAA' },
  CHICKEN_RICE: { bg: '#F59E0B',  textColor: '#1A1A1A' },
  CHEAT_MEAL:   { bg: '#C8FF00',  textColor: '#1A1A1A' },
};

export default function SupporterBadge({ tier, size = 'sm' }: SupporterBadgeProps) {
  const tierDef = SUPPORTER_TIERS.find((t) => t.id === tier);
  if (!tierDef) return null;

  const { bg, textColor } = TIER_STYLES[tier];
  const isMd = size === 'md';

  return (
    <View style={[
      styles.badge,
      { backgroundColor: bg, paddingHorizontal: isMd ? Spacing.sm : Spacing.xs },
    ]}>
      <Text style={[styles.text, { color: textColor, fontSize: isMd ? Typography.size.xs : 10 }]}>
        {tierDef.badge} {tierDef.badgeLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: Typography.weight.bold,
    letterSpacing: 0.3,
  },
});
