import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import RexMascot from '../../components/RexMascot';
import SupporterBadge from '../../components/SupporterBadge';
import SupporterSuccessModal from '../../components/SupporterSuccessModal';
import { useSupporterStore } from '../../store/useSupporterStore';
import { SUPPORTER_TIERS, SUPPORTER_THEMES, LIFTER_TITLES } from '../../constants/supporter';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { SupporterTier } from '../../db/supporterQueries';

const TIER_ORDER: Record<SupporterTier, number> = {
  PRE_WORKOUT: 1, CHICKEN_RICE: 2, CHEAT_MEAL: 3,
};

export default function SupporterScreen() {
  const insets = useSafeAreaInsets();
  const { Colors: TC, setThemeId } = useTheme();
  const {
    status, isSupporter, tier, isPurchasing, products,
    loadStatus, loadProducts, purchase, restorePurchases,
    setActiveTheme, successTier, dismissSuccess,
  } = useSupporterStore();

  const [restoringPurchases, setRestoringPurchases] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
    loadProducts();
  }, []);

  // Sync active theme to ThemeContext whenever status changes
  useEffect(() => {
    setThemeId(status?.activeThemeId ?? null);
  }, [status?.activeThemeId]);

  const handlePurchase = async (productId: string) => {
    setPurchasingId(productId);
    await purchase(productId);
    setPurchasingId(null);
  };

  const handleRestore = async () => {
    setRestoringPurchases(true);
    await restorePurchases();
    setRestoringPurchases(false);
    Alert.alert('Restore Complete', isSupporter ? 'Your purchase has been restored.' : 'No previous purchase found.');
  };

  const ownedTierOrder = tier ? TIER_ORDER[tier] : 0;

  const rexMood = isSupporter ? 'excited' : 'happy';
  const rexCostume = status?.rexCostume === 'sunglasses' ? 'sunglasses' : 'none';

  return (
    <View style={[styles.root, { backgroundColor: TC.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xxxl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={TC.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: TC.text }]}>Support Development</Text>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <RexMascot mood={rexMood} size={80} costume={rexCostume} />
          {isSupporter && tier ? (
            <>
              <Text style={[styles.heroTitle, { color: TC.text }]}>
                You're a {SUPPORTER_TIERS.find(t => t.id === tier)?.name}. Respect. 🤝
              </Text>
              <SupporterBadge tier={tier} size="md" />
              {status?.lifterTitleId && (
                <Text style={[styles.lifterTitle, { color: TC.primary }]}>
                  {LIFTER_TITLES.find(t => t.id === status.lifterTitleId)?.emoji}{' '}
                  {LIFTER_TITLES.find(t => t.id === status.lifterTitleId)?.label}
                </Text>
              )}
            </>
          ) : (
            <>
              <Text style={[styles.heroTitle, { color: TC.text }]}>Keep HRmetrics free.</Text>
              <Text style={[styles.heroSubtitle, { color: TC.textSecondary }]}>
                No ads. No subscriptions. No BS. Just a solo dev trying to build something genuinely useful.
              </Text>
              <Text style={[styles.heroSmall, { color: TC.textTertiary }]}>
                Built by a 4th-year CS student between classes and training sessions.
              </Text>
            </>
          )}
        </View>

        {/* Tier Cards */}
        <View style={styles.tiersContainer}>
          {SUPPORTER_TIERS.map((tierDef) => {
            const tierOrder = TIER_ORDER[tierDef.id as SupporterTier];
            const isOwned = ownedTierOrder >= tierOrder;
            const isUpgrade = ownedTierOrder > 0 && ownedTierOrder < tierOrder;
            const product = products.find(p => p.productId === tierDef.productId);
            const displayPrice = product?.localizedPrice ?? tierDef.price;
            const isThisPurchasing = purchasingId === tierDef.productId && isPurchasing;

            return (
              <View
                key={tierDef.id}
                style={[
                  styles.tierCard,
                  { backgroundColor: TC.surface, borderColor: tierDef.highlighted ? TC.primary : TC.border },
                  tierDef.highlighted && styles.tierCardHighlighted,
                ]}
              >
                {tierDef.highlighted && (
                  <View style={[styles.popularBadge, { backgroundColor: TC.primary }]}>
                    <Text style={styles.popularText}>Most Popular</Text>
                  </View>
                )}

                <View style={styles.tierHeader}>
                  <Text style={styles.tierEmoji}>{tierDef.emoji}</Text>
                  <View style={styles.tierHeaderText}>
                    <Text style={[styles.tierName, { color: TC.text }]}>{tierDef.name}</Text>
                    <Text style={[styles.tierTagline, { color: TC.textSecondary }]}>{tierDef.tagline}</Text>
                  </View>
                  <Text style={[styles.tierPrice, { color: tierDef.highlighted ? TC.primary : TC.text }]}>
                    {displayPrice}
                  </Text>
                </View>

                <View style={styles.tierPerks}>
                  {tierDef.perks.map((perk, i) => (
                    <View key={i} style={styles.perkRow}>
                      <Ionicons name="checkmark-circle" size={14} color={TC.primary} />
                      <Text style={[styles.perkText, { color: TC.textSecondary }]}>{perk}</Text>
                    </View>
                  ))}
                </View>

                {isOwned ? (
                  <View style={[styles.ownedBtn, { borderColor: TC.border }]}>
                    <Ionicons name="checkmark" size={14} color={TC.textSecondary} />
                    <Text style={[styles.ownedText, { color: TC.textSecondary }]}>Owned</Text>
                  </View>
                ) : (
                  <Pressable
                    style={[
                      styles.supportBtn,
                      tierDef.highlighted
                        ? { backgroundColor: TC.primary }
                        : { backgroundColor: TC.surfaceElevated, borderWidth: 1, borderColor: TC.border },
                      (isPurchasing) && styles.btnDisabled,
                    ]}
                    onPress={() => handlePurchase(tierDef.productId)}
                    disabled={isPurchasing}
                  >
                    {isThisPurchasing ? (
                      <ActivityIndicator size="small" color={tierDef.highlighted ? '#0F0F0F' : TC.text} />
                    ) : (
                      <Text style={[
                        styles.supportBtnText,
                        { color: tierDef.highlighted ? '#0F0F0F' : TC.text },
                      ]}>
                        {isUpgrade ? 'Upgrade' : 'Support'} · {displayPrice}
                      </Text>
                    )}
                  </Pressable>
                )}
              </View>
            );
          })}
        </View>

        {/* Theme Selector (Chicken & Rice+ only) */}
        {ownedTierOrder >= 2 && (
          <View style={[styles.section, { backgroundColor: TC.surface, borderColor: TC.border }]}>
            <Text style={[styles.sectionTitle, { color: TC.text }]}>App Theme</Text>
            <View style={styles.themesRow}>
              {/* Default theme */}
              <ThemeCard
                name="Default"
                colors={['#0F0F0F', '#1A1A1A', '#242424', '#C8FF00']}
                isActive={!status?.activeThemeId}
                onPress={() => setActiveTheme(null)}
                TC={TC}
              />
              {SUPPORTER_THEMES.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  name={theme.name}
                  colors={[theme.colors.background, theme.colors.surface, theme.colors.surfaceElevated, theme.colors.primary]}
                  isActive={status?.activeThemeId === theme.id}
                  onPress={() => setActiveTheme(theme.id)}
                  TC={TC}
                />
              ))}
            </View>
          </View>
        )}

        {/* Lifter Title (Cheat Meal only) */}
        {ownedTierOrder >= 3 && (
          <LifterTitleSection TC={TC} />
        )}

        {/* About section */}
        <View style={[styles.section, { backgroundColor: TC.surface, borderColor: TC.border }]}>
          <Text style={[styles.sectionTitle, { color: TC.text }]}>Why support?</Text>
          <Text style={[styles.aboutText, { color: TC.textSecondary }]}>
            This app has no servers, no ads, and no investors. It runs entirely on your device.
            {'\n\n'}Your support directly helps me:
          </Text>
          {[
            'Keep the app updated and bug-free',
            'Build new features (iOS version is next)',
            'Cover the Apple Developer fee ($99/year)',
          ].map((item, i) => (
            <View key={i} style={styles.aboutBullet}>
              <Text style={[styles.aboutBulletDot, { color: TC.primary }]}>•</Text>
              <Text style={[styles.aboutText, { color: TC.textSecondary }]}>{item}</Text>
            </View>
          ))}
          <Text style={[styles.aboutNote, { color: TC.textTertiary }]}>
            Every purchase is a one-time payment. No recurring charges. Ever.
          </Text>
        </View>

        {/* Restore */}
        <Pressable style={styles.restoreBtn} onPress={handleRestore} disabled={restoringPurchases}>
          {restoringPurchases ? (
            <ActivityIndicator size="small" color={TC.textSecondary} />
          ) : (
            <Text style={[styles.restoreText, { color: TC.textSecondary }]}>
              Already supported? Restore purchases
            </Text>
          )}
        </Pressable>
      </ScrollView>

      <SupporterSuccessModal
        tier={successTier}
        onDone={dismissSuccess}
      />
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ThemeCard({ name, colors, isActive, onPress, TC }: {
  name: string;
  colors: string[];
  isActive: boolean;
  onPress: () => void;
  TC: ReturnType<typeof useTheme>['Colors'];
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.themeCard,
        { borderColor: isActive ? TC.primary : TC.border, backgroundColor: TC.surfaceElevated },
      ]}
    >
      <View style={styles.swatches}>
        {colors.map((c, i) => (
          <View key={i} style={[styles.swatch, { backgroundColor: c }]} />
        ))}
      </View>
      <Text style={[styles.themeName, { color: TC.text }]}>{name}</Text>
      {isActive && (
        <Ionicons name="checkmark-circle" size={14} color={TC.primary} style={styles.themeCheck} />
      )}
    </Pressable>
  );
}

function LifterTitleSection({ TC }: { TC: ReturnType<typeof useTheme>['Colors'] }) {
  const { status, setLifterTitle } = useSupporterStore();

  return (
    <View style={[styles.section, { backgroundColor: TC.surface, borderColor: TC.border }]}>
      <Text style={[styles.sectionTitle, { color: TC.text }]}>Lifter Title</Text>
      <Text style={[styles.aboutText, { color: TC.textSecondary }]}>
        Your title appears next to your name in the app.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.sm }}>
        {LIFTER_TITLES.map((lt) => {
          const isSelected = status?.lifterTitleId === lt.id;
          return (
            <Pressable
              key={lt.id}
              onPress={() => setLifterTitle(lt.id)}
              style={[
                styles.titlePill,
                {
                  backgroundColor: isSelected ? TC.primary : TC.surfaceElevated,
                  borderColor: isSelected ? TC.primary : TC.border,
                },
              ]}
            >
              <Text style={[styles.titlePillText, { color: isSelected ? '#0F0F0F' : TC.text }]}>
                {lt.emoji} {lt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.lg },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.xl, marginBottom: Spacing.lg,
  },
  backBtn: { marginRight: Spacing.sm, padding: Spacing.xs },
  headerTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  hero: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  heroTitle: {
    fontSize: Typography.size.xl, fontWeight: Typography.weight.bold, textAlign: 'center', marginTop: Spacing.sm,
  },
  heroSubtitle: { fontSize: Typography.size.sm, textAlign: 'center', lineHeight: 20 },
  heroSmall: { fontSize: Typography.size.xs, textAlign: 'center', fontStyle: 'italic', marginTop: Spacing.xs },
  lifterTitle: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, marginTop: Spacing.xs },
  tiersContainer: { gap: Spacing.md, marginBottom: Spacing.xl },
  tierCard: {
    borderRadius: BorderRadius.xl, borderWidth: 1.5, padding: Spacing.lg, gap: Spacing.md,
  },
  tierCardHighlighted: { transform: [{ scale: 1.02 }] },
  popularBadge: {
    position: 'absolute', top: -10, right: Spacing.lg,
    paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full,
  },
  popularText: { fontSize: 10, fontWeight: Typography.weight.bold, color: '#0F0F0F' },
  tierHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tierEmoji: { fontSize: 28 },
  tierHeaderText: { flex: 1 },
  tierName: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold },
  tierTagline: { fontSize: Typography.size.xs, fontStyle: 'italic', marginTop: 2 },
  tierPrice: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold },
  tierPerks: { gap: Spacing.xs },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  perkText: { fontSize: Typography.size.sm, flex: 1 },
  supportBtn: {
    paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, alignItems: 'center',
  },
  supportBtnText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold },
  btnDisabled: { opacity: 0.5 },
  ownedBtn: {
    paddingVertical: Spacing.sm, borderRadius: BorderRadius.lg, alignItems: 'center',
    flexDirection: 'row', justifyContent: 'center', gap: Spacing.xs, borderWidth: 1,
  },
  ownedText: { fontSize: Typography.size.sm },
  section: {
    borderRadius: BorderRadius.xl, borderWidth: 1, padding: Spacing.lg,
    gap: Spacing.sm, marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold },
  aboutText: { fontSize: Typography.size.sm, lineHeight: 20 },
  aboutBullet: { flexDirection: 'row', gap: Spacing.xs },
  aboutBulletDot: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold },
  aboutNote: { fontSize: Typography.size.xs, marginTop: Spacing.xs, fontStyle: 'italic' },
  restoreBtn: { alignItems: 'center', paddingVertical: Spacing.xl },
  restoreText: { fontSize: Typography.size.sm, textDecorationLine: 'underline' },
  themesRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  themeCard: {
    borderRadius: BorderRadius.lg, borderWidth: 1.5, padding: Spacing.sm,
    alignItems: 'center', gap: Spacing.xs, width: 90,
  },
  swatches: { flexDirection: 'row', gap: 3 },
  swatch: { width: 14, height: 14, borderRadius: 7 },
  themeName: { fontSize: 10, fontWeight: Typography.weight.semibold },
  themeCheck: { position: 'absolute', top: 4, right: 4 },
  titlePill: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full, borderWidth: 1, marginRight: Spacing.sm,
  },
  titlePillText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold },
});
