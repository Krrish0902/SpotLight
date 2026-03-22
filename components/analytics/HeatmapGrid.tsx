import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';

export interface HeatmapData {
  hour: number;
  dow: number;
  avg_events: number;
}

export interface HeatmapGridProps {
  data: HeatmapData[];
  maxValue?: number;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIME_LABELS = ['12a', '6a', '12p', '6p', '11p'];
const TIME_POSITIONS = [0, 6, 12, 18, 23];

function cellColor(intensity: number): string {
  if (intensity <= 0.04) return 'rgba(255,255,255,0.04)';
  if (intensity < 0.25) return `rgba(79,70,229,${0.18 + intensity * 0.5})`;
  if (intensity < 0.55) return `rgba(124,58,237,${0.35 + intensity * 0.45})`;
  if (intensity < 0.8)  return `rgba(192,38,211,${0.55 + intensity * 0.3})`;
  return `rgba(236,72,153,${0.75 + intensity * 0.25})`;
}

export const HeatmapGrid: React.FC<HeatmapGridProps> = React.memo(({ data, maxValue }) => {
  const max = useMemo(() => {
    if (maxValue) return maxValue;
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map(d => d.avg_events), 1);
  }, [data, maxValue]);

  const grid = useMemo(() => {
    const cells = Array(7).fill(0).map(() => Array(24).fill(0));
    data.forEach(d => {
      if (d.dow >= 0 && d.dow <= 6 && d.hour >= 0 && d.hour <= 23) {
        cells[d.dow][d.hour] = d.avg_events;
      }
    });
    return cells;
  }, [data]);

  return (
    <View style={styles.wrapper}>
      <View style={styles.yAxis}>
        {DAYS.map(d => (
          <Text key={d} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>

      <View style={styles.gridArea}>
        {grid.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.row}>
            {row.map((val, colIdx) => {
              const intensity = max > 0 ? val / max : 0;
              return (
                <View
                  key={colIdx}
                  style={[styles.cell, { backgroundColor: cellColor(intensity) }]}
                />
              );
            })}
          </View>
        ))}

        {/* X-axis labels */}
        <View style={styles.xAxis}>
          {TIME_LABELS.map((label, i) => (
            <Text
              key={label}
              style={[styles.xLabel, { position: 'absolute', left: `${(TIME_POSITIONS[i] / 23) * 100}%` as any }]}
            >
              {label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
});

const CELL_H = 14;
const CELL_GAP = 2;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 22,
  },
  yAxis: {
    width: 26,
    gap: CELL_GAP,
    marginRight: 6,
    paddingTop: 1,
  },
  dayLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    height: CELL_H,
    lineHeight: CELL_H,
  },
  gridArea: {
    flex: 1,
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    gap: CELL_GAP,
    marginBottom: CELL_GAP,
  },
  cell: {
    flex: 1,
    height: CELL_H,
    borderRadius: 3,
  },
  xAxis: {
    position: 'relative',
    height: 16,
    marginTop: 5,
  },
  xLabel: {
    color: 'rgba(255,255,255,0.28)',
    fontSize: 9,
    fontWeight: '500',
  },
});
