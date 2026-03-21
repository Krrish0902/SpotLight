import React from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Polygon, Text as SvgText } from 'react-native-svg';
import { Text } from '../ui/Text';

export interface FunnelStep {
  label: string;
  count: number;
  dropOffPct: number;
}

export interface FunnelChartProps {
  steps: FunnelStep[];
  height?: number;
}

const STEP_COLORS = ['#6366F1', '#7C3AED', '#9333EA', '#A855F7', '#10B981'];

export const FunnelChart: React.FC<FunnelChartProps> = React.memo(({ steps, height = 260 }) => {
  const [width, setWidth] = React.useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (!steps || steps.length === 0) return null;

  const maxCount = Math.max(...steps.map(s => s.count), 1);
  const stepH = height / steps.length;

  return (
    <View style={[styles.container]} onLayout={onLayout}>
      {width > 0 && (
        <Svg width="100%" height={height} style={styles.svg}>
          <Defs>
            {STEP_COLORS.map((color, idx) => (
              <SvgGradient key={idx} id={`grad${idx}`} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={color} stopOpacity="0.9" />
                <Stop offset="1" stopColor={STEP_COLORS[Math.min(idx + 1, STEP_COLORS.length - 1)]} stopOpacity="0.7" />
              </SvgGradient>
            ))}
          </Defs>

          {steps.map((step, idx) => {
            const maxW = width * 0.72;
            const topW = maxW * (step.count / maxCount);
            const nextCount = idx < steps.length - 1 ? steps[idx + 1].count : step.count;
            const bottomW = maxW * (nextCount / maxCount);
            const cx = width / 2;
            const yTop = idx * stepH + 2;
            const yBottom = (idx + 1) * stepH - 2;

            return (
              <React.Fragment key={idx}>
                <Polygon
                  points={`
                    ${cx - topW / 2},${yTop}
                    ${cx + topW / 2},${yTop}
                    ${cx + bottomW / 2},${yBottom}
                    ${cx - bottomW / 2},${yBottom}
                  `}
                  fill={`url(#grad${idx})`}
                />
                {/* Count label */}
                <SvgText
                  x={cx}
                  y={yTop + stepH / 2 + 1}
                  fill="#fff"
                  fontSize="15"
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {step.count.toLocaleString()}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      )}

      {/* Labels overlay */}
      <View style={[StyleSheet.absoluteFill]} pointerEvents="none">
        {steps.map((step, idx) => (
          <View key={idx} style={[styles.labelRow, { height: stepH }]}>
            <View style={styles.labelLeft}>
              <View style={[styles.labelDot, { backgroundColor: STEP_COLORS[idx] }]} />
              <Text style={styles.labelText}>{step.label}</Text>
            </View>
            {idx > 0 && step.dropOffPct > 0 ? (
              <View style={styles.dropPill}>
                <Text style={styles.dropText}>-{step.dropOffPct}%</Text>
              </View>
            ) : <View style={{ width: 52 }} />}
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
    marginVertical: 8,
  },
  svg: {},
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  labelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: 90,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  labelText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    fontWeight: '600',
  },
  dropPill: {
    backgroundColor: 'rgba(244,63,94,0.15)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.3)',
    width: 52,
    alignItems: 'center',
  },
  dropText: {
    color: '#F43F5E',
    fontSize: 10,
    fontWeight: '800',
  },
});
