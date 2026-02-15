import React from 'react';
import { View, Image, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Calendar, MessageSquare, Video, Sparkles, Bell, Settings } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import BottomNav from '../components/layout/BottomNav';
import { useAuth } from '../lib/auth-context';

interface Props {
  navigate: (screen: string, data?: any) => void;
}

export default function ArtistDashboard({ navigate }: Props) {
  const { profile, appUser } = useAuth();
  const displayName = profile?.display_name ?? appUser?.email?.split('@')[0] ?? 'Artist';
  const genresStr = profile?.genres?.length ? profile.genres.join(' • ') : 'Artist';
  const isBoosted = profile?.is_boosted ?? false;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#030712', '#000']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Welcome back, {displayName}!</Text>
          </View>
          <View style={styles.headerBtns}>
            <Button variant="ghost" size="icon"><Bell size={24} color="#fff" /></Button>
            <Button variant="ghost" size="icon"><Settings size={24} color="#fff" /></Button>
          </View>
        </View>

        <Card style={styles.profileCard} onPress={() => navigate('artist-profile', { selectedArtist: { id: 'me', name: displayName, genre: genresStr } })}>
          <LinearGradient colors={['#9333ea', '#db2777']} style={styles.profileGradient}>
            <View style={styles.profileContent}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop' }} style={styles.avatar} />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{displayName}</Text>
                <Text style={styles.profileGenre}>{genresStr}</Text>
                {isBoosted && <Badge icon={<Sparkles size={12} color="#fff" />} style={styles.boostBadge}>Profile Boosted</Badge>}
              </View>
            </View>
            <Button variant="secondary" style={styles.viewProfileBtn}><Text style={styles.viewProfileText}>View Public Profile</Text></Button>
          </LinearGradient>
        </Card>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(59,130,246,0.2)' }]}><TrendingUp size={20} color="#60a5fa" /></View>
              <Text style={styles.statLabel}>Profile Views</Text>
            </View>
            <Text style={styles.statValue}>2,847</Text>
            <Text style={styles.statChange}>+12% this week</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statHeader}>
              <View style={[styles.statIcon, { backgroundColor: 'rgba(168,85,247,0.2)' }]}><MessageSquare size={20} color="#c084fc" /></View>
              <Text style={styles.statLabel}>Booking Requests</Text>
            </View>
            <Text style={styles.statValue}>5</Text>
            <Text style={[styles.statChange, { color: '#fb923c' }]}>2 pending</Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <Button onPress={() => navigate('upload-video')} style={[styles.actionBtn, { backgroundColor: '#7e22ce' }]}>
            <Video size={32} color="#fff" />
            <Text style={styles.actionText}>Upload Video</Text>
          </Button>
          <Button onPress={() => navigate('manage-availability')} style={[styles.actionBtn, { backgroundColor: '#be185d' }]}>
            <Calendar size={32} color="#fff" />
            <Text style={styles.actionText}>Manage Availability</Text>
          </Button>
          <Button onPress={() => navigate('submit-to-contest')} style={[styles.actionBtn, { backgroundColor: '#c2410c' }]}>
            <Sparkles size={32} color="#fff" />
            <Text style={styles.actionText}>Submit to Contest</Text>
          </Button>
          <Button onPress={() => navigate('purchase-boost')} style={[styles.actionBtn, { backgroundColor: '#a16207' }]}>
            <TrendingUp size={32} color="#fff" />
            <Text style={styles.actionText}>Boost Profile</Text>
          </Button>
        </View>

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Card style={styles.activityCard}>
          <View style={styles.activityItem}>
            <View style={[styles.activityDot, { backgroundColor: '#4ade80' }]} />
            <Text style={styles.activityText}>New booking request from Summer Festival</Text>
            <Text style={styles.activityTime}>2h ago</Text>
          </View>
          <View style={styles.activityItem}>
            <View style={[styles.activityDot, { backgroundColor: '#60a5fa' }]} />
            <Text style={styles.activityText}>Your video got 234 new views</Text>
            <Text style={styles.activityTime}>5h ago</Text>
          </View>
          <View style={styles.activityItem}>
            <View style={[styles.activityDot, { backgroundColor: '#c084fc' }]} />
            <Text style={styles.activityText}>Profile boost activated</Text>
            <Text style={styles.activityTime}>1d ago</Text>
          </View>
        </Card>
        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNav activeTab="home" navigate={navigate} userRole="artist" isAuthenticated />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  headerBtns: { flexDirection: 'row', gap: 8 },
  profileCard: { borderWidth: 0, overflow: 'hidden', marginBottom: 24 },
  profileGradient: { padding: 24 },
  profileContent: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: 'rgba(255,255,255,0.2)' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  profileGenre: { color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  boostBadge: { backgroundColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignSelf: 'flex-start' },
  viewProfileBtn: { backgroundColor: 'rgba(255,255,255,0.2)' },
  viewProfileText: { color: '#fff' },
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 16 },
  statHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  statIcon: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  statChange: { color: '#4ade80', fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  actionBtn: { width: '47%', paddingVertical: 24, alignItems: 'center', gap: 12 },
  actionText: { color: '#fff', fontSize: 14 },
  activityCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16 },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityText: { flex: 1, color: '#fff', fontSize: 14 },
  activityTime: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
});
