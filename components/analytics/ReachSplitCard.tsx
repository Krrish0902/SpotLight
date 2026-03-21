import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Users } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface Props {
  followerReach: number;
  nonFollowerReach: number;
  totalReach: number;
}

export function ReachSplitCard({ followerReach, nonFollowerReach, totalReach }: Props) {
  const followerPct = totalReach > 0 ? (followerReach / totalReach) * 100 : 0;
  const nonFollowerPct = totalReach > 0 ? (nonFollowerReach / totalReach) * 100 : 0;

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
            <Text style={styles.label}>Audience Reach Split</Text>
          </View>

          <Text style={styles.total}>{totalReach.toLocaleString()}</Text>
          <Text style={styles.totalSub}>unique accounts reached</Text>

          <View style={styles.barTrack}>
            <LinearGradient
              colors={['#6366F1', '#818CF8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.barSeg, { flex: Math.max(followerPct, 0.5) }]}
            />
            <LinearGradient
              colors={['#A855F7', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.barSeg, { flex: Math.max(nonFollowerPct, 0.5) }]}
            />
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#6366F1' }]} />
              <View>
                <Text style={styles.legendPct}>{followerPct.toFixed(1)}%</Text>
                <Text style={styles.legendSub}>Followers</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#EC4899' }]} />
              <View>
                <Text style={styles.legendPct}>{nonFollowerPct.toFixed(1)}%</Text>
                <Text style={styles.legendSub}>Non-Followers</Text>
              </View>
            </View>
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
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendPct: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  legendSub: {
    color: 'rgba(255,255,255,0.32)',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
});
