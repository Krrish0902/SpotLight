import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '../ui/Text';

export interface CohortData {
  cohort_week: Date;
  week_number: number;
  retained_pct: number;
}

export interface CohortGridProps {
  data: CohortData[];
}

export const CohortGrid: React.FC<CohortGridProps> = React.memo(({ data }) => {
  if (!data || data.length === 0) return null;

  // Group by cohort_week
  const cohortsMap = new Map<string, number[]>();
  data.forEach((d) => {
    // Basic formatting for YYYY-MM-DD to group them
    const key = d.cohort_week instanceof Date 
      ? d.cohort_week.toISOString().split('T')[0] 
      : String(d.cohort_week);
      
    if (!cohortsMap.has(key)) {
      cohortsMap.set(key, Array(8).fill(0));
    }
    const arr = cohortsMap.get(key)!;
    if (d.week_number >= 0 && d.week_number <= 7) {
      arr[d.week_number] = Number(d.retained_pct);
    }
  });

  const sortedKeys = Array.from(cohortsMap.keys()).sort((a, b) => b.localeCompare(a)); // Newest at top

  return (
    <ScrollView horizontal style={styles.container}>
      <View>
        <View style={styles.headerRow}>
          <Text style={styles.cohortLabelHeader}>Cohort</Text>
          {Array(8).fill(0).map((_, i) => (
            <Text key={i} style={styles.weekLabel}>W{i}</Text>
          ))}
        </View>

        {sortedKeys.map((key) => {
          const arr = cohortsMap.get(key)!;
          return (
            <View key={key} style={styles.row}>
              <Text style={styles.cohortLabel}>{key}</Text>
              {arr.map((val, idx) => {
                // Vibrant indigo for 100%, dark for 0%
                const opacity = Math.max(0.05, val / 100);
                return (
                  <View key={idx} style={[styles.cell, { backgroundColor: `rgba(99, 102, 241, ${opacity})` }]}>
                    <Text style={styles.cellText}>{val.toFixed(0)}%</Text>
                  </View>
                );
              })}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  cohortLabelHeader: {
    width: 100,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  weekLabel: {
    width: 45,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginHorizontal: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cohortLabel: {
    width: 100,
    color: '#fff',
    fontSize: 12,
  },
  cell: {
    width: 45,
    height: 30,
    marginHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  cellText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  }
});
