import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';

export interface GeoData {
  city: string;
  country_code: string;
  lat: number;
  lng: number;
  viewer_count: number;
  pct_of_total: number;
}

export interface ActivityBubbleMapProps {
  cities: GeoData[];
}

// Fallback implementation since react-native-maps requires native links
export const ActivityBubbleMap: React.FC<ActivityBubbleMapProps> = React.memo(({ cities }) => {
  if (!cities || cities.length === 0) return <Text style={styles.empty}>No location data available.</Text>;

  const topCities = cities.slice(0, 10);

  return (
    <View style={styles.container}>
      {topCities.map((cityGeom, idx) => (
        <View key={idx} style={styles.row}>
          <Text style={styles.rank}>{idx + 1}</Text>
          <View style={styles.content}>
            <View style={styles.labelRow}>
              <Text style={styles.city}>{cityGeom.city || 'Unknown'}</Text>
              <Text style={styles.count}>{cityGeom.viewer_count.toLocaleString()}</Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${cityGeom.pct_of_total}%` }]} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  empty: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rank: {
    width: 20,
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  city: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  count: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  barTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 2,
  }
});
