import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { UserCheck } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface DemoItem {
  value: string;
  count: number;
  pct: number;
}

interface AudienceDemographicsProps {
  ageData: DemoItem[];
  genderData: DemoItem[];
}

export function AudienceDemographicsCard({ ageData, genderData }: AudienceDemographicsProps) {
  const [activeTab, setActiveTab] = useState<'age' | 'gender'>('age');
  const data = activeTab === 'age' ? ageData : genderData;

  if (!ageData?.length && !genderData?.length) return null;

  return (
    <Animated.View entering={FadeInUp.delay(300).springify()}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.iconContainer}>
              <UserCheck size={16} color="#3b82f6" />
            </View>
            <Text style={styles.title}>Audience Demographics</Text>
          </View>
          <View style={styles.tabs}>
            <Pressable onPress={() => setActiveTab('age')} style={[styles.tab, activeTab === 'age' && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === 'age' && styles.activeTabText]}>Age</Text>
            </Pressable>
            <Pressable onPress={() => setActiveTab('gender')} style={[styles.tab, activeTab === 'gender' && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === 'gender' && styles.activeTabText]}>Gender</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.list}>
          {data.map((item) => (
            <View key={item.value} style={styles.row}>
              <Text style={styles.label}>{item.value}</Text>
              <View style={styles.barWrap}>
                <View style={[styles.bar, { width: `${item.pct}%` }]} />
              </View>
              <Text style={styles.pct}>{item.pct.toFixed(1)}%</Text>
            </View>
          ))}
          {data.length === 0 && (
             <Text style={styles.empty}>Not enough data to display.</Text>
          )}
        </View>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#18181b', padding: 16, borderRadius: 12, borderColor: '#27272a', borderWidth: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconContainer: { padding: 6, backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 8 },
  title: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  tabs: { flexDirection: 'row', backgroundColor: '#27272a', borderRadius: 8, padding: 2 },
  tab: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  activeTab: { backgroundColor: '#4c1d95' },
  tabText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '500' },
  activeTabText: { color: '#fff' },
  list: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { width: 80, color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  barWrap: { flex: 1, height: 8, backgroundColor: '#27272a', borderRadius: 4, overflow: 'hidden' },
  bar: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 4 },
  pct: { width: 44, color: '#fff', fontSize: 12, textAlign: 'right', fontWeight: '500' },
  empty: { color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingVertical: 12, fontSize: 13 }
});
