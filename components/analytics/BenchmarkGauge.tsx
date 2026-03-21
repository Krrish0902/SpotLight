import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export interface BenchmarkGaugeProps {
  artistValue: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  metricLabel: string;
}

export const BenchmarkGauge: React.FC<BenchmarkGaugeProps> = React.memo(({
  artistValue, p25, p50, p75, p90, metricLabel
}) => {
  const pointerX = useSharedValue(0);
  const maxGauged = Math.max(p90 * 1.2, artistValue * 1.1, 1);
  const getPct = (val: number) => Math.min((val / maxGauged) * 100, 100);

  useEffect(() => {
    pointerX.value = withSpring(getPct(artistValue), { damping: 14, stiffness: 90 });
  }, [artistValue, maxGauged]);

  const pointerStyle = useAnimatedStyle(() => ({
    left: `${pointerX.value}%` as any,
  }));

  const fmt = (v: number) => v.toFixed(1);

  const markers = [
    { val: p25, label: 'P25' },
    { val: p50, label: 'P50' },
    { val: p75, label: 'P75' },
    { val: p90, label: 'P90' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.metricLabel}>{metricLabel}</Text>
        <View style={styles.valuePill}>
          <Text style={styles.valuePillText}>{fmt(artistValue)}%</Text>
        </View>
      </View>

      <View style={styles.gaugeArea}>
        {/* Gradient track */}
        <LinearGradient
          colors={['#1E1B4B', '#4338CA', '#7C3AED', '#C026D3', '#DB2777']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.track}
        />

        {/* Percentile tick marks */}
        {markers.map(m => (
          <View key={m.label} style={[styles.tickWrapper, { left: `${getPct(m.val)}%` as any }]}>
            <View style={styles.tick} />
            <Text style={styles.tickLabel}>{m.label}</Text>
            <Text style={styles.tickVal}>{fmt(m.val)}</Text>
          </View>
        ))}

        {/* Animated "You" pointer */}
        <Animated.View style={[styles.pointerWrapper, pointerStyle]}>
          <View style={styles.pointerChip}>
            <Text style={styles.pointerChipText}>You</Text>
          </View>
          <View style={styles.pointerLine} />
          <View style={styles.pointerDot} />
        </Animated.View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '700',
  },
  valuePill: {
    backgroundColor: 'rgba(99,102,241,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.4)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  valuePillText: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '800',
  },
  gaugeArea: {
    position: 'relative',
    height: 56,
    justifyContent: 'center',
  },
  track: {
    height: 8,
    borderRadius: 4,
    width: '100%',
  },
  tickWrapper: {
    position: 'absolute',
    top: 12,
    alignItems: 'center',
    width: 28,
    marginLeft: -14,
  },
  tick: {
    width: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginBottom: 2,
  },
  tickLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tickVal: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 8,
  },
  pointerWrapper: {
    position: 'absolute',
    top: -18,
    alignItems: 'center',
    width: 44,
    marginLeft: -22,
  },
  pointerChip: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 2,
  },
  pointerChipText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
  },
  pointerLine: {
    width: 2,
    height: 22,
    backgroundColor: '#10B981',
    opacity: 0.8,
  },
  pointerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginTop: -4,
  },
});
