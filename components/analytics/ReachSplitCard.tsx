import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Users } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface AgeSegment {
  value: string;   // e.g. "18-24"
  count: number;
  pct: number;
}

interface Props {
  ageData: AgeSegment[];
}

const AGE_COLORS: Record<string, [string, string]> = {
  '13-17': ['#06B6D4', '#0891B2'],
  '18-24': ['#6366F1', '#4F46E5'],
  '25-34': ['#A855F7', '#9333EA'],
  '35-44': ['#EC4899', '#DB2777'],
  '45+':   ['#F59E0B', '#D97706'],
};

const FALLBACK_COLORS: [string, string][] = [
  ['#6366F1', '#4F46E5'],
  ['#A855F7', '#9333EA'],
  ['#EC4899', '#DB2777'],
  ['#06B6D4', '#0891B2'],
  ['#F59E0B', '#D97706'],
];

export function ReachSplitCard({ ageData }: Props) {
  if (!ageData || ageData.length === 0) return null;

  const totalCount = ageData.reduce((sum, d) => sum + d.count, 0);
  const sorted = [...ageData].sort((a, b) => {
    const order = ['13-17', '18-24', '25-34', '35-44', '45+'];
    return order.indexOf(a.value) - order.indexOf(b.value);
  });

  const topSegment = sorted.reduce((a, b) => (a.pct > b.pct ? a : b), sorted[0]);

  return (
    <Animated.View entering={FadeInUp.delay(120).springify()}>
      <View style={styles.card}>
        <LinearGradient
          colors={['#6366F1', '#A855F7', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topStrip}
        />
        <View style={styles.body}>
          <View style={styles.headerRow}>
            <View style={styles.iconBox}>
              <Users size={14} color="#A855F7" />
            </View>
            <Text style={styles.label}>Audience Age Split</Text>
          </View>

          <Text style={styles.total}>{totalCount.toLocaleString()}</Text>
          <Text style={styles.totalSub}>viewers with age data</Text>

          {/* Multi-segment bar */}
          <View style={styles.barTrack}>
            {sorted.map((seg, i) => {
              const colors = AGE_COLORS[seg.value] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
              return (
                <LinearGradient
                  key={seg.value}
                  colors={colors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.barSeg, { flex: Math.max(seg.pct, 1) }]}
                />
              );
            })}
          </View>

          {/* Legend grid */}
          <View style={styles.legendGrid}>
            {sorted.map((seg, i) => {
              const colors = AGE_COLORS[seg.value] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
              const isTop = seg.value === topSegment.value;
              return (
                <View key={seg.value} style={[styles.legendItem, isTop && styles.legendItemTop]}>
                  <View style={[styles.dot, { backgroundColor: colors[0] }]} />
                  <View>
                    <Text style={styles.legendPct}>{seg.pct.toFixed(1)}%</Text>
                    <Text style={styles.legendSub}>{seg.value}</Text>
                  </View>
                  {isTop && <View style={styles.topBadge}><Text style={styles.topBadgeText}>top</Text></View>}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.22)',
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 8,
  },
  topStrip: { height: 3 },
  body: { padding: 18 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(168,85,247,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  total: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
  },
  totalSub: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 11,
    marginBottom: 20,
    marginTop: 2,
  },
  barTrack: {
    height: 10,
    flexDirection: 'row',
    borderRadius: 5,
    overflow: 'hidden',
    gap: 2,
    marginBottom: 18,
  },
  barSeg: {
    height: '100%',
    borderRadius: 5,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: '28%',
  },
  legendItemTop: {
    // subtle highlight on the dominant group
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendPct: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  legendSub: {
    color: 'rgba(255,255,255,0.32)',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  topBadge: {
    backgroundColor: 'rgba(168,85,247,0.2)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 2,
  },
  topBadgeText: {
    color: '#A855F7',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
