import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Sparkles, TrendingUp, Zap, Check } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const plans = [
  { id: 1, name: 'Basic Boost', duration: '7 Days', price: '$29', icon: Sparkles, popular: false },
  { id: 2, name: 'Pro Boost', duration: '14 Days', price: '$49', icon: TrendingUp, popular: true },
  { id: 3, name: 'Premium Boost', duration: '30 Days', price: '$89', icon: Zap, popular: false },
];

interface Props { navigate: (screen: string) => void; }

export default function PurchaseBoost({ navigate }: Props) {
  return (
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('artist-dashboard')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>Boost Your Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}><TrendingUp size={24} color="#a855f7" /><View><Text style={styles.infoTitle}>Get More Bookings</Text><Text style={styles.infoText}>Boost your visibility and reach more event organizers.</Text></View></View>
        </Card>

        {plans.map((p) => {
          const Icon = p.icon;
          return (
            <Card key={p.id} style={[styles.planCard, p.popular && styles.planCardPopular]}>
              {p.popular && <View style={styles.popularBar}><Text style={styles.popularText}>MOST POPULAR</Text></View>}
              <View style={[styles.planBody, p.popular && { paddingTop: 32 }]}>
                <View style={styles.planHeader}>
                  <View style={styles.planIcon}><Icon size={24} color="#fff" /></View>
                  <View style={styles.planInfo}><Text style={styles.planName}>{p.name}</Text><Text style={styles.planDur}>{p.duration}</Text></View>
                  <Text style={styles.planPrice}>{p.price}</Text>
                </View>
                <Button onPress={() => navigate('payment')} style={p.popular ? styles.selectBtnPrimary : styles.selectBtn}>
                  <Text style={styles.selectBtnText}>Select {p.name}</Text>
                </Button>
              </View>
            </Card>
          );
        })}

        <Card style={styles.statusCard}>
          <Text style={styles.statusTitle}>Current Status</Text>
          <View style={styles.statusRow}>
            <View><Text style={styles.statusLabel}>Active Boost</Text><Badge style={styles.statusBadge}>Pro Boost - 5 days left</Badge></View>
            <Button variant="outline" size="sm"><Text style={styles.renewText}>Renew</Text></Button>
          </View>
        </Card>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  scroll: { padding: 24 },
  infoCard: { backgroundColor: 'rgba(147,51,234,0.2)', borderColor: 'rgba(168,85,247,0.3)', padding: 16, marginBottom: 24 },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoTitle: { color: '#fff', fontWeight: '600', marginBottom: 4 },
  infoText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  planCard: { backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 16 },
  planCardPopular: { borderColor: 'rgba(168,85,247,0.5)' },
  popularBar: { backgroundColor: '#a855f7', paddingVertical: 4, alignItems: 'center' },
  popularText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  planBody: { padding: 24 },
  planHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  planIcon: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#a855f7', alignItems: 'center', justifyContent: 'center' },
  planInfo: { flex: 1, marginLeft: 12 },
  planName: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  planDur: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  planPrice: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  selectBtn: { backgroundColor: 'rgba(255,255,255,0.1)' },
  selectBtnPrimary: { backgroundColor: '#a855f7' },
  selectBtnText: { color: '#fff' },
  statusCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 24 },
  statusTitle: { color: '#fff', fontWeight: '600', marginBottom: 12 },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 4 },
  statusBadge: { backgroundColor: 'rgba(168,85,247,0.2)', borderWidth: 0 },
  renewText: { color: '#fff' },
});
