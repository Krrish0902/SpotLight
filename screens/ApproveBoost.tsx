import React from 'react';
import { View, Image, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Check, X } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const pendingBoosts = [
  { id: 1, artist: 'Maya Rivers', plan: 'Pro Boost', amount: '$49', image: 'photo-1493225457124-a3eb161ffa5f' },
  { id: 2, artist: 'DJ Eclipse', plan: 'Premium Boost', amount: '$89', image: 'photo-1571609572760-64c0cd10b5ca' },
];

interface Props { navigate: (screen: string) => void; }

export default function ApproveBoost({ navigate }: Props) {
  return (
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('admin-dashboard')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>Approve Boosts</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {pendingBoosts.map((b) => (
          <Card key={b.id} style={styles.boostCard}>
            <Image source={{ uri: `https://images.unsplash.com/${b.image}?w=200&h=200&fit=crop` }} style={styles.avatar} />
            <View style={styles.boostInfo}><Text style={styles.artistName}>{b.artist}</Text><Text style={styles.plan}>{b.plan} - {b.amount}</Text></View>
            <View style={styles.boostActions}>
              <Button variant="outline" size="sm" onPress={() => navigate('admin-dashboard')}><X size={16} color="#f87171" /></Button>
              <Button size="sm" style={styles.approveBtn} onPress={() => navigate('admin-dashboard')}><Check size={16} color="#fff" /></Button>
            </View>
          </Card>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  scroll: { padding: 24 },
  boostCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  boostInfo: { flex: 1, marginLeft: 16 },
  artistName: { color: '#fff', fontWeight: '600' },
  plan: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  boostActions: { flexDirection: 'row', gap: 8 },
  approveBtn: { backgroundColor: '#22c55e' },
});
