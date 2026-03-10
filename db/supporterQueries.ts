import { getDatabase } from './database';

export type SupporterTier = 'PRE_WORKOUT' | 'CHICKEN_RICE' | 'CHEAT_MEAL';
export type RexCostume = 'sunglasses' | null;

export interface SupporterStatus {
  id: number;
  tier: SupporterTier;
  purchasedAt: string;
  transactionId: string | null;
  lifterTitleId: string | null;
  rexCostume: RexCostume;
  activeThemeId: string | null;
}

const TIER_ORDER: Record<SupporterTier, number> = {
  PRE_WORKOUT: 1,
  CHICKEN_RICE: 2,
  CHEAT_MEAL: 3,
};

export function getSupporterStatus(): SupporterStatus | null {
  try {
    const db = getDatabase();
    const row = db.getFirstSync<{
      id: number;
      tier: string;
      purchased_at: string;
      transaction_id: string | null;
      lifter_title_id: string | null;
      rex_costume: string | null;
      active_theme_id: string | null;
    }>('SELECT * FROM supporter_status ORDER BY id DESC LIMIT 1');
    if (!row) return null;
    return {
      id: row.id,
      tier: row.tier as SupporterTier,
      purchasedAt: row.purchased_at,
      transactionId: row.transaction_id,
      lifterTitleId: row.lifter_title_id,
      rexCostume: (row.rex_costume as RexCostume) ?? null,
      activeThemeId: row.active_theme_id,
    };
  } catch {
    return null;
  }
}

export function saveSupporterStatus(tier: SupporterTier, transactionId: string): void {
  const db = getDatabase();
  const existing = getSupporterStatus();
  const now = new Date().toISOString();

  // Only upgrade, never downgrade
  if (existing && TIER_ORDER[existing.tier] >= TIER_ORDER[tier]) {
    return;
  }

  const rexCostume = tier === 'CHEAT_MEAL' ? 'sunglasses' : null;

  if (existing) {
    db.runSync(
      `UPDATE supporter_status SET tier = ?, purchased_at = ?, transaction_id = ?, rex_costume = ? WHERE id = ?`,
      [tier, now, transactionId, rexCostume, existing.id]
    );
  } else {
    db.runSync(
      `INSERT INTO supporter_status (id, tier, purchased_at, transaction_id, rex_costume) VALUES (1, ?, ?, ?, ?)`,
      [tier, now, transactionId, rexCostume]
    );
  }
}

export function setLifterTitle(titleId: string): void {
  try {
    const db = getDatabase();
    db.runSync('UPDATE supporter_status SET lifter_title_id = ?', [titleId]);
  } catch { /* ignore */ }
}

export function setActiveTheme(themeId: string | null): void {
  try {
    const db = getDatabase();
    db.runSync('UPDATE supporter_status SET active_theme_id = ?', [themeId]);
  } catch { /* ignore */ }
}

export function isSupporter(): boolean {
  return getSupporterStatus() !== null;
}

export function getTier(): SupporterTier | null {
  return getSupporterStatus()?.tier ?? null;
}

export type SupporterPerk = 'badge' | 'founding_badge' | 'themes' | 'rex_costume' | 'lifter_title';

export function hasPerk(perk: SupporterPerk): boolean {
  const tier = getTier();
  if (!tier) return false;
  const order = TIER_ORDER[tier];
  switch (perk) {
    case 'badge':        return order >= 1;
    case 'founding_badge': return order >= 2;
    case 'themes':       return order >= 2;
    case 'rex_costume':  return order >= 3;
    case 'lifter_title': return order >= 3;
  }
}
