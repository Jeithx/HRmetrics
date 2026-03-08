/**
 * RexWideWidget — 4×2 home screen widget
 * Shows REX panel + insight title + message + stats strip.
 */
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { ColorProp } from 'react-native-android-widget/lib/typescript/widgets/utils/style.props';
import type { WidgetData } from './RexSmallWidget';

export interface WideWidgetData extends WidgetData {
  insightMessage: string;
  weekVolumeKg: number;
  waterPct: number; // 0-100
}

const CATEGORY_COLOR: Record<string, ColorProp> = {
  workout: '#C8FF00',
  weight: '#FF9500',
  water: '#4FC3F7',
  recovery: '#FF6B6B',
  milestone: '#A78BFA',
};

const DEFAULT_ACCENT: ColorProp = '#C8FF00';

export function RexWideWidget({
  insightIcon,
  insightTitle,
  insightMessage,
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
        backgroundColor: '#1A1A1A',
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      {/* Left panel — REX face */}
      <FlexWidget
        style={{
          width: 76,
          backgroundColor: '#242424',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexGap: 4,
          padding: 8,
        }}
      >
        {/* Robot head */}
        <FlexWidget
          style={{
            flexDirection: 'column',
            alignItems: 'center',
            flexGap: 2,
          }}
        >
          {/* Head box */}
          <FlexWidget
            style={{
              width: 42,
              backgroundColor: '#C8FF00',
              borderRadius: 8,
              padding: 4,
              flexDirection: 'column',
              alignItems: 'center',
              flexGap: 4,
            }}
          >
            {/* Eyes row */}
            <FlexWidget style={{ flexDirection: 'row', flexGap: 6 }}>
              <FlexWidget style={{ width: 10, height: 10, backgroundColor: '#0F0F0F', borderRadius: 2 }} />
              <FlexWidget style={{ width: 10, height: 10, backgroundColor: '#0F0F0F', borderRadius: 2 }} />
            </FlexWidget>
            {/* Mouth */}
            <FlexWidget style={{ width: 22, height: 4, backgroundColor: '#0F0F0F', borderRadius: 2 }} />
          </FlexWidget>
          {/* Neck */}
          <FlexWidget style={{ width: 14, height: 4, backgroundColor: '#C8FF00', borderRadius: 1 }} />
          {/* Body */}
          <FlexWidget style={{ width: 36, height: 10, backgroundColor: '#888888', borderRadius: 4 }} />
        </FlexWidget>

        <TextWidget
          text="REX"
          style={{ color: '#C8FF00', fontSize: 9, fontWeight: 'bold' }}
        />
      </FlexWidget>

      {/* Right panel — content */}
      <FlexWidget
        style={{
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 14,
        }}
      >
        {/* Insight */}
        <FlexWidget style={{ flexDirection: 'column', flexGap: 4 }}>
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', flexGap: 6 }}>
            <TextWidget text={insightIcon} style={{ fontSize: 14 }} />
            <TextWidget
              text={insightTitle}
              style={{ color: accent, fontSize: 13, fontWeight: 'bold' }}
              maxLines={1}
            />
          </FlexWidget>
          <TextWidget
            text={insightMessage}
            style={{ color: '#888888', fontSize: 11 }}
            maxLines={2}
          />
        </FlexWidget>

        {/* Stats strip */}
        <FlexWidget style={{ flexDirection: 'row', flexGap: 14 }}>
          <FlexWidget style={{ flexDirection: 'column', flexGap: 1 }}>
            <TextWidget
              text={String(weekCount)}
              style={{ color: '#CCCCCC', fontSize: 14, fontWeight: 'bold' }}
            />
            <TextWidget
              text="workouts"
              style={{ color: '#444444', fontSize: 9 }}
            />
          </FlexWidget>
          <FlexWidget style={{ width: 1, height: 'match_parent', backgroundColor: '#2A2A2A' }} />
          <FlexWidget style={{ flexDirection: 'column', flexGap: 1 }}>
            <TextWidget
              text={vol}
              style={{ color: '#CCCCCC', fontSize: 14, fontWeight: 'bold' }}
            />
            <TextWidget
              text="volume"
              style={{ color: '#444444', fontSize: 9 }}
            />
          </FlexWidget>
          <FlexWidget style={{ width: 1, height: 'match_parent', backgroundColor: '#2A2A2A' }} />
          <FlexWidget style={{ flexDirection: 'column', flexGap: 1 }}>
            <TextWidget
              text={`${waterPct}%`}
              style={{ color: '#4FC3F7', fontSize: 14, fontWeight: 'bold' }}
            />
            <TextWidget
              text="hydration"
              style={{ color: '#444444', fontSize: 9 }}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
