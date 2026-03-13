import { create } from 'zustand';
import * as RNIap from 'react-native-iap';
import type { Purchase } from 'react-native-iap';
import {
  SupporterStatus,
  SupporterTier,
  SupporterPerk,
  getSupporterStatus,
  saveSupporterStatus,
  setLifterTitle as dbSetLifterTitle,
  setActiveTheme as dbSetActiveTheme,
  isSupporter as dbIsSupporter,
  getTier as dbGetTier,
} from '../db/supporterQueries';
import { PRODUCT_IDS, SUPPORTER_TIERS } from '../constants/supporter';

// ─── DEV_MODE: skip Play Store, simulate 1s delay ────────────────────────────
// Set to false before production release
const DEV_MODE = __DEV__;

function productIdToTier(productId: string): SupporterTier | null {
  if (productId === PRODUCT_IDS.PRE_WORKOUT)  return 'PRE_WORKOUT';
  if (productId === PRODUCT_IDS.CHICKEN_RICE) return 'CHICKEN_RICE';
  if (productId === PRODUCT_IDS.CHEAT_MEAL)   return 'CHEAT_MEAL';
  if (productId === PRODUCT_IDS.MASS_GAINER)  return 'MASS_GAINER';
  return null;
}

interface IapProduct {
  productId: string;
  title: string;
  description: string;
  localizedPrice: string;
}

interface SupporterStore {
  status: SupporterStatus | null;
  isSupporter: boolean;
  tier: SupporterTier | null;
  isLoading: boolean;
  isPurchasing: boolean;
  products: IapProduct[];
  successTier: SupporterTier | null; // drives success modal

  loadStatus: () => void;
  loadProducts: () => Promise<void>;
  purchase: (productId: string) => Promise<void>;
  restorePurchases: () => Promise<void>;
  setLifterTitle: (titleId: string) => void;
  setActiveTheme: (themeId: string | null) => void;
  dismissSuccess: () => void;
}

// Listener reference kept outside store to avoid reinstalling on re-renders
let purchaseListener: RNIap.EventSubscription | null = null;

function setupPurchaseListener(onSuccess: (tier: SupporterTier) => void) {
  if (DEV_MODE || purchaseListener) return;
  purchaseListener = RNIap.purchaseUpdatedListener((purchase: Purchase) => {
    try {
      if (purchase.transactionId) {
        RNIap.finishTransaction({ purchase, isConsumable: false }).catch(() => {});
        const tier = productIdToTier(purchase.productId);
        if (tier) {
          saveSupporterStatus(tier, purchase.transactionId);
          onSuccess(tier);
        }
      }
    } catch { /* ignore */ }
  });
}

export const useSupporterStore = create<SupporterStore>((set, get) => {
  // Wire up listener once on store creation
  setupPurchaseListener((tier) => {
    get().loadStatus();
    set({ successTier: tier, isPurchasing: false });
  });

  return {
    status: null,
    isSupporter: false,
    tier: null,
    isLoading: false,
    isPurchasing: false,
    products: [],
    successTier: null,

    loadStatus: () => {
      const status = getSupporterStatus();
      set({
        status,
        isSupporter: dbIsSupporter(),
        tier: dbGetTier(),
      });
    },

    loadProducts: async () => {
      if (DEV_MODE) {
        const devProducts: IapProduct[] = SUPPORTER_TIERS.map((t) => ({
          productId: t.productId,
          title: t.name,
          description: t.tagline,
          localizedPrice: t.price,
        }));
        set({ products: devProducts });
        return;
      }
      try {
        const skus = Object.values(PRODUCT_IDS);
        const fetched = await RNIap.fetchProducts({ skus });
        const items = fetched ?? [];
        const products: IapProduct[] = items.map((p) => ({
          productId: p.id,
          title: p.title,
          description: p.description,
          localizedPrice: p.displayPrice,
        }));
        set({ products });
      } catch { /* Play Store unavailable — keep empty */ }
    },

    purchase: async (productId: string) => {
      set({ isPurchasing: true });
      try {
        if (DEV_MODE) {
          await new Promise<void>((resolve) => setTimeout(resolve, 1000));
          const tier = productIdToTier(productId);
          if (tier) {
            saveSupporterStatus(tier, 'dev_transaction_' + Date.now());
            get().loadStatus();
            set({ successTier: tier });
          }
          set({ isPurchasing: false });
          return;
        }
        await RNIap.requestPurchase({
          request: { google: { skus: [productId] } },
          type: 'in-app',
        });
        // Listener handles success + isPurchasing=false
      } catch (err: unknown) {
        const iapErr = err as { code?: string };
        if (iapErr?.code !== 'E_USER_CANCELLED') {
          console.warn('[IAP] purchase error:', err);
        }
        set({ isPurchasing: false });
      }
    },

    restorePurchases: async () => {
      set({ isLoading: true });
      try {
        if (DEV_MODE) {
          await new Promise<void>((resolve) => setTimeout(resolve, 800));
          get().loadStatus();
          set({ isLoading: false });
          return;
        }
        const purchases = await RNIap.getAvailablePurchases();
        const tierOrder: Record<SupporterTier, number> = {
          PRE_WORKOUT: 1, CHICKEN_RICE: 2, CHEAT_MEAL: 3, MASS_GAINER: 4,
        };
        let highestTier: SupporterTier | null = null;
        let latestTxId = 'restored';
        for (const p of purchases) {
          const tier = productIdToTier(p.productId);
          if (tier && (!highestTier || tierOrder[tier] > tierOrder[highestTier])) {
            highestTier = tier;
            latestTxId = p.transactionId ?? 'restored';
          }
        }
        if (highestTier) {
          saveSupporterStatus(highestTier, latestTxId);
          get().loadStatus();
        }
      } catch { /* ignore */ }
      finally {
        set({ isLoading: false });
      }
    },

    setLifterTitle: (titleId: string) => {
      dbSetLifterTitle(titleId);
      set({ status: getSupporterStatus() });
    },

    setActiveTheme: (themeId: string | null) => {
      dbSetActiveTheme(themeId);
      set({ status: getSupporterStatus() });
    },

    dismissSuccess: () => set({ successTier: null }),
  };
});

export { hasPerk } from '../db/supporterQueries';
export type { SupporterPerk };
