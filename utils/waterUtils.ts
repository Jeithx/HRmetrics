export type WaterUnit = 'ml' | 'oz';

const OZ_PER_ML = 0.033814;

export function mlToDisplay(ml: number, unit: WaterUnit): number {
  if (unit === 'oz') return Math.round(ml * OZ_PER_ML * 10) / 10;
  return Math.round(ml);
}

export function displayToMl(value: number, unit: WaterUnit): number {
  if (unit === 'oz') return Math.round(value / OZ_PER_ML);
  return Math.round(value);
}

export function formatWater(ml: number, unit: WaterUnit): string {
  if (unit === 'oz') return `${(ml * OZ_PER_ML).toFixed(1)} oz`;
  return `${ml.toLocaleString()} ml`;
}
