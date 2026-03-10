/**
 * RexWideWidget — 4×1 home screen widget
 */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { ColorProp } from 'react-native-android-widget/lib/typescript/widgets/utils/style.props';
import type { WidgetData } from './RexSmallWidget';

export interface WideWidgetData extends WidgetData {
  weekVolumeKg: number;
  waterPct: number;
}

const CATEGORY_COLOR: Record<string, ColorProp> = {
  workout: '#C8FF00',
  weight: '#FF9500',
  water: '#4FC3F7',
  recovery: '#FF6B6B',
  milestone: '#A78BFA',
};

const DEFAULT_ACCENT: ColorProp = '#C8FF00';

function StatCol({ value, label, accent }: {
  value: string; label: string; accent?: ColorProp;
}) {
  return (
    <FlexWidget style={{ flexDirection: 'column', alignItems: 'center', flexGap: 2 }}>
      <TextWidget
        text={value}
        style={{ color: accent ?? '#CCCCCC', fontSize: 14, fontWeight: 'bold' }}
      />
      <TextWidget text={label} style={{ color: '#666666', fontSize: 9 }} />
    </FlexWidget>
  );
}

export function RexWideWidget({
  insightIcon,
  insightTitle,
  insightCategory,
  weekCount,
  weekVolumeKg,
  waterPct,
}: WideWidgetData) {
  const accent = CATEGORY_COLOR[insightCategory] ?? DEFAULT_ACCENT;
  const vol = weekVolumeKg >= 1000
    ? `${(weekVolumeKg / 1000).toFixed(1)}t`
    : `${Math.round(weekVolumeKg)}kg`;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1A1A1A',
        // Use 16dp — matches Android 12+ system_app_widget_background_radius.
        // No overflow: hidden on root — that clips at rectangular bounds,
        // causing corners to look different from the background radius.
        borderRadius: 16,
        paddingLeft: 14,
        paddingRight: 14,
        paddingTop: 8,
        paddingBottom: 8,
      }}
    >
      {/* REX label — fixed width, never shrinks */}
      <TextWidget
        text="REX"
        style={{ color: '#C8FF00', fontSize: 12, fontWeight: 'bold' }}
      />

      {/* Divider */}
      <FlexWidget style={{
        width: 1,
        height: 30,
        backgroundColor: '#333333',
        marginLeft: 12,
        marginRight: 12,
      }} />

      {/* Insight section — takes all remaining space */}
      <FlexWidget style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexGap: 6 }}>
        <TextWidget text={insightIcon} style={{ fontSize: 14 }} />
        <TextWidget
          text={insightTitle}
          style={{ color: accent, fontSize: 11, fontWeight: 'bold' }}
          maxLines={2}
        />
      </FlexWidget>

      {/* Divider */}
      <FlexWidget style={{
        width: 1,
        height: 30,
        backgroundColor: '#333333',
        marginLeft: 12,
        marginRight: 12,
      }} />

      {/* Stats — fixed, never shrinks */}
      <FlexWidget style={{ flexDirection: 'row', flexGap: 16, alignItems: 'center' }}>
        <StatCol value={String(weekCount)} label="workouts" />
        <StatCol value={vol} label="volume" />
        <StatCol value={`${waterPct}%`} label="hydration" accent="#4FC3F7" />
      </FlexWidget>
    </FlexWidget>
  );
}
