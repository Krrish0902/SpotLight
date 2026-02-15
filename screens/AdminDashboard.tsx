import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Video, Calendar, Trophy, DollarSign, TrendingUp, LogOut } from 'lucide-react-native';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../lib/auth-context';

interface Props { navigate: (screen: string) => void; }

export default function AdminDashboard({ navigate }: Props) {
  const { signOut } = useAuth();
  return (
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Admin Dashboard</Text>
            <Text style={styles.subtitle}>Manage your platform</Text>
          </View>
          <Button variant="outline" size="sm" onPress={async () => { await signOut(); navigate('public-home'); }} style={styles.signOutBtn}>
            <LogOut size={18} color="#fff" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Button>
        </View>

        <View style={styles.statsGrid}>
          <Card style={styles.statCardPurple}><Users size={32} color="#c084fc" /><Text style={styles.statNum}>1,234</Text><Text style={styles.statLabel}>Total Users</Text></Card>
          <Card style={styles.statCardPink}><Video size={32} color="#f472b6" /><Text style={styles.statNum}>3,456</Text><Text style={styles.statLabel}>Videos</Text></Card>
          <Card style={styles.statCardOrange}><Calendar size={32} color="#fb923c" /><Text style={styles.statNum}>567</Text><Text style={styles.statLabel}>Bookings</Text></Card>
          <Card style={styles.statCardGreen}><DollarSign size={32} color="#4ade80" /><Text style={styles.statNum}>$42.5K</Text><Text style={styles.statLabel}>Revenue</Text></Card>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Card style={styles.actionCard} onPress={() => navigate('moderate-content')}>
          <View style={styles.actionIcon}><Video size={24} color="#a855f7" /></View>
          <View style={styles.actionInfo}><Text style={styles.actionTitle}>Moderate Content</Text><Text style={styles.actionDesc}>Review pending videos</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>12</Text></View>
        </Card>
        <Card style={styles.actionCard} onPress={() => navigate('approve-boost')}>
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(236,72,153,0.2)' }]}><Trophy size={24} color="#f472b6" /></View>
          <View style={styles.actionInfo}><Text style={styles.actionTitle}>Approve Boosts</Text><Text style={styles.actionDesc}>Pending boost requests</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>5</Text></View>
        </Card>
        <Card style={styles.actionCard} onPress={() => navigate('manage-profiles')}>
          <View style={[styles.actionIcon, { backgroundColor: 'rgba(59,130,246,0.2)' }]}><Users size={24} color="#60a5fa" /></View>
          <View style={styles.actionInfo}><Text style={styles.actionTitle}>Manage Profiles</Text><Text style={styles.actionDesc}>User management</Text></View>
        </Card>

        <View style={styles.managementRow}>
          <Card style={styles.manageCard}>
            <Text style={styles.manageTitle}>Content & Events</Text>
            <Button variant="ghost" onPress={() => navigate('manage-contests')}><Trophy size={20} color="#facc15" /><Text style={styles.menuText}>Manage Contests</Text></Button>
            <Button variant="ghost" onPress={() => navigate('manage-live-events')}><Calendar size={20} color="#a855f7" /><Text style={styles.menuText}>Manage Live Events</Text></Button>
          </Card>
          <Card style={styles.manageCard}>
            <Text style={styles.manageTitle}>Recent Activity</Text>
            <View style={styles.activityItem}><View style={[styles.activityDot, { backgroundColor: '#4ade80' }]} /><Text style={styles.activityText}>New user registered</Text><Text style={styles.activityTime}>2m ago</Text></View>
          </Card>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  signOutBtn: { flexDirection: 'row', gap: 6, borderColor: 'rgba(255,255,255,0.3)' },
  signOutText: { color: '#fff', fontSize: 14 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  subtitle: { color: 'rgba(255,255,255,0.6)', marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
  statCard: { width: '47%' as const, padding: 24 },
  statCardPurple: { width: '47%' as const, padding: 24, backgroundColor: 'rgba(147,51,234,0.2)', borderColor: 'rgba(168,85,247,0.3)' },
  statCardPink: { width: '47%' as const, padding: 24, backgroundColor: 'rgba(219,39,119,0.2)', borderColor: 'rgba(236,72,153,0.3)' },
  statCardOrange: { width: '47%' as const, padding: 24, backgroundColor: 'rgba(249,115,22,0.2)', borderColor: 'rgba(251,146,60,0.3)' },
  statCardGreen: { width: '47%' as const, padding: 24, backgroundColor: 'rgba(34,197,94,0.2)', borderColor: 'rgba(74,222,128,0.3)' },
  statNum: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 12 },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  sectionTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 24, marginBottom: 12 },
  actionIcon: { width: 48, height: 48, borderRadius: 8, backgroundColor: 'rgba(168,85,247,0.2)', alignItems: 'center', justifyContent: 'center' },
  actionInfo: { flex: 1, marginLeft: 16 },
  actionTitle: { color: '#fff', fontWeight: '600' },
  actionDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  badge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f97316', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  managementRow: { flexDirection: 'row', gap: 16, marginTop: 24 },
  manageCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 24 },
  manageTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  menuText: { color: '#fff', marginLeft: 12 },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityText: { flex: 1, color: 'rgba(255,255,255,0.8)' },
  activityTime: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
});
