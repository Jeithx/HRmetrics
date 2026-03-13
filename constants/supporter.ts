export const PRODUCT_IDS = {
  PRE_WORKOUT: 'com.jeithx.hrmetrics.support_tier1',
  CHICKEN_RICE: 'com.jeithx.hrmetrics.support_tier2',
  CHEAT_MEAL: 'com.jeithx.hrmetrics.support_tier3',
  MASS_GAINER: 'com.jeithx.hrmetrics.support_tier4',
} as const;

export interface TierPerk {
  id: string;
  productId: string;
  name: string;
  price: string;
  emoji: string;
  tagline: string;
  description: string;
  perks: string[];
  badge: string;
  badgeLabel: string;
  highlighted?: boolean;
}

export const SUPPORTER_TIERS: TierPerk[] = [
  {
    id: 'PRE_WORKOUT',
    productId: PRODUCT_IDS.PRE_WORKOUT,
    name: 'Pre-Workout',
    price: '₺29',
    emoji: '⚡',
    tagline: 'Buy the dev a sugar-free energy drink',
    description: 'For the cutting season.',
    perks: [
      'Supporter badge on your profile',
      'Special thank-you message from REX',
    ],
    badge: '⚡',
    badgeLabel: 'Supporter',
  },
  {
    id: 'CHICKEN_RICE',
    productId: PRODUCT_IDS.CHICKEN_RICE,
    name: 'Chicken & Rice',
    price: '₺79',
    emoji: '🍗',
    tagline: 'Buy the dev a proper meal',
    description: 'The classic bulk fuel.',
    perks: [
      'Everything in Pre-Workout',
      '"Founding Bro" gold badge',
      '2 exclusive app themes',
    ],
    badge: '🥇',
    badgeLabel: 'Founding Bro',
    highlighted: true,
  },
  {
    id: 'CHEAT_MEAL',
    productId: PRODUCT_IDS.CHEAT_MEAL,
    name: 'Cheat Meal',
    price: '₺149',
    emoji: '🍿',
    tagline: 'Buy the dev Korean popcorn chicken',
    description: 'The weekly reward meal.',
    perks: [
      'Everything in Chicken & Rice',
      'REX gets a costume (sunglasses)',
      'Choose your Lifter Title',
      'All future cosmetic features, forever',
    ],
    badge: '👑',
    badgeLabel: 'Cheat Meal Legend',
  },
  {
    id: 'MASS_GAINER',
    productId: PRODUCT_IDS.MASS_GAINER,
    name: 'Mass Gainer',
    price: '₺999',
    emoji: '🏋️',
    tagline: "Buy the dev a full semester's worth of protein",
    description: 'The absolute unit tier.',
    perks: [
      'Everything in Cheat Meal',
      'Exclusive "Obsidian Gold" theme',
      '"Absolute Unit" lifter title',
      'Name in the app credits (coming soon)',
      'Undying gratitude from a CS student',
    ],
    badge: '💎',
    badgeLabel: 'Absolute Unit',
  },
];

export interface LifterTitle {
  id: string;
  label: string;
  emoji: string;
}

export const LIFTER_TITLES: LifterTitle[] = [
  { id: 'gainz_lord',          label: 'The Gainz Lord',      emoji: '🏆' },
  { id: 'iron_bro',            label: 'Iron Bro',            emoji: '🔩' },
  { id: 'founding_lifter',     label: 'Founding Lifter',     emoji: '🏛️' },
  { id: 'preworkout_prophet',  label: 'Pre-Workout Prophet', emoji: '⚡' },
  { id: 'chicken_rice_chad',   label: 'Chicken Rice Chad',   emoji: '🍗' },
  { id: 'cheat_meal_legend',   label: 'Cheat Meal Legend',   emoji: '🍿' },
  { id: 'absolute_unit',       label: 'Absolute Unit',       emoji: '🏋️' },
];

export interface SupporterTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    background: string;
    surface: string;
    surfaceElevated: string;
    primary: string;
    border: string;
  };
}

export const SUPPORTER_THEMES: SupporterTheme[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Pure black, zero compromise',
    colors: {
      background: '#000000',
      surface: '#0A0A0A',
      surfaceElevated: '#111111',
      primary: '#C8FF00',
      border: '#1A1A1A',
    },
  },
  {
    id: 'carbon',
    name: 'Carbon',
    description: 'Dark grey with blue accent',
    colors: {
      background: '#0D0D0F',
      surface: '#16161A',
      surfaceElevated: '#1E1E24',
      primary: '#4FC3F7',
      border: '#25252D',
    },
  },
  {
    id: 'obsidian_gold',
    name: 'Obsidian Gold',
    description: 'Mass Gainer exclusive — deep black with gold',
    colors: {
      background: '#0A0800',
      surface: '#141000',
      surfaceElevated: '#1E1800',
      primary: '#FFB800',
      border: '#2A2200',
    },
    exclusiveTier: 'MASS_GAINER',
  } as SupporterTheme & { exclusiveTier: string },
];

export const TIER_MESSAGES: Record<string, string> = {
  PRE_WORKOUT: 'Thanks for the energy drink. Seriously, it means a lot.',
  CHICKEN_RICE: "Chicken & rice secured. You're a Founding Bro now — that title is permanent.",
  CHEAT_MEAL: 'Korean popcorn chicken incoming 🍿 You\'re a legend.',
  MASS_GAINER: "A full semester's worth of protein. You're an Absolute Unit and I mean that. 🏋️",
};
