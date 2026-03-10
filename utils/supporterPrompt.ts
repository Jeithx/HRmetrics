import { getSetting, setSetting } from '../db/settingsQueries';
import { isSupporter } from '../db/supporterQueries';

export type SupportTrigger =
  | 'new_pr'
  | 'streak_4weeks'
  | 'streak_8weeks'
  | 'day_30'
  | 'water_streak_7';

/** All conditions must pass for the prompt to show */
export function shouldShowSupportPrompt(_trigger: SupportTrigger): boolean {
  try {
    // Never show to existing supporters
    if (isSupporter()) return false;

    // App must have been used for 7+ days
    const firstLaunch = getSetting('first_launch_date');
    if (!firstLaunch) return false;
    const daysSinceLaunch = (Date.now() - new Date(firstLaunch).getTime()) / 86400000;
    if (daysSinceLaunch < 7) return false;

    // Max 3 prompt showings total
    const count = parseInt(getSetting('support_prompt_count') || '0', 10);
    if (count >= 3) return false;

    // Must be at least 30 days since last shown
    const lastShown = getSetting('support_prompt_last_shown');
    if (lastShown) {
      const daysSinceLast = (Date.now() - new Date(lastShown).getTime()) / 86400000;
      if (daysSinceLast < 30) return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function recordPromptShown(): void {
  try {
    const count = parseInt(getSetting('support_prompt_count') || '0', 10);
    setSetting('support_prompt_count', String(count + 1));
    setSetting('support_prompt_last_shown', new Date().toISOString());
  } catch { /* ignore */ }
}
