import React from 'react';
import { View, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Text } from '../ui/Text';

export interface TrendSeries {
  label: string;
  color: string;
}

export interface TrendLineChartProps {
  data: { day: Date; value: number }[][];
  series: TrendSeries[];
  height?: number;
  loading?: boolean;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
// 20px screen padding each side + 20px card padding each side = 80px total horizontal inset
const CHART_WIDTH = SCREEN_WIDTH - 80;

export const TrendLineChart: React.FC<TrendLineChartProps> = React.memo(({ data, series, height = 200, loading }) => {
  if (loading) {
    return (
      <View style={[styles.container, { height, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#6366F1" />
      </View>
    );
  }

  if (!data || data.length === 0 || !data[0].length) {
    return (
      <View style={[styles.container, { height, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: 'rgba(255,255,255,0.4)' }}>No data available for this period.</Text>
      </View>
    );
  }

  const chartData = data[0].map((item, idx) => ({
    value: item.value,
    label: item.day.getDate().toString(), // simplified X axis
    dataPointText: idx === data[0].length - 1 ? item.value.toString() : '',
  }));

  const chartData2 = data.length > 1 ? data[1].map((item, idx) => ({
    value: item.value,
    label: item.day.getDate().toString(),
  })) : [];

  const chartData3 = data.length > 2 ? data[2].map((item, idx) => ({
    value: item.value,
    label: item.day.getDate().toString(),
  })) : [];

  return (
    <View style={[styles.container, { height }]}>
      <LineChart
        data={chartData}
        data2={chartData2.length ? chartData2 : undefined}
        data3={chartData3.length ? chartData3 : undefined}
        width={CHART_WIDTH}
        color1={series[0]?.color || '#6366F1'}
        color2={series[1]?.color || '#10B981'}
        color3={series[2]?.color || '#F59E0B'}
        thickness={2}
        hideDataPoints={false}
        dataPointsColor1={series[0]?.color || '#6366F1'}
        dataPointsColor2={series[1]?.color || '#10B981'}
        dataPointsColor3={series[2]?.color || '#F59E0B'}
        dataPointsRadius={2}
        yAxisThickness={0}
        xAxisThickness={0}
        yAxisLabelWidth={28}
        hideRules
        yAxisTextStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}
        xAxisLabelTextStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}
        backgroundColor="transparent"
        curved
        areaChart
        startFillColor1={series[0]?.color ? `${series[0].color}40` : 'rgba(99,102,241,0.2)'}
        endFillColor1="rgba(99,102,241,0)"
        startFillColor2={series[1]?.color ? `${series[1].color}40` : 'rgba(16,185,129,0.2)'}
        endFillColor2="rgba(16,185,129,0)"
        startFillColor3={series[2]?.color ? `${series[2].color}40` : 'rgba(245,158,11,0.2)'}
        endFillColor3="rgba(245,158,11,0)"
      />
      
      <View style={styles.legend}>
        {series.map((s, idx) => (
          <View key={idx} style={styles.legendItem}>
            <View style={[styles.legendSwatch, { backgroundColor: s.color }]} />
            <Text style={styles.legendLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    flex: 1,
    overflow: 'hidden',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  }
});
