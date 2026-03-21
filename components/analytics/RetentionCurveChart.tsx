import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { LineChart } from 'react-native-gifted-charts';
import { Activity } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface RetentionPoint {
  checkpoint: number;
  avg_retention: number;
}

export function RetentionCurveChart({ data }: { data: RetentionPoint[] }) {
  if (!data?.length) return null;

  const chartData = data.map(d => ({
    value: Number(d.avg_retention),
    label: `${d.checkpoint}%`,
    customDataPoint: () => <View style={styles.point} />
  }));

  return (
    <Animated.View entering={FadeInUp.delay(400).springify()}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Activity size={16} color="#f43f5e" />
          </View>
          <Text style={styles.title}>Audience Retention Curve</Text>
        </View>

        <View style={styles.chartWrapper}>
          <LineChart
            data={chartData}
            height={160}
            hideDataPoints={false}
            hideRules
            thickness={3}
            color="#f43f5e"
            yAxisColor="#27272a"
            xAxisColor="#27272a"
            yAxisTextStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}
            xAxisLabelTextStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}
            stepValue={25}
            maxValue={100}
            noOfSections={4}
            areaChart
            startFillColor="rgba(244,63,94,0.3)"
            endFillColor="rgba(244,63,94,0.01)"
            startOpacity={0.9}
            endOpacity={0.2}
            curved
            isAnimated
          />
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#18181b', padding: 16, borderRadius: 12, borderColor: '#27272a', borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  iconContainer: { padding: 6, backgroundColor: 'rgba(244,63,94,0.1)', borderRadius: 8 },
  title: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  chartWrapper: { marginLeft: -10, overflow: 'hidden' },
  point: { width: 6, height: 6, backgroundColor: '#f43f5e', borderRadius: 3, borderWidth: 1, borderColor: '#000' }
});
