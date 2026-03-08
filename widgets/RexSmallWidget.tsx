/**
 * RexSmallWidget — 2×2 home screen widget
 * Shows REX face + top insight title + week workout count.
 */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { ColorProp } from 'react-native-android-widget/lib/typescript/widgets/utils/style.props';

export interface WidgetData {
  insightIcon: string;
  insightTitle: string;
  insightCategory: string;
  weekCount: number;
}

const CATEGORY_COLOR: Record<string, ColorProp> = {
  workout: '#C8FF00',
  weight: '#FF9500',
  water: '#4FC3F7',
  recovery: '#FF6B6B',
  milestone: '#A78BFA',
};

const DEFAULT_ACCENT: ColorProp = '#C8FF00';

export function RexSmallWidget({ insightIcon, insightTitle, insightCategory, weekCount }: WidgetData) {
  const accent = CATEGORY_COLOR[insightCategory] ?? DEFAULT_ACCENT;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#1A1A1A',
        borderRadius: 20,
        padding: 14,
      }}
    >
      {/* Header: REX label */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', flexGap: 6 }}>
        <TextWidget
          text="🤖"
          style={{ fontSize: 20 }}
        />
        <TextWidget
          text="REX"
          style={{ color: '#C8FF00', fontSize: 10, fontWeight: 'bold' }}
        />
      </FlexWidget>

      {/* Insight */}
      <FlexWidget style={{ flexDirection: 'column', flexGap: 4 }}>
        <TextWidget
          text={insightIcon}
          style={{ fontSize: 18 }}
        />
        <TextWidget
          text={insightTitle}
          style={{
            color: accent,
            fontSize: 12,
            fontWeight: 'bold',
          }}
          maxLines={3}
        />
      </FlexWidget>

      {/* Footer: week count */}
      <TextWidget
        text={weekCount > 0 ? `${weekCount} workout${weekCount !== 1 ? 's' : ''} this week` : 'Start your first workout'}
        style={{ color: '#555555', fontSize: 10 }}
      />
    </FlexWidget>
  );
}
