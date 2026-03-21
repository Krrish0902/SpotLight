import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { HeartHandshake } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface AttributionItem {
  content_id: string;
  content_title: string;
  follow_count: number;
  pct_of_total: number;
}

export function FollowAttributionCard({ data }: { data: AttributionItem[] }) {
  if (!data?.length) return null;

  return (
    <Animated.View entering={FadeInUp.delay(200).springify()}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <HeartHandshake size={16} color="#10b981" />
          </View>
          <Text style={styles.title}>Follow Attribution</Text>
        </View>

        <View style={styles.list}>
          {data.map((item, idx) => (
            <View key={item.content_id} style={styles.row}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{idx + 1}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.content_title}</Text>
                <Text style={styles.itemMeta}>{item.pct_of_total}% of new follows</Text>
              </View>
              <Text style={styles.count}>+{item.follow_count}</Text>
            </View>
          ))}
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#18181b', padding: 16, borderRadius: 12, borderColor: '#27272a', borderWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  iconContainer: { padding: 6, backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 8 },
  title: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  list: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rankBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#27272a', alignItems: 'center', justifyContent: 'center' },
  rankText: { color: '#a1a1aa', fontSize: 12, fontWeight: 'bold' },
  info: { flex: 1 },
  itemTitle: { color: '#fff', fontSize: 14, fontWeight: '500' },
  itemMeta: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
  count: { color: '#10b981', fontWeight: 'bold', fontSize: 14 },
});
